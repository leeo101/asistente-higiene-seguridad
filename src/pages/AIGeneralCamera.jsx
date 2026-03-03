import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, Zap, ZapOff, FlipHorizontal, Search } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AIGeneralCamera() {
    const navigate = useNavigate();
    const { requirePro } = usePaywall();
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

        const maxWidth = 800;
        const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg', 0.6);
        setCapturedImage(imageData);

        stopStream();
        analyzeImage(imageData);
    };

    const analyzeImage = async (imageSrc) => {
        setIsAnalyzing(true);
        try {
            const fetchUrl = `${API_BASE_URL}/api/analyze-general-risks`;
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json();

            if (data.detections && data.detections.length > 0) {
                const markedImage = await drawDetections(imageSrc, data.detections);
                setCapturedImage(markedImage);
            } else {
                toast.info("No se detectaron riesgos evidentes en esta escena.");
            }

            setAnalysisResult(data);
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
        requirePro(() => {
            const report = {
                id: Date.now(),
                image: capturedImage,
                analysis: analysisResult,
                date: new Date().toISOString(),
                type: 'general_risks'
            };
            // For now, reuse AIReport for viewing
            localStorage.setItem('current_ai_inspection', JSON.stringify(report));

            // Add to history
            const history = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
            history.unshift({
                id: report.id,
                date: report.date,
                type: 'Riesgos Generales',
                findingsCount: analysisResult?.detections?.length || 0
            });
            localStorage.setItem('ai_camera_history', JSON.stringify(history));

            navigate('/ai-report');
        });
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', zIndex: 10 }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-primary)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Detector de Riesgos IA</h1>
            </div>

            <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', background: '#000', border: '4px solid var(--color-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button onClick={toggleTorch} style={{ width: '44px', height: '44px', borderRadius: '50%', background: torchOn ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                            </button>
                            <button onClick={switchCamera} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FlipHorizontal size={20} />
                            </button>
                        </div>

                        <div style={{ position: 'absolute', bottom: '2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleCapture}
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #fff', background: 'rgba(236, 72, 153, 0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}
                            >
                                <Search size={32} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {isAnalyzing && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <RefreshCw size={48} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
                                <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>Analizando Entorno...</p>
                            </div>
                        )}

                        {analysisResult && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', color: '#fff' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Hallazgos de IA:</h3>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                        {analysisResult.detections?.length > 0
                                            ? `Se detectaron ${analysisResult.detections.length} riesgos potenciales.`
                                            : "No se identificaron riesgos críticos."}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <button onClick={handleRetry} className="btn-outline" style={{ flex: 1, borderColor: '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <RefreshCw size={18} /> Reintentar
                                    </button>
                                    <button onClick={handleSaveReport} className="btn-primary" style={{ flex: 1 }}>Ver Detalles</button>
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
