"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import type { Rol } from "@/lib/types";
import { useState } from "react";

const ROL_LABEL: Record<Rol, string> = {
  estudiante: "Student",
  tutor: "Tutor",
  administrador: "Admin",
};

const ROL_COLOR: Record<Rol, string> = {
  estudiante: "bg-emerald-100 text-emerald-700",
  tutor: "bg-brand-100 text-brand-700",
  administrador: "bg-amber-100 text-amber-700",
};

export default function Header({
  user,
  extraNav,
}: {
  user: { nombre_completo: string; rol: Rol };
  extraNav?: { href: string; label: string; active?: boolean }[];
}) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        {/* Logo + usuario */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 leading-tight">
              {user.nombre_completo}
            </p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ROL_COLOR[user.rol]}`}>
              {ROL_LABEL[user.rol]}
            </span>
          </div>
        </div>

        {/* Nav links + salir */}
        <nav className="flex items-center gap-1">
          {extraNav?.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                n.active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={salir}
            disabled={saliendo}
            className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {saliendo ? "Signing out…" : "Sign out"}
          </button>
        </nav>
      </div>
    </header>
  );
}
