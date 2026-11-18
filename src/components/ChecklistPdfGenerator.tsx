import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Building2,
  Hash,
  ShieldCheck,
  HardHat,
  FileCheck2
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';

const ALL_NORMS_MAP: Record<string, string> = {
  ley19587: 'Ley 19.587 - Higiene y Seguridad en el Trabajo',
  dec351: 'Decreto 351/79 - Reglamento General de H&S',
  ley24557: 'Ley 24.557 - Riesgos del Trabajo (LRT)',
  dec911: 'Decreto 911/96 - Industria de la Construcción',
  dec249: 'Decreto 249/07 - Minería e Instalaciones Subterráneas',
  dec617: 'Decreto 617/97 - Actividad Agraria',
  dec1338: 'Decreto 1338/96 - Servicios de H&S',
  res905: 'Res. SRT 905/15 - Funciones Servicios H&S',
  res886: 'Res. SRT 886/15 - Protocolo de Ergonomía',
  res85_84: 'Res. SRT 85/12 y 84/12 - Protocolos Ruido/Iluminación',
  res481: 'Res. SRT 481/16 - Estiba y Desestiba',
  res299: 'Res. SRT 299/11 - Trabajo en Altura / EPP Certificados',
  res295: 'Res. SRT 295/03 - Espacios Confinados',
  res101: 'Res. SRT 101/17 - Soldadura',
  res594: 'Res. SRT 594/15 - Agentes Químicos',
  res_srt_45_2026: 'Res. SRT 45/2026 - Declaración Jurada de Riesgos',
  res_srt_28_2026: 'Res. SRT 28/2026 - Riesgos Psicosociales',
  res_srt_8_2026: 'Res. SRT 8/2026 - Protocolo de Salud Mental',
  res_srt_7_2026: 'Res. SRT 7/2026 - Valoración del Daño Corporal',
  res_srt_30_2023: 'Res. SRT 30/23 - Estrés por Calor',
  res_siyc_18_25: 'Res. SIyC 18/25 - Certificación y Marcado AR en EPP',
  art_reglamento: 'Reglamento Interno de Prevención ART',
  iso45001: 'ISO 45001:2018 - Sistema de Gestión SST',
  iso45001_main: 'ISO 45001:2018 - Sistema de Gestión SST',
  iso14001: 'ISO 14001 - Gestión Ambiental',
  iso9001: 'ISO 9001 - Gestión de Calidad',
  nfpa10: 'NFPA 10 - Extintores Portátiles',
  nfpa30: 'NFPA 30 - Líquidos Inflamables',
  nfpa70e: 'NFPA 70E - Seguridad Eléctrica',
  nfpa101: 'NFPA 101 - Código de Seguridad Humana',
  oshact: 'OSHA Act - Seguridad y Salud Ocupacional',
  ansi_z89: 'ANSI Z89.1 - Protección de cabeza',
  ansi_z87: 'ANSI Z87.1 - Protección ocular'
};

const EPP_LABELS_MAP: Record<string, string> = {
  casco: 'Casco de Seguridad (IRAM 3620)',
  guantes: 'Guantes de Protección (IRAM 3607)',
  guantes_dielectricos: 'Guantes Dieléctricos (IRAM 3604)',
  anteojos: 'Protección Ocular (IRAM 3630)',
  protector_facial: 'Protector Facial Integral',
  auditiva: 'Protección Auditiva (IRAM 4060)',
  arnes: 'Arnés Anticaídas (IRAM 3622-1)',
  calzado: 'Calzado de Seguridad (IRAM 3610)',
  calzado_dielectrico: 'Calzado Dieléctrico Certificado',
  respiratoria: 'Protección Respiratoria (IRAM 3648)',
  chaleco: 'Chaleco Reflectivo (EN 20471)',
  ropa_ignifuga: 'Ropa de Trabajo / Ignífuga'
};

function formatDateAr(raw?: string): string {
  if (!raw) return '—';
  try {
    const clean = raw.includes('T') ? raw : `${raw}T12:00:00Z`;
    const d = new Date(clean);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return raw;
  }
}

