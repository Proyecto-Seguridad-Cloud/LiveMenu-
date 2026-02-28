# LiveMenu - Ejecución rápida

## Requisitos
- Docker Desktop encendido
- Estar en la raíz del proyecto (donde está `docker-compose.yml`)

## Comandos

```powershell
Copy-Item .env.example .env
```
Crea el archivo `.env` local a partir del ejemplo.

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```
Genera una clave segura para `JWT_SECRET_KEY` (pégala en `.env`).

```powershell
docker compose up --build -d
```
Construye imágenes y levanta backend + base de datos en segundo plano.

```powershell
docker compose ps
```
Muestra el estado de los contenedores.

```powershell
docker compose exec backend alembic upgrade head
```
Aplica migraciones de base de datos.

```powershell
docker compose logs -f backend
```
Muestra logs en tiempo real del backend.

```powershell
docker compose down
```
Detiene y elimina contenedores.

```powershell
docker compose down -v
```
Detiene todo y además elimina volúmenes (reset de base de datos).

## Verificación
- Health: `http://localhost:8000/health`
- Swagger: `http://localhost:8000/docs`

