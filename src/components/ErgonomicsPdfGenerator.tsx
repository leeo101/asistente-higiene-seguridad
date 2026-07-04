import React from 'react';
import { Building2, MapPin, User, Briefcase, Activity, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

interface ErgonomicsPdfGeneratorProps {
  data: any;
  profile: any;
  signature: any;
  showSignatures: { operator: boolean; supervisor: boolean; professional: boolean; };
}

export default function ErgonomicsPdfGenerator({ data, profile, signature, showSignatures }: ErgonomicsPdfGeneratorProps) {
  if (!data) return null;

  return (
    <div id="pdf-content" className="report-print print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0 bg-[white] text-[#1e293b] p-[12mm_15mm] rounded-[8px] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)] min-h-[29.7cm] h-[auto] font-family-[Helvetica,_Arial,_sans-serif] text-[9pt]" style={{
        borderTop: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '12px solid #dc2626' : '12px solid #2563eb'
      }}>
        <style type="text/css" media="print">
            {`
                @page { size: A4 portrait; margin: 15mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                .report-print { 
                    box-shadow: none !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    border: none !important;
                    border-top: 12px solid ${data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#2563eb'} !important;
                }
                .company-logo { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            `}
        </style>
        {/* Header Tripartito HSE */}
        <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
            <div className="flex-[1] text-left">
                <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                <p style={{ color: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#2563eb' }} className="m-[0] font-[900] text-[0.8rem] uppercase">Doc. Ergonomía Laboral</p>
            </div>
            <div className="flex-[2] flex flex-col items-center justify-center text-center">
                <h1 className="m-[0] font-[900] text-[2.2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">ERGONOMÍA</h1>
                <div style={{ background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#3b82f6' }} className="mt-[0.3rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                    PROTOCOLO — RES. SRT N° 886/15
                </div>
            </div>
            <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
            </div>
        </div>

        {/* I – Datos del Establecimiento */}
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] overflow-[hidden]">
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-[0.6rem_1rem]">
                <span className="font-[900] text-[0.75rem] text-[#0f172a] uppercase letter-spacing-[0.04em]">I — DATOS DEL ESTABLECIMIENTO</span>
            </div>
            <div className="grid grid-template-columns-[2fr_1fr_1fr] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0]">
                <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={12} /> EMPRESA / RAZÓN SOCIAL</span>
                    <div className="font-[800] text-[0.95rem] text-[#0f172a] mt-[0.2rem]">{data.empresa || '-'}</div>
                </div>
                <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> SECTOR</span>
                    <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.sector || '-'}</div>
                </div>
                <div className="p-[0.75rem_1rem]">
                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Briefcase size={12} /> PUESTO DE TRABAJO</span>
                    <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.puesto || '-'}</div>
                </div>
            </div>
            <div className="grid grid-template-columns-[1fr_1fr] bg-[#ffffff]">
                <div className="p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">FECHA DE EVALUACIÓN</span>
                    <div className="font-[700] text-[0.9rem] mt-[0.2rem]">{data.fecha || new Date().toLocaleDateString('es-AR')}</div>
                </div>
                <div className="p-[0.75rem_1rem]">
                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> PROFESIONAL EVALUADOR</span>
                    <div className="font-[700] text-[0.9rem] mt-[0.2rem]">{profile?.name || '-'}</div>
                </div>
            </div>
        </div>

        {/* II – Factores de Riesgo */}
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] overflow-[hidden]">
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-[0.6rem_1rem]">
                <span className="font-[900] text-[0.75rem] text-[#0f172a] uppercase letter-spacing-[0.04em]">II — PLANILLA 1: IDENTIFICACIÓN DE FACTORES DE RIESGO ERGONÓMICO</span>
            </div>
            <div className="p-[1rem] grid grid-template-columns-[repeat(2,_1fr)] gap-[0.4rem] bg-[#ffffff]">
                {data.planilla1 && Object.entries(data.planilla1).map(([key, val]) =>
    <div key={key} style={{ background: val ? '#eff6ff' : '#f8fafc', border: val ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }} className="flex items-center gap-[0.6rem] p-[0.4rem_0.6rem] rounded-[6px]">
                        <div style={{ border: val ? '2px solid #2563eb' : '2px solid #cbd5e1', background: val ? '#2563eb' : 'transparent' }} className="w-[20px] h-[20px] rounded-[4px] flex items-center justify-center flex-shrink-[0]">
                            {val ? <span className="text-[#fff] text-[0.75rem] font-[900]">✓</span> : null}
                        </div>
                        <span style={{ fontWeight: val ? 700 : 600, color: val ? '#1e40af' : '#94a3b8' }} className="text-[0.78rem] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
    )}
            </div>
        </div>

        {/* III – Levantamiento de Cargas */}
        {data.planilla1?.levantamientoCarga &&
<div style={{ border: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '1.5px solid #fca5a5' : '1px solid #cbd5e1' }} className="rounded-[6px] mb-[1.5rem] overflow-[hidden]">
                <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-[0.6rem_1rem]">
                    <span className="font-[900] text-[0.75rem] text-[#0f172a] uppercase letter-spacing-[0.04em]">III — PLANILLA 2.A: EVALUACIÓN DE LEVANTAMIENTO DE CARGAS</span>
                </div>
                <div className="grid grid-template-columns-[1fr_1fr] bg-[#ffffff]">
                    <div className="p-[1rem] border-right-[1px_solid_#e2e8f0]">
                        <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Activity size={12} /> PESO EFECTIVO MANIPULADO</span>
                        <div className="font-[900] text-[1.4rem] text-[#0f172a] mt-[0.3rem]">{data.calculoLevantamiento?.peso || 0} <span className="text-[0.9rem] font-[700]">kg</span></div>
                    </div>
                    <div style={{ background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#fef2f2' : '#f0fdf4' }} className="p-[1rem]">
                        <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><AlertTriangle size={12} /> NIVEL DE RIESGO DETERMINADO</span>
                        <div className="mt-[0.3rem]">
                            <span style={{ background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#16a34a' }} className="p-[0.3rem_1rem] text-[#fff] rounded-[8px] font-[900] text-[1rem]">
                                {data.riesgo || 'Bajo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
}

        {/* IV – Recomendaciones */}
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] overflow-[hidden]">
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-[0.6rem_1rem]">
                <span className="font-[900] text-[0.75rem] text-[#0f172a] uppercase letter-spacing-[0.04em]">IV — RECOMENDACIONES DE ACCIÓN</span>
            </div>
            <div className="p-[1rem] min-h-[80px] text-[0.85rem] text-[#334155] font-[600] line-height-[1.6] bg-[#f8fafc] white-space-[pre-wrap]">
                {data.recomendaciones || 'No se registran recomendaciones específicas para este puesto de trabajo en el momento de la evaluación.'}
            </div>
        </div>

        {/* Firmas Enterprise */}
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="pt-[1.5rem] border-top-[2px_dashed_#cbd5e1] flex gap-[1rem] pb-[1rem] justify-end">
            {showSignatures.operator &&
                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-[1] max-w-[280px] border-[1px_solid_#e2e8f0] rounded-[6px] p-[0.8rem] flex flex-col items-center box-sizing-[border-box]">
                    <div className="h-[90px] w-[100%] flex items-end justify-center border-bottom-[1px_solid_#e2e8f0] pb-[0.25rem] mb-[0.5rem]">
                        {data.operatorSignature ? (
                            <img src={data.operatorSignature} alt="Firma Operador" className="max-h-[80px] object-contain" />
                        ) : null}
                    </div>
                    <p className="m-[0] font-[900] text-[0.7rem] text-[#1e293b]">OPERADOR / TRABAJADOR</p>
                    <p className="m-[2px_0_0] text-[0.6rem] text-[#64748b]">Toma de conocimiento</p>
                </div>
            }
            {showSignatures.supervisor &&
                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-[1] max-w-[280px] border-[1px_solid_#e2e8f0] rounded-[6px] p-[0.8rem] flex flex-col items-center box-sizing-[border-box]">
                    <div className="h-[90px] w-[100%] flex items-end justify-center border-bottom-[1px_solid_#e2e8f0] pb-[0.25rem] mb-[0.5rem]">
                        {data.supervisorSignature ? (
                            <img src={data.supervisorSignature} alt="Firma Supervisor" className="max-h-[80px] object-contain" />
                        ) : null}
                    </div>
                    <p className="m-[0] font-[900] text-[0.7rem] text-[#1e293b]">SUPERVISOR / EMPLEADOR</p>
                    <p className="m-[2px_0_0] text-[0.6rem] text-[#64748b]">Firma Autorizada</p>
                </div>
            }
            {showSignatures.professional &&
  <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-[1] max-w-[280px] border-[1px_solid_#bbf7d0] bg-[#f0fdf4] rounded-[6px] p-[0.8rem] flex flex-col items-center box-sizing-[border-box]">
                    <div className="h-[90px] w-[100%] flex items-end justify-center border-bottom-[1px_solid_#86efac] pb-[0.25rem] mb-[0.5rem]">
                        {signature?.signature ?
      <img src={signature.signature} alt="Firma Profesional" className="max-h-[80px] object-contain" /> :

      <span className="text-[0.6rem] text-[#86efac]"></span>
      }
                    </div>
                    <p className="m-[0] font-[900] text-[0.7rem] text-[#166534]">PROFESIONAL ACTUANTE</p>
                    <p className="m-[2px_0_0] text-[0.6rem] text-[#15803d] font-[600]">{profile?.name || 'Especialista H&S'}</p>
                    {profile?.license && <p className="m-[2px_0_0] text-[0.6rem] text-[#16a34a]">Mat: {profile.license}</p>}
                </div>
  }
        </div>

        <PdfBrandingFooter />
    </div>
  );
}
