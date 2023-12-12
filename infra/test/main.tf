locals {
  terraform_project_id = "cdp-terraform"
  project_id           = "omena-cdp-test"
  folder_id            = "560411442354"
  billing_account_id   = "018369-6F0E74-2CB7D9"
  region               = "europe-north1"
}

provider "google" {
  project = local.terraform_project_id
  region  = local.region // Finland, Hamina
}

terraform {
  backend "gcs" {
    bucket = "cdp-state-test"
    prefix = "terraform/state/development"
  }
}

resource "google_project" "project" {
  name            = "Omena CDP test"
  project_id      = local.project_id
  folder_id       = local.folder_id
  billing_account = local.billing_account_id
}

module "project_basics" {
  source     = "../modules/cdp-project"
  project_id = google_project.project.project_id
}


module "bigquery_datasets" {
  source      = "../modules/cdp-bigquery"
  environment = "test"
  project_id  = google_project.project.project_id
}
