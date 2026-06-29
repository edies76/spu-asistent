"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, homePorRol } from "@/lib/auth";
import type { Rol } from "@/lib/types";

type Fase = 1 | 2 | 3;

const ROLES: { value: Rol; label: string; desc: string; icon: string }[] = [
  { value: "estudiante",    label: "Student",       desc: "Show your QR in every class",    icon: "🎓" },
  { value: "tutor",         label: "Tutor",         desc: "Record attendance with QR",      icon: "🧑‍🏫" },
  { value: "administrador", label: "Administrator", desc: "Manage and review everything",   icon: "🛡️" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>(1);
  const [rol, setRol] = useState<Rol | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function elegirRol(r: Rol) {
    setRol(r);
    setError(null);
    setFase(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rol) return;
    setLoading(true);
    setError(null);
    try {
      await register({ rol, nombre_completo: nombre, fecha_nacimiento: fechaNacimiento, email, password, telefono: telefono || undefined });
      setFase(3);
      setTimeout(() => router.replace(homePorRol(rol)), 1600);
    } catch (err: any) {
      setError(err?.code === "email_en_uso" ? "That email is already registered." : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-white p-6">
      <div className="w-full max-w-md animate-fadein">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">QR Attendance System</p>
        </div>

        <div className="card overflow-hidden">
          {/* Barra de progreso */}
          <div className="flex">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1 flex-1 transition-colors duration-500 ${n <= fase ? "bg-brand-500" : "bg-slate-100"}`} />
            ))}
          </div>

          <div className="p-8" key={fase}>

            {/* FASE 1 — rol */}
            {fase === 1 && (
              <div className="animate-fadein space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">What type of user are you?</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Select your role to continue</p>
                </div>
                <div className="space-y-2.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => elegirRol(r.value)}
                      className="flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.99]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{r.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{r.label}</p>
                        <p className="text-xs text-slate-500">{r.desc}</p>
                      </div>
                      <svg className="ml-auto h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-slate-500 pt-2">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* FASE 2 — datos */}
            {fase === 2 && (
              <div className="animate-fadein">
                <button onClick={() => setFase(1)} className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </button>

                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ROLES.find(r => r.value === rol)?.icon}</span>
                    <h2 className="text-lg font-bold text-slate-800">Your information</h2>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">Registering as <strong className="text-brand-600 capitalize">{rol}</strong></p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="label" htmlFor="nombre">Full name</label>
                    <input id="nombre" required className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="First and last name" />
                  </div>
                  <div>
                    <label className="label" htmlFor="fn">Date of birth</label>
                    <input id="fn" type="date" required className="field" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="reg-email">Email</label>
                    <input id="reg-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="label" htmlFor="pass">Password</label>
                    <input id="pass" type="password" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
                  </div>
                  <div>
                    <label className="label" htmlFor="tel">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                    <input id="tel" type="tel" className="field" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+1 809 000 0000" />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn-primary w-full py-3.5" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </button>
                </form>
              </div>
            )}

            {/* FASE 3 — éxito */}
            {fase === 3 && (
              <div className="animate-fadein py-4 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Account created!</h2>
                <p className="mt-2 text-sm text-slate-500">Redirecting to your home screen…</p>
                <div className="mt-6 flex justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
