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

export default function AICamera(): React.ReactElement | null {
    const navigate = useNavigate();
    const { requirePro } = usePaywall();
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
            const detail = error.message || "Error desconocido";
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
                    const centerX = ((xmin + xmax) / 2 / 1000) * canvas.width;
                    const centerY = ((ymin + ymax) / 2 / 1000) * canvas.height;
                    const radius = Math.max(((xmax - xmin) / 2000) * canvas.width, 20);
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
                type: 'ppe_check', // Always set type so history shows correct badge
            };
            
            // Save FULL report to a unique key immediately (with base64 image)
            localStorage.setItem(`ai_report_full_${report.id}`, JSON.stringify(report));
            // Still set current_ai_inspection for immediate navigation
            localStorage.setItem('current_ai_inspection', JSON.stringify(report));
            
            // Subir a Firebase Storage en SEGUNDO PLANO
            const userId = auth.currentUser?.uid || 'anonymous';
            const path = `camera_inspections/${userId}/epp_${report.id}.jpg`;
            uploadImageToStorage(capturedImage, path).then(uploadedUrl => {
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
            }).catch(err => {
                console.warn("Subida en background falló, se conserva la imagen local", err);
            });
            
            const history = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
            // Only add if not a duplicate (same id)
            if (!history.find(h => h.id === report.id)) {
                history.unshift({
                    id: report.id,
                    date: report.date,
                    company: report.company,
                    location: report.location,
                    type: report.type,
                    ppeComplete: report.analysis?.ppeComplete
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

    return (
        <div className="container" style={{ paddingBottom: '3rem', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', zIndex: 10 }}>
                <button onClick={() => navigate('/ai-camera-manager')} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-primary)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Escaneo con IA</h1>
            </div>

            <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', background: 'var(--color-text)', border: '4px solid var(--color-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px dashed rgba(255,255,255,0.3)', width: '70%', height: '60%', borderRadius: '20px', pointerEvents: 'none' }}></div>

                        {/* Controles de cámara superior */}
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
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #fff', background: 'rgba(59, 130, 246, 0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                            >
                                <Camera size={32} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {isAnalyzing && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface)' }}>
                                <RefreshCw size={48} className="spin" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
                                <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>Analizando Persona...</p>
                            </div>
                        )}

                        {analysisResult && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '1.5rem', boxSizing: 'border-box', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: 'var(--color-surface)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        {analysisResult.helmetUsed ? (
                                            <div style={{ background: '#10b981', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <ShieldCheck size={18} /> <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Casco Detectado</span>
                                            </div>
                                        ) : (
                                            <div style={{ background: '#ef4444', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <TriangleAlert size={18} /> <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚠️ FALTA CASCO</span>
                                            </div>
                                        )}
                                        {analysisResult.riskLevel && (
                                            <div style={{
                                                padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800,
                                                background: analysisResult.riskLevel.toLowerCase() === 'crítico' ? '#ef4444' :
                                                            analysisResult.riskLevel.toLowerCase() === 'alto' ? '#f97316' :
                                                            analysisResult.riskLevel.toLowerCase() === 'medio' ? '#eab308' : '#10b981',
                                                color: '#fff',
                                                display: 'flex', alignItems: 'center'
                                            }}>
                                                RIESGO: {analysisResult.riskLevel.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {analysisResult.immediateAction && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700 }}>
                                                ⚠️ Acción Inmediata: {analysisResult.immediateAction}
                                            </p>
                                        </div>
                                    )}

                                    {analysisResult.applicableLegislation && analysisResult.applicableLegislation.length > 0 && (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700 }}>
                                                ⚖️ Ley/Norma: {analysisResult.applicableLegislation.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={handleRetry} className="btn-outline" style={{ flex: 1, minWidth: '130px', borderColor: 'var(--color-surface)', color: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', height: '46px', margin: 0, padding: '0 0.5rem', fontSize: '0.85rem' }}>
                                        <RefreshCw size={16} /> Reintentar
                                    </button>
                                    <button onClick={handleSaveReport} disabled={isSaving} className="btn-primary" style={{ flex: 1, minWidth: '130px', height: '46px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem', fontSize: '0.85rem', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? <RefreshCw size={16} className="spin" /> : 'Generar Informe'}
                                    </button>
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
