# Ver cambios en vivo (Frontend)

## 1) Levantar backend (Docker)

Desde la raíz del proyecto:

```powershell
docker compose up -d
```

## 2) Levantar frontend (local)

En otra terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## 3) Abrir en navegador

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## 4) Cómo ver los cambios

- Cada vez que guardas un archivo en `frontend/src`, Vite actualiza la página automáticamente (HMR).
- Si cambias variables en `frontend/.env`, reinicia el servidor de frontend.

## 5) Rutas disponibles actualmente

- `/login`
- `/register`
- `/admin`
- `/admin/restaurant`
- `/admin/categories`
- `/admin/dishes`
- `/admin/dishes/new`
- `/admin/dishes/1/edit`
- `/admin/uploads`
- `/admin/qr`
- `/m/demo`

## 6) Problemas comunes

- Si `localhost:5173` no abre: confirma que el comando de `npm run dev` está corriendo en la carpeta `frontend`.
- Si el frontend no conecta al backend: valida `VITE_API_BASE_URL=http://localhost:8000` en `frontend/.env`.
