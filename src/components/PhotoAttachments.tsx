import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, X, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompressor';
import { captureFromNativeCamera } from '../utils/nativeCamera';

export interface PhotoAttachmentsProps {
  photos?: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
}

export default function PhotoAttachments({
  photos = [],
  onChange,
  maxPhotos = 8,
  label = 'Fotos de Evidencia'
}: PhotoAttachmentsProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Tomar foto directamente con la cámara del dispositivo móvil (solicita permisos y abre cámara)
  const handleTakePhoto = async () => {
    if (photos.length >= maxPhotos) {
      toast.error(`Límite alcanzado: máximo ${maxPhotos} fotos.`);
      return;
    }

    setIsCapturing(true);
    try {
      const dataUrl = await captureFromNativeCamera({ maxDimension: 1600, quality: 0.85 });
      if (dataUrl) {
        onChange([...photos, dataUrl]);
        toast.success('Foto capturada con éxito 📸');
      }
    } catch (err: any) {
      console.error('[PhotoAttachments] Error al tomar foto:', err);
      toast.error('No se pudo acceder a la cámara. Verifique los permisos.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 2. Adjuntar fotos desde la galería o explorador de archivos
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Solo se pueden agregar ${maxPhotos - photos.length} fotos más (máx. ${maxPhotos}).`);
      return;
    }

    const toastId = toast.loading('Procesando y optimizando fotos...');
    try {
      const newCompressed = await Promise.all(
        files.map(file => compressImage(file, { maxDimension: 1600, quality: 0.85 }))
      );
      onChange([...photos, ...newCompressed.filter(Boolean)]);
      toast.success(`${files.length} foto(s) adjuntada(s) con éxito`, { id: toastId });
    } catch (err) {
      console.error('[PhotoAttachments] Error al procesar imágenes:', err);
      toast.error('Error al procesar las fotos seleccionadas', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    onChange(updated);
    toast.success('Foto eliminada');
  };

  return (
    <div className="mt-4">
      {/* Input oculto para Galería de Fotos (sin atributo capture para abrir galería) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileSelect}
      />

      {/* Cabecera de la sección */}
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Camera size={18} className="text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
          <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full text-xs font-black">
            {photos.length} / {maxPhotos}
          </span>
        </label>
        {photos.length > 0 && photos.length < maxPhotos && (
          <span className="text-xs text-slate-500 font-semibold">
            Puedes agregar {maxPhotos - photos.length} más
          </span>
        )}
      </div>

      {/* ESTADO 1: SIN FOTOS AÚN - 2 BOTONES PRINCIPALES GRANDES */}
      {photos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BOTÓN 1: TOMAR FOTO CON CÁMARA */}
          <button
            type="button"
            onClick={handleTakePhoto}
            disabled={isCapturing}
            className="group p-5 border-2 border-dashed border-emerald-500/70 hover:border-emerald-500 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 flex flex-col items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <Camera size={24} className="stroke-[2.2]" />
            </div>
            <div className="text-center">
              <span className="block text-sm font-black text-slate-900 dark:text-white">
                {isCapturing ? 'Iniciando cámara...' : 'Tomar Foto'}
              </span>
              <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                Abre la cámara del celular al instante
              </span>
            </div>
          </button>

          {/* BOTÓN 2: ADJUNTAR DESDE GALERÍA / ARCHIVOS */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="group p-5 border-2 border-dashed border-sky-500/70 hover:border-sky-500 rounded-2xl bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/20 dark:hover:bg-sky-950/30 flex flex-col items-center justify-center gap-2 text-sky-800 dark:text-sky-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-110 transition-transform">
              <ImageIcon size={24} className="stroke-[2.2]" />
            </div>
            <div className="text-center">
              <span className="block text-sm font-black text-slate-900 dark:text-white">
                Adjuntar Fotos
              </span>
              <span className="block text-xs font-semibold text-sky-700 dark:text-sky-400 mt-0.5">
                Seleccionar desde la galería o archivos
              </span>
            </div>
          </button>
        </div>
      ) : (
        /* ESTADO 2: CON FOTOS ADJUNTAS */
        <div className="space-y-4">
          {/* Barra de acciones rápidas para agregar más fotos si no se llegó al tope */}
          {photos.length < maxPhotos && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isCapturing}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <Camera size={16} />
                <span>{isCapturing ? 'Iniciando cámara...' : 'Tomar Foto'}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <ImageIcon size={16} />
                <span>Adjuntar de Galería</span>
              </button>
            </div>
          )}

          {/* Grilla de miniaturas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {photos.map((src, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden aspect-square border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm"
              >
                <img
                  src={src}
                  alt={`Evidencia ${idx + 1}`}
                  onClick={() => setPreview(src)}
                  className="w-full h-full object-cover block cursor-pointer transition-transform duration-200 group-hover:scale-105"
                />
                
                {/* Badge con número de foto */}
                <span className="absolute top-1.5 left-1.5 bg-black/70 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md pointer-events-none">
                  #{idx + 1}
                </span>

                {/* Botones de acción superpuestos */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setPreview(src)}
                    className="w-8 h-8 rounded-full bg-white/95 text-slate-800 hover:bg-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110"
                    title="Ampliar foto"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110"
                    title="Eliminar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox / Visor de foto ampliada */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            title="Cerrar vista previa"
          >
            <X size={22} />
          </button>
          <img
            src={preview}
            alt="Vista previa ampliada"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
}
