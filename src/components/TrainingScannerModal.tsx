import React, { useState, useRef } from 'react';
import { Camera, Upload, ScanLine, Sparkles, X, Check, Loader2, AlertCircle, RefreshCw, UserCheck, FileText, Zap, ZapOff, Image as ImageIcon, Trash2, Plus, Layers } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export interface ExtractedAsistente {
  nombre: string;
  dni: string;
  puesto?: string;
  nota?: string;
  firmado?: boolean;
}

export interface ExtractedTrainingData {
  sheetDetected: boolean;
  confidence?: number;
  tema?: string;
  tipoCapacitacion?: string;
  fecha?: string;
  duracion?: string;
  expositor?: string;
  empresa?: string;
  lugar?: string;
  objetivo?: string;
  asistentes: ExtractedAsistente[];
  observaciones?: string;
}

interface TrainingScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedTrainingData, imageBase64: string) => void;
}

// Función auxiliar de compresión del lado del cliente para reducir tamaño sin perder legibilidad
const compressImage = (dataUrl: string, maxWidth = 1600, quality = 0.82): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export default function TrainingScannerModal({ isOpen, onClose, onApplyData }: TrainingScannerModalProps) {
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [resultData, setResultData] = useState<ExtractedTrainingData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error(`El archivo ${file.name} no es una imagen válida`));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        resolve(compressed);
      };
      reader.onerror = () => reject(new Error(`Error al leer ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading(`Cargando ${files.length} foto(s)...`);

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await processFile(files[i]);
        newImages.push(compressed);
      }

      setImagesList((prev) => [...prev, ...newImages]);
      setResultData(null);
      toast.dismiss(toastId);
      toast.success(`${newImages.length} hoja(s) agregada(s) correctamente!`);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Error al procesar archivos');
    }

    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setIsFlashOn(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = (track.getCapabilities() as any) || {};
        if (capabilities.torch) {
          setHasFlashSupport(true);
        } else {
          setHasFlashSupport(true);
        }
      } else {
        setHasFlashSupport(true);
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      toast.error('No se pudo abrir la cámara directa. Usá las opciones de Galería / Cámara Nativa.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        if (isFlashOn) {
          (track as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        }
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsFlashOn(false);
  };

  const toggleFlash = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const nextState = !isFlashOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }]
          });
          setIsFlashOn(nextState);
          toast.success(nextState ? 'Flash Encendido ⚡' : 'Flash Apagado');
        } catch (e) {
          console.error("Error toggling flash:", e);
          toast.error('El flash no está soportado en esta cámara o navegador.');
        }
      }
    }
  };

  const captureCameraPhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawUrl = canvas.toDataURL('image/jpeg', 0.92);
      const compressed = await compressImage(rawUrl);

      setImagesList((prev) => [...prev, compressed]);
      setActiveImageIndex((prev) => imagesList.length); // seleccionar la nueva
      setResultData(null);
      toast.success(`Foto ${imagesList.length + 1} capturada! Podés tomar más o finalizar.`);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeImageIndex >= imagesList.length - 1) {
      setActiveImageIndex(Math.max(0, imagesList.length - 2));
    }
    setResultData(null);
  };

  const handleAnalyzeAll = async () => {
    if (imagesList.length === 0) {
      toast.error('Primero cargá o tomá al menos una foto de la planilla.');
      return;
    }

    setIsAnalyzing(true);
    setResultData(null);

    const mergedData: ExtractedTrainingData = {
      sheetDetected: false,
      tema: '',
      tipoCapacitacion: 'Seguridad e Higiene',
      fecha: '',
      duracion: '',
      expositor: '',
      empresa: '',
      lugar: '',
      objetivo: '',
      asistentes: [],
      observaciones: ''
    };

    const uniqueDNI = new Set<string>();
    const uniqueNames = new Set<string>();
    let totalAsistentesDetectados = 0;
    let successfulSheets = 0;

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : '';

      for (let i = 0; i < imagesList.length; i++) {
        setAnalysisProgress(`Procesando hoja ${i + 1} de ${imagesList.length} con IA...`);
        const toastId = toast.loading(`Procesando hoja ${i + 1} de ${imagesList.length}...`);

        try {
          const response = await fetch(`${API_BASE_URL}/api/analyze-training-sheet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ image: imagesList[i] })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.details || `Error HTTP ${response.status}`);
          }

          const pageData: ExtractedTrainingData = await response.json();
          toast.dismiss(toastId);

          if (pageData.sheetDetected) {
            mergedData.sheetDetected = true;
            successfulSheets++;

            // Tomar los datos del encabezado de la primera planilla leída
            if (!mergedData.tema && pageData.tema) mergedData.tema = pageData.tema;
            if (!mergedData.tipoCapacitacion && pageData.tipoCapacitacion) mergedData.tipoCapacitacion = pageData.tipoCapacitacion;
            if (!mergedData.fecha && pageData.fecha) mergedData.fecha = pageData.fecha;
            if (!mergedData.duracion && pageData.duracion) mergedData.duracion = pageData.duracion;
            if (!mergedData.expositor && pageData.expositor) mergedData.expositor = pageData.expositor;
            if (!mergedData.empresa && pageData.empresa) mergedData.empresa = pageData.empresa;
            if (!mergedData.lugar && pageData.lugar) mergedData.lugar = pageData.lugar;
            if (!mergedData.objetivo && pageData.objetivo) mergedData.objetivo = pageData.objetivo;

            // Consolidar asistentes evitando duplicados por DNI o Nombre
            if (pageData.asistentes && Array.isArray(pageData.asistentes)) {
              for (const a of pageData.asistentes) {
                const cleanDni = (a.dni || '').trim().toLowerCase();
                const cleanName = (a.nombre || '').trim().toLowerCase();

                if (cleanDni && uniqueDNI.has(cleanDni)) continue;
                if (!cleanDni && cleanName && uniqueNames.has(cleanName)) continue;

                if (cleanDni) uniqueDNI.add(cleanDni);
                if (cleanName) uniqueNames.add(cleanName);

                mergedData.asistentes.push(a);
                totalAsistentesDetectados++;
              }
            }
          } else {
            toast.error(`Hoja ${i + 1}: No se detectó planilla legible.`);
          }
        } catch (err: any) {
          toast.dismiss(toastId);
          console.error(`Error procesando hoja ${i + 1}:`, err);
          toast.error(`Hoja ${i + 1}: ${err.message || 'Error al escanear'}`);
        }
      }

      if (!mergedData.sheetDetected) {
        toast.error('No se pudo leer información clara en ninguna de las planillas enviadas.');
      } else {
        toast.success(`¡Proceso completado! Se leyeron ${successfulSheets} hoja(s) y un total de ${totalAsistentesDetectados} asistentes.`, { duration: 6000 });
      }

      setResultData(mergedData);
    } catch (err: any) {
      console.error("Error global en análisis múltiple:", err);
      toast.error(err.message || 'Ocurrió un error al procesar las planillas con IA');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleApply = () => {
    if (!resultData || imagesList.length === 0) return;
    onApplyData(resultData, imagesList[0]); // Pasar dataset consolidado e imagen principal
    toast.success(`¡Datos cargados! ${resultData.asistentes?.length || 0} asistentes importados al formulario.`);
    onClose();
  };

  const resetAll = () => {
    setImagesList([]);
    setActiveImageIndex(0);
    setResultData(null);
    stopCamera();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[var(--color-bg-surface,#18181b)] border border-emerald-500/40 text-[var(--color-text,#f4f4f5)] rounded-none sm:rounded-3xl w-full h-full sm:h-auto max-w-4xl sm:max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Escáner Multi-Planilla IA
                {imagesList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold">
                    {imagesList.length} {imagesList.length === 1 ? 'hoja' : 'hojas'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium">
                Cargá o fotografiá 1 o varias planillas físicas del mismo tema (500+ personas).
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Si NO hay imágenes y NO está la cámara activa */}
          {imagesList.length === 0 && !isCameraActive && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center transition-all bg-gradient-to-b from-emerald-950/30 via-zinc-900/60 to-zinc-950 group my-auto min-h-[320px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 border border-emerald-400/30 flex items-center justify-center text-white mb-4 group-hover:scale-110 shadow-xl shadow-emerald-500/30 transition-transform">
                <Layers className="w-8 h-8" />
              </div>
              <h4 className="text-base sm:text-xl font-black text-white mb-1">
                Subí una o varias planillas físicas de capacitación
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mb-6">
                Podés seleccionar múltiples fotos de una sola vez desde la Galería o fotografiarlas con la cámara.
              </p>

              {/* Botones de Selección Nativa de Múltiples Fotos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md">
                {/* 1. Selector de Galería MÚLTIPLE */}
                <label className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-600/30 cursor-pointer transition-all active:scale-95 text-center">
                  <ImageIcon className="w-5 h-5 shrink-0" />
                  <span>Elegir Fotos de Galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* 2. Captura Directa con Cámara Nativa */}
                <label className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-400 text-white font-black text-sm shadow-xl shadow-indigo-600/30 cursor-pointer transition-all active:scale-95 text-center">
                  <Camera className="w-5 h-5 shrink-0 text-amber-300" />
                  <span>Tomar Foto (Cámara)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Opción Secundaria: Visor en Vivo en Pantalla */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80 w-full max-w-md flex justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 underline decoration-emerald-500/40 underline-offset-4"
                >
                  <Camera className="w-3.5 h-3.5" /> Abrir Cámara en Vivo en Pantalla
                </button>
              </div>
            </div>
          )}

          {/* Modo Cámara en Vivo */}
          {isCameraActive && (
            <div className="flex flex-col items-center gap-4 w-full h-full min-h-[380px]">
              <div className="relative w-full flex-1 min-h-[320px] max-h-[60vh] sm:max-h-[480px] rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/60 shadow-2xl flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-4 pointer-events-none rounded-xl" />
                
                {/* Botón de Flash / Linterna */}
                {hasFlashSupport && (
                  <button
                    type="button"
                    onClick={toggleFlash}
                    className={`absolute top-4 right-4 z-20 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md ${
                      isFlashOn
                        ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-amber-500/40'
                        : 'bg-black/60 text-zinc-300 border border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    {isFlashOn ? <Zap className="w-4 h-4 fill-amber-950" /> : <ZapOff className="w-4 h-4" />}
                    <span>FLASH {isFlashOn ? 'ON ⚡' : 'OFF'}</span>
                  </button>
                )}

                {/* Badge de Fotos Capturadas */}
                {imagesList.length > 0 && (
                  <div className="absolute bottom-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-emerald-600/90 text-white border border-emerald-400/50 text-xs font-black shadow-lg">
                    {imagesList.length} {imagesList.length === 1 ? 'foto guardada' : 'fotos guardadas'}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/40 cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5 text-amber-300" /> Capturar Foto ({imagesList.length + 1})
                </button>
                {imagesList.length > 0 && (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Listo ({imagesList.length} fotos)
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm cursor-pointer"
                >
                  Cerrar Cámara
                </button>
              </div>
            </div>
          )}

          {/* Vista Previa de Imágenes Cargadas & Botones de Análisis */}
          {imagesList.length > 0 && !isCameraActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Columna Izquierda: Galería de Fotos / Tiras de Hojas */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Hojas de Asistencia ({imagesList.length})
                  </span>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar Todas
                  </button>
                </div>

                {/* Tira Horizontal de Miniaturas (Carousel de Hojas) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {imagesList.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        activeImageIndex === idx
                          ? 'border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Hoja ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-500"
                        title="Eliminar esta hoja"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Botones de Agregar Más Hojas */}
                  <label className="w-20 h-24 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 flex flex-col items-center justify-center text-emerald-400 shrink-0 cursor-pointer hover:bg-emerald-950/40 transition-colors">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-extrabold text-center px-1 leading-tight">+ Más Hojas</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Visor Grande de la Hoja Seleccionada */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center min-h-[260px] sm:min-h-[380px] max-h-[45vh] sm:max-h-[450px]">
                  <img
                    src={imagesList[activeImageIndex] || imagesList[0]}
                    alt={`Hoja ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain max-h-[45vh] sm:max-h-[450px]"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 border border-zinc-700 text-emerald-300 font-black text-xs px-3 py-1 rounded-xl backdrop-blur-md">
                    Hoja {activeImageIndex + 1} de {imagesList.length}
                  </div>
                </div>

                {/* Botón Principal de Acción: Analizar Todas las Planillas */}
                {!resultData && (
                  <button
                    type="button"
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                        <span>{analysisProgress || 'Procesando Planillas con IA...'}</span>
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-5 h-5 text-amber-300 animate-pulse" />
                        <span>Analizar {imagesList.length} {imagesList.length === 1 ? 'Planilla' : 'Planillas'} con IA e Importar</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Columna Derecha: Resultados del Análisis Consolidado */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Resultado Consolidado</span>
                  {resultData?.sheetDetected && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Lectura Exitosa
                    </span>
                  )}
                </span>

                {isAnalyzing && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-emerald-500/30 rounded-2xl bg-emerald-950/20 text-center min-h-[260px]">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <p className="text-sm font-black text-white">{analysisProgress || 'Leyendo firmas y asistentes...'}</p>
                    <p className="text-xs text-emerald-300/80 mt-1">Consolidando nómina de todas las hojas.</p>
                  </div>
                )}

                {!isAnalyzing && !resultData && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-center min-h-[260px]">
                    <Sparkles className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-xs text-zinc-300">
                      Tocá en <strong>"Analizar {imagesList.length} Planilla(s) con IA"</strong> para escanear y consolidar las listas.
                    </p>
                  </div>
                )}

                {resultData && (
                  <div className="flex-1 flex flex-col gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 overflow-y-auto max-h-[400px] sm:max-h-[460px]">
                    {!resultData.sheetDetected ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                        <div>
                          <strong className="text-amber-200">No se detectó planilla legible.</strong>
                          <p className="mt-1 text-zinc-300">
                            Intentá tomar las fotos de frente y con buena iluminación.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header Fields Summary */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="col-span-2">
                            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Tema:</span>
                            <span className="font-black text-emerald-300 text-sm">{resultData.tema || 'No especificado'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Categoría:</span>
                            <span className="font-bold text-zinc-200">{resultData.tipoCapacitacion || 'Seguridad e Higiene'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Fecha:</span>
                            <span className="font-bold text-zinc-200">{resultData.fecha || 'No especificada'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Duración:</span>
                            <span className="font-bold text-zinc-200">{resultData.duracion ? `${resultData.duracion} hs` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Expositor:</span>
                            <span className="font-bold text-zinc-200">{resultData.expositor || '-'}</span>
                          </div>
                        </div>

                        {/* Attendees List Consolidada */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                              <UserCheck className="w-4 h-4 text-emerald-400" />
                              Nómina Consolidada ({resultData.asistentes?.length || 0} personas)
                            </span>
                          </div>

                          {(!resultData.asistentes || resultData.asistentes.length === 0) ? (
                            <p className="text-xs text-zinc-500 italic p-2">No se detectaron filas en la nómina.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                              {resultData.asistentes.map((asistente, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
                                >
                                  <div className="flex flex-col pr-2">
                                    <span className="font-bold text-white">{idx + 1}. {asistente.nombre}</span>
                                    <span className="text-[10px] text-zinc-400">
                                      DNI: <strong className="text-zinc-300">{asistente.dni || 'S/N'}</strong> {asistente.puesto ? `• ${asistente.puesto}` : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {asistente.nota && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                                        Nota: {asistente.nota}
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      asistente.firmado
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {asistente.firmado ? 'Firmado ✓' : 'Sin Firma'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Botón Aplicar Datos */}
                        <button
                          type="button"
                          onClick={handleApply}
                          className="w-full py-4 mt-1 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/40 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                        >
                          <Check className="w-5 h-5" /> Aplicar Datos al Formulario ({resultData.asistentes?.length || 0} Asistentes)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
