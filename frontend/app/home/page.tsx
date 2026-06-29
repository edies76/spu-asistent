"use client";

// Home unificado: /home despacha a la pantalla de estudiante o tutor según rol.
// (administrador no pasa por aquí: su home es /admin/asistencias.)

import RoleGate from "@/components/RoleGate";
import EstudianteHome from "@/components/estudiante/EstudianteHome";
import TutorHome from "@/components/tutor/TutorHome";

export default function HomePage() {
  return (
    <RoleGate roles={["estudiante", "tutor"]}>
      {(user) =>
        user.rol === "estudiante" ? <EstudianteHome user={user} /> : <TutorHome user={user} />
      }
    </RoleGate>
  );
}
