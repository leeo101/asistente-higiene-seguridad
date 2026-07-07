import React from 'react';
import { ShieldCheck, TriangleAlert, Info } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function AiReportPdfGenerator({ item }: {item: any;}): React.ReactElement | null {
  // function body start

  if (!item) return null;

  const data = item;
  const company = data.company || 'Empresa Local';
  const profile = JSON.parse(localStorage.getItem('personalData') || 'null');
  const signature = JSON.parse(localStorage.getItem('signatureStampData') || 'null');

  return (
    <div className="ai-report-wrapper w-[100%] block">
            <div
        id="pdf-content"
        className="pdf-container report-print print-area w-[100%] max-w-[210mm] min-h-[auto] p-[20mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[10pt] block">







        
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

                {/* Header Rediseñado Premium */}
                <div className="flex justify-between items-start border-bottom-[3px_solid_#3b82f6] pb-[1.5rem] mb-[2rem]">
                    <div className="flex-[1]">
                        <div className="inline-block bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)] text-[#ffffff] font-[800] text-[0.7rem] uppercase letter-spacing-[2px] p-[0.4rem_1rem] rounded-full mb-[1rem]">
                            Análisis por Inteligencia Artificial
                        </div>
                        <h1 className="m-[0_0_0.3rem_0] text-[#0f172a] text-[2.4rem] font-[900] letter-spacing-[-0.5px] leading-tight">
                            INFORME AI
                        </h1>
                        <p className="m-[0] text-[1.1rem] text-[#3b82f6] font-[700] uppercase letter-spacing-[1px]">
                            Inspección Visual Avanzada
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-[1rem]">
                        <div className="h-[65px] flex items-center">
                            <CompanyLogo className="h-[100%] w-[auto] max-w-[150px] object-fit-[contain]" />
                        </div>
                        <div className="text-[9pt] text-[#64748b] font-[700] bg-[#f1f5f9] p-[0.3rem_0.8rem] rounded-full">
                            Fecha: {new Date(data.date).toLocaleDateString('es-AR')}
                        </div>
                    </div>
                </div>

                {/* Info Block Rediseñado */}
                <div className="flex flex-wrap gap-[1rem] mb-[2.5rem] bg-[#f8fafc] p-[1.5rem] rounded-[12px] border-[1px_solid_#cbd5e1]">
                    <div className="flex-[1] min-w-[150px] border-right-[1px_solid_#e2e8f0] pr-[1rem]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                            <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Tipo de Análisis</span>
                        </div>
                        <p className="m-[0] font-[800] text-[1rem] text-[#3b82f6]">
                            {data.type === 'general_risks' ? 'RIESGOS GENERALES' : 'VERIFICAR EPP'}
                        </p>
                    </div>
                    <div className="flex-[1] min-w-[150px] border-right-[1px_solid_#e2e8f0] pr-[1rem]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                            <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Empresa / Planta</span>
                        </div>
                        <p className="m-[0] font-[800] text-[1rem] text-[#0f172a]">{company}</p>
                    </div>
                    <div className="flex-[1] min-w-[150px]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                            <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Fecha y Hora</span>
                        </div>
                        <p className="m-[0] font-[800] text-[1rem] text-[#0f172a]">{new Date(data.date).toLocaleString('es-AR')}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div className="mb-[2rem] text-center">
                    <div className="w-[100%] max-w-[350px] h-[250px] rounded-[8px] border-[1px_solid_#cbd5e1] m-[0_auto] bg-[#f1f5f9] flex items-center justify-center">
                        {data.image ?
            <img src={data.image} alt="Evidencia" className="w-[100%] h-[100%] object-fit-[contain]" /> :

            <div className="text-[#64748b] text-[9pt] p-[1rem] text-center">
                                <Info size={24} className="m-[0_auto_0.5rem_auto] text-[#94a3b8]" />
                                <br />Imagen no disponible localmente o no guardada por límite de espacio.
                            </div>
            }
                    </div>
                </div>

                {/* Analysis Results Rediseñado */}
                <div className="mb-[2.5rem] avoid-break">
                    <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                        <div className="w-[8px] h-[24px] bg-[#3b82f6] rounded-[4px]"></div>
                        <h3 className="m-[0] text-[#0f172a] font-[800] text-[1.1rem] uppercase letter-spacing-[1px]">
                            {data.type === 'general_risks' ? 'Resumen de Riesgos Detectados' : 'Evaluación de EPP Detectada'}
                        </h3>
                    </div>

                    {data.type !== 'general_risks' ?
          <>
                            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                                {[
              { label: 'Casco de Seguridad', pass: data.analysis?.helmetUsed },
              { label: 'Calzado de Seguridad', pass: data.analysis?.shoesUsed },
              { label: 'Guantes de Trabajo', pass: data.analysis?.glovesUsed },
              { label: 'Ropa Reflectiva', pass: data.analysis?.clothingUsed }].
              map((item, i) =>
              <div key={i} style={{ background: item.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, color: item.pass ? '#15803d' : '#b91c1c' }} className="p-[0.8rem] rounded-[8px] flex items-center gap-[0.8rem]">
                                        {item.pass ? <ShieldCheck size={18} /> : <TriangleAlert size={18} />}
                                        <span className="font-[700] text-[9pt]">{item.label}: {item.pass ? 'CUMPLE' : 'FALTA'}</span>
                                    </div>
              )}
                            </div>
                            <div style={{ background: data.analysis?.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis?.ppeComplete ? '#bbf7d0' : '#ffedd5'}`, color: data.analysis?.ppeComplete ? '#15803d' : '#c2410c' }} className="mt-[1rem] p-[1rem] rounded-[8px] flex items-center gap-[0.8rem]">
                                {data.analysis?.ppeComplete ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}
                                <span className="font-[800] text-[10pt]">ESTADO: {data.analysis?.ppeComplete ? 'ADECUADO' : 'REQUIERE ATENCIÓN'}</span>
                            </div>
                        </> :

          <div className="p-[1rem] rounded-[8px] bg-[#f8fafc] border-[1px_solid_#e2e8f0] text-[#334155]">
                            <div className="flex items-center gap-[0.8rem] mb-[0.5rem] text-[var(--color-primary)]">
                                <Info size={18} />
                                <span className="font-[800] text-[10pt]">EVALUACIÓN GENERAL</span>
                            </div>
                            <p className="m-[0] text-[9pt] line-height-[1.5]">{data.analysis?.generalAssessment || 'Análisis ambiental completado.'}</p>
                        </div>
          }
                </div>

                {data.type !== 'general_risks' && data.analysis?.foundRisks?.length > 0 &&
        <div className="mb-[2rem]">
                        <h4 className="text-[#b91c1c] mb-[0.8rem] text-[11pt]">Riesgos Adicionales:</h4>
                        <ul className="m-[0] pl-[1.5rem] text-[#1e293b] text-[10pt]">
                            {data.analysis.foundRisks.map((risk, i) =>
            <li key={i} className="mb-[0.3rem]">{risk}</li>
            )}
                        </ul>
                    </div>
        }

                {/* Signature Row */}
                <PdfSignatures data={data} />
            <PdfBrandingFooter />

            </div>
        </div>);

}