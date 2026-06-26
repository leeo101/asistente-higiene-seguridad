import React from 'react';
import { Building2, MapPin, Calendar } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function ProfessionalReportPdfGenerator({ currentReport }: {currentReport: any;}): React.ReactElement | null {
  // logo code removed


  if (!currentReport) return null;

  const report = currentReport;

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area border-none shadow-none w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
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
                    `}
                </style>

                {/* Header with Professional Info */}
                <div className="flex justify-space-between border-bottom-[2px_solid_#3b82f6] pb-[2rem] mb-[2.5rem] gap-[1.5rem]">
                    <div className="flex-[1]">
                        <h1 className="m-[0_0_0.5rem_0] text-[#3b82f6] text-[2.5rem] font-[900] letter-spacing-[-1px]">INFORME</h1>
                        <p className="m-[0] text-[0.9rem] text-[#475569] uppercase letter-spacing-[1px] font-[700]">
                            {report.title || 'Informe Técnico'}
                        </p>
                    </div>
                    <div className="flex items-center justify-end h-[60px]">
                        <CompanyLogo className="max-height-[100%] max-w-[150px] object-fit-[contain]" />





            
                    </div>
                    <div className="text-right border-left-[1px_solid_#e2e8f0] pl-[2rem]">
                        <p className="m-[0] font-[800] text-[1.2rem] text-[#1e293b]">PROFESIONAL HYS</p>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[1.5rem] mb-[3rem] bg-[#f8fafc] p-[1.5rem] rounded-[8px] border-[1px_solid_#e2e8f0] text-[#1e293b]">
                    <div className="flex items-center gap-[0.8rem]">
                        <Building2 size={20} color="#3b82f6" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Empresa</p>
                            <p className="m-[0] font-[700]">{report.company || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[0.8rem]">
                        <MapPin size={20} color="#3b82f6" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Ubicación</p>
                            <p className="m-[0] font-[700]">{report.location || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[0.8rem]">
                        <Calendar size={20} color="#3b82f6" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Fecha</p>
                            <p className="m-[0] font-[700]">{report.date ? new Date(report.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area / Observations */}
                <div className="mb-[1rem] text-[#3b82f6] font-[800] text-[0.8rem] letter-spacing-[2px] uppercase">DETALLE / OBSERVACIONES</div>
                <div className="mb-[4rem] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere] line-height-[1.6] text-[1.05rem] text-[#1e293b] border-top-[2px_solid_#f1f5f9] pt-[1rem]">
                    {report.content || 'Sin observaciones registradas.'}
                </div>

                {/* Personnel List Table if applicable */}
                {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 &&
        <div className="mb-[4rem] page-break-inside-[auto]">
                        <h4 className="m-[0_0_1rem_0] text-[#3b82f6] border-bottom-[1px_solid_#e2e8f0] pb-[0.5rem] font-[800]">
                            Personal Interviniente / Firmas
                        </h4>
                        <div className="w-[100%]">
                            <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[0.85rem]">
                                <thead>
                                    <tr className="avoid-break break-inside-[avoid] bg-[#f1f5f9]">
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">Nombre y Apellido</th>
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">DNI / CUIL</th>
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left w-[35%] text-[#475569]">Firma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.personnel.map((p, idx) =>
                <tr className="avoid-break" key={p.id || idx} style={{}}>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-[#1e293b] font-[600]">{p.name}</td>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-[#1e293b]">{p.dni}</td>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] h-[65px] vertical-align-[bottom] text-center">
                                                <div className="border-top-[1px_dotted_#000] w-[80%] m-[0_auto] text-[0.7rem] text-[#64748b]">
                                                    Firma del Trabajador
                                                </div>
                                            </td>
                                        </tr>
                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
        }

                {/* Firmas */}
                <PdfSignatures data={report} />
            <PdfBrandingFooter />

                {/* Footer Legal */}
                <div className="w-[100%] text-center text-[0.7rem] text-[#94a3b8] mt-[3rem] font-style-[italic] border-top-[1px_solid_#e2e8f0] pt-[1rem]">
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a {countryNorms.general}
                </div>
            </div>
        </div>);

}