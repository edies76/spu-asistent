"use client";

// Estados de carga / error / vacío reutilizables (sección 10: loading visible).

export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </main>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </span>
  );
}

export function ErrorBox({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {mensaje}
    </div>
  );
}

export function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
      {mensaje}
    </div>
  );
}
