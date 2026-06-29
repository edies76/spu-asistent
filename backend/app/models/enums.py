"""Enums del dominio (roles y tipos de sesión)."""
import enum


class Rol(str, enum.Enum):
    estudiante = "estudiante"
    tutor = "tutor"
    administrador = "administrador"


class TipoSesion(str, enum.Enum):
    lab1 = "lab1"
    lab2 = "lab2"
    practice = "practice"
    conversacional = "conversacional"


class Desempeno(str, enum.Enum):
    excellent = "excellent"
    good = "good"
    keep_practicing = "keep_practicing"
    needs_improvement = "needs_improvement"
