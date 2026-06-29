"""Seed: datos ricos de demo — 30 días de historial, 27 sesiones, ~90 asistencias."""
from datetime import datetime, timedelta, timezone
import random
import uuid

from sqlalchemy import text

from ..database import SessionLocal, engine, Base
from ..models.enums import Rol, TipoSesion, Desempeno
from ..models.usuario import Usuario
from ..models.sesion import Sesion
from ..models.asistencia import Asistencia
from ..core.security import hash_password

# ── Semilla fija para reproducibilidad ────────────────────────────────────────
random.seed(42)

PASSWORD_SEED = "demo1234"

USUARIOS_SEED = [
    # ── Estudiantes ──────────────────────────────────────────────────────────
    {
        "email": "pepito.perez@gmail.com",
        "nombre_completo": "Pepito Pérez",
        "rol": Rol.estudiante,
        "fecha_nacimiento": datetime(2006, 4, 12).date(),
        "telefono": "+1 809 555 0101",
        "qr_id": uuid.uuid4(),
    },
    {
        "email": "maria.garcia@gmail.com",
        "nombre_completo": "María García",
        "rol": Rol.estudiante,
        "fecha_nacimiento": datetime(2007, 9, 3).date(),
        "telefono": "+1 809 555 0102",
        "qr_id": uuid.uuid4(),
    },
    {
        "email": "luis.mendoza@gmail.com",
        "nombre_completo": "Luis Mendoza",
        "rol": Rol.estudiante,
        "fecha_nacimiento": datetime(2005, 1, 28).date(),
        "telefono": "+1 809 555 0103",
        "qr_id": uuid.uuid4(),
    },
    {
        "email": "ana.rodriguez@gmail.com",
        "nombre_completo": "Ana Rodríguez",
        "rol": Rol.estudiante,
        "fecha_nacimiento": datetime(2008, 6, 15).date(),
        "telefono": "+1 809 555 0104",
        "qr_id": uuid.uuid4(),
    },
    {
        "email": "carlos.lopez@gmail.com",
        "nombre_completo": "Carlos López",
        "rol": Rol.estudiante,
        "fecha_nacimiento": datetime(2006, 11, 7).date(),
        "telefono": "+1 809 555 0105",
        "qr_id": uuid.uuid4(),
    },
    # ── Tutores ───────────────────────────────────────────────────────────────
    {
        "email": "sofia.vargas@gmail.com",
        "nombre_completo": "Sofía Vargas",
        "rol": Rol.tutor,
        "fecha_nacimiento": datetime(1990, 3, 22).date(),
        "telefono": "+1 809 555 0201",
        "qr_id": None,
    },
    {
        "email": "roberto.diaz@gmail.com",
        "nombre_completo": "Roberto Díaz",
        "rol": Rol.tutor,
        "fecha_nacimiento": datetime(1988, 7, 14).date(),
        "telefono": "+1 809 555 0202",
        "qr_id": None,
    },
    {
        "email": "laura.martinez@gmail.com",
        "nombre_completo": "Laura Martínez",
        "rol": Rol.tutor,
        "fecha_nacimiento": datetime(1992, 12, 5).date(),
        "telefono": "+1 809 555 0203",
        "qr_id": None,
    },
    # ── Admin ─────────────────────────────────────────────────────────────────
    {
        "email": "admin@demo.com",
        "nombre_completo": "Admin Bamba",
        "rol": Rol.administrador,
        "fecha_nacimiento": datetime(1985, 1, 1).date(),
        "telefono": "+1 809 555 0001",
        "qr_id": None,
    },
]

