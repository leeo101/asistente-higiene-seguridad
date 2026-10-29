import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Activity,
  Lock
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { ArcFlashPermitData, PPE_CATEGORY_DESCRIPTIONS } from '../data/arcFlashData';

interface ArcFlashPdfGeneratorProps {
  permit: ArcFlashPermitData;
  companyName?: string;
  pdfElementId?: string;
}

const CHECKLIST_ITEMS: { key: keyof ArcFlashPermitData['checklist']; label: string; law: string }[] = [
  { key: 'justificationLiveWorkDocumented', label: 'Justificación técnica documentada de imposibilidad de corte', law: 'Res. SRT 3068/14 Anexo I' },
  { key: 'electricallySafeWorkConditionEvaluated', label: 'Análisis previo de puesta en condición eléctricamente segura (5 Reglas)', law: 'NFPA 70E Art. 120' },
  { key: 'insulatedTools1000vInspected', label: 'Herramientas aisladas certificadas 1000 V (IEC 60900) inspeccionadas', law: 'IEC 60900 / IRAM' },
  { key: 'dielectricGlovesClassVerified', label: 'Guantes dieléctricos ensayados y verificados neumáticamente pre-uso', law: 'IEC 60903 / ASTM D120' },
  { key: 'voltageDetectorCalibrated', label: 'Detector de tensión bipolar / pértiga verificada con fuente conocida', law: 'Regla de Oro N° 3' },
  { key: 'arcFlashSuitCertified', label: 'Indumentaria ignífuga / Traje Arc Flash acorde a cal/cm² calculadas', law: 'ASTM F1506 / NFPA 70E' },
  { key: 'rescueHookAvailable', label: 'Pértiga dieléctrica de salvamento y banqueta/alfombra en zona de maniobra', law: 'Res. SRT 3068/14' },
  { key: 'trainedPersonnelCertified', label: 'Personal con habilitación BT/MT vigente (Credencial firmada por H&S)', law: 'Dec. 351/79 Anexo VI' }
];

const GLOVE_VOLTAGE_MAP: Record<string, string> = {
  '00': 'Hasta 500 V AC',
  '0': 'Hasta 1.000 V AC',
  '1': 'Hasta 7.500 V AC',
  '2': 'Hasta 17.000 V AC',
  '3': 'Hasta 26.500 V AC',
  '4': 'Hasta 36.000 V AC',
};

