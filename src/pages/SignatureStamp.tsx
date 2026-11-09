import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Trash2,
  Upload,
  PenTool,
  CheckCircle2,
  Wand2,
  Download,
  ArrowLeft,
  Stamp,
  FileCheck,
  Sliders
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

const INK_COLORS = [
  { id: '#1e3a8a', label: 'Azul Lapicera' },
  { id: '#0f172a', label: 'Negro Oficial' },
  { id: '#1d4ed8', label: 'Azul Intenso' },
  { id: '#4c1d95', label: 'Violeta Sello' }
];

export default function SignatureStamp(): React.ReactElement | null {
  const navigate = useNavigate();
  const { syncDocument } = useSync();
  useDocumentTitle('Firma y Sello Digital');

  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stampCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigFileInputRef = useRef<HTMLInputElement | null>(null);
  const stampFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [isDrawingStamp, setIsDrawingStamp] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [signatureStrokeWidth, setSignatureStrokeWidth] = useState<number>(2.5);
  const [stampStrokeWidth, setStampStrokeWidth] = useState<number>(2.5);
  const [inkColor, setInkColor] = useState<string>('#1e3a8a');
  const [signatureHasContent, setSignatureHasContent] = useState(false);
  const [stampHasContent, setStampHasContent] = useState(false);
  const [saved, setSaved] = useState(false);

  // Automatic Stamp Generator fields (pre-populated from personalData)
  const [stampLine1, setStampLine1] = useState('Ing. / Lic. en Higiene y Seguridad');
  const [stampLine2, setStampLine2] = useState('Especialista en Higiene y Seguridad en el Trabajo');
  const [stampLine3, setStampLine3] = useState('Matrícula Profesional: MP 5567');
  const [stampBorderStyle, setStampBorderStyle] = useState<'box' | 'clean' | 'double'>('box');
  const [stampColor, setStampColor] = useState<string>('#1e3a8a');

  useEffect(() => {
    // Load existing signature & stamp
    const savedData = localStorage.getItem('signatureStampData');
    if (savedData) {
      const trimmed = savedData.trim();
      if (trimmed.startsWith('data:') || trimmed.startsWith('"data:')) {
        setSignatureImage(trimmed.startsWith('"') ? trimmed.slice(1, -1) : trimmed);
      } else {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            setSignatureImage(parsed.signature || null);
            setStampImage(parsed.stamp || null);
          }
        } catch (e) {
          console.warn('Error parsing signatureStampData:', e);
        }
      }
    }

    // Load personalData to prefill automatic stamp generator
    try {
      const rawPersonal = localStorage.getItem('personalData');
      if (rawPersonal) {
        const p = JSON.parse(rawPersonal);
        if (p.name) setStampLine1(p.name);
        if (p.profession) setStampLine2(p.profession);
        const licParts = [];
        if (p.license) licParts.push(`Mat. ${p.license}`);
        if (p.college) licParts.push(p.college);
        else if (p.dni) licParts.push(`DNI ${p.dni}`);
        if (licParts.length > 0) setStampLine3(licParts.join(' · '));
      }
    } catch {
      // ignore
    }
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: any, type: 'signature' | 'stamp') => {
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    const strokeW = type === 'signature' ? signatureStrokeWidth : stampStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = type === 'signature' ? inkColor : stampColor;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (type === 'signature') setIsDrawingSignature(true);
    else setIsDrawingStamp(true);
  };

  const draw = (e: any, type: 'signature' | 'stamp') => {
    if (type === 'signature' && !isDrawingSignature) return;
    if (type === 'stamp' && !isDrawingStamp) return;
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (type === 'signature') setSignatureHasContent(true);
    else setStampHasContent(true);
  };

  const stopDrawing = (type: 'signature' | 'stamp') => {
    if (type === 'signature') setIsDrawingSignature(false);
    else setIsDrawingStamp(false);
  };

  const clearCanvas = (type: 'signature' | 'stamp') => {
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (type === 'signature') {
      setSignatureImage(null);
      setSignatureHasContent(false);
    } else {
      setStampImage(null);
      setStampHasContent(false);
    }
    toast.success(type === 'signature' ? 'Firma limpiada' : 'Sello limpiado');
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'signature' | 'stamp'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccioná una imagen válida (PNG, JPG o SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (type === 'signature') {
        setSignatureImage(res);
        setSignatureHasContent(true);
        toast.success('Imagen de firma cargada');
      } else {
        setStampImage(res);
        setStampHasContent(true);
        toast.success('Imagen de sello cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  const cropCanvasDataUrl = (canvas: HTMLCanvasElement | null): string | null => {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas.toDataURL('image/png');
    const w = canvas.width;
    const h = canvas.height;
    const { data } = ctx.getImageData(0, 0, w, h);
    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0,
      found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 15) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) return canvas.toDataURL('image/png');
    const pad = 12;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad);
    maxY = Math.min(h, maxY + pad);
    const trimW = Math.max(1, maxX - minX);
    const trimH = Math.max(1, maxY - minY);
    const out = document.createElement('canvas');
    out.width = trimW;
    out.height = trimH;
    const outCtx = out.getContext('2d');
    if (outCtx) {
      outCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
      return out.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  };

  // Generate crisp transparent PNG stamp from the 3 text lines
  const generateOfficialStamp = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = stampColor;
    ctx.fillStyle = stampColor;

    if (stampBorderStyle === 'box') {
      ctx.lineWidth = 3.5;
      ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    } else if (stampBorderStyle === 'double') {
      ctx.lineWidth = 3.5;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    } else {
      // Clean top/bottom accent line
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(40, 22);
      ctx.lineTo(canvas.width - 40, 22);
      ctx.moveTo(40, canvas.height - 22);
      ctx.lineTo(canvas.width - 40, canvas.height - 22);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Line 1: Name
    ctx.font = '900 24px Inter, Arial, sans-serif';
    ctx.fillText((stampLine1 || 'PROFESIONAL H&S').toUpperCase(), canvas.width / 2, 58, 500);

    // Line 2: Profession
    ctx.font = '700 17px Inter, Arial, sans-serif';
    ctx.fillText(stampLine2 || 'Especialista en Higiene y Seguridad', canvas.width / 2, 94, 500);

    // Line 3: License / Matrícula
    ctx.font = '800 16px monospace';
    ctx.fillText(stampLine3 || 'Matrícula Profesional', canvas.width / 2, 128, 500);

    const pngUrl = canvas.toDataURL('image/png');
    setStampImage(pngUrl);
    setStampHasContent(true);
    toast.success('Sello profesional generado con éxito');
  };

  const handleSave = async () => {
    const finalSig =
      signatureImage ||
      (signatureHasContent ? cropCanvasDataUrl(signatureCanvasRef.current) : null);
    const finalStamp =
      stampImage || (stampHasContent ? cropCanvasDataUrl(stampCanvasRef.current) : null);

    const data = {
      signature: finalSig,
      stamp: finalStamp
    };

    try {
      localStorage.setItem('signatureStampData', JSON.stringify(data));
      await syncDocument('signatureStampData', data);
      setSignatureImage(finalSig);
      setStampImage(finalStamp);
      setSaved(true);
      toast.success('Firma y Sello guardados y sincronizados');
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch {
      localStorage.setItem('signatureStampData', JSON.stringify(data));
      toast.success('Firma y Sello guardados en el dispositivo');
    }
  };

  const downloadImage = (dataUrl: string | null, filename: string) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const inputStyle: React.CSSProperties = {
    marginBottom: 0,
    width: '100%',
    padding: '0.55rem 0.8rem',
    backgroundColor: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    color: 'var(--color-text)',
    fontSize: '0.84rem',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      {/* Strictly hidden file inputs */}
      <input
        ref={sigFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'signature')}
        style={{
          display: 'none',
          width: 0,
          height: 0,
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none'
        }}
      />
      <input
        ref={stampFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'stamp')}
        style={{
          display: 'none',
          width: 0,
          height: 0,
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none'
        }}
      />

      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Firma y Sello Digital Profesional"
          subtitle="Trazá tu firma ológrafa, generá tu sello técnico automático o subí imágenes PNG para certificar todos tus reportes PDF."
          icon={<PenTool className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #2563eb 100%)"
          badge={
            signatureImage && stampImage
              ? 'Firma y Sello Listos'
              : 'Certificación Documental'
          }
          onBack={() => navigate('/profile')}
        />
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN (7 cols on desktop): Signature Pad & Stamp Pad/Generator */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 1. FIRMA DIGITAL CARD */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                    1. Firma Ológrafa Digital
                  </h2>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Dibujá con el dedo o mouse sobre el lienzo blanco, o subí tu firma en PNG.
                  </p>
                </div>
              </div>

              {signatureImage && (
                <button
                  type="button"
                  onClick={() => downloadImage(signatureImage, 'firma-digital-hys.png')}
                  style={{
                    marginBottom: 0,
                    width: 'auto',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '0.65rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PNG
                </button>
              )}
            </div>

            {/* Ink Color & Stroke Controls */}
            {!signatureImage && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase mr-1" style={{ color: 'var(--color-text-light)' }}>
                    Tinta:
                  </span>
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setInkColor(c.id)}
                      style={{
                        marginBottom: 0,
                        width: 'auto',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor: inkColor === c.id ? c.id : 'var(--color-surface)',
                        color: inkColor === c.id ? '#ffffff' : 'var(--color-text)',
                        border: `1px solid ${inkColor === c.id ? c.id : 'var(--color-border)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border border-white/40"
                        style={{ backgroundColor: c.id }}
                      />
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase" style={{ color: 'var(--color-text-light)' }}>
                    Trazo:
                  </span>
                  {[1.8, 2.8, 4.2].map((w, idx) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSignatureStrokeWidth(w)}
                      style={{
                        marginBottom: 0,
                        width: 'auto',
                        padding: '0.22rem 0.55rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor:
                          signatureStrokeWidth === w ? '#2563eb' : 'var(--color-surface)',
                        color: signatureStrokeWidth === w ? '#ffffff' : 'var(--color-text)',
                        border: `1px solid ${
                          signatureStrokeWidth === w ? '#2563eb' : 'var(--color-border)'
                        }`,
                        cursor: 'pointer'
                      }}
                    >
                      {idx === 0 ? 'Fino' : idx === 1 ? 'Medio' : 'Grueso'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Canvas / Preview Box */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                height: '175px',
                backgroundColor: '#ffffff',
                border: `2px dashed ${signatureImage ? '#2563eb' : '#cbd5e1'}`,
                touchAction: 'none'
              }}
            >
              {signatureImage ? (
                <img
                  src={signatureImage}
                  alt="Firma Digital"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              ) : (
                <>
                  {!signatureHasContent && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        gap: '0.4rem'
                      }}
                    >
                      <PenTool size={26} color="#cbd5e1" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                        Firmá acá con tu dedo o mouse
                      </span>
                    </div>
                  )}
                  <canvas
                    ref={signatureCanvasRef}
                    width={600}
                    height={175}
                    onMouseDown={(e) => startDrawing(e, 'signature')}
                    onMouseMove={(e) => draw(e, 'signature')}
                    onMouseUp={() => stopDrawing('signature')}
                    onMouseLeave={() => stopDrawing('signature')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e, 'signature');
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e, 'signature');
                    }}
                    onTouchEnd={() => stopDrawing('signature')}
                    style={{
                      width: '100%',
                      height: '100%',
                      cursor: 'crosshair',
                      display: 'block'
                    }}
                  />
                </>
              )}
            </div>

            {/* Action Buttons for Signature */}
            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => clearCanvas('signature')}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Firma
              </button>

              <button
                type="button"
                onClick={() => sigFileInputRef.current?.click()}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563eb',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <Upload className="w-4 h-4" />
                Subir Firma (PNG/JPG)
              </button>
            </div>
          </div>

          {/* 2. SELLO PROFESIONAL CARD (WITH AUTOMATIC GENERATOR) */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    color: '#7c3aed',
                    border: '1px solid rgba(124, 58, 237, 0.25)'
                  }}
                >
                  <Stamp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                    2. Sello Profesional Oficial
                  </h2>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Generá tu sello institucional en 1 clic con tus datos o subí una imagen.
                  </p>
                </div>
              </div>

              {stampImage && (
                <button
                  type="button"
                  onClick={() => downloadImage(stampImage, 'sello-profesional-hys.png')}
                  style={{
                    marginBottom: 0,
                    width: 'auto',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '0.65rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PNG
                </button>
              )}
            </div>

            {/* Automatic Stamp Generator Box */}
            <div
              className="rounded-2xl p-3.5 sm:p-4 mb-4"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: '#7c3aed' }}
                >
                  <Wand2 className="w-4 h-4" />
                  Generador Automático de Sello H&S
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--color-text-light)' }}>
                    Línea 1 (Nombre y Apellido)
                  </label>
                  <input
                    type="text"
                    value={stampLine1}
                    onChange={(e) => setStampLine1(e.target.value)}
                    placeholder="Ing. Juan Pérez"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--color-text-light)' }}>
                    Línea 2 (Título / Profesión)
                  </label>
                  <input
                    type="text"
                    value={stampLine2}
                    onChange={(e) => setStampLine2(e.target.value)}
                    placeholder="Lic. en Higiene y Seguridad"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--color-text-light)' }}>
                    Línea 3 (Matrícula / Colegio)
                  </label>
                  <input
                    type="text"
                    value={stampLine3}
                    onChange={(e) => setStampLine3(e.target.value)}
                    placeholder="Mat. MP 5567 · COPIME"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'box', label: 'Recuadro' },
                      { id: 'double', label: 'Doble Marco' },
                      { id: 'clean', label: 'Clásico' }
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStampBorderStyle(st.id)}
                      style={{
                        marginBottom: 0,
                        width: 'auto',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor:
                          stampBorderStyle === st.id ? '#7c3aed' : 'var(--color-surface)',
                        color: stampBorderStyle === st.id ? '#ffffff' : 'var(--color-text)',
                        border: `1px solid ${
                          stampBorderStyle === st.id ? '#7c3aed' : 'var(--color-border)'
                        }`,
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}

                  {INK_COLORS.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStampColor(c.id)}
                      title={c.label}
                      style={{
                        marginBottom: 0,
                        width: '26px',
                        height: '26px',
                        padding: 0,
                        borderRadius: '50%',
                        backgroundColor: c.id,
                        border:
                          stampColor === c.id
                            ? '3px solid #7c3aed'
                            : '2px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={generateOfficialStamp}
                  style={{
                    marginBottom: 0,
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  <Wand2 className="w-4 h-4" />
                  Generar Sello Oficial
                </button>
              </div>
            </div>

            {/* Stamp Canvas / Preview Box */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                height: '165px',
                backgroundColor: '#ffffff',
                border: `2px dashed ${stampImage ? '#7c3aed' : '#cbd5e1'}`,
                touchAction: 'none'
              }}
            >
              {stampImage ? (
                <img
                  src={stampImage}
                  alt="Sello Profesional"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '10px',
                    boxSizing: 'border-box'
                  }}
                />
              ) : (
                <>
                  {!stampHasContent && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        gap: '0.4rem',
                        padding: '1rem',
                        textAlign: 'center'
                      }}
                    >
                      <Stamp size={26} color="#cbd5e1" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        Tocá &ldquo;Generar Sello Oficial&rdquo; arriba, subí una foto de tu sello o dibujalo acá
                      </span>
                    </div>
                  )}
                  <canvas
                    ref={stampCanvasRef}
                    width={600}
                    height={165}
                    onMouseDown={(e) => startDrawing(e, 'stamp')}
                    onMouseMove={(e) => draw(e, 'stamp')}
                    onMouseUp={() => stopDrawing('stamp')}
                    onMouseLeave={() => stopDrawing('stamp')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e, 'stamp');
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e, 'stamp');
                    }}
                    onTouchEnd={() => stopDrawing('stamp')}
                    style={{
                      width: '100%',
                      height: '100%',
                      cursor: 'crosshair',
                      display: 'block'
                    }}
                  />
                </>
              )}
            </div>

            {/* Action Buttons for Stamp */}
            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => clearCanvas('stamp')}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Sello
              </button>

              <button
                type="button"
                onClick={() => stampFileInputRef.current?.click()}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  color: '#7c3aed',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <Upload className="w-4 h-4" />
                Subir Sello (PNG/JPG)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols on desktop): Live PDF Certification Block Preview & Save */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-28 text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex items-center justify-between gap-2 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669'
                  }}
                >
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Vista Previa de Certificación PDF
                  </h3>
                  <p className="text-[11px] sm:text-xs m-0" style={{ color: 'var(--color-text-light)' }}>
                    Así se verán tu firma y sello al pie de los informes
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669'
                }}
              >
                A4 Oficial
              </span>
            </div>

            {/* White Paper Signature Block Simulation */}
            <div
              className="rounded-2xl p-5 border shadow-md text-center"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#0f172a'
              }}
            >
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed text-left">
                Por la presente se certifica que el relevamiento técnico fue efectuado conforme a la normativa legal vigente de Higiene y Seguridad en el Trabajo.
              </p>

              {/* Combined Signature + Stamp Box */}
              <div className="min-h-[120px] flex flex-wrap items-center justify-center gap-4 py-2">
                {signatureImage ? (
                  <img
                    src={signatureImage}
                    alt="Firma en PDF"
                    style={{ maxHeight: '75px', maxWidth: '170px', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="text-xs italic text-slate-400">[Firma Ológrafa]</span>
                )}

                {stampImage ? (
                  <img
                    src={stampImage}
                    alt="Sello en PDF"
                    style={{ maxHeight: '75px', maxWidth: '190px', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="text-xs italic text-slate-400">[Sello Profesional]</span>
                )}
              </div>

              <div
                className="border-t-2 border-dashed pt-2.5 mt-1 mx-auto max-w-[280px]"
                style={{ borderColor: '#64748b' }}
              >
                <div className="text-xs font-black uppercase text-slate-900">
                  {stampLine1 || 'Firma y Sello del Profesional'}
                </div>
                <div className="text-[11px] font-bold text-blue-700">
                  {stampLine2 || 'Responsable de Higiene y Seguridad'}
                </div>
                <div className="text-[10px] font-mono text-slate-600">
                  {stampLine3 || 'Matrícula Habilitante'}
                </div>
              </div>
            </div>

            {/* Save & Back Buttons */}
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleSave}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.9rem 1.25rem',
                  borderRadius: '0.95rem',
                  background: saved
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: saved
                    ? '0 8px 20px rgba(16, 185, 129, 0.35)'
                    : '0 8px 20px rgba(37, 99, 235, 0.35)'
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Firma y Sello Guardados!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Firma y Sello
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Mi Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
