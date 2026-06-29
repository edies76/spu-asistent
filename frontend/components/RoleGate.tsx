"use client";

// Componente de protección por rol en el cliente.
//
// Se usa dentro de cada página protegida. Consulta /auth/me:
//  - sin sesión -> redirige a /login
//  - rol no permitido -> pantalla breve "Eres X, no tienes acceso a esta sección"
//    (un solo mensaje, sin más contenido) — sección 6.
//  - ok -> renderiza children con el usuario inyectado.
//
// Refuerza el middleware: aunque el middleware no leyó el rol (cookie httpOnly),
// este componente sí lo obtiene vía API y aplica la regla fina por ruta.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import type { Rol, Usuario } from "@/lib/types";
import { LoadingScreen } from "./Feedback";

export default function RoleGate({
  roles,
  children,
}: {
  roles: Rol[];
  children: (user: Usuario) => React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [denegado, setDenegado] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const u = await getMe();
      if (!vivo) return;
      if (!u) {
        router.replace("/login");
        return;
      }
      if (!roles.includes(u.rol)) {
        setDenegado(u.rol);
        setCargando(false);
        return;
      }
      setUser(u);
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [router, roles]);

  if (cargando) return <LoadingScreen />;
  if (denegado) {
    const frase: Record<Rol, string> = {
      estudiante: "Eres estudiante, no tienes acceso a esta sección.",
      tutor: "Eres tutor, no tienes acceso a esta sección.",
      administrador: "Eres administrador, no tienes acceso a esta sección.",
    };
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">{frase[denegado]}</p>
        </div>
      </main>
    );
  }
  if (!user) return <LoadingScreen />;
  return <>{children(user)}</>;
}
