resource "google_bigquery_table" "interests_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "customerInterests"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "email",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Email of the responder"
      },
      {
        "name" : "createdAt",
        "type" : "DATETIME",
        "mode" : "REQUIRED"
      },
      {
        "name" : "happenings",
        "type" : "STRING",
        "mode" : "REPEATED",
        "description" : "Happening interests"
      },
      {
        "name" : "places",
        "type" : "STRING",
        "mode" : "REPEATED",
        "description" : "Places of interest"
      },
      {
        "name" : "values",
        "type" : "STRING",
        "mode" : "REPEATED",
        "description" : "Important values"
      },
      {
        "name" : "hotelServices",
        "type" : "STRING",
        "mode" : "REPEATED",
        "description" : "Important hotel services"
      },
      {
        "name" : "firstName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "First name of the responder"
      },
      {
        "name" : "browser",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Browser of the responder"
      }
  ])
}
