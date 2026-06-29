"""Dependencias de FastAPI: autenticación y autorización por rol.

El backend es la única barrera autoritativa. El frontend nunca es suficiente.
"""
from typing import Iterable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.usuario import Usuario
from .security import decode_token


CREDENTIAL_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="no_autenticado",
)


def _read_token(request: Request) -> str | None:
    """Lee el JWT desde la cookie httpOnly configurada."""
    return request.cookies.get(settings.cookie_name)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    token = _read_token(request)
    if not token:
        raise CREDENTIAL_ERROR

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise CREDENTIAL_ERROR

    try:
        user_id = payload["sub"]
    except (KeyError, ValueError):
        raise CREDENTIAL_ERROR

    user = db.get(Usuario, user_id)
    if not user:
        raise CREDENTIAL_ERROR
    return user


def require_role(*roles: str):
    """Factory de dependencia: exige que el rol del usuario esté en `roles`.

    Devuelve 403 con un payload claro que el frontend usa para redirigir:
        {"detail": "rol_insuficiente", "roles_permitidos": [...]}
    """

    def _checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.rol.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "detail": "rol_insuficiente",
                    "roles_permitidos": list(roles),
                },
            )
        return user

    return _checker


# Dependencias reutilizables por rol.
require_estudiante = require_role("estudiante")
require_tutor = require_role("tutor")
require_admin = require_role("administrador")
require_tutor_o_admin = require_role("tutor", "administrador")