export const ArcFlashPdfGenerator: React.FC<ArcFlashPdfGeneratorProps> = ({
  permit,
  companyName,
  pdfElementId = 'pdf-content-arc-flash'
}) => {
  if (!permit) return null;

  // Fallback para datos del profesional H&S desde localStorage si el permiso es antiguo
  let actName = '';
  let actLic = '';
  let actTitle = 'PROFESIONAL HIGIENE Y SEGURIDAD';
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

  const ppeCat = permit.ppeCategory;
  const ppeInfo = PPE_CATEGORY_DESCRIPTIONS[ppeCat] || PPE_CATEGORY_DESCRIPTIONS[1];

  const getPpeTheme = () => {
    if (ppeCat === 'prohibited') {
      return {
        bg: '#fef2f2',
        border: '#dc2626',
        badgeBg: '#dc2626',
        text: '#991b1b',
        label: 'TRABAJO CON TENSIÓN PROHIBIDO (> 40 cal/cm²)'
      };
    }
    if (ppeCat === 4) {
      return {
        bg: '#fff1f2',
        border: '#f43f5e',
        badgeBg: '#e11d48',
        text: '#881337',
        label: 'EPP CATEGORÍA 4 — RIESGO EXTREMO (≤ 40 cal/cm²)'
      };
    }
    if (ppeCat === 3) {
      return {
        bg: '#fffbeb',
        border: '#f59e0b',
        badgeBg: '#d97706',
        text: '#78350f',
        label: 'EPP CATEGORÍA 3 — RIESGO ALTO (≤ 25 cal/cm²)'
      };
    }
    if (ppeCat === 2) {
      return {
        bg: '#eff6ff',
        border: '#3b82f6',
        badgeBg: '#2563eb',
        text: '#1e3a8a',
        label: 'EPP CATEGORÍA 2 — RIESGO MODERADO (≤ 8 cal/cm²)'
      };
    }
    return {
      bg: '#ecfdf5',
      border: '#10b981',
      badgeBg: '#059669',
      text: '#065f46',
      label: 'EPP CATEGORÍA 1 — RIESGO BAJO (≤ 4 cal/cm²)'
    };
  };

  const ppeTheme = getPpeTheme();

  const checkedCount = Object.values(permit.checklist || {}).filter(Boolean).length;

  // Configuración de firmas estilo ATS
  const showOperator = permit.showSignatures?.operator ?? true;
  const showSupervisor = permit.showSignatures?.supervisor ?? true;
  const showProfessional = permit.showSignatures?.professional ?? true;

  const box1 = showOperator
    ? {
        title: 'ELECTRICISTA HABILITADO (EJECUTANTE)',
        subtitle: (permit.leadElectrician || 'FIRMA EN OBRA / ACLARACIÓN').toUpperCase(),
        signatureUrl: permit.electricianSignature || null,
        license: permit.electricianLicense ? `Hab. ${permit.electricianLicense}` : null,
        isProfessional: false
      }
    : null;

  const box2 = showSupervisor
    ? {
        title: 'EMISOR / AUTORIZANTE DE PLANTA',
        subtitle: (
          permit.plantManager
            ? `${permit.plantManager}${permit.plantManagerSector ? ` (${permit.plantManagerSector})` : ''}`
            : 'JEFE DE MANTENIMIENTO / OPERACIONES'
        ).toUpperCase(),
        signatureUrl: permit.plantManagerSignature || null,
        isProfessional: false
      }
    : null;

  const profName = permit.safetySupervisor || actName || 'FIRMA Y SELLO PROFESIONAL';
  const profLic = permit.supervisorLicense || actLic || null;
  const profSig = permit.supervisorSignature !== undefined ? permit.supervisorSignature : actSignature;
  const profStamp = permit.professionalStamp !== undefined ? permit.professionalStamp : actStamp;
  const profTitle = (permit.professionalTitle || actTitle || 'PROFESIONAL HIGIENE Y SEGURIDAD').toUpperCase();

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

  return (
    <div
      id={pdfElementId}
      className="pdf-container print-area arc-flash-print-root bg-white text-slate-900 font-sans shadow-none print:shadow-none print:p-0"
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
        fontSize: '9.5pt',
        lineHeight: 1.25
      }}
    >
      <style type="text/css" media="print">{`
        @page { size: A4 portrait; margin: 7mm 9mm; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .arc-flash-print-root, .arc-flash-print-root * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .avoid-break, .pdf-signatures-wrapper, .pdf-brand-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>
      {/* CABECERA FORMAL ESTILO ATS / MEDICINA */}
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
                letterSpacing: '0.1em',
                color: '#d97706',
                marginBottom: '2px'
              }}
            >
              <Zap size={10} /> Seguridad Eléctrica · Res. S.R.T. N° 3068/14 · NFPA 70E · IEEE 1584
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '12.5pt',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#0f172a',
                textTransform: 'uppercase'
              }}
            >
              Permiso de Trabajo con Tensión y Arco Eléctrico
            </h1>
            <p style={{ margin: '1px 0 0 0', fontSize: '7.5pt', color: '#475569', fontWeight: 600 }}>
              Evaluación de Energía Incidente (Arc Flash), Frontera de Protección y Verificación de 5 Reglas de Oro
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '140px' }}>
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
            PERMISO N° {permit.permitNumber}
          </div>
          <div style={{ fontSize: '7pt', color: '#334155', marginTop: '3px', fontWeight: 700 }}>
            FECHA: {permit.date ? new Date(permit.date + 'T12:00:00').toLocaleDateString('es-AR') : '-'}
          </div>
          <div style={{ fontSize: '7pt', color: '#b45309', fontWeight: 800 }}>
            VIGENCIA: {permit.startTime || '08:00'} A {permit.endTime || '17:00'} HS
          </div>
        </div>
      </div>

      {/* BANNER DE CÁLCULO DE ENERGÍA INCIDENTE Y CATEGORÍA EPP */}
      <div
        style={{
          backgroundColor: ppeTheme.bg,
          border: `1.5px solid ${ppeTheme.border}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr 1.6fr',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        {/* Métrica 1: Energía Incidente */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRight: `1px solid ${ppeTheme.border}40`,
            paddingRight: '8px'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              backgroundColor: ppeTheme.badgeBg,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Flame size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: '6.5pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: ppeTheme.text,
                letterSpacing: '0.04em'
              }}
            >
              Energía Incidente (IEEE 1584)
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {permit.calculatedIncidentEnergyCalCm2}{' '}
              <span style={{ fontSize: '8pt', fontWeight: 800, color: ppeTheme.text }}>cal/cm²</span>
            </div>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#475569' }}>
              a {permit.workingDistanceCm} cm de distancia operativa
            </div>
          </div>
        </div>

        {/* Métrica 2: Frontera de Arco Eléctrico */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRight: `1px solid ${ppeTheme.border}40`,
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
            <Activity size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: '6.5pt',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#334155',
                letterSpacing: '0.04em'
              }}
            >
              Frontera de Arco (1.2 cal/cm²)
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {permit.arcFlashBoundaryMeters}{' '}
              <span style={{ fontSize: '8pt', fontWeight: 800, color: '#475569' }}>metros</span>
            </div>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#475569' }}>
              Radio de vallado perimetral
            </div>
          </div>
        </div>

        {/* Métrica 3: Categoría EPP y Traje */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <div
              style={{
                backgroundColor: ppeTheme.badgeBg,
                color: '#ffffff',
                fontSize: '7pt',
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              {ppeTheme.label}
            </div>
            <div
              style={{
                fontSize: '6.5pt',
                fontWeight: 800,
                color: permit.isLiveWork ? '#b45309' : '#065f46',
                backgroundColor: permit.isLiveWork ? '#fef3c7' : '#d1fae5',
                padding: '1px 6px',
                borderRadius: '4px',
                border: `1px solid ${permit.isLiveWork ? '#f59e0b' : '#10b981'}`
              }}
            >
              {permit.isLiveWork ? '⚡ TRABAJO CON TENSIÓN (TcT)' : '🔒 DESENERGIZADO / PROXIMIDAD'}
            </div>
          </div>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>
            {ppeInfo.desc}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: IDENTIFICACIÓN DEL EQUIPO Y PARÁMETROS ELÉCTRICOS */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '3.5px 9px',
            borderRadius: '4px 4px 0 0',
            fontSize: '7.5pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffffff' }}>
            <Zap size={11} /> 1. Identificación de Instalación, Parámetros de Cortocircuito y Protección Dieléctrica
          </div>
          <div style={{ fontSize: '6.5pt', color: '#cbd5e1', fontWeight: 700 }}>
            EMPRESA / PLANTA: {(companyName || 'ESTABLECIMIENTO INDUSTRIAL').toUpperCase()}
          </div>
        </div>
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            borderRadius: '0 0 5px 5px',
            padding: '7px 10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px 10px',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Tablero / Celda / Equipo Intervenido (TAG)
            </div>
            <div style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>
              {permit.panelOrEquipmentTag || '-'}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Subestación / Sala Eléctrica / Ubicación Física
            </div>
            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#0f172a' }}>
              {permit.substationOrLocation || '-'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Tensión Nominal (Un)
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a' }}>
              {permit.nominalVoltageV.toLocaleString('es-AR')} V AC{' '}
              <span style={{ fontSize: '7pt', fontWeight: 700, color: '#475569' }}>
                ({permit.nominalVoltageV <= 1000 ? 'BT' : 'MT/AT'})
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Corriente Cortocircuito (Icc)
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a' }}>
              {permit.shortCircuitKa} kA simétricos
            </div>
          </div>

          <div>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Tiempo Despeje Protección (t)
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a' }}>
              {permit.clearingTimeSeconds} seg ({Math.round(permit.clearingTimeSeconds * 1000)} ms)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '6.5pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
              Guantes Dieléctricos (IEC 60903)
            </div>
            <div style={{ fontSize: '8pt', fontWeight: 900, color: '#047857' }}>
              Clase {permit.gloveClass} ({GLOVE_VOLTAGE_MAP[permit.gloveClass] || 'Certificado'}) · Lab:{' '}
              {permit.gloveLastTestDate ? new Date(permit.gloveLastTestDate + 'T12:00:00').toLocaleDateString('es-AR') : 'Vigente'}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CHECKLIST DE VERIFICACIÓN OBLIGATORIA (RES. SRT 3068/14 & NFPA 70E) */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '3.5px 9px',
            borderRadius: '4px 4px 0 0',
            fontSize: '7.5pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffffff' }}>
            <ShieldCheck size={11} /> 2. Lista de Verificación de Seguridad Eléctrica Pre-Maniobra (Res. SRT 3068/14)
          </div>
          <div
            style={{
              fontSize: '6.5pt',
              fontWeight: 900,
              color: checkedCount === 8 ? '#6ee7b7' : '#fde047'
            }}
          >
            CUMPLIMIENTO: {checkedCount} / 8 PUNTOS VERIFICADOS
          </div>
        </div>

        <div
          style={{
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            borderRadius: '0 0 5px 5px',
            padding: '6px 8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5px'
          }}
        >
          {CHECKLIST_ITEMS.map((item, idx) => {
            const passed = Boolean(permit.checklist?.[item.key]);
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  padding: '4.5px 7px',
                  borderRadius: '5px',
                  border: `1px solid ${passed ? '#a7f3d0' : '#fecdd3'}`,
                  backgroundColor: passed ? '#f0fdf4' : '#fff1f2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <div style={{ color: passed ? '#059669' : '#e11d48', flexShrink: 0, display: 'flex' }}>
                    {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '7.2pt',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.15
                      }}
                    >
                      {idx + 1}. {item.label}
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b', fontWeight: 700 }}>{item.law}</div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '6.2pt',
                    fontWeight: 900,
                    padding: '1.5px 5px',
                    borderRadius: '3px',
                    backgroundColor: passed ? '#059669' : '#e11d48',
                    color: '#ffffff',
                    flexShrink: 0,
                    letterSpacing: '0.03em'
                  }}
                >
                  {passed ? 'CUMPLE' : 'PENDIENTE'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: PROCEDIMIENTO / SECUENCIA DE MANIOBRA Y CONDICIONES PARTICULARES */}
      <div style={{ marginBottom: '6px' }}>
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '3.5px 9px',
            borderRadius: '4px 4px 0 0',
            fontSize: '7.5pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Lock size={11} /> 3. Secuencia de Maniobra, LOTO y Precauciones Especiales en el Punto de Trabajo
        </div>
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            borderRadius: '0 0 5px 5px',
            padding: '6px 10px',
            backgroundColor: '#ffffff',
            fontSize: '7.5pt',
            color: '#1e293b',
            fontWeight: 600,
            minHeight: '26px'
          }}
        >
          {permit.notes && permit.notes.trim() ? (
            permit.notes
          ) : (
            <span style={{ color: '#475569' }}>
              Se exige vallado perimetral a {permit.arcFlashBoundaryMeters} m del tablero, uso permanente de guantes
              dieléctricos Clase {permit.gloveClass} con sobreguante de cuero protector, careta/escafandra ignífuga CAT{' '}
              {permit.ppeCategory === 'prohibited' ? 'PROHIBIDO' : permit.ppeCategory} y presencia de vigía eléctrico con
              pértiga de rescate. Prohibido el uso de objetos metálicos personales (relojes, anillos, cadenas).
            </span>
          )}
        </div>
      </div>

      {/* DECLARACIÓN JURADA RES. SRT 3068/14 */}
      <div
        style={{
          marginBottom: '6px',
          padding: '4px 10px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '4px',
          fontSize: '6.8pt',
          color: '#92400e',
          textAlign: 'center',
          fontWeight: 700
        }}
      >
        Los firmantes certifican haber inspeccionado in situ las barreras aislantes, el estado de los EPP contra arco
        eléctrico y el cumplimiento estricto de la Res. S.R.T. N° 3068/14 y NFPA 70E antes de autorizar la intervención.
      </div>

      {/* BLOQUE DE FIRMAS DIGITALIZADAS ESTILO ATS + PIE DE PÁGINA OFICIAL */}
      <div style={{ marginTop: '4px' }}>
        <PdfSignatures
          data={{
            ...permit,
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

export default ArcFlashPdfGenerator;
