"""Configuración de la aplicación (variables de entorno con defaults)."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Base de datos ---
    database_url: str = "postgresql+psycopg2://asistencia:asistencia_pwd@localhost:5432/asistencia"

    # --- JWT / Auth ---
    jwt_secret: str = "cambia_esto_en_produccion_por_un_secreto_largo"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 días

    # Cookie httpOnly
    cookie_name: str = "asistencia_token"
    cookie_secure: bool = False            # True en producción (HTTPS)
    cookie_samesite: str = "lax"

    # --- CORS ---
    # Orígenes permitidos separados por coma en la variable de entorno.
    frontend_origin: str = "http://localhost:3000"

    # --- Reglas de negocio (sección 7) ---
    active_session_window_min: int = 20    # ventana para sesión "activa"
    last_type_memory_hours: int = 10       # memoria de último tipo usado

    # --- Seed ---
    run_seed: bool = False                 # ejecutar seed al arrancar

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
