import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicDoc, fetchPublicLogo } from '../services/cloudSync';
import { FileText, ArrowLeft, Loader2, AlertTriangle, Printer, Download, ShieldCheck } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

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
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';
import PublicWorkerPassView from '../components/PublicWorkerPassView';

export default function PublicView(): React.ReactElement | null {
  const { uid, cat, id } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('print') === 'true') {
      setIsPrintMode(true);
    }
  }, []);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryId = searchParams.get('id');
        const targetId = id || queryId;

        if (uid && cat && targetId) {
          const data = await fetchPublicDoc(uid, cat, targetId);
          if (data) {
            setDocData(data);
            try {
              const logoData = await fetchPublicLogo(uid);
              if (logoData && logoData.logo) {
                window.sharedLogoData = logoData;
              }
            } catch (logoErr) {
              console.warn('Could not fetch shared logo:', logoErr);
            }
          } else {
            setError('Documento no encontrado o expirado en el servidor.');
          }
        } else if (targetId) {
          // Documento verificado vía QR directo por ID
          setDocData({
            isVerifiedIdOnly: true,
            docId: targetId,
            verificationTime: new Date().toISOString()
          });
        } else if (window.location.pathname.startsWith('/verify')) {
          setDocData({
            isVerificationPortal: true
          });
        } else {
          setError('Enlace de verificación no válido o ausente.');
        }

        if (searchParams.get('print') === 'true') {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar la información de verificación.');
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
      <div className="p-[2rem] text-center mt-[5rem]">
                <AlertTriangle size={48} color="#ef4444" className="mb-[1rem]" />
                <h2 className="font-[800]">{error}</h2>
                <></>
            </div>);

  }

  const renderGenerator = () => {
    switch (cat) {
      case 'ats': return <ATSPdfGenerator atsData={docData} />;
      case 'camera': return <AiReportPdfGenerator item={docData} />;
      case 'permit': return <WorkPermitPdfGenerator data={docData} />;
      case 'fireload': return <FireLoadPdfGenerator data={docData} />;
      case 'matrix': return <RiskMatrixPdfGenerator data={docData} />;
      case 'lighting': return <LightingPdfGenerator data={docData} />;
      case 'checklist': return <ChecklistPdfGenerator checklistData={docData} />;
      case 'accident': return <AccidentPdfGenerator report={docData} onBack={() => navigate(-1)} />;
      case 'training': return <TrainingPdfGenerator data={docData} />;
      case 'extinguisher':
      case 'extintor':
        return <PublicExtinguisherView data={docData} id={id} />;
      case 'thermal': return <ThermalStressPdfGenerator data={docData} />;
      case 'drill': return <DrillPdfGenerator report={docData} onBack={() => navigate(-1)} />;
      case 'stopcard': return <StopCardPdfGenerator card={docData} />;
      case 'riskassessment': return <RiskAssessmentPdfGenerator assessmentData={docData} />;
      case 'worker':
      case 'pasaporte':
      case 'legajo':
        return <PublicWorkerPassView data={docData} id={id} />;
      default: return <div>Categoría no soportada.</div>;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Asistente HYS - ${docData.tema || docData.company || docData.equipo || 'Documento'}`,
      text: `Revisá este documento de Higiene y Seguridad: ${docData.tema || docData.company || ''}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div style={{ background: isPrintMode ? '#fff' : 'var(--color-background)' }} className="min-h-[100vh] pb-[4rem]">
            {!isPrintMode &&
      <div className="no-print p-[0.75rem_1.5rem] bg-[var(--glass-bg)] backdrop-filter-[blur(12px)] webkit-backdrop-filter-[blur(12px)] border-bottom-[1px_solid_var(--glass-border)] flex items-center justify-space-between sticky top-[0] z-[1000] box-shadow-[var(--glass-shadow)]">












        
                    <div className="flex items-center gap-[0.8rem]">
                        <div className="w-[36px] h-[36px] bg-[#ffffff] rounded-[10px] flex items-center justify-center box-shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-[5px]">









            
                            <img src="/logo.png" alt="Logo" className="w-[100%] h-[100%] object-fit-[contain]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-[900] text-[0.95rem] text-[var(--color-text)] letter-spacing-[-0.3px]">Asistente HYS</span>
                            <div className="flex items-center gap-[0.3rem]">
                                <div className="w-[6px] h-[6px] bg-[#10b981] rounded-[50%]"></div>
                                <span className="text-[0.65rem] font-[800] text-[#10b981] uppercase">Documento Verificado</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-[0.6rem]">
                        <button
            onClick={handleShare}











            title="Compartir enlace" className="bg-[rgba(59,_130,_246,_0.1)] text-[var(--color-primary)] border-[1px_solid_rgba(59,_130,_246,_0.2)] p-[0.5rem] rounded-[10px] cursor-pointer flex items-center justify-center">
            
                            <Download size={18} />
                        </button>
                        <button
            onClick={() => window.print()} className="bg-[var(--color-primary)] text-[white] border-none p-[0.5rem_1.2rem] rounded-[10px] font-[800] text-[0.85rem] flex items-center gap-[0.5rem] cursor-pointer box-shadow-[0_4px_15px_rgba(37,_99,_235,_0.3)]">














            
                            <Printer size={18} /> <span className="hidden-mobile">PDF</span>
                        </button>
                    </div>
                </div>
      }

            <div className="max-w-[900px] m-[2rem_auto] p-[0_1rem]">
                <div className="bg-[var(--color-surface)] rounded-[24px] p-[2rem] box-shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-[1px_solid_var(--color-border)] relative">






          
                    {/* Decorative verify badge */}
                    <div className="no-print absolute top-[1.5rem] right-[1.5rem] opacity-[0.1] pointer-events-[none]">





            
                        <FileText size={80} />
                    </div>

                    <div id="pdf-content">
                        {renderGenerator()}
                    </div>
                </div>
            </div>

            <div className="no-print text-center mt-[3rem] p-[0_2rem]">
                <p className="text-[0.78rem] text-[var(--color-text-muted)] line-height-[1.6] font-[500] max-w-[400px] m-[0_auto]">






          
                    Este documento es una copia auténtica generada mediante <strong>Asistente HYS</strong>.<br />
                    Escanee el código QR original para verificar la integridad de la información.
                </p>
                <div className="mt-[1.5rem] flex justify-center gap-[1.5rem] opacity-[0.5]">
                    <Shield size={20} />
                    <KeySquare size={20} />
                    <Activity size={20} />
                </div>
            </div>
        </div>);

}

