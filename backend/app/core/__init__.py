"""Paquete core."""
from .security import hash_password, verify_password, create_access_token, decode_token
from .deps import (
    get_current_user,
    require_role,
    require_estudiante,
    require_tutor,
    require_admin,
    require_tutor_o_admin,
)

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_token",
    "get_current_user",
    "require_role",
    "require_estudiante",
    "require_tutor",
    "require_admin",
    "require_tutor_o_admin",
]
