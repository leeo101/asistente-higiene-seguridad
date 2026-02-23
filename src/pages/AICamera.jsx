import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AICamera() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    const startCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(newStream);
            if (videoRef.current) videoRef.current.srcObject = newStream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara. Por favor, asegúrese de dar los permisos necesarios.");
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);

        // Stop stream
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);

        // Start real analysis
        analyzeImage(imageData);
    };

    const analyzeImage = async (imageSrc) => {
        setIsAnalyzing(true);
        try {
            const fetchUrl = `${API_BASE_URL}/api/analyze-image`;
            console.log("🚀 LEYENDO DESDE RUTA:", fetchUrl);

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("API Error:", data);
                if (response.status === 413) {
                    alert("Error: La imagen es demasiado pesada. Intente alejarse un poco o bajar la resolución.");
                } else {
                    alert("Error del servidor: " + (data.error || "Error Desconocido al analizar la imagen."));
                }
                handleRetry();
                return;
            }
            if (!data.personDetected && data.personDetected !== undefined) {
                alert("La IA no detectó a ninguna persona clara en la imagen. Intente de nuevo.");
            }
            setAnalysisResult(data);
        } catch (error) {
            console.error("Red / Error:", error);
            alert("Error de conexión con el servidor IA. Asegúrese de que el backend esté corriendo.");
            handleRetry();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveReport = () => {
        const report = {
            id: Date.now(),
            image: capturedImage,
            analysis: analysisResult,
            date: new Date().toISOString(),
            company: JSON.parse(localStorage.getItem('current_report') || '{}').company || 'Empresa Local',
            location: JSON.parse(localStorage.getItem('current_report') || '{}').location || 'Planta Principal'
        };
        localStorage.setItem('current_ai_inspection', JSON.stringify(report));
        navigate('/ai-report');
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        startCamera();
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', zIndex: 5 }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-primary)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Escaneo con IA</h1>
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
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px dashed rgba(255,255,255,0.5)', width: '70%', height: '60%', borderRadius: '20px', pointerEvents: 'none' }}></div>

                        <div style={{ position: 'absolute', bottom: '2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleCapture}
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #fff', background: 'rgba(59, 130, 246, 0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                            >
                                <Camera size={32} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {isAnalyzing && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <RefreshCw size={48} className="spin" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
                                <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>Analizando Persona...</p>
                            </div>
                        )}

                        {analysisResult && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    {analysisResult.helmetUsed ? (
                                        <div style={{ background: '#10b981', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <ShieldCheck size={20} /> <span style={{ fontWeight: 700 }}>Casco Detectado</span>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#ef4444', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <AlertTriangle size={20} /> <span style={{ fontWeight: 700 }}>⚠️ FALTA CASCO</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={handleRetry} className="btn-outline" style={{ flex: 1, borderColor: '#fff', color: '#fff' }}>Reintentar</button>
                                    <button onClick={handleSaveReport} className="btn-primary" style={{ flex: 2 }}>Generar Informe</button>
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
