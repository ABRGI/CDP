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


