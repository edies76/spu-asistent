"""Esquemas de sesión y asistencia."""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import Field

from .common import ORMModel
from ..models.enums import TipoSesion, Desempeno


# --- Sesiones ---
class SesionCreateIn(ORMModel):
    tipo: TipoSesion


class SesionOut(ORMModel):
    id: UUID
    tipo: TipoSesion
    tutor_id: UUID
    iniciada_en: datetime
    ultima_actividad_en: datetime
    n_estudiantes: int = 0


class EstudianteEnSesionOut(ORMModel):
    nombre_completo: str


class SesionConEstudiantesOut(ORMModel):
    id: UUID
    tipo: TipoSesion
    iniciada_en: datetime
    n_estudiantes: int = 0
    estudiantes: List[EstudianteEnSesionOut] = []


class SesionActivaOut(ORMModel):
    """Respuesta de GET /sesiones/activa."""
    activa: bool
    sesion: Optional[SesionConEstudiantesOut] = None
    tipo_sugerido: Optional[TipoSesion] = None


# --- Asistencias ---
class AsistenciaCreateIn(ORMModel):
    sesion_id: UUID
    qr_id: UUID
    desempeno: Optional[Desempeno] = None
    notas: Optional[str] = Field(default=None, max_length=2000)


class AsistenciaCreateConSesionIn(ORMModel):
    """Crea sesión + asistencia en un solo request (flujo nuevo)."""
    qr_id: UUID
    tipo: TipoSesion
    desempeno: Desempeno
    notas: Optional[str] = Field(default=None, max_length=2000)


class AsistenciaUpdateIn(ORMModel):
    desempeno: Optional[Desempeno] = None
    notas: Optional[str] = Field(default=None, max_length=2000)
    firma: Optional[str] = None


class AsistenciaOut(ORMModel):
    id: UUID
    sesion_id: UUID
    estudiante_id: UUID
    estudiante_nombre: str
    desempeno: Optional[Desempeno] = None
    notas: Optional[str] = None
    firma: Optional[str] = None
    creado_en: datetime
    editado_en: Optional[datetime] = None


class EstudianteQrOut(ORMModel):
    """Datos del estudiante resuelto por qr_id (para pre-rellenar el form)."""
    estudiante_id: UUID
    nombre_completo: str
    qr_id: UUID


class SesionDetalleOut(ORMModel):
    """Detalle de sesión con su lista de asistencias (admin)."""
    id: UUID
    tipo: TipoSesion
    tutor_id: UUID
    tutor_nombre: str
    iniciada_en: datetime
    ultima_actividad_en: datetime
    asistencias: List[AsistenciaOut] = []
