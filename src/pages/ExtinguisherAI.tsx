import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw, CheckCircle, AlertTriangle, Flame, Loader2, FlipHorizontal, Info, Search, Download, Trash2, Calendar, Share2, QrCode, Crosshair, Plus, Zap, ZapOff } from 'lucide-react';
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
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errorUtils';

// Tipos de extintores y sus características
const EXTINTOR_INFO = {
  'ABC': {
    name: 'Extintor HCFC',
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

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  const t = String(tipo).toUpperCase();
  if (t === 'ABC') return 'HCFC';
  if (t === 'BC') return 'CO2';
  return tipo;
};

export default function ExtinguisherAI() {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  useDocumentTitle('Reconocimiento de Extintores IA');
  const { syncCollection } = useSync();

  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  useEffect(() => {
    if (loading || !isPro) return;
    window.scrollTo(0, 0);
  }, [isPro, loading]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchOn, setTorchOn] = useState(false);
  const { currentUser } = useAuth();

  // History state
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<{text: string;title: string;} | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState('');
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
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('extinguisher_checks', JSON.stringify(updated));
    syncCollection('extinguisher_checks', updated);
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    const filtered = history.filter((item) =>
    item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    downloadCSV(filtered.map((i) => ({
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
    if (loading || !isPro) return;
    if (isCameraVisible) {
      startCamera();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [facingMode, isCameraVisible, isPro, loading]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  const startCamera = async () => {
    stopStream();
    setTorchOn(false);
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
      streamRef.current = newStream;
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("No se pudo acceder a la cámara. Verificá los permisos.");
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as any]
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.error("Error toggle torch:", e);
        toast.error("Flash no soportado por este navegador o dispositivo");
      }
    }
  };

  const handleCapture = () => {
    if (!isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      return;
    }
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
      toast.error(getErrorMessage(error) || 'Error analizando la imagen');
      setCapturedImage(null);
      startCamera();
    } finally {
      setIsAnalyzing(false);
    }
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
      phDate: new Date(Date.now() + Math.random() * 1000 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommendations: [
      'Verificar presión del manómetro',
      'Controlar fecha de vencimiento',
      'Mantener en lugar visible y accesible']

    });

    toast.success('Extintor analizado (modo demo)');
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSignature(null);
    setInspectorName('');
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
  const isVigente = history.filter((i) => i.status === 'vigente').length;
  const isVencido = history.filter((i) => i.status === 'vencido').length;
  const compliance = total > 0 ? Math.round(isVigente / total * 100) : 0;

  const extintorData = analysisResult?.type ? EXTINTOR_INFO[analysisResult.type] : null;

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-bold">Cargando permisos...</div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <div className="container max-w-[800px] pb-[4rem] min-h-[100vh] flex flex-col">
            {deleteTarget &&
      <div className="fixed inset-[0] bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center backdrop-filter-[blur(4px)]">
                    <div className="card max-w-[320px] text-center p-[2rem]">
                        <Trash2 size={48} className="text-[#ef4444] mb-[1rem]" />
                        <h3>¿Eliminar inspección?</h3>
                        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-[1rem] mt-[1.5rem]">
                            <button onClick={() => setDeleteTarget(null)} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[var(--color-background)] border-none cursor-pointer font-[700]">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-[1] p-[0.8rem] rounded-[12px] bg-red-500 hover:bg-red-600 text-[white] border-none cursor-pointer font-[700]">Eliminar</button>
                        </div>
                    </div>
                </div>
      }

            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Inspección IA - Extintor ${shareItem?.type || ''}`}
        text={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
        rawMessage={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Inspeccion_Extintor_IA_${shareItem?.type || 'Sin_Tipo'}.pdf`} />
      

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                {shareItem && <ExtinguisherAIPdfGenerator item={shareItem} />}
            </div>

            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            {!isCameraVisible ?
      <div className="animate-fade-in p-[0_1rem] w-[100%] max-w-[1200px] m-[0_auto]">
                    <PremiumHeader
          title="Reconocimiento Extintores IA"
          subtitle={`Inspecciones de extintores • ${history.length} registros`}
          icon={<Flame size={36} color="#ffffff" />} />
        
                    
        
                    
                    <div className="flex items-center justify-space-between gap-[1rem] mb-[1.5rem] flex-wrap">
                        <div className="flex gap-[1rem] items-center">
                            <></>
                        </div>
                        <button
            onClick={() => setIsCameraVisible(true)} 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
            className="flex-[0_1_auto] p-[0.8rem_1.5rem] rounded-[14px] font-[800] text-[0.95rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-transform hover:-translate-y-0.5 white-space-[nowrap]">
                            <Plus size={20} /> Nueva Inspección
                        </button>
                    </div>

                    {/* Stats panel */}
                    {total > 0 &&
        <div className="mb-8">
                            <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.7rem] mb-[1rem]">
                                <div className="bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[12px] p-[0.75rem_1rem] text-center">
                                    <div className="text-[1.5rem] font-[900] text-[#ef4444]">{total}</div>
                                    <div className="text-[0.68rem] text-[var(--color-text-muted)] font-[700]">INSPECCIONES</div>
                                </div>
                                <div className="bg-[rgba(16,185,129,0.08)] border-[1px_solid_rgba(16,185,129,0.2)] rounded-[12px] p-[0.75rem_1rem] text-center">
                                    <div className="text-[1.5rem] font-[900] text-[#10b981]">{compliance}%</div>
                                    <div className="text-[0.68rem] text-[var(--color-text-muted)] font-[700]">VIGENTES</div>
                                </div>
                                <div style={{ background: isVencido > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isVencido > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }} className="rounded-[12px] p-[0.75rem_1rem] text-center">
                                    <div style={{ color: isVencido > 0 ? '#f59e0b' : '#10b981' }} className="text-[1.5rem] font-[900]">{isVencido}</div>
                                    <div className="text-[0.68rem] text-[var(--color-text-muted)] font-[700]">VENCIDOS</div>
                                </div>
                            </div>
                        </div>
        }

                    <div className="relative mb-[1.5rem]">
                        <Search size={18} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                        <input
            type="text"
            placeholder="Buscar por tipo o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.8rem_1rem_0.8rem_2.8rem] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" />





          
                    </div>

                    <div className="flex flex-col gap-4">
                        {history.filter((item) =>
          item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.status?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length > 0 ?
          history.filter((item) =>
          item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.status?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((item) =>
          <div key={item.id} className="card p-[1.2rem]">
                                    <div className="flex justify-space-between items-start mb-[1rem] flex-wrap gap-[1rem]">
                                        <div className="flex items-center gap-[0.8rem] flex-[1] min-width-[0]">
                                            <div className="w-[45px] h-[45px] bg-[rgba(239,68,68,0.1)] rounded-[10px] flex items-center justify-center text-[#ef4444]">
                                                <Flame size={22} />
                                            </div>
                                            <div>
                                                <h3 className="m-[0] text-[1.05rem] font-[700]">Extintor {formatType(item.type) || 'Desconocido'}</h3>
                                                <div className="flex items-center gap-[0.4rem] text-[0.8rem] text-[var(--color-text-muted)] mt-[0.2rem]">
                                                    <Calendar size={14} /> {item.date ? new Date(item.date).toLocaleDateString('es-AR') : new Date(item.savedAt).toLocaleDateString('es-AR')} — <Crosshair size={14} /> {item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{



                background: item.status === 'vigente' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: item.status === 'vigente' ? '#10b981' : '#ef4444'

              }} className="flex items-center gap-[0.4rem] text-[0.75rem] font-[700] p-[0.3rem_0.7rem] rounded-[20px] flex-shrink-[0]">
                                            {item.status === 'vigente' ? 'VIGENTE' : 'VENCIDO'}
                                        </div>
                                    </div>
                                    <div className="flex gap-[0.5rem] mt-[1rem] border-top-[1px_solid_var(--color-border)] pt-[1rem] flex-wrap justify-end">
                                        <button
                onClick={() => setShareItem(item)}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                className="flex-[2] sm:flex-none p-[0.5rem_1rem] rounded-[8px] text-[0.85rem] font-[800] flex items-center justify-center gap-[0.4rem] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform">
                                            <Share2 size={16} /> Ver Reporte
                                        </button>
                                        <button
                onClick={() => {
                  const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${item.id}?print=true`;
                  setQrTarget({ text: url, title: `Inspección — Extintor ${item.type || 'IA'}` });
                }}
                title="Generar QR"
                style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }}
                className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
                                            <QrCode size={16} />
                                        </button>
                                        <button
                onClick={() => setDeleteTarget(item.id)}
                title="Eliminar"
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
          ) :

          <div className="text-center p-[3rem] text-[var(--color-text-muted)]">
                                <Camera size={48} className="opacity-[0.2] mb-[1rem]" />
                                <p>No hay inspecciones guardadas.</p>
                            </div>
          }
                    </div>
                </div> :

      <>
                {/* Floating action bar for form mode */}
                <div className="no-print floating-action-bar">
                    {analysisResult &&
          <>
                            <button
              onClick={handleDownloadPdf}
              className="btn-floating-action bg-[var(--color-surface)] text-[var(--color-text)] border-[1px_solid_var(--color-border)]">
              
                                <Download size={18} /> PDF
                            </button>
                            <button
              onClick={() => {
                const data = {
                  ...analysisResult,
                  extintorInfo: extintorData,
                  signature,
                  inspectorName,
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
                setSignature(null);
                setInspectorName('');
              }}
              className="btn-floating-action bg-emerald-500 hover:bg-emerald-600 text-[#ffffff]">
              
                                <CheckCircle size={18} /> GUARDAR
                            </button>
                        </>
          }
                </div>
                <div className="animate-fade-in pt-[1rem]">
                    <div className="no-print">
                        <PremiumHeader
              title="Reconocimiento de Extintores"
              subtitle="Captura y analiza el estado del extintor"
              icon={<Flame size={36} color="#ffffff" />} />
            
                        
                        <div className="mt-[1.5rem] mb-[1.5rem] z-[10]">
                            <></>
                        </div>
                    </div>

            {/* Camera / Image Display */}
            <div id="extinguisher-pdf-content" className="flex flex-col gap-[0.8rem]">
                <div className="relative bg-[var(--color-surface)] rounded-[16px] overflow-[hidden] border-[1px_solid_var(--color-border)]">





              
                {!capturedImage ?
              <>
                        <video
                  ref={videoRef}
                  autoPlay
                  playsInline className="w-[100%] h-[auto] block max-height-[400px] object-fit-[cover]" />







                
                        <canvas ref={canvasRef} className="none" />
                        
                        {/* Camera Controls */}
                        <div className="absolute bottom-[1rem] left-[50%] transform-[translateX(-50%)] flex gap-[1rem] items-center">







                  
                            <button
                    onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')} className="p-[0.8rem] bg-[rgba(0,0,0,0.6)] border-none rounded-[50%] text-[#ffffff] cursor-pointer backdrop-filter-[blur(10px)]">









                    
                                <FlipHorizontal size={20} />
                        </button>
                            
                            <button
                    onClick={toggleTorch}
                    style={{

                      background: torchOn ? 'rgba(250, 204, 21, 0.7)' : 'rgba(0,0,0,0.6)',


                      color: torchOn ? '#000' : '#ffffff'


                    }} className="p-[0.8rem] border-none rounded-[50%] cursor-pointer backdrop-filter-[blur(10px)]">
                    
                                {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                            </button>
                            
                            <button
                                onClick={handleCapture} className="group relative w-[80px] h-[80px] rounded-[50%] bg-[rgba(255,255,255,0.2)] backdrop-filter-[blur(10px)] cursor-pointer flex items-center justify-center border-none outline-none transition-all duration-300 hover:scale-[1.05]">
                                {/* Anillo exterior animado */}
                                <div className="absolute inset-[0] rounded-[50%] border-[2px_solid_rgba(255,255,255,0.8)] opacity-[0.5] scale-[1.1] transition-all duration-300 group-hover:scale-[1.15] group-hover:opacity-[1]"></div>
                                {/* Botón interior sólido */}
                                <div className="w-[60px] h-[60px] rounded-[50%] bg-[#ffffff] shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-[0.95]"></div>
                            </button>
                        </div>
                    </> :

              <div className="relative">
                        <img
                  src={capturedImage}
                  alt="Extintor capturado" className="w-[100%] max-height-[300px] object-fit-[contain] block bg-slate-100 dark:bg-slate-800/50" />







                
                        
                        {isAnalyzing &&
                <div className="absolute inset-[0] bg-[rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-[#ffffff]">








                  
                                <Loader2 size={48} className="animate-spin mb-[1rem]" />
                                <p className="text-[1.1rem] font-[700]">Analizando extintor...</p>
                                <p className="text-[0.85rem] opacity-[0.8] mt-[0.5rem]">
                                    La IA está identificando el tipo y estado
                                </p>
                            </div>
                }
                        
                        {/* Retry Button */}
                        {!isAnalyzing &&
                <button
                  onClick={handleRetry} className="absolute top-[1rem] right-[1rem] p-[0.8rem] bg-[rgba(0,0,0,0.6)] border-none rounded-[50%] text-[#ffffff] cursor-pointer backdrop-filter-[blur(10px)]">












                  
                                <RefreshCw size={20} />
                            </button>
                }
                    </div>
              }
            </div>

            {/* Analysis Results */}
            {analysisResult &&
            <div className="flex flex-col gap-[0.8rem]">
                    {/* Main Result Card */}
                    <div style={{

                background: extintorData ?
                `linear-gradient(135deg, ${extintorData.color}20, ${extintorData.color}10)` :
                'var(--color-surface)',

                border: `2px solid ${extintorData?.color || 'var(--color-border)'}`
              }} className="p-[1rem] rounded-[12px]">
                        <div className="flex items-start gap-[0.8rem]">
                            <div className="text-[2.5rem] bg-white dark:bg-slate-800 p-[0.8rem] rounded-[12px] box-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">





                    
                                {extintorData?.icon || '🧯'}
                            </div>
                            <div className="flex-[1]">
                                <h2 style={{



                      color: extintorData?.color || 'var(--color-text)'
                    }} className="m-[0_0_0.3rem_0] text-[1.1rem] font-[900]">
                                    {extintorData?.name || 'Extintor no identificado'}
                                </h2>
                                
                                <div style={{




                      background: analysisResult.status === 'vigente' ?
                      'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',



                      color: analysisResult.status === 'vigente' ? '#10b981' : '#ef4444'

                    }} className="display-[inline-flex] items-center gap-[0.4rem] p-[0.3rem_0.6rem] rounded-[20px] text-[0.85rem] font-[700] mb-[1rem]">
                                    {analysisResult.status === 'vigente' ?
                      <CheckCircle size={16} /> :
                      <AlertTriangle size={16} />
                      }
                                    Estado: {analysisResult.status?.toUpperCase() || 'DESCONOCIDO'}
                                </div>
                                
                                <p className="m-[0] text-[0.9rem] text-[var(--color-text-muted)] line-height-[1.5]">




                      
                                    {extintorData?.fires || 'No disponible'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(130px,_1fr))] gap-[0.8rem]">



                
                        {/* Capacity */}
                        <div className="p-[0.8rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                  
                            <div className="text-[0.7rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">
                                📊 Capacidad
                            </div>
                            <div className="text-[1.1rem] font-[900] text-[var(--color-text)]">
                                {analysisResult.capacity || 'N/A'}
                            </div>
                        </div>

                        {/* Last Check */}
                        <div className="p-[0.8rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                  
                            <div className="text-[0.7rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">
                                📅 Último Control
                            </div>
                            <div className="text-[0.9rem] font-[800] text-[var(--color-text)]">
                                {analysisResult.lastCheck ? new Date(analysisResult.lastCheck).toLocaleDateString('es-AR') : 'N/A'}
                            </div>
                        </div>

                        {/* Next Check */}
                        <div className="p-[0.8rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                  
                            <div className="text-[0.7rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">
                                ⏰ Próximo Control
                            </div>
                            <div style={{ color: analysisResult.nextCheck ? '#f59e0b' : 'var(--color-text)' }} className="text-[0.9rem] font-[800]">
                                {analysisResult.nextCheck ? new Date(analysisResult.nextCheck).toLocaleDateString('es-AR') : 'N/A'}
                            </div>
                        </div>

                        {/* PH Date */}
                        <div className="p-[0.8rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                  
                            <div className="text-[0.7rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">
                                💧 Vencimiento P.H.
                            </div>
                            <div style={{ color: analysisResult.phDate ? '#3b82f6' : 'var(--color-text)' }} className="text-[0.9rem] font-[800]">
                                {analysisResult.phDate ? new Date(analysisResult.phDate).toLocaleDateString('es-AR') : 'N/A'}
                            </div>
                        </div>

                        {/* Confidence */}
                        <div className="p-[0.8rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                  
                            <div className="text-[0.7rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">
                                🎯 Confianza IA
                            </div>
                            <div className="text-[1.1rem] font-[900] text-[#10b981]">
                                {Math.round((analysisResult.confidence || 0) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Usage Instructions */}
                    {extintorData &&
              <div style={{

                background: `${extintorData.color}10`,

                border: `1px solid ${extintorData.color}30`
              }} className="p-[0.8rem_1rem] rounded-[10px]">
                            <div className="flex items-center gap-[0.5rem] mb-[0.4rem]">
                                <Info size={18} color={extintorData.color} />
                                <h3 style={{ color: extintorData.color }} className="m-[0] text-[0.9rem] font-[800]">
                                    Modo de Uso
                                </h3>
                            </div>
                            <p className="m-[0] text-[0.8rem] text-[var(--color-text)] line-height-[1.5]">
                                {extintorData.usage}
                            </p>
                        </div>
              }

                    {/* Recommendations */}
                    {analysisResult.recommendations &&
              <div className="p-[0.8rem_1rem] bg-[var(--color-surface)] rounded-[10px] border-[1px_solid_var(--color-border)]">




                
                            <h3 className="m-[0_0_0.5rem_0] text-[0.9rem] font-[800]">
                                📋 Recomendaciones
                            </h3>
                            <ul className="m-[0] pl-[1.5rem] text-[var(--color-text)] line-height-[1.6]">
                                {analysisResult.recommendations.map((rec, i) =>
                  <li key={i} className="text-[0.8rem]">{rec}</li>
                  )}
                            </ul>
                        </div>
              }

                    {/* Signature */}
                    {analysisResult &&
              <div className="p-[1rem] bg-[var(--color-surface)] rounded-[12px] border-[1px_solid_var(--color-border)] mt-[0.5rem] page-break-inside-[avoid] text-center flex flex-col items-center">










                
                            <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">Firma del Inspector</h3>
                            <input
                  type="text"
                  placeholder="Nombre del Inspector / Técnico"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)} className="w-[100%] p-[0.8rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] mb-[1rem] text-[var(--color-text)] text-[0.95rem]" />





                
                            <div className="no-print">
                                <SignatureCanvas
                    onSave={(sig) => setSignature(sig)} />
                  
                            </div>
                            
                            {/* PDF View for Signature */}
                            {signature &&
                <div className="print-only none text-center mt-[1rem]">
                                    <div className="flex justify-center">
                                        <img src={signature} alt="Firma Inspector" className="h-[80px] object-fit-[contain] border-bottom-[1px_solid_#cbd5e1] mb-[0.5rem] block" />
                                    </div>
                                    <div className="text-[9pt] font-[800] text-center">{inspectorName || 'Inspector'}</div>
                                    <div className="text-[8pt] text-[#64748b] text-center">Firma del Inspector</div>
                                </div>
                }
                        </div>
              }
                </div>
            }
            
            </div> {/* Cierra extinguisher-pdf-content */}
            {!analysisResult &&
          <div className="p-[1.2rem] bg-[rgba(59,_130,_246,_0.1)] rounded-[12px] border-[1px_solid_rgba(59,_130,_246,_0.2)] flex items-start gap-[0.8rem]">







            
                    <Info size={20} color="#3b82f6" className="flex-shrink-[0] mt-[2px]" />
                    <div>
                        <p className="m-[0] text-[0.85rem] font-[700] text-[#3b82f6]">
                            💡 Cómo usar
                        </p>
                        <p className="m-[4px_0_0_0] text-[0.8rem] text-[var(--color-text-muted)] line-height-[1.6]">
                            Apuntá la cámara al extintor. La IA identificará el tipo (ABC, CO2, Agua, etc.), 
                            capacidad y estado. Funciona mejor con buena iluminación y etiqueta visible.
                        </p>
                    </div>
                </div>
          }
            </div>
            </>
      }
        </div>);

}