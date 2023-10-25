resource "google_bigquery_table" "waiting_reservations_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "waitingReservations"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "id",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Reservation ID"
      },
      {
        "name" : "guestIds",
        "mode" : "REPEATED",
        "type" : "INT64"
      },
      {
        "name" : "updated",
        "type" : "TIMESTAMP",
        "mode" : "REQUIRED",
        "description" : "Time of row updated"
      },
  ])
}
