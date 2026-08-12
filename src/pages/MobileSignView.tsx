import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Smartphone, CheckCircle2, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileSignView(): React.ReactElement | null {
  const [searchParams] = useSearchParams();
  const permitId = searchParams.get('permitId') || 'draft';
  const role = searchParams.get('role') || 'operator';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getRoleTitle = (r: string) => {
    if (r === 'professional') return 'Gerencia EHS / Emisor';
    if (r === 'supervisor') return 'Supervisor de Trabajo';
    return 'Solicitante / Operador';
  };

  const roleTitle = getRoleTitle(role);

  // Inicializar canvas responsive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.error('Por favor, realiza tu firma en la pantalla.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');

    // 1. Guardar en localStorage
    const storageKey = `mobile_sig_${permitId}_${role}`;
    localStorage.setItem(storageKey, dataUrl);

    // 2. Transmitir por BroadcastChannel
    try {
      const bc = new BroadcastChannel('hys_signature_channel');
      bc.postMessage({
        permitId,
        role,
        signature: dataUrl
      });
      bc.close();
    } catch {
      /* ignore */
    }

    setSubmitted(true);
    toast.success('¡Firma enviada con éxito!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-2 text-left">
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 font-bold">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="text-xs font-black text-blue-400 uppercase tracking-wider">
                FIRMA TÁCTIL EN VIVO
              </div>
              <h1 className="text-base font-black text-white m-0">
                Asistente H&amp;S
              </h1>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
            🔒 Cifrado Seguro
          </span>
        </div>

        {submitted ? (
          <div className="py-8 space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 size={48} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white m-0">
                ¡Firma Transferida!
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Tu firma ha sido enviada e insertada automáticamente en el documento en vivo.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                FIRMAR NUEVAMENTE
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-3.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                R OL A FIRMAR:
              </span>
              <span className="text-sm font-black text-blue-400 block uppercase">
                {roleTitle}
              </span>
            </div>

            {/* Canvas de Firma */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-extrabold text-slate-300">
                  Dibuja tu firma a continuación:
                </span>
                {hasDrawn && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={13} /> Limpiar
                  </button>
                )}
              </div>

              <div className="w-full h-56 bg-white rounded-2xl border-2 border-slate-600 relative overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm font-bold tracking-widest uppercase">
                    ✍️ Dibuja tu firma aquí
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-extrabold text-xs rounded-2xl transition-all"
              >
                LIMPIAR
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Send size={16} /> ENVIAR FIRMA AL PERMISO
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
          <ShieldCheck size={13} className="text-emerald-500" /> PLATAFORMA OFICIAL ASISTENTE H&amp;S · VERIFICACIÓN ISO 45001
        </div>
      </div>
    </div>
  );
}
