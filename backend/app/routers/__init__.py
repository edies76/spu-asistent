"""Paquete de routers FastAPI."""
from .auth import router as auth_router
from .estudiantes import router as estudiantes_router
from .sesiones import router as sesiones_router
from .asistencias import router as asistencias_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "estudiantes_router",
    "sesiones_router",
    "asistencias_router",
    "admin_router",
]
