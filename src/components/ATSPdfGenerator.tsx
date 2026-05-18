import React from 'react';
import PdfSignatures from './PdfSignatures';
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
  operatorSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };
  [key: string]: any;
}

interface ATSPdfGeneratorProps {
  atsData: ATSData;
}

export default function ATSPdfGenerator({ atsData }: ATSPdfGeneratorProps): React.ReactElement | null {
  if (!atsData) return null;

  const data = atsData;
  const showSignatures = data.showSignatures || { operator: true, supervisor: true, professional: true };

    // Obtención segura de firma profesional desde localStorage
    let actSignature = data.professionalSignature || data.signature || data.auditorSignature || null;
    let actName = data.professionalName || data.leadAuditor || data.expositor || null;
    let actLic = data.professionalLicense || data.license || null;
    
    // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
    if (!actSignature) {
        try {
            const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
            const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
            const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;
            
            if (lsStamp) { actSignature = JSON.parse(lsStamp).signature; }
            else if (legacySig) { actSignature = legacySig; }
            
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch(e) {}
    }

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
            .signature-container-row {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              gap: 1rem !important;
              width: 100% !important;
              margin-top: 2rem !important;
            }
            .signature-item-box {
              flex: 1 !important;
              max-width: none !important;
              padding: 1rem !important;
              margin-top: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              border-radius: 8px !important;
              text-align: center !important;
            }
            .signature-line {
              width: 100% !important;
              border-bottom: 1.5px solid #cbd5e1 !important;
              margin-bottom: 0.5rem !important;
              margin-top: 0.5rem !important;
            }
          `}
        </style>

        {/* Professional Header */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f1f5f9', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%', gap: '1rem' }}>
          
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}>Sistema de Gestión</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#0f172a' }}>Control H&S</p>
          </div>

          <div style={{ flex: 2, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9, color: '#0f172a' }}>A.T.S.</h1>
            <div style={{ marginTop: '0.3rem', background: '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
              ANÁLISIS DE TRABAJO SEGURO
            </div>
          </div>

          <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
            <CompanyLogo style={{ height: '35px', maxWidth: '120px' }} />
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Doc. Controlado</div>






          </div>
        </div>

        {/* Primary Info Box - Professional Grid */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ flex: '1.5', padding: '0.8rem 1rem', borderRight: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPRESA / CONTRATISTA</span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.empresa || '-'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.8rem 1rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OBRA / UBICACIÓN</span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.obra || '-'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', background: '#ffffff' }}>
            <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>FECHA DE EJECUCIÓN</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.1rem' }}>{data.fecha ? new Date(data.fecha).toLocaleDateString('es-AR') : '-'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>RESPONSABLE / CAPATAZ</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.1rem' }}>{data.capatazNombre || 'No definido'}</div>
            </div>
            <div style={{ flex: '1', padding: '0.8rem 1rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>SUPERVISOR H&S</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.1rem' }}>{data.supervisor || '-'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.8rem 1rem', background: '#ffffff' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TAREA A REALIZAR (DESCRIPCIÓN GENERAL)</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginTop: '0.2rem', lineHeight: 1.4 }}>{data.tarea || '-'}</div>
          </div>
        </div>

        {/* Tareas */}
        {tareas.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.8rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid #3b82f6', paddingLeft: '0.8rem' }}>
              Secuencia de Tareas y Análisis de Riesgos
            </h2>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 800, color: '#475569', width: '40px' }}>#</th>
                    <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '30%' }}>PASO DE LA TAREA</th>
                    <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '30%' }}>RIESGO IDENTIFICADO</th>
                    <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 800, color: '#475569', width: '40%' }}>MEDIDA PREVENTIVA / CONTROL</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map((tarea: any, i: number) => {
                    const isObject = typeof tarea === 'object' && tarea !== null;
                    return (
                      <tr key={i} style={{ borderBottom: i < tareas.length - 1 ? '1px solid #f1f5f9' : 'none', background: i % 2 !== 0 ? '#fcfdfe' : '#ffffff' }}>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>{String(i + 1).padStart(2, '0')}</td>
                        <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{isObject ? tarea.paso : tarea}</td>
                        <td style={{ padding: '0.8rem 1rem', color: '#64748b', fontSize: '0.75rem', lineHeight: 1.4 }}>{isObject ? tarea.riesgo : '-'}</td>
                        <td style={{ padding: '0.8rem 1rem', color: '#059669', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.4 }}>{isObject ? tarea.control : '-'}</td>
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
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.6rem 1rem',
                borderRadius: '8px 8px 0 0',
                fontSize: '0.8rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                letterSpacing: '0.05em'
              }}>
                <ShieldCheck size={16} color="#3b82f6" />
                {categoria?.toUpperCase() || 'GENERAL'}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <tbody>
                    {categoryItems.map((item: ChecklistItem, itemIndex: number) => {
                      const finalStatus = item.estado || (item.cumple ? 'Cumple' : 'No Cumple');
                      let statusColor = '#94a3b8';
                      let bgStatus = '#f8fafc';
                      if (finalStatus === 'Cumple' || finalStatus === 'SI') { statusColor = '#059669'; bgStatus = '#ecfdf5'; }
                      if (finalStatus === 'No Cumple' || finalStatus === 'NO') { statusColor = '#dc2626'; bgStatus = '#fef2f2'; }

                      return (
                        <tr key={itemIndex} style={{ borderBottom: itemIndex < categoryItems.length - 1 ? '1px solid #f1f5f9' : 'none', background: itemIndex % 2 !== 0 ? '#fcfdfe' : '#ffffff' }}>
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', width: '45px' }}>
                            <div style={{ 
                              border: `1.5px solid ${statusColor}`, 
                              background: bgStatus, 
                              color: statusColor, 
                              fontSize: '0.6rem', 
                              fontWeight: 900, 
                              textAlign: 'center', 
                              padding: '0.25rem', 
                              borderRadius: '6px', 
                              minWidth: '30px' 
                            }}>
                              {finalStatus.toUpperCase() === 'CUMPLE' ? 'OK' : finalStatus.toUpperCase() === 'NO CUMPLE' ? 'NO' : finalStatus.toUpperCase()}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', fontWeight: 600, color: '#334155', width: '45%', fontSize: '0.8rem' }}>
                            {item.pregunta}
                          </td>
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', color: '#64748b', fontSize: '0.75rem', width: '50%', borderLeft: '1px dashed #e2e8f0', fontStyle: item.observaciones ? 'normal' : 'italic' }}>
                            {item.observaciones ? <><span style={{ fontWeight: 800, color: '#475569' }}>OBSERVACIONES: </span>{item.observaciones}</> : <span style={{ color: '#cbd5e1' }}>Sin observaciones registradas.</span>}
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
        <PdfSignatures 
          data={data}
          box1={showSignatures?.operator ? {
            title: 'OPERADOR / RESPONSABLE',
            subtitle: data.capatazNombre || 'Firma de Conformidad',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false,
            customContent: <p style={{ margin: 0, fontSize: '0.5rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Validación Técnica</p>
          } : null}
          box2={showSignatures?.supervisor ? {
            title: 'SUPERVISOR / JEFE OBRA',
            subtitle: 'Aprobación y Liberación',
            signatureUrl: data.capatazSignature || null,
            isProfessional: false,
            customContent: <p style={{ margin: 0, fontSize: '0.5rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Control Jerárquico</p>
          } : null}
          box3={showSignatures?.professional ? {
            title: 'PROFESIONAL ACTUANTE',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature,
            isProfessional: true,
            license: actLic
          } : null}
        />

        {/* Footer informativo */}
        <PdfBrandingFooter />
      </div>
    </div>
  );
}

