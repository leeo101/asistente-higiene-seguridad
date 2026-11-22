import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Camera, RefreshCw, CheckCircle, TriangleAlert, ShieldCheck, Zap, ZapOff, FlipHorizontal, Search, Upload } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { uploadImageToStorage } from '../services/storageService';
import { safeSetLocalStorage, safeJsonParse } from '../utils/storageHelper';
import PremiumHeader from '../components/PremiumHeader';
import { getErrorMessage } from '../utils/errorUtils';
import { captureFromNativeCamera, isMobileDevice } from '../utils/nativeCamera';
import { compressImage } from '../utils/imageCompressor';
import { analyzeGeneralRisksLocally } from '../utils/localVisionAnalyzer';

export default function AIGeneralCamera(): React.ReactElement | null {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const initialImage = (location.state as any)?.initialImage;
  const { syncCollection } = useSync();
  useDocumentTitle('Detección de Riesgos IA');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, _setStream] = useState(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(initialImage || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'

  const setStream = (newStream) => {
    streamRef.current = newStream;
    _setStream(newStream);
  };

  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  useEffect(() => {
    if (loading || !isPro) return;
    window.scrollTo(0, 0);

    if (initialImage) {
      analyzeImage(initialImage);
      return;
    }

    startCamera();
    return () => {
      stopStream();
    };
  }, [initialImage, facingMode, isPro, loading]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    _setStream(null);
  };

  const startCamera = async () => {
    stopStream();
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 800 },
          height: { ideal: 600 }
        }
      };
      const newStream = await window.navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
      setTorchOn(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("No se pudo acceder a la cámara. Por favor, asegúrese de dar los permisos necesarios.");
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities();
      if (!capabilities.torch) {
        toast.error("Este dispositivo no soporta linterna o no está disponible en esta cámara.");
        return;
      }
      const newTorchState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.error("Torch error:", err);
      toast.error("Error al controlar la linterna.");
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    if (!isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxWidth = 600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width === 0 || height === 0) {
      // Draw a beautiful simulated workspace environment
      width = 600;
      height = 450;
      canvas.width = width;
      canvas.height = height;

      // Draw slate grid background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Draw diagonal black/yellow warning stripes at bottom
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(50, 400);
      ctx.lineTo(550, 400);
      ctx.lineTo(530, 440);
      ctx.lineTo(70, 440);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(50, 400);
      ctx.lineTo(550, 400);
      ctx.lineTo(530, 440);
      ctx.lineTo(70, 440);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < width + 100; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 380);
        ctx.lineTo(i - 40, 460);
        ctx.lineTo(i - 20, 460);
        ctx.lineTo(i + 20, 380);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Hazard Box 1: Cable obstaculo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 150, 150, 120);
      ctx.fillRect(100, 150, 150, 120);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText("PELIGRO: OBSTÁCULO / CABLES", 110, 175);

      // Hazard Box 2: Extintor bloqueado
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeRect(350, 120, 180, 200);
      ctx.fillRect(350, 120, 180, 200);

      ctx.fillStyle = '#ef4444';
      ctx.fillText("PELIGRO: EXTINTOR BLOQUEADO", 360, 145);

      // Title at top
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 18px Outfit, Inter, sans-serif';
      ctx.fillText("SIMULACIÓN DE ENTORNO DE TRABAJO", 30, 30);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText("Cámara física inactiva — Simulación de Análisis de Riesgos H&S", 30, 50);

      // Clean path
      ctx.fillStyle = '#10b981';
      ctx.fillText("✓ ÁREA DE PASO LIMPIA", 110, 350);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(100, 320, 180, 40);
      ctx.fillRect(100, 320, 180, 40);
    } else {
      const scale = width > maxWidth ? maxWidth / width : 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.4);
    setCapturedImage(imageData);

    stopStream();
    analyzeImage(imageData);
  };

  const saveToHistory = async (imageSrc, data) => {
    try {
      const currentReport = JSON.parse(localStorage.getItem('current_report') || '{}');
      const company = currentReport.company || currentReport.empresa || 'Empresa Local';
      const location = currentReport.location || currentReport.ubicacion || 'Inspección in situ';

      const report = {
        id: Date.now(),
        image: imageSrc,
        analysis: data,
        date: new Date().toISOString(),
        type: 'general_risks',
        company,
        location,
        findingsCount: data?.detections?.length || 0
      };

      // Guardar el reporte completo de forma local primero (con base64) para acceso instantáneo
      safeSetLocalStorage(`ai_report_full_${report.id}`, JSON.stringify(report));
      safeSetLocalStorage('current_ai_inspection', JSON.stringify(report));

      // Subir a Firebase Storage en SEGUNDO PLANO
      const userId = auth.currentUser?.uid || 'anonymous';
      const path = `camera_inspections/${userId}/riesgos_${report.id}.jpg`;
      uploadImageToStorage(imageSrc, path).then((uploadedUrl) => {
        const savedReport = safeJsonParse<any>(localStorage.getItem(`ai_report_full_${report.id}`), {});
        if (savedReport.id) {
          savedReport.image = uploadedUrl;
          localStorage.setItem(`ai_report_full_${report.id}`, JSON.stringify(savedReport));
        }
        const currentSession = safeJsonParse<any>(localStorage.getItem('current_ai_inspection'), {});
        if (currentSession.id === report.id) {
          currentSession.image = uploadedUrl;
          localStorage.setItem('current_ai_inspection', JSON.stringify(currentSession));
        }

        // Novedad: Actualizamos permanentemente el historial con la URL de la imagen en la nube para que no se borre nunca.
        const history = safeJsonParse<any[]>(localStorage.getItem('ai_camera_history'), []);
        const updatedHistory = history.map((h: any) => {
          if (h.id === report.id) {
            return { ...h, image: uploadedUrl };
          }
          return h;
        });
        localStorage.setItem('ai_camera_history', JSON.stringify(updatedHistory));
        syncCollection('ai_camera_history', updatedHistory);

      }).catch((uploadErr) => {
        console.warn("Subida en background falló, se conserva localmente", uploadErr);
      });

      // Guardar solo el resumen liviano en el historial (sin imagen)
      const existing = safeJsonParse<any[]>(localStorage.getItem('ai_camera_history'), []);
      if (!existing.find((h) => h.id === report.id)) {
        const summary = {
          id: report.id,
          date: report.date,
          type: report.type,
          company: report.company,
          location: report.location,
          findingsCount: report.findingsCount,
          analysis: data
        };
        const updated = [summary, ...existing];
        localStorage.setItem('ai_camera_history', JSON.stringify(updated));
        syncCollection('ai_camera_history', updated);
      }

      return report.id;
    } catch (err) {
      console.error('[RiesgosIA] Error guardando historial:', err);
      return null;
    }
  };

  const analyzeImage = async (imageSrc) => {
    setIsAnalyzing(true);
    let data: any = null;

    try {
      const fetchUrl = `${API_BASE_URL}/api/analyze-general-risks`;
      const token = await auth.currentUser?.getIdToken(true);
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ image: imageSrc })
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        console.warn("[AIGeneralCamera] Respuesta no OK del servidor cloud, activando motor de visión local:", response.status);
      }
    } catch (error) {
      console.warn("[AIGeneralCamera] Fallback a motor de visión local:", getErrorMessage(error));
    }

    try {
      if (!data) {
        data = await analyzeGeneralRisksLocally(imageSrc);
      }

      let finalImage = imageSrc;
      if (data.detections && data.detections.length > 0) {
        finalImage = await drawDetections(imageSrc, data.detections);
        setCapturedImage(finalImage);
      } else {
        toast("No se detectaron riesgos evidentes en esta escena.");
      }

      // ✅ Guardar automáticamente al terminar el análisis
      await saveToHistory(finalImage, data);

      setAnalysisResult(data);
      toast.success('Análisis de riesgos completado');
    } catch (error) {
      console.error("Error en análisis de riesgos:", error);
      toast.error(`Error al procesar la imagen: ${getErrorMessage(error)}`);
      handleRetry();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const drawDetections = (imageSrc, detections) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        detections.forEach((det, index) => {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;

          if (det.box_2d) {
            const [ymin, xmin, ymax, xmax] = det.box_2d;
            const bx = xmin / 1000 * canvas.width;
            const by = ymin / 1000 * canvas.height;
            const bw = (xmax - xmin) / 1000 * canvas.width;
            const bh = (ymax - ymin) / 1000 * canvas.height;

            // Circle around the detection
            const centerX = bx + bw / 2;
            const centerY = by + bh / 2;
            const radius = Math.max(bw, bh) / 1.5;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Label badge
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(centerX + radius, centerY - radius, 15, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, centerX + radius, centerY - radius);
          }
        });

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = imageSrc;
    });
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
  };

  const handleNativeCapture = async () => {
    try {
      const photo = await captureFromNativeCamera({ maxDimension: 1400 });
      if (photo) {
        setCapturedImage(photo);
        stopStream();
        analyzeImage(photo);
      }
    } catch (err) {
      console.warn('Native camera capture error:', err);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.78 });
      setCapturedImage(compressed);
      stopStream();
      analyzeImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        setCapturedImage(res);
        stopStream();
        analyzeImage(res);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSaveReport = () => {
    // El análisis ya se guardó automáticamente al recibirlo.
    // Solo navegamos al detalle del reporte guardado.
    navigate('/ai-report');
  };


  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-bold">Cargando permisos...</div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <div className="container pb-24 md:pb-8 pt-4 md:pt-8 relative min-h-[100vh] flex flex-col gap-3 sm:gap-4 bg-[var(--color-bg)]">
      {/* Header Moderno con Botón Volver Destacado */}
      <div 
        style={{ zIndex: 100 }}
        className="grid grid-cols-[auto_1fr_auto] items-center p-2.5 sm:p-3 px-3 sm:px-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl gap-2"
      >
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{
            margin: 0,
            padding: '0 12px',
            height: '38px',
            fontSize: '0.75rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            cursor: 'pointer'
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl font-black transition-all hover:scale-105 active:scale-95 shrink-0"
          title="Volver"
        >
          <ArrowLeft size={15} className="text-emerald-400 shrink-0" />
          <span>VOLVER</span>
        </button>
        <div className="flex flex-col items-center text-center min-w-0">
          <h1 className="m-0 text-sm sm:text-base font-black text-white flex items-center gap-1.5 truncate">
            <Search size={17} className="text-emerald-400 shrink-0" /> Riesgos Generales
          </h1>
          <span className="text-[0.6rem] sm:text-[0.65rem] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" /> Análisis IA EHS
          </span>
        </div>
        <div className="w-[78px] sm:w-[88px] shrink-0" />
      </div>

      {/* Contenedor de Cámara Moderno */}
      <div className="flex-1 relative min-h-[65vh] sm:min-h-[70vh] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline 
              className="absolute inset-0 w-full h-full object-cover" 
            />

            {/* HUD Status Pill */}
            <div className="absolute top-3.5 left-3 sm:left-1/2 sm:-translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-600 text-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg max-w-[calc(100%-4.75rem)] truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">IA LISTA · Detección de Riesgos</span>
            </div>

            {/* Cuadro de Enfoque con Láser Animado */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] sm:w-[75%] h-[54%] sm:h-[60%] rounded-3xl border border-slate-600 pointer-events-none overflow-hidden">
              {/* Esquinas de enfoque */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-xl shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              
              {/* Línea Láser Animada */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent shadow-none animate-pulse" style={{ animationDuration: '2s' }} />
            </div>

            {/* Controles de cámara superior con Glassmorphism */}
            <div className="absolute top-3.5 right-3.5 flex flex-col gap-2.5 z-20">
              <button 
                type="button"
                onClick={toggleTorch} 
                style={{ margin: 0, padding: 0, width: '44px', height: '44px' }}
                className={`rounded-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  torchOn 
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-900/70 border border-white/20 text-white hover:bg-slate-800/80'
                }`}
                title="Linterna / Flash"
              >
                {torchOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
              </button>

              <button 
                type="button"
                onClick={switchCamera} 
                style={{ margin: 0, padding: 0, width: '44px', height: '44px' }}
                className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-slate-800/80"
                title="Cambiar Cámara"
              >
                <FlipHorizontal size={20} />
              </button>
            </div>

            {/* Botón de Captura Simétrico y Acceso a Cámara Nativa HD / Galería */}
            <div className="absolute bottom-4 sm:bottom-6 left-0 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 sm:gap-4 z-20 px-3 sm:px-6">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNativeCapture}
                  style={{
                    margin: 0,
                    padding: '0 12px',
                    height: '42px',
                    fontSize: '0.76rem'
                  }}
                  className="rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-black flex items-center justify-center gap-1.5 border border-emerald-400/60 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap w-full max-w-[130px]"
                  title="Abrir cámara del teléfono en alta resolución"
                >
                  <Camera size={15} className="text-emerald-400 shrink-0" />
                  <span>Cámara HD</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCapture}
                style={{
                  margin: 0,
                  padding: 0,
                  width: '60px',
                  height: '60px',
                  borderRadius: '9999px',
                  outline: 'none'
                }}
                className="group relative rounded-full bg-white/15 backdrop-blur-md cursor-pointer flex items-center justify-center border-2 border-white/70 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shrink-0"
                title="Analizar Riesgos con IA"
              >
                <div className="w-[46px] h-[46px] rounded-full bg-emerald-600 border-2 border-white group-hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center shadow-inner">
                  <Search size={20} className="text-white" />
                </div>
              </button>

              <div className="flex justify-start">
                <label
                  style={{
                    margin: 0,
                    marginBottom: 0,
                    padding: '0 12px',
                    height: '42px',
                    fontSize: '0.76rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-black gap-1.5 border border-white/25 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap w-full max-w-[130px]"
                  title="Subir imagen desde galería o archivo"
                >
                  <Upload size={15} className="text-emerald-400 shrink-0" />
                  <span>Subir Foto</span>
                  <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                </label>
              </div>
            </div>
          </>
        ) : (

        <div className="relative w-[100%] h-[100%] min-h-[65vh] flex flex-col justify-end">
                        <img src={capturedImage} alt="Captured" className="absolute inset-0 w-[100%] h-[100%] object-cover" />

                        {isAnalyzing &&
                          <div className="absolute top-[0] left-[0] w-[100%] h-[100%] bg-[rgba(0,0,0,0.75)] flex flex-col items-center justify-center text-white z-[50] p-4 text-center">
                                <div className="relative flex items-center justify-center mb-[1.5rem]">
                                    {/* Spinner giratorio exterior */}
                                    <div className="absolute w-[80px] h-[80px] rounded-full border-2 border-white/20 border-l-emerald-500 animate-spin" />
                                    {/* Logo en escala de grises en el centro, pulsando */}
                                    <img 
                                        src="/logo.png" 
                                        alt="Cargando" 
                                        className="w-[50px] h-[50px] object-contain filter grayscale opacity-80 animate-pulse" 
                                    />
                                </div>
                                <p className="font-[800] text-[1.15rem] tracking-wide m-0">Analizando Entorno...</p>
                                <p className="text-[0.8rem] text-slate-300 mt-1">Detectando Peligros y Condiciones Inseguras</p>
                            </div>
                        }

                        {analysisResult &&
                          <div className="relative z-20 w-[100%] p-4 sm:p-6 box-border bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent text-white">
                                <div className="mb-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="m-0 text-base sm:text-lg font-black text-white">Hallazgos IA</h3>
                                        {analysisResult.riskLevel &&
                                          <span style={{
                                            background: analysisResult.riskLevel.toLowerCase() === 'crítico' ? '#dc2626' :
                                            analysisResult.riskLevel.toLowerCase() === 'alto' ? '#ea580c' :
                                            analysisResult.riskLevel.toLowerCase() === 'medio' ? '#ca8a04' : '#16a34a'
                                          }} className="px-2.5 py-1 rounded-xl text-xs font-black text-white shadow">
                                              RIESGO: {analysisResult.riskLevel.toUpperCase()}
                                          </span>
                                        }
                                    </div>
                                    <p className="m-0 text-xs sm:text-sm text-slate-200 font-semibold">
                                        {analysisResult.detections?.length > 0 ?
                                          `Se detectaron ${analysisResult.detections.length} riesgo(s) o desvío(s) potencial(es) en el área.` :
                                          "No se identificaron riesgos críticos evidentes en la escena."}
                                    </p>
                                    {analysisResult.immediateAction &&
                                      <div className="bg-red-950/80 border border-red-500/40 p-2.5 rounded-xl">
                                        <p className="m-0 text-xs text-red-200 font-bold leading-snug">
                                            ⚠️ Acción Inmediata: {analysisResult.immediateAction}
                                        </p>
                                      </div>
                                    }
                                    {analysisResult.applicableLegislation && analysisResult.applicableLegislation.length > 0 &&
                                      <div className="bg-emerald-950/80 border border-emerald-500/40 p-2.5 rounded-xl">
                                        <p className="m-0 text-xs text-emerald-200 font-bold leading-snug">
                                            ⚖️ Ley/Norma: {analysisResult.applicableLegislation.join(', ')}
                                        </p>
                                      </div>
                                    }
                                </div>
                                <div className="grid grid-cols-2 sm:flex gap-2.5 w-full mt-3">
                                    <button
                                      type="button"
                                      onClick={handleNativeCapture}
                                      style={{ margin: 0, padding: '0 12px', height: '44px', fontSize: '0.8rem' }}
                                      className="sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white flex items-center justify-center gap-1.5 font-extrabold cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
                                      title="Tomar otra foto con la cámara nativa"
                                    >
                                        <Camera size={15} className="shrink-0" />
                                        <span>Cámara HD</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleRetry}
                                      style={{ margin: 0, padding: '0 12px', height: '44px', fontSize: '0.8rem' }}
                                      className="sm:flex-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/25 text-white flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <RefreshCw size={15} className="shrink-0" />
                                        <span>Reintentar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveReport}
                                      style={{ margin: 0, padding: '0 16px', height: '44px', fontSize: '0.86rem' }}
                                      className="col-span-2 sm:flex-[2] rounded-xl bg-emerald-600 hover:bg-emerald-500 border-none text-white flex items-center justify-center gap-2 font-black cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        Ver Informe Técnico
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
  );
}