import React from 'react';
import DualPdfHeader from './DualPdfHeader';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { safeGetLocalStorage } from '../utils/storageHelper';

interface AiReportPdfGeneratorProps {
  data?: any;
  item?: any;
  showSignatures?: {
    operator?: boolean;
    supervisor?: boolean;
    professional?: boolean;
  };
}

export default function AiReportPdfGenerator({
  data: propData,
  item: propItem,
  showSignatures = { operator: true, supervisor: true, professional: true }
}: AiReportPdfGeneratorProps): React.ReactElement | null {
  const data = propData || propItem;
  if (!data) return null;

  const profile = safeGetLocalStorage<any>('personalData', null);
  const signature = safeGetLocalStorage<any>('signatureStampData', null);

  const isGeneralRisks = data.type === 'general_risks';
  const company = data.company || 'Establecimiento / Empresa Local';
  const location = data.location || 'Sector Operativo Principal';
  const workerName = data.workerName || data.operator || (isGeneralRisks ? 'Responsable de Sector' : 'Operario Auditado');
  const taskDescription = data.taskDescription || (isGeneralRisks ? 'Inspección general de condiciones y medio ambiente de trabajo (CyMAT)' : 'Verificación en puesto de uso obligatorio de Elementos de Protección Personal');
  const formattedDate = data.date ? new Date(data.date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleString('es-AR');

  const rawRisk = (data.analysis?.riskLevel || (isGeneralRisks
    ? ((data.analysis?.detections?.length || 0) > 0 ? 'Alto' : 'Bajo')
    : (data.analysis?.ppeComplete ? 'Bajo' : 'Alto'))).toString();
  const riskLower = rawRisk.toLowerCase();

  const riskBadgeStyle =
    riskLower === 'crítico' || riskLower === 'critico'
      ? { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', solid: '#dc2626', label: 'CRÍTICO' }
      : riskLower === 'alto'
        ? { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', solid: '#ea580c', label: 'ALTO' }
        : riskLower === 'medio'
          ? { bg: '#fefce8', text: '#a16207', border: '#fde047', solid: '#ca8a04', label: 'MEDIO' }
          : { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', solid: '#16a34a', label: 'BAJO / CONTROLADO' };

  const detections: any[] = Array.isArray(data.analysis?.detections) ? data.analysis.detections : [];
  const foundRisks: string[] = Array.isArray(data.analysis?.foundRisks) ? data.analysis.foundRisks : [];

  const ppeItems = [
    {
      code: 'EPP-01',
      label: 'Casco de Seguridad Industrial',
      norm: 'IRAM 3620 / ANSI Z89.1',
      legal: 'Art. 191 Dec. 351/79 · Res. SRT 299/11',
      pass: Boolean(data.analysis?.helmetUsed),
      required: true,
      actionOk: 'Uso correcto verificado en escena.',
      actionFail: 'Proveer y exigir colocación inmediata de casco dieléctrico/industrial con barbijos según tarea.'
    },
    {
      code: 'EPP-02',
      label: 'Calzado de Seguridad con Puntera',
      norm: 'IRAM 3610 / ISO 20345',
      legal: 'Art. 198 Dec. 351/79 · Res. SRT 299/11',
      pass: Boolean(data.analysis?.shoesUsed),
      required: true,
      actionOk: 'Calzado de protección detectado correctamente.',
      actionFail: 'Exigir calzado de seguridad certificado con puntera de protección y suela antideslizante.'
    },
    {
      code: 'EPP-03',
      label: 'Guantes de Protección Laboral',
      norm: 'IRAM 3607 / EN 388',
      legal: 'Art. 197 Dec. 351/79 · Res. SRT 299/11',
      pass: Boolean(data.analysis?.glovesUsed),
      required: true,
      actionOk: 'Protección de extremidades superiores verificada.',
      actionFail: 'Suministrar guantes acordes al riesgo mecánico, químico o eléctrico del puesto.'
    },
    {
      code: 'EPP-04',
      label: 'Ropa de Trabajo / Chaleco Alta Visibilidad',
      norm: 'IRAM 3859 / EN ISO 20471',
      legal: 'Art. 190 Dec. 351/79 · Res. SRT 299/11',
      pass: Boolean(data.analysis?.clothingUsed),
      required: true,
      actionOk: 'Indumentaria laboral y/o reflectiva verificada.',
      actionFail: 'Exigir ropa de trabajo reglamentaria y chaleco reflectivo en zonas de circulación.'
    },
    {
      code: 'EPP-05',
      label: 'Protección Ocular y/o Facial',
      norm: 'IRAM 3630 / ANSI Z87.1',
      legal: 'Art. 193 Dec. 351/79 · Res. SIyC 18/25',
      pass: data.analysis?.glassesUsed !== undefined ? Boolean(data.analysis.glassesUsed) : Boolean(data.analysis?.ppeComplete),
      required: false,
      actionOk: 'Conforme / Sin proyección activa sin protección.',
      actionFail: 'Verificar uso obligatorio de gafas de seguridad ante proyección de partículas o salpicaduras.'
    },
    {
      code: 'EPP-06',
      label: 'Protección Auditiva / Respiratoria (según puesto)',
      norm: 'IRAM 4126 / IRAM 3648',
      legal: 'Arts. 194-201 Dec. 351/79 · Res. SRT 299/11',
      pass: data.analysis?.hearingUsed !== undefined ? Boolean(data.analysis.hearingUsed) : Boolean(data.analysis?.ppeComplete),
      required: false,
      actionOk: 'Conforme a condiciones observadas.',
      actionFail: 'Controlar uso de protector auditivo (>85 dBA) o semimáscara si existe material particulado.'
    }
  ];

  const corePpeChecked = ppeItems.filter(i => i.required);
  const corePpePassed = corePpeChecked.filter(i => i.pass).length;
  const ppeCompliancePct = Math.round((corePpePassed / corePpeChecked.length) * 100);
  const isCompliant = isGeneralRisks
    ? detections.length === 0 && foundRisks.length === 0
    : Boolean(data.analysis?.ppeComplete) || corePpePassed === corePpeChecked.length;

  const applicableLegislation: string[] = Array.isArray(data.analysis?.applicableLegislation) && data.analysis.applicableLegislation.length > 0
    ? data.analysis.applicableLegislation
    : isGeneralRisks
      ? [
          'Ley Nacional Nº 19.587 de Higiene y Seguridad en el Trabajo (Arts. 4, 8 y 9)',
          'Decreto Reglamentario Nº 351/79 (Anexo I — Condiciones de Higiene y Seguridad)',
          'Resolución SRT Nº 905/15 (Funciones del Servicio de Higiene y Seguridad)'
        ]
      : [
          'Ley Nacional Nº 19.587 de Higiene y Seguridad en el Trabajo (Arts. 8 inc. c y 10 inc. a)',
          'Decreto Nº 351/79 — Capítulo 19 (Equipos y Elementos de Protección Personal, Arts. 188 a 203)',
          'Resolución SRT Nº 299/11 (Provisión de EPP Certificados y Registro)',
          'Resolución SIyC Nº 18/25 (Reglamento Técnico de Elementos de Protección Personal)'
        ];

  const immediateActionText = data.analysis?.immediateAction || (
    isGeneralRisks
      ? (detections.length > 0
          ? 'Delimitar el sector afectado, implementar las medidas correctivas detalladas en la matriz de hallazgos y verificar condiciones seguras antes de reanudar tareas.'
          : 'Mantener las condiciones de orden, limpieza y señalización preventiva observadas en el sector.')
      : (isCompliant
          ? 'Mantener el uso permanente de los Elementos de Protección Personal (EPP) durante toda la jornada y registrar entrega en planilla Res. SRT 299/11.'
          : 'Suspender momentáneamente la tarea del operario hasta completar la colocación de la totalidad de los EPP obligatorios certificados (Res. SRT 299/11).')
  );

  const generalAssessmentText = data.analysis?.generalAssessment || (
    isGeneralRisks
      ? (detections.length > 0
          ? `El motor de Visión Artificial EHS identificó ${detections.length} desvío(s) / condición(es) insegura(s) en el entorno inspeccionado que requieren intervención preventiva bajo el marco de la Ley 19.587 y Dec. 351/79.`
          : 'Relevamiento visual asistido por IA sin detección de condiciones inseguras críticas evidentes en la escena capturada.')
      : (isCompliant
          ? `Verificación positiva de Elementos de Protección Personal (EPP). Se constata un cumplimiento del ${ppeCompliancePct}% sobre los equipos primarios exigidos para el puesto.`
          : `Se detecta incumplimiento parcial o falta de Elementos de Protección Personal obligatorios (${corePpePassed}/${corePpeChecked.length} elementos básicos verificados). Requiere regularización inmediata antes de continuar la exposición al riesgo.`)
  );

  return (
    <div
      id="pdf-content"
      className="card report-print bg-white text-slate-900 box-border"
      style={{
        width: '100%',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '10mm 12mm',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        boxShadow: 'none',
        border: 'none'
      }}
    >
      {/* 1. ENCABEZADO INSTITUCIONAL */}
      <DualPdfHeader
        title={
          isGeneralRisks
            ? 'INFORME TÉCNICO DE RELEVAMIENTO DE RIESGOS POR IA'
            : 'ACTA E INFORME TÉCNICO DE VERIFICACIÓN DE EPP POR IA'
        }
        subtitle={
          isGeneralRisks
            ? 'LEY 19.587 · DEC. 351/79 · INSPECCIÓN OCULAR ASISTIDA POR VISIÓN ARTIFICIAL'
            : 'LEY 19.587 · DEC. 351/79 CAP. 19 · RES. SRT 299/11 · RES. SIyC 18/25'
        }
      />

      {/* 2. DICTAMEN EJECUTIVO Y KPI BANNER */}
      <div
        className="no-break"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 14px',
          marginBottom: '12px',
          borderRadius: '8px',
          backgroundColor: isCompliant ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${isCompliant ? '#86efac' : '#fca5a5'}`,
          borderLeft: `6px solid ${isCompliant ? '#16a34a' : '#dc2626'}`,
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: isCompliant ? '#15803d' : '#b91c1c',
              marginBottom: '2px'
            }}
          >
            DICTAMEN TÉCNICO DE INSPECCIÓN OCULAR IA · ACTA #{String(data.id || Date.now()).slice(-6)}
          </div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 900,
              color: isCompliant ? '#14532d' : '#7f1d1d',
              letterSpacing: '-0.01em'
            }}
          >
            {isGeneralRisks
              ? isCompliant
                ? '✓ ENTORNO OPERATIVO CONFORME — SIN DESVÍOS CRÍTICOS EVIDENTES'
                : `⚠️ CONDICIÓN INSEGURA DETECTADA (${detections.length || foundRisks.length} HALLAZGO/S)`
              : isCompliant
                ? '✓ CUMPLIMIENTO DE EPP CONFORME A NORMATIVA VIGENTE'
                : '⚠️ INCUMPLIMIENTO DE EPP — REQUIERE REGULARIZACIÓN INMEDIATA'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: `1px solid ${riskBadgeStyle.border}`,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Nivel de Riesgo
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 900, color: riskBadgeStyle.text }}>
              {riskBadgeStyle.label}
            </div>
          </div>

          <div
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              {isGeneralRisks ? 'Hallazgos IA' : 'Índice EPP'}
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#0f172a' }}>
              {isGeneralRisks ? `${detections.length || foundRisks.length} Detectados` : `${ppeCompliancePct}% (${corePpePassed}/${corePpeChecked.length})`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN I: DATOS TÉCNICOS DEL RELEVAMIENTO */}
      <div
        className="no-break"
        style={{
          marginBottom: '12px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '5px 10px',
            fontSize: '0.68rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}
        >
          I. IDENTIFICACIÓN DEL ESTABLECIMIENTO Y TRAZABILIDAD DEL ESCANEO
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.72rem',
            border: '1px solid #cbd5e1'
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', width: '18%' }}>
                EMPRESA / CLIENTE:
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', width: '32%' }}>
                {company}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', width: '18%' }}>
                FECHA Y HORA:
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', width: '32%' }}>
                {formattedDate}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                SECTOR / UBICACIÓN:
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                {location}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                {isGeneralRisks ? 'RESPONSABLE SECTOR:' : 'OPERARIO AUDITADO:'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                {workerName}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                ALCANCE / TAREA:
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                {taskDescription}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                PROFESIONAL ACTUANTE:
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                {profile?.name || 'Servicio de Higiene y Seguridad'} {profile?.license ? `(Mat. ${profile.license})` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. SECCIÓN II: EVIDENCIA FOTOGRÁFICA Y DIAGNÓSTICO EJECUTIVO */}
      <div
        className="no-break"
        style={{
          marginBottom: '12px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '5px 10px',
            fontSize: '0.68rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}
        >
          II. EVIDENCIA FOTOGRÁFICA Y DIAGNÓSTICO DE VISIÓN ARTIFICIAL
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '230px 1fr',
            gap: '12px',
            padding: '10px',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Fotografía */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #334155',
              position: 'relative',
              minHeight: '175px'
            }}
          >
            {data.image ? (
              <img
                src={data.image}
                alt="Evidencia fotográfica IA"
                crossOrigin="anonymous"
                style={{
                  maxHeight: '195px',
                  width: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{ padding: '20px', color: '#94a3b8', fontSize: '0.7rem', textAlign: 'center' }}>
                Registro fotográfico archivado en historial digital
              </div>
            )}
            <div
              style={{
                width: '100%',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                fontSize: '0.58rem',
                fontWeight: 700,
                padding: '4px 6px',
                textAlign: 'center',
                borderTop: '1px solid #334155'
              }}
            >
              EVIDENCIA ÓPTICA · {formattedDate}
            </div>
          </div>

          {/* Diagnóstico y Acción Inmediata */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', marginBottom: '3px' }}>
                DIAGNÓSTICO TÉCNICO AUTOMATIZADO
              </div>
              <p style={{ margin: 0, fontSize: '0.73rem', color: '#1e293b', lineHeight: 1.45 }}>
                {generalAssessmentText}
              </p>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: isCompliant ? '#f0fdf4' : '#fff1f2',
                border: `1px solid ${isCompliant ? '#bbf7d0' : '#fecdd3'}`,
                borderLeft: `4px solid ${isCompliant ? '#16a34a' : '#e11d48'}`
              }}
            >
              <div
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  color: isCompliant ? '#166534' : '#be123c',
                  textTransform: 'uppercase',
                  marginBottom: '3px'
                }}
              >
                {isCompliant ? 'MEDIDA DE MANTENIMIENTO PREVENTIVO' : '⚠️ ACCIÓN CORRECTIVA INMEDIATA (PLAZO: INMEDIATO / < 24 HS)'}
              </div>
              <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 700, color: isCompliant ? '#14532d' : '#881337', lineHeight: 1.4 }}>
                {immediateActionText}
              </p>
            </div>

            {(data.notes || data.observations) && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a'
                }}
              >
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', marginBottom: '2px' }}>
                  OBSERVACIONES DEL PROFESIONAL ACTUANTE
                </div>
                <p style={{ margin: 0, fontSize: '0.71rem', color: '#78350f', lineHeight: 1.35 }}>
                  {data.notes || data.observations}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN III: MATRIZ TÉCNICA DE EVALUACIÓN (EPP O RIESGOS GENERALES) */}
      <div
        className="no-break"
        style={{
          marginBottom: '12px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '5px 10px',
            fontSize: '0.68rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}
        >
          {isGeneralRisks
            ? 'III. MATRIZ DE PELIGROS, CONDICIONES INSEGURAS Y MEDIDAS CORRECTIVAS'
            : 'III. MATRIZ DE VERIFICACIÓN NORMATIVA DE ELEMENTOS DE PROTECCIÓN PERSONAL (RES. SRT 299/11)'}
        </div>

        {!isGeneralRisks ? (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.68rem',
              border: '1px solid #cbd5e1'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b', textAlign: 'left' }}>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '9%', fontWeight: 900 }}>CÓD.</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '25%', fontWeight: 900 }}>ELEMENTO DE PROTECCIÓN (EPP)</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '17%', fontWeight: 900 }}>CERTIFICACIÓN / IRAM</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '14%', fontWeight: 900, textAlign: 'center' }}>ESTADO IA</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '35%', fontWeight: 900 }}>PRESCRIPCIÓN TÉCNICA / ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {ppeItems.map((item, idx) => (
                <tr key={item.code} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>
                    {item.code}
                  </td>
                  <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                    {item.label}
                    <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#64748b' }}>{item.legal}</div>
                  </td>
                  <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#334155' }}>
                    {item.norm}
                  </td>
                  <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        backgroundColor: item.pass ? '#dcfce7' : (item.required ? '#fee2e2' : '#fef3c7'),
                        color: item.pass ? '#166534' : (item.required ? '#991b1b' : '#92400e'),
                        border: `1px solid ${item.pass ? '#86efac' : (item.required ? '#fca5a5' : '#fde68a')}`
                      }}
                    >
                      {item.pass ? '✓ CUMPLE' : (item.required ? '✕ FALTA EPP' : 'VERIFICAR')}
                    </span>
                  </td>
                  <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', color: '#1e293b', lineHeight: 1.35 }}>
                    {item.pass ? item.actionOk : item.actionFail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.69rem',
              border: '1px solid #cbd5e1'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b', textAlign: 'left' }}>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '7%', textAlign: 'center', fontWeight: 900 }}>N°</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '28%', fontWeight: 900 }}>PELIGRO / DESVÍO DETECTADO EN IMAGEN</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '13%', textAlign: 'center', fontWeight: 900 }}>SEVERIDAD</th>
                <th style={{ padding: '6px 7px', border: '1px solid #cbd5e1', width: '52%', fontWeight: 900 }}>MEDIDA CORRECTIVA / PREVENTIVA OBLIGATORIA</th>
              </tr>
            </thead>
            <tbody>
              {detections.length > 0 ? (
                detections.map((det: any, i: number) => {
                  const sev = (det.severity || 'Alto').toString();
                  const sevLower = sev.toLowerCase();
                  const sevColor =
                    sevLower.includes('crít') || sevLower.includes('crit')
                      ? { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
                      : sevLower.includes('alt')
                        ? { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }
                        : sevLower.includes('med')
                          ? { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }
                          : { bg: '#dcfce7', text: '#166534', border: '#86efac' };

                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>
                        #{i + 1}
                      </td>
                      <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                        {det.label || 'Condición insegura detectada'}
                      </td>
                      <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.6rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            backgroundColor: sevColor.bg,
                            color: sevColor.text,
                            border: `1px solid ${sevColor.border}`
                          }}
                        >
                          {sev}
                        </span>
                      </td>
                      <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', color: '#1e293b', lineHeight: 1.35 }}>
                        {det.recommendation || 'Implementar control de ingeniería/administrativo y señalizar el área conforme Ley 19.587 / Dec. 351/79.'}
                      </td>
                    </tr>
                  );
                })
              ) : foundRisks.length > 0 ? (
                foundRisks.map((riskText: string, i: number) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>
                      #{i + 1}
                    </td>
                    <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                      {riskText}
                    </td>
                    <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: '#c2410c' }}>
                      ALTO / MEDIO
                    </td>
                    <td style={{ padding: '6px 7px', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                      Regularizar condición observada y verificar cumplimiento conforme Decreto 351/79.
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>
                    ✓ No se registraron desvíos ni condiciones inseguras críticas en la escena relevada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Riesgos adicionales en modo EPP si existen */}
        {!isGeneralRisks && (foundRisks.length > 0 || detections.some((d: any) => d.recommendation)) && (
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid #cbd5e1',
              borderTop: 'none',
              backgroundColor: '#fffbeb',
              fontSize: '0.68rem'
            }}
          >
            <div style={{ fontWeight: 900, color: '#92400e', textTransform: 'uppercase', marginBottom: '3px' }}>
              HALLAZGOS ADICIONALES Y RECOMENDACIONES ESPECÍFICAS EN ESCENA:
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#78350f', lineHeight: 1.4 }}>
              {foundRisks.map((r, idx) => (
                <li key={`fr-${idx}`}>{r}</li>
              ))}
              {detections.filter((d: any) => d.recommendation).map((d: any, idx: number) => (
                <li key={`dr-${idx}`}>
                  <strong>{d.label}:</strong> {d.recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 6. SECCIÓN IV: ENCUADRE LEGAL Y NORMATIVO APLICABLE */}
      <div
        className="no-break"
        style={{
          marginBottom: '10px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '4px 10px',
            fontSize: '0.64rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}
        >
          IV. MARCO NORMATIVO Y REGLAMENTARIO DE REFERENCIA (REPÚBLICA ARGENTINA)
        </div>
        <div
          style={{
            padding: '7px 10px',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            backgroundColor: '#f8fafc',
            fontSize: '0.67rem',
            color: '#334155'
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 14px' }}>
            {applicableLegislation.map((leg, i) => (
              <li key={i} style={{ fontWeight: 600 }}>{leg}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7. FIRMAS Y SELLO PROFESIONAL */}
      <PdfSignatures
        data={{
          ...data,
          professionalSignature: signature?.signature || data.professionalSignature,
          professionalStamp: signature?.stamp || data.professionalStamp,
          professionalName: profile?.name || data.professionalName,
          professionalLicense: profile?.license || data.professionalLicense
        }}
        box1={
          showSignatures.operator !== false
            ? {
                title: isGeneralRisks ? 'RESPONSABLE DEL SECTOR' : 'TRABAJADOR / OPERADOR',
                subtitle: 'Notificado · Firma y Aclaración',
                signatureUrl: null,
                isProfessional: false
              }
            : null
        }
        box3={
          showSignatures.supervisor !== false
            ? {
                title: 'SUPERVISOR / EMPLEADOR',
                subtitle: 'Toma de Conocimiento',
                signatureUrl: null,
                isProfessional: false
              }
            : null
        }
        box2={showSignatures.professional !== false ? undefined : null}
      />

      <PdfBrandingFooter />
    </div>
  );
}
