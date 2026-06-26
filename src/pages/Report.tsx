import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, Save, Printer, Building2, User, Calendar,
  CheckCircle2, AlertCircle, TriangleAlert,
  Share2, FileText, ShieldCheck, Camera,
  ShieldAlert, MapPin, Info } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function Report(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [inspectionData, setInspectionData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [professional, setProfessional] = useState(null);
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  useEffect(() => {
    // Load inspection data and update history if not already final
    const current = localStorage.getItem('current_inspection');
    if (current) {
      const inspection = JSON.parse(current);
      setInspectionData(inspection);

      // Update history with latest inspection data and mark as final
      const historyRaw = localStorage.getItem('inspections_history');
      const history = historyRaw ? JSON.parse(historyRaw) : [];

      const existingIndex = history.findIndex((item: any) => item.id === inspection.id);
      if (existingIndex >= 0) {
        // Update with latest changes even if already final
        history[existingIndex] = { ...inspection, status: 'Finalizada' };
        localStorage.setItem('inspections_history', JSON.stringify(history));
      } else {
        const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
        localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));

        // Integración CAPA Automático (Task 2.2)
        if (inspection.observations && inspection.observations.length > 0) {
          const currentCapas = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
          const newCapas = inspection.observations.map((obs: any, idx: number) => ({
            id: `CAPA-${Date.now()}-${idx}`,
            title: `Hallazgo Inspección: ${obs.category}`,
            description: `Desvío en ${obs.category}: ${obs.description}. Origen: Inspección en ${inspection.name}.`,
            capaType: 'corrective',
            source: 'inspection',
            priority: obs.severity === 'Crítica' ? 'critical' : obs.severity === 'Moderada' ? 'high' : 'medium',
            originDate: new Date().toISOString().split('T')[0],
            dueDate: obs.deadline || '',
            responsible: obs.assignee || '',
            team: [],
            relatedProcess: inspection.name,
            problemStatement: obs.description,
            rootCauseMethod: '5why',
            rootCauseAnalysis: '',
            immediateActions: [],
            correctiveActions: [],
            controlType: '',
            effectivenessCriteria: '',
            status: 'open',
            createdAt: new Date().toISOString(),
            openedAt: new Date().toISOString(),
            completedAt: '',
            closedAt: '',
            observations: ''
          }));

          const updatedCapas = [...newCapas, ...currentCapas];
          localStorage.setItem('ehs_capa_db', JSON.stringify(updatedCapas));
          toast.success(`${newCapas.length} CAPA(s) generada(s) a partir de hallazgos.`);
          // Dispatch an event so CAPAManager updates if open in another tab
          window.dispatchEvent(new Event('storage'));
        }
      }
    }

    // Load Risk Assessment (IPER)
    const iper = localStorage.getItem('risk_assessment');
    if (iper) {
      setRiskAssessment(JSON.parse(iper));
    }

    // Load professional data
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    if (savedSigData) {
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || 'Profesional',
        license: data.license || '',
        signature: signature
      });
    }
  }, []);

  const handlePrint = () => requirePro(() => window.print());

  if (!inspectionData) {
    return (
      <div className="container flex flex-col items-center justify-center h-[80vh] text-center">
                <AlertCircle size={48} color="#ef4444" className="mb-6" />
                <h1 className="text-[1.5rem] font-[800] mb-[0.5rem]">Datos no encontrados</h1>
                <p className="text-[var(--color-text-muted)] mb-[2rem] max-w-[400px]">
                    No se ha podido recuperar la información del relevamiento actual. 
                    Por favor, regrese a la lista de control e intente nuevamente.
                </p>
                <></>
            </div>);

  }

  const findings = inspectionData.observations || [];
  const findingCount = findings.length;

  return (
    <div className="container pb-[5rem] max-w-[1000px]">
            {/* Action Bar (No Print) */}
            <div className="no-print flex justify-space-between items-center mb-[2rem]">
                <div className="flex items-center gap-4">
                    <></>
                    <div>
                        <h1 className="m-[0] text-[1.5rem] font-[800]">Informe de Inspección</h1>
                        <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">ID #{inspectionData.id?.toString().slice(-6)}</p>
                    </div>
                </div>
                <div className="flex gap-[0.8rem]">
                    <button onClick={() => requirePro(() => setShowShare(true))} className="btn-outline flex items-center gap-[0.5rem] p-[0.8rem_1.2rem] rounded-[12px]">
                        <Share2 size={18} /> <span>Compartir</span>
                    </button>
                    <button onClick={handlePrint} className="btn-primary flex items-center gap-[0.5rem] p-[0.8rem_1.5rem] rounded-[12px] w-[auto]">
                        <Printer size={18} /> <span>PDF / Imprimir</span>
                    </button>
                </div>
            </div>

            <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        title="Informe de Inspección"
        text={`📋 Informe de Inspección\n🏗️ Obra: ${inspectionData.name}\n📅 Fecha: ${new Date(inspectionData.date).toLocaleDateString('es-AR')}\n⚠️ Hallazgos: ${findingCount}\n\nGenerado con Asistente H&S`}
        elementIdToPrint="pdf-content" />
      

            {/* PRINTABLE AREA */}
            <div id="pdf-content" className="bg-white text-black p-4 md:p-12 shadow-sm border border-slate-200 rounded-2xl print-area print:mb-0 print:border-none print:shadow-none"
      style={{ borderTop: findingCount > 0 ? '12px solid #dc2626' : '12px solid #2563eb' }}>
                {/* Header Tripartito HSE */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p style={{ color: findingCount > 0 ? '#dc2626' : '#2563eb' }} className="m-[0] font-[900] text-[0.8rem] uppercase">
                            {findingCount > 0 ? `⚠ ${findingCount} HALLAZGO${findingCount > 1 ? 'S' : ''} DETECTADO${findingCount > 1 ? 'S' : ''}` : '✓ SIN HALLAZGOS CRÍTICOS'}
                        </p>
                    </div>
                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[1.9rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">INFORME DE INSPECCIÓN</h1>
                        <div style={{ background: findingCount > 0 ? '#dc2626' : '#2563eb' }} className="mt-[0.3rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                            PROTOCOLO DE RELEVAMIENTO GENERAL DE RIESGOS
                        </div>
                    </div>
                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                    </div>
                </div>

                {/* Grilla de datos */}
                <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] overflow-[hidden]">
                    <div className="grid grid-template-columns-[2fr_1fr_1fr] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0]">
                        <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={12} /> REFERENCIA / OBRA</span>
                            <div className="font-[800] text-[0.95rem] text-[#0f172a] mt-[0.2rem]">{inspectionData.name || '-'}</div>
                        </div>
                        <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{new Date(inspectionData.date).toLocaleDateString('es-AR')}</div>
                        </div>
                        <div className="p-[0.75rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> UBICACIÓN</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{inspectionData.location || '-'}</div>
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1fr] bg-[#ffffff]">
                        <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> PROFESIONAL ACTUANTE</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{professional?.name || 'No especificado'}</div>
                        </div>
                        <div className="p-[0.75rem_1rem] flex items-center gap-[1rem]">
                            <div style={{ background: findingCount > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${findingCount > 0 ? '#fca5a5' : '#86efac'}` }} className="p-[0.4rem_1rem] rounded-[8px]">
                                <span className="text-[0.65rem] font-[800] text-[#64748b] uppercase">HALLAZGOS</span>
                                <div style={{ color: findingCount > 0 ? '#dc2626' : '#16a34a' }} className="font-[900] text-[1.5rem] line-height-[1]">{findingCount}</div>
                            </div>
                            <div className="p-[0.4rem_0.8rem] bg-[#eff6ff] border-[1px_solid_#bfdbfe] rounded-[8px] font-[900] text-[0.65rem] text-[#2563eb]">FINALIZADO</div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="card p-[1.2rem] text-center bg-[#f8fafc] border-[1px_solid_#e2e8f0]">
                        <div className="text-[1.5rem] font-[900] text-[#172B4D]">{findingCount}</div>
                        <div className="text-[0.75rem] font-[800] text-[#6B778C] uppercase letter-spacing-[0.5px]">Hallazgos</div>
                    </div>
                    <div className="card p-[1.2rem] text-center bg-[#f8fafc] border-[1px_solid_#e2e8f0]">
                        <div className="text-[1.5rem] font-[900] text-[#172B4D]">
                            {(() => {
                const categories = [
                { items: ['e1', 'e2'] },
                { items: ['L1', 'L2'] },
                { items: ['p1', 'p2'] },
                { items: ['o1', 'o2'] },
                { items: ['s1', 's2'] }];

                const allItems = categories.flatMap((c) => c.items);
                const total = allItems.length;
                const okCount = allItems.filter((id) => inspectionData.responses?.[id] === 'ok').length;
                return Math.round(okCount / total * 100) || 0;
              })()}%
                        </div>
                        <div className="text-[0.75rem] font-[800] text-[#6B778C] uppercase letter-spacing-[0.5px]">Cumplimiento</div>
                    </div>
                    <div className="card md:col-span-2 p-[1.2rem] bg-[#f8fafc] border-[1px_solid_#e2e8f0]">
                        <div className="text-[0.85rem] font-[800] text-[#6B778C] mb-[0.3rem]">PROFESIONAL ACTUANTE</div>
                        <div className="text-[1.1rem] text-[var(--color-primary)] font-[900]">{professional?.name || 'No especificado'}</div>
                        {professional?.license && <div className="text-[0.7rem] font-[600] text-[#6B778C]">MATRÍCULA: {professional.license}</div>}
                    </div>
                </div>

                {/* Header de sección - Resumen */}
                <div className="bg-[#1e293b] p-[0.6rem_1rem] rounded-[6px_6px_0_0] mb-[0] flex items-center gap-[0.5rem] mt-[0.5rem]">
                    <ShieldCheck size={15} color="#86efac" />
                    <span className="font-[900] text-[0.78rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">RESUMEN DE INSPECCIÓN POR ÁREAS</span>
                </div>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[0.8rem] mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[0_0_6px_6px] p-[0.8rem] bg-[#f8fafc]">
                    {[
          { name: 'Extintores y Protección', id: 'extintores', items: ['e1', 'e2'] },
          { name: 'Riesgo Eléctrico', id: 'electrico', items: ['L1', 'L2'] },
          { name: 'EPP', id: 'epp', items: ['p1', 'p2'] },
          { name: 'Orden y Limpieza', id: 'orden', items: ['o1', 'o2'] },
          { name: 'Señalización y Evacuación', id: 'senyalizacion', items: ['s1', 's2'] }].
          map((cat) => {
            const total = cat.items.length;
            const ok = cat.items.filter((id) => inspectionData.responses?.[id] === 'ok').length;
            // For fail, we check responses OR if there's an observation for this item
            const fail = cat.items.filter((id) => {
              const isResponseFail = inspectionData.responses?.[id] === 'fail';
              const hasObservation = inspectionData.observations?.some((o) => o.itemId === id);
              return isResponseFail || hasObservation;
            }).length;

            const percent = Math.round(ok / total * 100) || 0;

            return (
              <div key={cat.id} className="p-[1.2rem] bg-[#f8fafc] rounded-[16px] border-[1px_solid_#e2e8f0] page-break-inside-[avoid]">
                                <div className="text-[0.85rem] font-[900] text-[#172B4D] mb-[0.8rem]">{cat.name}</div>
                                <div className="flex items-center gap-[0.8rem] mb-[0.5rem] page-break-inside-[avoid]">
                                    <div className="flex-[1] h-[8px] bg-[#e2e8f0] rounded-[4px] overflow-[hidden]">
                                        <div style={{ width: `${percent}%`, background: percent === 100 ? '#00875A' : '#3b82f6' }} className="h-[100%] transition-[width_0.5s_ease]"></div>
                                    </div>
                                    <span className="text-[0.8rem] font-[900] text-[#172B4D]">{percent}%</span>
                                </div>
                                <div className="text-[0.75rem] text-[#6B778C] font-[800] flex justify-space-between">
                                    <span className="text-[#00875A]">✓ {ok} OK</span>
                                    <span style={{ color: fail > 0 ? '#ef4444' : '#6B778C', fontWeight: fail > 0 ? 900 : 800 }}>
                                        {fail > 0 ? '✕' : ''} {fail} Fallos
                                    </span>
                                </div>
                            </div>);

          })}
                </div>

                {/* IPER - Header oscuro */}
                {riskAssessment && riskAssessment.length > 0 &&
        <div className="page-break-inside-[avoid] mb-[1.5rem] border-[1px_solid_#fde68a] rounded-[6px] overflow-[hidden]">
                        <div className="bg-[#1e293b] p-[0.6rem_1rem] flex items-center gap-[0.5rem]">
                            <ShieldAlert size={15} color="#fbbf24" />
                            <span className="font-[900] text-[0.78rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">EVALUACIÓN DE RIESGOS PREVIA (IPER)</span>
                        </div>
                        <div className="overflow-x-[auto]">
                            <table className="w-[100%] border-collapse-[collapse] text-[0.83rem]">
                                <thead>
                                    <tr className="bg-[#f8fafc] border-bottom-[2px_solid_#e2e8f0]">
                                        <th className="p-[1rem] text-left font-[900]">Peligro Identificado</th>
                                        <th className="p-[1rem] text-left font-[900]">Riesgo Asociado</th>
                                        <th className="p-[1rem] text-center font-[900]">Probabilidad / Severidad</th>
                                        <th className="p-[1rem] text-center font-[900]">Nivel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riskAssessment.map((risk, idx) =>
                <tr key={idx} className="border-bottom-[1px_solid_#f1f5f9] page-break-inside-[avoid]">
                                            <td className="p-[1rem] font-[600]">{risk.danger}</td>
                                            <td className="p-[1rem]">{risk.risk}</td>
                                            <td className="p-[1rem] text-center">{risk.probability} x {risk.severity}</td>
                                            <td className="p-[1rem] text-center">
                                                <span style={{




                      background: risk.score > 15 ? '#fee2e2' : risk.score > 8 ? '#ffedd5' : '#dcfce7',
                      color: risk.score > 15 ? '#b91c1c' : risk.score > 8 ? '#9a3412' : '#15803d'
                    }} className="text-[0.7rem] font-[900] p-[0.3rem_0.6rem] rounded-[8px]">
                                                    {risk.level || (risk.score > 15 ? 'ALTO' : risk.score > 8 ? 'MEDIO' : 'BAJO')}
                                                </span>
                                            </td>
                                        </tr>
                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
        }

                {/* Hallazgos - Header oscuro */}
                <div className="bg-[#1e293b] p-[0.6rem_1rem] rounded-[6px_6px_0_0] flex items-center gap-[0.5rem] mt-[0.5rem]">
                    <TriangleAlert size={15} color="#fca5a5" />
                    <span className="font-[900] text-[0.78rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">DETALLE DE HALLAZGOS Y DESVÍOS</span>
                    {findingCount > 0 && <span className="ml-[auto] bg-[#dc2626] text-[#fff] p-[0.1rem_0.5rem] rounded-[10px] text-[0.65rem] font-[900]">{findingCount} HALLAZGO{findingCount > 1 ? 'S' : ''}</span>}
                </div>

                {findings.length > 0 ?
        <div className="overflow-x-[auto] mb-[1.5rem] border-[1px_solid_#fca5a5] rounded-[0_0_6px_6px]">
                        <table className="w-[100%] border-collapse-[collapse] text-[0.9rem]">
                            <thead>
                                <tr className="bg-[#f8fafc] border-bottom-[2px_solid_#e2e8f0]">
                                    <th className="p-[1rem] text-left font-[900] w-[40px]">#</th>
                                    <th className="p-[1rem] text-left font-[900]">Descripción de la Anomalía</th>
                                    <th className="p-[1rem] text-center font-[900]">Riesgo</th>
                                    <th className="p-[1rem] text-left font-[900]">Acción Correctiva / Responsable</th>
                                    <th className="p-[1rem] text-center font-[900]">Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((obs, i) =>
              <tr key={i} className="border-bottom-[1px_solid_#f1f5f9] page-break-inside-[avoid]">
                                        <td className="p-[1rem] font-[800] text-[#6B778C]">{i + 1}</td>
                                        <td className="p-[1rem]">
                                            <div className="font-[800] text-[#172B4D] mb-[0.2rem]">{obs.category}</div>
                                            <div className="text-[0.85rem] text-[#444]">{obs.description}</div>
                                        </td>
                                        <td className="p-[1rem] text-center">
                                            <span style={{




                    background: obs.severity === 'Crítica' ? '#fee2e2' : obs.severity === 'Moderada' ? '#ffedd5' : '#dcfce7',
                    color: obs.severity === 'Crítica' ? '#dc2626' : obs.severity === 'Moderada' ? '#9a3412' : '#15803d'

                  }} className="text-[0.7rem] font-[900] p-[0.3rem_0.6rem] rounded-[8px] border-[1px_solid_currentColor]">
                                                {obs.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-[1rem]">
                                            <div className="text-[0.85rem]">
                                                <strong>Plazo:</strong> {obs.deadline}<br />
                                                <strong>Responsable:</strong> {obs.assignee || 'A designar'}
                                            </div>
                                        </td>
                                        <td className="p-[1rem] text-center">
                                            <div className="flex gap-[4px] flex-wrap justify-center">
                                                {(obs.photos || (obs.photo ? [obs.photo] : [])).map((img, idx) =>
                    <img
                      key={idx}
                      src={img}
                      alt="Hallazgo"

                      onClick={() => window.open(img, '_blank')} className="w-[45px] h-[45px] object-fit-[cover] rounded-[6px] border-[1px_solid_#e2e8f0] cursor-pointer" />

                    )}
                                                {!(obs.photos?.length || obs.photo) && <span className="text-[#cbd5e1] text-[0.7rem]">Sin fotos</span>}
                                            </div>
                                        </td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div> :

        <div className="card p-[2.5rem] text-center bg-[#f0fdf4] border-[1px_solid_#bbf7d0] text-[#166534] mb-[3rem]">
                        <CheckCircle2 size={40} className="mb-[0.8rem] opacity-[0.8]" />
                        <p className="m-[0] text-[1.2rem] font-[900]">Relevamiento sin desvíos críticos</p>
                        <p className="m-[0.5rem_0_0_0] text-[0.95rem] font-[600]">Las condiciones observadas se ajustan a las normativas de seguridad vigentes.</p>
                    </div>
        }

                {/* Registro fotográfico */}
                {inspectionData.photos && inspectionData.photos.length > 0 &&
        <div className="mt-[1.5rem] page-break-before-[auto] border-[1px_solid_#cbd5e1] rounded-[6px] overflow-[hidden]">
                        <div className="bg-[#334155] p-[0.6rem_1rem] flex items-center gap-[0.5rem]">
                            <Camera size={15} color="#fff" />
                            <span className="font-[900] text-[0.78rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">REGISTRO FOTOGRÁFICO GENERAL DE LA VISITA</span>
                        </div>
                        <div className="grid grid-template-columns-[repeat(2,_1fr)] gap-[1.2rem] p-[1rem] bg-[#f8fafc]">
                            {inspectionData.photos.map((photo, index) =>
            <div key={index} className="border-[1px_solid_#e2e8f0] rounded-[20px] overflow-[hidden] p-[0.8rem] bg-[#f8fafc] page-break-inside-[avoid] box-shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                                    <img src={photo} alt={`Evidencia ${index + 1}`} className="w-[100%] h-[260px] object-fit-[cover] rounded-[12px] mb-[0.8rem]" />
                                    <p className="m-[0] text-[0.8rem] font-[800] text-center text-[#6B778C] uppercase letter-spacing-[1px]">Evidencia Fotográfica #{index + 1}</p>
                                </div>
            )}
                        </div>
                    </div>
        }

                {/* Firmas Enterprise */}
                <PdfSignatures
          data={{
            ...inspectionData,
            professionalSignature: professional?.signature,
            professionalName: professional?.name,
            professionalLicense: professional?.license
          }}
          box1={showSignatures.operator ? {
            title: 'OPERADOR / RESPONSABLE',
            subtitle: 'Firma y Aclaración',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box3={showSignatures.supervisor ? {
            title: 'SUPERVISOR / JEFE DE OBRA',
            subtitle: 'Validación de Auditoría',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box2={showSignatures.professional ? undefined : null} />
        
                <PdfBrandingFooter />
            </div>
        </div>);

}