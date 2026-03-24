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
  [key: string]: unknown;
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
          padding: '15mm', background: '#ffffff', color: '#000000',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
          boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
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
          `}
        </style>

        {/* Header Sequence */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control HYS</p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>A.T.S.</h1>
            <p style={{ margin: 0, color: '#64748b', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Análisis de Trabajo Seguro</p>
          </div>

          <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <CompanyLogo
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain',
                maxWidth: '120px'
              }}
            />
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>01 / 01</div>
            </div>
          </div>
        </div>

        {/* Primary Info Box */}
        <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #e2e8f0' }}>
            <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>EMPRESA / CLIENTE</span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.empresa || '-'}</span>
            </div>
            <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>OBRA / UBICACIÓN</span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.obra || '-'}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA</span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.fecha ? new Date(data.fecha).toLocaleDateString('es-AR') : '-'}</span>
            </div>
            <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>SUPERVISOR</span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.supervisor || '-'}</span>
            </div>
          </div>
        </div>

        {/* Tareas */}
        {tareas.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pencil size={20} color="#3b82f6" />
              TAREAS A REALIZAR
            </h2>
            <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 900, color: '#64748b' }}>#</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 900, color: '#64748b' }}>PASO / TAREA</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 900, color: '#64748b' }}>RIESGO</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 900, color: '#64748b' }}>CONTROL</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map((tarea: any, i: number) => {
                    const isObject = typeof tarea === 'object' && tarea !== null;
                    return (
                      <tr key={i} style={{ borderBottom: i < tareas.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 800 }}>{i + 1}</td>
                        <td style={{ padding: '0.8rem', fontWeight: 700 }}>{isObject ? tarea.paso : tarea}</td>
                        <td style={{ padding: '0.8rem' }}>{isObject ? tarea.riesgo : '-'}</td>
                        <td style={{ padding: '0.8rem' }}>{isObject ? tarea.control : '-'}</td>
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
            <div key={catIndex} style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 900,
                color: '#ffffff',
                background: '#3b82f6',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={20} color="#ffffff" />
                {categoria?.toUpperCase() || 'GENERAL'}
              </h2>
              <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                {categoryItems.map((item: ChecklistItem, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    style={{
                      padding: '0.7rem 1rem',
                      borderBottom: itemIndex < categoryItems.length - 1 ? '1px solid #e2e8f0' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.8rem'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: (item.estado === 'Cumple' || item.cumple) ? '#10b981' : (item.estado === 'N/A' ? '#94a3b8' : '#ef4444'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <ShieldCheck size={14} color="#ffffff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{item.pregunta}</p>
                      {item.observaciones && (
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                          <Info size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                          {item.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer informativo */}
        <PdfBrandingFooter />
      </div>
    </div>
  );
}
