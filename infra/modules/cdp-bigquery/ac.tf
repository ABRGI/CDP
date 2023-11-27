resource "google_bigquery_table" "ac_contacts" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "acContacts"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "contactId",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Active campaign contact ID"
      },
      {
        "name" : "customerId",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Identifier of the customer profile"
      },
      {
        "name" : "value",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Synchronized value (JSON string)"
      },
      {
        "name" : "updated",
        "type" : "TIMESTAMP",
        "mode" : "REQUIRED",
        "description" : "Time of latest synchronization"
      }
  ])
}

resource "google_pubsub_topic" "function_trigger_ac_sync_pubsub" {
  name    = "trigger-ac-sync-pubsub"
  project = var.project_id

  message_storage_policy {
    allowed_persistence_regions = [
      "europe-west1",
    ]
  }
}

resource "google_cloud_scheduler_job" "ac_sync_scheduler" {
  project     = var.project_id
  region      = "europe-west1"
  name        = "ac-sync-scheduler-job"
  description = "Run Active Campaign synchronization"
  schedule    = "0 0,4,8,12,16,20 * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.function_trigger_ac_sync_pubsub.id
    data       = base64encode("notused")
  }
}
