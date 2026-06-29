"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

type Estado = "solicitando" | "escaneando" | "detectado" | "error";

export default function QrScanner({ onResult }: { onResult: (v: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const firedRef = useRef(false);

  const [estado, setEstado] = useState<Estado>("solicitando");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function start() {
      try {
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 500,
        });
        readerRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result, err) => {
            if (cancelado || firedRef.current) return;
            if (result) {
              firedRef.current = true;
              setEstado("detectado");
              controls.stop();
              onResult(result.getText());
            }
          }
        );

        stopRef.current = () => controls.stop();
        if (!cancelado) setEstado("escaneando");
      } catch (e: any) {
        if (cancelado) return;
        if (e?.name === "NotAllowedError") {
          setErrorMsg("Permiso de cámara denegado. Habilítalo en el navegador.");
        } else {
          setErrorMsg("No se pudo iniciar la cámara: " + (e?.message || "error desconocido"));
        }
        setEstado("error");
      }
    }

    start();
    return () => {
      cancelado = true;
      stopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Contenedor de cámara */}
      <div className="relative w-full max-w-xs overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10"
           style={{ aspectRatio: "1/1" }}>

        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Overlay oscuro esquinas */}
        {estado === "escaneando" && (
          <>
            {/* Marco recortador */}
            <div className="pointer-events-none absolute inset-0">
              {/* sombra de esquinas */}
              <div className="absolute inset-0 bg-black/40" style={{
                maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 60%, black 61%)",
                WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 60%, black 61%)",
              }} />
              {/* Marco blanco con esquinas */}
              <FrameCorners />
              {/* Línea de escaneo animada */}
              <ScanLine />
            </div>
          </>
        )}

        {/* Estado: solicitando permiso */}
        {estado === "solicitando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/70">Activando cámara…</p>
          </div>
        )}

        {/* Estado: detectado */}
        {estado === "detectado" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-500/90">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p className="text-sm font-semibold text-white">QR detectado</p>
          </div>
        )}

        {/* Estado: error */}
        {estado === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/95 px-6 text-center">
            <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-white/80">{errorMsg}</p>
          </div>
        )}
      </div>

      {estado === "escaneando" && (
        <p className="text-center text-sm text-slate-500">
          Apunta la cámara al código QR del estudiante
        </p>
      )}
    </div>
  );
}

function FrameCorners() {
  const corner = "absolute w-8 h-8 border-white";
  return (
    <div className="absolute inset-[20%]">
      <div className={`${corner} top-0 left-0 border-t-2 border-l-2 rounded-tl-lg`} />
      <div className={`${corner} top-0 right-0 border-t-2 border-r-2 rounded-tr-lg`} />
      <div className={`${corner} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg`} />
      <div className={`${corner} bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg`} />
    </div>
  );
}

function ScanLine() {
  return (
    <div className="absolute inset-[20%] overflow-hidden rounded-lg">
      <div className="animate-scanline absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-80" />
    </div>
  );
}
