import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';
import DualPdfHeader from './DualPdfHeader';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';
import { getSavedProfessionalData } from '../utils/jsPdfSignatureHelper';
import { DEFAULT_PROFESSION } from '../data/professionOptions';

const SEVERITY_BADGE: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  critical: { label: 'CRÍTICO', bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  major: { label: 'MAYOR', bg: '#ffedd5', text: '#9a3412', border: '#fb923c' },
  minor: { label: 'MENOR', bg: '#fef9c3', text: '#854d0e', border: '#facc15' },
  observation: { label: 'OBSERVACIÓN', bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' }
};

export default function AuditPdf({
  data,
  customId
}: {
  data: any;
  customId?: string;
}): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura y unificada de firma, sello y título profesional desde Mi Perfil
  const savedPro = getSavedProfessionalData();
  const actSignature =
    typeof data.signature === 'string' && data.signature.startsWith('data:image/')
      ? data.signature
      : savedPro.signature;
  const actStamp =
    typeof data.professionalStamp === 'string' && data.professionalStamp.startsWith('data:image/')
      ? data.professionalStamp
      : savedPro.stamp;
  const actName =
    data.professionalName || data.auditor || data.leadAuditor || savedPro.name || null;
  const actLic = data.license || data.professionalLicense || savedPro.license || null;
  const finalRoleTitle = (
    savedPro.profession ||
    data.auditorRole ||
    DEFAULT_PROFESSION
  ).toUpperCase();

  // Cómputo de métricas del checklist
  const checklist = Array.isArray(data.checklist) ? data.checklist : [];
  const totalItems = checklist.length;
  const conformitiesCount = checklist.filter((item: any) => item.status === 'si').length;
  const nonConformitiesCount = checklist.filter((item: any) => item.status === 'no').length;
  const naCount = checklist.filter((item: any) => item.status === 'na').length;
  const criticalCount = checklist.filter(
    (item: any) => item.status === 'no' && item.severity === 'critical'
  ).length;
  const majorCount = checklist.filter(
    (item: any) => item.status === 'no' && (item.severity === 'major' || !item.severity)
  ).length;

  const evaluatedItems = conformitiesCount + nonConformitiesCount;
  const complianceRate =
    evaluatedItems > 0
      ? Math.round((conformitiesCount / evaluatedItems) * 100)
      : data.complianceRate ?? 100;

  const nonConformitiesList = checklist.filter((item: any) => item.status === 'no');

  // Resumen agrupado por categoría / bloque
  const categorySummary = (() => {
    const map = new Map<
      string,
      { name: string; total: number; si: number; no: number; na: number }
    >();
    checklist.forEach((item: any) => {
      const cat = item.category || 'Relevamiento General';
      const entry = map.get(cat) || { name: cat, total: 0, si: 0, no: 0, na: 0 };
      entry.total += 1;
      if (item.status === 'si') entry.si += 1;
      else if (item.status === 'no') entry.no += 1;
      else entry.na += 1;
      map.set(cat, entry);
    });
    return Array.from(map.values()).map((c) => {
      const ev = c.si + c.no;
      const pct = ev > 0 ? Math.round((c.si / ev) * 100) : 100;
      return { ...c, evaluated: ev, pct };
    });
  })();

  // Clasificación automática del dictamen ejecutivo
  const dictamenMeta =
    criticalCount > 0 || (evaluatedItems > 0 && complianceRate < 65)
      ? {
          badge: 'DICTAMEN CONDICIONADO • ACCIÓN INMEDIATA REQUERIDA',
          color: '#b91c1c',
          bg: '#fef2f2',
          border: '#ef4444'
        }
      : nonConformitiesCount > 0
      ? {
          badge: 'DICTAMEN CON OBSERVACIONES • PLAN DE ADECUACIÓN ACTIVO',
          color: '#b45309',
          bg: '#fffbeb',
          border: '#f59e0b'
        }
      : {
          badge: 'DICTAMEN TÉCNICO FAVORABLE • CUMPLIMIENTO NORMATIVO ÓPTIMO',
          color: '#047857',
          bg: '#ecfdf5',
          border: '#10b981'
        };

  const auditTypeLabel =
    data.auditType === 'external'
      ? 'Auditoría Externa / ART'
      : data.auditType === 'certification'
      ? 'Auditoría de Certificación'
      : data.auditType === 'surveillance'
      ? 'Auditoría de Seguimiento'
      : data.auditType === 'compliance'
      ? 'Cumplimiento Legal SRT'
      : data.auditType === 'supplier'
      ? 'Auditoría a Contratista / Proveedor'
      : data.auditType === 'environmental'
      ? 'Auditoría Ambiental ISO 14001'
      : 'Auditoría Interna SGSST';

  const statusLabel =
    data.status === 'completed'
      ? 'COMPLETADA / CERRADA'
      : data.status === 'in_progress'
      ? 'EN EJECUCIÓN'
      : data.status === 'draft'
      ? 'BORRADOR'
      : 'PLANIFICADA';

  const rawDate = data.date || data.scheduledDate;
  const formattedDate = rawDate
    ? new Date(rawDate + (rawDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-AR')
    : '-';

  const closingDate = data.closingMeeting?.date
    ? new Date(
        data.closingMeeting.date +
          (data.closingMeeting.date.length === 10 ? 'T12:00:00' : '')
      ).toLocaleDateString('es-AR')
    : formattedDate;

  // Proporciones barra visual
  const siWidth = totalItems > 0 ? Math.round((conformitiesCount / totalItems) * 100) : 100;
  const noWidth = totalItems > 0 ? Math.round((nonConformitiesCount / totalItems) * 100) : 0;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        id={customId || 'pdf-content'}
        className="pdf-container print-area"
        style={{
          width: '100%',
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: '6mm 9mm',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxSizing: 'border-box',
          margin: '0 auto',
          fontSize: '8.5pt',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          borderTop: '5px solid #1e3a8a'
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 6mm 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; 
              background: #ffffff !important; 
              color: #0f172a !important;
            }
            .no-print, .module-form-layout, .module-form-toolbar, .module-action-bar, nav, aside, .sidebar { 
              display: none !important; 
            }
            .dual-pdf-header {
              display: block !important;
              visibility: visible !important;
            }
            .print-area {
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border-top: 5px solid #1e3a8a !important; 
              border-radius: 0 !important; 
              min-height: 0 !important; 
              height: auto !important; 
              max-height: none !important;
            }
            .audit-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}
        </style>

        {/* ENCABEZADO OFICIAL CON LOGOS */}
        <DualPdfHeader
          title="ACTA E INFORME TÉCNICO DE AUDITORÍA EHS"
          subtitle="Relevamiento de Cumplimiento Legal y Sistema de Gestión (Ley 19.587 / Dec. 351/79 / ISO 45001 / ISO 19011)"
          normBadge={`${(data.standard || 'LEY 19.587 / ISO 45001').slice(0, 36).toUpperCase()} · ${auditTypeLabel.toUpperCase()}`}
          normBadgeColor="blue"
          normBadgeIcon={<ClipboardCheck size={12} />}
          documentId={data.id || data.assessmentNumber || 'AUD-EHS-001'}
          establishmentName={
            data.facilityName || data.location || 'Establecimiento Operativo Auditado'
          }
          date={formattedDate !== '-' ? formattedDate : undefined}
          className="mb-2.5"
        />

        {/* BANNER EJECUTIVO DE CALIFICACIÓN Y DICTAMEN */}
        <div
          className="avoid-break"
          style={{
            border: `1.5px solid ${dictamenMeta.border}`,
            backgroundColor: dictamenMeta.bg,
            borderRadius: '6px',
            padding: '7px 10px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '6.5pt',
                fontWeight: 900,
                color: dictamenMeta.color,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}
            >
              {dictamenMeta.badge}
            </div>
            <div
              style={{
                fontSize: '9.8pt',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.2
              }}
            >
              {data.auditTitle || data.title || 'Auditoría Integral de Higiene y Seguridad en el Trabajo'}
            </div>
            {/* Barra de proporción visual */}
            <div
              style={{
                marginTop: '5px',
                height: '6px',
                width: '100%',
                backgroundColor: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden',
                display: 'flex'
              }}
            >
              {siWidth > 0 && (
                <div style={{ width: `${siWidth}%`, backgroundColor: '#059669', height: '100%' }} />
              )}
              {noWidth > 0 && (
                <div style={{ width: `${noWidth}%`, backgroundColor: '#dc2626', height: '100%' }} />
              )}
            </div>
          </div>

          {/* Score grande a la derecha */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${dictamenMeta.border}`,
              borderRadius: '6px',
              padding: '4px 12px',
              textAlign: 'center',
              minWidth: '88px'
            }}
          >
            <div
              style={{
                fontSize: '15pt',
                fontWeight: 900,
                color: dictamenMeta.color,
                lineHeight: 1.05
              }}
            >
              {complianceRate}%
            </div>
            <div
              style={{
                fontSize: '5.5pt',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              CUMPLIMIENTO
            </div>
          </div>
        </div>

        {/* SECCIÓN I: FICHA TÉCNICA DEL ESTABLECIMIENTO Y AUDITORÍA */}
        <div className="avoid-break" style={{ marginBottom: '8px' }}>
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '3.5px 8px',
              fontSize: '6.8pt',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderTopLeftRadius: '5px',
              borderTopRightRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>SECCIÓN I — FICHA TÉCNICA DEL ESTABLECIMIENTO Y EQUIPO AUDITOR</span>
            <span>ESTADO: {statusLabel}</span>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #cbd5e1',
              fontSize: '7.1pt'
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: '18%',
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Razón Social / Planta
                </td>
                <td
                  style={{
                    width: '32%',
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.facilityName || data.location || 'Establecimiento Operativo'}
                </td>
                <td
                  style={{
                    width: '18%',
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  CUIT / Identificación
                </td>
                <td
                  style={{
                    width: '32%',
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.cuit || 'Registrado en Legajo Técnico'}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Ubicación / Domicilio
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.location || 'Planta Principal'}
                </td>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Sector / Proceso
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.department || 'Instalaciones Generales y Sectores Operativos'}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Norma / Marco Legal
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#1e40af',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.standard || 'Ley 19.587 / Dec. 351/79 / ISO 45001:2018'}
                </td>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Fecha y Duración
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {formattedDate} {data.duration ? `(${data.duration})` : ''}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Auditor Líder Actuante
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {actName || 'Profesional EHS'} {actLic ? `• Mat. ${actLic}` : ''}
                </td>
                <td
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '3.5px 6px',
                    fontWeight: 800,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                    fontSize: '6.2pt'
                  }}
                >
                  Responsable Auditado
                </td>
                <td
                  style={{
                    padding: '3.5px 6px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {data.auditedPerson || 'Responsable Operativo de Planta'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* INDICADORES CUANTITATIVOS DE LA AUDITORÍA */}
        <div
          className="avoid-break"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
            marginBottom: '8px'
          }}
        >
          <div
            style={{
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              borderRadius: '5px',
              padding: '4px 6px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '5.6pt', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Puntos Relevados
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#0f172a' }}>{totalItems}</div>
          </div>

          <div
            style={{
              border: '1px solid #6ee7b7',
              backgroundColor: '#ecfdf5',
              borderRadius: '5px',
              padding: '4px 6px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '5.6pt', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
              ✓ Conformidades
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#059669' }}>
              {conformitiesCount}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #fca5a5',
              backgroundColor: '#fef2f2',
              borderRadius: '5px',
              padding: '4px 6px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '5.6pt', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
              ✗ No Conformidades
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#dc2626' }}>
              {nonConformitiesCount}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #fdba74',
              backgroundColor: '#fff7ed',
              borderRadius: '5px',
              padding: '4px 6px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '5.6pt', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>
              Críticos / Mayores
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#ea580c' }}>
              {criticalCount + majorCount}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              borderRadius: '5px',
              padding: '4px 6px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '5.6pt', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              • No Aplicables
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#64748b' }}>{naCount}</div>
          </div>
        </div>

        {/* SECCIÓN II: OBJETIVO Y ALCANCE */}
        <div
          className="avoid-break"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '8px'
          }}
        >
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}
          >
            <div
              style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '3px 8px',
                fontSize: '6.2pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              OBJETIVO TÉCNICO-LEGAL DE LA AUDITORÍA
            </div>
            <div style={{ padding: '5px 8px', fontSize: '6.9pt', color: '#1e293b', lineHeight: 1.38 }}>
              <ReportContentRenderer
                content={
                  data.objective ||
                  'Verificar el grado de cumplimiento de los procedimientos internos de Higiene, Seguridad y Medio Ambiente, y los requisitos legales obligatorios aplicables a la operación.'
                }
                isPrint={true}
              />
            </div>
          </div>

          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}
          >
            <div
              style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '3px 8px',
                fontSize: '6.2pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              ALCANCE, CRITERIOS Y METODOLOGÍA APLICADA
            </div>
            <div style={{ padding: '5px 8px', fontSize: '6.9pt', color: '#1e293b', lineHeight: 1.38 }}>
              <ReportContentRenderer
                content={
                  data.scope ||
                  'Observación técnica directa en puestos de trabajo, entrevistas a operarios/supervisores y examen de registros documentales del Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST).'
                }
                isPrint={true}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN III: RESUMEN EJECUTIVO POR BLOQUE / CATEGORÍA (SI HAY MÁS DE 1 BLOQUE) */}
        {categorySummary.length > 1 && (
          <div className="avoid-break" style={{ marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '3.5px 8px',
                fontSize: '6.8pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '5px',
                borderTopRightRadius: '5px'
              }}
            >
              SECCIÓN II — SÍNTESIS DE CUMPLIMIENTO POR BLOQUE / CAPÍTULO AUDITADO
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #cbd5e1',
                fontSize: '6.8pt'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 800 }}>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>
                    Bloque / Capítulo Normativo
                  </th>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '10%' }}>
                    Total
                  </th>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '13%' }}>
                    ✓ Conformes
                  </th>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '13%' }}>
                    ✗ Desvíos
                  </th>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '10%' }}>
                    • N/A
                  </th>
                  <th style={{ padding: '3px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '18%' }}>
                    Nivel Cumplimiento
                  </th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.map((cat, idx) => (
                  <tr
                    key={cat.name}
                    style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                  >
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}
                    >
                      {cat.name}
                    </td>
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                        fontWeight: 700
                      }}
                    >
                      {cat.total}
                    </td>
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: '#059669'
                      }}
                    >
                      {cat.si}
                    </td>
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: cat.no > 0 ? '#dc2626' : '#64748b'
                      }}
                    >
                      {cat.no}
                    </td>
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                        color: '#64748b'
                      }}
                    >
                      {cat.na}
                    </td>
                    <td
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                        fontWeight: 900,
                        color:
                          cat.pct >= 80 ? '#059669' : cat.pct >= 60 ? '#d97706' : '#dc2626'
                      }}
                    >
                      {cat.evaluated > 0 ? `${cat.pct}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SECCIÓN IV: MATRIZ DETALLADA DEL RELEVAMIENTO TÉCNICO (CHECKLIST COMPLETO) */}
        {checklist.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div
              className="avoid-break"
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '6.8pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '5px',
                borderTopRightRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>
                SECCIÓN {categorySummary.length > 1 ? 'III' : 'II'} — MATRIZ DETALLADA DEL RELEVAMIENTO TÉCNICO-LEGAL
              </span>
              <span>{checklist.length} REQUISITOS VERIFICADOS</span>
            </div>

            <table
              className="audit-table"
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1px solid #cbd5e1',
                fontSize: '6.9pt'
              }}
            >
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '23%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 800, fontSize: '6.5pt' }}>
                  <th style={{ padding: '4px', border: '1px solid #334155', textAlign: 'center' }}>N°</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #334155', textAlign: 'left' }}>
                    Norma / Ref. Legal
                  </th>
                  <th style={{ padding: '4px 6px', border: '1px solid #334155', textAlign: 'left' }}>
                    Requisito Técnico-Legal Verificado
                  </th>
                  <th style={{ padding: '4px', border: '1px solid #334155', textAlign: 'center' }}>
                    Dictamen
                  </th>
                  <th style={{ padding: '4px 6px', border: '1px solid #334155', textAlign: 'left' }}>
                    Evidencia / Observación de Campo
                  </th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((item: any, idx: number) => {
                  const isConforme = item.status === 'si';
                  const isNoConforme = item.status === 'no';
                  const isNA = item.status === 'na';
                  const prevCat = idx > 0 ? checklist[idx - 1]?.category : null;
                  const showCatRow = item.category && item.category !== prevCat;
                  const sevBadge =
                    SEVERITY_BADGE[item.severity || 'major'] || SEVERITY_BADGE.major;

                  return (
                    <React.Fragment key={item.id || idx}>
                      {showCatRow && (
                        <tr style={{ backgroundColor: '#dbeafe' }}>
                          <td
                            colSpan={5}
                            style={{
                              padding: '3.5px 8px',
                              fontWeight: 900,
                              fontSize: '6.6pt',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              color: '#1e3a8a',
                              border: '1px solid #93c5fd'
                            }}
                          >
                            ■ {item.category}
                          </td>
                        </tr>
                      )}
                      <tr
                        style={{
                          backgroundColor: isNoConforme
                            ? '#fff1f2'
                            : idx % 2 === 0
                            ? '#ffffff'
                            : '#f8fafc'
                        }}
                      >
                        <td
                          style={{
                            padding: '3.5px 4px',
                            border: '1px solid #cbd5e1',
                            textAlign: 'center',
                            fontWeight: 800,
                            color: '#475569',
                            verticalAlign: 'top'
                          }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        <td
                          style={{
                            padding: '3.5px 5px',
                            border: '1px solid #cbd5e1',
                            verticalAlign: 'top',
                            wordBreak: 'break-word'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1.5px 5px',
                              borderRadius: '3px',
                              fontSize: '6pt',
                              fontWeight: 800,
                              backgroundColor: '#f1f5f9',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1'
                            }}
                          >
                            {item.legal || item.clause || `Ítem ${idx + 1}`}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '3.5px 6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            color: '#0f172a',
                            lineHeight: 1.32,
                            verticalAlign: 'top',
                            wordBreak: 'break-word'
                          }}
                        >
                          {item.question}
                        </td>

                        <td
                          style={{
                            padding: '3.5px 4px',
                            border: '1px solid #cbd5e1',
                            textAlign: 'center',
                            verticalAlign: 'top'
                          }}
                        >
                          {isConforme && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '5.8pt',
                                fontWeight: 900,
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                border: '1px solid #34d399'
                              }}
                            >
                              ✓ CONFORME
                            </span>
                          )}
                          {isNoConforme && (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  borderRadius: '999px',
                                  fontSize: '5.8pt',
                                  fontWeight: 900,
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  border: '1px solid #f87171'
                                }}
                              >
                                ✗ DESVÍO
                              </span>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  fontSize: '5.3pt',
                                  fontWeight: 900,
                                  backgroundColor: sevBadge.bg,
                                  color: sevBadge.text,
                                  border: `1px solid ${sevBadge.border}`
                                }}
                              >
                                {sevBadge.label}
                              </span>
                            </div>
                          )}
                          {isNA && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '5.8pt',
                                fontWeight: 800,
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1'
                              }}
                            >
                              • N/A
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: '3.5px 6px',
                            border: '1px solid #cbd5e1',
                            verticalAlign: 'top',
                            fontSize: '6.5pt',
                            lineHeight: 1.3,
                            wordBreak: 'break-word'
                          }}
                        >
                          {item.observation ? (
                            <span
                              style={{
                                color: isNoConforme ? '#991b1b' : '#1e293b',
                                fontWeight: isNoConforme ? 700 : 500
                              }}
                            >
                              {item.observation}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                              {isConforme
                                ? 'Verificado conforme en planta'
                                : isNA
                                ? 'No aplica al sector'
                                : 'Desvío constatado en inspección'}
                            </span>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SECCIÓN V: PLAN DE ACCIÓN CORRECTIVA Y PREVENTIVA (CAPA) */}
        {nonConformitiesList.length > 0 ? (
          <div className="avoid-break" style={{ marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#991b1b',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '6.8pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '5px',
                borderTopRightRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertOctagon size={12} /> SECCIÓN {categorySummary.length > 1 ? 'IV' : 'III'} — PLAN DE ACCIÓN CORRECTIVA (CAPA) SOBRE DESVÍOS DETECTADOS
              </span>
              <span>{nonConformitiesList.length} ACCIONES REQUERIDAS</span>
            </div>

            <table
              className="audit-table"
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: '1px solid #fca5a5',
                fontSize: '6.7pt'
              }}
            >
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '34%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '9%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#fef2f2', color: '#7f1d1d', fontWeight: 900, fontSize: '6.3pt' }}>
                  <th style={{ padding: '3.5px 5px', border: '1px solid #fca5a5', textAlign: 'left' }}>
                    Severidad / Norma
                  </th>
                  <th style={{ padding: '3.5px 5px', border: '1px solid #fca5a5', textAlign: 'left' }}>
                    Hallazgo / Requisito Incumplido
                  </th>
                  <th style={{ padding: '3.5px 5px', border: '1px solid #fca5a5', textAlign: 'left' }}>
                    Acción Correctiva / Medida Técnica Requerida
                  </th>
                  <th style={{ padding: '3.5px 5px', border: '1px solid #fca5a5', textAlign: 'left' }}>
                    Responsable
                  </th>
                  <th style={{ padding: '3.5px 4px', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    Plazo
                  </th>
                </tr>
              </thead>
              <tbody>
                {nonConformitiesList.map((nc: any, idx: number) => {
                  const sev = SEVERITY_BADGE[nc.severity || 'major'] || SEVERITY_BADGE.major;
                  return (
                    <tr key={nc.id || idx} style={{ backgroundColor: '#ffffff' }}>
                      <td
                        style={{
                          padding: '3.5px 5px',
                          border: '1px solid #fca5a5',
                          verticalAlign: 'top'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1.5px 5px',
                            borderRadius: '3px',
                            fontSize: '5.8pt',
                            fontWeight: 900,
                            backgroundColor: sev.bg,
                            color: sev.text,
                            border: `1px solid ${sev.border}`
                          }}
                        >
                          {sev.label}
                        </span>
                        <div
                          style={{
                            fontSize: '5.8pt',
                            fontWeight: 800,
                            color: '#334155',
                            marginTop: '2px'
                          }}
                        >
                          {nc.legal}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '3.5px 5px',
                          border: '1px solid #fca5a5',
                          verticalAlign: 'top',
                          color: '#0f172a',
                          wordBreak: 'break-word'
                        }}
                      >
                        <div style={{ fontWeight: 800, lineHeight: 1.28 }}>{nc.question}</div>
                        {nc.observation && (
                          <div
                            style={{
                              color: '#991b1b',
                              fontWeight: 600,
                              marginTop: '2px',
                              fontSize: '6.3pt'
                            }}
                          >
                            • Evidencia: {nc.observation}
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '3.5px 5px',
                          border: '1px solid #fca5a5',
                          verticalAlign: 'top',
                          color: '#0f172a',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          wordBreak: 'break-word'
                        }}
                      >
                        {nc.correctiveAction ||
                          'Ejecutar adecuación técnica/documental inmediata y presentar evidencia al Servicio de Higiene y Seguridad.'}
                      </td>

                      <td
                        style={{
                          padding: '3.5px 5px',
                          border: '1px solid #fca5a5',
                          verticalAlign: 'top',
                          fontWeight: 700,
                          color: '#1e293b',
                          wordBreak: 'break-word'
                        }}
                      >
                        {nc.responsible || data.auditedPerson || 'Resp. de Planta'}
                      </td>

                      <td
                        style={{
                          padding: '3.5px 4px',
                          border: '1px solid #fca5a5',
                          verticalAlign: 'top',
                          textAlign: 'center',
                          fontWeight: 800,
                          color: '#991b1b'
                        }}
                      >
                        {nc.dueDate
                          ? new Date(nc.dueDate + 'T12:00:00').toLocaleDateString('es-AR')
                          : '15 días'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          evaluatedItems > 0 && (
            <div
              className="avoid-break"
              style={{
                marginBottom: '8px',
                padding: '6px 10px',
                borderRadius: '5px',
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #10b981',
                color: '#065f46',
                fontSize: '7.2pt',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} color="#059669" />
              <span>
                SIN NO CONFORMIDADES PENDIENTES: Todos los puntos aplicables evaluados en el establecimiento resultaron CONFORMES a la normativa vigente.
              </span>
            </div>
          )
        )}

        {/* SECCIÓN VI: MINUTA DE REUNIÓN DE CIERRE Y DICTAMEN TÉCNICO FINAL */}
        <div
          className="avoid-break"
          style={{
            border: '1.5px solid #1e3a8a',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '10px',
            backgroundColor: '#ffffff'
          }}
        >
          <div
            style={{
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '6.8pt',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={12} /> MINUTA DE REUNIÓN DE CIERRE Y DICTAMEN TÉCNICO DEL AUDITOR
            </span>
            <span>FECHA DE CIERRE: {closingDate}</span>
          </div>

          <div style={{ padding: '7px 10px' }}>
            {(data.closingMeeting?.participants || data.auditTeam) && (
              <div
                style={{
                  fontSize: '6.8pt',
                  color: '#0f172a',
                  marginBottom: '5px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <strong style={{ textTransform: 'uppercase', color: '#1e3a8a' }}>
                  Participantes del Cierre:
                </strong>{' '}
                <span style={{ fontWeight: 600 }}>
                  {data.closingMeeting?.participants || data.auditTeam}
                </span>
              </div>
            )}

            {data.closingMeeting?.strengths && (
              <div
                style={{
                  marginBottom: '6px',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f0fdf4',
                  borderLeft: '3.5px solid #059669',
                  fontSize: '6.9pt',
                  color: '#064e3b',
                  lineHeight: 1.35
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    fontSize: '6.1pt',
                    textTransform: 'uppercase',
                    color: '#047857',
                    marginBottom: '1px'
                  }}
                >
                  ✓ Fortalezas y Aspectos Positivos Destacados:
                </strong>
                {data.closingMeeting.strengths}
              </div>
            )}

            <div
              style={{
                fontSize: '7.1pt',
                color: '#0f172a',
                lineHeight: 1.42,
                fontWeight: 600
              }}
            >
              <ReportContentRenderer
                content={
                  data.closingMeeting?.conclusions ||
                  data.conclusion ||
                  'La auditoría concluye que el establecimiento mantiene condiciones operativas con adecuada adhesión al Sistema de Gestión de Higiene y Seguridad en el Trabajo, debiendo implementarse las acciones correctivas señaladas dentro de los plazos establecidos.'
                }
                isPrint={true}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN VII: FIRMAS DE RESPONSABILIDAD */}
        <div className="avoid-break" style={{ marginTop: '6px' }}>
          <PdfSignatures
            compact={true}
            hideFooter={true}
            data={data}
            box1={
              !data.showSignatures || data.showSignatures.operator
                ? {
                    title: 'PERSONA AUDITADA / RESPONSABLE',
                    subtitle: (data.auditedPerson || 'Firma de Conformidad').toUpperCase(),
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              !data.showSignatures || data.showSignatures.professional
                ? {
                    title: finalRoleTitle,
                    subtitle: (actName || 'Firma y Sello').toUpperCase(),
                    signatureUrl: actSignature,
                    stampUrl: actStamp,
                    isProfessional: true,
                    license: actLic
                  }
                : null
            }
            box3={
              !data.showSignatures || data.showSignatures.supervisor
                ? {
                    title: 'SUPERVISIÓN / DIRECCIÓN',
                    subtitle: 'Aprobación de Informe',
                    signatureUrl: data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        <PdfBrandingFooter />

        {/* Pie de página legal */}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '6.3pt',
            color: '#64748b',
            marginTop: '6px',
            fontWeight: 600,
            borderTop: '1px solid #cbd5e1',
            paddingTop: '4px'
          }}
        >
          Acta e Informe Oficial de Auditoría EHS • Conforme a Ley Nacional N° 19.587, Decreto 351/79, Directrices ISO 19011 e ISO 45001:2018
        </div>
      </div>
    </div>
  );
}
