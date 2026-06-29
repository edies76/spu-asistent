"""Modelo: asistencias."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import Desempeno


class Asistencia(Base):
    __tablename__ = "asistencias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sesion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sesiones.id", ondelete="CASCADE"), nullable=False
    )
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    # Desempeño del estudiante (campo select obligatorio).
    desempeno: Mapped[Desempeno | None] = mapped_column(
        Enum(Desempeno, name="desempeno_enum"), nullable=True
    )
    # Notas adicionales opcionales del tutor.
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Firma opcional (base64), nullable.
    firma: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Se llena solo si el administrador corrige el registro después de creado.
    editado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    sesion: Mapped["Sesion"] = relationship("Sesion", back_populates="asistencias")
    estudiante: Mapped["Usuario"] = relationship("Usuario", lazy="joined")
