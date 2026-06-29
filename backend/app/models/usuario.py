"""Modelo: usuarios."""
import uuid
from datetime import date, datetime

from sqlalchemy import DateTime, Enum, String, Date, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base
from .enums import Rol


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre_completo: Mapped[str] = mapped_column(String(200), nullable=False)
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    telefono: Mapped[str | None] = mapped_column(String(40), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[Rol] = mapped_column(Enum(Rol, name="rol_enum"), nullable=False)
    # UUID v4 impredecible, solo para estudiantes; es lo que se codifica en el QR.
    qr_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=True, index=True
    )
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
