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
  job_id   = "load_hotels_job_4"
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

