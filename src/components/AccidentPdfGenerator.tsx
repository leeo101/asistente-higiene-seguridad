import React from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, Clock, TriangleAlert, User, FileText, Building2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function AccidentPdfGenerator({ report, onBack, isHeadless = false }: {report: any;onBack?: any;isHeadless?: boolean;}): React.ReactElement | null {

  const getSeverityStyle = (sev: any) => {
    if (sev === 'Leve') return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', borderTop: '#3b82f6', label: 'LEVE — Sin Baja' };
    if (sev === 'Moderado') return { color: '#b45309', bg: '#fffbeb', border: '#fde68a', borderTop: '#f59e0b', label: 'MODERADO — Con Baja' };
    if (sev === 'Grave') return { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', borderTop: '#f97316', label: 'GRAVE — Internación' };
    if (sev === 'Mortal') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', borderTop: '#dc2626', label: 'MORTAL' };
    return { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', borderTop: '#64748b', label: sev };
  };

  const sev = getSeverityStyle(report?.gravedad);

  // Obtener firma profesional desde report o localStorage
  let actSignature: string | null = report?.professionalSignature || null;
  let actStamp: string | null = report?.professionalStamp || null;
  let actName: string | null = report?.professionalName || null;
  let actLic: string | null = report?.professionalLicense || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {
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
    <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {!isHeadless &&
      <div className="no-print flex items-center justify-space-between mb-[1.5rem] flex-wrap gap-[1rem]">
                    <div className="flex items-center gap-[1rem]">
                        <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="m-[0] text-[1.5rem] font-[800]">Informe de Investigación</h1>
                    </div>
                    <button onClick={() => window.print()} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
      }

            <div className="flex-[1] flex justify-center">
                <div
          id="pdf-content"
          className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
          style={{





            borderTop: `12px solid ${sev.borderTop}`
          }}>
          
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                                width: 100% !important; max-width: none !important;
                                border-top: 12px solid ${sev.borderTop} !important;
                                border-radius: 0 !important; min-height: auto !important;
                            }
                        `}
                    </style>

                    {/* Header Tripartito HSE */}
                    <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                        <div className="flex-[1] text-left">
                            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                            <p style={{ color: sev.color }} className="m-[0] font-[900] text-[0.8rem] uppercase">
                                ⚠ {sev.label}
                            </p>
                        </div>

                        <div className="flex-[2] flex flex-col items-center justify-center text-center">
                            <h1 className="m-[0] font-[900] text-[1.7rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">INVESTIGACIÓN</h1>
                            <h2 className="m-[0.1rem_0_0] font-[900] text-[1.1rem] uppercase line-height-[1] text-[#334155]">DE ACCIDENTE LABORAL</h2>
                            <div style={{ background: sev.borderTop }} className="mt-[0.4rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.08em]">
                                RES. SRT 7/2026 — DEC. 549/2025 — ÁRBOL DE CAUSAS
                            </div>
                        </div>

                        <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                            <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                            <div style={{ background: sev.bg, border: `1px solid ${sev.border}` }} className="rounded-[6px] p-[0.25rem_0.6rem] text-[0.6rem] font-[800] text-[#64748b] text-center">
                                <div className="text-[#475569]">Ref: INV-{report?.id?.toString().slice(-6) || '000000'}</div>
                                <div className="text-[#94a3b8]">Generado: {new Date().toLocaleDateString('es-AR')}</div>
                            </div>
                        </div>
                    </div>

                    {/* 1 - Datos del Siniestro */}
                    <div style={{ border: `1.5px solid ${sev.border}` }} className="rounded-[6px] mb-[1.2rem]">
                        <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                            <TriangleAlert size={14} color={sev.borderTop} />
                            <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">1 — DATOS DEL SINIESTRO</span>
                        </div>
                        <div className="grid grid-template-columns-[2fr_1fr_1fr] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0]">
                            <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={11} /> EMPRESA / RAZÓN SOCIAL</span>
                                <div className="font-[800] text-[0.92rem] text-[#0f172a] mt-[0.2rem]">{report?.empresa || '-'}</div>
                            </div>
                            <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={11} /> FECHA</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
                            </div>
                            <div className="p-[0.7rem_1rem]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Clock size={11} /> HORA</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.hora || 'N/E'}</div>
                            </div>
                        </div>
                        <div className="grid grid-template-columns-[1fr_1fr] bg-[#ffffff]">
                            <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={11} /> UBICACIÓN / SECTOR</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.ubicacion || '-'}</div>
                            </div>
                            <div className="p-[0.7rem_1rem] flex items-center gap-[0.8rem]">
                                <span style={{ background: sev.bg, border: `1.5px solid ${sev.border}`, color: sev.color }} className="p-[0.4rem_1rem] rounded-[8px] font-[900] text-[0.85rem]">{sev.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2 - Datos del Accidentado */}
                    <div className="border-[1px_solid_#fca5a5] rounded-[6px] mb-[1.2rem]">
                        <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                            <User size={14} color="#fca5a5" />
                            <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">2 — DATOS DEL ACCIDENTADO</span>
                        </div>
                        <div className="grid grid-template-columns-[repeat(2,_1fr)] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0]">
                            <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">NOMBRE Y APELLIDO</span>
                                <div className="font-[800] text-[0.92rem] text-[#0f172a] mt-[0.2rem]">{report?.victimaNombre || '-'}</div>
                            </div>
                            <div className="p-[0.7rem_1rem]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">DNI / CUIL</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.victimaDni || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-template-columns-[repeat(2,_1fr)] bg-[#ffffff] border-bottom-[1px_solid_#e2e8f0]">
                            <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">PUESTO DE TRABAJO</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.victimaPuesto || '-'}</div>
                            </div>
                            <div className="p-[0.7rem_1rem]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase">ANTIGÜEDAD EN PUESTO</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{report?.victimaAntiguedad || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-template-columns-[1fr_1fr] bg-[#fef2f2] p-[0.7rem_1rem] gap-[1rem]">
                            <div>
                                <span className="text-[0.6rem] font-[800] text-[#dc2626] uppercase">TIPO DE LESIÓN</span>
                                <div className="font-[700] text-[0.88rem] text-[#991b1b] mt-[0.2rem]">{report?.lesion || 'No especificada'}</div>
                            </div>
                            <div>
                                <span className="text-[0.6rem] font-[800] text-[#dc2626] uppercase">PARTE DEL CUERPO AFECTADA</span>
                                <div className="font-[700] text-[0.88rem] text-[#991b1b] mt-[0.2rem]">{report?.parteCuerpo || 'No especificada'}</div>
                            </div>
                        </div>
                    </div>

                    {/* 3 - Descripción del Hecho */}
                    <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.2rem]">
                        <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                            <FileText size={14} color="#fff" />
                            <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">3 — DESCRIPCIÓN DEL HECHO</span>
                        </div>
                        <div className="p-[0.9rem_1rem] text-[0.85rem] line-height-[1.6] text-[#334155] font-[600] bg-[#f8fafc] white-space-[pre-wrap] text-justify">
                            {report?.descripcionHecho || 'Sin descripción detallada.'}
                        </div>

                        {report?.testigos?.some((t) => t.nombre) &&
            <div className="border-top-[1px_solid_#e2e8f0] p-[0.9rem_1rem] bg-[#fff]">
                                <div className="text-[0.65rem] font-[900] text-[#64748b] uppercase mb-[0.5rem]">TESTIGOS INTERVINIENTES</div>
                                {report.testigos.filter((t) => t.nombre).map((t, idx) =>
              <div key={idx} className="flex gap-[0.6rem] mb-[0.4rem] items-start p-[0.4rem_0.6rem] bg-[#f8fafc] rounded-[4px] border-left-[3px_solid_#94a3b8]">
                                        <span className="font-[800] text-[0.78rem] text-[#1e293b] min-width-[120px]">{t.nombre}:</span>
                                        <span className="text-[0.78rem] text-[#475569] font-style-[italic]">"{t.declaracion}"</span>
                                    </div>
              )}
                            </div>
            }
                    </div>

                    {/* 4 - Análisis Causal 5 Porqués */}
                    <div className="border-[1px_solid_#ddd6fe] rounded-[6px] mb-[1.2rem]">
                        <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                            <Search size={14} color="#c4b5fd" />
                            <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">4 — ANÁLISIS CAUSAL — MÉTODO "5 PORQUÉS"</span>
                        </div>

                        <div className="p-[0.8rem_1rem] bg-[#f5f3ff] border-bottom-[1px_solid_#ddd6fe]">
                            <span className="text-[0.6rem] font-[900] text-[#7c3aed] uppercase">PROBLEMA / EFECTO FINAL</span>
                            <div className="font-[800] text-[0.92rem] text-[#4c1d95] mt-[0.2rem]">{report?.problemaCentral || 'No definido'}</div>
                        </div>

                        <div className="p-[0.8rem_1rem] bg-[#ffffff]">
                            {report?.porques?.filter((p) => p).map((pq, idx) =>
              <div key={idx} style={{ paddingLeft: `${idx * 12}px` }} className="flex items-start gap-[0.6rem] mb-[0.5rem]">
                                    <div style={{ background: idx === report.porques.filter((p) => p).length - 1 ? '#7c3aed' : '#e2e8f0', border: '2px solid ' + (idx === report.porques.filter((p) => p).length - 1 ? '#7c3aed' : '#cbd5e1'), color: idx === report.porques.filter((p) => p).length - 1 ? '#fff' : '#64748b' }} className="min-width-[22px] h-[22px] rounded-[50%] flex items-center justify-center font-[900] text-[0.65rem] flex-shrink-[0]">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <span className="text-[0.6rem] font-[800] text-[#94a3b8] uppercase">¿Por qué? (Nivel {idx + 1})</span>
                                        <div className="font-[600] text-[0.82rem] text-[#334155] line-height-[1.4]">{pq}</div>
                                    </div>
                                </div>
              )}

                            {report?.porques?.filter((p) => p).length > 0 &&
              <div className="mt-[0.6rem] p-[0.6rem_0.8rem] bg-[#f5f3ff] border-[1.5px_dashed_#8b5cf6] rounded-[6px]">
                                    <span className="text-[0.6rem] font-[900] text-[#7c3aed] uppercase">✓ CAUSA RAÍZ IDENTIFICADA</span>
                                    <div className="font-[800] text-[0.85rem] text-[#4c1d95] mt-[0.2rem]">
                                        {[...report.porques].filter((p) => p).reverse()[0]}
                                    </div>
                                </div>
              }
                        </div>
                    </div>

                    {/* 5 - Plan de Acción */}
                    <div className="border-[1px_solid_#bbf7d0] rounded-[6px] mb-[1.5rem]">
                        <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                            <CheckCircle size={14} color="#86efac" />
                            <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">5 — PLAN DE ACCIÓN CORRECTIVA / PREVENTIVA</span>
                        </div>
                        <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[8.5pt]">
                            <thead>
                                <tr className="avoid-break break-inside-[avoid] bg-[#f0fdf4]">
                                    <th className="p-[0.5rem_0.8rem] text-left font-[800] text-[#166534] w-[50%] border-[1px_solid_#bbf7d0] text-[0.65rem] uppercase">Acción a Implementar</th>
                                    <th className="p-[0.5rem_0.8rem] text-left font-[800] text-[#166534] w-[25%] border-[1px_solid_#bbf7d0] text-[0.65rem] uppercase">Responsable</th>
                                    <th className="p-[0.5rem_0.8rem] text-center font-[800] text-[#166534] w-[25%] border-[1px_solid_#bbf7d0] text-[0.65rem] uppercase">Fecha Límite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report?.medidas?.filter((m) => m.accion).length > 0 ?
                report.medidas.filter((m) => m.accion).map((m, idx) =>
                <tr className="avoid-break" key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                                            <td className="p-[0.5rem_0.8rem] border-[1px_solid_#dcfce7] font-[600] text-[#1e293b] white-space-[pre-wrap] word-break-[break-word]">{m.accion}</td>
                                            <td className="p-[0.5rem_0.8rem] border-[1px_solid_#dcfce7] text-[#475569] font-[600]">{m.responsable || '-'}</td>
                                            <td className="p-[0.5rem_0.8rem] border-[1px_solid_#dcfce7] text-[#475569] text-center">
                                                {m.fechaLimite ? new Date(m.fechaLimite + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
                                            </td>
                                        </tr>
                ) :

                <tr className="avoid-break break-inside-[avoid]"><td colSpan={3} className="p-[1rem] text-center text-[#94a3b8] border-[1px_solid_#dcfce7]">No se definieron medidas correctivas.</td></tr>
                }
                            </tbody>
                        </table>
                    </div>

                    {/* 6 - Registro Fotográfico */}
                    {report?.fotos && report.fotos.length > 0 &&
          <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem]">
                            <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                                <FileText size={14} color="#fff" />
                                <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">6 — REGISTRO FOTOGRÁFICO / EVIDENCIA</span>
                            </div>
                            <div className="p-[1rem] grid grid-template-columns-[repeat(auto-fill,_minmax(200px,_1fr))] gap-[1rem] bg-[#f8fafc]">
                                {report.fotos.map((foto: string, idx: number) =>
              <div key={idx} className="avoid-break break-inside-[avoid] border-[1px_solid_#e2e8f0] rounded-[8px] overflow-[hidden] bg-[#fff] p-[0.5rem]">
                                        <img src={foto} alt={`Evidencia ${idx + 1}`} className="w-[100%] h-[auto] max-height-[200px] object-fit-[contain] block" />
                                    </div>
              )}
                            </div>
                        </div>
          }

                    {/* Firmas */}
                    

                    {/* Evidencia Fotográfica */}
                    {report?.fotos && report.fotos.length > 0 &&
          <div className="mb-[1.2rem] page-break-inside-[avoid] border-[1px_solid_#cbd5e1] rounded-[6px]">
                            <div className="bg-[#1e293b] p-[0.5rem_1rem] flex items-center gap-[0.5rem]">
                                <span className="font-[900] text-[0.75rem] text-[#ffffff] uppercase letter-spacing-[0.04em]">EVIDENCIA FOTOGRÁFICA</span>
                            </div>
                            <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem] p-[1rem] bg-[#ffffff]">
                                {report.fotos.map((photo: string, i: number) =>
              <div key={i} className="aspect-ratio-[4/3] bg-[#f1f5f9] rounded-[4px] overflow-[hidden] border-[1px_solid_#e2e8f0]">
                                        <img src={photo} alt={"Evidencia " + (i + 1)} className="w-[100%] h-[100%] object-fit-[cover]" />
                                    </div>
              )}
                            </div>
                        </div>
          }

                        <PdfSignatures
            data={report}
            box1={report.showSignatures?.operator ? {
              title: 'ACCIDENTADO / TESTIGO',
              subtitle: 'Declaración y firma',
              signatureUrl: report.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={report.showSignatures?.professional ? {
              title: 'PROFESIONAL H&S',
              subtitle: (actName || 'Firma de Especialista').toUpperCase(),
              signatureUrl: actSignature || null,
              stampUrl: report.professionalStamp || actStamp || null,
              isProfessional: true,
              license: actLic || null
            } : null}
            box3={report.showSignatures?.supervisor ? {
              title: 'SUPERVISOR / EMPLEADOR',
              subtitle: 'Validación del informe',
              signatureUrl: report.signature || report.supervisorSignature || null,
              isProfessional: false
            } : null} />
          

                    <PdfBrandingFooter />
                </div>
            </div>
        </div>);

}