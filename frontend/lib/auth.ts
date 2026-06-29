// Helpers de autenticación del lado cliente.
import { api } from "./api";
import type { Usuario } from "./types";

export async function getMe(): Promise<Usuario | null> {
  try {
    return await api.get<Usuario>("/auth/me");
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<Usuario> {
  return api.post<Usuario>("/auth/login", { email, password });
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function register(payload: {
  rol: Usuario["rol"];
  nombre_completo: string;
  fecha_nacimiento: string;
  email: string;
  password: string;
  telefono?: string;
}): Promise<Usuario> {
  return api.post<Usuario>("/auth/register", payload);
}

// Ruta home según rol (usada tras login/registro).
export function homePorRol(rol: Usuario["rol"]): string {
  switch (rol) {
    case "estudiante":
      return "/home";
    case "tutor":
      return "/home";
    case "administrador":
      return "/admin/asistencias";
  }
}
