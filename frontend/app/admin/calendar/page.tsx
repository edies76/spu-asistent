"use client";

import CalendarioMes from "@/components/admin/CalendarioMes";

export default function AdminCalendarioPage() {
  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-slate-800">Calendario de sesiones</h1>
      <CalendarioMes />
    </div>
  );
}
