resource "google_project_service" "project_bigquery_api_service" {
  project = var.project_id
  service = "bigquery.googleapis.com"

  disable_dependent_services = true
}

resource "google_project_service" "project_cloudscheduler_api_service" {
  project = var.project_id
  service = "cloudscheduler.googleapis.com"

  disable_dependent_services = true
}

resource "google_service_account" "bigquery_service_account" {
  project      = var.project_id
  account_id   = "nelson"
  display_name = "Big Query transfer service account"
}

resource "google_project_iam_member" "cloudfunction_invoker" {
  project = var.project_id
  role    = "roles/cloudfunctions.invoker"
  member  = "serviceAccount:${google_service_account.bigquery_service_account.email}"
}
