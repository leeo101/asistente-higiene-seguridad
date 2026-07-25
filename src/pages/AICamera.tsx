import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Camera, RefreshCw, CheckCircle, TriangleAlert, ShieldCheck, Zap, ZapOff, FlipHorizontal } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { uploadImageToStorage } from '../services/storageService';
import { safeSetLocalStorage } from '../utils/storageHelper';
import { getErrorMessage } from '../utils/errorUtils';

export default function AICamera(): React.ReactElement | null {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  useDocumentTitle('Cámara Inteligente EPP');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, _setStream] = useState(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    startCamera();
    return () => {
      stopStream();
    };
  }, [facingMode, isPro, loading]);

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
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
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
      // Draw a beautiful simulated operator context for EPP scanning
      width = 600;
      height = 450;
      canvas.width = width;
      canvas.height = height;

      // Draw dark gradient background representing a workspace
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

      // Draw simulated operator / worker silhouette box
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.strokeRect(180, 80, 240, 350);
      ctx.fillRect(180, 80, 240, 350);

      // Draw simulated helmet at top
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(250, 90, 100, 50);
      ctx.fillRect(250, 90, 100, 50);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText("CASCO O.K.", 265, 120);

      // Draw simulated safety boots at bottom
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(200, 380, 200, 40);
      ctx.fillRect(200, 380, 200, 40);
      ctx.fillStyle = '#ef4444';
      ctx.fillText("FALTA CALZADO DE SEGURIDAD", 210, 405);

      // Title at top
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 18px Outfit, Inter, sans-serif';
      ctx.fillText("SIMULACIÓN DE ESCANEO DE EPP", 30, 40);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText("Cámara física inactiva — Simulación de Control Inteligente de EPP", 30, 60);
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

  const analyzeImage = async (imageSrc) => {
    setIsAnalyzing(true);
    try {
      const fetchUrl = `${API_BASE_URL}/api/analyze-image`;
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({ image: imageSrc })
      });
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error("El servidor no devolvió JSON (posible error de ruta o servidor)");
      }

      if (!response.ok) {
        console.error("Error from AI API:", data);
        toast.error(data.error || `Error ${response.status}`);
        handleRetry();
        return;
      }
      if (!data.personDetected && data.personDetected !== undefined) {
        toast.error("La IA no detectó a ninguna persona clara.");
      }

      if (data.detections && data.detections.length > 0) {
        const markedImage = await drawDetections(imageSrc, data.detections);
        setCapturedImage(markedImage);
      }

      setAnalysisResult(data);
    } catch (error) {
      console.error("Red / Error crítico de IA:", error);
      const detail = getErrorMessage(error) || "Error desconocido";
      let msg = "Error de conexión.";
      if (detail.includes('404')) msg = "Modelo no disponible.";
      if (detail.includes('413')) msg = "Imagen demasiado pesada para el servidor.";

      toast.error(`Falla de IA: ${msg}`);
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
          if (!det.box_2d) return;
          const [ymin, xmin, ymax, xmax] = det.box_2d;
          const centerX = (xmin + xmax) / 2 / 1000 * canvas.width;
          const centerY = (ymin + ymax) / 2 / 1000 * canvas.height;
          const radius = Math.max((xmax - xmin) / 2000 * canvas.width, 20);
          const isRisk = det.label.toLowerCase().includes('riesgo');
          const color = isRisk ? '#ef4444' : '#3b82f6';

          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerX + radius, centerY - radius, 15, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(index + 1, centerX + radius, centerY - radius);
        });

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = imageSrc;
    });
  };

  const handleSaveReport = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading('Guardando informe y evidencia...');

    try {
      const currentReport = JSON.parse(localStorage.getItem('current_report') || '{}');
      const company = currentReport.company || currentReport.empresa || 'Empresa Local';
      const location = currentReport.location || currentReport.ubicacion || 'Planta Principal';

      const report = {
        id: Date.now(),
        image: capturedImage,
        analysis: analysisResult,
        date: new Date().toISOString(),
        company,
        location,
        type: 'ppe_check' // Always set type so history shows correct badge
      };

      // Save FULL report to a unique key immediately (with base64 image)
      safeSetLocalStorage(`ai_report_full_${report.id}`, JSON.stringify(report));
      // Still set current_ai_inspection for immediate navigation
      safeSetLocalStorage('current_ai_inspection', JSON.stringify(report));

      // Subir a Firebase Storage en SEGUNDO PLANO
      const userId = auth.currentUser?.uid || 'anonymous';
      const path = `camera_inspections/${userId}/epp_${report.id}.jpg`;
      uploadImageToStorage(capturedImage, path).then((uploadedUrl) => {
        // Actualizar reporte local silenciosamente cuando termine
        const savedReport = JSON.parse(localStorage.getItem(`ai_report_full_${report.id}`) || '{}');
        if (savedReport.id) {
          savedReport.image = uploadedUrl;
          localStorage.setItem(`ai_report_full_${report.id}`, JSON.stringify(savedReport));
        }
        const currentSession = JSON.parse(localStorage.getItem('current_ai_inspection') || '{}');
        if (currentSession.id === report.id) {
          currentSession.image = uploadedUrl;
          localStorage.setItem('current_ai_inspection', JSON.stringify(currentSession));
        }

        // Novedad: Actualizamos permanentemente el historial con la URL de la imagen en la nube para que no se borre nunca.
        const history = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
        const updatedHistory = history.map((h: any) => {
          if (h.id === report.id) {
            return { ...h, image: uploadedUrl };
          }
          return h;
        });
        localStorage.setItem('ai_camera_history', JSON.stringify(updatedHistory));
        syncCollection('ai_camera_history', updatedHistory);

      }).catch((err) => {
        console.warn("Subida en background falló, se conserva la imagen local", err);
      });

      const history = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
      // Only add if not a duplicate (same id)
      if (!history.find((h: any) => h.id === report.id)) {
        history.unshift({
          id: report.id,
          date: report.date,
          company: report.company,
          location: report.location,
          type: report.type,
          ppeComplete: report.analysis?.ppeComplete,
          analysis: report.analysis
        });
        localStorage.setItem('ai_camera_history', JSON.stringify(history));
        syncCollection('ai_camera_history', history);
      }

      toast.success('Informe guardado correctamente', { id: toastId });
      navigate('/ai-report');

    } catch (err) {
      console.error("Error al guardar el informe:", err);
      toast.error('Ocurrió un error al guardar el informe', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };


  const handleRetry = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
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
    <div className="container pb-[2rem] pt-6 md:pt-10 relative min-h-[100vh] flex flex-col gap-4 bg-[var(--color-bg)]">
      {/* Header Moderno con Botón Volver Destacado */}
      <div 
        style={{ zIndex: 100 }}
        className="flex items-center justify-between p-3 px-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl"
      >
        <button 
          onClick={() => navigate(-1)} 
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            cursor: 'pointer'
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all hover:scale-105 active:scale-95"
          title="Volver al Historial"
        >
          <ArrowLeft size={18} className="text-cyan-400" />
          <span>VOLVER</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="m-0 text-base font-black text-white flex items-center gap-1.5">
            <Camera size={18} className="text-cyan-400" /> Escaneo EPP
          </h1>
          <span className="text-[0.65rem] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Visión Artificial EHS
          </span>
        </div>
        <div className="w-20" />
      </div>

      {/* Contenedor de Cámara Moderno */}
      <div className="flex-1 relative min-h-[70vh] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline 
              className="absolute inset-0 w-full h-full object-cover" 
            />

            {/* Botón flotante de respaldo Volver en esquina superior izquierda del área de video */}
            <button 
              onClick={() => navigate(-1)} 
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                zIndex: 50,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                cursor: 'pointer'
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all"
              title="Volver al Historial"
            >
              <ArrowLeft size={18} className="text-cyan-400" />
              <span>VOLVER</span>
            </button>

            {/* HUD Status Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>IA LISTA · Detección de EPP</span>
            </div>

            {/* Cuadro de Enfoque con Láser Animado */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[60%] rounded-3xl border border-cyan-500/30 pointer-events-none overflow-hidden">
              {/* Esquinas de enfoque */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl shadow-[0_0_10px_#22d3ee]" />
              
              {/* Línea Láser Animada */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" style={{ animationDuration: '2s' }} />
            </div>

            {/* Controles de cámara superior con Glassmorphism */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
              <button 
                onClick={toggleTorch} 
                className={`w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  torchOn 
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-900/60 border border-white/20 text-white hover:bg-slate-800/80'
                }`}
                title="Linterna / Flash"
              >
                {torchOn ? <Zap size={22} fill="currentColor" /> : <ZapOff size={22} />}
              </button>

              <button 
                onClick={switchCamera} 
                className="w-12 h-12 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-slate-800/80 hover:rotate-180"
                title="Cambiar Cámara"
              >
                <FlipHorizontal size={22} />
              </button>
            </div>

            {/* Botón de Captura Elegante */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center z-20">
              <button
                onClick={handleCapture}
                className="group relative w-20 h-20 rounded-full bg-cyan-500/20 backdrop-blur-md cursor-pointer flex items-center justify-center border-2 border-cyan-400/60 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                style={{ outline: 'none' }}
                title="Escanear EPP con IA"
              >
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 animate-ping" />
                <div className="w-14 h-14 rounded-full bg-cyan-500/40 border-2 border-white group-hover:bg-cyan-400 transition-all duration-300 flex items-center justify-center shadow-inner">
                  <Camera className="text-white" size={26} />
                </div>
              </button>
            </div>
          </>
        ) : (

        <div className="relative w-[100%] h-[100%]">
                        <img src={capturedImage} alt="Captured" className="w-[100%] h-[100%] object-fit-[cover]" />

                        {isAnalyzing &&
                          <div className="absolute top-[0] left-[0] w-[100%] h-[100%] bg-[rgba(0,0,0,0.75)] flex flex-col items-center justify-center text-[var(--color-surface)] z-[50]">
                                <div className="relative flex items-center justify-center mb-[1.5rem]">
                                    {/* Spinner giratorio exterior */}
                                    <div className="absolute w-[80px] h-[80px] rounded-full border-2 border-white/20 border-l-[#10b981] animate-spin" />
                                    {/* Logo en escala de grises en el centro, pulsando */}
                                    <img 
                                        src="/logo.png" 
                                        alt="Cargando" 
                                        className="w-[50px] h-[50px] object-contain filter grayscale opacity-80 animate-pulse" 
                                    />
                                </div>
                                <p className="font-[700] text-[1.2rem] tracking-wide">Analizando Persona...</p>
                                <p className="text-[0.8rem] text-slate-400 mt-[0.2rem]">Detectando Elementos de Protección Personal (EPP)</p>
                            </div>
                        }

                        {analysisResult &&
                          <div className="absolute bottom-[0] left-[0] w-[100%] p-[1.5rem] box-sizing-[border-box] bg-[linear-gradient(transparent,_rgba(0,0,0,0.95))] text-[var(--color-surface)]">
                                <div className="flex flex-col gap-[0.8rem] mb-[1rem]">
                                    <div className="flex items-center gap-[1rem] flex-wrap">
                                        {analysisResult.helmetUsed ?
                                          <div className="bg-[#10b981] p-[0.6rem_1rem] rounded-[12px] flex items-center gap-[0.5rem]">
                                              <ShieldCheck size={18} /> <span className="font-[700] text-[0.9rem]">Casco Detectado</span>
                                          </div> :

                                          <div className="bg-[#ef4444] p-[0.6rem_1rem] rounded-[12px] flex items-center gap-[0.5rem]">
                                              <TriangleAlert size={18} /> <span className="font-[700] text-[0.9rem]">⚠️ FALTA CASCO</span>
                                          </div>
                                        }
                                        {analysisResult.riskLevel &&
                                          <div style={{
                                            background: analysisResult.riskLevel.toLowerCase() === 'crítico' ? '#ef4444' :
                                            analysisResult.riskLevel.toLowerCase() === 'alto' ? '#f97316' :
                                            analysisResult.riskLevel.toLowerCase() === 'medio' ? '#eab308' : '#10b981'
                                          }} className="p-[0.6rem_1rem] rounded-[12px] text-[0.85rem] font-[800] text-[#fff] flex items-center">
                                              RIESGO: {analysisResult.riskLevel.toUpperCase()}
                                          </div>
                                        }
                                    </div>
                                    
                                    {analysisResult.immediateAction &&
                                      <div className="bg-[rgba(239,_68,_68,_0.1)] border-[1px_solid_rgba(239,_68,_68,_0.3)] p-[0.8rem] rounded-[8px]">
                                          <p className="m-[0] text-[0.8rem] text-[#fca5a5] font-[700]">
                                              ⚠️ Acción Inmediata: {analysisResult.immediateAction}
                                          </p>
                                      </div>
                                    }
                                    {analysisResult.applicableLegislation && analysisResult.applicableLegislation.length > 0 &&
                                      <div className="bg-[rgba(16,_185,_129,_0.1)] border-[1px_solid_rgba(16,_185,_129,_0.3)] p-[0.8rem] rounded-[8px]">
                                          <p className="m-[0] text-[0.8rem] text-[#6ee7b7] font-[700]">
                                              ⚖️ Ley/Norma: {analysisResult.applicableLegislation.join(', ')}
                                          </p>
                                      </div>
                                    }
                                </div>
                                <div className="flex gap-[0.8rem] w-[100%] justify-center mt-[1rem]">
                                    <button onClick={handleRetry} className="flex-[1] h-[44px] rounded-[12px] bg-[rgba(255,255,255,0.12)] backdrop-filter-[blur(8px)] border-[1px_solid_rgba(255,255,255,0.25)] text-white flex items-center justify-center gap-[0.5rem] text-[0.85rem] font-[700] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.22)] active:scale-98">
                                        <RefreshCw size={16} /> Reintentar
                                    </button>
                                    <button onClick={handleSaveReport} disabled={isSaving} className="flex-[2] h-[44px] rounded-[12px] bg-[linear-gradient(135deg,_#3b82f6_0%,_#2563eb_100%)] border-none text-white flex items-center justify-center gap-[0.5rem] text-[0.88rem] font-[800] cursor-pointer box-shadow-[0_4px_15px_rgba(59,130,246,0.4)] transition-all hover:brightness-[1.1] active:scale-98" style={{ opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="w-[18px] h-[18px] rounded-full border border-white/30 border-t-white animate-spin mr-[0.5rem]" />
                                                <span>Guardando...</span>
                                            </div>
                                        ) : 'Generar Informe'}
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