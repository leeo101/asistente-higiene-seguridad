import React from 'react';
import PdfSignatures from './PdfSignatures';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

interface ChecklistItem {
  id: string | number;
  categoria: string;
  pregunta: string;
  estado: string;
  observaciones?: string;
}

interface TareaItem {
  id: number;
  paso: string;
  riesgo: string;
  control: string;
  realizado?: boolean;
}

interface ATSData {
  empresa?: string;
  cuit?: string;
  obra?: string;
  tarea?: string;
  fecha?: string;
  capatazNombre?: string;
  tareas?: TareaItem[];
  checklist?: ChecklistItem[];
  operatorSignature?: string | null;
  capatazSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };
  [key: string]: unknown;
}

interface ATSPdfGeneratorProps {
  atsData: ATSData | null;
  pdfElementId?: string;
}

const PDF_STYLES = `
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 12mm 10mm;
  }
  .ats-pdf-root {
    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 7.5pt;
    line-height: 1.25;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ats-pdf-root * {
    box-sizing: border-box;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .ats-pdf-section {
    margin-bottom: 0.8rem;
  }
  .ats-pdf-section-compact {
  }
  .ats-pdf-category-block {
    margin-bottom: 0.5rem;
    break-inside: auto;
    page-break-inside: auto;
  }
  .ats-pdf-category-header {
    break-after: avoid;
    page-break-after: avoid;
  }
  .ats-pdf-root .no-break {
    margin-top: 0.8rem !important;
  }
  .ats-pdf-root > .ats-pdf-offscreen-wrap {
    display: block !important;
    width: 100% !important;
  }
  .ats-pdf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .ats-pdf-table th,
  .ats-pdf-table td {
    border: 1px solid #cbd5e1;
    padding: 0.15rem 0.25rem;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .ats-pdf-table thead th {
    background: #f1f5f9;
    font-size: 6.5pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #475569;
    letter-spacing: 0.04em;
  }
  .ats-pdf-check-row td {
    font-size: 7pt;
  }
  .ats-pdf-status {
    text-align: center;
    vertical-align: middle;
    padding: 0.15rem !important;
  }
  .ats-pdf-status-box {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid transparent;
    margin: 0 auto;
  }
  .ats-pdf-status-box.is-on {
    background: #ecfdf5;
    border: 2px solid #059669 !important;
    color: #059669;
  }
  .ats-pdf-status-box.is-fail {
    background: #fef2f2;
    border: 2px solid #dc2626 !important;
    color: #dc2626;
  }
  .ats-pdf-status-box.is-na {
    background: #f8fafc;
    border: 2px solid #64748b !important;
    color: #64748b;
  }
  @media print {
    .ats-pdf-root {
      box-shadow: none !important;
      border-radius: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }
`;

function formatDate(fecha?: string): string {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return fecha;
  }
}

function resolveProfessional(data: ATSData) {
  let actSignature = data.professionalSignature || null;
  let actName = data.professionalName || null;
  let actLic = data.professionalLicense || null;

  if (!actSignature || !actName) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;

      if (!actSignature) {
        if (lsStamp) actSignature = JSON.parse(lsStamp).signature;else
        if (legacySig) actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch {

      /* ignore */}
  }

  return { actSignature, actName, actLic };
}

function statusClass(estado: string): string {
  if (estado === 'Cumple' || estado === 'SI') return 'is-on';
  if (estado === 'No Cumple' || estado === 'NO') return 'is-fail';
  return 'is-na';
}

function StatusCell({ label, active }: {label: string;active: boolean;}) {
  const estado = label === 'SI' ? 'Cumple' : label === 'NO' ? 'No Cumple' : 'N/A';
  return (
    <td className="ats-pdf-status">
      <div className={`ats-pdf-status-box ${active ? statusClass(estado) : ''}`}>
        {active && <span className="text-[8.5pt] font-[900] line-height-[1]">✓</span>}
        <div style={{ marginTop: active ? '1px' : '0', color: active ? 'inherit' : '#94a3b8' }} className="text-[5.5pt] font-[800]">
          {label}
        </div>
      </div>
    </td>);

}

