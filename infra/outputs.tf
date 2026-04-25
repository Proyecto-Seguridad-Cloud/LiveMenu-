output "images_bucket" {
  description = "GCS bucket for images"
  value       = google_storage_bucket.images.name
}

output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.backend.status[0].url
}

output "sql_instance_connection_name" {
  description = "Instance connection name for Cloud SQL (use for connection / proxy)"
  value       = google_sql_database_instance.postgres.connection_name
}
