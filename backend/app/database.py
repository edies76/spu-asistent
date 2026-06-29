"""Configuración de SQLAlchemy y sesión de base de datos."""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


class Base(DeclarativeBase):
    """Clase base declarativa para todos los modelos."""
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: provee una sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