export default function ATSPdfGenerator({ atsData, pdfElementId = 'pdf-content' }: ATSPdfGeneratorProps): React.ReactElement | null {
  if (!atsData) return null;

  const data = atsData;
  const showSignatures = data.showSignatures || { operator: true, supervisor: true, professional: true };
  const { actSignature, actName, actLic } = resolveProfessional(data);
  const tareas = data.tareas || [];
  const checklist = data.checklist || [];
  const categories = [...new Set(checklist.map((item) => item.categoria))];
  const docId = data.id ? String(data.id).slice(-8).toUpperCase() : 'BORRADOR';

  return (
    <div className="ats-pdf-offscreen-wrap w-[100%]">
      <div
        id={pdfElementId}
        className="pdf-container print-area ats-pdf-root w-[100%] max-w-[210mm] p-[6mm_10mm] bg-[#ffffff] text-[#0f172a] m-[0_auto] border-top-[6px_solid_#1d4ed8]">









        
        <style type="text/css">{PDF_STYLES}</style>

        {/* Encabezado */}
        <div className="ats-pdf-section ats-pdf-section-compact border-bottom-[3px_solid_#e2e8f0] pb-[0.6rem] mb-[0.8rem]">
          <div className="flex justify-space-between items-start gap-[0.8rem]">
            <div className="flex-[1]">
              <div className="text-[6.5pt] font-[800] text-[#64748b] letter-spacing-[0.12em] uppercase">
                Sistema de Gestión · Higiene y Seguridad
              </div>
              <h1 className="m-[0.2rem_0_0] text-[18pt] font-[900] letter-spacing-[-0.02em] text-[#0f172a] line-height-[1]">
                Análisis de Trabajo Seguro
              </h1>
              <div className="mt-[0.2rem] text-[7.5pt] text-[#3b82f6] font-[800] letter-spacing-[0.08em]">
                ATS · DOCUMENTO TÉCNICO
              </div>
            </div>
            <div className="text-right min-width-[100px]">
              <CompanyLogo className="h-[32px] max-w-[110px] ml-[auto]" />
              <div className="mt-[0.3rem] text-[6.5pt] font-[800] text-[#94a3b8] uppercase">
                Ref. {docId}
              </div>
            </div>
          </div>
        </div>

        {/* Datos del trabajo */}
        <div className="ats-pdf-section ats-pdf-section-compact">
          <table className="ats-pdf-table table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] mb-[0]">
            <tbody>
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                <td className="w-[42%] bg-[#f8fafc]">
                  <div className="text-[7pt] font-[800] text-[#3b82f6] uppercase mb-[0.2rem]">Cliente / Empresa</div>
                  <div className="font-[800] text-[10.5pt]">{data.empresa || '—'}</div>
                </td>
                <td className="w-[22%] bg-[#f8fafc]">
                  <div className="text-[7pt] font-[800] text-[#64748b] uppercase mb-[0.2rem]">CUIT / CUIL</div>
                  <div className="font-[700] text-[9.5pt]">{data.cuit || '—'}</div>
                </td>
                <td className="w-[36%] bg-[#f8fafc]">
                  <div className="text-[7pt] font-[800] text-[#3b82f6] uppercase mb-[0.2rem]">Ubicación / Obra</div>
                  <div className="font-[800] text-[10.5pt]">{data.obra || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                <td colSpan={1}>
                  <div className="text-[7pt] font-[800] text-[#64748b] uppercase mb-[0.2rem]">Fecha de ejecución</div>
                  <div className="font-[700]">{formatDate(data.fecha)}</div>
                </td>
                <td colSpan={2}>
                  <div className="text-[7pt] font-[800] text-[#64748b] uppercase mb-[0.2rem]">Responsable de tarea</div>
                  <div className="font-[700]">{data.capatazNombre || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                <td colSpan={3}>
                  <div className="text-[7pt] font-[800] text-[#64748b] uppercase mb-[0.2rem]">Descripción de la tarea</div>
                  <div className="font-[700] text-[10pt] line-height-[1.5] white-space-[pre-wrap]">{data.tarea || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                <td colSpan={3} className="bg-[#eff6ff]">
                  <div className="text-[7pt] font-[800] text-[#1d4ed8] uppercase mb-[0.2rem]">Profesional HyS actuante</div>
                  <div className="font-[800]">{actName || '—'}{actLic ? ` · Mat. ${actLic}` : ''}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Secuencia de tareas */}
        {tareas.length > 0 &&
        <div className="ats-pdf-section">
            <div className="text-[9pt] font-[900] uppercase text-[#0f172a] border-left-[4px_solid_#2563eb] pl-[0.6rem] mb-[0.65rem]">
              1. Secuencia de tareas y análisis de riesgos
            </div>
            <table className="ats-pdf-table w-[100%] table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] border-collapse-[collapse]">
              <thead>
                <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                  <th className="w-[6%]">#</th>
                  <th className="w-[30%]">Paso a seguir</th>
                  <th className="w-[30%]">Riesgos asociados</th>
                  <th className="w-[34%]">Medidas de control</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea, i) =>
              <tr key={tarea.id ?? i} className="avoid-break" style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                    <td className="text-center font-[800] text-[#64748b]">{i + 1}</td>
                    <td className="font-[700] text-[9pt]">{tarea.paso || '—'}</td>
                    <td className="text-[8.5pt] text-[#475569]">{tarea.riesgo || '—'}</td>
                    <td className="text-[8.5pt] font-[700] text-[#047857]">{tarea.control || '—'}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }

        {/* Checklist */}
        {categories.length > 0 &&
        <div className="ats-pdf-section">
            <div className="text-[9pt] font-[900] uppercase text-[#0f172a] border-left-[4px_solid_#2563eb] pl-[0.6rem] mb-[0.65rem] break-after-[avoid] page-break-after-[avoid]">
              2. Verificación de seguridad pre-operativa
            </div>
            {categories.map((categoria, catIndex) => {
            const categoryItems = checklist.filter((item) => item.categoria === categoria);
            return (
              <div key={catIndex} className="ats-pdf-category-block">
                  <div className="bg-[#e2e8f0] text-[#0f172a] border-bottom-[2px_solid_#cbd5e1] p-[0.45rem_0.75rem] text-[8.5pt] font-[900] uppercase letter-spacing-[0.06em] flex items-center gap-[0.4rem] rounded-[6px_6px_0_0]">














                  
                    <span className="text-[#3b82f6] text-[9pt] line-height-[1]">■</span>
                    {categoria}
                  </div>
                  <table className="ats-pdf-table table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] border-top-[none]">
                    <colgroup>
                      <col className="w-[8%]" />
                      <col className="w-[8%]" />
                      <col className="w-[8%]" />
                      <col className="w-[40%]" />
                      <col className="w-[36%]" />
                    </colgroup>
                    <thead>
                      <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                        <th>SI</th>
                        <th>NO</th>
                        <th>N/A</th>
                        <th>Ítem de verificación</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryItems.map((item, itemIndex) => {
                      const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                      const isNO = item.estado === 'No Cumple' || item.estado === 'NO';
                      const isNA = item.estado === 'N/A' || item.estado === 'NA';
                      return (
                        <tr key={item.id ?? itemIndex} className="ats-pdf-check-row avoid-break" style={{ background: itemIndex % 2 === 1 ? '#f8fafc' : '#fff' }}>
                            <StatusCell label="SI" active={isSI} />
                            <StatusCell label="NO" active={isNO} />
                            <StatusCell label="N/A" active={isNA} />
                            <td className="font-[600] text-[#1e293b]">{item.pregunta}</td>
                            <td className="text-[8pt] text-[#64748b]">{item.observaciones || '—'}</td>
                          </tr>);

                    })}
                    </tbody>
                  </table>
                </div>);

          })}
          </div>
        }

        {/* Firmas */}
        <div className="ats-pdf-section ats-pdf-section-compact avoid-break mt-[0.75rem]">
          <div className="text-[9pt] font-[900] uppercase text-[#0f172a] border-left-[4px_solid_#2563eb] pl-[0.6rem] mb-[0.75rem]">
            3. Firmas y autorizaciones
          </div>
          <PdfSignatures
            data={data}
            box1={
            showSignatures?.operator ?
            {
              title: 'OPERADOR / CAPATAZ',
              subtitle: (data.capatazNombre || 'Firma y aclaración').toUpperCase(),
              signatureUrl: data.operatorSignature || null,
              isProfessional: false
            } :
            null
            }
            box2={
            showSignatures?.supervisor ?
            {
              title: 'SUPERVISOR / JEFE DE OBRA',
              subtitle: 'APROBACIÓN Y LIBERACIÓN',
              signatureUrl: data.capatazSignature || null,
              isProfessional: false
            } :
            null
            }
            box3={
            showSignatures?.professional ?
            {
              title: 'PROFESIONAL ACTUANTE',
              subtitle: (actName || 'Firma y sello').toUpperCase(),
              signatureUrl: actSignature,
              isProfessional: true,
              license: actLic
            } :
            null
            } />
          
        </div>

        <div className="mt-[1rem] pt-[0.75rem] border-top-[1px_solid_#e2e8f0] text-[7pt] text-[#94a3b8] text-center font-[600]">
          Documento generado por Asistente HYS · {formatDate(new Date().toISOString().split('T')[0])} · Uso exclusivo técnico-profesional
        </div>

        <PdfBrandingFooter />
      </div>
    </div>);

}