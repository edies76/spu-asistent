"use client";

// Tarjeta con el código QR del estudiante (alta resolución) y descarga PNG.
// El qr_id (UUID v4) viene del backend; aquí solo lo renderizamos.

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Spinner } from "@/components/Feedback";
import { API_URL } from "@/lib/api";

// El QR codifica una URL directa al flujo de escaneo del tutor.
// Al escanear desde la cámara del celular abre /escanear?qr={uuid}.
function qrUrl(qrId: string): string {
  // Si el frontend tiene base URL configurada usarla, si no usar window.location.origin.
  if (typeof window !== "undefined") {
    return `${window.location.origin}/escanear?qr=${qrId}`;
  }
  return `/escanear?qr=${qrId}`;
}

export default function QrCard({
  qrId,
  nombre,
  cargando,
}: {
  qrId: string | null;
  nombre: string;
  cargando?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  function descargarPng() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${nombre.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="card flex flex-col items-center gap-5 p-8">
      <div
        ref={canvasRef}
        className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-100"
      >
        {cargando || !qrId ? (
          <div className="flex h-[264px] w-[264px] items-center justify-center">
            <Spinner label="Generando QR…" />
          </div>
        ) : (
          // size alto para "alta resolución"; el PNG hereda esa resolución.
          <QRCodeCanvas
            value={qrUrl(qrId)}
            size={264}
            level="H"
            includeMargin={true}
          />
        )}
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-slate-800">{nombre}</p>
        <p className="text-xs text-slate-400">Muestra este QR al iniciar tu clase</p>
      </div>

      <button
        onClick={descargarPng}
        className="btn-primary w-full"
        disabled={!qrId}
      >
        ⬇️ Descargar QR
      </button>
    </div>
  );
}
