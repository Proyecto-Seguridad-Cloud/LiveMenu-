# Plan de Trabajo - LiveMenu
## Distribución de tareas para equipo de 4 personas

---

## 1. Estrategia de distribución

Se utiliza una **división por dominio vertical**: cada persona es dueña de funcionalidades completas (backend + frontend + tests). Esto garantiza:

- Commits balanceados entre los 4 integrantes
- Responsabilidad clara por módulo
- Menor cantidad de conflictos en el código

---

## 2. Asignación por persona

### Persona 1 - Auth + Infraestructura base

| Semana | Tareas |
|--------|--------|
| 1-2 | Setup del proyecto (repo, Docker, docker-compose, `.env.example`) |
| 1-2 | Modelos base con SQLAlchemy + migraciones (Alembic) |
| 1-2 | **CU-01**: Registro, login, logout con JWT |
| 1-2 | Middleware JWT, bcrypt, rate limiting |
| 1-2 | CI básico (linting con ruff) |
| 3-4 | Frontend: páginas de login/registro |
| 3-4 | Tests de auth (servicios y repositorios) |
| 3-4 | Documentación de deployment |

**Endpoints a cargo:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh` (opcional)
- `POST /api/v1/auth/logout` (opcional)

**Requerimientos cubiertos:** RF-01, RF-02, RF-03, RF-04, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-08

---

### Persona 2 - Restaurante + Categorías

| Semana | Tareas |
|--------|--------|
| 1-2 | **CU-02**: CRUD restaurante (modelo, servicio, repositorio, endpoints) |
| 1-2 | **CU-03**: CRUD categorías + reordenamiento por posición |
| 1-2 | Generación automática de slug único |
| 3-4 | Frontend: dashboard principal, formularios de restaurante y categorías |
| 3-4 | Tests unitarios de servicios y repositorios |
| 3-4 | Documentación de API (Swagger/OpenAPI) |

**Endpoints a cargo:**
- `GET /api/v1/admin/restaurant`
- `POST /api/v1/admin/restaurant`
- `PUT /api/v1/admin/restaurant`
- `DELETE /api/v1/admin/restaurant`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id`
- `PATCH /api/v1/admin/categories/reorder`

**Requerimientos cubiertos:** RF-05, RF-06, RF-07, RF-08

---

### Persona 3 - Platos + Imágenes

| Semana | Tareas |
|--------|--------|
| 1-2 | **CU-04**: CRUD platos (soft delete, etiquetas, disponibilidad, precio oferta) |
| 1-2 | **CU-05**: Carga de imágenes + integración S3/GCS |
| 1-2 | **Worker pool con asyncio** + ProcessPoolExecutor |
| 1-2 | Resize de imágenes a 3 variantes (thumbnail 150px, medium 400px, large 800px) |
| 3-4 | Frontend: listado/formulario de platos, componente de upload de imágenes |
| 3-4 | Tests del worker pool y procesamiento de imágenes |

**Endpoints a cargo:**
- `GET /api/v1/admin/dishes`
- `GET /api/v1/admin/dishes/:id`
- `POST /api/v1/admin/dishes`
- `PUT /api/v1/admin/dishes/:id`
- `DELETE /api/v1/admin/dishes/:id`
- `PATCH /api/v1/admin/dishes/:id/availability`
- `POST /api/v1/admin/upload`
- `DELETE /api/v1/admin/upload/:filename`

**Requerimientos cubiertos:** RF-09, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15

---

### Persona 4 - Menú público + QR + Analytics

| Semana | Tareas |
|--------|--------|
| 1-2 | **CU-06**: Menú público (endpoint sin auth, caché en memoria, resolución por slug) |
| 1-2 | **CU-07**: Generación QR (PNG/SVG, 4 tamaños, logo opcional) |
| 1-2 | Landing page del menú mobile-first |
| 3-4 | **CU-08**: Analytics - dashboard de métricas (opcional) |
| 3-4 | Frontend: página de QR, dashboard de analytics |
| 3-4 | Video demo (5-10 min) |
| 3-4 | README.md completo con instrucciones de setup |

