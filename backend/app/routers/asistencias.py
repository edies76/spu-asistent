"""Endpoints del rol tutor: creación y actualización de asistencias."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.asistencia import Asistencia
from ..models.sesion import Sesion
from ..models.usuario import Usuario
from ..core.deps import require_tutor
from ..schemas.sesion import (
    AsistenciaCreateIn,
    AsistenciaCreateConSesionIn,
    AsistenciaOut,
    AsistenciaUpdateIn,
    EstudianteQrOut,
)

router = APIRouter(prefix="/asistencias", tags=["asistencias", "tutor"])


def _build_out(a: Asistencia, nombre: str) -> AsistenciaOut:
    return AsistenciaOut(
        id=a.id,
        sesion_id=a.sesion_id,
        estudiante_id=a.estudiante_id,
        estudiante_nombre=nombre,
        desempeno=a.desempeno,
        notas=a.notas,
        firma=a.firma,
        creado_en=a.creado_en,
        editado_en=a.editado_en,
    )


@router.get("/resolver-qr/{qr_id}", response_model=EstudianteQrOut)
def resolver_qr(
    qr_id: UUID,
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Devuelve datos del estudiante a partir de su qr_id (para pre-rellenar el form)."""
    estudiante = db.scalar(select(Usuario).where(Usuario.qr_id == qr_id))
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "qr_no_encontrado"},
        )
    return EstudianteQrOut(
        estudiante_id=estudiante.id,
        nombre_completo=estudiante.nombre_completo,
        qr_id=estudiante.qr_id,
    )


@router.post("", response_model=AsistenciaOut, status_code=status.HTTP_201_CREATED)
def crear_asistencia(
    payload: AsistenciaCreateIn,
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Crea asistencia en una sesión ya existente."""
    sesion = db.scalar(
        select(Sesion).where(Sesion.id == payload.sesion_id, Sesion.tutor_id == user.id)
    )
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "sesion_no_propia"},
        )

    estudiante = db.scalar(select(Usuario).where(Usuario.qr_id == payload.qr_id))
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "qr_no_encontrado"},
        )

    asistencia = Asistencia(
        sesion_id=sesion.id,
        estudiante_id=estudiante.id,
        desempeno=payload.desempeno,
        notas=payload.notas,
    )
    db.add(asistencia)
    sesion.ultima_actividad_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(asistencia)
    return _build_out(asistencia, estudiante.nombre_completo)


@router.post("/con-sesion", response_model=AsistenciaOut, status_code=status.HTTP_201_CREATED)
def crear_asistencia_con_sesion(
    payload: AsistenciaCreateConSesionIn,
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Crea sesión nueva + asistencia en un solo request (flujo QR directo)."""
    estudiante = db.scalar(select(Usuario).where(Usuario.qr_id == payload.qr_id))
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "qr_no_encontrado"},
        )

    ahora = datetime.now(timezone.utc)
    sesion = Sesion(
        tipo=payload.tipo,
        tutor_id=user.id,
        iniciada_en=ahora,
        ultima_actividad_en=ahora,
    )
    db.add(sesion)
    db.flush()

    asistencia = Asistencia(
        sesion_id=sesion.id,
        estudiante_id=estudiante.id,
        desempeno=payload.desempeno,
        notas=payload.notas,
    )
    db.add(asistencia)
    db.commit()
    db.refresh(asistencia)
    return _build_out(asistencia, estudiante.nombre_completo)


@router.patch("/{asistencia_id}", response_model=AsistenciaOut)
def actualizar_asistencia(
    asistencia_id: UUID,
    payload: AsistenciaUpdateIn,
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """El tutor actualiza desempeño/notas de una asistencia de su propia sesión."""
    a = db.get(Asistencia, asistencia_id)
    if not a:
        raise HTTPException(status_code=404, detail={"detail": "asistencia_no_encontrada"})

    sesion = db.scalar(select(Sesion).where(Sesion.id == a.sesion_id, Sesion.tutor_id == user.id))
    if not sesion:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"detail": "sesion_no_propia"})

    if payload.desempeno is not None:
        a.desempeno = payload.desempeno
    if payload.notas is not None:
        a.notas = payload.notas
    db.commit()
    db.refresh(a)

    estudiante = db.get(Usuario, a.estudiante_id)
    return _build_out(a, estudiante.nombre_completo if estudiante else "")
