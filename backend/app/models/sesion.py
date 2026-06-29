"""Modelo: sesiones."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import TipoSesion


class Sesion(Base):
    __tablename__ = "sesiones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tipo: Mapped[TipoSesion] = mapped_column(
        Enum(TipoSesion, name="tipo_sesion_enum"), nullable=False
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    iniciada_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Se actualiza cada vez que un nuevo estudiante se suma a la sesión.
    ultima_actividad_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    asistencias: Mapped[list["Asistencia"]] = relationship(
        "Asistencia", back_populates="sesion", cascade="all, delete-orphan"
    )

    tutor: Mapped["Usuario"] = relationship("Usuario", lazy="joined")
