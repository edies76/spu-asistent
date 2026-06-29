"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarioRespuesta, CalendarioSesion, SesionDetalle, TutorOption } from "@/lib/types";
import { labelTipo, DESEMPENO_OPCIONES, type TipoSesion } from "@/lib/types";
import { colorTutor } from "@/lib/tutorColor";
import { Spinner } from "@/components/Feedback";
import SesionCard from "./SesionCard";

// ── Helpers ──────────────────────────────────────────────────────────────────

function diasEnMes(a: number, m: number) { return new Date(a, m, 0).getDate(); }
function primerDiaSemana(a: number, m: number) { return (new Date(a, m - 1, 1).getDay() + 6) % 7; }
function isoFecha(a: number, m: number, d: number) {
  return `${a}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function formatFechaLarga(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const TIPO_ICONO: Record<TipoSesion, string> = {
  lab1: "🎧", lab2: "✍️", practice: "🗣️", conversacional: "💬",
};

// ── Panel de día (pantalla completa sobre el calendario) ──────────────────────

function PanelDia({
  iso,
  sesiones,
  onClose,
}: {
  iso: string;
  sesiones: CalendarioSesion[];
  onClose: () => void;
}) {
  const [sesionDetalle, setSesionDetalle] = useState<SesionDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  async function toggleSesion(id: string) {
    if (expandidos.has(id)) {
      setExpandidos(prev => { const n = new Set(prev); n.delete(id); return n; });
      return;
    }
    setCargandoDetalle(id);
    try {
      const d = await api.get<SesionDetalle>(`/admin/sesiones/${id}`);
      setSesionDetalle(d);
      setExpandidos(prev => new Set([...prev, id]));
    } finally {
      setCargandoDetalle(null);
    }
  }

  // cache de detalles
  const [cache, setCache] = useState<Record<string, SesionDetalle>>({});
  async function toggleSesionCached(id: string) {
    if (expandidos.has(id)) {
      setExpandidos(prev => { const n = new Set(prev); n.delete(id); return n; });
      return;
    }
    if (!cache[id]) {
      setCargandoDetalle(id);
      try {
        const d = await api.get<SesionDetalle>(`/admin/sesiones/${id}`);
        setCache(prev => ({ ...prev, [id]: d }));
      } finally {
        setCargandoDetalle(null);
      }
    }
    setExpandidos(prev => new Set([...prev, id]));
  }

  // Agrupar por tutor
  const porTutor = new Map<string, { nombre: string; sesiones: CalendarioSesion[] }>();
  for (const s of sesiones) {
    if (!porTutor.has(s.tutor_id)) porTutor.set(s.tutor_id, { nombre: s.tutor_nombre, sesiones: [] });
    porTutor.get(s.tutor_id)!.sesiones.push(s);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-fadein">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Calendario
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-800 capitalize">{formatFechaLarga(iso)}</h2>
          <p className="text-xs text-slate-500">
            {sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""} · {[...new Set(sesiones.map(s => s.tutor_id))].length} tutor{[...new Set(sesiones.map(s => s.tutor_id))].length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
          {[...porTutor.entries()].map(([tutorId, { nombre, sesiones: ss }]) => {
            const color = colorTutor(tutorId);
            return (
              <div key={tutorId}>
                {/* Cabecera tutor */}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: color.bg }}
                  >
                    {nombre.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{nombre}</p>
                    <p className="text-xs text-slate-500">{ss.length} sesión{ss.length !== 1 ? "es" : ""} este día</p>
                  </div>
                </div>

                {/* Sesiones del tutor */}
                <div className="space-y-2 pl-12">
                  {ss.map(s => {
                    const abierto = expandidos.has(s.id);
                    const detalle = cache[s.id];
                    const cargando = cargandoDetalle === s.id;

                    return (
                      <div key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <button
                          onClick={() => toggleSesionCached(s.id)}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition"
                        >
                          <span className="text-xl shrink-0">{TIPO_ICONO[s.tipo]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">{labelTipo(s.tipo)}</p>
                            <p className="text-xs text-slate-500">{formatHora(s.iniciada_en)}</p>
                          </div>
                          {cargando ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
                          ) : (
                            <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>

                        {abierto && detalle && (
                          <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 animate-fadein">
                            {detalle.asistencias.length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-2">Sin asistencias registradas.</p>
                            ) : (
                              <div className="space-y-2">
                                {detalle.asistencias.map(a => {
                                  const d = a.desempeno ? DESEMPENO_OPCIONES.find(op => op.value === a.desempeno) : null;
                                  return (
                                    <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                        {a.estudiante_nombre.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">{a.estudiante_nombre}</p>
                                        {a.notas && <p className="text-xs text-slate-500 truncate">{a.notas}</p>}
                                      </div>
                                      {d && (
                                        <span className="shrink-0 text-base" title={d.label}>{d.emoji}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalendarioMes() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [datos, setDatos] = useState<CalendarioRespuesta | null>(null);
  const [tutores, setTutores] = useState<TutorOption[]>([]);
  const [tutoresVisibles, setTutoresVisibles] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    api.get<TutorOption[]>("/admin/tutores").then(t => {
      setTutores(t);
      setTutoresVisibles(new Set(t.map(x => x.id)));
    });
  }, []);

  const cargarMes = useCallback(async () => {
    setCargando(true);
    try {
      const data = await api.get<CalendarioRespuesta>(`/admin/calendario?anio=${anio}&mes=${mes}`);
      setDatos(data);
    } finally {
      setCargando(false);
    }
  }, [anio, mes]);

  useEffect(() => { cargarMes(); }, [cargarMes]);

  function navMes(delta: number) {
    let nm = mes + delta, na = anio;
    if (nm < 1) { nm = 12; na--; }
    if (nm > 12) { nm = 1; na++; }
    setMes(nm); setAnio(na);
  }

  function toggleTutor(id: string) {
    setTutoresVisibles(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const sesionesFiltradas = (datos?.sesiones ?? []).filter(s => tutoresVisibles.has(s.tutor_id));
  const porDia = new Map<string, CalendarioSesion[]>();
  for (const s of sesionesFiltradas) {
    const d = s.iniciada_en.slice(0, 10);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(s);
  }

  const nDias = diasEnMes(anio, mes);
  const offset = primerDiaSemana(anio, mes);

  const sesionesDelDia = diaSeleccionado ? (porDia.get(diaSeleccionado) ?? []) : [];

  return (
    <>
      <div className="space-y-4">
        {/* Nav mes */}
        <div className="flex items-center justify-between">
          <button onClick={() => navMes(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition text-lg">‹</button>
          <h2 className="text-lg font-bold text-slate-800">{MESES[mes - 1]} {anio}</h2>
          <button onClick={() => navMes(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition text-lg">›</button>
        </div>

        {/* Filtro tutores */}
        {tutores.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tutores.map(t => {
              const color = colorTutor(t.id);
              const visible = tutoresVisibles.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTutor(t.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${visible ? "border-transparent text-white" : "border-slate-200 bg-white text-slate-400"}`}
                  style={visible ? { background: color.bg } : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: visible ? "rgba(255,255,255,0.6)" : color.bg }} />
                  {t.nombre.split(" ")[0]}
                </button>
              );
            })}
          </div>
        )}

        {/* Grilla */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-400">{d}</div>
            ))}
          </div>

          {cargando ? (
            <div className="flex justify-center py-16"><Spinner label="Cargando…" /></div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`off-${i}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/60" />
              ))}

              {Array.from({ length: nDias }, (_, i) => i + 1).map(dia => {
                const iso = isoFecha(anio, mes, dia);
                const sesiones = porDia.get(iso) ?? [];
                const esHoy = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes && hoy.getDate() === dia;
                const tieneSesiones = sesiones.length > 0;

                // colores únicos por tutor para los dots
                const tutoresDelDia = [...new Map(sesiones.map(s => [s.tutor_id, s])).values()];

                return (
                  <div
                    key={dia}
                    onClick={() => tieneSesiones && setDiaSeleccionado(iso)}
                    className={`min-h-[80px] border-b border-r border-slate-100 p-2 transition ${tieneSesiones ? "cursor-pointer hover:bg-brand-50/60" : "cursor-default"}`}
                  >
                    {/* Número del día */}
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none transition ${esHoy ? "bg-brand-600 font-bold text-white" : "font-medium text-slate-700"}`}>
                        {dia}
                      </span>
                      {sesiones.length > 1 && (
                        <span className="text-[10px] font-bold text-slate-400">{sesiones.length}</span>
                      )}
                    </div>

                    {/* Dots por tutor */}
                    {tieneSesiones && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tutoresDelDia.slice(0, 4).map(s => {
                          const color = colorTutor(s.tutor_id);
                          const count = sesiones.filter(x => x.tutor_id === s.tutor_id).length;
                          return (
                            <span
                              key={s.tutor_id}
                              title={`${s.tutor_nombre} (${count})`}
                              className="flex h-2.5 w-2.5 rounded-full"
                              style={{ background: color.bg }}
                            />
                          );
                        })}
                        {tutoresDelDia.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400">+{tutoresDelDia.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Preview tipo en días con espacio (desktop) */}
                    {sesiones.length === 1 && (
                      <p className="mt-1 hidden text-[10px] font-medium text-slate-500 sm:block truncate">
                        {TIPO_ICONO[sesiones[0].tipo]} {labelTipo(sesiones[0].tipo)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leyenda tutores */}
        {tutores.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
            {tutores.map(t => {
              const color = colorTutor(t.id);
              return (
                <div key={t.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color.bg }} />
                  {t.nombre}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel día pantalla completa */}
      {diaSeleccionado && sesionesDelDia.length > 0 && (
        <PanelDia
          iso={diaSeleccionado}
          sesiones={sesionesDelDia}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </>
  );
}
