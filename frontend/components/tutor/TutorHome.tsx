"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { TipoSesion, SesionActiva } from "@/lib/types";
import { labelTipo } from "@/lib/types";
import type { Usuario } from "@/lib/types";
import Header from "@/components/Header";

// ── Iconos por tipo de sesión ────────────────────────────────────────────────
const TIPO_ICONO: Record<TipoSesion, { emoji: string; color: string; bg: string }> = {
  lab1:          { emoji: "🧪", color: "text-violet-700", bg: "bg-violet-100" },
  lab2:          { emoji: "⚗️",  color: "text-indigo-700", bg: "bg-indigo-100" },
  practice:      { emoji: "✏️",  color: "text-amber-700",  bg: "bg-amber-100"  },
  conversacional:{ emoji: "💬", color: "text-emerald-700", bg: "bg-emerald-100"},
};

interface SesionResumen {
  id: string;
  tipo: TipoSesion;
  iniciada_en: string;
  n_estudiantes: number;
  estudiantes: { nombre_completo: string }[];
}

interface SesionActivaResp {
  activa: boolean;
  sesion: SesionResumen | null;
  tipo_sugerido: TipoSesion | null;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ── Tarjeta de sesión expandible ─────────────────────────────────────────────
function SesionCard({ sesion, activa = false }: { sesion: SesionResumen; activa?: boolean }) {
  const [open, setOpen] = useState(activa); // activa empieza abierta
  const icono = TIPO_ICONO[sesion.tipo];

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        activa
          ? "border-brand-200 bg-brand-50 shadow-soft"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${icono.bg}`}>
          {icono.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${activa ? "text-brand-800" : "text-slate-800"}`}>
              {labelTipo(sesion.tipo)}
            </p>
            {activa && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Activa
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatHora(sesion.iniciada_en)} · {sesion.n_estudiantes} estudiante{sesion.n_estudiantes !== 1 ? "s" : ""}
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && sesion.estudiantes.length > 0 && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {sesion.estudiantes.map((e, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {e.nombre_completo}
              </span>
            ))}
          </div>
        </div>
      )}

      {open && sesion.estudiantes.length === 0 && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2.5">
          <p className="text-xs text-slate-400">Sin asistencias registradas aún.</p>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TutorHome({ user }: { user: Usuario }) {
  const nombre = user.nombre_completo.split(" ")[0];
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const [sesionActiva, setSesionActiva] = useState<SesionResumen | null>(null);
  const [recientes, setRecientes] = useState<SesionResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [activa, rec] = await Promise.all([
          api.get<SesionActivaResp>("/sesiones/activa"),
          api.get<SesionResumen[]>("/sesiones/recientes"),
        ]);
        setSesionActiva(activa.activa && activa.sesion ? activa.sesion : null);
        setRecientes(rec);
      } catch {
        // silencioso
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-md px-5 py-8">
        <div className="animate-fadein space-y-6">

          {/* Saludo */}
          <div className="text-center">
            <p className="text-sm font-medium text-brand-600">{saludo}</p>
            <h1 className="mt-0.5 text-3xl font-bold text-slate-800">{nombre} 👋</h1>
          </div>

          {/* Botón escanear */}
          <Link
            href="/escanear"
            className="group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-12 text-white shadow-[0_8px_32px_rgba(47,99,245,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(47,99,245,0.5)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/30">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div className="relative text-center">
              <p className="text-xl font-bold">Escanear código QR</p>
              <p className="mt-1 text-sm text-white/75">Registra la asistencia de un estudiante</p>
            </div>
          </Link>

          {/* Sesión activa */}
          {!cargando && sesionActiva && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sesión en curso</p>
              <SesionCard sesion={sesionActiva} activa />
            </div>
          )}

          {/* Sesiones recientes (últimas 24h, sin activa) */}
          {!cargando && recientes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Últimas 24 horas</p>
              <div className="space-y-2">
                {recientes.map((s) => (
                  <SesionCard key={s.id} sesion={s} />
                ))}
              </div>
            </div>
          )}

          {/* Skeleton mientras carga */}
          {cargando && (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          )}

        </div>
      </main>
    </>
  );
}