export default function ChecklistPdfGenerator({
  checklistData,
  showSignatures = { operator: true, supervisor: true, professional: true },
  isHeadless = false,
  pdfElementId = 'pdf-content',
  customId
}: {
  checklistData: any;
  showSignatures?: { operator: boolean; supervisor: boolean; professional: boolean };
  isHeadless?: boolean;
  pdfElementId?: string;
  customId?: string;
}): React.ReactElement | null {
  if (!checklistData) return null;
  const targetId = customId || pdfElementId || 'pdf-content';

  const fullData = checklistData;
  let sections = fullData.activeSections;
  if (!sections) {
    let legacyItems = fullData.items || fullData.checks || [];
    if (!Array.isArray(legacyItems) && typeof legacyItems === 'object') {
      legacyItems = Object.values(legacyItems);
    }
    if (legacyItems.length > 0) {
      sections = [
        {
          id: 'legacy',
          title: 'PUNTOS DE INSPECCIÓN TÉCNICA',
          isMandatory: false,
          items: legacyItems
        }
      ];
    } else {
      sections = [];
    }
  }

  const compInfo = fullData.companyInfo || {
    name: fullData.empresa,
    responsable: fullData.responsable,
    address: fullData.ubicacion || '',
    inspector: fullData.inspector || ''
  };
  const inspInfo = fullData.inspectionInfo || {
    item: fullData.equipo,
    serial: fullData.serial,
    date: fullData.fecha?.split('T')[0]
  };
  const obs = fullData.observations || '';
  const actionPlan = Array.isArray(fullData.actionPlan) ? fullData.actionPlan : [];
  const nextReview = fullData.nextReview || '';
  const selectedNorms: string[] = Array.isArray(fullData.selectedNorms) ? fullData.selectedNorms : [];
  const availableNorms: any[] = Array.isArray(fullData.availableNorms) ? fullData.availableNorms : [];
  const epps: string[] = Array.isArray(fullData.epps) ? fullData.epps : [];
  const fotos: string[] = Array.isArray(fullData.fotos) ? fullData.fotos : [];
  const sigConfig = fullData.showSignatures || showSignatures;

  // Firmas desde localStorage / datos compartidos
  let actSignature = fullData.professionalSignature || null;
  let actName = fullData.professionalName || null;
  let actLic = fullData.professionalLicense || null;
  let actStamp = fullData.professionalStamp || null;

  if (!actSignature || !actName) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = actSignature || parsed.signature;
        actStamp = actStamp || parsed.stamp;
      } else if (legacySig) {
        actSignature = actSignature || legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name || pd.fullName;
        actLic = actLic || pd.license || pd.matricula;
      }
    } catch {
      /* ignore */
    }
  }

  // Estadísticas globales
  let totalItems = 0;
  let okCount = 0;
  let failCount = 0;
  let naCount = 0;
  sections.forEach((section: any) => {
    (section.items || []).forEach((item: any) => {
      totalItems++;
      if (item.status === 'OK' || item.status === 'CUMPLE' || item.value === 'SI' || item.estado === 'SI') {
        okCount++;
      } else if (item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO') {
        failCount++;
      } else if (item.status === 'NA') {
        naCount++;
      }
    });
  });

  const evaluatedEligible = Math.max(0, totalItems - naCount);
  const okPercent = evaluatedEligible > 0 ? Math.round((okCount / evaluatedEligible) * 100) : totalItems > 0 ? Math.round((okCount / totalItems) * 100) : 100;
  const failPercent = totalItems > 0 ? Math.round((failCount / totalItems) * 100) : 0;
  const naPercent = totalItems > 0 ? Math.round((naCount / totalItems) * 100) : 0;

  const activeIds = sections.map((s: any) => s.id);
  const hasTools = activeIds.some((id: string) => ['manual_tools', 'electric_tools', 'circular_saw', 'grinder'].includes(id));
  const hasVehicles =
    activeIds.includes('autoelevadores') ||
    (checklistData.checklistTitle && checklistData.checklistTitle.toLowerCase().includes('autoelevador'));
  const hasPermits = activeIds.some((id: string) => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
  const hasHeavy = activeIds.some((id: string) => ['scaffolding', 'izaje_gruas'].includes(id));
  const hasExtinguishers = activeIds.includes('extintores_checklist');

  const hasCritical = failCount > 0;
  const hasObs = Boolean(obs) || actionPlan.length > 0;

  const verdictConfig = hasCritical
    ? {
        label: hasVehicles
          ? 'NO APTO — EQUIPO FUERA DE SERVICIO (BLOQUEO PREVENTIVO)'
          : `OBSERVADO / NO CONFORME (${failCount} DESVÍO${failCount > 1 ? 'S' : ''} DETECTADO${failCount > 1 ? 'S' : ''})`,
        shortBadge: hasVehicles ? 'FUERA DE SERVICIO' : 'NO CONFORME',
        border: '#dc2626',
        bg: '#fef2f2',
        headerBg: '#991b1b',
        text: '#991b1b',
        pillBg: '#dc2626'
      }
    : hasObs
    ? {
        label: 'APROBADO CON OBSERVACIONES / SEGUIMIENTO PREVENTIVO',
        shortBadge: 'APTO CON OBS.',
        border: '#d97706',
        bg: '#fffbeb',
        headerBg: '#92400e',
        text: '#92400e',
        pillBg: '#d97706'
      }
    : {
        label: 'APROBADO SIN DESVÍOS — CONDICIONES OPERATIVAS CONFORMES',
        shortBadge: 'APROBADO (100% OK)',
        border: '#059669',
        bg: '#ecfdf5',
        headerBg: '#065f46',
        text: '#065f46',
        pillBg: '#059669'
      };

  const docTitle = (checklistData.checklistTitle || 'PROTOCOLO DE INSPECCIÓN Y VERIFICACIÓN TÉCNICA').toUpperCase();
  const docCode = inspInfo.serial || (fullData.id ? `CHK-${String(fullData.id).slice(-6)}` : 'CHK-001');

  return (
    <div
      id={targetId}
      className="pdf-container print-area w-full max-w-[210mm] bg-white text-slate-900 p-[6mm_8mm] box-border mx-auto font-sans"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontSize: '8pt',
        lineHeight: 1.35,
        boxSizing: 'border-box'
      }}
    >
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 8mm; }
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #0f172a !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .print-area {
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            color: #0f172a !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          .avoid-break, .avoid-break-strictly, .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        `}
      </style>

      {/* Franja Institucional Superior */}
      <div
        style={{
          height: '6px',
          width: '100%',
          background: `linear-gradient(90deg, #0f172a 0%, #1e40af 50%, ${verdictConfig.pillBg} 100%)`,
          borderRadius: '4px 4px 0 0',
          marginBottom: '8px'
        }}
      />

      {/* Encabezado Oficial Ejecutivo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          border: '1.5px solid #0f172a',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          backgroundColor: '#f8fafc',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '6pt',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '3px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              SISTEMA DE GESTIÓN H&amp;S
            </span>
            <span
              style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                border: '1px solid #93c5fd',
                fontSize: '6pt',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase'
              }}
            >
              LEY 19.587 · DEC. 351/79 · DEC. 911/96 · ISO 45001
            </span>
          </div>
          <h1
            style={{
              margin: '0 0 2px 0',
              fontSize: '12pt',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              textTransform: 'uppercase'
            }}
          >
            {docTitle}
          </h1>
          <div style={{ fontSize: '7pt', fontWeight: 700, color: '#475569' }}>
            Acta de Relevamiento Técnico, Verificación de Condiciones Operativas y Control Preventivo de Campo
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <CompanyLogo style={{ maxHeight: '34px', maxWidth: '125px', objectFit: 'contain' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '3px 8px'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '5.5pt', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CÓDIGO / REF</div>
              <div style={{ fontSize: '8pt', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{docCode}</div>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '5.5pt', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA</div>
              <div style={{ fontSize: '8pt', fontWeight: 900, color: '#1e40af' }}>{formatDateAr(inspInfo.date || fullData.fecha)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dictamen Técnico y KPIs en Vivo */}
      <div
        data-avoid-break="true"
        className="avoid-break avoid-break-strictly"
        style={{
          border: `1.5px solid ${verdictConfig.border}`,
          backgroundColor: verdictConfig.bg,
          borderRadius: '8px',
          padding: '6px 10px',
          marginBottom: '8px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                backgroundColor: verdictConfig.pillBg,
                color: '#ffffff',
                fontSize: '6.5pt',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              DICTAMEN: {verdictConfig.shortBadge}
            </span>
            <span style={{ fontSize: '7.5pt', fontWeight: 900, color: verdictConfig.text }}>
              {verdictConfig.label}
            </span>
          </div>
          <span style={{ fontSize: '7.5pt', fontWeight: 900, color: verdictConfig.text }}>
            Conformidad: {okPercent}% ({okCount}/{evaluatedEligible || totalItems})
          </span>
        </div>

        {/* Barra de progreso + 4 KPIs compactos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '5px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '5.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL PUNTOS</div>
              <div style={{ fontSize: '10pt', fontWeight: 900, color: '#0f172a' }}>{totalItems}</div>
            </div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>
              {sections.length} Secc.
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '5.5pt', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>CONFORME (C)</div>
              <div style={{ fontSize: '10pt', fontWeight: 900, color: '#15803d' }}>{okCount}</div>
            </div>
            <span style={{ fontSize: '6.5pt', fontWeight: 900, color: '#ffffff', backgroundColor: '#16a34a', padding: '2px 6px', borderRadius: '4px' }}>
              {okPercent}%
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '5.5pt', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>NO CONFORME (NC)</div>
              <div style={{ fontSize: '10pt', fontWeight: 900, color: '#dc2626' }}>{failCount}</div>
            </div>
            <span style={{ fontSize: '6.5pt', fontWeight: 900, color: '#ffffff', backgroundColor: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>
              {failPercent}%
            </span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '5.5pt', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>NO APLICA (N/A)</div>
              <div style={{ fontSize: '10pt', fontWeight: 900, color: '#475569' }}>{naCount}</div>
            </div>
            <span style={{ fontSize: '6.5pt', fontWeight: 900, color: '#ffffff', backgroundColor: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
              {naPercent}%
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${okPercent}%`, backgroundColor: '#16a34a' }} />
          <div style={{ width: `${failPercent}%`, backgroundColor: '#dc2626' }} />
          <div style={{ width: `${naPercent}%`, backgroundColor: '#94a3b8' }} />
        </div>
      </div>

      {/* Sección 1: Identificación Técnica del Relevamiento */}
      <div
        data-avoid-break="true"
        className="avoid-break avoid-break-strictly"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '8px',
          backgroundColor: '#ffffff',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '4px 10px',
            fontSize: '7pt',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>1. IDENTIFICACIÓN DEL ESTABLECIMIENTO, EQUIPO / SECTOR Y ALCANCE</span>
          {nextReview && (
            <span style={{ color: '#93c5fd', fontSize: '6.5pt' }}>
              PRÓXIMA REVISIÓN: {formatDateAr(nextReview)}
            </span>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', width: '16%', fontWeight: 800, color: '#475569' }}>
                EMPRESA / CLIENTE:
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '34%', fontWeight: 900, color: '#0f172a' }}>
                {compInfo.name || fullData.empresa || '—'}
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', width: '16%', fontWeight: 800, color: '#475569' }}>
                UBICACIÓN / OBRA:
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', width: '34%', fontWeight: 800, color: '#1e293b' }}>
                {compInfo.address || compInfo.location || 'Planta Principal'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                {hasPermits ? 'SECTOR / ÁREA:' : 'EQUIPO / SECTOR:'}
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: '#1e40af' }}>
                {inspInfo.item || checklistData.equipo || 'Inspección General'}
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                {hasExtinguishers ? 'CHAPA / N°:' : 'N° SERIE / INTERNO:'}
              </td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                {inspInfo.serial || 'S/N'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', borderBottom: (hasVehicles || hasTools || hasHeavy || hasPermits) ? '1px solid #e2e8f0' : 'none' }}>
                INSPECTOR ACTUANTE:
              </td>
              <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a', borderBottom: (hasVehicles || hasTools || hasHeavy || hasPermits) ? '1px solid #e2e8f0' : 'none' }}>
                {compInfo.inspector || actName || 'Servicio de H&S'}
              </td>
              <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', borderBottom: (hasVehicles || hasTools || hasHeavy || hasPermits) ? '1px solid #e2e8f0' : 'none' }}>
                RESPONSABLE SECTOR:
              </td>
              <td style={{ padding: '4px 8px', fontWeight: 800, color: '#0f172a', borderBottom: (hasVehicles || hasTools || hasHeavy || hasPermits) ? '1px solid #e2e8f0' : 'none' }}>
                {inspInfo.responsableArea || compInfo.responsable || 'Supervisión Operativa'}
              </td>
            </tr>

            {hasVehicles && (
              <tr>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                  MARCA / MODELO:
                </td>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
                  {inspInfo.marca || '—'}
                </td>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                  DOMINIO / HORÓMETRO:
                </td>
                <td style={{ padding: '4px 8px', fontWeight: 800, color: '#0f172a' }}>
                  {inspInfo.patente || 'S/D'} {inspInfo.horometro ? `• ${inspInfo.horometro}` : ''}
                </td>
              </tr>
            )}

            {(hasTools || hasHeavy) && !hasVehicles && inspInfo.marca && (
              <tr>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                  MARCA / MODELO:
                </td>
                <td colSpan={3} style={{ padding: '4px 8px', fontWeight: 800, color: '#0f172a' }}>
                  {inspInfo.marca}
                </td>
              </tr>
            )}

            {hasPermits && inspInfo.pt && (
              <tr>
                <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                  PERMISO DE TRABAJO:
                </td>
                <td colSpan={3} style={{ padding: '4px 8px', fontWeight: 800, color: '#0f172a' }}>
                  PT N° {inspInfo.pt}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección 2: EPP y Marco Normativo (Compacto en 1 bloque si existen) */}
      {(epps.length > 0 || selectedNorms.length > 0) && (
        <div
          data-avoid-break="true"
          className="avoid-break avoid-break-strictly"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
            backgroundColor: '#f8fafc',
            padding: '6px 10px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          {epps.length > 0 && (
            <div style={{ marginBottom: selectedNorms.length > 0 ? '6px' : 0 }}>
              <div style={{ fontSize: '6.5pt', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '3px' }}>
                🪖 ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) VERIFICADOS (RES. SRT 299/11):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {epps.map((epp: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #93c5fd',
                      color: '#1e40af',
                      fontSize: '6.5pt',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}
                  >
                    ✓ {EPP_LABELS_MAP[epp] || epp.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedNorms.length > 0 && (
            <div>
              <div style={{ fontSize: '6.5pt', fontWeight: 900, color: '#581c87', textTransform: 'uppercase', marginBottom: '3px' }}>
                ⚖️ MARCO NORMATIVO Y REGLAMENTARIO APLICABLE:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedNorms.map((normId: string) => {
                  const norm = availableNorms.find((n: any) => n.id === normId);
                  const normName = norm?.name || ALL_NORMS_MAP[normId] || normId;
                  return (
                    <span
                      key={normId}
                      style={{
                        backgroundColor: '#faf5ff',
                        border: '1px solid #d8b4fe',
                        color: '#6b21a8',
                        fontSize: '6.5pt',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      • {normName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sección 3: Tablas de Puntos de Inspección */}
      {sections.map((section: any, sectionIdx: number) => {
        const itemsList: any[] = section.items || [];
        const sectionFails = itemsList.filter(
          (item: any) => item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO'
        );
        const sectionOks = itemsList.filter(
          (item: any) => item.status === 'OK' || item.status === 'CUMPLE' || item.value === 'SI' || item.estado === 'SI'
        );

        return (
          <div
            key={section.id || sectionIdx}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              marginBottom: '8px',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Encabezado de Sección */}
            <div
              style={{
                background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%)',
                color: '#ffffff',
                padding: '5px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {sectionIdx + 1}. {section.title || 'PUNTOS DE VERIFICACIÓN'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '6pt', fontWeight: 800, color: '#cbd5e1' }}>
                  {sectionOks.length}/{itemsList.length} OK
                </span>
                {sectionFails.length > 0 ? (
                  <span
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '1.5px 7px',
                      borderRadius: '999px',
                      fontSize: '6pt',
                      fontWeight: 900
                    }}
                  >
                    ⚠ {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '1.5px 7px',
                      borderRadius: '999px',
                      fontSize: '6pt',
                      fontWeight: 900
                    }}
                  >
                    ✓ CONFORME
                  </span>
                )}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.2pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ width: '28px', padding: '3px 4px', textAlign: 'center', fontWeight: 900, color: '#475569', borderRight: '1px solid #cbd5e1', fontSize: '6.5pt' }}>
                    N°
                  </th>
                  <th style={{ padding: '3px 8px', textAlign: 'left', fontWeight: 900, color: '#334155', borderRight: '1px solid #cbd5e1', fontSize: '6.5pt' }}>
                    CRITERIO TÉCNICO / PUNTO DE INSPECCIÓN VERIFICADO
                  </th>
                  <th style={{ width: '68px', padding: '3px 4px', textAlign: 'center', fontWeight: 900, color: '#334155', fontSize: '6.5pt' }}>
                    ESTADO
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsList.map((item: any, idx: number) => {
                  const isFail = item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO';
                  const isOk = item.status === 'OK' || item.status === 'CUMPLE' || item.value === 'SI' || item.estado === 'SI';
                  const hasItemExtras = Boolean(item.observation) || (Array.isArray(item.photos) && item.photos.length > 0);

                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className="avoid-break"
                        style={{
                          backgroundColor: isFail ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: !hasItemExtras && idx < itemsList.length - 1 ? '1px solid #e2e8f0' : 'none',
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid'
                        }}
                      >
                        <td
                          style={{
                            textAlign: 'center',
                            padding: '4px',
                            borderRight: '1px solid #e2e8f0',
                            fontWeight: 900,
                            color: isFail ? '#b91c1c' : '#475569',
                            fontSize: '6.8pt'
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: '4px 8px',
                            borderRight: '1px solid #e2e8f0',
                            fontWeight: isFail ? 800 : 700,
                            color: isFail ? '#7f1d1d' : '#0f172a',
                            lineHeight: 1.3
                          }}
                        >
                          {item.text || item.pregunta || item.check}
                        </td>
                        <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                          {isOk ? (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                fontWeight: 900,
                                fontSize: '6.5pt',
                                padding: '1.5px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              ✓ CUMPLE
                            </span>
                          ) : isFail ? (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                fontWeight: 900,
                                fontSize: '6.5pt',
                                padding: '1.5px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              ✕ NO CUMPLE
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontWeight: 800,
                                fontSize: '6.5pt',
                                padding: '1.5px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              — N/A
                            </span>
                          )}
                        </td>
                      </tr>

                      {hasItemExtras && (
                        <tr
                          className="avoid-break"
                          style={{
                            backgroundColor: isFail ? '#fff5f5' : '#f8fafc',
                            borderBottom: idx < itemsList.length - 1 ? '1px solid #e2e8f0' : 'none',
                            breakInside: 'avoid',
                            pageBreakInside: 'avoid'
                          }}
                        >
                          <td style={{ borderRight: '1px solid #e2e8f0' }} />
                          <td colSpan={2} style={{ padding: '3px 8px 5px 8px' }}>
                            {item.observation && (
                              <div style={{ fontSize: '6.8pt', color: isFail ? '#991b1b' : '#334155', fontWeight: 700 }}>
                                <strong>📝 Hallazgo / Observación: </strong>
                                <ReportContentRenderer content={item.observation} />
                              </div>
                            )}
                            {Array.isArray(item.photos) && item.photos.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                                {item.photos.map((photo: string, pIdx: number) => (
                                  <img
                                    key={pIdx}
                                    src={photo}
                                    alt={`Evidencia ${pIdx + 1}`}
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Sección 4: Plan de Acción Correctiva (CAPA) y Observaciones Generales */}
      {(actionPlan.length > 0 || obs) && (
        <div
          data-avoid-break="true"
          className="avoid-break avoid-break-strictly"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
            backgroundColor: '#ffffff',
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          <div
            style={{
              backgroundColor: actionPlan.length > 0 ? '#b45309' : '#334155',
              color: '#ffffff',
              padding: '4px 10px',
              fontSize: '7pt',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            🎯 PLAN DE ACCIÓN CORRECTIVA Y OBSERVACIONES DEL INSPECTOR
          </div>

          {actionPlan.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                  <th style={{ width: '26px', padding: '3px 4px', textAlign: 'center', fontWeight: 900, color: '#92400e', borderRight: '1px solid #fde68a' }}>
                    #
                  </th>
                  <th style={{ padding: '3px 8px', textAlign: 'left', fontWeight: 900, color: '#92400e', borderRight: '1px solid #fde68a' }}>
                    MEDIDA CORRECTIVA / ACCIÓN PREVENTIVA REQUERIDA
                  </th>
                  <th style={{ width: '120px', padding: '3px 6px', textAlign: 'left', fontWeight: 900, color: '#92400e', borderRight: '1px solid #fde68a' }}>
                    RESPONSABLE
                  </th>
                  <th style={{ width: '68px', padding: '3px 6px', textAlign: 'center', fontWeight: 900, color: '#92400e', borderRight: '1px solid #fde68a' }}>
                    PLAZO
                  </th>
                  <th style={{ width: '64px', padding: '3px 6px', textAlign: 'center', fontWeight: 900, color: '#92400e' }}>
                    PRIORIDAD
                  </th>
                </tr>
              </thead>
              <tbody>
                {actionPlan.map((action: any, idx: number) => (
                  <tr key={action.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', padding: '4px', fontWeight: 900, color: '#b45309', borderRight: '1px solid #f1f5f9' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>
                      {action.action}
                    </td>
                    <td style={{ padding: '4px 6px', fontWeight: 700, color: '#334155', borderRight: '1px solid #f1f5f9' }}>
                      {action.responsible || 'Supervisión'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#334155', borderRight: '1px solid #f1f5f9' }}>
                      {action.dueDate ? formatDateAr(action.dueDate) : 'Inmediato'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: '6pt',
                          padding: '1.5px 5px',
                          borderRadius: '4px',
                          backgroundColor:
                            action.priority === 'critico'
                              ? '#fee2e2'
                              : action.priority === 'alto'
                              ? '#ffedd5'
                              : '#fef3c7',
                          color:
                            action.priority === 'critico'
                              ? '#b91c1c'
                              : action.priority === 'alto'
                              ? '#c2410c'
                              : '#92400e',
                          textTransform: 'uppercase'
                        }}
                      >
                        {action.priority || 'MEDIO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {obs && (
            <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', fontSize: '7.2pt', color: '#0f172a' }}>
              <strong style={{ color: '#334155', textTransform: 'uppercase', fontSize: '6.5pt', display: 'block', marginBottom: '2px' }}>
                Observaciones y Conclusiones Técnicas del Inspector:
              </strong>
              <ReportContentRenderer content={obs} />
            </div>
          )}
        </div>
      )}

      {/* Evidencia Fotográfica Global */}
      {fotos.length > 0 && (
        <div
          data-avoid-break="true"
          className="avoid-break avoid-break-strictly"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
            backgroundColor: '#ffffff',
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          <div
            style={{
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              padding: '4px 10px',
              fontSize: '7pt',
              fontWeight: 900,
              textTransform: 'uppercase'
            }}
          >
            📸 REGISTRO DE EVIDENCIA FOTOGRÁFICA DE CAMPO ({fotos.length})
          </div>
          <div
            style={{
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(fotos.length, 4)}, 1fr)`,
              gap: '8px',
              backgroundColor: '#f8fafc'
            }}
          >
            {fotos.map((foto: string, index: number) => (
              <div
                key={index}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  textAlign: 'center'
                }}
              >
                <img
                  src={foto}
                  alt={`Evidencia ${index + 1}`}
                  style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ fontSize: '6pt', fontWeight: 800, color: '#475569', padding: '2px 4px' }}>
                  Evidencia #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloque Atómico de Firmas y Pie Institucional */}
      <div
        data-avoid-break="true"
        className="pdf-signatures-wrapper avoid-break avoid-break-strictly break-inside-avoid"
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          display: 'block',
          width: '100%',
          marginTop: '6px'
        }}
      >
        <PdfSignatures
          data={fullData}
          compact={true}
          hideFooter={true}
          box1={
            sigConfig?.operator
              ? {
                  title: 'RESPONSABLE / OPERADOR',
                  subtitle: inspInfo.responsableArea || compInfo.responsable || 'Control Operativo',
                  signatureUrl: fullData.operatorSignature || null,
                  isProfessional: false
                }
              : null
          }
          box2={
            sigConfig?.professional
              ? {
                  title: 'PROFESIONAL ACTUANTE H&S',
                  subtitle: (actName || compInfo.inspector || 'Especialista Higiene y Seguridad').toUpperCase(),
                  signatureUrl: fullData.signature || actSignature || null,
                  stampUrl: fullData.professionalStamp || actStamp || null,
                  isProfessional: true,
                  license: fullData.professionalLicense || actLic || null
                }
              : null
          }
          box3={
            sigConfig?.supervisor
              ? {
                  title: 'SUPERVISIÓN / VERIFICADOR',
                  subtitle: 'Conformidad y Cierre',
                  signatureUrl: fullData.supervisorSignature || null,
                  isProfessional: false
                }
              : null
          }
        />

        {fullData.showFooter !== false && (
          <PdfBrandingFooter
            documentId={docCode}
            documentType="CHECKLIST-HYS"
            signedBy={actName || compInfo.inspector || undefined}
          />
        )}
      </div>
    </div>
  );
}