**Endpoints a cargo:**
- `GET /api/v1/menu/:slug`
- `GET /m/:slug`
- `GET /api/v1/admin/qr`
- `GET /api/v1/admin/qr?format=svg`
- `GET /api/v1/admin/qr?size=xl`
- `GET /api/v1/admin/analytics` (opcional)
- `GET /api/v1/admin/analytics/export` (opcional)

**Requerimientos cubiertos:** RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RNF-01, RNF-09

---

## 3. Cronograma general (4 semanas)

```
Semana 1 ── Setup + modelos + endpoints base
             Persona 1 entrega infra base en primeros 3-4 días (CRÍTICO)
             Resto del equipo puede trabajar con mocks mientras tanto

Semana 2 ── Lógica de negocio + integración entre módulos
             Todos los endpoints principales funcionando
             Primeros tests unitarios

Semana 3 ── Frontend + tests + Docker optimizado
             Integración frontend-backend
             Cobertura de tests >= 60%

Semana 4 ── Integración final + corrección de bugs + documentación
             Video demo
             README + documentación de API + instrucciones de deployment
```

---

## 4. Mapa de dependencias

```
Persona 1 (Auth + Infra)
    │
    ├──▶ Persona 2 (Restaurante + Categorías)
    │        │
    │        └──▶ Persona 3 (Platos + Imágenes)
    │                 │
    │                 └──▶ Persona 4 (Menú público necesita platos)
    │
    └──▶ Persona 4 (QR necesita slug del restaurante)
```

**Nota:** Persona 4 puede empezar el menú público y QR con datos mock mientras espera que los módulos de restaurante y platos estén listos.

---

## 5. Prácticas de equipo para maximizar nota

### Git workflow

| Práctica | Criterio que impacta |
|----------|---------------------|
| Ramas por feature (`feature/auth`, `feature/dishes`, etc.) | Arquitectura (20%) |
| Pull Requests con review obligatorio de al menos 1 compañero | Trabajo en equipo (5%) |
| Commits frecuentes y descriptivos (no commits gigantes) | Trabajo en equipo (5%) |
| Convención de commits (ej: `feat:`, `fix:`, `docs:`, `test:`) | Calidad de código (15%) |

### Calidad

| Práctica | Criterio que impacta |
|----------|---------------------|
| Tests desde semana 2 (no dejar para el final) | Calidad de código (15%) |
| Linting con `ruff` en cada PR | Calidad de código (15%) |
| Docker funcional desde semana 1 | DevOps (10%) |
| Código en capas: Handler → Service → Repository | Arquitectura (20%) |

### Entregables compartidos

| Entregable | Responsable principal | Apoyo |
|------------|----------------------|-------|
| Dockerfile + docker-compose.yml | Persona 1 | Todos |
| README.md | Persona 4 | Todos |
| .env.example | Persona 1 | - |
| Diagrama de arquitectura | Persona 2 | - |
| Documentación de API | Persona 2 | Todos |
| Video demo | Persona 4 | Todos |
| Tests unitarios | Cada uno los suyos | - |

---

## 6. Rúbrica y pesos (recordatorio)

| Criterio | Peso | Cómo asegurar buena nota |
|----------|------|--------------------------|
| Funcionalidad | 40% | Completar todos los CU (al menos CU-01 a CU-07) |
| Arquitectura | 20% | Respetar patrón Handler → Service → Repository |
| Calidad de código | 15% | Clean code + naming consistente + tests >= 60% |
| Frontend | 10% | UI responsive mobile-first con Tailwind + shadcn/ui |
| DevOps | 10% | Docker optimizado + CI + deployment documentado |
| Trabajo en equipo | 5% | Commits balanceados + PRs con reviews |

---

## 7. Stack tecnológico (referencia rápida)

| Capa | Tecnología |
|------|-----------|
| Backend | Python + FastAPI |
| BD | PostgreSQL (SQLAlchemy + asyncpg) |
| Auth | JWT (implementación propia) + bcrypt |
| Storage | AWS S3 o GCS |
| Frontend | React + Tailwind + shadcn/ui |
| QR | qrcode (Python) |
| Tests | pytest + pytest-asyncio |
| Linting | ruff |
| Contenedores | Docker + docker-compose |
