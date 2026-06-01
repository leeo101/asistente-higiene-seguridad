import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, AlertTriangle, Flame, Loader2, FlipHorizontal, Info, Search, Download, Trash2, Calendar, Share2, QrCode, Crosshair, Plus } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { generatePdfBlob } from '../utils/pdfHelper';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import ExtinguisherAIPdfGenerator from '../components/ExtinguisherAIPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';

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
    const navigate = useNavigate();
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
    const { currentUser } = useAuth();

    // History state
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [qrTarget, setQrTarget] = useState<{ text: string, title: string } | null>(null);
    const [shareItem, setShareItem] = useState<any>(null);
    const { syncPulse } = useSync();

    useEffect(() => {
        const raw = localStorage.getItem('extinguisher_checks');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            const valid = parsed.filter((item: any) => item && item.id);
            setHistory(valid);
        } catch {
            setHistory([]);
        }
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('extinguisher_checks', JSON.stringify(updated));
        syncCollection('extinguisher_checks', updated);
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        const filtered = history.filter(item =>
            item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.status?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        downloadCSV(filtered.map(i => ({
            fecha: i.savedAt ? new Date(i.savedAt).toLocaleDateString('es-AR') : '',
            tipo: i.type || 'N/A',
            confianza: i.confidence ? `${Math.round(i.confidence * 100)}%` : 'N/A',
            estado: i.status === 'vigente' ? 'Vigente' : 'Vencido/Revisión',
            capacidad: i.capacity || 'N/A'
        })), 'extintores_ia_historial', {
            fecha: 'Fecha', tipo: 'Tipo', confianza: 'Confianza IA', estado: 'Estado', capacidad: 'Capacidad'
        });
    };

    useEffect(() => {
        if (isCameraVisible) {
            startCamera();
        } else {
            stopStream();
        }
        return () => stopStream();
    }, [facingMode, isCameraVisible]);

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
                const token = await auth.currentUser?.getIdToken(true);
                const response = await fetch(`${API_BASE_URL}/api/analyze-extinguisher`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ image: imageSrc })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Error en el análisis');
                }

                const data = await response.json();
                
                if (!data.extinguisherDetected) {
                    throw new Error('No se detectó ningún extintor en la imagen. Por favor, enfoca claramente el matafuego.');
                }
                
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
                toast.error(error.message || 'Error analizando la imagen');
                setCapturedImage(null);
                startCamera();
            } finally {
                setIsAnalyzing(false);
            }
        });
    };
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

    const handleDownloadPdf = async () => {
        try {
            const toastId = toast.loading('Generando PDF...');
            const blob = await generatePdfBlob('extinguisher-pdf-content');
            toast.dismiss(toastId);
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-extintor-${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('PDF descargado exitosamente');
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Hubo un error al generar el PDF');
        }
    };

    const total = history.length;
    const isVigente = history.filter(i => i.status === 'vigente').length;
    const isVencido = history.filter(i => i.status === 'vencido').length;
    const compliance = total > 0 ? Math.round((isVigente / total) * 100) : 0;

    const extintorData = analysisResult?.type ? EXTINTOR_INFO[analysisResult.type] : null;

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                        <h3>¿Eliminar inspección?</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Inspección IA - Extintor ${shareItem?.type || ''}`}
                text={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
                rawMessage={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Inspeccion_Extintor_IA_${shareItem?.type || 'Sin_Tipo'}.pdf`}
            />

            <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <ExtinguisherAIPdfGenerator item={shareItem} />}
            </div>

            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            {!isCameraVisible ? (
                <div className="animate-fade-in" style={{ padding: '0 1rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                    <Breadcrumbs />
                    <PremiumHeader
                        title="Reconocimiento Extintores IA"
                        subtitle={`Inspecciones de extintores • ${history.length} registros`}
                        icon={<Flame size={36} />}
                    />
                    
                    <button
                        onClick={() => setIsCameraVisible(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.85rem', border: '1px solid #36B37E', background: '#36B37E', color: '#ffffff', cursor: 'pointer', fontSize: '0.92rem', marginBottom: '1.5rem', borderRadius: '12px' }}
                    >
                        <Plus size={18} /> NUEVA INSPECCIÓN
                    </button>

                    {/* Stats panel */}
                    {total > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{total}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>INSPECCIONES</div>
                                </div>
                                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{compliance}%</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VIGENTES</div>
                                </div>
                                <div style={{ background: isVencido > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isVencido > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isVencido > 0 ? '#f59e0b' : '#10b981' }}>{isVencido}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VENCIDOS</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por tipo o estado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                                borderRadius: '12px', border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)', fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.filter(item =>
                            item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.status?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length > 0 ? (
                            history.filter(item =>
                                item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.status?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((item) => (
                                <div key={item.id} className="card" style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '45px', height: '45px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                                <Flame size={22} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Extintor {item.type || 'Desconocido'}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                    <Calendar size={14} /> {item.date ? new Date(item.date).toLocaleDateString('es-AR') : new Date(item.savedAt).toLocaleDateString('es-AR')} — <Crosshair size={14} /> {item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            fontSize: '0.75rem', fontWeight: 700,
                                            padding: '0.3rem 0.7rem', borderRadius: '20px',
                                            background: item.status === 'vigente' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: item.status === 'vigente' ? '#10b981' : '#ef4444',
                                            flexShrink: 0
                                        }}>
                                            {item.status === 'vigente' ? 'VIGENTE' : 'VENCIDO'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setShareItem(item)}
                                            className="btn-primary"
                                            style={{ flex: 2, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                        >
                                            <Share2 size={16} /> Ver Reporte
                                        </button>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${item.id}?print=true`;
                                                setQrTarget({ text: url, title: `Inspección — Extintor ${item.type || 'IA'}` });
                                            }}
                                            style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Generar QR"
                                        >
                                            <QrCode size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(item.id)}
                                            style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No hay inspecciones guardadas.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                {/* Floating action bar for form mode */}
                <div className="no-print floating-action-bar">
                    <button onClick={() => { setIsCameraVisible(false); setAnalysisResult(null); setCapturedImage(null); }} className="btn-floating-action" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                        <ArrowLeft size={18} /> ATRÁS
                    </button>
                    {analysisResult && (
                        <>
                            <button
                                onClick={handleDownloadPdf}
                                className="btn-floating-action" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            >
                                <Download size={18} /> PDF
                            </button>
                            <button
                                onClick={() => {
                                    const data = {
                                        ...analysisResult,
                                        extintorInfo: extintorData,
                                        savedAt: new Date().toISOString(),
                                        id: Date.now().toString()
                                    };
                                    const current = JSON.parse(localStorage.getItem('extinguisher_checks') || '[]');
                                    current.unshift(data);
                                    localStorage.setItem('extinguisher_checks', JSON.stringify(current.slice(0, 100)));
                                    syncCollection('extinguisher_checks', current.slice(0, 100));
                                    toast.success('✅ Registro guardado en el historial');
                                    setIsCameraVisible(false);
                                    setAnalysisResult(null);
                                    setCapturedImage(null);
                                }}
                                className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}
                            >
                                <CheckCircle size={18} /> GUARDAR
                            </button>
                        </>
                    )}
                </div>
                <div className="animate-fade-in" style={{ paddingTop: '1rem' }}>

            {/* Camera / Image Display */}
            <div id="extinguisher-pdf-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                    position: 'relative',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    overflow: 'hidden',
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
                                {analysisResult.lastCheck ? new Date(analysisResult.lastCheck).toLocaleDateString('es-AR') : 'N/A'}
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
                                {analysisResult.nextCheck ? new Date(analysisResult.nextCheck).toLocaleDateString('es-AR') : 'N/A'}
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
                </div>
            )}
            
            </div> {/* Cierra extinguisher-pdf-content */}
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
            </>
            )}
        </div>
    );
}
