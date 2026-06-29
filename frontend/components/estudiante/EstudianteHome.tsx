"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Usuario } from "@/lib/types";
import QrCard from "@/components/qr/QrCard";
import Header from "@/components/Header";

export default function EstudianteHome({ user }: { user: Usuario }) {
  const [qrId, setQrId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ qr_id: string }>("/estudiantes/me/qr");
        setQrId(data.qr_id);
      } catch {
        setQrId(null);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const nombre = user.nombre_completo.split(" ")[0];

  return (
    <>
      <Header user={user} />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col items-center px-5 py-10">
        <div className="w-full animate-fadein space-y-6">

          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">Hola, {nombre} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">
              Muestra tu QR al tutor al inicio de cada clase.
            </p>
          </div>

          <QrCard qrId={qrId} nombre={user.nombre_completo} cargando={cargando} />

          <div className="rounded-2xl border border-slate-100 bg-white/80 px-5 py-4">
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              Este código es único y personal. El tutor lo escaneará para registrar tu asistencia automáticamente.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
