
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

  return (
    <div
      onClick={onClose} className="fixed inset-[0] z-[9999] bg-[rgba(0,0,0,0.65)] backdrop-filter-[blur(6px)] flex items-center justify-center p-[1rem] animation-[fadeIn_0.2s_ease] box-sizing-[border-box]">







      
            <div
        onClick={(e) => e.stopPropagation()} className="bg-[var(--color-surface)] rounded-[24px] p-[2rem_1.5rem] max-w-[320px] w-[100%] text-center box-shadow-[0_25px_80px_rgba(0,0,0,0.3)] border-[1px_solid_var(--color-border)] box-sizing-[border-box]">








        
                <div className="flex justify-space-between items-center mb-[1.2rem]">
                    <h3 className="m-[0] text-[1rem] font-[800]">{title}</h3>
                    <button onClick={onClose} className="bg-[none] border-none cursor-pointer text-[var(--color-text-muted)] p-[0.2rem] flex">
                        <X size={20} />
                    </button>
                </div>

                <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"







          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Hacé clic para abrir el enlace" className="bg-[#fff] rounded-[16px] p-[1rem] inline-block mb-[1rem] text-decoration-[none] cursor-pointer transition-[transform_0.2s_ease] box-shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          
                    <canvas ref={canvasRef} className="max-w-[100%] h-[auto] block" />
                </a>

                <p className="m-[0_0_1rem] text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.5]">
                    Escaneá este código o <strong>tocalo directamente</strong> para ver el detalle.
                </p>

                {details &&
        <div className="bg-[rgba(0,0,0,0.02)] p-[0.8rem] rounded-[12px] mb-[1rem] text-left text-[0.8rem] text-[var(--color-text)]">
                        {details}
                    </div>
        }

                <button
          onClick={handleDownload} className="flex items-center justify-center gap-[0.5rem] w-[100%] p-[0.75rem] rounded-[12px] bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] text-[white] border-none cursor-pointer font-[800] text-[0.88rem]">







          
                    <Download size={16} /> Guardar imagen
                </button>
            </div>
        </div>);

}