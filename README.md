# LiveMenu

Plataforma de menú digital con código QR para restaurantes. Backend con FastAPI, frontend con React 19 + Tailwind v4, PostgreSQL como base de datos, todo orquestado con Docker Compose.

## 1) Requisitos

- Docker Desktop activo.
- Terminal (macOS/Linux) o PowerShell (Windows).
- Ejecutar comandos desde la raíz del proyecto (donde está `docker-compose.yml`).

## 2) Configuración inicial

1. Crear archivo de entorno local:

```bash
cp .env.example .env
```

2. Generar secreto JWT y pegarlo en `.env`:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

3. Levantar los 3 servicios:

```bash
docker compose up --build -d
```

4. Ejecutar migraciones:

```bash
docker compose exec backend alembic upgrade head
```

5. Verificar:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Swagger/OpenAPI: `http://localhost:8000/docs`

## 3) Arquitectura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para diagramas detallados.

```
LiveMenu/
├── backend/          ← FastAPI + SQLAlchemy async
│   ├── app/
│   │   ├── handlers/     (endpoints REST)
│   │   ├── services/     (lógica de negocio)
│   │   ├── repositories/ (acceso a datos)
│   │   ├── models/       (ORM SQLAlchemy)
│   │   └── schemas/      (validación Pydantic)
│   └── tests/
├── frontend/         ← React 19 + TypeScript + Vite
│   └── src/
│       ├── pages/admin/    (panel administrativo)
│       ├── pages/public/   (menú público)
│       ├── components/ui/  (shadcn/ui)
│       └── services/       (HTTP al backend)
└── docker-compose.yml
```

### Servicios Docker

| Servicio     | Puerto | Descripción                          |
|-------------|--------|--------------------------------------|
| `livemenuDB` | 5432   | PostgreSQL 16                        |
| `backend`    | 8000   | API REST + procesamiento de imágenes |
| `frontend`   | 3000   | SPA React via Nginx + proxy reverso  |

## 4) Variables de entorno (`.env`)

### Base de datos

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`

### Seguridad

- `JWT_SECRET_KEY` (obligatorio)
- `JWT_ALGORITHM` (default: `HS256`)

### Upload y procesamiento de imágenes

- `STORAGE_PROVIDER` (`local` o `gcs`)
- `UPLOAD_DIR` (default: `uploads`)
- `IMAGE_MAX_SIZE_MB` (default: `5`)
- `IMAGE_WORKERS` (default: `2`)
- `PUBLIC_BASE_URL` (default: `http://localhost:8000`)

### GCS (solo cuando `STORAGE_PROVIDER=gcs`)

- `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, `GCS_CREDENTIALS_FILE`, `GCS_PUBLIC_BASE_URL`

## 5) Desarrollo local (frontend)

Para desarrollo con hot-reload del frontend:

```bash
cd frontend
npm install
npm run dev
```

El servidor de desarrollo Vite levanta en `http://localhost:5173` con proxy automático al backend en `http://localhost:8000`.

## 6) Comandos operativos

### Levantar y estado

```bash
docker compose up --build -d
docker compose ps
```

### Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Reinicio / apagado

```bash
docker compose restart backend
docker compose down
docker compose down -v   # elimina volúmenes (resetea datos)
```

### Migraciones

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic history
```

## 7) Pruebas y cobertura

### Ejecutar pruebas

```bash
docker compose exec backend pytest -q
```

### Cobertura global

```bash
docker compose exec backend pytest --cov=app --cov-report=term-missing -q
```

### Verificar mínimo 60%

```bash
docker compose exec backend pytest --cov=app --cov-fail-under=60 -q
```

## 8) Funcionalidades

### Panel administrativo (`/admin`)

- Gestión de restaurante (nombre, logo, teléfono, dirección, horarios)
- CRUD de categorías con drag-and-drop para reordenar
- CRUD de platos con precios, ofertas, tags, imágenes
- Subida de imágenes con procesamiento automático (thumbnail, medium, large)
- Generación de código QR personalizable (colores, descarga PNG/SVG)
- Dashboard de analíticas (escaneos totales, 7 días, 30 días, gráfico diario, exportar CSV)

### Menú público (`/m/{slug}`)

- Vista mobile-first del menú del restaurante
- Navegación por categorías con scroll tracking
- Precios y ofertas visibles
- Registro automático de escaneos (analytics)

## 9) Seguridad

- No subir `.env` al repositorio.
- No subir credenciales GCP (`*.json`).
- JWT con bcrypt para autenticación.
- Rate limiting en endpoints de auth (slowapi).
- IP hashing para analytics (privacidad).

## 10) Problemas frecuentes

### El backend no conecta a DB

- Verificar que `livemenuDB` esté `healthy`: `docker compose ps`
- Confirmar `DB_HOST=livemenuDB` en `.env`

### Error de tablas faltantes

- Ejecutar migraciones: `docker compose exec backend alembic upgrade head`

### Frontend no carga en Docker

- Verificar que el servicio `frontend` esté corriendo: `docker compose ps`
- Revisar logs: `docker compose logs frontend`
