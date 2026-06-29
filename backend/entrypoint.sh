#!/bin/sh
# Punto de entrada del contenedor backend.
# Espera a que la BD esté lista, corre migraciones Alembic y arranca uvicorn.
set -e

echo "[entrypoint] esperando base de datos..."
# Intenta ejecutar Alembic con reintentos (la BD puede tardar en aceptar conexiones).
for i in $(seq 1 30); do
  if alembic upgrade head; then
    echo "[entrypoint] migraciones aplicadas."
    break
  fi
  echo "[entrypoint] reintentando en 2s ($i/30)..."
  sleep 2
done

# El seed corre automáticamente si RUN_SEED=true vía el lifespan de FastAPI.

echo "[entrypoint] arrancando uvicorn en 0.0.0.0:8000"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
