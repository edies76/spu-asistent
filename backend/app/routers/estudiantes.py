"""Endpoints del rol estudiante: ver su propio QR."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from ..core.deps import require_estudiante

router = APIRouter(prefix="/estudiantes", tags=["estudiante"])


@router.get("/me/qr")
def mi_qr(user: Usuario = Depends(require_estudiante)):
    """
    Devuelve el qr_id del estudiante autenticado (lo que se codifica en el QR).
    El frontend lo usa para renderizar y descargar el código QR.
    """
    if not user.qr_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "qr_no_generado"},
        )
    return {
        "qr_id": str(user.qr_id),
        "nombre": user.nombre_completo,
    }
