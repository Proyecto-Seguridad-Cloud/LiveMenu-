variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "region" {
  description = "GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "backend_image" {
  description = "Container image for the backend (e.g. gcr.io/<proj>/backend:tag)"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "livemenu"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "livemenu"
}