# ── Notas realistas por desempeño ─────────────────────────────────────────────
NOTAS_POR_DESEMPENO: dict[Desempeno, list[str | None]] = {
    Desempeno.excellent: [
        "Demostró dominio completo del tema tratado.",
        "Participación sobresaliente, respondió todas las preguntas.",
        "Excelente pronunciación y fluidez verbal.",
        "Lideró la actividad grupal con confianza.",
        "Superó las expectativas de la sesión.",
    ],
    Desempeno.good: [
        "Buen ritmo de trabajo, completó los ejercicios a tiempo.",
        "Participó activamente, algunos errores menores de gramática.",
        "Progreso notable respecto a la sesión anterior.",
        "Entiende los conceptos, necesita más práctica oral.",
        None,  # algunas asistencias sin nota
    ],
    Desempeno.keep_practicing: [
        "Necesita repasar los verbos irregulares.",
        "Comprende el tema pero titubea al hablar.",
        "Se recomienda practicar en casa con los materiales dados.",
        "Errores recurrentes en el uso del pretérito.",
        "Buena actitud, falta consolidar el vocabulario nuevo.",
    ],
    Desempeno.needs_improvement: [
        "Poca participación durante la sesión, se muestra inseguro.",
        "No completó los ejercicios; necesita apoyo adicional.",
        "Dificultad para seguir el ritmo del grupo.",
        "Se recomienda sesión de refuerzo individual.",
        None,  # algunas sin nota
    ],
}

# ── Definición de 27 sesiones: (días_atrás, hora_inicio, tipo, tutor_email, num_estudiantes)
# Distribuidas entre los 3 tutores; tipos variados; 2-4 estudiantes por sesión
SESIONES_PLAN = [
    # Semana -4 (días 29-23 atrás)
    (-29, 9,  TipoSesion.lab1,          "sofia.vargas@gmail.com",   3),
    (-28, 14, TipoSesion.conversacional, "roberto.diaz@gmail.com",  2),
    (-27, 10, TipoSesion.practice,       "laura.martinez@gmail.com", 4),
    (-26, 9,  TipoSesion.lab2,           "sofia.vargas@gmail.com",   3),
    (-25, 15, TipoSesion.lab1,           "roberto.diaz@gmail.com",   2),
    (-24, 11, TipoSesion.conversacional, "laura.martinez@gmail.com", 3),
    (-23, 9,  TipoSesion.practice,       "sofia.vargas@gmail.com",   4),
    # Semana -3 (días 22-16 atrás)
    (-22, 10, TipoSesion.lab1,           "roberto.diaz@gmail.com",   3),
    (-21, 14, TipoSesion.lab2,           "laura.martinez@gmail.com", 2),
    (-20, 9,  TipoSesion.conversacional, "sofia.vargas@gmail.com",   4),
    (-19, 11, TipoSesion.practice,       "roberto.diaz@gmail.com",   3),
    (-18, 10, TipoSesion.lab1,           "laura.martinez@gmail.com", 2),
    (-17, 9,  TipoSesion.lab2,           "sofia.vargas@gmail.com",   3),
    (-16, 15, TipoSesion.conversacional, "roberto.diaz@gmail.com",   4),
    # Semana -2 (días 15-9 atrás)
    (-15, 9,  TipoSesion.practice,       "laura.martinez@gmail.com", 3),
    (-14, 10, TipoSesion.lab1,           "sofia.vargas@gmail.com",   2),
    (-13, 14, TipoSesion.lab2,           "roberto.diaz@gmail.com",   4),
    (-12, 9,  TipoSesion.conversacional, "laura.martinez@gmail.com", 3),
    (-11, 11, TipoSesion.practice,       "sofia.vargas@gmail.com",   2),
    (-10, 9,  TipoSesion.lab1,           "roberto.diaz@gmail.com",   4),
    (-9,  15, TipoSesion.lab2,           "laura.martinez@gmail.com", 3),
    # Semana -1 (días 8-1 atrás)
    (-8,  10, TipoSesion.conversacional, "sofia.vargas@gmail.com",   3),
    (-7,  9,  TipoSesion.practice,       "roberto.diaz@gmail.com",   2),
    (-6,  14, TipoSesion.lab1,           "laura.martinez@gmail.com", 4),
    (-5,  9,  TipoSesion.lab2,           "sofia.vargas@gmail.com",   3),
    (-3,  11, TipoSesion.conversacional, "roberto.diaz@gmail.com",   4),
    (-1,  10, TipoSesion.practice,       "laura.martinez@gmail.com", 2),
]

EMAILS_ESTUDIANTES = [
    "pepito.perez@gmail.com",
    "maria.garcia@gmail.com",
    "luis.mendoza@gmail.com",
    "ana.rodriguez@gmail.com",
    "carlos.lopez@gmail.com",
]


