import React from 'react';
import { ShieldCheck, Calendar, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const getRiskLevel = (p, s) => {
  const val = p * s;
  if (val <= 4) return { label: 'BAJO', bg: '#dcfce7', color: '#16a34a' };
  if (val <= 9) return { label: 'MODERADO', bg: '#fef9c3', color: '#ca8a04' };
  return { label: 'CRÍTICO', bg: '#fee2e2', color: '#dc2626' };
};

export default function RiskMatrixPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;
  const finalData = data;

  // logo code removed


  const rows = finalData.rows || [];
  const { name, location, date, responsable, id, createdAt } = finalData;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area border-none shadow-none w-[100%] max-w-[297mm] min-h-[210mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 landscape; margin: 10mm; }
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
                        img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    `}
                </style>

                {/* HEADER */}
                <div className="flex justify-space-between items-center border-bottom-[4px_solid_#1e293b] pb-[1rem] mb-[2rem]">
                    <div>
                        <p className="m-[0] font-[900] text-[0.75rem] text-[#64748b] uppercase letter-spacing-[0.1em]">Sistema de Gestión de Seguridad</p>
                        <h1 className="m-[0] font-[900] text-[2rem] text-[#1e293b] letter-spacing-[-0.02em] uppercase">MATRIZ DE RIESGOS</h1>
                    </div>
                    <div className="flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px]" />






            
                        <div className="text-right">
                            <div className="font-[900] text-[1.2rem] text-[#1e293b]">MR-{id?.toString().slice(-6) || 'HYS'}</div>
                        </div>
                    </div>
                </div>

                {/* PROJECT INFO */}
                <div className="border-[2px_solid_#e2e8f0] rounded-[12px] mb-[2rem]">
                    <div className="grid grid-template-columns-[1.5fr_1fr] border-bottom-[2px_solid_#e2e8f0]">
                        <div className="p-[0.8rem_1rem] flex flex-col gap-[0.3rem] bg-[#f8fafc]">
                            <span className="text-[0.6rem] font-[900] text-[#64748b] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <ShieldCheck size={14} color="#3b82f6" /> PROYECTO / ACTIVIDAD
                            </span>
                            <span className="font-[800] text-[1rem] text-[#0f172a]">{name || '-'}</span>
                        </div>
                        <div className="p-[0.8rem_1rem] border-left-[2px_solid_#e2e8f0] flex flex-col gap-[0.3rem]">
                            <span className="text-[0.6rem] font-[900] text-[#64748b] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <MapPin size={14} color="#f59e0b" /> UBICACIÓN / ÁREA
                            </span>
                            <span className="font-[800] text-[0.9rem] text-[#1e293b]">{location || '-'}</span>
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1.5fr] w-[100%]">
                        <div className="p-[0.8rem_1rem] flex flex-col gap-[0.3rem]">
                            <span className="text-[0.6rem] font-[900] text-[#64748b] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <Calendar size={14} color="#10b981" /> FECHA DE EVALUACIÓN
                            </span>
                            <span className="font-[800] text-[0.9rem] text-[#1e293b]">{date || createdAt ? new Date(date || createdAt).toLocaleDateString('es-AR') : '-'}</span>
                        </div>
                        <div className="p-[0.8rem_1rem] border-left-[2px_solid_#e2e8f0] flex flex-col gap-[0.3rem]">
                            <span className="text-[0.6rem] font-[900] text-[#64748b] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <UserCheck size={14} color="#8b5cf6" /> PROFESIONAL / RESPONSABLE
                            </span>
                            <span className="font-[800] text-[0.9rem] text-[#1e293b]">{responsable || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* MATRIX TABLE */}
                <div className="mb-[2rem]">
                    <div className="flex items-center gap-[0.5rem] mb-[1rem] text-[#1e293b]">
                        <AlertTriangle size={20} color="#f97316" fill="#fef08a" />
                        <h3 className="m-[0] font-[900] text-[1.1rem] uppercase">Análisis y Evaluación de Riesgos</h3>
                    </div>

                    <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] border-[2px_solid_#e2e8f0] rounded-[8px]">
                        <thead>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#f1f5f9] border-bottom-[2px_solid_#cbd5e1]">
                                <th className="p-[0.8rem] text-left text-[0.65rem] font-[900] text-[#475569] uppercase w-[25%]">Tarea / Actividad</th>
                                <th className="p-[0.8rem] text-left text-[0.65rem] font-[900] text-[#475569] uppercase w-[15%]">Peligro / Tipo</th>
                                <th className="p-[0.8rem] text-left text-[0.65rem] font-[900] text-[#475569] uppercase w-[20%]">Efecto Probable</th>
                                <th className="p-[0.8rem] text-center text-[0.65rem] font-[900] text-[#475569] uppercase w-[5%]">Exp.</th>
                                <th className="p-[0.8rem] text-center text-[0.65rem] font-[900] text-[#475569] uppercase w-[10%]">P x S = Nivel</th>
                                <th className="p-[0.8rem] text-left text-[0.65rem] font-[900] text-[#475569] uppercase w-[25%]">Controles Propuestos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ?
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                                    <td colSpan={6} className="p-[2rem] text-center text-[#64748b] font-style-[italic] font-[600]">Sin datos evaluados.</td>
                                </tr> :
              rows.map((row, idx) => {
                const level = getRiskLevel(row.probability || 1, row.severity || 1);
                return (
                  <tr className="avoid-break border-bottom-[1px_solid_#e2e8f0] page-break-inside-[avoid]" key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td className="p-[0.6rem_0.8rem] text-[0.8rem] font-[700] text-[#1e293b] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{row.task}</td>
                                        <td className="p-[0.6rem_0.8rem] text-[0.75rem] text-[#334155] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">
                                            <div className="font-[800] text-[#0f172a]">{row.hazardType}</div>
                                            <div className="mt-[0.1rem]">{row.hazard}</div>
                                        </td>
                                        <td className="p-[0.6rem_0.8rem] text-[0.75rem] text-[#475569] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{row.probableEffect}</td>
                                        <td className="p-[0.6rem_0.8rem] text-[0.8rem] text-center font-[800] text-[#3b82f6]">{row.exposedCount}</td>
                                        <td className="p-[0.6rem_0.8rem]">
                                            <div style={{ background: level.bg, color: level.color }} className="p-[0.4rem_0.2rem] rounded-[6px] text-center flex flex-col items-center">
                                                <span className="text-[0.9rem] font-[900] line-height-[1] mb-[2px]">{row.probability * row.severity}</span>
                                                <span className="text-[0.5rem] font-[900] letter-spacing-[0.05em]">{level.label}</span>
                                            </div>
                                        </td>
                                        <td className="p-[0.6rem_0.8rem] text-[0.75rem] text-[#166534] font-[600] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{row.controls}</td>
                                    </tr>);

              })}
                        </tbody>
                    </table>
                </div>

                {/* LEGEND SECTION */}
                <div className="flex gap-[2rem] border-top-[2px_solid_#e2e8f0] pt-[1.5rem] page-break-inside-[avoid]">
                    <div className="flex-[1]">
                        <p className="m-[0_0_0.5rem_0] text-[0.65rem] font-[900] text-[#64748b] uppercase">Interpretación del Nivel de Riesgo (P × S)</p>
                        <div className="flex gap-[1rem] text-[0.7rem]">
                            <div className="flex items-center gap-[0.4rem]">
                                <div className="w-[12px] h-[12px] bg-[#dcfce7] border-[1px_solid_#16a34a] rounded-[3px]"></div>
                                <span className="font-[700] text-[#334155]">1-4 BAJO (Tolerable)</span>
                            </div>
                            <div className="flex items-center gap-[0.4rem]">
                                <div className="w-[12px] h-[12px] bg-[#fef9c3] border-[1px_solid_#ca8a04] rounded-[3px]"></div>
                                <span className="font-[700] text-[#334155]">5-9 MODERADO (Controlar)</span>
                            </div>
                            <div className="flex items-center gap-[0.4rem]">
                                <div className="w-[12px] h-[12px] bg-[#fee2e2] border-[1px_solid_#dc2626] rounded-[3px]"></div>
                                <span className="font-[700] text-[#334155]">10-16 CRÍTICO (Acción Inm.)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Firmas */}
                <PdfSignatures data={finalData} />
            <PdfBrandingFooter />

                <div className="mt-[auto] pt-[2rem] text-center text-[0.65rem] font-[900] text-[#94a3b8] letter-spacing-[0.1em] uppercase page-break-inside-[avoid]">
                    Documento de Prevención de Riesgos Laborales
                </div>
            </div>
        </div>);

}