import React from 'react';
import { ShieldCheck, Pencil, Info, LucideIcon } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

// Tipos
interface ChecklistItem {
  id: string | number;
  categoria: string;
  pregunta: string;
  estado: string; // 'Cumple', 'No Cumple', 'N/A'
  cumple?: boolean; // Keep for backward compatibility if needed
  observaciones?: string;
}

interface TareaItem {
  id: number;
  paso: string;
  riesgo: string;
  control: string;
  realizado: boolean;
}

interface ATSData {
  id?: string | number;
  empresa?: string;
  obra?: string;
  fecha?: string;
  supervisor?: string;
  tareas?: any[]; // Handle both string[] and TareaItem[]
  checklist?: ChecklistItem[];
  capatazSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
  [key: string]: any;
}

interface ATSPdfGeneratorProps {
  atsData: ATSData;
}

export default function ATSPdfGenerator({ atsData }: ATSPdfGeneratorProps): React.ReactElement | null {
  if (!atsData) return null;

  const data = atsData;
  const tareas = data.tareas || [];
  const checklist = data.checklist || [];

  // Extract unique categories from checklist
  const categories = [...new Set(checklist.map(item => item.categoria))];

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        id="pdf-content"
        className="pdf-container print-area"
        style={{
          width: '100%', maxWidth: '210mm', minHeight: '297mm',
          padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
          boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
          fontFamily: 'Helvetica, Arial, sans-serif',
          borderTop: '12px solid #2563eb' // Brand color top bar
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 5mm !important;
              width: 100% !important;
              max-width: none !important;
              border-top: 12px solid #2563eb !important;
              border-radius: 0 !important;
            }
            .company-logo {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}
        </style>

        {/* Header Sequence */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.8rem', width: '100%' }}>
          
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#2563eb' }}>Doc. Controlado</p>
          </div>

          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ATS</h1>
            <div style={{ marginTop: '0.3rem', background: '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
              ANÁLISIS DE TRABAJO SEGURO
            </div>
          </div>

          <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <CompanyLogo
              style={{
                height: '38px',
                width: 'auto',
                objectFit: 'contain',
                maxWidth: '120px'
              }}
            />
          </div>
        </div>

        {/* Primary Info Box - Professional Grid */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '2rem', width: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <div style={{ flex: '1.5', padding: '0.6rem 0.8rem', borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPRESA / CONTRATISTA</span>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.empresa || '-'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.6rem 0.8rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OBRA / UBICACIÓN</span>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.obra || '-'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', background: '#ffffff' }}>
            <div style={{ flex: '1', padding: '0.6rem 0.8rem', borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>FECHA DE EJECUCIÓN</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '0.1rem' }}>{data.fecha ? new Date(data.fecha).toLocaleDateString('es-AR') : '-'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.6rem 0.8rem', borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>RESPONSABLE / CAPATAZ</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '0.1rem' }}>{data.capatazNombre || 'No definido'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.6rem 0.8rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>SUPERVISOR H&S</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '0.1rem' }}>{data.supervisor || '-'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #cbd5e1', padding: '0.6rem 0.8rem', background: '#ffffff' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TAREA A REALIZAR (DESCRIPCIÓN GENERAL)</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.tarea || '-'}</div>
          </div>
        </div>

        {/* Tareas */}
        {tareas.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem' }}>
              Secuencia de Tareas y Análisis Quirúrgico
            </h2>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#475569', width: '30px' }}>#</th>
                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '30%' }}>PASO DE LA TAREA</th>
                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '30%' }}>RIESGO IDENTIFICADO</th>
                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '40%' }}>MEDIDA PREVENTIVA / CONTROL</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map((tarea: any, i: number) => {
                    const isObject = typeof tarea === 'object' && tarea !== null;
                    return (
                      <tr key={i} style={{ borderBottom: i < tareas.length - 1 ? '1px solid #e2e8f0' : 'none', background: i % 2 !== 0 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{i + 1}</td>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#1e293b' }}>{isObject ? tarea.paso : tarea}</td>
                        <td style={{ padding: '0.6rem 0.8rem', color: '#334155', fontStyle: 'italic' }}>{isObject ? tarea.riesgo : '-'}</td>
                        <td style={{ padding: '0.6rem 0.8rem', color: '#10b981', fontWeight: 600 }}>{isObject ? tarea.control : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Checklist por categorías */}
        {categories.length > 0 && categories.map((categoria: string, catIndex: number) => {
          const categoryItems = checklist.filter(item => item.categoria === categoria);
          return (
            <div key={catIndex} style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
              <div style={{
                background: '#1e293b',
                color: '#ffffff',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px 6px 0 0',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <ShieldCheck size={14} color="#ffffff" />
                {categoria?.toUpperCase() || 'GENERAL'}
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <tbody>
                    {categoryItems.map((item: ChecklistItem, itemIndex: number) => {
                      const finalStatus = item.estado || (item.cumple ? 'Cumple' : 'No Cumple');
                      let statusColor = '#94a3b8';
                      let bgStatus = '#f8fafc';
                      if (finalStatus === 'Cumple' || finalStatus === 'SI') { statusColor = '#10b981'; bgStatus = '#ecfdf5'; }
                      if (finalStatus === 'No Cumple' || finalStatus === 'NO') { statusColor = '#ef4444'; bgStatus = '#fef2f2'; }

                      return (
                        <tr key={itemIndex} style={{ borderBottom: itemIndex < categoryItems.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                          <td style={{ padding: '0.5rem 0.8rem', verticalAlign: 'middle', width: '35px' }}>
                            <div style={{ border: `1.5px solid ${statusColor}`, background: bgStatus, color: statusColor, fontSize: '0.55rem', fontWeight: 800, textAlign: 'center', padding: '0.2rem', borderRadius: '4px', minWidth: '24px' }}>
                              {finalStatus.toUpperCase() === 'CUMPLE' ? 'OK' : finalStatus.toUpperCase() === 'NO CUMPLE' ? 'NO' : finalStatus.toUpperCase()}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.8rem', verticalAlign: 'middle', fontWeight: 600, color: '#334155', width: '45%' }}>
                            {item.pregunta}
                          </td>
                          <td style={{ padding: '0.5rem 0.8rem', verticalAlign: 'middle', color: '#64748b', fontSize: '0.7rem', width: '50%', borderLeft: '1px dashed #e2e8f0' }}>
                            {item.observaciones ? <><span style={{ fontWeight: 700 }}>Obs: </span>{item.observaciones}</> : <span style={{ color: '#cbd5e1' }}>Sin observaciones.</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Firmas de Responsabilidad */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
          
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #ndndnd', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Original</span>
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Firma de conformidad técnica</p>
          </div>

          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #ndndnd', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
              {data.capatazSignature ? (
                <img src={data.capatazSignature} alt="Firma Supervisor" style={{ maxHeight: '50px', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Original</span>
              )}
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR / PREVENCIONISTA</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Aprobación y Liberación</p>
          </div>

          <div style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem', position: 'relative' }}>
              {data.professionalSignature ? (
                <img src={data.professionalSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain', zIndex: 2 }} />
              ) : (
                <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
              )}
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>PROFESIONAL ACTUANTE</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>
              {data.professionalName || 'Firma de Especialista'}
            </p>
            {data.professionalLicense && (
              <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Lic: {data.professionalLicense}</p>
            )}
          </div>

        </div>

        {/* Footer informativo */}
        <PdfBrandingFooter />
      </div>
    </div>
  );
}