def _pick_estudiantes(todos: list[Usuario], n: int) -> list[Usuario]:
    """Selecciona n estudiantes distintos de forma pseudoaleatoria."""
    return random.sample(todos, min(n, len(todos)))


def _pick_desempeno() -> Desempeno:
    """Distribución realista: más buenos/excelentes que malos."""
    return random.choices(
        list(Desempeno),
        weights=[25, 40, 25, 10],  # excellent, good, keep_practicing, needs_improvement
        k=1,
    )[0]


def _pick_nota(desempeno: Desempeno) -> str | None:
    return random.choice(NOTAS_POR_DESEMPENO[desempeno])


def _maybe_editado(ahora: datetime) -> datetime | None:
    """30 % de asistencias tienen fecha de edición por admin."""
    if random.random() < 0.30:
        return ahora + timedelta(hours=random.randint(1, 48))
    return None


def _maybe_firma() -> str | None:
    """40 % de asistencias tienen firma (base64 simulado corto)."""
    if random.random() < 0.40:
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    return None


def bootstrap() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Limpiar todos los datos anteriores ────────────────────────────────
        db.execute(text("TRUNCATE asistencias, sesiones, usuarios RESTART IDENTITY CASCADE"))
        db.commit()

        # ── Crear usuarios ────────────────────────────────────────────────────
        usuarios_por_email: dict[str, Usuario] = {}
        for u in USUARIOS_SEED:
            user = Usuario(
                nombre_completo=u["nombre_completo"],
                fecha_nacimiento=u["fecha_nacimiento"],
                email=u["email"],
                telefono=u["telefono"],
                password_hash=hash_password(PASSWORD_SEED),
                rol=u["rol"],
                qr_id=u["qr_id"],
            )
            db.add(user)
            usuarios_por_email[u["email"]] = user
        db.commit()

        estudiantes = [usuarios_por_email[e] for e in EMAILS_ESTUDIANTES]
        ahora = datetime.now(timezone.utc)

        total_sesiones = 0
        total_asistencias = 0

        # ── Generar sesiones ──────────────────────────────────────────────────
        for dias, hora, tipo, tutor_email, n_estudiantes in SESIONES_PLAN:
            tutor = usuarios_por_email[tutor_email]
            inicio = (ahora + timedelta(days=dias)).replace(
                hour=hora, minute=0, second=0, microsecond=0
            )
            duracion_min = random.randint(40, 75)
            ultima_act = inicio + timedelta(minutes=duracion_min)

            sesion = Sesion(
                tipo=tipo,
                tutor_id=tutor.id,
                iniciada_en=inicio,
                ultima_actividad_en=ultima_act,
            )
            db.add(sesion)
            db.flush()  # obtiene sesion.id

            participantes = _pick_estudiantes(estudiantes, n_estudiantes)
            for est in participantes:
                desempeno = _pick_desempeno()
                creado_en = inicio + timedelta(minutes=random.randint(5, duracion_min))
                editado_en = _maybe_editado(creado_en)
                firma = _maybe_firma()

                asistencia = Asistencia(
                    sesion_id=sesion.id,
                    estudiante_id=est.id,
                    desempeno=desempeno,
                    notas=_pick_nota(desempeno),
                    firma=firma,
                    creado_en=creado_en,
                    editado_en=editado_en,
                )
                db.add(asistencia)
                total_asistencias += 1

            total_sesiones += 1

        db.commit()

        print("[seed] Datos de demo cargados exitosamente:")
        print(f"  Usuarios:     {len(USUARIOS_SEED)} (5 estudiantes, 3 tutores, 1 admin)")
        print(f"  Sesiones:     {total_sesiones} distribuidas en los últimos 30 días")
        print(f"  Asistencias:  {total_asistencias} con desempeños variados")
        print("  Password:     demo1234")
        print()
        print("  Estudiantes:")
        for e in EMAILS_ESTUDIANTES:
            print(f"    - {e}")
        print("  Tutores:")
        for t in ["sofia.vargas@gmail.com", "roberto.diaz@gmail.com", "laura.martinez@gmail.com"]:
            print(f"    - {t}")
        print("  Admin:        admin@demo.com")

    finally:
        db.close()
