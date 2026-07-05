import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Upload, PenTool } from 'lucide-react';
import { Fingerprint, ShieldCheck, Warning } from '@phosphor-icons/react';
import { isBiometricAvailable, authenticateWithBiometric } from '../services/biometricService';
import toast from 'react-hot-toast';

interface SignatureCanvasProps {
  onSave: (dataUrl: string | null) => void;
  initialImage?: string | null;
  label?: string;
  title?: string;
  height?: number;
  requireBiometric?: boolean;  // si true, pide huella antes de habilitar el canvas
  signerLabel?: string;        // nombre del firmante para el prompt
}

export default function SignatureCanvas({
  onSave,
  initialImage = null,
  label,
  title,
  height = 150,
  requireBiometric = false,
  signerLabel = 'documento'
}: SignatureCanvasProps) {
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(null);
  const [bioVerified, setBioVerified] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    if (requireBiometric) {
      isBiometricAvailable().then(setBioAvailable);
    } else {
      setBioAvailable(false);
    }
  }, [requireBiometric]);

  const handleBiometricAuth = async () => {
    setBioLoading(true);
    try {
      const result = await authenticateWithBiometric(`Firmar ${signerLabel}`);
      if (result.success) {
        setBioVerified(true);
        toast.success('✅ Identidad verificada — podés firmar', { duration: 2500 });
      } else {
        toast.error(result.message, { duration: 3000 });
      }
    } catch {
      toast.error('Error de biometría');
    } finally {
      setBioLoading(false);
    }
  };

  // Canvas bloqueado si se requiere biometría y aún no fue verificada
  const isLocked = requireBiometric && bioAvailable === true && !bioVerified;
  const displayLabel = label || title;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [image, setImage] = useState<string | null>(initialImage);
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  useEffect(() => {
    setImage(initialImage);
    if (initialImage) setHasContent(true);
  }, [initialImage]);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas || image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F172A'; // Premium dark ink color
    ctx.lineWidth = strokeWidth * 1.5; // Scale for retina resolution
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Recortar automáticamente los espacios transparentes (auto-crop)
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    let minX = w,minY = h,maxX = 0,maxY = 0,found = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 0) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let dataUrl = canvas.toDataURL('image/png');
    if (found) {
      const pad = 15; // Padding alrededor de la firma
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(w, maxX + pad);
      maxY = Math.min(h, maxY + pad);

      const trimW = maxX - minX;
      const trimH = maxY - minY;
      const trimCanvas = document.createElement('canvas');
      trimCanvas.width = trimW;
      trimCanvas.height = trimH;
      const trimCtx = trimCanvas.getContext('2d');
      if (trimCtx) {
        trimCtx.putImageData(ctx.getImageData(minX, minY, trimW, trimH), 0, 0);
        dataUrl = trimCanvas.toDataURL('image/png');
      }
    }

    onSave(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setImage(null);
    setHasContent(false);
    onSave(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setHasContent(true);
        onSave(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-[1.5rem]">
      {/* Biometric gate */}
      {isLocked && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '14px',
          padding: '1.2rem',
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Fingerprint size={28} color="#6366f1" weight="duotone" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Verificá tu identidad antes de firmar
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Usá tu huella digital o Face ID para habilitar el campo de firma
            </div>
          </div>
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={bioLoading}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.85rem',
              cursor: bioLoading ? 'not-allowed' : 'pointer',
              opacity: bioLoading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {bioLoading
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⟳</span> Verificando...</>
              : <><Fingerprint size={16} weight="bold" /> Verificar con Biometría</>
            }
          </button>
        </div>
      )}
      {/* Verified badge */}
      {requireBiometric && bioVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '0.4rem 0.8rem', marginBottom: '0.5rem'
        }}>
          <ShieldCheck size={16} color="#10b981" weight="fill" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>
            Identidad verificada biométricamente
          </span>
        </div>
      )}
            {displayLabel &&
      <label className="block text-[0.8rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.5rem]">






        
                    {displayLabel}
                </label>
      }
            
            <div style={{
        height: `${height}px`,
        opacity: isLocked ? 0.35 : 1,
        pointerEvents: isLocked ? 'none' : 'auto',
        transition: 'opacity 0.3s'
      }} className="relative border-[2px_dashed_var(--color-border)] rounded-[12px] bg-[var(--color-surface)] touch-action-[none] overflow-[hidden]">
                {image ?
        <div className="relative w-[100%] h-[100%]">
                        <img src={image} alt="Firma" className="w-[100%] h-[100%] object-fit-[contain]" />
                        <div onClick={clearCanvas} className="absolute top-[0.5rem] right-[0.5rem] bg-[rgba(255,255,255,0.8)] p-[0.25rem] rounded-[50%] cursor-pointer">
                            <Trash2 size={16} color="#ef4444" />
                        </div>
                    </div> :

        <>
                        {!hasContent &&
          <div className="absolute inset-[0] flex items-center justify-center pointer-events-[none] gap-[0.5rem] text-[#94a3b8] z-[0]">


            
                                <PenTool size={18} />
                                <span className="text-[0.82rem] font-[600]">Dibujá aquí tu firma</span>
                            </div>
          }
                        <canvas
            ref={canvasRef}
            width={800} // Retina smooth scaling
            height={height * 2} // Retina smooth scaling








            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {e.preventDefault();startDrawing(e);}}
            onTouchMove={(e) => {e.preventDefault();draw(e);}}
            onTouchEnd={stopDrawing} className="w-[100%] h-[100%] cursor-crosshair block relative z-[1]" />
          
                    </>
        }
            </div>

            {!image &&
      <div className="flex items-center gap-[0.8rem] mt-[0.75rem] p-[0_0.2rem]">
                    <span className="text-[0.75rem] text-[var(--color-text-muted)] font-[600]">Grosor:</span>
                    <input
          type="range" min={1} max={6} step={0.5}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} className="flex-[1] accent-color-[var(--color-primary)]" />
                </div>
      }

            <div className="flex gap-[0.75rem] mt-[0.75rem]">
                <button
          type="button"
          onClick={clearCanvas}
          style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.5rem', fontWeight: 600 }}
          className="flex-[1] flex items-center justify-center gap-[0.5rem] text-[0.8rem] p-[0.5rem] cursor-pointer hover:-translate-y-0.5 transition-transform">
                    <Trash2 size={16} /> Limpiar
                </button>
                <label
          style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.5rem', fontWeight: 600 }}
          className="flex-[1] flex items-center justify-center gap-[0.5rem] cursor-pointer text-[0.8rem] p-[0.5rem] hover:-translate-y-0.5 transition-transform">
                    <Upload size={16} /> Subir Imagen
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>
        </div>);

}