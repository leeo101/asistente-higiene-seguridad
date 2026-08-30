import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, Copy, Check, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRModalProps {
  text: string;
  title?: string;
  details?: React.ReactNode;
  onClose: () => void;
}

export default function QRModal({ text, title = 'Código QR', details, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!text || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      text,
      {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      },
      (err) => {
        if (!err && canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL());
        }
      }
    );
  }, [text]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${title.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
    toast.success('Imagen QR descargada');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('¡Enlace de verificación copiado!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center min-h-screen"
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-qr-label, #printable-qr-label * { visibility: visible !important; }
          #printable-qr-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 105mm !important;
            height: 148mm !important; /* A6 size */
            padding: 8mm !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            transform: scale(1) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-space-between !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        className="animate-fade-in w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-0 overflow-hidden relative shadow-2xl flex flex-col my-auto"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón X — fuera del área imprimible, siempre visible */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: '2px solid #ffffff',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.15rem',
            lineHeight: 1,
            zIndex: 100,
            transition: 'all 0.2s',
          }}
          className="no-print hover:scale-110 hover:bg-red-700 active:scale-95 transition-all"
          title="Cerrar ventana"
        >
          ✕
        </button>

        {/* Printable Area */}
        <div id="printable-qr-label" className="p-6 pt-8 flex flex-col items-center bg-white border-b border-dashed border-slate-200 overflow-y-auto relative flex-1">

          {/* Header */}
          <div className="w-full text-center border-b-2 border-slate-900 pb-3 mb-4 mt-2 px-8">
            <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest block mb-1">
              SISTEMA DE GESTIÓN H&S · VERIFICACIÓN QR
            </span>
            <h2 className="m-0 text-slate-900 font-black text-base leading-snug break-words">
              {title}
            </h2>
          </div>

          {/* Details */}
          {details && (
            <div className="w-full flex flex-col gap-2 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold whitespace-pre-wrap">
                {details}
              </div>
            </div>
          )}

          {/* QR Canvas Box */}
          <a
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white rounded-2xl shadow-lg border-2 border-blue-500/20 relative group w-48 h-48 flex items-center justify-center mx-auto transition-transform hover:scale-105 my-2 shrink-0"
            title="Abrir vista pública de verificación"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </a>

          <span className="mt-4 mb-0 text-[0.68rem] text-emerald-600 font-black tracking-wider uppercase text-center w-full bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200 shrink-0">
            🟢 ESCANEE PARA VERIFICACIÓN PÚBLICA (MODO LECTURA)
          </span>
        </div>

        {/* Forced Controls (Not Printable) */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5 no-print shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.88rem'
              }}
              className="flex-1 py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all active:scale-95"
            >
              <Printer size={18} /> Imprimir Etiqueta A6
            </button>

            <button
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.88rem'
              }}
              className="flex-1 py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all active:scale-95"
            >
              <Download size={18} /> Descargar QR
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}
            className="w-full py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-all active:scale-95"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace Directo para Compartir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}