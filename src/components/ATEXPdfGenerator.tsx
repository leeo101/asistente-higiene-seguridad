import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import {
  ATEXZoneAssessment,
  ATEX_ZONES_GUIDE,
  ATEX_MANDATORY_CONTROLS
} from '../data/atexData';

interface ATEXPdfGeneratorProps {
  assessment: ATEXZoneAssessment;
  companyName?: string;
  pdfElementId?: string;
}

const PROTECTION_MODE_LABELS: Record<string, string> = {
  Ex_d: 'Ex d (Antideflagrante)',
  Ex_e: 'Ex e (Seg. Aumentada)',
  Ex_ia: 'Ex ia (Intrínseca Z0)',
  Ex_ib: 'Ex ib (Intrínseca Z1)',
  Ex_p: 'Ex p (Presurizado)',
  Ex_t: 'Ex t (Polvos Comb.)',
  standard_non_ex: 'NO EX (Riesgo Crítico)'
};

const SUBSTANCE_TYPE_LABELS: Record<string, string> = {
  gas_vapor: 'Gases, Vapores o Nieblas Inflamables',
  combustible_dust: 'Polvos Combustibles / Fibras',
  hybrid: 'Mezcla Híbrida (Gas + Polvo)'
};

const VENTILATION_TYPE_LABELS: Record<string, string> = {
  natural: 'Natural',
  forced_mechanical: 'Mecánica Forzada (Extracción)',
  none: 'Sin Ventilación / Confinado'
};

const VENTILATION_DEGREE_LABELS: Record<string, string> = {
  high: 'Alto (Dilución inmediata)',
  medium: 'Medio (Dilución controlada)',
  low: 'Bajo (Persistencia de mezcla)'
};

