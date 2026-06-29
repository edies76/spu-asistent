"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SesionDetalle, TutorOption } from "@/lib/types";
import { Spinner, EmptyState } from "@/components/Feedback";
import SesionCard from "@/components/admin/SesionCard";

interface EstudianteOption { id: string; nombre: string; }

export default function AdminAsistenciasPage() {
  const [sesiones, setSesiones] = useState<SesionDetalle[]>([]);
  const [tutores, setTutores] = useState<TutorOption[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const hayFiltros = !!(desde || hasta || tutorId || estudianteId);

  useEffect(() => {
    Promise.all([
      api.get<TutorOption[]>("/admin/tutores"),
      api.get<EstudianteOption[]>("/admin/estudiantes"),
    ]).then(([t, e]) => { setTutores(t); setEstudiantes(e); });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (tutorId) params.set("tutor_id", tutorId);
      if (estudianteId) params.set("estudiante_id", estudianteId);
      const qs = params.toString();
      const data = await api.get<SesionDetalle[]>(`/admin/asistencias${qs ? `?${qs}` : ""}`);
      setSesiones(data);
    } catch {
      setError("Could not load attendance records.");
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, tutorId, estudianteId]);

  useEffect(() => { cargar(); }, [cargar]);

  function limpiarFiltros() {
    setDesde(""); setHasta(""); setTutorId(""); setEstudianteId("");
  }

  const totalEstudiantes = sesiones.reduce((s, ses) => s + ses.asistencias.length, 0);

  return (
    <div className="space-y-5">

      {/* Cabecera con stats */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Attendance Records</h1>
          {!cargando && (
            <p className="mt-0.5 text-sm text-slate-500">
              {sesiones.length} session{sesiones.length !== 1 ? "s" : ""} · {totalEstudiantes} record{totalEstudiantes !== 1 ? "s" : ""}
              {hayFiltros && <span className="ml-1 text-brand-600">· filtered</span>}
            </p>
          )}
        </div>

        {/* Botón filtros */}
        <button
          onClick={() => setFiltrosOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            hayFiltros
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {hayFiltros && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{[desde, hasta, tutorId, estudianteId].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Panel de filtros */}
      {filtrosOpen && (
        <div className="animate-fadein overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-700">Filter results</p>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="text-xs text-slate-400 hover:text-red-500 transition">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">From</label>
              <input type="date" className="field" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="field" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div>
              <label className="label">Tutor</label>
              <select className="field" value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
                <option value="">All tutors</option>
                {tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Student</label>
              <select className="field" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)}>
                <option value="">All students</option>
                {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-16"><Spinner label="Loading…" /></div>
      ) : sesiones.length === 0 ? (
        <EmptyState mensaje="No sessions match the selected filters." />
      ) : (
        <div className="space-y-3">
          {sesiones.map((s) => <SesionCard key={s.id} sesion={s} />)}
        </div>
      )}
    </div>
  );
}
