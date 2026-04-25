/*
  Minimal GCP infra skeleton for the assignment.
  This file is a template and uses variables. Do NOT apply without setting
  credentials and real values for `var.project_id` and `var.backend_image`.
*/

resource "google_storage_bucket" "images" {
  name                        = "${var.project_id}-livemenu-images"
  location                    = var.region
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 365
    }
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "livemenu-sql"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-f1-micro"

    backup_configuration {
      enabled = true
      start_time = "03:00"
    }

    availability_type = "ZONAL"
  }
}

resource "google_sql_database" "db" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "livemenu-jwt-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_version" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = "REPLACE_WITH_REAL_SECRET_VALUE"
}

/* Cloud Run service skeleton. This is a minimal example. Configure IAM and domain later. */
resource "google_cloud_run_service" "backend" {
  name     = "livemenu-backend"
  location = var.region

  template {
    spec {
      containers {
        image = var.backend_image
        env {
          name  = "DB_NAME"
          value = var.db_name
        }
        env {
          name  = "JWT_SECRET_NAME"
          value = google_secret_manager_secret.jwt_secret.secret_id
        }
      }
    }
  }

  traffics {
    percent         = 100
    latest_revision = true
  }
}
