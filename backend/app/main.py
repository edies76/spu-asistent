"""Aplicación FastAPI: Sistema de Asistencia con Código QR."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    auth_router,
    estudiantes_router,
    sesiones_router,
    asistencias_router,
    admin_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al arrancar en desarrollo/Docker: correr migraciones y seed opcional.
    if settings.run_seed:
        from .seed.bootstrap import bootstrap

        bootstrap()
    yield


app = FastAPI(
    title="Sistema de Asistencia con Código QR",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(estudiantes_router)
app.include_router(sesiones_router)
app.include_router(asistencias_router)
app.include_router(admin_router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
