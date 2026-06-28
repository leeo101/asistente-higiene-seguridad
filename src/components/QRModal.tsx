
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';

interface QRModalProps {
  text: string;
  title?: string;
  details?: React.ReactNode;
  onClose: () => void;
}

export default function QRModal({ text, title = 'Código QR', details, onClose }: QRModalProps) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!text || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, text, {
      width: 260,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    }, (err) => {
      if (!err) setDataUrl(canvasRef.current.toDataURL());
    });
  }, [text]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr_${title.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={onClose}>
        <style>{`
            @media print {
                body * { visibility: hidden; }
                #printable-qr-label, #printable-qr-label * { visibility: visible; }
                #printable-qr-label {
                    position: fixed;
                    left: 0; top: 0;
                    width: 105mm; height: 148mm; /* A6 size */
                    padding: 10mm;
                    margin: 0;
                    background: white !important;
                    border: none !important;
                    box-shadow: none !important;
                    transform: scale(1) !important;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                }
            }
        `}</style>
        <div className="animate-fade-in w-[100%] max-w-[400px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-0 overflow-hidden relative shadow-2xl flex flex-col" style={{ maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
            
            {/* The Printable A6 Template Area */}
            <div id="printable-qr-label" className="p-6 flex flex-col items-center bg-white border-b-2 border-dashed border-slate-200 overflow-y-auto relative">
                <button onClick={onClose} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }} className="no-print absolute top-[0.5rem] right-[0.5rem] w-[32px] h-[32px] rounded-[50%] cursor-pointer flex items-center justify-center transition-colors z-10 shadow-sm font-bold">✕</button>
                
                <div className="w-full text-center border-b-2 border-slate-800 pb-4 mb-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 m-0">SISTEMA DE GESTIÓN HYS</h2>
                    <h1 className="m-0 text-slate-900 font-black text-2xl">{title}</h1>
                </div>
                
                {details && (
                    <div className="w-full flex flex-col gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-sm font-bold whitespace-pre-wrap">
                            {details}
                        </div>
                    </div>
                )}

                <a href={text} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100 relative group w-40 h-40 flex items-center justify-center mx-auto transition-transform hover:scale-105" title="Abrir enlace">
                    <canvas ref={canvasRef} className="w-[100%] h-[100%] block" />
                </a>
                
                <p className="mt-6 mb-0 text-xs text-slate-400 font-bold tracking-wider uppercase text-center w-full">
                    ESCANEE PARA INSPECCIÓN Y TRAZABILIDAD
                </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 no-print">
                <button onClick={handleDownload} className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-none">
                    <Download size={18} /> Guardar
                </button>
                <button onClick={handlePrint} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none' }} className="flex-1 py-3 px-4 hover:opacity-90 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                    Imprimir Etiqueta
                </button>
            </div>
        </div>
    </div>
  );
}