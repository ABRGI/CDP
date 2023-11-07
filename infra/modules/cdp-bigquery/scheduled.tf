resource "google_pubsub_topic" "function_trigger_fetch_pubsub" {
  name    = "trigger-fetch-pubsub"
  project = var.project_id

  message_storage_policy {
    allowed_persistence_regions = [
      "europe-west1",
    ]
  }
}
/*
resource "google_cloud_scheduler_job" "fetch_reservations_scheduler" {
  project     = var.project_id
  region      = "europe-west1"
  name        = "fetch-reservations-scheduler-job"
  description = "Fetch waiting Nelson reservations"
  schedule    = "0,20,40 * * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.function_trigger_fetch_pubsub.id
    data       = base64encode("notused")
  }
}
*/
resource "google_pubsub_topic" "function_trigger_merge_pubsub" {
  name    = "trigger-merge-pubsub"
  project = var.project_id

  message_storage_policy {
    allowed_persistence_regions = [
      "europe-west1",
    ]
  }
}
/*
resource "google_cloud_scheduler_job" "merge_reservations_scheduler" {
  project     = var.project_id
  region      = "europe-west1"
  name        = "merge-reservations-scheduler-job"
  description = "Merge new reservations to profiles"
  schedule    = "30 8,12,16,20 * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.function_trigger_merge_pubsub.id
    data       = base64encode("notused")
  }
}
*/
