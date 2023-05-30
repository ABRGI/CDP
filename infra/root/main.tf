locals {
  billing_account_id = "XXXXXXXXX"
}

resource "google_project" "project" {
  name            = "Omena CDP Terraform"
  project_id      = "omena-cdp-terraform-infra"
  billing_account = local.billing_account_id
}

provider "google" {
  project = google_project.project.project_id
  region  = "europe-north1" // Finland, Hamina
}

terraform {
  backend "gcs" {
    bucket = "omena-cdp-terraform-infra"
    prefix = "terraform/state"
  }
}

resource "google_storage_bucket" "terraform_development_omena_cdp_state" {
  project  = google_project.project.project_id
  name     = "omena-cdp-terraform-development"
  location = "EU"
}

resource "google_storage_bucket" "terraform_production_omena_cdp_state" {
  project  = google_project.project.project_id
  name     = "omena-cdp-terraform-production"
  location = "EU"
}
