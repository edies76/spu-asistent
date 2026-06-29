"""Endpoints de autenticación: registro (3 fases), login, logout, me."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.enums import Rol
from ..models.usuario import Usuario
from ..core.security import create_access_token, hash_password, verify_password
from ..core.deps import get_current_user
from ..schemas.auth import RegistroIn, LoginIn, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegistroIn, response: Response, db: Session = Depends(get_db)):
    """
    Registro de usuario (fase 3 del flujo de 3 fases del frontend).

    NOTA DE SEGURIDAD / TODO:
    Por decisión del cliente, el registro está ABIERTO para los tres roles
    en esta versión. La recomendación del pliego (verificar un código de
    invitación o aprobación de un admin para tutor/administrador) queda
    pendiente. Cuando se active, añadir aquí la verificación del rol
    elevado SIN tocar el resto del sistema.
    """
    # Email único
    exists = db.scalar(select(Usuario).where(Usuario.email == payload.email))
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "email_en_uso"},
        )

    user = Usuario(
        nombre_completo=payload.nombre_completo,
        fecha_nacimiento=payload.fecha_nacimiento,
        email=payload.email,
        telefono=payload.telefono,
        password_hash=hash_password(payload.password),
        rol=payload.rol,
    )
    # El qr_id (UUID v4 impredecible) solo aplica a estudiantes.
    if payload.rol == Rol.estudiante:
        import uuid
        user.qr_id = uuid.uuid4()

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(sub=str(user.id), rol=user.rol.value)
    _set_auth_cookie(response, token)
    return user


@router.post("/login", response_model=UsuarioOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(Usuario).where(Usuario.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "credenciales_invalidas"},
        )

    token = create_access_token(sub=str(user.id), rol=user.rol.value)
    _set_auth_cookie(response, token)
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=settings.cookie_name, path="/", samesite=settings.cookie_samesite
    )
    return {"ok": True}


@router.get("/me", response_model=UsuarioOut)
def me(user: Usuario = Depends(get_current_user)):
    return user
