"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { TipoSesion, Desempeno, EstudianteQr, SesionActiva } from "@/lib/types";
import { TIPOS_SESION, labelTipo, DESEMPENO_OPCIONES } from "@/lib/types";
import RoleGate from "@/components/RoleGate";
import Header from "@/components/Header";
import { LoadingScreen } from "@/components/Feedback";
import QrScanner from "@/components/tutor/QrScanner";
import type { Usuario } from "@/lib/types";
import FirmaCanvas from "@/components/tutor/FirmaCanvas";

function formatFechaHora(d: Date) {
  return d.toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function EscanearPage() {
  return (
    <RoleGate roles={["tutor"]}>
      {(user) => (
        <Suspense fallback={<LoadingScreen label="Loading…" />}>
          <EscaneoInner user={user} />
        </Suspense>
      )}
    </RoleGate>
  );
}

type Paso = "cargando" | "escaner" | "seleccion_tipo" | "formulario" | "guardando" | "exito";

interface FormState {
  estudiante: EstudianteQr;
  tutor: Usuario;
  tipo: TipoSesion;
  sesionActivaId: string | null;
  sesionActivaTipo: TipoSesion | null;
  fechaHora: Date;
  desempeno: Desempeno | "";
  notas: string;
  firma: string | null;
  // 2x1: si el tipo activo es lab1, permite añadir lab2 también
  incluirLab2: boolean;
}

const TIPO_ICONO: Record<TipoSesion, { emoji: string; label: string; desc: string; color: string; bg: string }> = {
  lab1:           { emoji: "📖", label: "Lab 1",          desc: "Reading",        color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  lab2:           { emoji: "✍️",  label: "Lab 2",          desc: "Writing",        color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  practice:       { emoji: "🎙️", label: "Practice",       desc: "Oral practice",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"   },
  conversacional: { emoji: "💬", label: "Conversacional",  desc: "Conversation",   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200"},
};

function EscaneoInner({ user }: { user: Usuario }) {
  const router = useRouter();
  const params = useSearchParams();
  const qrParam = params.get("qr");

  const [paso, setPaso] = useState<Paso>("cargando");
  const [form, setForm] = useState<FormState | null>(null);
  const [tipoSugerido, setTipoSugerido] = useState<TipoSesion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFirma, setMostrarFirma] = useState(false);

  useEffect(() => {
    if (!qrParam) { setPaso("escaner"); return; }
    resolverQrYSesion(qrParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrParam]);

  async function resolverQrYSesion(qr: string) {
    setPaso("cargando");
    setError(null);
    try {
      const [estudiante, activa] = await Promise.all([
        api.get<EstudianteQr>(`/asistencias/resolver-qr/${qr}`),
        api.get<SesionActiva>("/sesiones/activa"),
      ]);
      const ahora = new Date();
      if (activa.activa && activa.sesion) {
        setForm({
          estudiante, tutor: user,
          tipo: activa.sesion.tipo,
          sesionActivaId: activa.sesion.id,
          sesionActivaTipo: activa.sesion.tipo,
          fechaHora: ahora, desempeno: "", notas: "", firma: null, incluirLab2: false,
        });
        setPaso("formulario");
      } else {
        setTipoSugerido(activa.tipo_sugerido ?? null);
        setForm({
          estudiante, tutor: user,
          tipo: activa.tipo_sugerido ?? "lab1",
          sesionActivaId: null, sesionActivaTipo: null,
          fechaHora: ahora, desempeno: "", notas: "", firma: null, incluirLab2: false,
        });
        setPaso("seleccion_tipo");
      }
    } catch (err: any) {
      setError(err?.code === "qr_no_encontrado" ? "This QR doesn't belong to any student." : "Could not process the QR.");
      setPaso("escaner");
    }
  }

  const onQrEscaneado = useCallback((valor: string) => {
    try {
      const url = new URL(valor);
      const qr = url.searchParams.get("qr");
      if (qr) { router.replace(`/scan?qr=${qr}`); return; }
    } catch {}
    router.replace(`/scan?qr=${valor}`);
  }, [router]);

  function elegirTipo(tipo: TipoSesion) {
    if (!form) return;
    setForm({ ...form, tipo });
    setPaso("formulario");
  }

  function crearNuevaSesion() {
    if (!form) return;
    setForm({ ...form, sesionActivaId: null, sesionActivaTipo: null });
    setPaso("seleccion_tipo");
  }

  async function finalizar() {
    if (!form || !form.desempeno) return;
    setPaso("guardando");
    setError(null);
    try {
      const payload = {
        qr_id: form.estudiante.qr_id,
        tipo: form.tipo,
        desempeno: form.desempeno,
        notas: form.notas || undefined,
        firma: form.firma || undefined,
      };

      if (form.sesionActivaId) {
        await api.post("/asistencias", {
          sesion_id: form.sesionActivaId,
          qr_id: form.estudiante.qr_id,
          desempeno: form.desempeno,
          notas: form.notas || undefined,
          firma: form.firma || undefined,
        });
      } else {
        await api.post("/asistencias/con-sesion", payload);
        // 2x1: si lab1 y marcó incluirLab2, crear segunda asistencia en nueva sesión lab2
        if (form.tipo === "lab1" && form.incluirLab2) {
          await api.post("/asistencias/con-sesion", { ...payload, tipo: "lab2" });
        }
      }
      setPaso("exito");
      setTimeout(() => router.replace("/home"), 2200);
    } catch {
      setError("Could not save the attendance.");
      setPaso("formulario");
    }
  }

  if (paso === "cargando") return <LoadingScreen label="Verifying QR…" />;
  if (paso === "guardando") return <LoadingScreen label="Saving attendance…" />;

  return (
    <>
      <Header user={user} extraNav={[{ href: "/home", label: "← Home" }]} />
      <main className="mx-auto max-w-md px-5 py-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* ── Escáner ── */}
        {paso === "escaner" && (
          <div className="animate-fadein space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">Scan QR</h1>
              <p className="mt-1 text-sm text-slate-500">Point at the student&apos;s QR code</p>
            </div>
            <QrScanner onResult={onQrEscaneado} />
          </div>
        )}

        {/* ── Selección de tipo ── */}
        {paso === "seleccion_tipo" && form && (
          <div className="animate-fadein space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-lg">👤</div>
              <div>
                <p className="text-sm font-semibold text-brand-900">{form.estudiante.nombre_completo}</p>
                <p className="text-xs text-brand-600">Student identified</p>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">Session type?</h1>
              {tipoSugerido && (
                <p className="mt-1 text-xs text-slate-500">
                  Suggestion based on your last session: <strong>{labelTipo(tipoSugerido)}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIPOS_SESION.map((t) => {
                const info = TIPO_ICONO[t.value];
                return (
                  <button
                    key={t.value}
                    onClick={() => elegirTipo(t.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 transition hover:scale-[1.02] active:scale-[0.98] ${
                      form.tipo === t.value ? `${info.bg} border-current ${info.color}` : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-3xl">{info.emoji}</span>
                    <div className="text-center">
                      <p className="text-sm font-bold">{info.label}</p>
                      <p className="text-[11px] text-slate-500">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Formulario ── */}
        {paso === "formulario" && form && (
          <div className="animate-fadein space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Record Attendance</h1>
              <p className="mt-0.5 text-sm text-slate-500">Fill in the student&apos;s performance</p>
            </div>

            {/* Info sesión */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className={`border-b border-slate-100 px-4 py-3 ${TIPO_ICONO[form.tipo].bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TIPO_ICONO[form.tipo].emoji}</span>
                  <span className={`text-sm font-bold ${TIPO_ICONO[form.tipo].color}`}>{labelTipo(form.tipo)}</span>
                  {form.sesionActivaId && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      Active session
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-1">
                <InfoRow label="Student" value={form.estudiante.nombre_completo} />
                <InfoRow label="Tutor" value={form.tutor.nombre_completo} />
                <InfoRow label="Date & Time" value={formatFechaHora(form.fechaHora)} />
              </div>

              {/* Opción crear nueva sesión si hay activa */}
              {form.sesionActivaId && (
                <div className="border-t border-slate-100 px-4 py-2.5">
                  <button onClick={crearNuevaSesion} className="text-xs text-slate-400 hover:text-brand-600 transition">
                    + Create new session instead of joining the active one
                  </button>
                </div>
              )}
            </div>

            {/* 2x1 Lab1+Lab2 */}
            {!form.sesionActivaId && form.tipo === "lab1" && (
              <button
                type="button"
                onClick={() => setForm({ ...form, incluirLab2: !form.incluirLab2 })}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                  form.incluirLab2
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <span className="text-2xl">✍️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Add Lab 2 (2×1)</p>
                  <p className="text-xs text-slate-500">Student completed Lab 1 + Lab 2 today</p>
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                  form.incluirLab2 ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                }`}>
                  {form.incluirLab2 && (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            )}

            {/* Desempeño */}
            <div>
              <p className="label">How did they do? <span className="text-red-400">*</span></p>
              <div className="grid grid-cols-2 gap-2">
                {DESEMPENO_OPCIONES.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setForm({ ...form, desempeno: op.value })}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                      form.desempeno === op.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{op.emoji}</span>
                    <span className="leading-tight">{op.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="label" htmlFor="notas">
                Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="notas" rows={3} className="field"
                placeholder="Tutor observations…"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            {/* Firma */}
            <div>
              {!form.firma && !mostrarFirma && (
                <button
                  type="button"
                  onClick={() => setMostrarFirma(true)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 transition hover:border-brand-300 hover:text-brand-600 w-full justify-center"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  Add student signature (optional)
                </button>
              )}

              {mostrarFirma && !form.firma && (
                <FirmaCanvas
                  onGuardar={(dataUrl) => { setForm({ ...form, firma: dataUrl }); setMostrarFirma(false); }}
                  onCancelar={() => setMostrarFirma(false)}
                />
              )}

              {form.firma && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      Signature captured
                    </p>
                    <button onClick={() => setForm({ ...form, firma: null })} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                  </div>
                  <img src={form.firma} alt="Signature" className="h-20 w-full object-contain p-2" />
                </div>
              )}
            </div>

            <button
              onClick={finalizar}
              disabled={!form.desempeno}
              className="btn-primary w-full py-3.5"
            >
              {form.incluirLab2 ? "Save Lab 1 + Lab 2" : "Save attendance"}
            </button>
          </div>
        )}

        {/* ── Éxito ── */}
        {paso === "exito" && form && (
          <div className="animate-fadein py-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Attendance recorded!</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">{form.estudiante.nombre_completo}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-lg">{TIPO_ICONO[form.tipo].emoji}</span>
              <span className="text-sm text-slate-500">{labelTipo(form.tipo)}</span>
              {form.incluirLab2 && <><span className="text-slate-300">+</span><span className="text-lg">{TIPO_ICONO["lab2"].emoji}</span><span className="text-sm text-slate-500">Lab 2</span></>}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {DESEMPENO_OPCIONES.find(d => d.value === form.desempeno)?.emoji} {DESEMPENO_OPCIONES.find(d => d.value === form.desempeno)?.label}
            </p>
            <p className="mt-3 text-xs text-slate-400">Returning to home…</p>
          </div>
        )}
      </main>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}
