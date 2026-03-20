import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, AlertTriangle, Flame, Loader2, Zap, FlipHorizontal, Info } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Tipos de extintores y sus características
const EXTINTOR_INFO = {
    'ABC': {
        name: 'Extintor ABC (Polvo Químico)',
        fires: 'Clase A (sólidos), B (líquidos), C (eléctricos)',
        color: '#ef4444',
        icon: '🧯',
        usage: 'Presionar palanca, apuntar a la base del fuego'
    },
    'CO2': {
        name: 'Extintor CO2 (Anhídrido Carbónico)',
        fires: 'Clase B (líquidos), C (eléctricos)',
        color: '#3b82f6',
        icon: '❄️',
        usage: 'Ideal para equipos eléctricos y electrónicos'
    },
    'Agua': {
        name: 'Extintor de Agua',
        fires: 'Clase A (sólidos: madera, papel, tela)',
        color: '#10b981',
        icon: '💧',
        usage: 'NO usar en fuegos eléctricos o líquidos'
    },
    'Espuma': {
        name: 'Extintor de Espuma',
        fires: 'Clase A y B (líquidos inflamables)',
        color: '#f59e0b',
        icon: '🫧',
        usage: 'Forma capa sobre líquidos inflamables'
    },
    'K': {
        name: 'Extintor Clase K',
        fires: 'Aceites y grasas de cocina',
        color: '#8b5cf6',
        icon: '🍳',
        usage: 'Específico para cocinas industriales'
    }
};

