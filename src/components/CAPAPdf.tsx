import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, Clipboard, User, Calendar, RefreshCw } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function CAPAPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura de firma desde personalData o del dato en sí
  let actSignature = data.signature || null;
  let actName = data.professionalName || data.leadAuditor || null;
  let actLic = data.license || null;
  let actStamp = data.stamp || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');

      if (lsStamp) {actSignature = JSON.parse(lsStamp).signature;} else
      if (legacySig) {actSignature = legacySig;}

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const isCritical = data.priority === 'critical';

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
        style={{





          borderTop: isCritical ? '12px solid #dc2626' : '12px solid #2563eb'
        }}>
        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important; 
                            width: 100% !important; max-width: none !important; 
                            border-top: ${isCritical ? '12px solid #dc2626' : '12px solid #2563eb'} !important; border-radius: 0 !important; 
                            min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Sequence */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.8rem] w-[100%]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p style={{ color: isCritical ? '#dc2626' : '#2563eb' }} className="m-[0] font-[900] text-[0.8rem] uppercase">Doc. Mejora Continua</p>
                    </div>

                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[2.4rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">CAPA</h1>
                        <div style={{ background: isCritical ? '#dc2626' : '#3b82f6' }} className="mt-[0.3rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                            ACCIÓN CORRECTIVA / PREVENTIVA
                        </div>
                    </div>

                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />

            
                    </div>
                </div>

                {/* Título de la Acción & ID */}
                <div style={{ border: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1' }} className="rounded-[6px] mb-[1.5rem] w-[100%] overflow-[hidden]">
                    <div style={{ background: isCritical ? '#fef2f2' : '#f8fafc', borderBottom: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1' }} className="p-[1rem] flex justify-space-between items-center">
                        <div>
                            <span style={{ color: isCritical ? '#dc2626' : '#3b82f6' }} className="text-[0.65rem] font-[800] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <RefreshCw size={14} /> IDENTIFICADOR ÚNICO DE ACCIÓN: #CAPA-{data.id?.slice(0, 8) || 'N/A'}
                            </span>
                            <div className="font-[900] text-[1.3rem] text-[#0f172a] mt-[0.4rem]">{data.title || data.description || 'Sin título'}</div>
                        </div>
                        <div className="text-right">
                            <span style={{ background: data.status === 'completed' ? '#dcfce7' : '#f1f5f9', color: data.status === 'completed' ? '#16a34a' : '#1e293b' }} className="p-[0.3rem_0.8rem] rounded-[6px] text-[0.75rem] font-[800] uppercase inline-block">
                                ESTADO: {data.status?.toUpperCase() || 'ABIERTO'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex bg-[#ffffff]">
                        <div className="flex-[1] p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><AlertTriangle size={12} /> ORIGEN / FUENTE</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.source || 'Auditoría / Inspección'}</div>
                        </div>
                        <div className="flex-[1] p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA APERTURA</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.date || '-'}</div>
                        </div>
                        <div className="flex-[1] p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1] bg-[#f8fafc]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Clock size={12} /> FECHA LÍMITE</span>
                            <div style={{ color: isCritical ? '#dc2626' : '#0f172a' }} className="font-[900] text-[0.9rem] mt-[0.2rem]">{data.dueDate || data.date || '-'}</div>
                        </div>
                        <div className="flex-[1] p-[0.8rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> RESPONSABLE ASIGNADO</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.responsible || 'No asignado'}</div>
                        </div>
                    </div>
                </div>

                {/* Análisis e Implementación */}
                <div className="grid grid-template-columns-[1.2fr_1fr] gap-[1rem] mb-[2rem]">
                    <div className="border-[1px_solid_#cbd5e1] p-[1.2rem] rounded-[6px] bg-[#ffffff]">
                        <span className="text-[0.7rem] font-[900] text-[#475569] block mb-[0.6rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.3rem] uppercase">1. DESCRIPCIÓN DEL HALLAZGO / DESVIACIÓN TÉCNICA</span>
                        <p className="m-[0] text-[0.85rem] text-[#1e293b] line-height-[1.6] white-space-[pre-wrap]">
                            {data.description || 'No se ingresó una descripción detallada del hallazgo.'}
                        </p>
                    </div>
                    <div className="border-[1px_solid_#cbd5e1] p-[1.2rem] rounded-[6px] bg-[#ffffff] flex flex-col">
                        <span className="text-[0.7rem] font-[900] text-[#475569] block mb-[0.6rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.3rem] uppercase">2. ACCIÓN DE TRATAMIENTO INMEDIATO</span>
                        <p className="m-[0] text-[0.85rem] text-[#1e293b] line-height-[1.6] white-space-[pre-wrap]">
                            {data.immediateAction || 'Se procedió al bloqueo preventivo e interrupción temporal de la actividad para contener la amenaza inminente asociada.'}
                        </p>
                    </div>
                </div>

                {/* Plan de Acción Definitivo */}
                <div className="mb-[2rem] bg-[#ecfdf5] border-[1px_solid_#a7f3d0] p-[1.2rem] rounded-[6px]">
                    <h3 className="m-[0_0_0.8rem_0] text-[0.85rem] font-[900] text-[#065f46] flex items-center gap-[0.5rem] uppercase">
                        <ShieldCheck size={18} /> 3. PLAN DE ACCIÓN DEFINITIVO (RESOLUCIÓN DE RAÍZ)
                    </h3>
                    <div className="text-[0.95rem] font-[700] text-[#064e3b] line-height-[1.6] white-space-[pre-wrap]">
                        {data.actionPlan || 'El plan definitivo no fue documentado al momento de la exportación del PDF.'}
                    </div>
                </div>

                {/* Firmas de Responsabilidad */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'RESPONSABLE / OPERADOR',
            subtitle: 'Firma de Conformidad',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'PROFESIONAL ACTUANTE',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: data.signature || actSignature || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'SUPERVISIÓN / CIERRE',
            subtitle: 'Aprobación y Cierre CAPA',
            signatureUrl: data.supervisorSignature || null,
            isProfessional: false
          } : null} />
        

                <PdfBrandingFooter />
            </div>
        </div>);

}