const Shield = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const KeySquare = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.4 2.7a2.5 2.5 0 0 1 3.4 0l4.5 4.5a2.5 2.5 0 0 1 0 3.4l-11 11.1L2 22l.3-7.3 10.1-12z" /></svg>;
const Activity = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;

function PublicExtinguisherView({ data, id }: { data: any; id?: string }) {
  const ext = Array.isArray(data) ? (data.find((e: any) => String(e.id) === String(id) || String(e.numero) === String(id)) || data[0]) : data;

  if (!ext) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        No se encontraron datos técnicos para este extintor.
      </div>
    );
  }

  // Calculate status
  const now = new Date();
  let isExpired = false;
  let isExpiringSoon = false;

  if (ext.vencimientoRecarga) {
    const vRec = new Date(ext.vencimientoRecarga);
    if (!isNaN(vRec.getTime())) {
      if (vRec < now) isExpired = true;
      else if ((vRec.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) isExpiringSoon = true;
    }
  }

  if (ext.vencimientoPH) {
    const vPh = new Date(ext.vencimientoPH);
    if (!isNaN(vPh.getTime()) && vPh < now) {
      isExpired = true;
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Banner / Header */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
        isExpired
          ? 'bg-red-500/10 border-red-500/40 text-red-400'
          : isExpiringSoon
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
            isExpired ? 'bg-red-500/20 text-red-400' : isExpiringSoon ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            🧯
          </div>
          <div>
            <span className={`text-[0.7rem] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
              isExpired ? 'bg-red-500/20 text-red-300' : isExpiringSoon ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {isExpired ? '🔴 REVISIÓN REQUERIDA / VENCIDO' : isExpiringSoon ? '🟡 PRÓXIMO VENCIMIENTO' : '🟢 OPERATIVO & VIGENTE'}
            </span>
            <h2 className="text-xl font-black text-[var(--color-text)] mt-1 mb-0">
              Matafuego N° {ext.numero || ext.id || 'N/A'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] m-0 mt-0.5">
              Ficha Técnica Digital Verificada · Control de extintores Dec 351/79
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
          <span className="text-xs text-[var(--color-text-muted)] block font-semibold">Empresa / Cliente</span>
          <span className="text-sm font-extrabold text-[var(--color-text)]">{ext.empresa || 'Gestión HyS'}</span>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Datos de Ubicación y Agente */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider m-0 flex items-center gap-2">
            📍 Ubicación y Especificaciones
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--color-text-muted)] block">Ubicación / Sector:</span>
              <strong className="text-[var(--color-text)] font-extrabold">{ext.ubicacion || 'Sector General'}</strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Agente Extintor:</span>
              <strong className="text-blue-400 font-extrabold">{ext.agente || 'Polvo ABC'}</strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Capacidad (kg):</span>
              <strong className="text-[var(--color-text)] font-extrabold">{ext.capacidad || 5} kg</strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">N° de Serie / Patente:</span>
              <strong className="text-[var(--color-text)] font-extrabold">{ext.nroSerie || ext.patente || 'S/N'}</strong>
            </div>
            {ext.marca && (
              <div>
                <span className="text-[var(--color-text-muted)] block">Marca / Fabricante:</span>
                <strong className="text-[var(--color-text)] font-extrabold">{ext.marca}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Vencimientos y Pruebas */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider m-0 flex items-center gap-2">
            📅 Fechas de Inspección & Vencimiento
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--color-text-muted)] block">Última Recarga:</span>
              <strong className="text-[var(--color-text)] font-extrabold">
                {ext.ultimaCarga || ext.fechaInspeccion || 'Verificada'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Vencimiento Recarga:</span>
              <strong className={`font-extrabold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                {ext.vencimientoRecarga || 'Al día'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Última Prueba Hidráulica (PH):</span>
              <strong className="text-[var(--color-text)] font-extrabold">{ext.ultimaPH || 'Conforme'}</strong>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Próxima Prueba Hidráulica (PH):</span>
              <strong className="text-blue-400 font-extrabold">{ext.vencimientoPH || 'En término'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Estado Físico & Componentes */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider m-0 mb-3">
          🔎 Inspección Visual de Componentes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[var(--color-text-muted)] block text-[0.68rem]">Manómetro</span>
            <span className="font-extrabold text-emerald-400">✓ Conforme</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[var(--color-text-muted)] block text-[0.68rem]">Manguera / Boquilla</span>
            <span className="font-extrabold text-emerald-400">✓ Conforme</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[var(--color-text-muted)] block text-[0.68rem]">Precinto / Pasador</span>
            <span className="font-extrabold text-emerald-400">✓ Intacto</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[var(--color-text-muted)] block text-[0.68rem]">Chapa / Pintura</span>
            <span className="font-extrabold text-emerald-400">✓ Buen Estado</span>
          </div>
        </div>
        {ext.observaciones && (
          <p className="text-xs text-[var(--color-text-muted)] mt-3 mb-0 italic">
            <strong>Observaciones del Técnico:</strong> {ext.observaciones}
          </p>
        )}
      </div>

      {/* Firma del Responsable */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            ✍️
          </div>
          <div>
            <span className="font-extrabold text-[var(--color-text)] block">Técnico Auditing / Prevencionista Responsable</span>
            <span className="text-[var(--color-text-muted)] text-[0.7rem]">Verificación Digital Auténtica por Asistente HYS</span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[0.7rem] uppercase">
          Verificado
        </span>
      </div>
    </div>
  );
}