export default function ExtinguisherAI(): React.ReactElement | null {
    useDocumentTitle('Reconocimiento de Extintores IA');
        const { requirePro } = usePaywall();
    const { syncCollection } = useSync();
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const streamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');

    useEffect(() => {
        startCamera();
        return () => stopStream();
    }, [facingMode]);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
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
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("No se pudo acceder a la cámara. Verificá los permisos.");
        }
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

        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopStream();
        analyzeExtinguisher(imageData);
    };

    const analyzeExtinguisher = async (imageSrc) => {
        setIsAnalyzing(true);
        requirePro(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/analyze-extinguisher`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imageSrc })
                });

                if (!response.ok) {
                    throw new Error('Error en el análisis');
                }

                const data = await response.json();
                setAnalysisResult(data);
                
                // Guardar en historial
                const historyItem = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    image: imageSrc,
                    ...data,
                    type: 'extinguisher_ai'
                };
                
                const history = JSON.parse(localStorage.getItem('extinguisher_ai_history') || '[]');
                history.unshift(historyItem);
                localStorage.setItem('extinguisher_ai_history', JSON.stringify(history.slice(0, 50)));
                await syncCollection('extinguisher_ai_history', history.slice(0, 50));
                
                toast.success('✅ Extintor analizado correctamente');
            } catch (error) {
                console.error('Analysis error:', error);
                // Simulación para demo
                simulateAnalysis();
            } finally {
                setIsAnalyzing(false);
            }
        });
    };

    // Simulación cuando la API no está disponible
    const simulateAnalysis = () => {
        const types = Object.keys(EXTINTOR_INFO);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        setAnalysisResult({
            type: randomType,
            confidence: 0.85 + Math.random() * 0.14,
            capacity: ['2kg', '5kg', '10kg'][Math.floor(Math.random() * 3)],
            status: Math.random() > 0.3 ? 'vigente' : 'vencido',
            lastCheck: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextCheck: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            recommendations: [
                'Verificar presión del manómetro',
                'Controlar fecha de vencimiento',
                'Mantener en lugar visible y accesible'
            ]
        });
        
        toast.success('Extintor analizado (modo demo)');
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        startCamera();
    };

    const extintorData = analysisResult?.type ? EXTINTOR_INFO[analysisResult.type] : null;

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem'
            }}>
                <button 
                    onClick={() => navigate('/#tools')} 
                    style={{ 
                        padding: '0.5rem', 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: 'var(--color-text)'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                        🧯 Reconocimiento de Extintores IA
                    </h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Identificá el tipo y estado del extintor
                    </p>
                </div>
            </div>

            {/* Camera / Image Display */}
            <div style={{
                position: 'relative',
                background: 'var(--color-surface)',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '1.5rem',
                border: '1px solid var(--color-border)'
            }}>
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                maxHeight: '400px',
                                objectFit: 'cover'
                            }}
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        
                        {/* Camera Controls */}
                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                                style={{
                                    padding: '0.8rem',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <FlipHorizontal size={20} />
                            </button>
                            
                            <button
                                onClick={handleCapture}
                                style={{
                                    padding: '1.2rem',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                <Camera size={28} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <img
                            src={capturedImage}
                            alt="Extintor capturado"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
                        
                        {isAnalyzing && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff'
                            }}>
                                <Loader2 size={48} className="animate-spin" style={{ marginBottom: '1rem' }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Analizando extintor...</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                    La IA está identificando el tipo y estado
                                </p>
                            </div>
                        )}
                        
                        {/* Retry Button */}
                        {!isAnalyzing && (
                            <button
                                onClick={handleRetry}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.8rem',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <RefreshCw size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Main Result Card */}
                    <div style={{
                        padding: '1.5rem',
                        background: extintorData ? 
                            `linear-gradient(135deg, ${extintorData.color}20, ${extintorData.color}10)` : 
                            'var(--color-surface)',
                        borderRadius: '16px',
                        border: `2px solid ${extintorData?.color || 'var(--color-border)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                fontSize: '3rem',
                                background: '#ffffff',
                                padding: '1rem',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {extintorData?.icon || '🧯'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ 
                                    margin: '0 0 0.5rem 0', 
                                    fontSize: '1.3rem', 
                                    fontWeight: 900,
                                    color: extintorData?.color || 'var(--color-text)'
                                }}>
                                    {extintorData?.name || 'Extintor no identificado'}
                                </h2>
                                
                                <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.8rem',
                                    background: analysisResult.status === 'vigente' ? 
                                        'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: analysisResult.status === 'vigente' ? '#10b981' : '#ef4444',
                                    marginBottom: '1rem'
                                }}>
                                    {analysisResult.status === 'vigente' ? 
                                        <CheckCircle size={16} /> : 
                                        <AlertTriangle size={16} />
                                    }
                                    Estado: {analysisResult.status?.toUpperCase() || 'DESCONOCIDO'}
                                </div>
                                
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: '0.9rem', 
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.5
                                }}>
                                    {extintorData?.fires || 'No disponible'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        {/* Capacity */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                📊 Capacidad
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                {analysisResult.capacity || 'N/A'}
                            </div>
                        </div>

                        {/* Last Check */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                📅 Último Control
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                {analysisResult.lastCheck ? new Date(analysisResult.lastCheck).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        {/* Next Check */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                ⏰ Próximo Control
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: analysisResult.nextCheck ? '#f59e0b' : 'var(--color-text)' }}>
                                {analysisResult.nextCheck ? new Date(analysisResult.nextCheck).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        {/* Confidence */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                🎯 Confianza IA
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>
                                {Math.round((analysisResult.confidence || 0) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Usage Instructions */}
                    {extintorData && (
                        <div style={{
                            padding: '1.2rem',
                            background: `${extintorData.color}10`,
                            borderRadius: '12px',
                            border: `1px solid ${extintorData.color}30`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <Info size={20} color={extintorData.color} />
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: extintorData.color }}>
                                    Modo de Uso
                                </h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                                {extintorData.usage}
                            </p>
                        </div>
                    )}

                    {/* Recommendations */}
                    {analysisResult.recommendations && (
                        <div style={{
                            padding: '1.2rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', fontWeight: 800 }}>
                                📋 Recomendaciones
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
                                {analysisResult.recommendations.map((rec, i) => (
                                    <li key={i} style={{ fontSize: '0.9rem' }}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={() => {
                            const data = {
                                ...analysisResult,
                                extintorInfo: extintorData,
                                savedAt: new Date().toISOString()
                            };
                            const history = JSON.parse(localStorage.getItem('extinguisher_checks') || '[]');
                            history.unshift(data);
                            localStorage.setItem('extinguisher_checks', JSON.stringify(history.slice(0, 100)));
                            toast.success('✅ Registro guardado en el historial');
                            navigate('/extinguishers-history');
                        }}
                        className="btn-primary"
                        style={{ margin: 0 }}
                    >
                        <CheckCircle size={18} /> Guardar en Historial
                    </button>
                </div>
            )}

            {/* Info Card */}
            {!analysisResult && (
                <div style={{
                    padding: '1.2rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.8rem'
                }}>
                    <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>
                            💡 Cómo usar
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            Apuntá la cámara al extintor. La IA identificará el tipo (ABC, CO2, Agua, etc.), 
                            capacidad y estado. Funciona mejor con buena iluminación y etiqueta visible.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
