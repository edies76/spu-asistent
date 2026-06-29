"""Endpoints del rol administrador: consulta, filtros, calendario y edición.

Sección 8: vista lista + calendario + detalle editable.
Sección 9: los endpoints de edición solo aceptan administrador.
"""
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.asistencia import Asistencia
from ..models.enums import TipoSesion
from ..models.sesion import Sesion
from ..models.usuario import Usuario
from ..core.deps import require_admin
from ..schemas.sesion import AsistenciaOut, AsistenciaUpdateIn, SesionDetalleOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _asis_to_out(a: Asistencia) -> AsistenciaOut:
    return AsistenciaOut(
        id=a.id,
        sesion_id=a.sesion_id,
        estudiante_id=a.estudiante_id,
        estudiante_nombre=a.estudiante.nombre_completo,
        desempeno=a.desempeno,
        notas=a.notas,
        firma=a.firma,
        creado_en=a.creado_en,
        editado_en=a.editado_en,
    )


# ---------------------------------------------------------------------------
# Vista de lista: sesiones agrupadas con sus asistencias + filtros (sección 8)
# ---------------------------------------------------------------------------
@router.get("/asistencias", response_model=list[SesionDetalleOut])
def listar_asistencias(
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
    desde: Optional[date] = Query(default=None),
    hasta: Optional[date] = Query(default=None),
    tutor_id: Optional[UUID] = Query(default=None),
    estudiante_id: Optional[UUID] = Query(default=None),
):
    q = select(Sesion).order_by(Sesion.iniciada_en.desc())
    if tutor_id:
        q = q.where(Sesion.tutor_id == tutor_id)
    if desde:
        q = q.where(Sesion.iniciada_en >= datetime.combine(desde, datetime.min.time(), tzinfo=timezone.utc))
    if hasta:
        fin = datetime.combine(hasta, datetime.max.time(), tzinfo=timezone.utc)
        q = q.where(Sesion.iniciada_en <= fin)

    sesiones = db.scalars(q).unique().all()
    out: list[SesionDetalleOut] = []
    for s in sesiones:
        asistencias = s.asistencias
        if estudiante_id:
            asistencias = [a for a in asistencias if a.estudiante_id == estudiante_id]
            if not asistencias:
                continue
        out.append(
            SesionDetalleOut(
                id=s.id,
                tipo=s.tipo,
                tutor_id=s.tutor_id,
                tutor_nombre=s.tutor.nombre_completo,
                iniciada_en=s.iniciada_en,
                ultima_actividad_en=s.ultima_actividad_en,
                asistencias=[_asis_to_out(a) for a in asistencias],
            )
        )
    return out


# ---------------------------------------------------------------------------
# Vista de calendario (sección 8): sesiones por día con su tutor.
# ---------------------------------------------------------------------------
@router.get("/calendario")
def calendario(
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
    anio: int = Query(...),
    mes: int = Query(..., ge=1, le=12),
):
    """Devuelve las sesiones del mes (anio, mes) con su tutor y tipo."""
    from calendar import monthrange

    inicio = datetime(anio, mes, 1, tzinfo=timezone.utc)
    ultimo_dia = monthrange(anio, mes)[1]
    fin = datetime(anio, mes, ultimo_dia, 23, 59, 59, tzinfo=timezone.utc)

    q = (
        select(Sesion)
        .where(Sesion.iniciada_en >= inicio, Sesion.iniciada_en <= fin)
        .order_by(Sesion.iniciada_en.asc())
    )
    sesiones = db.scalars(q).unique().all()
    return {
        "anio": anio,
        "mes": mes,
        "sesiones": [
            {
                "id": str(s.id),
                "tipo": s.tipo.value,
                "tutor_id": str(s.tutor_id),
                "tutor_nombre": s.tutor.nombre_completo,
                "iniciada_en": s.iniciada_en.isoformat(),
            }
            for s in sesiones
        ],
    }


# ---------------------------------------------------------------------------
# Vista de detalle de sesión (sección 8)
# ---------------------------------------------------------------------------
@router.get("/sesiones/{sesion_id}", response_model=SesionDetalleOut)
def detalle_sesion(
    sesion_id: UUID,
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    s = db.get(Sesion, sesion_id)
    if not s:
        raise HTTPException(status_code=404, detail={"detail": "sesion_no_encontrada"})
    return SesionDetalleOut(
        id=s.id,
        tipo=s.tipo,
        tutor_id=s.tutor_id,
        tutor_nombre=s.tutor.nombre_completo,
        iniciada_en=s.iniciada_en,
        ultima_actividad_en=s.ultima_actividad_en,
        asistencias=[_asis_to_out(a) for a in s.asistencias],
    )


# ---------------------------------------------------------------------------
# Edición de asistencia (sección 8): solo admin, setea editado_en.
# ---------------------------------------------------------------------------
@router.patch("/asistencias/{asistencia_id}", response_model=AsistenciaOut)
def editar_asistencia(
    asistencia_id: UUID,
    payload: AsistenciaUpdateIn,
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    a = db.get(Asistencia, asistencia_id)
    if not a:
        raise HTTPException(status_code=404, detail={"detail": "asistencia_no_encontrada"})

    cambios = False
    if payload.desempeno is not None:
        a.desempeno = payload.desempeno
        cambios = True
    if payload.notas is not None:
        a.notas = payload.notas
        cambios = True
    if payload.firma is not None:
        a.firma = payload.firma
        cambios = True
    if cambios:
        a.editado_en = datetime.now(timezone.utc)

    db.commit()
    db.refresh(a)
    return _asis_to_out(a)


# ---------------------------------------------------------------------------
# Listas de apoyo para filtros del panel.
# ---------------------------------------------------------------------------
@router.get("/tutores")
def listar_tutores(
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from ..models.enums import Rol

    rows = db.scalars(
        select(Usuario).where(Usuario.rol == Rol.tutor).order_by(Usuario.nombre_completo)
    ).all()
    return [{"id": str(u.id), "nombre": u.nombre_completo} for u in rows]


@router.get("/estudiantes")
def listar_estudiantes(
    user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from ..models.enums import Rol

    rows = db.scalars(
        select(Usuario).where(Usuario.rol == Rol.estudiante).order_by(Usuario.nombre_completo)
    ).all()
    return [{"id": str(u.id), "nombre": u.nombre_completo, "qr_id": str(u.qr_id) if u.qr_id else None} for u in rows]
