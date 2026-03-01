# LiveMenu

## Información del equipo

- **Número de grupo:** `6`
- **Integrantes:**
	- `Alejandro Hoyos` 
	- `Santiago Pineda`
	- `Rafel Guzman`
	- `Ximena López`

Sistema para gestión de menú digital con:

- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Frontend: React + TypeScript + Vite
- Infra local: Docker Compose

## Tabla de contenido

1. [Requisitos](#requisitos)
2. [Inicio rápido (Docker)](#inicio-rápido-docker)
3. [Variables de entorno (.env)](#variables-de-entorno-env)
4. [Dockerización y servicios](#dockerización-y-servicios)
5. [Ejecución sin Docker (opcional)](#ejecución-sin-docker-opcional)
6. [Pruebas backend](#pruebas-backend)
7. [Comandos útiles](#comandos-útiles)
8. [Documentación técnica (Backend y Frontend)](#documentación-técnica-backend-y-frontend)
9. [Troubleshooting](#troubleshooting)
10. [Buenas prácticas de seguridad](#buenas-prácticas-de-seguridad)

## Requisitos

- Docker Desktop activo.
- PowerShell (Windows) o terminal equivalente.
- Ejecutar comandos desde la raíz del proyecto (donde está `docker-compose.yml`).

## Inicio rápido (Docker)

1) Crear el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

2) Generar `JWT_SECRET_KEY` y pegarlo en `.env`:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

3) Levantar toda la plataforma:

```powershell
docker compose up --build -d
```

4) Ejecutar migraciones (si aplica):

```powershell
docker compose exec backend alembic upgrade head
```

5) Verificar accesos:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Variables de entorno (.env)

### Variables backend

```dotenv
DB_USER=livemenu
DB_PASSWORD=livemenu
DB_NAME=livemenu
DB_HOST=livemenuDB
DB_PORT=5432

JWT_SECRET_KEY=
JWT_ALGORITHM=HS256

STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
IMAGE_MAX_SIZE_MB=5
IMAGE_WORKERS=2
PUBLIC_BASE_URL=http://localhost:8000

CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
MENU_CACHE_TTL_SECONDS=10

GCS_BUCKET_NAME=
GCS_PROJECT_ID=
GCS_CREDENTIALS_FILE=
GCS_PUBLIC_BASE_URL=https://storage.googleapis.com
```

### Variables frontend (Vite)

Estas variables también se configuran en el `.env` raíz:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=frontend
```

## Dockerización y servicios

`docker-compose.yml` levanta:

- `livemenuDB`: PostgreSQL (`5432`)
- `backend`: FastAPI (`8000`)
- `frontend`: Vite dev server (`5173`)

### Comandos base Docker

Levantar/reconstruir:

```powershell
docker compose up --build -d
```

Estado:

```powershell
docker compose ps
```

Logs en vivo:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f livemenuDB
```

Reiniciar un servicio puntual:

```powershell
docker compose restart backend
docker compose restart frontend
```

Apagar servicios:

```powershell
docker compose down
```

Apagar y limpiar volúmenes (borra data local de PostgreSQL):

```powershell
docker compose down -v
```

### Migraciones Alembic

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic history
```

### Storage: local vs GCS

Modo local (rápido para desarrollo):

```dotenv
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:8000
```

Modo GCS:

```dotenv
STORAGE_PROVIDER=gcs
GCS_BUCKET_NAME=tu-bucket
GCS_PROJECT_ID=tu-project-id
GCS_CREDENTIALS_FILE=/run/secrets/livemenu-gcs.json
GCS_PUBLIC_BASE_URL=https://storage.googleapis.com
```

Si usas GCS, monta credenciales en `docker-compose.yml`:

```yaml
- C:/ruta-local/livemenu-gcs.json:/run/secrets/livemenu-gcs.json:ro
```

## Ejecución sin Docker (opcional)

### Backend

```powershell
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Pruebas backend

Ejecutar todo el suite:

```powershell
docker compose exec backend pytest -q
```

Solo repositorios y servicios (recomendado para revisión rápida):

```powershell
docker compose exec backend pytest -q tests -k "repository or service"
```

Cobertura global:

```powershell
docker compose exec backend pytest --cov=app --cov-report=term-missing -q
```

Cobertura con umbral mínimo:

```powershell
docker compose exec backend pytest --cov=app --cov-report=term-missing --cov-fail-under=60 -q
```

### Solo tests de repositorios y servicios

Ejecutar únicamente repositorios/servicios (rápido):

```powershell
docker compose exec backend pytest -q tests -k "repository or service"
```

Ejecutar por patrón de archivos (`*_repository.py` y `*_service.py`):

```powershell
docker compose exec backend pytest -q tests/test_*_repository.py tests/test_*_service.py
```

Cobertura solo para repositorios y servicios:

```powershell
docker compose exec backend pytest -q tests -k "repository or service" --cov=app.repositories --cov=app.services --cov-report=term-missing
```

### Revisar cobertura baja en `storage_provider`

Ejecutar tests específicos del storage provider con cobertura dedicada:

```powershell
docker compose exec backend pytest -q tests/test_storage_provider_local.py --cov=app.services.storage_provider --cov-report=term-missing
```

Generar reporte HTML para revisar líneas faltantes (abre en navegador):

```powershell
docker compose exec backend pytest -q tests/test_storage_provider_local.py --cov=app.services.storage_provider --cov-report=html
```

Copiar el reporte fuera del contenedor (opcional):

```powershell
docker compose cp backend:/app/htmlcov ./backend/htmlcov
```

Tip: si `storage_provider` sigue alrededor de 37%, normalmente faltan rutas de `GCSStorageProvider` (inicialización, `save`, `delete_by_prefix`, `list_images`) y errores de configuración.

## Comandos útiles

Validar salud backend:

```powershell
Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing
```

Ver título de migración actual:

```powershell
docker compose exec backend alembic current
```

Reconstruir solo backend/frontend:

```powershell
docker compose up -d --build backend frontend
```

## Documentación técnica (Backend y Frontend)

### Backend: tecnologías y responsabilidades

- **FastAPI**: framework principal de la API REST.
- **Uvicorn**: servidor ASGI para ejecución del backend.
- **SQLAlchemy (async)**: ORM y acceso a base de datos.
- **Alembic**: control de versiones y migraciones de esquema.
- **PostgreSQL + asyncpg**: persistencia de datos.
- **Pydantic + pydantic-settings**: validación de esquemas y configuración por entorno.
- **PyJWT + bcrypt**: autenticación JWT y hash seguro de contraseñas.
- **SlowAPI**: rate limiting.
- **python-multipart + Pillow**: subida/procesamiento de imágenes.
- **google-cloud-storage**: integración de storage en GCS.
- **qrcode**: generación de códigos QR.
- **Pytest + pytest-asyncio + pytest-cov**: pruebas y cobertura.

### Backend: arquitectura por capas

- `handlers/`: entrada HTTP (routes/controladores).
- `services/`: reglas de negocio.
- `repositories/`: acceso a datos.
- `models/`: entidades SQLAlchemy.
- `schemas/`: contratos de entrada/salida (Pydantic).
- `core/`: seguridad y configuración.
- `db/`: engine, sesión y base declarativa.

### Frontend: tecnologías y responsabilidades

- **React 19 + TypeScript**: base de interfaz y tipado estático.
- **Vite**: bundler/dev server.
- **React Router**: navegación de la aplicación.
- **React Hook Form**: manejo de formularios.
- **Tailwind CSS + tw-animate-css**: estilos utilitarios y animaciones.
- **Radix UI + CVA + tailwind-merge + clsx**: componentes, variantes y composición de clases.
- **Sonner**: notificaciones toast.
- **lucide-react**: iconografía.
- **qrcode.react**: renderizado de QR en UI.
- **dnd-kit**: drag-and-drop para ordenamiento interactivo.

### Frontend: organización funcional

- `pages/`: pantallas (admin, auth, pública).
- `layouts/`: estructura base de vistas.
- `components/ui/`: componentes reutilizables.
- `services/`: consumo de API.
- `context/`: estado compartido global (auth).
- `types/`: tipados de dominio y respuestas.

### Enlaces de referencia oficial

- FastAPI: `https://fastapi.tiangolo.com/`
- SQLAlchemy: `https://docs.sqlalchemy.org/`
- Alembic: `https://alembic.sqlalchemy.org/`
- Pydantic: `https://docs.pydantic.dev/`
- React: `https://react.dev/`
- Vite: `https://vite.dev/guide/`
- Tailwind CSS: `https://tailwindcss.com/docs`
- React Router: `https://reactrouter.com/en/main`

### Documentación de API del proyecto

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

### Backend no conecta a base de datos

- Verifica que `livemenuDB` esté `healthy` con `docker compose ps`.
- Revisa `DB_HOST=livemenuDB` en `.env`.

### Cambios de código no reflejados

- Reinicia servicios puntuales:

```powershell
docker compose up -d --build backend frontend
```

- Haz hard refresh en navegador (`Ctrl + F5`).

### Swagger no carga

- Revisa logs: `docker compose logs -f backend`.
- Verifica que backend esté en `0.0.0.0:8000`.

### Upload en GCS falla

- Confirma montaje y ruta de credenciales.
- Verifica permisos de la service account sobre el bucket.

## Buenas prácticas de seguridad

- No subir `.env` al repositorio.
- No subir archivos de credenciales (`*.json`).
- Subir solo `.env.example` con placeholders.
- Rotar credenciales si fueron expuestas.

