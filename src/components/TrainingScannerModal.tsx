import React, { useState, useRef } from 'react';
import { Camera, Upload, ScanLine, Sparkles, X, Check, Loader2, AlertCircle, RefreshCw, UserCheck, FileText, Zap, ZapOff, Image as ImageIcon } from 'lucide-react';
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

export default function TrainingScannerModal({ isOpen, onClose, onApplyData }: TrainingScannerModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultData, setResultData] = useState<ExtractedTrainingData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccioná un archivo de imagen válido (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('La imagen excede los 15MB. Probá tomar la foto con menor resolución.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setResultData(null);
    };
    reader.readAsDataURL(file);
    // reset input value so re-selecting same file works
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
          setHasFlashSupport(true); // Always offer flash toggle button for web compatibility
        }
      } else {
        setHasFlashSupport(true);
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      toast.error('No se pudo abrir la cámara web/móvil directa. Usá las opciones "Tomar Foto con Cámara" o "Elegir de Galería".');
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

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedImage(dataUrl);
      setResultData(null);
      stopCamera();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Primero cargá o tomá una foto de la planilla.');
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading('Procesando planilla con Inteligencia Artificial...');

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : '';

      const response = await fetch(`${API_BASE_URL}/api/analyze-training-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ image: selectedImage })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `Error en servidor (${response.status})`);
      }

      const data: ExtractedTrainingData = await response.json();
      toast.dismiss(toastId);

      if (!data.sheetDetected) {
        toast.error('No se detectó claramente una planilla de capacitación en la foto. Intentá con otra foto o mejor iluminación.', { duration: 5000 });
      } else {
        toast.success(`Planilla leída correctamente! Se encontraron ${data.asistentes?.length || 0} asistentes.`);
      }

      setResultData(data);
    } catch (err: any) {
      console.error("Error al analizar planilla:", err);
      toast.dismiss(toastId);
      toast.error(err.message || 'Ocurrió un error al procesar la imagen con IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!resultData || !selectedImage) return;
    onApplyData(resultData, selectedImage);
    toast.success('Datos cargados en el formulario de capacitación.');
    onClose();
  };

  const resetSelection = () => {
    setSelectedImage(null);
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
                Escáner Inteligente de Planillas IA
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium">
                Fotografiá una planilla física para extraer tema, fecha y nómina de firmantes.
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
          {!selectedImage && !isCameraActive && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center transition-all bg-gradient-to-b from-emerald-950/30 via-zinc-900/60 to-zinc-950 group my-auto min-h-[320px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 border border-emerald-400/30 flex items-center justify-center text-white mb-4 group-hover:scale-110 shadow-xl shadow-emerald-500/30 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base sm:text-xl font-black text-white mb-1">
                Subí o fotografiá la hoja de capacitación física
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mb-6">
                Seleccioná una opción para capturar la planilla completa de asistencia o examen.
              </p>

              {/* Botones de Selección Nativa (Labels 100% compatibles con celulares Android y iPhone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md">
                {/* 1. Selector de Galería (SIN capture para abrir la Galería/Archivos sin problemas) */}
                <label className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-600/30 cursor-pointer transition-all active:scale-95 text-center">
                  <ImageIcon className="w-5 h-5 shrink-0" />
                  <span>Elegir de Galería / Archivos</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* 2. Captura Directa con Cámara Nativa del Celular */}
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

              {/* Opción Secundaria: Visor en Vivo en la Web */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80 w-full max-w-md flex justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 underline decoration-emerald-500/40 underline-offset-4"
                >
                  <Camera className="w-3.5 h-3.5" /> Abrir Cámara en Pantalla Completa
                </button>
              </div>
            </div>
          )}

          {/* Camera Streaming Mode (Visor en Vivo Ampliado) */}
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
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/40 cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5 text-amber-300" /> Capturar Foto de la Planilla
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Selected Image Preview & Analysis Results */}
          {selectedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Left Column: Image Preview (Vista Previa Ampliada) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Foto Capturada
                  </span>
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sacar Otra Foto
                  </button>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center min-h-[300px] sm:min-h-[420px] max-h-[50vh] sm:max-h-[500px]">
                  <img
                    src={selectedImage}
                    alt="Planilla de capacitación"
                    className="w-full h-full object-contain max-h-[50vh] sm:max-h-[500px]"
                  />
                </div>

                {!resultData && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Procesando Planilla con IA...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-5 h-5 text-amber-300 animate-pulse" /> Analizar con IA e Importar Datos
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Right Column: AI Extraction Results */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Datos Extraídos</span>
                  {resultData?.sheetDetected && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Planilla detectada
                    </span>
                  )}
                </span>

                {isAnalyzing && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-emerald-500/30 rounded-2xl bg-emerald-950/20 text-center min-h-[260px]">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <p className="text-sm font-black text-white">Leyendo encabezados y lista de firmantes...</p>
                    <p className="text-xs text-emerald-300/80 mt-1">Por favor aguardá unos segundos.</p>
                  </div>
                )}

                {!isAnalyzing && !resultData && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-zinc-800 rounded-2xl bg-zinc-900/30 text-center min-h-[260px]">
                    <Sparkles className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-xs text-zinc-300">
                      Tocá en <strong>"Analizar con IA e Importar Datos"</strong> para escanear la foto.
                    </p>
                  </div>
                )}

                {resultData && (
                  <div className="flex-1 flex flex-col gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 overflow-y-auto max-h-[400px] sm:max-h-[460px]">
                    {!resultData.sheetDetected ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                        <div>
                          <strong className="text-amber-200">No se detectó planilla clara.</strong>
                          <p className="mt-1 text-zinc-300">
                            Intentá tomar la foto enfrente de la hoja y con buena iluminación.
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

                        {/* Attendees List */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                              <UserCheck className="w-4 h-4 text-emerald-400" />
                              Asistentes ({resultData.asistentes?.length || 0})
                            </span>
                          </div>

                          {(!resultData.asistentes || resultData.asistentes.length === 0) ? (
                            <p className="text-xs text-zinc-500 italic p-2">No se detectaron filas en la nómina.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                              {resultData.asistentes.map((asistente, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
                                >
                                  <div className="flex flex-col pr-2">
                                    <span className="font-bold text-white">{asistente.nombre}</span>
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

                        {/* Action Apply Button */}
                        <button
                          type="button"
                          onClick={handleApply}
                          className="w-full py-4 mt-1 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/40 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                        >
                          <Check className="w-5 h-5" /> Aplicar Datos a la Capacitación
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
