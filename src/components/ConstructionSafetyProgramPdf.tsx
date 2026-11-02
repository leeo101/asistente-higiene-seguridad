import React from 'react';
import { HardHat, ShieldCheck, Building, AlertTriangle, GraduationCap, Wrench, Camera } from 'lucide-react';
import {
  ConstructionProgramData,
  CAUSALES_CATALOG,
  DEFAULT_REQUIRED_PPE,
  DEFAULT_TRAINING_PLAN,
  DEFAULT_OBRADOR_INFRA
} from '../data/constructionSafetyData';
import ReportContentRenderer from './reports/ReportContentRenderer';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

interface ConstructionSafetyProgramPdfProps {
  data: ConstructionProgramData;
  customId?: string;
  professionalName?: string;
}

const RESOLUTION_LABELS: Record<string, string> = {
  res_51_97: 'Res. SRT 51/97 (Contratista / Empleador en Obra)',
  res_35_98: 'Res. SRT 35/98 (Programa Único de Seguridad - Comitente / Coordinador)',
  res_319_99: 'Res. SRT 319/99 (Obras Repetitivas y de Corta Duración)'
};

export default function ConstructionSafetyProgramPdf({
  data,
  customId = 'pdf-construction-program',
  professionalName
}: ConstructionSafetyProgramPdfProps) {
  if (!data) return null;

  const activeStages = (data.stages || []).filter(s => s.included);
  let responsiblePro = professionalName || data.hygieneService?.professionalName || 'Profesional H&S';
  let enrollment = data.hygieneService?.enrollmentNumber || 'A designar';
  let proSignature: string | null = data.professionalSignature || null;
  let proStamp: string | null = data.professionalStamp || null;

  if (typeof window !== 'undefined') {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!proSignature) proSignature = parsed.signature || null;
        if (!proStamp) proStamp = parsed.stamp || null;
      } else if (legacySig && !proSignature) {
        proSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        if ((!data.hygieneService?.professionalName || responsiblePro === 'Profesional H&S') && (pd.name || pd.fullName)) {
          responsiblePro = pd.name || pd.fullName;
        }
        if ((!data.hygieneService?.enrollmentNumber || enrollment === 'A designar') && (pd.license || pd.matricula)) {
          enrollment = pd.license || pd.matricula;
        }
      }
    } catch {}
  }

  const selectedCausales = CAUSALES_CATALOG.filter(
    c => (data.reasons as any)?.[c.id] === true
  );

  const ppeList = data.requiredPpe && data.requiredPpe.length > 0 ? data.requiredPpe : DEFAULT_REQUIRED_PPE;
  const trainingList = data.trainingPlan && data.trainingPlan.length > 0 ? data.trainingPlan : DEFAULT_TRAINING_PLAN;
  const obradorList = data.obradorInfra && data.obradorInfra.length > 0 ? data.obradorInfra : DEFAULT_OBRADOR_INFRA;
  const resLabel = RESOLUTION_LABELS[data.resolutionType || 'res_51_97'] || RESOLUTION_LABELS.res_51_97;
  const sitePhotos = data.sitePhotos || [];
  const stagesWithPhotos = activeStages.filter(s => s.photos && s.photos.length > 0);
  const totalPhotosCount =
    sitePhotos.length + stagesWithPhotos.reduce((acc, s) => acc + (s.photos?.length || 0), 0);

  const boxOuterStyle: React.CSSProperties = {
    border: '1.5px solid #000000',
    borderRadius: '6px',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    marginBottom: '10px',
    backgroundColor: '#ffffff'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '10px',
    padding: '5px 10px',
    borderBottom: '1.5px solid #000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    width: '100%'
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    border: 'none',
    fontSize: '9.5px',
    lineHeight: 1.3,
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    margin: 0
  };

  const cellStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '4px 6px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
    verticalAlign: 'top'
  };

  return (
    <div
      id={customId}
      className="pdf-container print-area bg-white text-slate-900 p-4 sm:p-5 max-w-[210mm] mx-auto text-xs leading-snug font-sans shadow-none print:p-0"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        width: '100%',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '12px 16px',
        boxSizing: 'border-box',
        display: 'block',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"
      }}
    >
      <style type="text/css">
        {`
          @media print {
            @page { size: A4 portrait; margin: 9mm 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; color: #0f172a !important; }
            .no-print { display: none !important; }
            .print-area, .pdf-container {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 1px !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              box-sizing: border-box !important;
            }
          }
          #${customId} table {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
            margin-bottom: 0 !important;
          }
          #${customId} th, #${customId} td {
            border: 1px solid #000000 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            box-sizing: border-box !important;
          }
        `}
      </style>

      {/* Franja Superior Institucional */}
      <div
        style={{
          height: '5px',
          width: '100%',
          background: 'linear-gradient(90deg, #d97706 0%, #b45309 50%, #059669 100%)',
          borderRadius: '4px 4px 0 0',
          marginBottom: '8px'
        }}
      />

      {/* ── Encabezado Institucional ── */}
      <div
        className="avoid-break"
        style={{
          border: '1.5px solid #000000',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              border: '1.5px solid #d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <HardHat size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '8.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#92400e',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              Decreto 911/96 • Res. SRT 51/97 • 35/98 • 319/99 • 550/11 • 503/14
            </span>
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: '#0f172a',
                margin: '3px 0 1px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.15
              }}
            >
              PROGRAMA DE SEGURIDAD PARA LA CONSTRUCCIÓN
            </h1>
            <p style={{ fontSize: '10px', color: '#334155', margin: 0, fontWeight: 700 }}>
              {resLabel}
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            flexShrink: 0,
            borderLeft: '1.5px solid #cbd5e1',
            paddingLeft: '12px'
          }}
        >
          <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Expediente / Programa
          </div>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#d97706', fontFamily: 'monospace' }}>
            {data.programNumber}
          </div>
          {data.avisoObraNumber && (
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#1e293b', marginTop: '1px' }}>
              Aviso Obra ART: <span style={{ fontFamily: 'monospace' }}>{data.avisoObraNumber}</span>
            </div>
          )}
          <div style={{ fontSize: '9px', color: '#475569', marginTop: '1px' }}>
            Fecha: {new Date(data.createdAt || Date.now()).toLocaleDateString('es-AR')}
          </div>
          <div style={{ marginTop: '2px' }}>
            <span
              style={{
                fontSize: '8px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: data.status === 'approved_by_art' ? '#d1fae5' : data.status === 'submitted_to_art' ? '#dbeafe' : '#fef3c7',
                color: data.status === 'approved_by_art' ? '#065f46' : data.status === 'submitted_to_art' ? '#1e40af' : '#92400e',
                textTransform: 'uppercase',
                border: '1px solid #cbd5e1'
              }}
            >
              {data.status === 'approved_by_art'
                ? 'Aprobado ART'
                : data.status === 'submitted_to_art'
                ? 'Presentado ART'
                : 'Programa Oficial'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. Sujetos Intervinientes y Datos de la Obra ── */}
      <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={sectionHeaderStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={13} color="#fbbf24" />
            <span>1. DATOS GENERALES DE LA OBRA Y SUJETOS INTERVINIENTES</span>
          </span>
        </div>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '33%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Empresa Constructora / Contratista
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{data.contractorName || '—'}</div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  CUIT Contratista
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{data.contractorCuit || '—'}</div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Aseguradora de Riesgos (ART)
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{data.artName || 'A designar'}</div>
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Comitente / Propietario
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.comitenteName || '—'} {data.comitenteCuit ? `(CUIT: ${data.comitenteCuit})` : ''}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Director de Obra / Rep. Técnico
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.directorObraName || 'Dirección Técnica de Obra'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Encuadre Legal SRT
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{resLabel.split('(')[0]}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Ubicación y Domicilio de la Obra
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.siteAddress
                    ? `${data.siteAddress}${data.city ? `, ${data.city}` : ''}${data.province ? ` (${data.province})` : ''}`
                    : '—'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Tipo de Obra
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  {(data.workType || 'edificacion').replace('_', ' ')}
                </div>
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Superficie Cubierta / Intervención
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.siteSurfaceM2 ? `${data.siteSurfaceM2} m²` : '—'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Dotación Máxima en Pico de Obra
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.estimatedWorkers ? `${data.estimatedWorkers} operarios` : '—'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Fecha de Inicio y Plazo Estimado
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.startDate || '—'} ({data.estimatedDurationMonths || 6} meses)
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 2. Causales de Exigibilidad de Programa (Res. SRT 51/97, 550/11, 503/14) ── */}
      <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={sectionHeaderStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} color="#fbbf24" />
            <span>2. CAUSALES DE EXIGIBILIDAD Y AVISO DE OBRA (RES. SRT 51/97, 550/11 & 503/14)</span>
          </span>
          <span style={{ fontSize: '9px', color: '#fcd34d', fontWeight: 700 }}>
            {selectedCausales.length} causales declaradas
          </span>
        </div>
        <div
          style={{
            padding: '6px 9px',
            backgroundColor: '#f8fafc',
            boxSizing: 'border-box'
          }}
        >
          <p style={{ fontSize: '9.5px', color: '#334155', margin: '0 0 5px 0' }}>
            La presente obra se encuadra formalmente bajo los requerimientos del Decreto 911/96 y resoluciones complementarias de la SRT en virtud de las siguientes condiciones técnicas críticas:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedCausales.length > 0 ? (
              selectedCausales.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '4px 7px',
                    borderRadius: '4px',
                    border: '1px solid #d97706',
                    backgroundColor: '#fffbeb',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '10px' }}>
                      ✓ {c.label}
                    </div>
                    <span
                      style={{
                        fontSize: '7.5px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b'
                      }}
                    >
                      {c.norm}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#334155', marginTop: '1.5px', paddingLeft: '10px' }}>
                    <strong>Exigencia técnica obligatoria:</strong> {c.requirement}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b' }}>
                ✓ Obra de construcción civil e infraestructura comprendida en el marco general del Decreto 911/96.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Servicio de Higiene y Seguridad Laboral en Obra ── */}
      <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={sectionHeaderStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#fbbf24" />
            <span>3. SERVICIO DE HIGIENE Y SEGURIDAD Y PLAN DE EMERGENCIAS (ART. 16 DEC. 911/96)</span>
          </span>
        </div>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '33%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Profesional Responsable HyS
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{responsiblePro}</div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Matrícula / Registro Habilitante
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{enrollment}</div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Asignación Semanal en Obra (Res. 231/96)
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.hygieneService?.weeklyVisitHours
                    ? `${data.hygieneService.weeklyVisitHours} hs semanales presenciales`
                    : 'Según Res. SRT 231/96 Art. 2'}
                </div>
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Centro Médico ART de Derivación
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.hygieneService?.emergencyClinic || 'Centro médico prestador de la ART'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Teléfono de Emergencias ART (24 hs)
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  {data.hygieneService?.emergencyPhone || '0800-333-1234 / 911'}
                </div>
              </td>
              <td style={cellStyle}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Punto de Encuentro de Evacuación
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {data.hygieneService?.meetingPoint || 'Acceso principal de obra / Sector señalizado'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 4. Matriz de Etapas Constructivas, Riesgos, Medidas y Fotos por Etapa ──
          IMPORTANTE: Sin borde en el <div> contenedor exterior para que al paginar entre hojas A4
          no queden líneas laterales abiertas en espacios vacíos; cada <tr>/<td> cierra su propio cuadro negro. */}
      <div style={{ marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}>
        <table style={{ ...tableStyle, textAlign: 'left', border: 'none' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th
                colSpan={4}
                style={{
                  border: '1.5px solid #000000',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '5px 10px',
                  fontWeight: 800,
                  fontSize: '10px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HardHat size={13} color="#fbbf24" />
                    <span>4. CRONOGRAMA DE ETAPAS CONSTRUCTIVAS, RIESGOS Y MEDIDAS PREVENTIVAS</span>
                  </span>
                  <span style={{ fontSize: '9px', color: '#fcd34d', fontWeight: 700 }}>
                    {activeStages.length} etapas incluidas
                  </span>
                </div>
              </th>
            </tr>
            <tr style={{ backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 800 }}>
              <th style={{ ...cellStyle, fontWeight: 800, backgroundColor: '#e2e8f0' }}>Etapa Constructiva</th>
              <th style={{ ...cellStyle, fontWeight: 800, backgroundColor: '#e2e8f0' }}>Riesgos Identificados</th>
              <th style={{ ...cellStyle, fontWeight: 800, backgroundColor: '#e2e8f0' }}>Medidas Preventivas Obligatorias</th>
              <th style={{ ...cellStyle, fontWeight: 800, textAlign: 'center', backgroundColor: '#e2e8f0' }}>Normativa</th>
            </tr>
          </thead>
          <tbody>
            {activeStages.length > 0 ? (
              activeStages.map((stage, idx) => (
                <React.Fragment key={stage.id || idx}>
                  <tr
                    className="avoid-break"
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid'
                    }}
                  >
                    <td style={{ ...cellStyle, fontWeight: 800, color: '#0f172a' }}>
                      <div>{stage.name}</div>
                      {stage.photos && stage.photos.length > 0 && (
                        <div
                          style={{
                            marginTop: '3px',
                            display: 'inline-block',
                            fontSize: '8px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '4px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px solid #7dd3fc'
                          }}
                        >
                          📷 {stage.photos.length} foto(s)
                        </div>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: '#1e293b' }}>
                      {stage.risks && stage.risks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {stage.risks.map((r, ri) => (
                            <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: 1.25 }}>
                              <span style={{ color: '#dc2626', fontWeight: 900, flexShrink: 0 }}>•</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No especificado</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: '#1e293b' }}>
                      {stage.preventiveMeasures && stage.preventiveMeasures.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {stage.preventiveMeasures.map((m, mi) => (
                            <div key={mi} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: 1.25 }}>
                              <span style={{ color: '#059669', fontWeight: 900, flexShrink: 0 }}>✓</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No especificado</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          backgroundColor: '#e2e8f0',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                          fontSize: '8px',
                          fontWeight: 700,
                          border: '1px solid #94a3b8'
                        }}
                      >
                        {stage.applicableStandards || 'Dec. 911/96'}
                      </span>
                    </td>
                  </tr>
                  {stage.photos && stage.photos.length > 0 && (
                    <tr className="avoid-break" style={{ backgroundColor: '#f8fafc', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td colSpan={4} style={cellStyle}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#0369a1', marginBottom: '4px' }}>
                          REGISTRO FOTOGRÁFICO DE LA ETAPA: {stage.name.toUpperCase()}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
                          {stage.photos.map((photoSrc, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                border: '1px solid #000000',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                padding: '3px',
                                boxSizing: 'border-box'
                              }}
                            >
                              <img
                                src={photoSrc}
                                alt={`${stage.name} - Foto ${pIdx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '85px',
                                  objectFit: 'cover',
                                  borderRadius: '3px',
                                  display: 'block'
                                }}
                              />
                              <div style={{ fontSize: '8px', color: '#334155', textAlign: 'center', marginTop: '2px', fontWeight: 700 }}>
                                Evidencia #{pIdx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ ...cellStyle, padding: '10px', textAlign: 'center', color: '#64748b' }}>
                  No se han seleccionado etapas constructivas en este programa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 5 y 6. Elementos de Protección Personal (EPP) y Plan de Capacitación ── */}
      <div
        className="avoid-break"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '10px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ ...boxOuterStyle, marginBottom: 0 }}>
          <div style={sectionHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Wrench size={12} color="#fbbf24" />
              <span>5. NÓMINA DE EPP OBLIGATORIOS (RES. 299/11)</span>
            </span>
          </div>
          <div style={{ padding: '6px 9px', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
            {ppeList.map((item, i) => (
              <div key={i} style={{ fontSize: '9px', color: '#1e293b', marginBottom: '2px', display: 'flex', gap: '5px' }}>
                <span style={{ color: '#d97706', fontWeight: 900 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...boxOuterStyle, marginBottom: 0 }}>
          <div style={sectionHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <GraduationCap size={12} color="#fbbf24" />
              <span>6. PLAN ANUAL DE CAPACITACIÓN (DEC. 911/96)</span>
            </span>
          </div>
          <div style={{ padding: '6px 9px', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
            {trainingList.map((item, i) => (
              <div key={i} style={{ fontSize: '9px', color: '#1e293b', marginBottom: '2px', display: 'flex', gap: '5px' }}>
                <span style={{ color: '#059669', fontWeight: 900 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 7. Condiciones de Infraestructura de Obrador y Servicios ── */}
      <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={sectionHeaderStyle}>
          <span>7. CONDICIONES GENERALES DE INFRAESTRUCTURA DE OBRADOR Y BIENESTAR (DEC. 911/96 CAPS. 4 Y 5)</span>
        </div>
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: '#f8fafc',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '3.5px 10px',
            boxSizing: 'border-box'
          }}
        >
          {obradorList.map((item, i) => (
            <div key={i} style={{ fontSize: '9px', color: '#1e293b', display: 'flex', gap: '5px' }}>
              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Relevamiento Fotográfico General de Obra / Obrador / Croquis (si existen fotos generales) ── */}
      {sitePhotos.length > 0 && (
        <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={13} color="#fbbf24" />
              <span>8. RELEVAMIENTO FOTOGRÁFICO DE PREDIO, OBRADOR Y CONDICIONES GENERALES</span>
            </span>
            <span style={{ fontSize: '9px', color: '#fcd34d', fontWeight: 700 }}>
              {sitePhotos.length} imagen(es)
            </span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: '#f8fafc',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            {sitePhotos.map((src, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #000000',
                  borderRadius: '5px',
                  backgroundColor: '#ffffff',
                  padding: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <img
                  src={src}
                  alt={`Relevamiento de Obra ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '105px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    display: 'block'
                  }}
                />
                <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#334155', textAlign: 'center', marginTop: '3px' }}>
                  Relevamiento de Obra #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Observaciones Técnicas y Compromiso de Cumplimiento ── */}
      {data.notes && (
        <div className="avoid-break" style={{ ...boxOuterStyle, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>
            <span>{sitePhotos.length > 0 ? '9.' : '8.'} OBSERVACIONES TÉCNICAS PARTICULARES Y COMPROMISO DE CUMPLIMIENTO</span>
          </div>
          <div
            style={{
              padding: '7px 10px',
              backgroundColor: '#f8fafc',
              fontSize: '9.5px',
              color: '#1e293b',
              boxSizing: 'border-box'
            }}
          >
            <ReportContentRenderer content={data.notes} />
          </div>
        </div>
      )}

      {/* ── Bloque de Firmas Digitales Formato ATS (con la Firma del Profesional en el Medio) ── */}
      <div
        className="avoid-break"
        style={{
          marginTop: '12px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#334155',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
            textAlign: 'center'
          }}
        >
          SUSCRIPCIÓN DIGITAL Y CONFORMIDAD REGLAMENTARIA (DECRETO 911/96 • RES. SRT 51/97, 35/98 & 319/99)
          {totalPhotosCount > 0 ? ` • INCLUYE ${totalPhotosCount} EVIDENCIA(S) FOTOGRÁFICA(S)` : ''}
        </div>

        <PdfSignatures
          data={{
            ...data,
            showSignatures: data.showSignatures || {
              operator: true,
              professional: true,
              supervisor: true
            }
          }}
          compact={true}
          hideFooter={true}
          box1={{
            title: 'RESPONSABLE CONTRATISTA / EMPLEADOR',
            subtitle: (data.contractorName || 'Representante Empleador').toUpperCase(),
            signatureUrl: data.operatorSignature || null,
            isProfessional: false,
            license: data.contractorCuit || undefined
          }}
          box2={{
            title: 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
            subtitle: (responsiblePro || 'Firma y Sello Profesional').toUpperCase(),
            signatureUrl: proSignature,
            stampUrl: proStamp,
            isProfessional: true,
            license: enrollment
          }}
          box3={{
            title: 'DIRECTOR DE OBRA / SUPERVISIÓN COMITENTE',
            subtitle: (data.directorObraName || data.comitenteName || 'Dirección de Obra').toUpperCase(),
            signatureUrl: data.supervisorSignature || null,
            isProfessional: false,
            license: data.artName ? `ART ${data.artName}` : undefined
          }}
        />
      </div>

      {/* ── Pie de Marca y Validez Legal ── */}
      <div style={{ marginTop: '10px' }}>
        <PdfBrandingFooter
          documentId={data.programNumber}
          documentType="PROGRAMA DE SEGURIDAD EN CONSTRUCCIÓN (DEC. 911/96 & RES. SRT 51/97)"
          signedBy={responsiblePro}
        />
      </div>
    </div>
  );
}
