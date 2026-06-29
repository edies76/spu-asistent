# Sistema de Asistencia con Código QR

Aplicación web para una academia que reemplaza el control de asistencia en
papel por un sistema basado en códigos QR. Tres roles (estudiante, tutor,
administrador), cada uno con su pantalla y permisos, verificados siempre en
el backend.

## Stack

| Capa        | Tecnología                                  |
|-------------|---------------------------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript + Tailwind |
| Backend     | Python + FastAPI (API REST)                 |
| Base de datos | PostgreSQL                                |
| Auth        | JWT en cookie httpOnly                      |
| QR          | UUID v4 por estudiante (no secuencial)      |

## Estructura

```
asistent-sistem/
├── backend/     # FastAPI + SQLAlchemy + Alembic
├── frontend/    # Next.js
└── docker-compose.yml
```

## Puesta en marcha rápida (Docker)

```bash
cp .env.example .env        # ajusta JWT_SECRET para producción
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend (docs Swagger): http://localhost:8000/docs
- El backend corre migraciones Alembic y carga datos de ejemplo (seed) al arrancar.

### Usuarios de ejemplo (creados por el seed)

| Rol          | Email                  | Contraseña   |
|--------------|------------------------|--------------|
| estudiante   | estudiante@demo.test   | demo1234     |
| tutor        | tutor@demo.test        | demo1234     |
| administrador| admin@demo.test        | demo1234     |

## Desarrollo local (sin Docker)

Ver el README de cada subcarpeta:

- [`backend/README.md`](./backend/README.md)
- [`frontend/README.md`](./frontend/README.md)

## Roles y permisos (resumen)

- **estudiante**: ve y descarga únicamente su propio QR. Sin acceso a otras secciones.
- **tutor**: escanea QR, crea sesiones y registros de asistencia dentro de una sesión activa. No edita el historial ni ve el panel admin.
- **administrador**: consulta, filtra y edita todos los registros (vista lista + calendario). No escanea ni crea sesiones.

Cada endpoint protegido devuelve **403** (`rol_insuficiente`) si el rol no
corresponde; el frontend usa ese error para redirigir a la pantalla correcta.

## Parámetros configurables

| Parámetro                  | Default | Descripción                                                |
|----------------------------|---------|------------------------------------------------------------|
| `ACTIVE_SESSION_WINDOW_MIN`| 20      | Minutos para considerar una sesión "activa".               |
| `LAST_TYPE_MEMORY_HOURS`   | 10      | Horas para sugerir el último tipo de sesión usado por el tutor. |

## ⚠️ Nota de seguridad — registro abierto

Por decisión del cliente, en esta versión cualquier usuario puede
autoregistrarse como **tutor** o **administrador** (el flujo de registro no
verifica invitación ni aprobación). Esto contradice la recomendación de
seguridad del pliego. El punto de registro (`POST /auth/register`) está
marcado con un `TODO` y la verificación puede añadirse más adelante
añadiendo una tabla `codigos_invitacion` y validando el rol elevado sin
reestructurar el resto del sistema.
