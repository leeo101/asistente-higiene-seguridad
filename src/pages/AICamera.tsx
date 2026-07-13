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
    <div className="container pb-[2rem] pt-[1rem] relative min-h-[100vh] flex flex-col gap-[1rem] bg-[var(--color-bg)]">
            {/* Header Moderno con Botón Volver */}
            <div className="flex items-center justify-between p-[0.8rem_1rem] z-[10] bg-[var(--color-surface)] rounded-[20px] box-shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[1px_solid_var(--color-border)]">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] rounded-[14px] bg-[linear-gradient(135deg,_#3b82f6_0%,_#1d4ed8_100%)] text-white border-[2px_solid_white] cursor-pointer transition-all duration-300 hover:scale-[1.1] box-shadow-[0_4px_15px_rgba(59,130,246,0.6)] z-[100]">
                    <ArrowLeft size={22} className="text-white" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)]">Escaneo EPP</h1>
                    <span className="text-[0.7rem] font-[700] text-[#10b981] uppercase tracking-[1px]">Inteligencia Artificial</span>
                </div>
                <div className="w-[40px] h-[40px]" /> {/* Spacer for centering */}
            </div>

            {/* Contenedor de Cámara Moderno */}
            <div className="flex-[1] relative min-h-[72vh] rounded-[32px] overflow-[hidden] bg-[#000000] border-[1px_solid_rgba(255,255,255,0.1)] box-shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                {!capturedImage ?
        <>
                        <video
            ref={videoRef}
            autoPlay
            playsInline className="absolute top-[0] left-[0] w-[100%] h-[100%] object-fit-[cover]" />

          
                        <div className="absolute top-[50%] left-[50%] transform-[translate(-50%,_-50%)] border-[2px_dashed_rgba(255,255,255,0.3)] w-[70%] h-[60%] rounded-[24px] pointer-events-[none]">
                            {/* Esquinas de enfoque */}
                            <div className="absolute top-[-2px] left-[-2px] w-[20px] h-[20px] border-t-[3px] border-l-[3px] border-white rounded-tl-[12px]" />
                            <div className="absolute top-[-2px] right-[-2px] w-[20px] h-[20px] border-t-[3px] border-r-[3px] border-white rounded-tr-[12px]" />
                            <div className="absolute bottom-[-2px] left-[-2px] w-[20px] h-[20px] border-b-[3px] border-l-[3px] border-white rounded-bl-[12px]" />
                            <div className="absolute bottom-[-2px] right-[-2px] w-[20px] h-[20px] border-b-[3px] border-r-[3px] border-white rounded-br-[12px]" />
                        </div>

                        {/* Controles de cámara superior con Glassmorphism */}
                        <div className="absolute top-[1.5rem] right-[1.5rem] flex flex-col gap-[1rem] z-[20]">
                            <button onClick={toggleTorch} className={`w-[48px] h-[48px] rounded-[16px] backdrop-filter-[blur(12px)] flex items-center justify-center cursor-pointer transition-all duration-300 ${torchOn ? 'bg-[rgba(250,204,21,0.2)] border-[1px_solid_rgba(250,204,21,0.5)] text-[#facc15] box-shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-[rgba(255,255,255,0.15)] border-[1px_solid_rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.25)]'}`}>
                                {torchOn ? <Zap size={22} fill="currentColor" /> : <ZapOff size={22} />}
                            </button>
                            <button onClick={switchCamera} className="w-[48px] h-[48px] rounded-[16px] bg-[rgba(255,255,255,0.15)] backdrop-filter-[blur(12px)] border-[1px_solid_rgba(255,255,255,0.2)] text-white flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-[rgba(255,255,255,0.25)] hover:rotate-[180deg]">
                                <FlipHorizontal size={22} />
                            </button>
                        </div>

                        {/* Botón de Captura Elegante */}
                        <div className="absolute bottom-[2.5rem] left-[0] w-[100%] flex justify-center z-[20]">
                            <button
              onClick={handleCapture} className="group relative w-[80px] h-[80px] rounded-[50%] bg-[rgba(255,255,255,0.2)] backdrop-filter-[blur(10px)] cursor-pointer flex items-center justify-center border-none outline-none transition-all duration-300 hover:scale-[1.05]">
                                {/* Anillo exterior animado */}
                                <div className="absolute inset-[0] rounded-[50%] border-[2px_solid_rgba(255,255,255,0.8)] opacity-[0.5] scale-[1.1] transition-all duration-300 group-hover:scale-[1.15] group-hover:opacity-[1]"></div>
                                {/* Botón interior sólido */}
                                <div className="w-[60px] h-[60px] rounded-[50%] bg-[#ffffff] shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-[0.95]"></div>
                            </button>
                        </div>
                    </> :

        <div className="relative w-[100%] h-[100%]">
                        <img src={capturedImage} alt="Captured" className="w-[100%] h-[100%] object-fit-[cover]" />

                        {isAnalyzing &&
          <div className="absolute top-[0] left-[0] w-[100%] h-[100%] bg-[rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-[var(--color-surface)]">
                                <RefreshCw size={48} className="spin mb-[1rem] text-[var(--color-primary)]" />
                                <p className="font-[700] text-[1.2rem]">Analizando Persona...</p>
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
                                    <button onClick={handleRetry} className="flex-[1] h-[40px] rounded-[10px] bg-[rgba(255,255,255,0.15)] backdrop-filter-[blur(8px)] border-[1px_solid_rgba(255,255,255,0.3)] text-white flex items-center justify-center gap-[0.5rem] text-[0.8rem] font-[700] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.25)]">
                                        <RefreshCw size={16} /> Reintentar
                                    </button>
                                    <button onClick={handleSaveReport} disabled={isSaving} className="flex-[2] h-[40px] rounded-[10px] bg-[linear-gradient(135deg,_#3b82f6_0%,_#2563eb_100%)] border-none text-white flex items-center justify-center gap-[0.5rem] text-[0.85rem] font-[800] cursor-pointer box-shadow-[0_4px_15px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02]" style={{ opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? <RefreshCw size={16} className="spin" /> : 'Generar Informe'}
                                    </button>
                                </div>
                            </div>
          }                 </div>
          }
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>);

}