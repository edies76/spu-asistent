"""Agrega columna desempeno a asistencias.

Revision ID: 0002_desempeno
Revises: 0001_initial
Create Date: 2026-06-29
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_desempeno"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    desempeno_enum = postgresql.ENUM(
        "excellent", "good", "keep_practicing", "needs_improvement",
        name="desempeno_enum"
    )
    desempeno_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "asistencias",
        sa.Column(
            "desempeno",
            postgresql.ENUM(
                "excellent", "good", "keep_practicing", "needs_improvement",
                name="desempeno_enum", create_type=False
            ),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("asistencias", "desempeno")
    postgresql.ENUM(name="desempeno_enum").drop(op.get_bind(), checkfirst=True)
