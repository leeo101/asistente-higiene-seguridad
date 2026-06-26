import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicDoc, fetchPublicLogo } from '../services/cloudSync';
import { FileText, ArrowLeft, Loader2, AlertTriangle, Printer, Download } from 'lucide-react';
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
        const data = await fetchPublicDoc(uid, cat, id);
        if (data) {
          setDocData(data);

          // Fetch owner's logo settings for consistency
          try {
            const logoData = await fetchPublicLogo(uid);
            if (logoData && logoData.logo) {
              window.sharedLogoData = logoData;
            }
          } catch (logoErr) {
            console.warn('Could not fetch shared logo:', logoErr);
          }

          // auto-print if flag is set
          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('print') === 'true') {
            setTimeout(() => {
              window.print();
            }, 1000); // Wait for content to stabilize
          }
        } else {
          setError('Documento no encontrado o expirado.');
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar el documento.');
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [uid, cat, id]);

  if (loading) return <LoadingScreen />;

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
      case 'ats':return <ATSPdfGenerator atsData={docData} />;
      case 'camera':return <AiReportPdfGenerator item={docData} />;
      case 'permit':return <WorkPermitPdfGenerator data={docData} />;
      case 'fireload':return <FireLoadPdfGenerator data={docData} />;
      case 'matrix':return <RiskMatrixPdfGenerator data={docData} />;
      case 'lighting':return <LightingPdfGenerator data={docData} />;
      case 'checklist':return <ChecklistPdfGenerator checklistData={docData} />;
      case 'accident':return <AccidentPdfGenerator report={docData} onBack={() => navigate(-1)} />;
      case 'training':return <TrainingPdfGenerator data={docData} />;
      case 'extinguisher':return <ExtinguisherPdfGenerator extinguishers={docData || []} />;
      case 'thermal':return <ThermalStressPdfGenerator data={docData} />;
      case 'drill':return <DrillPdfGenerator report={docData} onBack={() => navigate(-1)} />;
      case 'stopcard':return <StopCardPdfGenerator card={docData} />;
      case 'riskassessment':return <RiskAssessmentPdfGenerator assessmentData={docData} />;
      default:return <div>Categoría no soportada.</div>;
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