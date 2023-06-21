resource "google_project_service" "project_bigquery_api_service" {
  project = var.project_id
  service = "bigquery.googleapis.com"

  disable_dependent_services = true
}
