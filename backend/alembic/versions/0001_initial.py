"""Esquema inicial: usuarios, sesiones, asistencias.

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-27 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    rol_enum = postgresql.ENUM("estudiante", "tutor", "administrador", name="rol_enum")
    tipo_sesion_enum = postgresql.ENUM(
        "lab1", "lab2", "practice", "conversacional", name="tipo_sesion_enum"
    )
    rol_enum.create(op.get_bind(), checkfirst=True)
    tipo_sesion_enum.create(op.get_bind(), checkfirst=True)

    # usuarios
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre_completo", sa.String(length=200), nullable=False),
        sa.Column("fecha_nacimiento", sa.Date(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefono", sa.String(length=40), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("rol", postgresql.ENUM("estudiante", "tutor", "administrador", name="rol_enum", create_type=False), nullable=False),
        sa.Column("qr_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_usuarios_email"),
        sa.UniqueConstraint("qr_id", name="uq_usuarios_qr_id"),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"])
    op.create_index("ix_usuarios_qr_id", "usuarios", ["qr_id"])

    # sesiones
    op.create_table(
        "sesiones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tipo", postgresql.ENUM("lab1", "lab2", "practice", "conversacional", name="tipo_sesion_enum", create_type=False), nullable=False),
        sa.Column(
            "tutor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "iniciada_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "ultima_actividad_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_sesiones_tutor_id", "sesiones", ["tutor_id"])

    # asistencias
    op.create_table(
        "asistencias",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "sesion_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sesiones.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "estudiante_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("firma", sa.Text(), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("editado_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_asistencias_sesion_id", "asistencias", ["sesion_id"])
    op.create_index("ix_asistencias_estudiante_id", "asistencias", ["estudiante_id"])


def downgrade() -> None:
    op.drop_index("ix_asistencias_estudiante_id", table_name="asistencias")
    op.drop_index("ix_asistencias_sesion_id", table_name="asistencias")
    op.drop_table("asistencias")

    op.drop_index("ix_sesiones_tutor_id", table_name="sesiones")
    op.drop_table("sesiones")

    op.drop_index("ix_usuarios_qr_id", table_name="usuarios")
    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_table("usuarios")

    postgresql.ENUM(name="tipo_sesion_enum").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="rol_enum").drop(op.get_bind(), checkfirst=True)
