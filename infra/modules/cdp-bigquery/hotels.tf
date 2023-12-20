resource "google_storage_bucket" "configurations_bucket" {
  project  = var.project_id
  name     = "configurations_omena_asdfas_${var.environment}"
  location = "EU"
}

resource "google_storage_bucket_object" "hotels_configs_object" {
  name   = "hotels.csv"
  source = "./hotels.csv"
  bucket = google_storage_bucket.configurations_bucket.name
}

resource "google_bigquery_table" "hotels_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "hotels"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "id",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "ID"
      },
      {
        "name" : "label",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Hotel label"
      },
      {
        "name" : "name",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Hotel name"
      },
      {
        "name" : "rooms",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Number of rooms in hotel"
      }
  ])
}

resource "google_bigquery_job" "load_hotels_job" {
  project  = var.project_id
  job_id   = "load_hotels_job_6"
  location = "EU"

  load {
    source_uris = [
      "gs://${google_storage_bucket.configurations_bucket.name}/${google_storage_bucket_object.hotels_configs_object.name}"
    ]

    destination_table {
      project_id = google_bigquery_table.hotels_table.project
      dataset_id = google_bigquery_table.hotels_table.dataset_id
      table_id   = google_bigquery_table.hotels_table.table_id
    }

    write_disposition = "WRITE_TRUNCATE"
    autodetect        = false
  }
}


resource "google_bigquery_table" "hotel_metrics_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "hotelMetrics"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "created",
        "type" : "DATE",
        "mode" : "REQUIRED",
        "description" : "Date of metric creation"
      },
      {
        "name" : "date",
        "type" : "DATE",
        "mode" : "REQUIRED",
        "description" : "Date of metrics"
      },
      {
        "name" : "label",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Hotel label"
      },
      {
        "name" : "customerType",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Type of customer (Normal, Business, Group)"
      },
      {
        "name" : "allocation",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Number of rooms allocated"
      },
      {
        "name" : "revenue",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Amount of revenue from allocations"
      },
  ])
}


resource "google_bigquery_table" "hotel_derived_metrics_table" {
  depends_on          = [google_bigquery_routine.map_voucher_category_reservations_routine, google_bigquery_routine.map_voucher_category_routine]
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "hotelDerivedMetrics"
  deletion_protection = false
  view {
    query          = <<EOF
WITH hotels AS (
  SELECT * FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.hotels`
),
dailyMetrics AS (
  SELECT created, date, customerType, label, SUM(allocation) as allocation FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.hotelMetrics` GROUP BY created, date, customerType, label
)
SELECT created, date, hm.label as label, customerType, hotels.rooms as rooms,
  revenue,
  (allocation / hotels.rooms) as occupancy,
  (revenue / (SELECT allocation FROM dailyMetrics WHERE date=hm.date AND customerType=hm.customerType AND label=hm.label AND created=hm.created)) as adr,
  ((allocation / hotels.rooms) * (revenue / (SELECT allocation FROM dailyMetrics WHERE date=hm.date AND customerType=hm.customerType AND label=hm.label AND created=hm.created))) as revbar
  FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.hotelMetrics` as hm, hotels WHERE hotels.label = hm.label
EOF
    use_legacy_sql = false
  }
}

resource "google_pubsub_topic" "function_trigger_hotel_metrics_pubsub" {
  name    = "trigger-hotel-metrics-pubsub"
  project = var.project_id

  message_storage_policy {
    allowed_persistence_regions = [
      "europe-west1",
    ]
  }
}

resource "google_cloud_scheduler_job" "hotel_metrics_create_scheduler" {
  project     = var.project_id
  region      = "europe-west1"
  name        = "trigger-hotel-metrics-pubsub"
  description = "Run hotel metrics creation"
  schedule    = "0 9 * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.function_trigger_hotel_metrics_pubsub.id
    data       = base64encode("notused")
  }
}
