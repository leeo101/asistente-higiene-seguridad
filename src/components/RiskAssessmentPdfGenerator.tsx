import React from 'react';
import { ShieldAlert, Activity, AlertCircle, Calendar, MapPin, Briefcase } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function RiskAssessmentPdfGenerator({ assessmentData }: {assessmentData: any;}): React.ReactElement | null {
  if (!assessmentData) return null;

  const data = assessmentData;
  const score = data.score || data.probability * data.severity || 0;

  // Risk Level details for the report
  let riskInfo = {
    label: data.riskLabel || 'Bajo',
    color: '#10b981',
    bg: '#d1fae5',
    action: 'Riesgo aceptable. No requiere medidas adicionales.'
  };

  if (score > 6) {
    riskInfo = { label: 'Crítico', color: '#ef4444', action: 'PELIGRO INMINENTE. Detener la tarea hasta mitigar el riesgo.', bg: '#fee2e2' };
  } else if (score > 4) {
    riskInfo = { label: 'Alto', color: '#f97316', action: 'Riesgo importante. Requiere medidas de ingeniería inmediatas.', bg: '#ffedd5' };
  } else if (score > 2) {
    riskInfo = { label: 'Moderado', color: '#f59e0b', action: 'Requiere seguimiento. Implementar medidas de control administrativas.', bg: '#fef3c7' };
  }

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">







        
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
                            border: none !important;
                            border-radius: 0 !important; 
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header Section */}
                <div className="flex justify-space-between items-center border-bottom-[3px_solid_#1e293b] pb-[1.5rem] mb-[2rem]">
                    <div className="flex items-center gap-[1rem]">
                        <div>
                            <p className="m-[0] font-[900] text-[0.75rem] text-[#64748b] uppercase letter-spacing-[0.05em]">Sistema de Gestión HYS</p>
                            <h1 className="m-[0] font-[900] text-[1.5rem] text-[#1e293b] uppercase">Evaluación de Riesgo</h1>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px]" />






            
                        <div className="text-right">
                            <div className="font-[900] text-[1.2rem] text-[#10b981]">IPER</div>
                            <p className="m-[0] text-[0.7rem] text-[#64748b] font-[600]">METODOLOGÍA BINARIA</p>
                        </div>
                    </div>
                </div>

                {/* Project Context */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1.5rem] mb-[2.5rem]">
                    <div className="p-[1rem] bg-[#f8fafc] rounded-[12px] border-[1px_solid_#e2e8f0]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#64748b]">
                            <Briefcase size={14} />
                            <span className="text-[0.65rem] font-[900] uppercase">Tarea / Actividad</span>
                        </div>
                        <div className="font-[800] text-[1.1rem] text-[#1e293b]">{data.name || 'Sin nombre'}</div>
                    </div>

                    <div className="p-[1rem] bg-[#f8fafc] rounded-[12px] border-[1px_solid_#e2e8f0]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#64748b]">
                            <MapPin size={14} />
                            <span className="text-[0.65rem] font-[900] uppercase">Ubicación / Área</span>
                        </div>
                        <div className="font-[800] text-[1.1rem] text-[#1e293b]">{data.location || 'No especificada'}</div>
                    </div>

                    <div className="p-[1rem] bg-[#f8fafc] rounded-[12px] border-[1px_solid_#e2e8f0]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#64748b]">
                            <Calendar size={14} />
                            <span className="text-[0.65rem] font-[900] uppercase">Fecha de Evaluación</span>
                        </div>
                        <div className="font-[800] text-[1.1rem] text-[#1e293b]">{data.date ? new Date(data.date).toLocaleDateString('es-AR') : 'N/A'}</div>
                    </div>
                </div>

                {/* Risk Analysis Section */}
                <div className="mb-[2.5rem]">
                    <h3 className="m-[0_0_1.5rem_0] flex items-center gap-[0.8rem] text-[#1e293b] font-[900] text-[1.1rem] uppercase">
                        <Activity size={20} color="#2563eb" /> Análisis de Matriz
                    </h3>

                    <div className="grid grid-template-columns-[1fr_1fr_1fr] gap-[1rem]">
                        <div className="text-center p-[1.5rem] border-[2px_solid_#e2e8f0] rounded-[16px]">
                            <div className="text-[0.7rem] font-[900] text-[#64748b] uppercase mb-[0.5rem]">Probabilidad</div>
                            <div className="text-[2.5rem] font-[900] text-[#2563eb]">{data.probability || 0}</div>
                        </div>
                        <div className="flex items-center justify-center text-[2rem] font-[300] text-[#64748b]">x</div>
                        <div className="text-center p-[1.5rem] border-[2px_solid_#e2e8f0] rounded-[16px]">
                            <div className="text-[0.7rem] font-[900] text-[#64748b] uppercase mb-[0.5rem]">Severidad</div>
                            <div className="text-[2.5rem] font-[900] text-[#ef4444]">{data.severity || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Result Card */}
                <div style={{


          background: riskInfo.bg,
          border: `2px solid ${riskInfo.color}30`


        }} className="p-[2.5rem] rounded-[24px] text-center mb-[2.5rem]">
                    <div style={{ color: riskInfo.color }} className="text-[0.8rem] font-[900] uppercase letter-spacing-[0.2em] mb-[1rem]">Resultado del Nivel de Riesgo</div>
                    <div style={{ color: riskInfo.color }} className="text-[3.5rem] font-[900] line-height-[1] mb-[0.5rem]">{score}</div>
                    <div style={{ color: riskInfo.color }} className="text-[1.5rem] font-[900] uppercase">{riskInfo.label}</div>
                </div>

                {/* Recommendation */}
                <div style={{ borderLeft: `8px solid ${riskInfo.color}` }} className="bg-[#f8fafc] p-[1.5rem] rounded-[0_16px_16px_0] mb-[4rem]">
                    <div className="flex gap-[1rem] items-start">
                        <AlertCircle size={24} color={riskInfo.color} />
                        <div>
                            <h4 style={{ color: riskInfo.color }} className="m-[0_0_0.5rem_0] text-[1rem] font-[900] uppercase">Acción Recomendada</h4>
                            <p className="m-[0] text-[0.95rem] line-height-[1.6] text-[#334155] font-[500]">{riskInfo.action}</p>
                        </div>
                    </div>
                </div>

                {/* Firmas */}
                <PdfSignatures data={data} />
            <PdfBrandingFooter />
                </div>
            </div>);

}