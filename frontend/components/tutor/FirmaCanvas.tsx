"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onGuardar: (dataUrl: string) => void;
  onCancelar: () => void;
}

export default function FirmaCanvas({ onGuardar, onCancelar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function iniciar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDibujando(true);
    lastPos.current = getPos(e);
  }

  function dibujar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!dibujando) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setTieneTrazo(true);
    }
    lastPos.current = pos;
  }

  function terminar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDibujando(false);
    lastPos.current = null;
  }

  function limpiar() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
  }

  function guardar() {
    if (!tieneTrazo) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onGuardar(dataUrl);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">Firma del estudiante</p>
        <button onClick={onCancelar} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
      </div>

      <div className="p-3">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="w-full touch-none cursor-crosshair"
            style={{ height: "160px" }}
            onMouseDown={iniciar}
            onMouseMove={dibujar}
            onMouseUp={terminar}
            onMouseLeave={terminar}
            onTouchStart={iniciar}
            onTouchMove={dibujar}
            onTouchEnd={terminar}
          />
          {!tieneTrazo && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-slate-400">Firma aquí</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={limpiar}
          className="btn-secondary flex-1 py-2 text-sm"
        >
          Limpiar
        </button>
        <button
          onClick={guardar}
          disabled={!tieneTrazo}
          className="btn-primary flex-1 py-2 text-sm"
        >
          Guardar firma
        </button>
      </div>
    </div>
  );
}
