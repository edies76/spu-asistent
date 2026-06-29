"""Endpoints del rol tutor: gestión de sesiones activas."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.asistencia import Asistencia
from ..models.sesion import Sesion
from ..models.usuario import Usuario
from ..core.deps import require_tutor
from ..schemas.sesion import (
    SesionCreateIn,
    SesionOut,
    SesionActivaOut,
    SesionConEstudiantesOut,
    EstudianteEnSesionOut,
)

router = APIRouter(prefix="/sesiones", tags=["sesiones", "tutor"])


def _sesion_to_out(sesion: Sesion, db: Session) -> SesionOut:
    from sqlalchemy import func
    count = db.scalar(
        select(func.count()).select_from(Asistencia).where(Asistencia.sesion_id == sesion.id)
    )
    return SesionOut(
        id=sesion.id,
        tipo=sesion.tipo,
        tutor_id=sesion.tutor_id,
        iniciada_en=sesion.iniciada_en,
        ultima_actividad_en=sesion.ultima_actividad_en,
        n_estudiantes=int(count or 0),
    )


def _sesion_con_estudiantes(sesion: Sesion, db: Session) -> SesionConEstudiantesOut:
    asistencias = db.scalars(
        select(Asistencia).where(Asistencia.sesion_id == sesion.id)
    ).all()
    estudiantes = []
    for a in asistencias:
        est = db.get(Usuario, a.estudiante_id)
        if est:
            estudiantes.append(EstudianteEnSesionOut(nombre_completo=est.nombre_completo))
    return SesionConEstudiantesOut(
        id=sesion.id,
        tipo=sesion.tipo,
        iniciada_en=sesion.iniciada_en,
        n_estudiantes=len(estudiantes),
        estudiantes=estudiantes,
    )


@router.get("/activa", response_model=SesionActivaOut)
def get_sesion_activa(
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    ahora = datetime.now(timezone.utc)
    ventana = timedelta(minutes=settings.active_session_window_min)
    memoria = timedelta(hours=settings.last_type_memory_hours)

    sesion_activa = db.scalar(
        select(Sesion)
        .where(Sesion.tutor_id == user.id)
        .order_by(Sesion.ultima_actividad_en.desc())
    )
    out = SesionActivaOut(activa=False)

    if sesion_activa:
        ua = sesion_activa.ultima_actividad_en
        if ua.tzinfo is None:
            ua = ua.replace(tzinfo=timezone.utc)
        if ahora - ua <= ventana:
            out.activa = True
            out.sesion = _sesion_con_estudiantes(sesion_activa, db)
            return out
        if ahora - ua <= memoria:
            out.tipo_sugerido = sesion_activa.tipo

    return out


@router.get("/recientes", response_model=list[SesionConEstudiantesOut])
def sesiones_recientes(
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Sesiones del tutor en las últimas 24h (excluyendo la activa)."""
    ahora = datetime.now(timezone.utc)
    hace_24h = ahora - timedelta(hours=24)
    ventana = timedelta(minutes=settings.active_session_window_min)

    sesiones = db.scalars(
        select(Sesion)
        .where(
            Sesion.tutor_id == user.id,
            Sesion.iniciada_en >= hace_24h,
        )
        .order_by(Sesion.iniciada_en.desc())
    ).all()

    result = []
    for s in sesiones:
        ua = s.ultima_actividad_en
        if ua.tzinfo is None:
            ua = ua.replace(tzinfo=timezone.utc)
        # excluir la sesión activa actual
        if ahora - ua <= ventana:
            continue
        result.append(_sesion_con_estudiantes(s, db))

    return result


@router.post("", response_model=SesionOut, status_code=status.HTTP_201_CREATED)
def crear_sesion(
    payload: SesionCreateIn,
    user: Usuario = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    ahora = datetime.now(timezone.utc)
    sesion = Sesion(
        tipo=payload.tipo,
        tutor_id=user.id,
        iniciada_en=ahora,
        ultima_actividad_en=ahora,
    )
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return _sesion_to_out(sesion, db)
