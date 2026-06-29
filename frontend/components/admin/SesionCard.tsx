"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { SesionDetalle, Asistencia, TipoSesion, Desempeno } from "@/lib/types";
import { labelTipo, DESEMPENO_OPCIONES } from "@/lib/types";

const TIPO_ICONO: Record<TipoSesion, { emoji: string; color: string; bg: string }> = {
  lab1:          { emoji: "🧪", color: "text-violet-700", bg: "bg-violet-100" },
  lab2:          { emoji: "⚗️",  color: "text-indigo-700", bg: "bg-indigo-100" },
  practice:      { emoji: "✏️",  color: "text-amber-700",  bg: "bg-amber-100"  },
  conversacional:{ emoji: "💬", color: "text-emerald-700", bg: "bg-emerald-100" },
};

const DESEMPENO_MAP: Record<Desempeno, { label: string; emoji: string; color: string }> = {
  excellent:         { label: "Excellent",         emoji: "🌟", color: "text-amber-600 bg-amber-50"   },
  good:              { label: "Good",               emoji: "👍", color: "text-green-700 bg-green-50"   },
  keep_practicing:   { label: "Keep Practicing",    emoji: "💪", color: "text-blue-700 bg-blue-50"    },
  needs_improvement: { label: "Needs Improvement",  emoji: "📚", color: "text-red-600 bg-red-50"      },
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Fila de asistencia editable ───────────────────────────────────────────────
function AsistenciaRow({ a, onSaved }: { a: Asistencia; onSaved: (u: Asistencia) => void }) {
  const [editando, setEditando] = useState(false);
  const [desempeno, setDesempeno] = useState<Desempeno | "">(a.desempeno ?? "");
  const [notas, setNotas] = useState(a.notas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const payload: any = { notas: notas || null };
      if (desempeno) payload.desempeno = desempeno;
      const updated = await api.patch<Asistencia>(`/admin/asistencias/${a.id}`, payload);
      onSaved(updated);
      setEditando(false);
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const d = a.desempeno ? DESEMPENO_MAP[a.desempeno] : null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{a.estudiante_nombre}</p>

          {!editando && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {d ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.color}`}>
                  {d.emoji} {d.label}
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin desempeño</span>
              )}
              {a.notas && (
                <span className="text-xs text-slate-500 truncate max-w-[200px]">· {a.notas}</span>
              )}
            </div>
          )}

          {a.editado_en && !editando && (
            <p className="mt-1 text-[11px] text-slate-400">
              ✏️ Editado el {formatFechaCorta(a.editado_en)}
            </p>
          )}
        </div>

        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition"
          >
            Editar
          </button>
        )}
      </div>

      {editando && (
        <div className="mt-3 space-y-3">
          {/* Selector desempeño */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">Desempeño</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DESEMPENO_OPCIONES.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setDesempeno(op.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    desempeno === op.value
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {op.emoji} {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <textarea
            rows={2}
            className="field text-sm"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas opcionales…"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setEditando(false); setDesempeno(a.desempeno ?? ""); setNotas(a.notas ?? ""); }}
              className="btn-secondary flex-1 py-2 text-sm"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              className="btn-primary flex-1 py-2 text-sm"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de sesión ─────────────────────────────────────────────────────────
export default function SesionCard({ sesion: inicial }: { sesion: SesionDetalle }) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>(inicial.asistencias);
  const [expandido, setExpandido] = useState(false);
  const icono = TIPO_ICONO[inicial.tipo];

  function onSaved(updated: Asistencia) {
    setAsistencias((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
        onClick={() => setExpandido((v) => !v)}
      >
        {/* Icono tipo */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${icono.bg}`}>
          {icono.emoji}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${icono.color}`}>{labelTipo(inicial.tipo)}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">{inicial.tutor_nombre}</p>
          <p className="text-xs text-slate-400">{formatFecha(inicial.iniciada_en)}</p>
        </div>

        {/* Conteo + toggle */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-700">
            {asistencias.length} <span className="font-normal text-slate-400">est.</span>
          </p>
          <svg
            className={`ml-auto mt-1 h-4 w-4 text-slate-400 transition-transform ${expandido ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expandido && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 animate-fadein">
          {asistencias.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin registros en esta sesión.</p>
          ) : (
            asistencias.map((a) => <AsistenciaRow key={a.id} a={a} onSaved={onSaved} />)
          )}
        </div>
      )}
    </div>
  );
}
