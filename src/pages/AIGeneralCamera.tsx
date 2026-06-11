import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Camera, RefreshCw, CheckCircle, TriangleAlert, ShieldCheck, Zap, ZapOff, FlipHorizontal, Search } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { uploadImageToStorage } from '../services/storageService';
import { safeSetLocalStorage } from '../utils/storageHelper';
import PremiumHeader from '../components/PremiumHeader';

export default function AIGeneralCamera(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    useDocumentTitle('Detección de Riesgos IA');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, _setStream] = useState(null);
    const streamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [torchOn, setTorchOn] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'

    const setStream = (newStream) => {
        streamRef.current = newStream;
        _setStream(newStream);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        startCamera();
        return () => {
            stopStream();
        };
    }, [facingMode]);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
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
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleCapture = () => {
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
            const company  = currentReport.company  || currentReport.empresa   || 'Empresa Local';
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
            uploadImageToStorage(imageSrc, path).then(uploadedUrl => {
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
            }).catch(uploadErr => {
                console.warn("Subida en background falló, se conserva localmente", uploadErr);
            });

            // Guardar solo el resumen liviano en el historial (sin imagen)
            const existing = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
            if (!existing.find(h => h.id === report.id)) {
                const summary = {
                    id: report.id,
                    date: report.date,
                    type: report.type,
                    company: report.company,
                    location: report.location,
                    findingsCount: report.findingsCount
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
        try {
            const fetchUrl = `${API_BASE_URL}/api/analyze-general-risks`;
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                },
                body: JSON.stringify({ image: imageSrc })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error || `Error ${response.status}`;
                if (response.status === 403 && /origen no autorizado/i.test(msg)) {
                    throw new Error(
                        'Origen no autorizado: abrí la app en http://localhost:5173 con npm run dev activo, o recargá la sesión.'
                    );
                }
                if (response.status === 401 || response.status === 403) {
                    throw new Error(msg + ' Volvé a iniciar sesión e intentá de nuevo.');
                }
                throw new Error(msg);
            }

            const data = await response.json();

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
            toast.success('Análisis guardado en historial');
        } catch (error) {
            console.error("Error en análisis de riesgos:", error);
            toast.error(`Error de IA: ${error.message}`);
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
                        const bx = (xmin / 1000) * canvas.width;
                        const by = (ymin / 1000) * canvas.height;
                        const bw = ((xmax - xmin) / 1000) * canvas.width;
                        const bh = ((ymax - ymin) / 1000) * canvas.height;

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

    const handleSaveReport = () => {
        // El análisis ya se guardó automáticamente al recibirlo.
        // Solo navegamos al detalle del reporte guardado.
        navigate('/ai-report');
    };


    return (
        <div className="container" style={{ paddingBottom: '3rem', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                <PremiumHeader 
                    title="Detector de Riesgos IA"
                    subtitle="Análisis de entorno en tiempo real"
                    icon={<ShieldCheck size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => navigate('/ai-general-camera-manager')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        VOLVER AL HISTORIAL
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', minHeight: '65vh', borderRadius: '24px', overflow: 'hidden', background: 'var(--color-text)', border: '4px solid var(--color-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button onClick={toggleTorch} style={{ width: '44px', height: '44px', borderRadius: '50%', background: torchOn ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                            </button>
                            <button onClick={switchCamera} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FlipHorizontal size={20} />
                            </button>
                        </div>

                        <div style={{ position: 'absolute', bottom: '2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleCapture}
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #fff', background: 'rgba(236, 72, 153, 0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface)', boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}
                            >
                                <Search size={32} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {isAnalyzing && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface)' }}>
                                <RefreshCw size={48} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
                                <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>Analizando Entorno...</p>
                            </div>
                        )}

                        {analysisResult && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '1.5rem', boxSizing: 'border-box', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'var(--color-surface)' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Hallazgos IA</h3>
                                        {analysisResult.riskLevel && (
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800,
                                                background: analysisResult.riskLevel.toLowerCase() === 'crítico' ? '#ef4444' :
                                                            analysisResult.riskLevel.toLowerCase() === 'alto' ? '#f97316' :
                                                            analysisResult.riskLevel.toLowerCase() === 'medio' ? '#eab308' : '#10b981',
                                                color: '#fff'
                                            }}>
                                                {analysisResult.riskLevel.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                                        {analysisResult.detections?.length > 0
                                            ? `Se detectaron ${analysisResult.detections.length} riesgos potenciales.`
                                            : "No se identificaron riesgos críticos evidentes."}
                                    </p>
                                    {analysisResult.immediateAction && (
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>
                                            ⚠️ Acción Inmediata: {analysisResult.immediateAction}
                                        </p>
                                    )}
                                    {analysisResult.applicableLegislation && analysisResult.applicableLegislation.length > 0 && (
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>
                                            ⚖️ Ley/Norma: {analysisResult.applicableLegislation.join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={handleRetry} className="btn-outline" style={{ flex: 1, minWidth: '130px', borderColor: 'var(--color-surface)', color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', height: '46px', margin: 0, padding: '0 0.5rem', fontSize: '0.85rem' }}>
                                        <RefreshCw size={16} /> Reintentar
                                    </button>
                                    <button onClick={handleSaveReport} className="btn-primary" style={{ flex: 1, minWidth: '130px', height: '46px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem', fontSize: '0.85rem' }}>Ver Detalles</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
