// Middleware de protección de rutas (capa de UX).
//
// IMPORTANTE: esto NO es la barrera de seguridad. La autenticación y el rol
// se verifican SIEMPRE en el backend en cada endpoint (cookie httpOnly + 403).
// El middleware solo mejora la experiencia evitando cargar pantallas a las
// que el usuario no tiene acceso, y redirige según las reglas de la sección 6.
//
// Como el JWT va en cookie httpOnly, aquí leemos solo la PRESENCIA del token
// (no su contenido) para distinguir "hay sesión" de "no hay sesión".

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "asistencia_token";

// Rutas públicas.
const PUBLIC_PATHS = ["/login", "/registro"];

function hasToken(req: NextRequest): boolean {
  return Boolean(req.cookies.get(TOKEN_COOKIE)?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const autenticado = hasToken(req);

  // Páginas públicas: si ya está logueado e intenta ir a /login o /registro,
  // lo mandamos a la raíz para que / decida su home por rol.
  if (PUBLIC_PATHS.includes(pathname)) {
    if (autenticado && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Ruta raíz: si no hay sesión -> login.
  if (pathname === "/") {
    if (!autenticado) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Todo lo demás requiere sesión.
  if (!autenticado) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // La verificación fina de rol por ruta (sección 6: estudiante que entra al
  // formulario de asistencia o al panel admin -> pantalla "no tienes acceso")
  // se hace en el propio componente, consultando /auth/me, porque aquí no
  // podemos leer el rol desde la cookie httpOnly.
  return NextResponse.next();
}

export const config = {
  // Aplica a todo salvo archivos estáticos y API interna de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
