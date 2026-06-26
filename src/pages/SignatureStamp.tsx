import React, { useState, useEffect, useRef } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload, PenTool, CheckCircle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function SignatureStamp(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncDocument } = useSync();
  const signatureCanvasRef = useRef(null);
  const stampCanvasRef = useRef(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [isDrawingStamp, setIsDrawingStamp] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [stampImage, setStampImage] = useState(null);
  const [signatureStrokeWidth, setSignatureStrokeWidth] = useState(2);
  const [stampStrokeWidth, setStampStrokeWidth] = useState(2);
  const [signatureHasContent, setSignatureHasContent] = useState(false);
  const [stampHasContent, setStampHasContent] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('signatureStampData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSignatureImage(parsed.signature);
      setStampImage(parsed.stamp);
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e, type) => {
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    const strokeW = type === 'signature' ? signatureStrokeWidth : stampStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (type === 'signature') setIsDrawingSignature(true);else
    setIsDrawingStamp(true);
  };

  const draw = (e, type) => {
    if (type === 'signature' && !isDrawingSignature) return;
    if (type === 'stamp' && !isDrawingStamp) return;
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (type === 'signature') setSignatureHasContent(true);else
    setStampHasContent(true);
  };

  const stopDrawing = (type) => {
    if (type === 'signature') setIsDrawingSignature(false);else
    setIsDrawingStamp(false);
  };

  const clearCanvas = (type) => {
    const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (type === 'signature') {setSignatureImage(null);setSignatureHasContent(false);} else
    {setStampImage(null);setStampHasContent(false);}
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'signature') {setSignatureImage(event.target.result);setSignatureHasContent(true);} else
        {setStampImage(event.target.result);setStampHasContent(true);}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const data = {
      signature: signatureImage || (signatureHasContent ? signatureCanvasRef.current?.toDataURL() : null),
      stamp: stampImage || (stampHasContent ? stampCanvasRef.current?.toDataURL() : null)
    };
    await syncDocument('signatureStampData', data);
    setSaved(true);
    toast.success('Firma y Sello guardados correctamente');
    setTimeout(() => {
      setSaved(false);
      navigate('/profile');
    }, 800);
  };

  const renderCanvasArea = ({ type, canvasRef, image, hasContent, strokeWidth, onStrokeChange, title, description }) =>
  <div className="bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[20px] p-[1.5rem] overflow-[hidden]">






    
            <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                <div className="bg-[rgba(56,_189,_248,_0.1)] p-[0.6rem] rounded-[12px] text-[var(--color-primary)] flex">





        
                    <PenTool size={20} />
                </div>
                <div>
                    <h3 className="m-[0] font-[900] text-[1.05rem]">{title}</h3>
                    <p className="m-[0] text-[0.8rem] text-[var(--color-text-secondary)]">{description}</p>
                </div>
            </div>

            <div style={{

      border: `2px dashed ${image ? 'var(--color-primary)' : 'var(--color-border)'}`,






      boxShadow: image ? '0 4px 15px rgba(56, 189, 248, 0.1)' : 'none'
    }} className="relative rounded-[14px] bg-[white] h-[160px] touch-action-[none] overflow-[hidden] transition-[border-color_0.2s]">
                {image ?
      <img src={image} alt={type === 'signature' ? 'Firma' : 'Sello'} className="w-[100%] h-[100%] object-fit-[contain] p-[8px] box-sizing-[border-box]" /> :

      <>
                        {!hasContent &&
        <div className="absolute inset-[0] flex items-center justify-center pointer-events-[none] gap-[0.5rem] text-[#94a3b8] flex-col">


          
                                <PenTool size={28} color="#cbd5e1" />
                                <span className="text-[0.85rem] font-[600] text-[#94a3b8]">Dibujá aquí con el mouse o dedo</span>
                            </div>
        }
                        <canvas
          ref={canvasRef}
          width={500}
          height={160}

          onMouseDown={(e) => startDrawing(e, type)}
          onMouseMove={(e) => draw(e, type)}
          onMouseUp={() => stopDrawing(type)}
          onMouseLeave={() => stopDrawing(type)}
          onTouchStart={(e) => {e.preventDefault();startDrawing(e, type);}}
          onTouchMove={(e) => {e.preventDefault();draw(e, type);}}
          onTouchEnd={() => stopDrawing(type)} className="w-[100%] h-[100%] cursor-crosshair block" />
        
                    </>
      }
            </div>

            {/* Stroke width slider */}
            {!image &&
    <div className="flex items-center gap-[0.8rem] mt-[1rem]">
                    <span className="text-[0.78rem] text-[var(--color-text-secondary)] font-[700] white-space-[nowrap]">Grosor:</span>
                    <input
        type="range" min={1} max={6} step={0.5}
        value={strokeWidth}
        onChange={(e) => onStrokeChange(parseFloat(e.target.value))} className="flex-[1] accent-color-[var(--color-primary)]" />

      
                    <div style={{
        width: `${Math.max(strokeWidth * 3, 4)}px`,
        height: `${Math.max(strokeWidth * 3, 4)}px`


      }} className="rounded-[50%] bg-[#1e293b] flex-shrink-[0] transition-[all_0.2s]" />
                </div>
    }

            <div className="flex gap-[0.8rem] mt-[1rem]">
                <button onClick={() => clearCanvas(type)}












      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        e.currentTarget.style.color = '#ef4444';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-background)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.color = 'var(--color-text)';
      }} className="flex-[1] flex items-center justify-center gap-[0.5rem] p-[0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[12px] text-[var(--color-text)] font-[700] text-[0.9rem] cursor-pointer transition-[all_0.2s]">
        
                    <Trash2 size={16} /> Limpiar
                </button>
                <label












        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'} className="flex-[1] flex items-center justify-center gap-[0.5rem] p-[0.8rem] bg-[rgba(56,_189,_248,_0.08)] border-[1px_solid_rgba(56,_189,_248,_0.3)] rounded-[12px] text-[var(--color-primary)] font-[700] text-[0.9rem] cursor-pointer transition-[all_0.2s]">
        
                    <Upload size={16} /> Subir imagen
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, type)} />
                </label>
            </div>
        </div>;


  return (
    <div className="container animate-fade-in max-w-[600px] pb-[4rem]">
            {/* Header */}
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.6rem] font-[900] letter-spacing-[-0.5px]">Firma y Sello Digital</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)]">Dibujá o subí tu firma y sello profesional</p>
                </div>
            </div>

            <div className="flex flex-col gap-[1.5rem]">
                {renderCanvasArea({
          type: "signature",
          canvasRef: signatureCanvasRef,
          image: signatureImage,
          hasContent: signatureHasContent,
          strokeWidth: signatureStrokeWidth,
          onStrokeChange: setSignatureStrokeWidth,
          title: "Firma Digital",
          description: "Usada en todos los documentos y reportes"
        })}

                {renderCanvasArea({
          type: "stamp",
          canvasRef: stampCanvasRef,
          image: stampImage,
          hasContent: stampHasContent,
          strokeWidth: stampStrokeWidth,
          onStrokeChange: setStampStrokeWidth,
          title: "Sello Profesional",
          description: "Sello oficial del profesional"
        })}

                <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          style={{


            background: saved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',


            boxShadow: saved ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(56, 189, 248, 0.3)'

          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'} className="flex justify-center items-center gap-[0.6rem] p-[1.1rem] w-[100%] text-[white] border-none rounded-[16px] text-[1.05rem] font-[800] cursor-pointer transition-[all_0.3s_ease]">
          
                    {saved ? <><CheckCircle size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Firma y Sello</>}
                </button>
            </div>
        </div>);

}