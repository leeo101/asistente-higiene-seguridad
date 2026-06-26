import React from 'react';
import { Sparkles, ShieldAlert, HardHat, Lightbulb, Gavel } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function AiAdvisorPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  // function body start


  if (!data) return null;

  const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
  const signature = JSON.parse(localStorage.getItem('signatureStampData') || 'null');
  const profName = personalData.fullName || 'Profesional Responsable';
  const profTitle = personalData.profession || 'Lic. en Higiene y Seguridad';
  const profMat = personalData.license || '-------';

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container report-print print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[20mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[10pt]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 5mm !important; 
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

                {/* Header */}
                <div className="flex justify-space-between border-bottom-[2px_solid_var(--color-primary)] pb-[1.5rem] mb-[2rem]">
                    <div>
                        <h1 className="m-[0_0_0.5rem_0] text-[var(--color-primary)] text-[24pt] font-[900] flex items-center gap-[0.8rem]">
                            <Sparkles size={32} /> ASISTENTE H&S
                        </h1>
                        <p className="m-[0] text-[10pt] text-[#475569] uppercase">Análisis de Seguridad con Inteligencia Artificial</p>
                    </div>
                    <div className="flex items-center justify-end h-[60px]">
                        <CompanyLogo className="max-height-[100%] max-w-[150px] object-fit-[contain]" />





            
                    </div>
                </div>

                {/* Info Block */}
                <div className="bg-[#f8fafc] p-[1.5rem] rounded-[8px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                    <p className="m-[0_0_0.5rem] text-[9pt] text-[#64748b] font-[700] uppercase">Tarea Analizada</p>
                    <p className="m-[0] font-[800] text-[14pt] text-[#0f172a] line-height-[1.4]">{data.task}</p>
                    <p className="m-[0.8rem_0_0] text-[9pt] text-[#64748b]">Fecha de consulta: {new Date(data.date).toLocaleString()}</p>
                </div>

                {/* Analysis Sections */}
                <div className="grid grid-template-columns-[1fr] gap-[1.5rem] mb-[2rem]">
                    {data.riesgos?.length > 0 &&
          <div style={{}}>
                            <div className="flex items-center gap-[0.5rem] text-[#ef4444] mb-[0.8rem] border-bottom-[2px_solid_#fecaca] pb-[0.5rem]">
                                <ShieldAlert size={20} /> <h3 className="m-[0] text-[12pt] font-[800]">Riesgos Detectados</h3>
                            </div>
                            <ul className="m-[0] pl-[1.5rem] text-[#334155] text-[10pt] line-height-[1.5]">
                                {data.riesgos.map((item, i) => <li key={i} className="mb-[0.3rem]">{item}</li>)}
                            </ul>
                        </div>
          }

                    {data.epp?.length > 0 &&
          <div style={{}}>
                            <div className="flex items-center gap-[0.5rem] text-[#3b82f6] mb-[0.8rem] border-bottom-[2px_solid_#bfdbfe] pb-[0.5rem]">
                                <HardHat size={20} /> <h3 className="m-[0] text-[12pt] font-[800]">EPP Recomendado</h3>
                            </div>
                            <ul className="m-[0] pl-[1.5rem] text-[#334155] text-[10pt] line-height-[1.5]">
                                {data.epp.map((item, i) => <li key={i} className="mb-[0.3rem]">{item}</li>)}
                            </ul>
                        </div>
          }

                    {data.recomendaciones?.length > 0 &&
          <div style={{}}>
                            <div className="flex items-center gap-[0.5rem] text-[#10b981] mb-[0.8rem] border-bottom-[2px_solid_#a7f3d0] pb-[0.5rem]">
                                <Lightbulb size={20} /> <h3 className="m-[0] text-[12pt] font-[800]">Medidas Preventivas</h3>
                            </div>
                            <ul className="m-[0] pl-[1.5rem] text-[#334155] text-[10pt] line-height-[1.5]">
                                {data.recomendaciones.map((item, i) => <li key={i} className="mb-[0.3rem]">{item}</li>)}
                            </ul>
                        </div>
          }

                    {data.normativa?.length > 0 &&
          <div style={{}}>
                            <div className="flex items-center gap-[0.5rem] text-[#8b5cf6] mb-[0.8rem] border-bottom-[2px_solid_#ddd6fe] pb-[0.5rem]">
                                <Gavel size={20} /> <h3 className="m-[0] text-[12pt] font-[800]">Marco Legal ({personalData.country === 'chile' ? 'Chile' : personalData.country === 'argentina' ? 'Argentina' : personalData.country === 'bolivia' ? 'Bolivia' : personalData.country === 'paraguay' ? 'Paraguay' : personalData.country === 'uruguay' ? 'Uruguay' : 'Local'})</h3>
                            </div>
                            <ul className="m-[0] pl-[1.5rem] text-[#334155] text-[10pt] line-height-[1.5]">
                                {data.normativa.map((item, i) => <li key={i} className="mb-[0.3rem]">{item}</li>)}
                            </ul>
                        </div>
          }
                </div>

                {/* Signature Row */}
                <PdfSignatures data={data} />
            <PdfBrandingFooter />

            </div>
        </div>);

}