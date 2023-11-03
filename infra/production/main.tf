locals {
  terraform_project_id = "cdp-terraform"
  project_id           = "omena-cdp-production"
  folder_id            = "270001817437"
  billing_account_id   = "018369-6F0E74-2CB7D9"
  region               = "europe-north1"
}

provider "google" {
  project = local.terraform_project_id
  region  = local.region // Finland, Hamina
}

terraform {
  backend "gcs" {
    bucket = "cdp-state-production"
    prefix = "terraform/state/development"
  }
}

resource "google_project" "project" {
  name            = "Omena CDP production"
  project_id      = local.project_id
  folder_id       = local.folder_id
  billing_account = local.billing_account_id
}

module "project_basics" {
  source     = "../modules/cdp-project"
  project_id = google_project.project.project_id
}

module "bigquery_datasets" {
  source     = "../modules/cdp-bigquery"
  project_id = google_project.project.project_id
}
