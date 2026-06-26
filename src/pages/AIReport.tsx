import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, Download, CheckCircle2, TriangleAlert, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function AIReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [signature, setSignature] = useState(null);
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  useEffect(() => {
    const current = localStorage.getItem('current_ai_inspection');
    const prof = localStorage.getItem('personalData');
    const sig = localStorage.getItem('signatureStampData');

    if (current) {
      const parsedData = JSON.parse(current);
      setData(parsedData);
      setCompany(parsedData.company || 'Empresa Local');
      setLocation(parsedData.location || 'Planta Principal');
    }
    if (prof) setProfile(JSON.parse(prof));
    if (sig) setSignature(JSON.parse(sig));
  }, []);

  if (!data) return <div className="container">Cargando...</div>;

  const handlePrint = () => requirePro(() => window.print());

  return (
    <div className="container max-w-[1000px]">
            <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Informe IA – ${company}`}
        text={`🤖 INFORME DE INSPECCIÓN IA\n\n🏗️ Empresa: ${company}\n📍 Ubicación: ${location}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString() : ''}\n⚠️ Estado: ${data?.analysis?.ppeComplete ? '✅ EPP Completo' : '⚠️ Falta EPP / Peligro'}\n\nGenerado con Asistente HYS`}
        rawMessage={`🤖 INFORME DE INSPECCIÓN IA\n\n🏗️ Empresa: ${company}\n📍 Ubicación: ${location}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString() : ''}\n⚠️ Estado: ${data?.analysis?.ppeComplete ? '✅ EPP Completo' : '⚠️ Falta EPP / Peligro'}\n\nGenerado con Asistente HYS`}
        elementIdToPrint="pdf-content"
        fileName={`Informe_IA_${company?.replace(/\s+/g, '_') || 'Sin_Nombre'}.pdf`} />
      
            <div className="no-print flex justify-space-between items-center mb-[2rem]">
                <></>
            </div>

            <div id="pdf-content" className="card report-print print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0 p-[3rem] min-h-[29.7cm] h-[auto] bg-[#ffffff] text-[#1e293b] box-shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] relative">







        
                {/* Header */}
                <div className="grid grid-template-columns-[1fr_2fr_1fr] items-center border-bottom-[4px_solid_var(--color-primary)] pb-[1.5rem] mb-[2rem] w-[100%] gap-[1.5rem]">
                    <div className="text-left">
                        <p className="m-[0] font-[700] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.05em]">Sistema de Gestión</p>
                        <p className="m-[0] font-[900] text-[0.75rem] uppercase text-[#1e293b]">Control H&S</p>
                    </div>

                    <div className="text-center">
                        <h2 className="m-[0] text-[1.2rem] font-[900] text-[var(--color-primary)] uppercase letter-spacing-[1px] line-height-[1.2]">
                            Informe de Inspección IA
                        </h2>
                        <p className="m-[4px_0_0_0] text-[0.65rem] text-[#64748b] font-[600]">Detección de Riesgos y EPP</p>
                    </div>

                    <div className="flex justify-end">
                        <CompanyLogo className="h-[45px] w-[auto] max-w-[140px] object-fit-[contain]" />
                    </div>
                </div>

                {profile &&
        <div className="no-print mb-[1.5rem] text-right text-[0.8rem] text-[#64748b]">
                        <p className="m-[0] font-[700]">Profesional: {profile.name} | Mat: {profile.license}</p>
                    </div>
        }

                {/* Info Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mb-10 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div>
                        <p className="m-[0] text-[0.7rem] text-[#64748b]">Tipo de Inspección</p>
                        <p className="m-[0] font-[800] text-[0.9rem] text-[var(--color-primary)]">
                            {data.type === 'general_risks' ? 'DETECTAR RIESGOS GENERALES' : 'VERIFICAR EPP'}
                        </p>
                    </div>
                    <div>
                        <p className="m-[0] text-[0.7rem] text-[#64748b]">Empresa / Planta</p>
                        <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="no-print m-[0] p-[0.2rem_0] font-[600] text-[0.9rem] border-none border-bottom-[1px_solid_#e2e8f0] bg-[transparent] w-[100%]" />

            
                        <p className="print-only m-[0] font-[600] text-[0.9rem]">{company}</p>
                    </div>
                    <div>
                        <p className="m-[0] text-[0.7rem] text-[#64748b]">Fecha del Escaneo</p>
                        <p className="m-[0] font-[600] text-[0.9rem]">{new Date(data.date).toLocaleString()}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div className="mb-[3rem] text-center">
                    <div className="relative inline-block border-[4px_solid_#fff] box-shadow-[0_5px_15px_rgba(0,0,0,0.1)] rounded-[12px] overflow-[hidden]">
                        <img src={data.image} alt="Evidencia" className="max-w-[100%] max-height-[450px] block" />
                        {/* Simplified Overlay for Report */}
                        {data.type === 'general_risks' ?
            <div className="absolute top-[10px] right-[10px] bg-[rgba(59,_130,_246,_0.9)] text-[#fff] text-[0.8rem] font-[800] p-[4px_10px] rounded-[20px] border-[2px_solid_#fff]">ANÁLISIS ENTORNO</div> :
            data.analysis?.ppeComplete ?
            <div className="absolute top-[10px] right-[10px] bg-[rgba(16,_185,_129,_0.9)] text-[#fff] text-[0.8rem] font-[800] p-[4px_10px] rounded-[20px] border-[2px_solid_#fff]">✓ EPP O.K.</div> :

            <div className="absolute top-[10px] right-[10px] bg-[rgba(239,_68,_68,_0.9)] text-[#fff] text-[0.8rem] font-[800] p-[4px_10px] rounded-[20px] border-[2px_solid_#fff]">⚠️ FALTA EPP</div>
            }
                    </div>
                    <p className="mt-[0.8rem] text-[0.8rem] text-[#64748b] font-style-[italic]">Captura fotográfica del sistema de inspección ocular</p>
                </div>

                {/* Analysis Results */}
                <div className="no-break mb-[2.5rem] page-break-inside-[avoid] break-inside-[avoid]">
                    <h3 className="border-bottom-[1px_solid_#e2e8f0] pb-[0.5rem] mb-[1rem] text-[#1e293b]">
                        {data.type === 'general_risks' ? 'Resumen de Riesgos Detectados' : 'Evaluación de EPP Detectada'}
                    </h3>

                    {data.type !== 'general_risks' ?
          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
                                {[
              { label: 'Casco de Seguridad', pass: data.analysis?.helmetUsed },
              { label: 'Calzado de Seguridad', pass: data.analysis?.shoesUsed },
              { label: 'Guantes de Trabajo', pass: data.analysis?.glovesUsed },
              { label: 'Ropa / Chaleco Reflectivo', pass: data.analysis?.clothingUsed }].
              map((item, i) =>
              <div key={i} style={{ background: item.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, color: item.pass ? '#15803d' : '#b91c1c' }} className="p-[0.8rem] rounded-[8px] flex items-center gap-[0.8rem]">
                                        {item.pass ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}
                                        <span className="font-[700] text-[0.9rem]">{item.label}: {item.pass ? 'CUMPLE' : 'FALTA'}</span>
                                    </div>
              )}
                            </div>

                            <div className="mt-[1rem] flex flex-col gap-[1rem]">
                                <div style={{ background: data.analysis?.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis?.ppeComplete ? '#bbf7d0' : '#ffedd5'}`, color: data.analysis?.ppeComplete ? '#15803d' : '#c2410c' }} className="flex flex-wrap gap-[1rem] items-center justify-space-between p-[1rem] rounded-[8px]">
                                    <div className="flex items-center gap-[0.8rem]">
                                        {data.analysis?.ppeComplete ? <ShieldCheck /> : <TriangleAlert />}
                                        <span className="font-[800]">ESTADO GENERAL: {data.analysis?.ppeComplete ? 'ADECUADO' : 'REQUIERE ATENCIÓN INMEDIATA'}</span>
                                    </div>
                                    {data.analysis?.riskLevel &&
                <div style={{

                  background: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fef2f2' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#fff7ed' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fefce8' : '#f0fdf4',
                  color: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#dc2626' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ea580c' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#ca8a04' : '#16a34a',
                  border: `1px solid ${
                  data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fecaca' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ffedd5' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fef08a' : '#bbf7d0'}`
                }} className="p-[0.4rem_1rem] rounded-[20px] text-[0.85rem] font-[900] uppercase">
                                            Riesgo: {data.analysis.riskLevel}
                                        </div>
                }
                                </div>

                                {data.analysis?.immediateAction &&
              <div className="p-[1.2rem] rounded-[12px] bg-[#fff1f2] border-[1px_solid_#fecaca] text-[#be123c]">
                                        <div className="flex items-center gap-[0.8rem] mb-[0.5rem]">
                                            <TriangleAlert size={18} />
                                            <span className="font-[800] text-[0.9rem]">ACCIÓN INMEDIATA REQUERIDA (24HS)</span>
                                        </div>
                                        <p className="m-[0] text-[0.9rem] line-height-[1.5]">{data.analysis.immediateAction}</p>
                                    </div>
              }

                                {data.analysis?.applicableLegislation && data.analysis.applicableLegislation.length > 0 &&
              <div className="p-[1.2rem] rounded-[12px] bg-[#f0fdf4] border-[1px_solid_#bbf7d0] text-[#166534]">
                                        <div className="flex items-center gap-[0.8rem] mb-[0.5rem]">
                                            <ShieldCheck size={18} />
                                            <span className="font-[800] text-[0.9rem]">NORMATIVA APLICABLE (ARG)</span>
                                        </div>
                                        <ul className="m-[0] pl-[1.2rem] text-[0.85rem] line-height-[1.5]">
                                            {data.analysis.applicableLegislation.map((leg, i) =>
                  <li key={i}>{leg}</li>
                  )}
                                        </ul>
                                    </div>
              }
                            </div>
                        </> :

          <div className="flex flex-col gap-[1.2rem]">
                            <div className="p-[1.5rem] rounded-[12px] bg-[#f8fafc] border-[1px_solid_#e2e8f0] text-[#334155] relative">
                                <div className="flex items-center justify-space-between mb-[1rem] flex-wrap gap-[1rem]">
                                    <div className="flex items-center gap-[0.8rem] text-[var(--color-primary)]">
                                        <Info size={20} />
                                        <span className="font-[800] text-[1rem]">EVALUACIÓN GENERAL IA</span>
                                    </div>
                                    {data.analysis?.riskLevel &&
                <div style={{

                  background: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fef2f2' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#fff7ed' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fefce8' : '#f0fdf4',
                  color: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#dc2626' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ea580c' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#ca8a04' : '#16a34a',
                  border: `1px solid ${
                  data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fecaca' :
                  data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ffedd5' :
                  data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fef08a' : '#bbf7d0'}`
                }} className="p-[0.4rem_1rem] rounded-[20px] text-[0.85rem] font-[900] uppercase">
                                            Riesgo: {data.analysis.riskLevel}
                                        </div>
                }
                                </div>
                                <p className="m-[0] text-[0.95rem] line-height-[1.6]">{data.analysis?.generalAssessment || 'Análisis ambiental completado.'}</p>
                            </div>

                            {data.analysis?.immediateAction &&
            <div className="p-[1.2rem] rounded-[12px] bg-[#fff1f2] border-[1px_solid_#fecaca] text-[#be123c]">
                                    <div className="flex items-center gap-[0.8rem] mb-[0.5rem]">
                                        <TriangleAlert size={18} />
                                        <span className="font-[800] text-[0.9rem]">ACCIÓN INMEDIATA REQUERIDA (24HS)</span>
                                    </div>
                                    <p className="m-[0] text-[0.9rem] line-height-[1.5]">{data.analysis.immediateAction}</p>
                                </div>
            }

                            {data.analysis?.applicableLegislation && data.analysis.applicableLegislation.length > 0 &&
            <div className="p-[1.2rem] rounded-[12px] bg-[#f0fdf4] border-[1px_solid_#bbf7d0] text-[#166534]">
                                    <div className="flex items-center gap-[0.8rem] mb-[0.5rem]">
                                        <ShieldCheck size={18} />
                                        <span className="font-[800] text-[0.9rem]">NORMATIVA APLICABLE (ARG)</span>
                                    </div>
                                    <ul className="m-[0] pl-[1.2rem] text-[0.85rem] line-height-[1.5]">
                                        {data.analysis.applicableLegislation.map((leg, i) =>
                <li key={i}>{leg}</li>
                )}
                                    </ul>
                                </div>
            }
                        </div>
          }
                </div>

                {/* Findings Legend (Numbered) */}
                {data.analysis?.detections && data.analysis.detections.length > 0 &&
        <div className="no-break mb-[2.5rem] page-break-inside-[avoid] break-inside-[avoid]">
                        <h4 className="border-bottom-[1px_solid_#e2e8f0] pb-[0.5rem] mb-[1rem] text-[#1e293b]">Leyenda de Hallazgos en Imagen</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
                            {data.analysis.detections.map((det, i) => {
              const severity = (det.severity || '').toLowerCase();
              const badgeBg = severity === 'crítico' ? '#ef4444' :
              severity === 'alto' ? '#f97316' :
              severity === 'medio' ? '#eab308' :
              severity === 'bajo' ? '#10b981' : '#3b82f6';

              return (
                <div key={i} className="flex items-center gap-[0.8rem] text-[0.9rem] bg-[#f8fafc] p-[0.5rem] rounded-[8px] border-[1px_solid_#e2e8f0]">
                                        <div style={{

                    background: badgeBg


                  }} className="w-[24px] h-[24px] rounded-[50%] text-[#fff] flex items-center justify-center font-[900] text-[0.75rem] flex-shrink-[0]">
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[#1e293b] font-[600]">{det.label}</span>
                                            {det.severity && <span style={{ color: badgeBg }} className="text-[0.7rem] font-[700] uppercase">{det.severity}</span>}
                                        </div>
                                    </div>);

            })}
                        </div>
                    </div>
        }

                {/* Additional Findings */}
                {(data.analysis?.foundRisks?.length > 0 || data.analysis?.detections?.some((d) => d.recommendation)) &&
        <div className="no-break mb-[3rem] page-break-inside-[avoid] break-inside-[avoid]">
                        <h4 className="text-[#b91c1c] border-bottom-[1px_solid_#fca5a5] pb-[0.5rem] mb-[1rem]">Riesgos y Observaciones Detalladas:</h4>
                        
                        {data.analysis?.foundRisks?.length > 0 &&
          <div className="mb-6">
                                <h5 className="m-[0_0_0.5rem_0] text-[#334155] text-[0.9rem] font-[700]">Riesgos Generales:</h5>
                                <ul className="m-[0] pl-[1.5rem] text-[#1e293b] text-[0.9rem] line-height-[1.6]">
                                    {data.analysis.foundRisks.map((risk, i) =>
              <li key={`risk-${i}`} className="mb-[0.4rem]">{risk}</li>
              )}
                                </ul>
                            </div>
          }

                        {data.analysis?.detections?.filter((d) => d.recommendation).length > 0 &&
          <div>
                                <h5 className="m-[0_0_0.5rem_0] text-[#334155] text-[0.9rem] font-[700]">Recomendaciones por Hallazgo:</h5>
                                <ul className="m-[0] pl-[1.5rem] text-[#1e293b] text-[0.9rem] line-height-[1.6]">
                                    {data.analysis.detections.filter((d) => d.recommendation).map((det, i) =>
              <li key={`rec-${i}`} className="mb-[0.4rem]">
                                            <strong>{det.label}:</strong> {det.recommendation}
                                        </li>
              )}
                                </ul>
                            </div>
          }
                    </div>
        }

                <div className="no-print mt-10 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-xs font-bold text-slate-700">
                    <div className="text-center">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4 flex-wrap justify-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={(e) => setShowSignatures((s) => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={(e) => setShowSignatures((s) => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={(e) => setShowSignatures((s) => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Profesional
                        </label>
                    </div>
                </div>

                <PdfSignatures
          data={{
            ...data,
            professionalSignature: signature?.signature,
            professionalStamp: signature?.stamp,
            professionalName: profile?.name,
            professionalLicense: profile?.license
          }}
          box1={showSignatures.operator ? {
            title: 'TRABAJADOR / OPERADOR',
            subtitle: 'Aclaración y Firma',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box3={showSignatures.supervisor ? {
            title: 'SUPERVISOR / TESTIGO',
            subtitle: 'Aclaración y Firma',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box2={showSignatures.professional ? undefined : null} />
        
            <PdfBrandingFooter />

                {/* Footer Content (Static in report) */}
                <div className="relative mt-[30px] pb-[30px] w-[100%] text-center text-[0.7rem] text-[#94a3b8]">
                    Documento de verificación instantánea generado por Asistente HYS.
                </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button onClick={() => toast.success('Los reportes de IA se guardan automáticamente en tu Historial.')} className="btn-floating-action bg-[#36B37E] text-[white]">
                    <CheckCircle2 size={18} /> GUARDADO
                </button>
                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action bg-[#0052CC] text-[white]">
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action bg-[#FF8B00] text-[white]">
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <style>
                {`
                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                @media print {
                    .report-print {
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
                `}
            </style>
        </div>);

}