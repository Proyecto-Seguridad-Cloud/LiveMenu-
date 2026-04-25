# Infra / Deployment (GCP) — Terraform skeleton

This folder contains a Terraform skeleton to deploy the barebones resources used in the course assignment. It is a template (not safe to `apply` as-is). Follow the instructions below.

Prerequisites
- Install Terraform >= 1.3
- Have a GCP project and a service account or Application Default Credentials configured locally

Quick steps (development):

1. Configure variables (example):

```bash
export TF_VAR_project_id=your-gcp-project-id
export TF_VAR_region=us-central1
export TF_VAR_backend_image=gcr.io/your-gcp-project-id/livemenu-backend:latest
```

2. Initialize and plan:

```bash
cd infra
terraform init
terraform plan
```

3. Apply (ONLY when ready and after reviewing costs):

```bash
terraform apply
```

Notes & next steps
- The `google_cloud_run_service` here is a minimal skeleton; in production you must configure IAM, a domain mapping, HTTPS certificate (managed by Cloud Run or via Load Balancer), and use a proper service account with least privilege.
- The `google_sql_database_instance` here uses simple settings; for HA choose `availability_type = "REGIONAL"` and configure backups and automated maintenance windows.
- Secrets should be provisioned in `google_secret_manager_secret` with secure values injected via CI/CD rather than stored in Terraform state (use `secretmanager_secret_version` with values provided from CI or use the `google_secret_manager_secret_iam_*` bindings).
- For DB connectivity from Cloud Run prefer Cloud SQL Auth Proxy or serverless VPC connector to keep credentials out of the image.
