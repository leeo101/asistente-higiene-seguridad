import React from 'react';
import { Lightbulb, Sun, Layout, FileText, Building2, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';

export default function LightingPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  const savedPersonal = localStorage.getItem('personalData');
  const userCountry = savedPersonal ? JSON.parse(savedPersonal).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  // Firma profesional desde localStorage
  let actSignature = data.professionalSignature || null;
  let actName = data.professionalName || null;
  let actLic = data.professionalLicense || null;
  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      if (lsStamp) actSignature = JSON.parse(lsStamp).signature;else
      if (legacySig) actSignature = legacySig;
      if (savedPersonal) {
        const pd = JSON.parse(savedPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const { empresa, fecha, sector, descripcionActividad, tipoTarea, luxRequerido, mediciones, results, conclusion } = data;
  const meds = mediciones || [];
  const cumple = results?.cumplePromedio;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
        style={{





          borderTop: cumple ? '12px solid #eab308' : '12px solid #dc2626'
        }}>
        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                            width: 100% !important; max-width: none !important;
                            border-top: ${cumple ? '12px solid #eab308' : '12px solid #dc2626'} !important;
                            border-radius: 0 !important; min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Tripartito */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p style={{ color: cumple ? '#d97706' : '#dc2626' }} className="m-[0] font-[900] text-[0.8rem] uppercase">
                            {cumple ? 'Doc. Estudio de Iluminación' : '⚠ DEFICIENCIA DE ILUMINACIÓN'}
                        </p>
                    </div>

                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[2.4rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">ILUMINACIÓN</h1>
                        <div style={{ background: cumple ? '#eab308' : '#dc2626' }} className="mt-[0.3rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                            ESTUDIO DE NIVELES — {countryNorms.lighting}
                        </div>
                    </div>

                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                    </div>
                </div>

                {/* Datos del establecimiento */}
                <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem]">
                    <div className="grid grid-template-columns-[2fr_1fr] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0]">
                        <div className="p-[0.8rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={12} /> EMPRESA / CLIENTE</span>
                            <div className="font-[800] text-[0.95rem] text-[#0f172a] mt-[0.2rem]">{empresa || '-'}</div>
                        </div>
                        <div className="p-[0.8rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA DE MEDICIÓN</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-'}</div>
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1fr] bg-[#ffffff]">
                        <div className="p-[0.8rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> SECTOR EVALUADO</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{sector || '-'}</div>
                        </div>
                        <div className="p-[0.8rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">DESCRIPCIÓN DE TAREAS</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{descripcionActividad || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Requerimiento legal */}
                <div className="border-[1px_solid_#fde68a] rounded-[6px] mb-[1.5rem] bg-[#fffbeb] flex gap-[0]">
                    <div className="flex-[2] p-[1rem_1.2rem] border-right-[1px_solid_#fde68a]">
                        <span className="text-[0.6rem] font-[800] text-[#92400e] uppercase flex items-center gap-[0.3rem]"><Layout size={12} /> TIPO DE TAREA VISUAL</span>
                        <div className="font-[800] text-[0.92rem] text-[#0f172a] mt-[0.25rem]">{tipoTarea || '-'}</div>
                    </div>
                    <div className="flex-[1] p-[1rem_1.2rem] flex items-center gap-[0.8rem] bg-[#fef3c7]">
                        <Sun size={28} color="#d97706" />
                        <div>
                            <div className="text-[0.6rem] font-[800] text-[#92400e] uppercase">ILUM. MÍNIMA EXIGIDA</div>
                            <div className="font-[900] text-[1.5rem] text-[#d97706] line-height-[1]">{luxRequerido || 0} <span className="text-[0.8rem] text-[#92400e]">Lux</span></div>
                        </div>
                    </div>
                </div>

                {/* Tabla de mediciones */}
                <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px]">
                    <div className="bg-[#1e293b] p-[0.6rem_1rem] flex items-center gap-[0.5rem]">
                        <Lightbulb size={15} color="#fbbf24" />
                        <span className="font-[900] text-[0.78rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">PUNTOS DE MEDICIÓN — {meds.length} REGISTRO{meds.length !== 1 ? 'S' : ''}</span>
                    </div>
                    <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[8.5pt]">
                        <thead>
                            <tr className="avoid-break break-inside-[avoid] bg-[#f8fafc]">
                                <th className="p-[0.5rem_0.4rem] w-[5%] text-center font-[800] text-[#64748b] border-[1px_solid_#e2e8f0] text-[0.65rem]">N°</th>
                                <th className="p-[0.5rem_0.8rem] text-left font-[800] text-[#64748b] border-[1px_solid_#e2e8f0] text-[0.65rem]">PUNTO / PUESTO DE TRABAJO</th>
                                <th className="p-[0.5rem_0.8rem] w-[18%] text-center font-[800] text-[#64748b] border-[1px_solid_#e2e8f0] text-[0.65rem]">LUX MEDIDO</th>
                                <th className="p-[0.5rem_0.8rem] w-[15%] text-center font-[800] text-[#64748b] border-[1px_solid_#e2e8f0] text-[0.65rem]">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meds.length === 0 ?
              <tr className="avoid-break break-inside-[avoid]"><td colSpan={4} className="p-[1rem] text-center text-[#94a3b8] font-style-[italic] border-[1px_solid_#e2e8f0]">Sin mediciones registradas</td></tr> :
              meds.map((m, idx) => {
                const val = parseFloat(m.luxMedido) || 0;
                const ok = val >= (parseFloat(luxRequerido) || 0);
                return (
                  <tr className="avoid-break" key={m.id || idx} style={{ background: ok ? idx % 2 === 0 ? '#ffffff' : '#f8fafc' : '#fef2f2' }}>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.5rem_0.4rem] text-center text-[#94a3b8] font-[700]">{idx + 1}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.5rem_0.8rem] font-[600] text-[#334155]">{m.ubicacion || '-'}</td>
                                        <td style={{ color: ok ? '#15803d' : '#dc2626' }} className="border-[1px_solid_#e2e8f0] p-[0.5rem_0.8rem] text-center font-[900] text-[1rem]">{m.luxMedido}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.5rem_0.8rem] text-center">
                                            {ok ?
                      <span className="bg-[#dcfce7] text-[#16a34a] p-[0.15rem_0.5rem] rounded-[6px] font-[900] text-[0.7rem]">✓ OK</span> :
                      <span className="bg-[#fecaca] text-[#dc2626] p-[0.15rem_0.5rem] rounded-[6px] font-[900] text-[0.7rem]">✗ BAJO</span>
                      }
                                        </td>
                                    </tr>);

              })}
                        </tbody>
                    </table>
                </div>

                {/* Evaluación normativa */}
                <div style={{ border: `1.5px solid ${cumple ? '#86efac' : '#fca5a5'}` }} className="rounded-[6px] mb-[1.5rem]">
                    <div style={{ background: cumple ? '#f0fdf4' : '#fef2f2' }} className="p-[1rem_1.2rem] flex items-center justify-space-between flex-wrap gap-[0.5rem]">
                        <div>
                            <div className="text-[0.65rem] font-[800] text-[#64748b] uppercase mb-[0.3rem]">PROMEDIO REGISTRADO</div>
                            <div style={{ color: cumple ? '#16a34a' : '#dc2626' }} className="text-[2.2rem] font-[900] line-height-[1]">
                                {results?.promedioLux || 0} <span className="text-[1rem] font-[700]">Lux</span>
                            </div>
                        </div>
                        <div style={{ borderLeft: `1px solid ${cumple ? '#bbf7d0' : '#fecaca'}` }} className="flex-[1] min-width-[120px] p-[0_1.2rem]">
                            <div className="text-[0.8rem] text-[#64748b] mb-[0.3rem]">Req. {countryNorms.lighting.split(' ')[0]}: <strong className="text-[#1e293b]">{luxRequerido || 0} Lux</strong></div>
                            <div className="text-[0.8rem] text-[#64748b] mb-[0.3rem]">Cumplen: <strong className="text-[#16a34a]">{results?.puntosCumplen || 0}</strong></div>
                            <div className="text-[0.8rem] text-[#64748b]">Deficientes: <strong className="text-[#dc2626]">{results?.puntosNoCumplen || 0}</strong></div>
                        </div>
                        <div style={{ background: cumple ? '#16a34a' : '#dc2626' }} className="p-[0.7rem_1.5rem] text-[#fff] rounded-[8px] font-[900] text-[1rem] letter-spacing-[0.05em] flex items-center gap-[0.5rem]">
                            {cumple ? <CheckCircle size={20} /> : <AlertTriangle size={20} />} {cumple ? 'CUMPLE' : 'NO CUMPLE'}
                        </div>
                    </div>
                </div>

                {/* Conclusión */}
                {conclusion &&
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem]">
                        <div className="bg-[#334155] p-[0.5rem_1rem] flex items-center gap-[0.4rem]">
                            <FileText size={14} color="#fff" />
                            <span className="font-[900] text-[0.72rem] text-[#ffffff] uppercase letter-spacing-[0.05em]">CONCLUSIÓN TÉCNICA PROFESIONAL</span>
                        </div>
                        <div className="p-[0.9rem_1.2rem] text-[0.83rem] text-[#334155] white-space-[pre-wrap] line-height-[1.6] bg-[#f8fafc] font-[600]">
                            {conclusion}
                        </div>
                    </div>
        }

                {/* Firmas */}
        <PdfSignatures data={data} />

                <PdfBrandingFooter />
            </div>
        </div>);

}