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
    margin: 14mm 12mm 16mm 12mm;
  }
  .ats-pdf-root {
    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 8pt;
    line-height: 1.3;
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
    padding: 0.25rem 0.35rem;
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
    width: 20px;
    height: 20px;
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
        if (lsStamp) actSignature = JSON.parse(lsStamp).signature;
        else if (legacySig) actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch {
      /* ignore */
    }
  }

  return { actSignature, actName, actLic };
}

function statusClass(estado: string): string {
  if (estado === 'Cumple' || estado === 'SI') return 'is-on';
  if (estado === 'No Cumple' || estado === 'NO') return 'is-fail';
  return 'is-na';
}

function StatusCell({ label, active }: { label: string; active: boolean }) {
  const estado = label === 'SI' ? 'Cumple' : label === 'NO' ? 'No Cumple' : 'N/A';
  return (
    <td className="ats-pdf-status">
      <div className={`ats-pdf-status-box ${active ? statusClass(estado) : ''}`}>
        {active && <span style={{ fontSize: '8.5pt', fontWeight: 900, lineHeight: 1 }}>✓</span>}
        <div style={{ fontSize: '5.5pt', fontWeight: 800, marginTop: active ? '1px' : '0', color: active ? 'inherit' : '#94a3b8' }}>
          {label}
        </div>
      </div>
    </td>
  );
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
    <div className="ats-pdf-offscreen-wrap" style={{ width: '100%' }}>
      <div
        id={pdfElementId}
        className="pdf-container print-area ats-pdf-root"
        style={{
          width: '100%',
          maxWidth: '210mm',
          padding: '10mm 12mm',
          background: '#ffffff',
          color: '#0f172a',
          margin: '0 auto',
          borderTop: '6px solid #1d4ed8',
        }}
      >
        <style type="text/css">{PDF_STYLES}</style>

        {/* Encabezado */}
        <div className="ats-pdf-section ats-pdf-section-compact" style={{ borderBottom: '3px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Sistema de Gestión · Higiene y Seguridad
              </div>
              <h1 style={{ margin: '0.35rem 0 0', fontSize: '22pt', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1 }}>
                Análisis de Trabajo Seguro
              </h1>
              <div style={{ marginTop: '0.35rem', fontSize: '8pt', color: '#3b82f6', fontWeight: 800, letterSpacing: '0.08em' }}>
                ATS · DOCUMENTO TÉCNICO
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <CompanyLogo style={{ height: '38px', maxWidth: '130px', marginLeft: 'auto' }} />
              <div style={{ marginTop: '0.5rem', fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Ref. {docId}
              </div>
            </div>
          </div>
        </div>

        {/* Datos del trabajo */}
        <div className="ats-pdf-section ats-pdf-section-compact">
          <table className="ats-pdf-table" style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word',  marginBottom: 0 }}>
            <tbody>
              <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td style={{ width: '42%', background: '#f8fafc' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Cliente / Empresa</div>
                  <div style={{ fontWeight: 800, fontSize: '10.5pt' }}>{data.empresa || '—'}</div>
                </td>
                <td style={{ width: '22%', background: '#f8fafc' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>CUIT / CUIL</div>
                  <div style={{ fontWeight: 700, fontSize: '9.5pt' }}>{data.cuit || '—'}</div>
                </td>
                <td style={{ width: '36%', background: '#f8fafc' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Ubicación / Obra</div>
                  <div style={{ fontWeight: 800, fontSize: '10.5pt' }}>{data.obra || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td colSpan={1}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fecha de ejecución</div>
                  <div style={{ fontWeight: 700 }}>{formatDate(data.fecha)}</div>
                </td>
                <td colSpan={2}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Responsable de tarea</div>
                  <div style={{ fontWeight: 700 }}>{data.capatazNombre || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td colSpan={3}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Descripción de la tarea</div>
                  <div style={{ fontWeight: 700, fontSize: '10pt', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{data.tarea || '—'}</div>
                </td>
              </tr>
              <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td colSpan={3} style={{ background: '#eff6ff' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Profesional HyS actuante</div>
                  <div style={{ fontWeight: 800 }}>{actName || '—'}{actLic ? ` · Mat. ${actLic}` : ''}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Secuencia de tareas */}
        {tareas.length > 0 && (
          <div className="ats-pdf-section">
            <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: '0.6rem', marginBottom: '0.65rem' }}>
              1. Secuencia de tareas y análisis de riesgos
            </div>
            <table className="ats-pdf-table" style={{ width: '100%', tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <th style={{ width: '6%' }}>#</th>
                  <th style={{ width: '30%' }}>Paso a seguir</th>
                  <th style={{ width: '30%' }}>Riesgos asociados</th>
                  <th style={{ width: '34%' }}>Medidas de control</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea, i) => (
                  <tr key={tarea.id ?? i} className="avoid-break" style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#64748b' }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, fontSize: '9pt' }}>{tarea.paso || '—'}</td>
                    <td style={{ fontSize: '8.5pt', color: '#475569' }}>{tarea.riesgo || '—'}</td>
                    <td style={{ fontSize: '8.5pt', fontWeight: 700, color: '#047857' }}>{tarea.control || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Checklist */}
        {categories.length > 0 && (
          <div className="ats-pdf-section">
            <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: '0.6rem', marginBottom: '0.65rem', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
              2. Verificación de seguridad pre-operativa
            </div>
            {categories.map((categoria, catIndex) => {
              const categoryItems = checklist.filter((item) => item.categoria === categoria);
              return (
                <div key={catIndex} className="ats-pdf-category-block">
                  <div
                    style={{
                      background: '#e2e8f0',
                      color: '#0f172a',
                      borderBottom: '2px solid #cbd5e1',
                      padding: '0.45rem 0.75rem',
                      fontSize: '8.5pt',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderRadius: '6px 6px 0 0',
                    }}
                  >
                    <span style={{ color: '#3b82f6', fontSize: '9pt', lineHeight: 1 }}>■</span>
                    {categoria}
                  </div>
                  <table className="ats-pdf-table" style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word',  borderTop: 'none' }}>
                    <colgroup>
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '40%' }} />
                      <col style={{ width: '36%' }} />
                    </colgroup>
                    <thead>
                      <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{item.pregunta}</td>
                            <td style={{ fontSize: '8pt', color: '#64748b' }}>{item.observaciones || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Firmas */}
        <div className="ats-pdf-section ats-pdf-section-compact avoid-break" style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: '0.6rem', marginBottom: '0.75rem' }}>
            3. Firmas y autorizaciones
          </div>
          <PdfSignatures
            data={data}
            box1={
              showSignatures?.operator
                ? {
                    title: 'OPERADOR / CAPATAZ',
                    subtitle: (data.capatazNombre || 'Firma y aclaración').toUpperCase(),
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false,
                  }
                : null
            }
            box2={
              showSignatures?.supervisor
                ? {
                    title: 'SUPERVISOR / JEFE DE OBRA',
                    subtitle: 'APROBACIÓN Y LIBERACIÓN',
                    signatureUrl: data.capatazSignature || null,
                    isProfessional: false,
                  }
                : null
            }
            box3={
              showSignatures?.professional
                ? {
                    title: 'PROFESIONAL ACTUANTE',
                    subtitle: (actName || 'Firma y sello').toUpperCase(),
                    signatureUrl: actSignature,
                    isProfessional: true,
                    license: actLic,
                  }
                : null
            }
          />
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', fontSize: '7pt', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
          Documento generado por Asistente HYS · {formatDate(new Date().toISOString().split('T')[0])} · Uso exclusivo técnico-profesional
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}
