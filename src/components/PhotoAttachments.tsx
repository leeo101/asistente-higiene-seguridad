
import React, { useState, useRef } from 'react';
import { Camera, Image, Trash2, ZoomIn, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PhotoAttachments — reutilizable en cualquier módulo.
 * Props:
 *   photos: string[]   — array de dataURLs
 *   onChange: fn       — recibe el nuevo array de dataURLs
 *   maxPhotos: number  — default 5
 *   label: string      — encabezado de sección
 */
export interface PhotoAttachmentsProps {
  photos?: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
}

export default function PhotoAttachments({ photos = [], onChange, maxPhotos = 5, label = 'Fotos de Evidencia' }: PhotoAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null); // lightbox

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo ${maxPhotos} fotos por registro.`);
      return;
    }

    const readers = files.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then((newDataUrls) => {
      onChange([...photos, ...newDataUrls]);
    });

    // reset input so same file can be selected again
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="mt-[1rem]">
            <div className="flex justify-space-between items-center mb-[0.75rem]">
                <label className="text-[0.82rem] font-[700] text-[var(--color-text-muted)] flex items-center gap-[0.4rem]">
                    <Camera size={15} /> {label}
                    {photos.length > 0 &&
                        <span className="bg-[rgba(59,130,246,0.1)] text-[var(--color-primary)] p-[0.1rem_0.5rem] rounded-[20px] text-[0.65rem] font-[800]">
                            {photos.length}/{maxPhotos}
                        </span>
                    }
                </label>
                <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          hidden
          onChange={handleFileSelect} />
        
            </div>

            {photos.length === 0 ?
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-[100%] p-[2rem] border-[2px_dashed_#10b981] rounded-[16px] bg-[rgba(16,215,140,0.04)] hover:bg-[rgba(16,215,140,0.08)] cursor-pointer flex flex-col items-center gap-[0.75rem] text-[#0f766e] transition-[all_0.3s_ease] shadow-inner group">
                    <div className="bg-[#10b981] text-white p-[0.8rem] rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
                        <Camera size={26} />
                    </div>
                    <span className="text-[0.95rem] font-[800] tracking-tight">Toca para adjuntar fotos de evidencia</span>
                    <span className="text-[0.75rem] font-medium opacity-80">JPG, PNG — máx. {maxPhotos} fotos</span>
                </button> :

      <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(100px,_1fr))] gap-[0.6rem]">
                    {photos.map((src, idx) =>
        <div
          key={idx} className="relative rounded-[10px] overflow-[hidden] aspect-ratio-[1]">

          
                            <img
            src={src}
            alt={`Foto ${idx + 1}`}

            onClick={() => setPreview(src)} className="w-[100%] h-[100%] object-fit-[cover] block cursor-pointer" />
          
                            {/* Action overlay — shown on hover (desktop) or always (touch via CSS) */}
                            <div
            className="photo-overlay absolute inset-[0] bg-[rgba(0,0,0,0.4)] flex items-center justify-center gap-[0.5rem] opacity-[0] transition-[opacity_0.2s]"






            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0'}>
            
                                <button
              type="button"
              onClick={() => setPreview(src)} className="bg-[rgba(255,255,255,0.9)] border-none rounded-[50%] w-[36px] h-[36px] min-h-[36px] flex items-center justify-center cursor-pointer">

              
                                    <ZoomIn size={15} />
                                </button>
                                <button
              type="button"
              onClick={() => removePhoto(idx)} className="bg-[rgba(239,68,68,0.9)] border-none rounded-[50%] w-[36px] h-[36px] min-h-[36px] flex items-center justify-center cursor-pointer text-[#ffffff]">

              
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
        )}
                    {photos.length < maxPhotos &&
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}






          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'} className="aspect-ratio-[1] rounded-[10px] border-[2px_dashed_var(--color-border)] bg-[transparent] cursor-pointer flex flex-col items-center justify-center gap-[0.3rem] text-[var(--color-text-muted)] transition-[border-color_0.2s]">
          
                            <Camera size={18} className="opacity-[0.5]" />
                            <span className="text-[0.6rem] font-[700]">Agregar</span>
                        </button>
        }
                </div>
      }

            {/* Lightbox */}
            {preview &&
      <div
        onClick={() => setPreview(null)} className="fixed inset-[0] z-[9999] bg-[rgba(0,0,0,0.85)] backdrop-filter-[blur(8px)] flex items-center justify-center p-[1.5rem] animation-[fadeIn_0.2s_ease]">






        
                    <button
          onClick={() => setPreview(null)} className="absolute top-[1.5rem] right-[1.5rem] bg-[rgba(255,255,255,0.15)] border-none rounded-[50%] w-[40px] h-[40px] p-[0] flex items-center justify-center cursor-pointer text-[#ffffff]">

          
                        <X size={20} />
                    </button>
                    <img
          src={preview}
          alt="Vista previa"

          onClick={(e) => e.stopPropagation()} className="max-w-[100%] max-height-[85vh] rounded-[12px] object-fit-[contain] box-shadow-[0_20px_60px_rgba(0,0,0,0.5)]" />
        
                </div>
      }
        </div>);

}