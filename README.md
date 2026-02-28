# LiveMenu

Backend de gestión de menú digital con FastAPI, PostgreSQL y procesamiento de imágenes.

## 1) Requisitos

- Docker Desktop activo.
- PowerShell (Windows) o terminal equivalente.
- Ejecutar comandos desde la raíz del proyecto (donde está `docker-compose.yml`).

## 2) Configuración inicial

1. Crear archivo de entorno local:

```powershell
Copy-Item .env.example .env
```

2. Generar secreto JWT y pegarlo en `.env`:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

3. Levantar servicios:

```powershell
docker compose up --build -d
```

4. Ejecutar migraciones:

```powershell
docker compose exec backend alembic upgrade head
```

5. Verificar backend:

- Health: `http://localhost:8000/health`
- Swagger/OpenAPI: `http://localhost:8000/docs`

## 3) Variables de entorno (`.env`)

Estas variables están definidas en `.env.example` y son usadas por el backend:

### Base de datos

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_HOST`
- `DB_PORT`

### Seguridad

- `JWT_SECRET_KEY` (obligatorio, no dejar vacío)
- `JWT_ALGORITHM` (default: `HS256`)

### Upload y procesamiento de imágenes

- `STORAGE_PROVIDER` (`local` o `gcs`)
- `UPLOAD_DIR` (default: `uploads`)
- `IMAGE_MAX_SIZE_MB` (default: `5`)
- `IMAGE_WORKERS` (default: `2`)
- `PUBLIC_BASE_URL` (default local: `http://localhost:8000`)

### GCS (solo cuando `STORAGE_PROVIDER=gcs`)

- `GCS_BUCKET_NAME`
- `GCS_PROJECT_ID`
- `GCS_CREDENTIALS_FILE`
- `GCS_PUBLIC_BASE_URL` (default: `https://storage.googleapis.com`)

## 4) Modo local vs modo GCS

### A) Modo local (desarrollo rápido)

En `.env`:

```dotenv
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:8000
```

Resultado: las imágenes se guardan en el filesystem del backend y se sirven por `/uploads`.

### B) Modo GCS (cloud)

En `.env`:

```dotenv
STORAGE_PROVIDER=gcs
GCS_BUCKET_NAME=tu-bucket
GCS_PROJECT_ID=tu-project-id
GCS_CREDENTIALS_FILE=/run/secrets/livemenu-gcs.json
GCS_PUBLIC_BASE_URL=https://storage.googleapis.com
```

Además, el contenedor backend debe tener montado el JSON de credenciales en la misma ruta indicada en `GCS_CREDENTIALS_FILE`.

Ejemplo de volumen en `docker-compose.yml`:

```yaml
- C:/ruta-local/livemenu-gcs.json:/run/secrets/livemenu-gcs.json:ro
```

### Recomendación para trabajo en equipo

- Mantener `docker-compose.yml` genérico.
- Cada integrante puede usar `docker-compose.override.yml` local (no versionado) para su ruta de credenciales.

## 5) Comandos operativos útiles

### Levantar y estado

```powershell
docker compose up --build -d
docker compose ps
```

### Logs

```powershell
docker compose logs -f backend
docker compose logs -f livemenuDB
```

### Reinicio / apagado

```powershell
docker compose restart backend
docker compose down
docker compose down -v
```

`docker compose down -v` elimina volúmenes de PostgreSQL (resetea datos locales).

### Migraciones

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic history
```

## 6) Pruebas y cobertura

### Ejecutar pruebas

```powershell
docker compose exec backend pytest -q
```

### Cobertura global (backend completo)

```powershell
docker compose exec backend pytest --cov=app --cov-report=term-missing -q
```

### Cobertura mínima obligatoria (falla si baja de 60%)

```powershell
docker compose exec backend pytest --cov=app --cov-report=term-missing --cov-fail-under=60 -q
```

### Cobertura por alcance repositorios/servicios

```powershell
docker compose exec backend pytest -q \
	--cov=app.repositories.user_repository \
	--cov=app.services.auth_service \
	--cov=app.repositories.restaurant_repository \
	--cov=app.services.restaurant_service \
	--cov=app.repositories.category_repository \
	--cov=app.services.category_service \
	--cov=app.repositories.dish_repository \
	--cov=app.services.dish_service \
	--cov=app.services.upload_service \
	--cov=app.services.storage_provider \
	--cov=app.services.image_worker_pool \
	--cov-report=term-missing \
	--cov-fail-under=60
```

## 7) Seguridad y buenas prácticas

- No subir `.env` al repositorio.
- No subir credenciales GCP (`*.json`).
- Subir únicamente `.env.example` con placeholders.
- Si una credencial se expone accidentalmente, rotarla de inmediato.

## 8) Problemas frecuentes

### El backend no conecta a DB

- Verificar que `livemenuDB` esté `healthy` con `docker compose ps`.
- Confirmar `DB_HOST=livemenuDB` en `.env`.

### Error de tablas faltantes

- Ejecutar migraciones: `docker compose exec backend alembic upgrade head`.

### Upload en GCS falla por credenciales

- Confirmar ruta montada en volumen y coincidencia con `GCS_CREDENTIALS_FILE`.
- Verificar permisos de la service account sobre el bucket.

## 9) Estado actual del proyecto

- Backend operativo con arquitectura por capas (Handler → Service → Repository).
- Pruebas de repositorios/servicios implementadas y cobertura validada sobre el mínimo requerido.
- Frontend pendiente de implementación en esta branch.

