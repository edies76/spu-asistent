"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarioRespuesta, CalendarioSesion, SesionDetalle, TutorOption, Asistencia } from "@/lib/types";
import { labelTipo, DESEMPENO_OPCIONES, type Desempeno, type TipoSesion } from "@/lib/types";
import { colorTutor } from "@/lib/tutorColor";
import { Spinner } from "@/components/Feedback";

// ── Helpers ──────────────────────────────────────────────────────────────────

function diasEnMes(a: number, m: number) { return new Date(a, m, 0).getDate(); }
function primerDiaSemana(a: number, m: number) { return (new Date(a, m - 1, 1).getDay() + 6) % 7; }
function isoFecha(a: number, m: number, d: number) {
  return `${a}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const DIAS_SEMANA = ["Mo","Tu","We","Th","Fr","Sa","Su"];
const MESES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TIPO_ICONO: Record<TipoSesion, string> = {
  lab1: "📖", lab2: "✍️", practice: "🎙️", conversacional: "💬",
};

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({
  asistencia,
  onClose,
  onSaved,
}: {
  asistencia: Asistencia;
  onClose: () => void;
  onSaved: (updated: Asistencia) => void;
}) {
  const [desempeno, setDesempeno] = useState<Desempeno | "">(asistencia.desempeno ?? "");
  const [notas, setNotas] = useState(asistencia.notas ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch<Asistencia>(`/admin/asistencias/${asistencia.id}`, {
        desempeno: desempeno || null,
        notas: notas || null,
      });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5">
        <h3 className="mb-4 text-base font-bold text-slate-800">{asistencia.estudiante_nombre}</h3>

        {/* Performance grid */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Performance</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {DESEMPENO_OPCIONES.map(op => (
            <button
              key={op.value}
              onClick={() => setDesempeno(prev => prev === op.value ? "" : op.value)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                desempeno === op.value
                  ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{op.emoji}</span>
              <span className="text-xs leading-tight">{op.label}</span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
        <textarea
          className="mb-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          rows={3}
          placeholder="Optional notes…"
          value={notas}
          onChange={e => setNotas(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition disabled:opacity-60"
          >
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PanelDia ──────────────────────────────────────────────────────────────────

function PanelDia({
  iso,
  sesiones,
  onClose,
}: {
  iso: string;
  sesiones: CalendarioSesion[];
  onClose: () => void;
}) {
  const [cache, setCache] = useState<Record<string, SesionDetalle>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<Asistencia | null>(null);

  async function toggleSesion(id: string) {
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

  function handleSaved(updated: Asistencia) {
    setCache(prev => {
      const entry = Object.entries(prev).find(([, det]) =>
        det.asistencias.some(a => a.id === updated.id)
      );
      if (!entry) return prev;
      const [sid, det] = entry;
      return {
        ...prev,
        [sid]: {
          ...det,
          asistencias: det.asistencias.map(a => a.id === updated.id ? updated : a),
        },
      };
    });
    setEditando(null);
  }

  // Group by tutor
  const porTutor = new Map<string, { nombre: string; sesiones: CalendarioSesion[] }>();
  for (const s of sesiones) {
    if (!porTutor.has(s.tutor_id)) porTutor.set(s.tutor_id, { nombre: s.tutor_nombre, sesiones: [] });
    porTutor.get(s.tutor_id)!.sesiones.push(s);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
        {/* Back button */}
        <div className="shrink-0 px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-200 transition text-lg"
            title="Back"
          >
            ←
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-6 px-5 pb-8 pt-2">
            {[...porTutor.entries()].map(([tutorId, { nombre, sesiones: ss }]) => (
              <div key={tutorId}>
                {/* Tutor name header */}
                <p className="mb-3 text-sm font-bold text-slate-700">{nombre}</p>

                {/* Sessions */}
                <div className="space-y-2">
                  {ss.map(s => {
                    const abierto = expandidos.has(s.id);
                    const detalle = cache[s.id];
                    const cargando = cargandoDetalle === s.id;

                    return (
                      <div key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <button
                          onClick={() => toggleSesion(s.id)}
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
                            <svg
                              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? "rotate-180" : ""}`}
                              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>

                        {abierto && detalle && (
                          <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3">
                            {detalle.asistencias.length === 0 ? (
                              <p className="py-2 text-center text-sm text-slate-400">No attendance records.</p>
                            ) : (
                              <div className="space-y-2">
                                {detalle.asistencias.map(a => {
                                  const d = a.desempeno ? DESEMPENO_OPCIONES.find(op => op.value === a.desempeno) : null;
                                  return (
                                    <button
                                      key={a.id}
                                      onClick={() => setEditando(a)}
                                      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left hover:bg-slate-50 transition"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">{a.estudiante_nombre}</p>
                                        {a.notas && <p className="truncate text-xs text-slate-500">{a.notas}</p>}
                                      </div>
                                      {d && (
                                        <span className="shrink-0 text-base" title={d.label}>{d.emoji}</span>
                                      )}
                                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
                                      </svg>
                                    </button>
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
            ))}
          </div>
        </div>
      </div>

      {editando && (
        <EditModal
          asistencia={editando}
          onClose={() => setEditando(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => navMes(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition text-lg">‹</button>
          <h2 className="text-lg font-bold text-slate-800">{MESES[mes - 1]} {anio}</h2>
          <button onClick={() => navMes(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition text-lg">›</button>
        </div>

        {/* Tutor filter pills — dot only */}
        {tutores.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tutores.map(t => {
              const color = colorTutor(t.id);
              const visible = tutoresVisibles.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTutor(t.id)}
                  title={t.nombre}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    visible ? "border-transparent" : "border-slate-200 bg-white opacity-40"
                  }`}
                  style={visible ? { background: color.bg } : undefined}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: visible ? "rgba(255,255,255,0.55)" : color.bg }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Calendar grid */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-400">{d}</div>
            ))}
          </div>

          {cargando ? (
            <div className="flex justify-center py-16"><Spinner label="Loading…" /></div>
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
                const tutoresDelDia = [...new Map(sesiones.map(s => [s.tutor_id, s])).values()];

                return (
                  <div
                    key={dia}
                    onClick={() => tieneSesiones && setDiaSeleccionado(iso)}
                    className={`min-h-[80px] border-b border-r border-slate-100 p-2 transition ${tieneSesiones ? "cursor-pointer hover:bg-brand-50/60" : "cursor-default"}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none transition ${esHoy ? "bg-brand-600 font-bold text-white" : "font-medium text-slate-700"}`}>
                        {dia}
                      </span>
                      {sesiones.length > 1 && (
                        <span className="text-[10px] font-bold text-slate-400">{sesiones.length}</span>
                      )}
                    </div>

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
      </div>

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