export const ATEXPdfGenerator: React.FC<ATEXPdfGeneratorProps> = ({
  assessment,
  companyName,
  pdfElementId = 'pdf-content-atex'
}) => {
  if (!assessment) return null;

  // Fallback para datos del profesional H&S desde localStorage
  let actName = '';
  let actLic = '';
  let actTitle = 'ESPECIALISTA EN HIGIENE Y SEGURIDAD LABORAL';
  let actSignature = '';
  let actStamp = '';

  try {
    const pData = localStorage.getItem('personalData');
    if (pData) {
      const parsed = JSON.parse(pData);
      actName = parsed.fullName || parsed.name || '';
      actLic = parsed.license || parsed.matricula || '';
      if (parsed.profession || parsed.title || parsed.specialty) {
        actTitle = (parsed.profession || parsed.title || parsed.specialty).toUpperCase();
      }
    }
    const sData = localStorage.getItem('signatureStampData');
    if (sData) {
      const parsed = JSON.parse(sData);
      actSignature = parsed.signature || '';
      actStamp = parsed.stamp || '';
    }
    const legacySig = localStorage.getItem('capturedSignature');
    if (!actSignature && legacySig) {
      actSignature = legacySig;
    }
  } catch (e) {
    // ignore
  }

  const zoneKey = String(assessment.assignedZone || '1');
  const zoneInfo = ATEX_ZONES_GUIDE[zoneKey] || ATEX_ZONES_GUIDE['1'];

  const getZoneTheme = () => {
    if (zoneKey === '0' || zoneKey === '20') {
      return {
        bg: '#fef2f2',
        border: '#dc2626',
        badgeBg: '#dc2626',
        text: '#991b1b',
        riskLabel: 'RIESGO EXPLOSIVO PERMANENTE / CONTINUO'
      };
    }
    if (zoneKey === '1' || zoneKey === '21') {
      return {
        bg: '#fffbeb',
        border: '#f59e0b',
        badgeBg: '#d97706',
        text: '#78350f',
        riskLabel: 'RIESGO EXPLOSIVO PROBABLE EN OPERACIÓN NORMAL'
      };
    }
    return {
      bg: '#ecfdf5',
      border: '#10b981',
      badgeBg: '#059669',
      text: '#065f46',
      riskLabel: 'RIESGO EXPLOSIVO POCO PROBABLE / CORTA DURACIÓN'
    };
  };

  const zoneTheme = getZoneTheme();

  const controlsObj = assessment.safetyControls || {
    groundingBonding: true,
    gasDetectionSystem: true,
    nonSparkingTools: true,
    antistaticFootwearRequired: true,
    hotWorkPermitMandatory: true,
    exConduitSealsVerified: true,
    explosionReliefVenting: true,
    areaSignageAtExPosted: true
  };

  const totalControls = ATEX_MANDATORY_CONTROLS.length;
  const checkedControls = ATEX_MANDATORY_CONTROLS.filter(c => {
    const val = (controlsObj as any)[c.key];
    return val === undefined ? true : Boolean(val);
  }).length;

  // Configuración de firmas estilo ATS
  const showOperator = assessment.showSignatures?.operator ?? true;
  const showSupervisor = assessment.showSignatures?.supervisor ?? true;
  const showProfessional = assessment.showSignatures?.professional ?? true;

  const box1 = showOperator
    ? {
        title: 'RESPONSABLE OPERATIVO DEL SECTOR',
        subtitle: (assessment.operatorName || 'ENCARGADO DE SECTOR / PLANTA').toUpperCase(),
        signatureUrl: assessment.operatorSignature || null,
        license: assessment.operatorLicense ? `Leg./Mat. ${assessment.operatorLicense}` : null,
        isProfessional: false
      }
    : null;

  const box2 = showSupervisor
    ? {
        title: 'JEFE DE PLANTA / MANTENIMIENTO',
        subtitle: (
          assessment.plantResponsible
            ? `${assessment.plantResponsible}${assessment.plantResponsibleRole ? ` (${assessment.plantResponsibleRole})` : ''}`
            : 'GERENCIA TÉCNICA / OPERACIONES'
        ).toUpperCase(),
        signatureUrl: assessment.plantResponsibleSignature || null,
        isProfessional: false
      }
    : null;

  const profName = assessment.auditorName || actName || 'PROFESIONAL H&S ACTUANTE';
  const profLic = assessment.auditorEnrollment || actLic || null;
  const profSig = assessment.auditorSignature !== undefined ? assessment.auditorSignature : actSignature;
  const profStamp = assessment.professionalStamp !== undefined ? assessment.professionalStamp : actStamp;
  const profTitle = (assessment.professionalTitle || actTitle || 'ESPECIALISTA EN ÁREAS CLASIFICADAS').toUpperCase();

  const box3 = showProfessional
    ? {
        title: profTitle,
        subtitle: profName.toUpperCase(),
        signatureUrl: profSig || null,
        stampUrl: profStamp || null,
        isProfessional: true,
        license: profLic,
        profession: profTitle
      }
    : null;

  const equipmentList = assessment.equipmentList || [];
  const compliantEquipCount = equipmentList.filter(e => e.complianceStatus === 'compliant').length;

  return (
    <div
      id={pdfElementId}
      className="pdf-container print-area atex-print-root bg-white text-slate-900 font-sans shadow-none print:shadow-none print:p-0"
      style={{
        width: '100%',
        maxWidth: '210mm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '12px 18px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        position: 'relative',
        fontSize: '9pt',
        lineHeight: 1.25
      }}
    >
      <style type="text/css" media="print">{`
        @page { size: A4 portrait; margin: 7mm 9mm; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .atex-print-root, .atex-print-root * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .avoid-break, .pdf-signatures-wrapper, .pdf-brand-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>

      {/* CABECERA FORMAL ESTILO ATS / ARC FLASH */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2.5px solid #0f172a',
          paddingBottom: '8px',
          marginBottom: '8px',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CompanyLogo
            style={{
              height: '42px',
              width: 'auto',
              maxWidth: '110px',
              objectFit: 'contain'
            }}
          />
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '6.5pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#d97706',
                marginBottom: '2px'
              }}
            >
              <Zap size={10} /> Atmósferas Explosivas (ATEX) · IEC 60079-10-1/2 · NFPA 70 / 497 · Dec. 351/79 Cap. 18
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '12pt',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#0f172a',
                textTransform: 'uppercase'
              }}
            >
              Estudio de Clasificación de Áreas Peligrosas y Equipos Ex
            </h1>
            <p style={{ margin: '1px 0 0 0', fontSize: '7.2pt', color: '#475569', fontWeight: 600 }}>
              Zonificación por Gases, Vapores o Polvos Combustibles, Prevención de Ignición y Auditoría de Protección Ex
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '145px' }}>
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '7.5pt',
              fontWeight: 900,
              letterSpacing: '0.04em',
              display: 'inline-block'
            }}
          >
            ESTUDIO N° {assessment.assessmentNumber}
          </div>
          <div style={{ fontSize: '7pt', color: '#334155', marginTop: '3px', fontWeight: 700 }}>
            FECHA: {assessment.date ? new Date(assessment.date + 'T12:00:00').toLocaleDateString('es-AR') : '-'}
          </div>
          <div style={{ fontSize: '6.8pt', color: '#b45309', fontWeight: 800 }}>
            NORMA: IEC 60079 / IRAM-IAP
          </div>
        </div>
      </div>

      {/* BANNER DE ZONIFICACIÓN ATEX Y REQUISITOS EPL */}
      <div
        style={{
          backgroundColor: zoneTheme.bg,
          border: `1.5px solid ${zoneTheme.border}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr 1.5fr',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        {/* Columna 1: Zona Asignada */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRight: `1px solid ${zoneTheme.border}40`,
            paddingRight: '8px'
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: zoneTheme.badgeBg,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '8.5pt',
              flexShrink: 0
            }}
          >
            EX
          </div>
          <div>
            <div
              style={{
                fontSize: '6.2pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: zoneTheme.text,
                letterSpacing: '0.04em'
              }}
            >
              Clasificación Reglamentaria
            </div>
            <div style={{ fontSize: '12.5pt', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              ZONA {assessment.assignedZone}
            </div>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#475569' }}>
              Exposición: {zoneInfo.hours}
            </div>
          </div>
        </div>

        {/* Columna 2: Nivel de Protección EPL y Categoría */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRight: `1px solid ${zoneTheme.border}40`,
            paddingRight: '8px'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              backgroundColor: '#0f172a',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Flame size={17} />
          </div>
          <div>
            <div
              style={{
                fontSize: '6.2pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#334155',
                letterSpacing: '0.04em'
              }}
            >
              Nivel Protección (IEC 60079-0)
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }}>
              {zoneInfo.epl} · {zoneInfo.category}
            </div>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#475569' }}>
              {zoneInfo.type === 'gas' ? 'Atmósfera Gaseosa (Grupo II)' : 'Atmósfera Polvo (Grupo III)'}
            </div>
          </div>
        </div>

        {/* Columna 3: Exigencia Técnica */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span
              style={{
                backgroundColor: zoneTheme.badgeBg,
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '6.2pt',
                fontWeight: 900,
                letterSpacing: '0.04em'
              }}
            >
              {zoneTheme.riskLabel}
            </span>
          </div>
          <div style={{ fontSize: '6.8pt', color: '#1e293b', fontWeight: 600, lineHeight: 1.25 }}>
            {zoneInfo.protectionReq}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: IDENTIFICACIÓN DEL SECTOR, SUSTANCIA Y VENTILACIÓN */}
      <div
        className="avoid-break"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '7px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '4px 10px',
            fontSize: '7.2pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Activity size={11} color="#fbbf24" />
          1. Identificación de la Instalación, Sustancia Inflamable y Parámetros de Ventilación
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            padding: '7px 10px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Establecimiento / Planta
            </span>
            <span style={{ fontSize: '7.8pt', fontWeight: 800, color: '#0f172a' }}>
              {companyName || assessment.facilityName || 'Planta Industrial'}
            </span>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Sector / Instalación Clasificada
            </span>
            <span style={{ fontSize: '8pt', fontWeight: 900, color: '#b45309' }}>
              {assessment.areaName || 'Sector Operativo'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Tipo de Atmósfera
            </span>
            <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#0f172a' }}>
              {SUBSTANCE_TYPE_LABELS[assessment.substanceType] || assessment.substanceType}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 0.8fr 0.8fr 0.8fr 1.3fr',
            gap: '6px',
            padding: '7px 10px',
            backgroundColor: '#ffffff'
          }}
        >
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Sustancia / Agente Inflamable
            </span>
            <span style={{ fontSize: '8pt', fontWeight: 900, color: '#0f172a' }}>
              {assessment.substanceName || '-'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Punto Inflamación (Flash Point)
            </span>
            <span style={{ fontSize: '7.8pt', fontWeight: 800, color: '#0f172a' }}>
              {assessment.flashPointC !== undefined && assessment.flashPointC !== null ? `${assessment.flashPointC} °C` : 'N/A (Polvo/Gas)'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Límite Inferior (LEL / LIE)
            </span>
            <span style={{ fontSize: '7.8pt', fontWeight: 800, color: '#0f172a' }}>
              {assessment.lelPercent !== undefined && assessment.lelPercent !== null ? `${assessment.lelPercent} % vol.` : 'Según FDS'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Temp. Autoignición (MIT)
            </span>
            <span style={{ fontSize: '7.8pt', fontWeight: 800, color: '#0f172a' }}>
              {assessment.ignitionTempC !== undefined && assessment.ignitionTempC !== null ? `${assessment.ignitionTempC} °C` : 'Según FDS'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
              Régimen y Grado de Ventilación
            </span>
            <span style={{ fontSize: '7.4pt', fontWeight: 800, color: '#0f172a' }}>
              {VENTILATION_TYPE_LABELS[assessment.ventilationType] || assessment.ventilationType} ·{' '}
              {VENTILATION_DEGREE_LABELS[assessment.ventilationDegree] || assessment.ventilationDegree}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MEDIDAS OBLIGATORIAS DE CONTROL DE FUENTES DE IGNICIÓN */}
      <div
        className="avoid-break"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '7px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '4px 10px',
            fontSize: '7.2pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <ShieldCheck size={11} color="#10b981" />
            <div style={{ color: '#ffffff' }}>
              2. Medidas Obligatorias de Prevención y Control de Fuentes de Ignición (EN 1127-1 / Dec. 351/79)
            </div>
          </div>
          <div
            style={{
              backgroundColor: checkedControls === totalControls ? '#059669' : '#d97706',
              color: '#ffffff',
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '6.2pt',
              fontWeight: 900
            }}
          >
            {checkedControls}/{totalControls} VERIFICADAS
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            padding: '6px 8px',
            backgroundColor: '#ffffff'
          }}
        >
          {ATEX_MANDATORY_CONTROLS.map((ctrl, idx) => {
            const rawVal = (controlsObj as any)[ctrl.key];
            const isCompliant = rawVal === undefined ? true : Boolean(rawVal);

            return (
              <div
                key={ctrl.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  padding: '4px 7px',
                  borderRadius: '5px',
                  backgroundColor: isCompliant ? '#f0fdf4' : '#fef2f2',
                  border: isCompliant ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  {isCompliant ? (
                    <CheckCircle2 size={11} color="#059669" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={11} color="#dc2626" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '6.8pt',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.15
                      }}
                    >
                      {idx + 1}. {ctrl.label}
                    </div>
                    <div style={{ fontSize: '5.8pt', color: '#475569', fontWeight: 700 }}>
                      Norma: {ctrl.law}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '5.8pt',
                    fontWeight: 900,
                    padding: '1.5px 5px',
                    borderRadius: '4px',
                    backgroundColor: isCompliant ? '#059669' : '#dc2626',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  {isCompliant ? 'CUMPLE' : 'NO CUMPLE'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: INVENTARIO Y AUDITORÍA DE EQUIPAMIENTO EX */}
      <div
        className="avoid-break"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '7px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '4px 10px',
            fontSize: '7.2pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <Cpu size={11} color="#38bdf8" />
            <div style={{ color: '#ffffff' }}>
              3. Inventario y Auditoría de Equipamiento Eléctrico / Instrumentación con Protección Ex (IEC 60079-14)
            </div>
          </div>
          <div style={{ fontSize: '6.2pt', color: '#e2e8f0', fontWeight: 800 }}>
            {compliantEquipCount} de {equipmentList.length} equipos aptos
          </div>
        </div>

        {equipmentList.length === 0 ? (
          <div style={{ padding: '8px 10px', fontSize: '7pt', color: '#64748b', textAlign: 'center' }}>
            Sin equipamiento eléctrico instalado dentro del radio de la zona clasificada.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6.8pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 900 }}>TAG</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 900 }}>EQUIPO / COMPONENTE</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 900 }}>MARCADO EX</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 900 }}>PROTECCIÓN</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 900 }}>GRUPO</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 900 }}>CLASE T°</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 900 }}>CERTIFICADO</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 900 }}>DICTAMEN</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.slice(0, 6).map((eq, i) => {
                const isOk = eq.complianceStatus === 'compliant';
                const isNon = eq.complianceStatus === 'non_compliant';
                return (
                  <tr
                    key={eq.id || i}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '3.5px 6px', fontFamily: 'monospace', fontWeight: 900, color: '#0f172a' }}>
                      {eq.tag || `EQ-${i + 1}`}
                    </td>
                    <td style={{ padding: '3.5px 6px', fontWeight: 700, color: '#1e293b' }}>
                      {eq.description || 'Equipo en área clasificada'}
                    </td>
                    <td style={{ padding: '3.5px 6px', fontFamily: 'monospace', fontWeight: 800, color: '#b45309' }}>
                      {eq.exMarking || `Ex ${eq.protectionMode} ${eq.gasGroup} ${eq.tempClass}`}
                    </td>
                    <td style={{ padding: '3.5px 6px', fontWeight: 700, color: '#334155' }}>
                      {PROTECTION_MODE_LABELS[eq.protectionMode] || eq.protectionMode}
                    </td>
                    <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 800 }}>
                      {eq.gasGroup}
                    </td>
                    <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 800 }}>
                      {eq.tempClass}
                    </td>
                    <td style={{ padding: '3.5px 6px', fontFamily: 'monospace', color: '#475569' }}>
                      {eq.certificateNumber || 'S/D'}
                    </td>
                    <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          fontSize: '6pt',
                          fontWeight: 900,
                          backgroundColor: isOk ? '#dcfce7' : isNon ? '#fee2e2' : '#fef3c7',
                          color: isOk ? '#166534' : isNon ? '#991b1b' : '#92400e',
                          border: isOk ? '1px solid #86efac' : isNon ? '1px solid #fca5a5' : '1px solid #fde68a'
                        }}
                      >
                        {isOk ? 'APTO ZONA' : isNon ? 'NO APTO' : 'VERIFICAR'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* OBSERVACIONES Y RECOMENDACIONES TÉCNICAS */}
      {assessment.notes && (
        <div
          className="avoid-break"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '7px',
            padding: '6px 10px',
            backgroundColor: '#fffbeb',
            marginBottom: '8px'
          }}
        >
          <div style={{ fontSize: '6.5pt', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', marginBottom: '2px' }}>
            Observaciones, Sellado de Canalizaciones y Recomendaciones Técnicas:
          </div>
          <div style={{ fontSize: '7pt', color: '#1e293b', fontWeight: 600 }}>
            {assessment.notes}
          </div>
        </div>
      )}

      {/* BLOQUE DE FIRMAS DIGITALIZADAS ESTILO ATS */}
      <div className="avoid-break" style={{ marginTop: '4px' }}>
        <PdfSignatures
          data={{
            ...assessment,
            showSignatures: {
              operator: showOperator,
              supervisor: showSupervisor,
              professional: showProfessional
            },
            professionalSignature: profSig,
            professionalStamp: profStamp,
            professionalName: profName,
            professionalLicense: profLic,
            professionalTitle: profTitle
          }}
          box1={box1}
          box2={box2}
          box3={box3}
          compact={true}
          hideFooter={true}
        />
        <PdfBrandingFooter />
      </div>
    </div>
  );
};

export default ATEXPdfGenerator;
