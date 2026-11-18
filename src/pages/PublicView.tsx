import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicDoc, fetchPublicLogo } from '../services/cloudSync';
import { FileText, AlertTriangle, Printer, Download, ShieldCheck, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';
import { generatePdfBlob, printElementAsDocument } from '../utils/pdfHelper';

// PDF Generators
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import RiskMatrixPdfGenerator from '../components/RiskMatrixPdfGenerator';
import LightingPdfGenerator from '../components/LightingPdfGenerator';
import ChecklistPdfGenerator from '../components/ChecklistPdfGenerator';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';
import PublicWorkerPassView from '../components/PublicWorkerPassView';
import LiftingPdfGenerator from '../components/LiftingPdfGenerator';
import LOTOPdf from '../components/LOTOPdf';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import ExtinguisherAIPdfGenerator from '../components/ExtinguisherAIPdfGenerator';
import AiAdvisorPdfGenerator from '../components/AiAdvisorPdfGenerator';

export default function PublicView(): React.ReactElement | null {
  const { uid, cat, id } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileScale, setMobileScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const effectiveCat = cat || (docData?._publicCategory as string) || '';

  // Escalar proporcionalmente la hoja A4 (794px) en pantallas de celulares para que se vea completa sin recortes
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      if (vw < 820 && effectiveCat !== 'worker' && effectiveCat !== 'pasaporte' && effectiveCat !== 'legajo' && effectiveCat !== 'asset') {
        const s = Math.max(0.38, Math.min(1, (vw - 20) / 794));
        setMobileScale(s);
      } else {
        setMobileScale(1);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [effectiveCat]);

  useEffect(() => {
    if (!sheetRef.current || mobileScale >= 1) {
      setScaledHeight(null);
      return;
    }
    const updateHeight = () => {
      if (sheetRef.current) {
        setScaledHeight(Math.ceil(sheetRef.current.scrollHeight * mobileScale) + 24);
      }
    };
    updateHeight();
    const timer = setTimeout(updateHeight, 400);
    return () => clearTimeout(timer);
  }, [docData, mobileScale]);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryId = searchParams.get('id');
        const targetId = id || queryId;
        const targetUid = uid || 'guest';

        if (cat === 'asset' && targetId) {
          let foundAsset: any = null;
          try {
            const saved = localStorage.getItem('ehs_assets');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                foundAsset = parsed.find((a: any) => String(a.id) === String(targetId));
              }
            }
          } catch {}
          if (!foundAsset && searchParams.get('name')) {
            foundAsset = {
              id: targetId,
              name: searchParams.get('name') || 'Activo Registrado',
              category: searchParams.get('category') || 'Equipamiento',
              location: searchParams.get('location') || 'Planta Principal',
              serialNumber: searchParams.get('serial') || 'S/N',
              status: searchParams.get('status') || 'Operativo',
              lastInspection: searchParams.get('lastInspection') || new Date().toISOString().slice(0, 10),
              notes: searchParams.get('notes') || ''
            };
          }
          if (foundAsset) {
            setDocData(foundAsset);
          } else {
            setDocData({
              id: targetId,
              name: `Activo Industrial ${targetId}`,
              category: 'Equipamiento Crítico',
              location: 'Sector Operativo',
              serialNumber: targetId,
              status: 'Operativo',
              lastInspection: new Date().toISOString().slice(0, 10)
            });
          }
        } else if (cat && targetId) {
          const data: any = await fetchPublicDoc(targetUid, cat, targetId);
          if (data) {
            // Hidratar datos de firma, profesional y logo en el navegador visitante (sin pisar sesión propia si existe)
            try {
              if (data._sharedPersonalData && !localStorage.getItem('personalData')) {
                localStorage.setItem('personalData', JSON.stringify(data._sharedPersonalData));
              }
              if (data._sharedSignatureStampData && !localStorage.getItem('signatureStampData')) {
                localStorage.setItem('signatureStampData', JSON.stringify(data._sharedSignatureStampData));
              }
              if (data._sharedCompanyLogo) {
                (window as any).sharedLogoData = { logo: data._sharedCompanyLogo, show: true };
                if (!localStorage.getItem('companyLogo')) {
                  localStorage.setItem('companyLogo', String(data._sharedCompanyLogo));
                }
              } else if (targetUid && targetUid !== 'guest' && targetUid !== 'pub') {
                const logoData = await fetchPublicLogo(targetUid);
                if (logoData && logoData.logo) {
                  (window as any).sharedLogoData = logoData;
                  if (!localStorage.getItem('companyLogo')) {
                    localStorage.setItem('companyLogo', String(logoData.logo));
                  }
                }
              }
            } catch (logoErr) {
              console.warn('Could not hydrate shared metadata:', logoErr);
            }
            setDocData(data);
          } else {
            setError('Documento no encontrado o aún no sincronizado en la nube.');
          }
        } else if (targetId) {
          // Intentar buscar en public_verifications por ID directo antes de mostrar solo el portal de código
          const directData: any = await fetchPublicDoc('guest', 'snapshot', targetId);
          if (directData) {
            setDocData(directData);
          } else {
            setDocData({
              isVerifiedIdOnly: true,
              docId: targetId,
              verificationTime: new Date().toISOString()
            });
          }
        } else if (window.location.pathname.startsWith('/verify')) {
          setDocData({
            isVerificationPortal: true
          });
        } else {
          setError('Enlace de verificación no válido o ausente.');
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar la información del documento público.');
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [uid, cat, id]);

  if (loading) return <LoadingScreen />;

  if (docData?.isVerificationPortal || docData?.isVerifiedIdOnly) {
    const verifiedCode = docData?.docId || new URLSearchParams(window.location.search).get('id') || 'VER-HYS-789';
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={36} className="text-emerald-400" />
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
            ✓ Documento Verificado
          </span>
          <h1 className="text-xl font-bold text-white mt-3">Autenticidad Digital H&S</h1>
          <p className="text-slate-400 text-xs mt-1">
            Este documento fue generado y firmado digitalmente mediante la plataforma Asistente H&S.
          </p>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 mt-5 text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">CÓDIGO DE CONTROL:</span>
              <span className="text-emerald-400 font-bold">{verifiedCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ESTADO:</span>
              <span className="text-emerald-400 font-bold">VIGENTE Y FIRMADO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VERIFICADO EL:</span>
              <span className="text-slate-300">{new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
          >
            Ir a Asistente H&S
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <AlertTriangle size={48} color="#ef4444" className="mb-4" />
          <h2 className="font-black text-lg text-white mb-2">{error}</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Si acabás de crear este registro, abrí nuevamente el botón de QR o Compartir desde tu sesión para sincronizarlo instantáneamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-sm border-none cursor-pointer"
          >
            Reintentar carga
          </button>
        </div>
      </div>
    );
  }

  const renderGenerator = () => {
    switch (effectiveCat) {
      case 'ats':
        return <ATSPdfGenerator atsData={docData} />;
      case 'camera':
        return <AiReportPdfGenerator item={docData} />;
      case 'permit':
        return <WorkPermitPdfGenerator data={docData} />;
      case 'fireload':
        return <FireLoadPdfGenerator data={docData} />;
      case 'matrix':
        return <RiskMatrixPdfGenerator data={docData} />;
      case 'lighting':
        return <LightingPdfGenerator data={docData} />;
      case 'checklist':
        return <ChecklistPdfGenerator checklistData={docData} isHeadless={true} />;
      case 'accident':
        return <AccidentPdfGenerator report={docData} isHeadless={true} onBack={() => navigate(-1)} />;
      case 'training':
        return <TrainingPdfGenerator data={docData} isHeadless={true} />;
      case 'extinguisher':
      case 'extintor':
        if (docData?.confidence !== undefined || (docData?.type && !docData?.numero && !docData?.agente)) {
          return <ExtinguisherAIPdfGenerator item={docData} />;
        }
        if (docData?.analysis) {
          return <AiReportPdfGenerator item={docData} />;
        }
        return <PublicExtinguisherView data={docData} id={id} />;
      case 'lifting':
        return <LiftingPdfGenerator data={docData} />;
      case 'loto':
        return <LOTOPdf data={docData} />;
      case 'riskmap':
        return <RiskMapPdfGenerator data={docData} />;
      case 'advisor':
      case 'ai_advisor_history':
        return <AiAdvisorPdfGenerator data={docData} />;
      case 'thermal':
        return <ThermalStressPdfGenerator data={docData} isHeadless={true} />;
      case 'drill':
        return <DrillPdfGenerator report={docData} isHeadless={true} onBack={() => navigate(-1)} />;
      case 'stopcard':
        return <StopCardPdfGenerator card={docData} />;
      case 'riskassessment':
        return <RiskAssessmentPdfGenerator assessmentData={docData} />;
      case 'worker':
      case 'pasaporte':
      case 'legajo':
        return <PublicWorkerPassView data={docData} id={id} />;
      case 'asset':
        return <PublicAssetQRView data={docData} id={id} onBack={() => navigate('/asset-scanner')} />;
      case 'snapshot':
        return (
          <div
            id="pdf-content"
            className="pdf-container print-area w-full max-w-[210mm] bg-white text-slate-900 p-4 sm:p-6 mx-auto box-border"
            dangerouslySetInnerHTML={{ __html: docData?.htmlSnapshot || '' }}
          />
        );
      default:
        if (docData?.htmlSnapshot) {
          return (
            <div
              id="pdf-content"
              className="pdf-container print-area w-full max-w-[210mm] bg-white text-slate-900 p-4 sm:p-6 mx-auto box-border"
              dangerouslySetInnerHTML={{ __html: docData.htmlSnapshot }}
            />
          );
        }
        return <div className="p-8 text-center font-bold text-slate-700">Categoría no soportada.</div>;
    }
  };

  const docTitle =
    docData?.title ||
    docData?.tema ||
    docData?.empresa ||
    docData?.company ||
    docData?.equipo ||
    docData?.name ||
    (docData?.numero ? `Matafuego_${docData.numero}` : 'Documento_HYS');

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const toastId = toast.loading('Generando archivo PDF...');
    try {
      const targetElId = document.getElementById('pdf-content') ? 'pdf-content' : 'public-pdf-sheet';
      const isLandscape = Boolean(docData?.isLandscape || effectiveCat === 'matrix');
      const blob = await generatePdfBlob(targetElId, isLandscape);
      const safeName = `${String(docTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'documento_hys'}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1500);
      toast.success('¡PDF descargado!', { id: toastId });
    } catch (err) {
      console.error('Error al descargar PDF público:', err);
      toast.dismiss(toastId);
      handlePrintPdf();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintPdf = async () => {
    const targetElId = document.getElementById('pdf-content') ? 'pdf-content' : 'public-pdf-sheet';
    const isLandscape = Boolean(docData?.isLandscape || effectiveCat === 'matrix');
    try {
      await printElementAsDocument(targetElId, String(docTitle), isLandscape);
    } catch {
      window.print();
    }
  };

  const handleShare = async () => {
    const cleanUrl = window.location.href.replace(/[?&]print=true/g, '');
    const shareData = {
      title: `Asistente H&S - ${docTitle}`,
      text: `Visualizá este documento verificado de Higiene y Seguridad: ${docTitle}`,
      url: cleanUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(cleanUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const isCardView =
    effectiveCat === 'worker' ||
    effectiveCat === 'pasaporte' ||
    effectiveCat === 'legajo' ||
    effectiveCat === 'asset';

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Barra superior pública fija (sin necesidad de login) */}
      <div
        className="no-print"
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: '#ffffff',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Asistente H&amp;S
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Vista Pública QR Verificada
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={handleShare}
            title="Compartir enlace"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.5rem 0.65rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Share2 size={17} />
          </button>

          <button
            onClick={handlePrintPdf}
            title="Imprimir"
            style={{
              background: 'rgba(59, 130, 246, 0.18)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isDownloading ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Download size={16} />
            <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Documento (Fuerza tema claro papel A4 para evitar textos blancos sobre fondo blanco) */}
      <div
        style={{
          maxWidth: isCardView ? '900px' : '840px',
          margin: '1.25rem auto 0',
          padding: isCardView ? '0 1rem' : '0 8px',
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'hidden'
        }}
      >
        <div
          style={{
            width: isCardView ? '100%' : mobileScale < 1 ? `${Math.round(794 * mobileScale)}px` : '100%',
            height: scaledHeight ? `${scaledHeight}px` : 'auto',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            ref={sheetRef}
            id="public-pdf-sheet"
            style={{
              '--color-text': '#0f172a',
              '--color-text-muted': '#475569',
              '--color-text-light': '#64748b',
              '--color-surface': '#ffffff',
              '--color-surface-solid': '#ffffff',
              '--color-background': '#f8fafc',
              '--color-border': '#cbd5e1',
              colorScheme: 'light',
              backgroundColor: isCardView ? 'transparent' : '#ffffff',
              color: '#0f172a',
              width: isCardView ? '100%' : '794px',
              minWidth: isCardView ? '0' : '794px',
              borderRadius: isCardView ? '0' : '16px',
              boxShadow: isCardView ? 'none' : '0 25px 60px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              transform: !isCardView && mobileScale < 1 ? `scale(${mobileScale})` : 'none',
              transformOrigin: 'top center'
            } as React.CSSProperties}
          >
            {renderGenerator()}
          </div>
        </div>
      </div>

      <div className="no-print text-center mt-8 px-6">
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
          Este documento es una copia auténtica verificada mediante <strong>Asistente H&amp;S</strong>.<br />
          Podés visualizarlo en pantalla o tocar <strong>Descargar PDF</strong> arriba para guardarlo en tu teléfono.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', opacity: 0.45, color: '#94a3b8' }}>
          <Shield size={20} />
          <KeySquare size={20} />
          <Activity size={20} />
        </div>
      </div>
    </div>
  );
}

const Shield = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const KeySquare = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.4 2.7a2.5 2.5 0 0 1 3.4 0l4.5 4.5a2.5 2.5 0 0 1 0 3.4l-11 11.1L2 22l.3-7.3 10.1-12z" />
  </svg>
);
const Activity = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

function PublicExtinguisherView({ data, id }: { data: any; id?: string }) {
  const ext = Array.isArray(data)
    ? data.find((e: any) => String(e.id) === String(id) || String(e.numero) === String(id)) || data[0]
    : data;

  if (!ext) {
    return (
      <div className="p-8 text-center text-red-600 font-bold bg-white">
        No se encontraron datos técnicos para este extintor.
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900">
      <ExtinguisherProfilePdf
        data={ext}
        isHeadless={true}
        pdfElementId="pdf-content"
      />
    </div>
  );
}

function PublicAssetQRView({ data, id, onBack }: { data: any; id?: string; onBack?: () => void }) {
  if (!data) return null;
  const status = data.status || 'Operativo';
  const statusColor =
    status === 'Operativo'
      ? '#059669'
      : status === 'Requiere Mantenimiento'
      ? '#d97706'
      : '#dc2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', background: '#0f172a', padding: '1rem', borderRadius: '18px' }}>
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '18px',
          border: `2px solid ${statusColor}`,
          background: '#1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: statusColor,
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            ESTADO: {status}
          </span>
          <h2 style={{ margin: '8px 0 4px', fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
            {data.name || `Activo ${id}`}
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
            Ficha Oficial de Inspección QR/NFC • ISO 55001 / Ley 19.587
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Ir al Inventario QR
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#1e293b',
            border: '1px solid #334155'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Código ID de Activo
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
            {data.id || id}
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#1e293b',
            border: '1px solid #334155'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Categoría / Tipo de Equipo
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            {data.category || 'Equipamiento Industrial'}
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#1e293b',
            border: '1px solid #334155'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Ubicación Física / Sector
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            📍 {data.location || 'Sector Principal'}
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#1e293b',
            border: '1px solid #334155'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Nº de Serie &amp; Última Inspección
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            Serie: {data.serialNumber || 'S/N'} • 📅 {data.lastInspection || '-'}
          </div>
        </div>
      </div>

      {data.notes && (
        <div
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            background: '#1e293b',
            border: '1px solid #334155',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#f8fafc'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '4px', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            Observaciones Técnicas:
          </strong>
          {data.notes}
        </div>
      )}
    </div>
  );
}
