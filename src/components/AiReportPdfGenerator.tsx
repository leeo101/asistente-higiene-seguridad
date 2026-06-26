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

                {/* Header */}
                <div className="flex justify-space-between items-center border-bottom-[2px_solid_var(--color-primary)] pb-[1.5rem] mb-[2rem]">
                    <div>
                        <h1 className="m-[0_0_0.5rem_0] text-[var(--color-primary)] text-[24pt] font-[900]">INFORME AI</h1>
                        <p className="m-[0] text-[10pt] text-[#475569] uppercase">Inspección Visual de Seguridad</p>
                    </div>
                    <div className="text-right">
                        <div className="h-[50px] min-width-[50px] flex items-center justify-end mb-[0.5rem]">






              
                            <CompanyLogo className="h-[100%] w-[auto] max-w-[150px] object-fit-[contain]" />






              
                        </div>
                        <div className="text-[8pt] text-[#64748b] font-[700]">
                            {new Date(data.date).toLocaleDateString('es-AR')}
                        </div>
                    </div>
                </div>

                {/* Info Block */}
                <div className="grid grid-template-columns-[1fr_1fr_1fr] gap-[1rem] bg-[#f8fafc] p-[1rem] rounded-[8px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                    <div>
                        <p className="m-[0] text-[8pt] text-[#64748b]">Tipo</p>
                        <p className="m-[0] font-[800] text-[10pt] text-[var(--color-primary)]">
                            {data.type === 'general_risks' ? 'RIESGOS GENERALES' : 'VERIFICAR EPP'}
                        </p>
                    </div>
                    <div>
                        <p className="m-[0] text-[8pt] text-[#64748b]">Empresa / Planta</p>
                        <p className="m-[0] font-[600] text-[10pt]">{company}</p>
                    </div>
                    <div>
                        <p className="m-[0] text-[8pt] text-[#64748b]">Fecha</p>
                        <p className="m-[0] font-[600] text-[10pt]">{new Date(data.date).toLocaleString()}</p>
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

                {/* Analysis Results */}
                <div className="mb-[2rem]">
                    <h3 className="border-bottom-[1px_solid_#e2e8f0] pb-[0.5rem] mb-[1rem] text-[#1e293b] text-[12pt]">
                        {data.type === 'general_risks' ? 'Resumen de Riesgos Detectados' : 'Evaluación de EPP Detectada'}
                    </h3>

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