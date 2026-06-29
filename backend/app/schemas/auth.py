"""Esquemas de autenticación y usuario."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from .common import ORMModel
from ..models.enums import Rol


class RegistroIn(ORMModel):
    """Fase 2 del registro de 3 fases: rol + datos básicos (máx 5 campos)."""
    rol: Rol
    nombre_completo: str = Field(min_length=2, max_length=200)
    fecha_nacimiento: date
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    telefono: Optional[str] = Field(default=None, max_length=40)


class LoginIn(ORMModel):
    email: EmailStr
    password: str


class UsuarioOut(ORMModel):
    id: UUID
    nombre_completo: str
    email: EmailStr
    rol: Rol
    telefono: Optional[str] = None
    fecha_nacimiento: date
    qr_id: Optional[UUID] = None
    creado_en: datetime
