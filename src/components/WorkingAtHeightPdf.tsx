import React from 'react';
import { Users, ShieldCheck, HeartPulse, LifeBuoy } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

const RISK_FACTORS_MAP = {
  weather: 'Condiciones climáticas adversas',
  height: 'Altura superior a 2 metros',
  electrical: 'Riesgo eléctrico cercano',
  unstable: 'Superficies inestables',
  load: 'Cargas suspendidas',
  confined: 'Espacios confinados',
  heat: 'Estrés térmico'
};

const EQUIPMENT_MAP = {
  harness: 'Arnés de Seguridad de cuerpo completo',
  lanyard: 'Cabo de vida simple/doble con amortiguador',
  helmet: 'Casco con barboquejo',
  carabiner: 'Mosquetones de seguridad con cierre automático',
  rope: 'Cuerda de seguridad / Línea de vida vertical',
  anchor: 'Punto de anclaje certificado',
  sling: 'Eslinga de anclaje de cinta'
};

export default function WorkingAtHeightPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  const sections = [
  { id: 'description', title: 'Descripción del Trabajo', icon: <Users size={18} />, value: data.workDescription },
  { id: 'department', title: 'Departamento / Área', icon: <ShieldCheck size={18} />, value: data.department },
  { id: 'medical', title: 'Aptitud Médica', icon: <HeartPulse size={18} />, value: data.medicalFitness ? 'Vigente' : 'No verificada' },
  { id: 'rescue', title: 'Plan de Rescate', icon: <LifeBuoy size={18} />, value: data.rescuePlan }];


  // Map risk factors and equipment if they are IDs
  const hazards = Array.isArray(data.riskFactors) ?
  data.riskFactors.map((h) => RISK_FACTORS_MAP[h as keyof typeof RISK_FACTORS_MAP] || h) :
  data.hazards || [];

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[12px] box-sizing-[border-box] m-[0_auto] font-family-[system-ui,_-apple-system,_sans-serif]">







        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 10mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border-top: 12px solid #2563eb !important;
                            border-radius: 0 !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                    `}
                </style>

                {/* Header - Mejorado visualmente */}
                <div className="gradient-header p-[1.5rem] rounded-[12px] mb-[1.5rem] flex justify-space-between items-start text-[#ffffff]">







          
                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                            <div className="bg-[rgba(255,255,255,0.2)] p-[8px] rounded-[8px] backdrop-filter-[blur(10px)]">




                
                                <ShieldCheck size={28} color="#38bdf8" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="m-[0] text-[20pt] font-[900] uppercase letter-spacing-[-0.5px] line-height-[1]">






                  
                                    PERMISO TRABAJO EN ALTURA
                                </h1>
                                <p className="m-[4px_0_0_0] text-[9pt] text-[#cbd5e1] font-[600] uppercase letter-spacing-[1px]">






                  
                                    SISTEMA DE GESTIÓN DE SEGURIDAD (RES. SRT 61/23)
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ml-[20px] flex-shrink-[0] text-right flex flex-col items-end gap-[0.4rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px] bg-[#ffffff] p-[8px] rounded-[8px] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)]" />










            
                        <div className="text-[0.55rem] font-[900] text-[#94a3b8] letter-spacing-[0.05em] uppercase">Doc. Controlado</div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[1rem] mb-[2rem]">




          
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">TRABAJADOR</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.workerName || 'N/A'}</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">UBICACIÓN / SECTOR</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.location}</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">FECHA</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{new Date(data.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">ALTURA ESTIMADA</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.height} metros</span>
                    </div>
                </div>

                {/* Core Safety Sections */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[2rem]">
                    {sections.map((section) =>
          <div key={section.id} className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[#ffffff] flex flex-col">
                            <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                                <div className="text-[#3b82f6]">{section.icon}</div>
                                <span className="font-[800] text-[9pt] text-[#334155] uppercase">{section.title}</span>
                            </div>
                            <div className="text-[10pt] text-[#475569] white-space-[pre-wrap] line-height-[1.5]">{section.value || 'No especificado'}</div>
                        </div>
          )}
                </div>

                {/* Hazards & Mitigation */}
                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px] overflow-[hidden]">
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.8rem_1rem] text-[#ffffff]">
                        <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px] flex items-center gap-[0.5rem]">
                            <ShieldCheck size={18} /> ANÁLISIS DE RIESGOS Y EPP REQUERIDO
                        </h3>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] p-[1.2rem] bg-[#f8fafc]">
                        <div>
                            <span className="text-[8pt] font-[800] block text-[#64748b] mb-[0.5rem] uppercase">RIESGOS DETECTADOS</span>
                            <div className="flex flex-wrap gap-[8px]">
                                {hazards.length > 0 ? hazards.map((h: string, i: number) =>
                <span key={i} className="bg-[#fee2e2] border-[1px_solid_#fca5a5] text-[#b91c1c] p-[4px_10px] rounded-[6px] text-[8.5pt] font-[700]">{h}</span>
                ) : <span className="text-[9pt] text-[#64748b] font-[600]">Trabajo en altura estándar.</span>}
                            </div>
                        </div>
                        <div>
                            <span className="text-[8pt] font-[800] block text-[#64748b] mb-[0.5rem] uppercase">EQUIPOS DE PROTECCIÓN (EPP)</span>
                            <div className="grid grid-template-columns-[1fr] gap-[8px]">
                                {['harness', 'lanyard', 'helmet', 'lifeline'].map((key) => {
                  const hasIt = data.ppe && data.ppe[key];
                  const labels = { harness: 'Arnés de Seguridad', lanyard: 'Cola de Amarre', helmet: 'Casco con Barbijo', lifeline: 'Línea de Vida' };
                  return (
                    <div key={key} style={{ background: hasIt ? '#f0fdf4' : '#ffffff', border: `1px solid ${hasIt ? '#86efac' : '#e2e8f0'}` }} className="flex items-center gap-[0.6rem] p-[4px_8px] rounded-[6px]">
                                            <div style={{ border: `2px solid ${hasIt ? '#16a34a' : '#cbd5e1'}`, background: hasIt ? '#16a34a' : '#fff' }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center">
                                                {hasIt && <span className="text-[#fff] text-[12px] line-height-[1]">✓</span>}
                                            </div>
                                            <span style={{ fontWeight: hasIt ? 700 : 500, color: hasIt ? '#166534' : '#64748b' }} className="text-[9pt]">{labels[key as keyof typeof labels]}</span>
                                        </div>);

                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'OPERADOR / TRABAJADOR',
            subtitle: (data.workerName || 'Firma del Operador').toUpperCase(),
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'PROFESIONAL H&S',
            subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: data.professionalSignature || null,
            stampUrl: data.professionalStamp || null,
            isProfessional: true,
            license: data.professionalLicense || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'SUPERVISOR / AUTORIZANTE',
            subtitle: (data.supervisor || 'Firma del Supervisor').toUpperCase(),
            signatureUrl: data.supervisorSignature || data.signature || null,
            isProfessional: false
          } : null} />
        

                <PdfBrandingFooter />
            </div>
        </div>);

}