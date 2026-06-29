# Backend — Sistema de Asistencia (FastAPI)

API REST en Python/FastAPI + PostgreSQL + Alembic.

## Requisitos
- Python 3.12+
- PostgreSQL 14+ (o usarlo vía Docker Compose desde la raíz del repo)

## Instalación local

```bash
cd backend
python -m venv .venv
# Windows (Git Bash):
source .venv/Scripts/activate
# Linux/Mac:
# source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env        # ajusta DATABASE_URL y JWT_SECRET
```

Asegúrate de tener una base de datos PostgreSQL accesible según `DATABASE_URL`.

### Migraciones

```bash
alembic upgrade head
```

### Datos de ejemplo (seed)

```bash
RUN_SEED=true uvicorn app.main:app --reload --port 8000
```

El seed crea (si no existen):

| Rol          | Email                | Contraseña |
|--------------|----------------------|------------|
| estudiante   | estudiante@demo.test | demo1234   |
| tutor        | tutor@demo.test      | demo1234   |
| administrador| admin@demo.test      | demo1234   |

Y genera algunas sesiones de muestra en días pasados para el calendario.

### Arranque (desarrollo)

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Healthcheck: http://localhost:8000/health

## Estructura

```
backend/
├── app/
│   ├── main.py              # app FastAPI + CORS + lifespan (seed)
│   ├── config.py            # settings (env + defaults)
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models/              # Usuario, Sesion, Asistencia, enums
│   ├── schemas/             # Pydantic (entrada/salida)
│   ├── routers/             # auth, estudiantes, sesiones, asistencias, admin
│   ├── core/                # security (hash, JWT) + deps (auth por rol)
│   └── seed/                # datos de ejemplo
├── alembic/                 # migraciones
├── requirements.txt
├── Dockerfile
├── entrypoint.sh
└── .env.example
```

## Seguridad (sección 9)

- Contraseñas siempre con hash (bcrypt).
- `qr_id` es UUID v4 (impredecible), nunca secuencial.
- Autenticación: JWT en cookie **httpOnly** (+ Secure en HTTPS, SameSite=lax).
- Cada endpoint protegido verifica el rol en el backend. 403 con
  `{"detail":"rol_insuficiente","roles_permitidos":[...]}` cuando el rol no
  corresponde, para que el frontend redirija.
- Endpoints de edición: solo `administrador`.
- Endpoints de creación de asistencia: solo `tutor` y con sesión propia.

## ⚠️ Registro abierto

`POST /auth/register` permite crear cuentas de cualquier rol sin invitación
(decisión del cliente para esta versión). Ver TODO en `routers/auth.py`.
