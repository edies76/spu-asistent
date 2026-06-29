"use client";

// Calendario mensual del panel admin (sección 8):
// - Indicadores de sesión por día, coloreados por tutor.
// - Filtro de tutores con casillas: desmarcando un tutor oculta sus sesiones.
// - Click en día → modal de detalle del día.
// - Click en indicador de sesión → abre directamente el detalle de esa sesión.

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarioRespuesta, CalendarioSesion, SesionDetalle, TutorOption } from "@/lib/types";
import { labelTipo } from "@/lib/types";
import { colorTutor } from "@/lib/tutorColor";
import { Spinner, ErrorBox } from "@/components/Feedback";
import SesionCard from "./SesionCard";

// ─── Helpers ────────────────────────────────────────────────────────────────

function diasEnMes(anio: number, mes: number) {
  return new Date(anio, mes, 0).getDate(); // mes es 1-indexed
}

function primerDiaSemana(anio: number, mes: number) {
  // 0=Dom, reordenamos a 0=Lun
  const d = new Date(anio, mes - 1, 1).getDay();
  return (d + 6) % 7;
}

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function isoFecha(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// ─── Modal día ───────────────────────────────────────────────────────────────

function ModalDia({
  sesiones,
  onClose,
  onSesion,
}: {
  sesiones: CalendarioSesion[];
  onClose: () => void;
  onSesion: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fadein"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Sesiones del día</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sesiones.map((s) => {
            const color = colorTutor(s.tutor_id);
            return (
              <button
                key={s.id}
                onClick={() => onSesion(s.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:bg-brand-50 transition"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: color.bg }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{labelTipo(s.tipo)}</p>
                  <p className="text-xs text-slate-500">{s.tutor_nombre}</p>
                </div>
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(s.iniciada_en).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Modal sesión detalle ─────────────────────────────────────────────────────

function ModalSesion({
  sesionId,
  onClose,
}: {
  sesionId: string;
  onClose: () => void;
}) {
  const [sesion, setSesion] = useState<SesionDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SesionDetalle>(`/admin/sesiones/${sesionId}`)
      .then(setSesion)
      .catch(() => setError("No se pudo cargar el detalle."))
      .finally(() => setCargando(false));
  }, [sesionId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fadein max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Detalle de sesión</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {cargando && (
          <div className="flex justify-center py-8">
            <Spinner label="Cargando…" />
          </div>
        )}
        {error && <ErrorBox mensaje={error} />}
        {sesion && <SesionCard sesion={sesion} />}
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function CalendarioMes() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1); // 1-indexed
  const [datos, setDatos] = useState<CalendarioRespuesta | null>(null);
  const [tutores, setTutores] = useState<TutorOption[]>([]);
  const [tutoresVisibles, setTutoresVisibles] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal estado
  const [diaModal, setDiaModal] = useState<string | null>(null); // ISO fecha
  const [sesionModal, setSesionModal] = useState<string | null>(null); // sesion id

  // Cargar tutores al montar.
  useEffect(() => {
    api.get<TutorOption[]>("/admin/tutores").then((t) => {
      setTutores(t);
      setTutoresVisibles(new Set(t.map((x) => x.id)));
    });
  }, []);

  const cargarMes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await api.get<CalendarioRespuesta>(
        `/admin/calendario?anio=${anio}&mes=${mes}`
      );
      setDatos(data);
    } catch {
      setError("No se pudo cargar el calendario.");
    } finally {
      setCargando(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    cargarMes();
  }, [cargarMes]);

  function navMes(delta: number) {
    let nm = mes + delta;
    let na = anio;
    if (nm < 1) { nm = 12; na--; }
    if (nm > 12) { nm = 1; na++; }
    setMes(nm);
    setAnio(na);
  }

  function toggleTutor(id: string) {
    setTutoresVisibles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Sesiones del mes filtradas por tutores visibles.
  const sesionesFiltradas = (datos?.sesiones ?? []).filter(
    (s) => tutoresVisibles.has(s.tutor_id)
  );

  // Agrupar por día ISO.
  const porDia = new Map<string, CalendarioSesion[]>();
  for (const s of sesionesFiltradas) {
    const d = s.iniciada_en.slice(0, 10);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(s);
  }

  const nDias = diasEnMes(anio, mes);
  const offset = primerDiaSemana(anio, mes);

  const sesionesDelDia = diaModal ? (porDia.get(diaModal) ?? []) : [];

  return (
    <div>
      {/* Nav mes */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navMes(-1)} className="btn-secondary px-4 py-2 text-sm">‹</button>
        <h2 className="text-lg font-bold text-slate-800">
          {MESES[mes - 1]} {anio}
        </h2>
        <button onClick={() => navMes(1)} className="btn-secondary px-4 py-2 text-sm">›</button>
      </div>

      {/* Filtro tutores */}
      {tutores.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tutores.map((t) => {
            const color = colorTutor(t.id);
            const visible = tutoresVisibles.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTutor(t.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  visible
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
                style={visible ? { background: color.bg } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: visible ? "white" : color.bg, opacity: visible ? 0.6 : 1 }}
                />
                {t.nombre.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {error && <ErrorBox mensaje={error} />}

      {/* Grilla calendario */}
      <div className="card overflow-hidden">
        {/* Cabecera días semana */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <Spinner label="Cargando calendario…" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Celdas vacías de offset */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`off-${i}`} className="min-h-[72px] border-b border-r border-slate-100 bg-slate-50/50" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: nDias }, (_, i) => i + 1).map((dia) => {
              const iso = isoFecha(anio, mes, dia);
              const sesiones = porDia.get(iso) ?? [];
              const esHoy =
                hoy.getFullYear() === anio &&
                hoy.getMonth() + 1 === mes &&
                hoy.getDate() === dia;

              return (
                <div
                  key={dia}
                  onClick={() => sesiones.length > 0 && setDiaModal(iso)}
                  className={`min-h-[72px] border-b border-r border-slate-100 p-1.5 transition ${
                    sesiones.length > 0
                      ? "cursor-pointer hover:bg-brand-50"
                      : "cursor-default"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                      esHoy
                        ? "bg-brand-600 font-bold text-white"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {dia}
                  </span>

                  {/* Indicadores de sesión */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sesiones.slice(0, 3).map((s) => {
                      const color = colorTutor(s.tutor_id);
                      return (
                        <button
                          key={s.id}
                          title={`${labelTipo(s.tipo)} — ${s.tutor_nombre}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSesionModal(s.id);
                          }}
                          className="h-2.5 w-2.5 rounded-full transition hover:scale-125"
                          style={{ background: color.bg }}
                        />
                      );
                    })}
                    {sesiones.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        +{sesiones.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal lista del día */}
      {diaModal && sesionesDelDia.length > 0 && (
        <ModalDia
          sesiones={sesionesDelDia}
          onClose={() => setDiaModal(null)}
          onSesion={(id) => {
            setDiaModal(null);
            setSesionModal(id);
          }}
        />
      )}

      {/* Modal detalle de sesión */}
      {sesionModal && (
        <ModalSesion
          sesionId={sesionModal}
          onClose={() => setSesionModal(null)}
        />
      )}
    </div>
  );
}
