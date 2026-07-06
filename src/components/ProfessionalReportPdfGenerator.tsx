import React from 'react';
import { Building2, MapPin, Calendar } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function ProfessionalReportPdfGenerator({ currentReport, customId }: {currentReport: any; customId?: string}): React.ReactElement | null {
  // logo code removed


  if (!currentReport) return null;

  const report = currentReport;

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  return (
    <div className="w-[100%] flex justify-center">
        <div
            id={customId || "pdf-content"}
            className="pdf-container print-area border-none shadow-none w-[100%] max-w-[210mm] min-h-[297mm] p-[10mm_15mm] bg-[#ffffff] text-[#1e293b] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]"
        >
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
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
                    .striped-row:nth-child(even) { background-color: #f8fafc; }
                `}
            </style>

            {/* Header Rediseñado */}
            <div className="flex justify-between items-start border-bottom-[3px_solid_#0f172a] pb-[1.5rem] mb-[2rem]">
                <div className="flex-[1]">
                    <div className="inline-block bg-[#0f172a] text-[#ffffff] font-[800] text-[0.7rem] uppercase letter-spacing-[2px] p-[0.3rem_0.8rem] rounded-full mb-[1rem]">
                        Documento Oficial
                    </div>
                    <h1 className="m-[0_0_0.3rem_0] text-[#0f172a] text-[2.2rem] font-[900] letter-spacing-[-0.5px] leading-tight">
                        INFORME TÉCNICO
                    </h1>
                    <p className="m-[0] text-[1.1rem] text-[#334155] font-[600]">
                        {report.title || 'Reporte de Higiene y Seguridad'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-[1rem]">
                    <div className="h-[65px] flex items-center">
                        <CompanyLogo className="max-height-[100%] max-w-[160px] object-fit-[contain]" />
                    </div>
                    <div className="text-right">
                        <p className="m-[0] font-[900] text-[1.1rem] text-[#0f172a] letter-spacing-[1px]">PROFESIONAL HYS</p>
                    </div>
                </div>
            </div>

            {/* Metadata Grid Rediseñada */}
            <div className="flex flex-wrap gap-[1rem] mb-[2.5rem] bg-[#f8fafc] p-[1.2rem_1.5rem] rounded-[12px] border-[1px_solid_#cbd5e1]">
                <div className="flex-[1] min-w-[150px] border-right-[1px_solid_#e2e8f0] pr-[1rem]">
                    <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                        <Building2 size={16} className="text-[#3b82f6]" />
                        <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Empresa</span>
                    </div>
                    <p className="m-[0] font-[800] text-[1rem] text-[#0f172a]">{report.company || '-'}</p>
                </div>
                <div className="flex-[1] min-w-[150px] border-right-[1px_solid_#e2e8f0] pr-[1rem]">
                    <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                        <MapPin size={16} className="text-[#3b82f6]" />
                        <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Ubicación</span>
                    </div>
                    <p className="m-[0] font-[800] text-[1rem] text-[#0f172a]">{report.location || 'N/A'}</p>
                </div>
                <div className="flex-[1] min-w-[150px]">
                    <div className="flex items-center gap-[0.5rem] mb-[0.3rem]">
                        <Calendar size={16} className="text-[#3b82f6]" />
                        <span className="text-[0.75rem] text-[#64748b] font-[700] uppercase letter-spacing-[1px]">Fecha</span>
                    </div>
                    <p className="m-[0] font-[800] text-[1rem] text-[#0f172a]">{report.date ? new Date(report.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</p>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="mb-[2.5rem] avoid-break">
                <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                    <div className="w-[8px] h-[24px] bg-[#3b82f6] rounded-[4px]"></div>
                    <h3 className="m-[0] text-[#0f172a] font-[800] text-[1.1rem] uppercase letter-spacing-[1px]">Detalle / Observaciones</h3>
                </div>
                <div className="bg-[#ffffff] p-[1.5rem] rounded-[12px] border-[1px_solid_#e2e8f0] box-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere] line-height-[1.8] text-[1.05rem] text-[#334155]">
                        {report.content || 'Sin observaciones registradas.'}
                    </div>
                </div>
            </div>

            {/* Fotos de Evidencia si existen */}
            {report.photos && report.photos.length > 0 && (
                <div className="mb-[3rem] avoid-break">
                    <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                        <div className="w-[8px] h-[24px] bg-[#3b82f6] rounded-[4px]"></div>
                        <h3 className="m-[0] text-[#0f172a] font-[800] text-[1.1rem] uppercase letter-spacing-[1px]">Registro Fotográfico</h3>
                    </div>
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(250px,_1fr))] gap-[1rem]">
                        {report.photos.map((photo: any, index: number) => (
                            <div key={photo.id || index} className="border-[1px_solid_#e2e8f0] rounded-[12px] overflow-hidden bg-[#f8fafc] p-[0.5rem] avoid-break break-inside-[avoid]">
                                <img src={photo.url} alt="Evidencia" className="w-[100%] h-[200px] object-fit-[cover] rounded-[8px] border-[1px_solid_#cbd5e1]" />
                                {photo.description && (
                                    <p className="m-[0.8rem_0_0.3rem_0] text-[0.85rem] text-[#475569] text-center font-[600]">{photo.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personal Interviniente */}
            {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 && (
                <div className="mb-[3rem] avoid-break">
                    <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                        <div className="w-[8px] h-[24px] bg-[#3b82f6] rounded-[4px]"></div>
                        <h3 className="m-[0] text-[#0f172a] font-[800] text-[1.1rem] uppercase letter-spacing-[1px]">Personal Interviniente</h3>
                    </div>
                    <div className="border-[1px_solid_#cbd5e1] rounded-[12px] overflow-hidden">
                        <table className="w-[100%] border-collapse-[collapse] text-[0.9rem]">
                            <thead>
                                <tr className="bg-[#0f172a] text-[#ffffff]">
                                    <th className="p-[1rem] text-left font-[700] w-[40%]">Nombre y Apellido</th>
                                    <th className="p-[1rem] text-left font-[700] w-[25%]">DNI / CUIL</th>
                                    <th className="p-[1rem] text-center font-[700] w-[35%]">Firma del Trabajador</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.personnel.map((p: any, idx: number) => (
                                    <tr className="avoid-break striped-row border-bottom-[1px_solid_#e2e8f0]" key={p.id || idx}>
                                        <td className="p-[1rem] text-[#0f172a] font-[700]">{p.name}</td>
                                        <td className="p-[1rem] text-[#334155]">{p.dni}</td>
                                        <td className="p-[1rem] h-[80px] vertical-align-[bottom]">
                                            <div className="border-bottom-[1px_dashed_#94a3b8] w-[80%] m-[0_auto]"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Firmas */}
            <div className="avoid-break mt-[2rem]">
                <PdfSignatures data={report} />
            </div>

            <PdfBrandingFooter />

            {/* Footer Legal */}
            <div className="w-[100%] text-center text-[0.75rem] text-[#64748b] mt-[3rem] font-[600] border-top-[1px_solid_#cbd5e1] pt-[1.5rem]">
                Documento generado por Asistente de Higiene y Seguridad - Conforme a {countryNorms.general}
            </div>
        </div>
    </div>);

}