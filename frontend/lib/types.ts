// Tipos compartidos que reflejan los esquemas del backend.

export type Rol = "estudiante" | "tutor" | "administrador";

export type TipoSesion = "lab1" | "lab2" | "practice" | "conversacional";

export type Desempeno = "excellent" | "good" | "keep_practicing" | "needs_improvement";

export const DESEMPENO_OPCIONES: { value: Desempeno; label: string; emoji: string }[] = [
  { value: "excellent",         label: "Excellent",         emoji: "🌟" },
  { value: "good",              label: "Good",               emoji: "👍" },
  { value: "keep_practicing",   label: "Keep Practicing",    emoji: "💪" },
  { value: "needs_improvement", label: "Needs Improvement",  emoji: "📚" },
];

export interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
  rol: Rol;
  telefono?: string | null;
  fecha_nacimiento: string;
  qr_id?: string | null;
  creado_en: string;
}

export interface Sesion {
  id: string;
  tipo: TipoSesion;
  tutor_id: string;
  iniciada_en: string;
  ultima_actividad_en: string;
  n_estudiantes: number;
}

export interface SesionConEstudiantes {
  id: string;
  tipo: TipoSesion;
  iniciada_en: string;
  n_estudiantes: number;
  estudiantes: { nombre_completo: string }[];
}

export interface SesionActiva {
  activa: boolean;
  sesion: SesionConEstudiantes | null;
  tipo_sugerido: TipoSesion | null;
}

export interface Asistencia {
  id: string;
  sesion_id: string;
  estudiante_id: string;
  estudiante_nombre: string;
  desempeno?: Desempeno | null;
  notas?: string | null;
  firma?: string | null;
  creado_en: string;
  editado_en?: string | null;
}

export interface EstudianteQr {
  estudiante_id: string;
  nombre_completo: string;
  qr_id: string;
}

export interface SesionDetalle {
  id: string;
  tipo: TipoSesion;
  tutor_id: string;
  tutor_nombre: string;
  iniciada_en: string;
  ultima_actividad_en: string;
  asistencias: Asistencia[];
}

export interface CalendarioSesion {
  id: string;
  tipo: TipoSesion;
  tutor_id: string;
  tutor_nombre: string;
  iniciada_en: string;
}

export interface CalendarioRespuesta {
  anio: number;
  mes: number;
  sesiones: CalendarioSesion[];
}

export interface TutorOption {
  id: string;
  nombre: string;
}

// Etiquetas legibles para los tipos de sesión.
export const TIPOS_SESION: { value: TipoSesion; label: string }[] = [
  { value: "lab1", label: "Lab 1" },
  { value: "lab2", label: "Lab 2" },
  { value: "practice", label: "Practice" },
  { value: "conversacional", label: "Conversacional" },
];

export function labelTipo(t: TipoSesion): string {
  return TIPOS_SESION.find((x) => x.value === t)?.label ?? t;
}
