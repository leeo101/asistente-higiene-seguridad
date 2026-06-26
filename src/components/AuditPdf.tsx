import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, User, Calendar, MapPin, ShieldCheck, Flag } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function AuditPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura de firma desde personalData o del dato en sí
  let actSignature = data.signature || null;
  let actName = data.professionalName || data.auditor || data.leadAuditor || null;
  let actLic = data.license || null;
  let actStamp = data.professionalStamp || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature || !actStamp) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!actSignature) actSignature = parsed.signature;
        if (!actStamp) actStamp = parsed.stamp;
      } else if (legacySig && !actSignature) {
        actSignature = legacySig;
      }

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif] border-top-[12px_solid_#2563eb]">








        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important; 
                            width: 100% !important; max-width: none !important; 
                            border-top: 12px solid #2563eb !important; border-radius: 0 !important; 
                            min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Sequence */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.8rem] w-[100%]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p className="m-[0] font-[900] text-[0.8rem] uppercase text-[#2563eb]">Doc. Auditoría Interna</p>
                    </div>

                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[2.4rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">AUDIT</h1>
                        <div className="mt-[0.3rem] bg-[#3b82f6] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                            REPORTE DE AUDITORÍA EHS
                        </div>
                    </div>

                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />

            
                    </div>
                </div>

                {/* Titulo y Datos Generales de la Auditoría */}
                <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] w-[100%] overflow-[hidden]">
                    <div className="p-[1rem] bg-[#f8fafc] border-bottom-[1px_solid_#cbd5e1]">
                        <span className="text-[0.65rem] font-[800] text-[#3b82f6] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                            <Flag size={14} /> ASPECTO EVALUADO (TÍTULO DE AUDITORÍA)
                        </span>
                        <div className="font-[900] text-[1.3rem] text-[#0f172a] mt-[0.4rem]">{data.auditTitle || data.title || 'Auditoría General'}</div>
                    </div>
                    
                    <div className="flex bg-[#ffffff]">
                        <div className="flex-[1] p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.date || data.scheduledDate || '-'}</div>
                        </div>
                        <div className="flex-[1] p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> ÁREA / LOCACIÓN</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.location || '-'}</div>
                        </div>
                        <div className="flex-[1] p-[0.8rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> AUDITOR LÍDER</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{actName || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Alcance y Metodología */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[2rem]">
                    <div className="border-[1px_solid_#cbd5e1] p-[1rem] rounded-[6px] bg-[#ffffff]">
                        <span className="text-[0.65rem] font-[800] text-[#475569] block mb-[0.5rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.3rem]">OBJETIVO Y ALCANCE</span>
                        <p className="m-[0] text-[0.8rem] text-[#334155] line-height-[1.5]">{data.scope || 'Verificar el cumplimiento de los procedimientos internos de EHS y la normativa legal vigente aplicable al sector y tareas desarrolladas.'} </p>
                    </div>
                    <div className="border-[1px_solid_#cbd5e1] p-[1rem] rounded-[6px] bg-[#ffffff]">
                        <span className="text-[0.65rem] font-[800] text-[#475569] block mb-[0.5rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.3rem]">METODOLOGÍA DE AUDITORÍA</span>
                        <p className="m-[0] text-[0.8rem] text-[#334155] line-height-[1.5]">Entrevistas al personal, observación técnica directa en campo y revisión cruzada de registros documentales (SGSySO).</p>
                    </div>
                </div>

                {/* Resumen Cuantitativo / Cualitativo */}
                <div className="mb-[2rem]">
                    <h3 className="text-[0.85rem] font-[800] text-[#0f172a] mb-[0.8rem] uppercase flex items-center gap-[0.4rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.3rem]">
                        <ClipboardCheck size={16} color="#3b82f6" />
                        DESARROLLO Y RESULTADOS DEL RELEVAMIENTO
                    </h3>
                    
                    <div className="grid grid-template-columns-[1.8fr_1fr] gap-[1.5rem] items-stretch">
                        <div className="border-[1px_solid_#cbd5e1] p-[1rem] rounded-[6px] bg-[#ffffff]">
                            <h4 className="m-[0_0_0.5rem_0] text-[0.75rem] font-[800] text-[#475569] uppercase">HALLAZGOS Y DESVIACIONES DETECTADAS</h4>
                            <p className="m-[0] text-[0.85rem] text-[#1e293b] line-height-[1.6] white-space-[pre-wrap]">
                                {data.findings || '✓ Se constató el cumplimiento general de las normativas de seguridad.\n✓ Uso de EPP conforme al nivel de riesgo.\n✓ No se detectaron desvíos críticos que supongan peligro inminente.'}
                            </p>
                        </div>
                        
                        <div className="bg-[#f8fafc] p-[1.2rem] rounded-[6px] border-[1px_solid_#cbd5e1] flex flex-col gap-[0.8rem]">
                            <div className="flex justify-space-between items-center border-bottom-[1px_dashed_#cbd5e1] pb-[0.5rem]">
                                <span className="font-[700] text-[0.75rem] text-[#475569]">CONFORMIDADES</span>
                                <span className="text-[#ffffff] bg-[#10b981] p-[0.1rem_0.6rem] rounded-[12px] font-[900] text-[0.8rem]">{data.conformities || '10'}</span>
                            </div>
                            <div className="flex justify-space-between items-center border-bottom-[1px_dashed_#cbd5e1] pb-[0.5rem]">
                                <span className="font-[700] text-[0.75rem] text-[#475569]">NO CONFORMIDADES</span>
                                <span className="text-[#ffffff] bg-[#ef4444] p-[0.1rem_0.6rem] rounded-[12px] font-[900] text-[0.8rem]">{data.nonConformities || '0'}</span>
                            </div>
                            <div className="flex justify-space-between items-center">
                                <span className="font-[700] text-[0.75rem] text-[#475569]">OPORT. DE MEJORA</span>
                                <span className="text-[#ffffff] bg-[#3b82f6] p-[0.1rem_0.6rem] rounded-[12px] font-[900] text-[0.8rem]">{data.opportunities || '2'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conclusion Final */}
                <div className="border-left-[4px_solid_#3b82f6] bg-[#eff6ff] p-[1rem_1.5rem] rounded-[0_6px_6px_0] mb-[2rem]">
                    <span className="text-[0.7rem] font-[900] text-[#1e3a8a] block mb-[0.4rem] uppercase">CONCLUSIÓN FINAL DEL AUDITOR</span>
                    <p className="m-[0] text-[0.9rem] text-[#1e3a8a] font-style-[italic] font-[600] line-height-[1.5]">
                        {data.conclusion || 'La auditoría concluye que el sistema logístico y de producción mantiene condiciones eficaces de seguridad, con requerimientos de ajustes menores en el seguimiento de capacitaciones planificadas.'}
                    </p>
                </div>

                {/* Firmas de Responsabilidad */}
                <PdfSignatures
          data={data}
          box1={!data.showSignatures || data.showSignatures.operator ? {
            title: 'PERSONA AUDITADA / RESPONSABLE',
            subtitle: 'Firma de Conformidad',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={!data.showSignatures || data.showSignatures.professional ? {
            title: 'AUDITOR LÍDER / ESPECIALISTA',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature,
            stampUrl: actStamp,
            isProfessional: true,
            license: actLic
          } : null}
          box3={!data.showSignatures || data.showSignatures.supervisor ? {
            title: 'SUPERVISIÓN / CIERRE',
            subtitle: 'Aprobación de Informe',
            signatureUrl: data.supervisorSignature || null,
            isProfessional: false
          } : null} />
        

                <PdfBrandingFooter />
            </div>
        </div>);

}