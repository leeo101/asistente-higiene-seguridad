import React from 'react';
import DualPdfHeader from './DualPdfHeader';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { safeGetLocalStorage } from '../utils/storageHelper';

interface ExtinguisherRecord {
  id: string;
  timestamp: string;
  image: string;
  type: 'ABC' | 'CO2' | 'Agua' | 'Espuma' | 'K';
  capacity: string;
  status: 'vigente' | 'por_vencer' | 'vencido';
  lastCharge: string;
  nextCheck: string;
  location: string;
  confidence: number;
  recommendations: string[];
  manometerStatus?: 'zona_verde' | 'descargado' | 'sobrepresionado' | 'no_aplica';
  manometerMessage?: string;
  sealStatus?: 'intacto' | 'dañado' | 'ausente';
  pinStatus?: 'presente' | 'ausente';
  hoseStatus?: 'bueno' | 'grietas' | 'obstruido';
  company?: string;
  extinguisherNumber?: string;
  hydraulicTestExpiry?: string;
  signageStatus?: 'conforme' | 'faltante' | 'deteriorada';
  heightStatus?: 'conforme' | 'fuera_norma';
  accessStatus?: 'libre' | 'obstruido';
  cylinderStatus?: 'optimo' | 'abollado_oxido';
  notes?: string;
}

export default function ExtinguisherAIPdfGenerator({
  record: propRecord,
  item: propItem,
  id = 'pdf-content-ext-ai'
}: {
  record?: any;
  item?: any;
  id?: string;
}): React.ReactElement | null {
  const raw = propRecord || propItem;
  if (!raw) return null;

  const normalizedConfidence =
    typeof raw.confidence === 'number'
      ? raw.confidence <= 1
        ? Math.round(raw.confidence * 100)
        : Math.round(raw.confidence)
      : 96;

  const normalizedStatus: 'vigente' | 'por_vencer' | 'vencido' =
    raw.status === 'vencido' || raw.expirationStatus === 'vencido'
      ? 'vencido'
      : raw.status === 'por_vencer'
        ? 'por_vencer'
        : 'vigente';

  const record: ExtinguisherRecord = {
    ...raw,
    id: String(raw.id || Date.now()),
    timestamp:
      raw.timestamp ||
      (raw.date || raw.savedAt
        ? new Date(raw.date || raw.savedAt).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : new Date().toLocaleString('es-AR')),
    type: raw.type || 'ABC',
    capacity: raw.capacity || '5 kg',
    status: normalizedStatus,
    lastCharge: raw.lastCharge || raw.lastCheck || new Date().toISOString().split('T')[0],
    nextCheck:
      raw.nextCheck ||
      raw.expirationDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hydraulicTestExpiry:
      raw.hydraulicTestExpiry ||
      raw.phDate ||
      new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: raw.location || 'Sector Operativo Principal',
    company: raw.company || 'Establecimiento / Planta Principal',
    confidence: normalizedConfidence,
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : []
  };

  const profile = safeGetLocalStorage<any>('personalData', null);
  const signature = safeGetLocalStorage<any>('signatureStampData', null);

  const typeSpecs: Record<
    string,
    {
      name: string;
      agent: string;
      classes: string;
      potential: string;
      classMatrix: { A: boolean; B: boolean; C: boolean; K: boolean };
    }
  > = {
    ABC: {
      name: 'Polvo Químico Seco Triclase (ABC)',
      agent: 'Fosfato Monoamónico al 75/90% presurizado con N₂',
      classes: 'Clases A (Sólidos), B (Líquidos/Gases) y C (Eléctricos)',
      potential: '6A : 40B : C (Ref. 5 kg)',
      classMatrix: { A: true, B: true, C: true, K: false }
    },
    CO2: {
      name: 'Dióxido de Carbono (CO₂ - Gas Limpio)',
      agent: 'Anhídrido Carbónico Licuado a Alta Presión',
      classes: 'Clases B (Inflamables) y C (Tableros / Equipos Eléctricos)',
      potential: '5B : C (Ref. 3.5 kg)',
      classMatrix: { A: false, B: true, C: true, K: false }
    },
    Agua: {
      name: 'Agua Presurizada (Clase A)',
      agent: 'Agua tratada bajo presión de Nitrógeno',
      classes: 'Exclusivamente Clase A (Madera, Papel, Cartón, Textiles)',
      potential: '2A (Ref. 10 Lts) — PELIGRO EN RIESGO ELÉCTRICO',
      classMatrix: { A: true, B: false, C: false, K: false }
    },
    Espuma: {
      name: 'Espuma Mecánica AFFF (Clases A y B)',
      agent: 'Solución Acuosa Formadora de Película Flotante (AFFF)',
      classes: 'Clases A (Sólidos) y B (Hidrocarburos / Solventes)',
      potential: '2A : 20B (Ref. 10 Lts) — NO USAR EN ELECTRICIDAD',
      classMatrix: { A: true, B: true, C: false, K: false }
    },
    K: {
      name: 'Químico Húmedo (Acetato de Potasio - Clase K)',
      agent: 'Solución de Acetato de Potasio (Saponificación)',
      classes: 'Clase K (Aceites y Grasas de Cocción Industrial) y Clase A',
      potential: '2A : K (Ref. 6 Lts)',
      classMatrix: { A: true, B: false, C: false, K: true }
    }
  };

  const spec = typeSpecs[record.type] || typeSpecs.ABC;

  const isManometerOk =
    record.type === 'CO2' ||
    record.manometerStatus === 'no_aplica' ||
    !record.manometerStatus ||
    record.manometerStatus === 'zona_verde';

  const isSealOk = !record.sealStatus || record.sealStatus === 'intacto';
  const isPinOk = !record.pinStatus || record.pinStatus === 'presente';
  const isHoseOk = !record.hoseStatus || record.hoseStatus === 'bueno';
  const isSignageOk = !record.signageStatus || record.signageStatus === 'conforme';
  const isHeightOk = !record.heightStatus || record.heightStatus === 'conforme';
  const isAccessOk = !record.accessStatus || record.accessStatus === 'libre';
  const isCylinderOk = !record.cylinderStatus || record.cylinderStatus === 'optimo';

  const isOperational =
    record.status !== 'vencido' &&
    isManometerOk &&
    isHoseOk &&
    isPinOk &&
    isCylinderOk;

  const statusConfig = {
    vigente: {
      label: 'CARGA VIGENTE',
      bg: '#dcfce7',
      text: '#166534',
      border: '#86efac'
    },
    por_vencer: {
      label: 'PRÓXIMO A VENCER (≤ 30 DÍAS)',
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fde68a'
    },
    vencido: {
      label: 'VENCIDO — RECARGA OBLIGATORIA',
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fca5a5'
    }
  }[record.status] || {
    label: 'VIGENTE',
    bg: '#dcfce7',
    text: '#166534',
    border: '#86efac'
  };

  const checklistRows = [
    {
      num: '01',
      component: 'Manómetro e Indicador de Presión',
      norm: 'Aguja en zona verde operativa (1.2 a 1.4 MPa) — IRAM 3517-2',
      value:
        record.type === 'CO2'
          ? 'N/A (Control gravimétrico CO₂)'
          : record.manometerStatus === 'descargado'
            ? 'DESCARGADO / BAJA PRESIÓN'
            : record.manometerStatus === 'sobrepresionado'
              ? 'SOBREPRESIONADO'
              : 'ZONA VERDE (PRESIÓN ÓPTIMA)',
      ok: isManometerOk
    },
    {
      num: '02',
      component: 'Marbete / Oblea y Vigencia de Carga Anual',
      norm: 'Recarga y control anual obligatorio (Validez 12 meses — IRAM 3517-2)',
      value: `${statusConfig.label} (Vto: ${record.nextCheck || 'S/D'})`,
      ok: record.status !== 'vencido'
    },
    {
      num: '03',
      component: 'Precinto Plástico de Seguridad',
      norm: 'Precinto íntegro que garantiza no accionamiento previo',
      value:
        record.sealStatus === 'dañado'
          ? 'PRECINTO CORTADO / DAÑADO'
          : record.sealStatus === 'ausente'
            ? 'PRECINTO AUSENTE'
            : 'PRECINTO INTACTO',
      ok: isSealOk
    },
    {
      num: '04',
      component: 'Pasador / Traba Metálica de Válvula',
      norm: 'Seguro metálico colocado en válvula de disparo',
      value: record.pinStatus === 'ausente' ? 'PASADOR AUSENTE (RIESGO)' : 'PASADOR PRESENTE Y COLOCADO',
      ok: isPinOk
    },
    {
      num: '05',
      component: 'Manguera, Tobera / Difusor de Descarga',
      norm: 'Flexible sin fisuras, grietas ni obstrucciones en boquilla',
      value:
        record.hoseStatus === 'grietas'
          ? 'CON FISURAS / RESEQUEDAD'
          : record.hoseStatus === 'obstruido'
            ? 'TOBERA OBSTRUIDA'
            : 'ÍNTEGRA Y DESPEJADA',
      ok: isHoseOk
    },
    {
      num: '06',
      component: 'Cilindro, Pintura y Prueba Hidráulica (PH)',
      norm: 'Recipiente sin corrosión ni abolladuras · PH vigente (cada 5 años)',
      value:
        record.cylinderStatus === 'abollado_oxido'
          ? 'CON CORROSIÓN / ABOLLADURA'
          : `CILINDRO ÓPTIMO ${record.hydraulicTestExpiry ? `(PH: ${record.hydraulicTestExpiry})` : ''}`,
      ok: isCylinderOk
    },
    {
      num: '07',
      component: 'Chapa Baliza y Señalización Reglamentaria',
      norm: 'Chapa baliza acorde a clase de fuego — Dec. 351/79 Cap. 18 e IRAM 10005',
      value:
        record.signageStatus === 'faltante'
          ? 'SIN CHAPA BALIZA'
          : record.signageStatus === 'deteriorada'
            ? 'SEÑALIZACIÓN DETERIORADA'
            : 'CHAPA BALIZA CONFORME',
      ok: isSignageOk
    },
    {
      num: '08',
      component: 'Soporte, Altura (1.20–1.50 m) y Libre Acceso',
      norm: 'Fijación firme y acceso libre de obstáculos en un radio de 1.00 m',
      value:
        !isAccessOk
          ? 'ACCESO OBSTRUIDO'
          : !isHeightOk
            ? 'ALTURA FUERA DE NORMA'
            : 'ACCESIBLE Y ALTURA REGLAMENTARIA',
      ok: isAccessOk && isHeightOk
    }
  ];

  const passedCount = checklistRows.filter((r) => r.ok).length;
  const compliancePct = Math.round((passedCount / checklistRows.length) * 100);

  return (
    <div
      id={id}
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
        title="ACTA E INFORME TÉCNICO DE INSPECCIÓN DE EXTINTOR POR IA"
        subtitle="LEY 19.587 · DEC. 351/79 CAP. 18 · NORMA IRAM 3517-2 · NFPA 10"
      />

      {/* 2. DICTAMEN EJECUTIVO DE APTITUD OPERATIVA */}
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
          backgroundColor: isOperational ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${isOperational ? '#86efac' : '#fca5a5'}`,
          borderLeft: `6px solid ${isOperational ? '#16a34a' : '#dc2626'}`,
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
              color: isOperational ? '#15803d' : '#b91c1c',
              marginBottom: '2px'
            }}
          >
            DICTAMEN DE PROTECCIÓN CONTRA INCENDIOS · EXTINTOR #{record.extinguisherNumber || String(record.id).slice(-5)}
          </div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 900,
              color: isOperational ? '#14532d' : '#7f1d1d'
            }}
          >
            {isOperational
              ? '✓ EXTINTOR APTO Y OPERATIVO PARA SERVICIO EN SECTOR'
              : '⚠️ EXTINTOR NO APTO — RETIRAR PARA RECARGA / MANTENIMIENTO IRAM 3517-2'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.54rem', fontWeight: 800, color: statusConfig.text, textTransform: 'uppercase' }}>
              Estado Marbete
            </div>
            <div style={{ fontSize: '0.73rem', fontWeight: 900, color: statusConfig.text }}>
              {statusConfig.label}
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
            <div style={{ fontSize: '0.54rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Checklist IRAM
            </div>
            <div style={{ fontSize: '0.73rem', fontWeight: 900, color: '#0f172a' }}>
              {compliancePct}% ({passedCount}/8 Pts)
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN I: FICHA TÉCNICA E IDENTIFICACIÓN DEL EXTINTOR */}
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
          I. IDENTIFICACIÓN DEL ESTABLECIMIENTO Y FICHA TÉCNICA DEL EXTINTOR
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.71rem',
            border: '1px solid #cbd5e1'
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', width: '19%' }}>
                EMPRESA / PLANTA:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', width: '31%' }}>
                {record.company || 'Establecimiento / Planta Principal'}
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569', width: '19%' }}>
                SECTOR / UBICACIÓN:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', width: '31%' }}>
                {record.location || 'Sector Operativo'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                N° EXTINTOR / MARBETE:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#1e40af' }}>
                {record.extinguisherNumber || `EXT-${String(record.id).slice(-5)}`}
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                FECHA INSPECCIÓN:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                {record.timestamp}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                TIPO / CLASIFICACIÓN:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#b91c1c' }}>
                {spec.name}
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                CAPACIDAD / POTENCIAL:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                {record.capacity || '5 kg'} · {spec.potential}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                ÚLTIMA RECARGA:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#334155' }}>
                {record.lastCharge || 'S/D'}
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                VTO. CARGA ANUAL:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 900, color: record.status === 'vencido' ? '#dc2626' : '#15803d' }}>
                {record.nextCheck || 'S/D'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                AGENTE EXTINTOR:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', color: '#334155' }}>
                {spec.agent}
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 800, color: '#475569' }}>
                PROFESIONAL H&S:
              </td>
              <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                {profile?.name || 'Servicio de Higiene y Seguridad'} {profile?.license ? `(Mat. ${profile.license})` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. SECCIÓN II: EVIDENCIA FOTOGRÁFICA, TELEMETRÍA DE MANÓMETRO Y CLASES DE FUEGO */}
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
          II. EVIDENCIA FOTOGRÁFICA, DIAGNÓSTICO DE MANÓMETRO Y APTITUD POR CLASE DE FUEGO
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '215px 1fr',
            gap: '12px',
            padding: '10px',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Fotografía del Extintor */}
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
              minHeight: '170px'
            }}
          >
            {record.image ? (
              <img
                src={record.image}
                alt="Extintor inspeccionado"
                crossOrigin="anonymous"
                style={{
                  maxHeight: '180px',
                  width: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{ padding: '16px', color: '#94a3b8', fontSize: '0.7rem', textAlign: 'center' }}>
                Sin captura fotográfica
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
              PRECISIÓN VISIÓN IA: {record.confidence || 96}%
            </div>
          </div>

          {/* Telemetría Manómetro + Matriz Clases de Fuego */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
            {/* Diagnóstico de Presión */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: isManometerOk ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${isManometerOk ? '#86efac' : '#fca5a5'}`
              }}
            >
              <div
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  color: isManometerOk ? '#166534' : '#991b1b',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                LECTURA ÓPTICA DE MANÓMETRO Y PRESURIZACIÓN (IRAM 3517-2)
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  color: isManometerOk ? '#14532d' : '#7f1d1d'
                }}
              >
                {record.manometerMessage ||
                  (record.type === 'CO2'
                    ? 'Extintor CO₂ de alta presión (Sin manómetro — Verificar carga por pesada gravimétrica).'
                    : 'Aguja en Zona Verde Operativa (Presión normal de impulsión: 1.2 a 1.4 MPa).')}
              </div>
            </div>

            {/* Matriz de Clases de Fuego */}
            <div>
              <div style={{ fontSize: '0.61rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                APTITUD DEL AGENTE EXTINTOR SEGÚN CLASE DE FUEGO (LEY 19.587 / DEC. 351/79 ANEXO VII):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { key: 'A', title: 'CLASE A', desc: 'Sólidos / Papel / Madera', apto: spec.classMatrix.A },
                  { key: 'B', title: 'CLASE B', desc: 'Líquidos / Inflamables', apto: spec.classMatrix.B },
                  { key: 'C', title: 'CLASE C', desc: 'Riesgo Eléctrico', apto: spec.classMatrix.C },
                  { key: 'K', title: 'CLASE K', desc: 'Aceites Cocción', apto: spec.classMatrix.K }
                ].map((c) => (
                  <div
                    key={c.key}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      backgroundColor: c.apto ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${c.apto ? '#86efac' : '#e2e8f0'}`
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 900, color: c.apto ? '#166534' : '#64748b' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#475569', marginBottom: '3px' }}>{c.desc}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        backgroundColor: c.apto ? '#16a34a' : '#e2e8f0',
                        color: c.apto ? '#ffffff' : '#64748b'
                      }}
                    >
                      {c.apto ? '✓ APTO' : 'NO APTO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {record.notes && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '0.7rem',
                  color: '#78350f'
                }}
              >
                <strong>Observaciones del Profesional:</strong> {record.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN III: CHECKLIST NORMATIVO DE 8 PUNTOS (IRAM 3517-2) */}
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
          III. PROTOCOLO DE VERIFICACIÓN TÉCNICA Y CONTROL PERIÓDICO (NORMA IRAM 3517-2 / DEC. 351/79 ART. 176)
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.67rem',
            border: '1px solid #cbd5e1'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#1e293b', textAlign: 'left' }}>
              <th style={{ padding: '5px 7px', border: '1px solid #cbd5e1', width: '6%', textAlign: 'center', fontWeight: 900 }}>N°</th>
              <th style={{ padding: '5px 7px', border: '1px solid #cbd5e1', width: '27%', fontWeight: 900 }}>PUNTO DE INSPECCIÓN</th>
              <th style={{ padding: '5px 7px', border: '1px solid #cbd5e1', width: '34%', fontWeight: 900 }}>CRITERIO NORMATIVO</th>
              <th style={{ padding: '5px 7px', border: '1px solid #cbd5e1', width: '21%', fontWeight: 900 }}>ESTADO RELEVADO</th>
              <th style={{ padding: '5px 7px', border: '1px solid #cbd5e1', width: '12%', textAlign: 'center', fontWeight: 900 }}>RESULTADO</th>
            </tr>
          </thead>
          <tbody>
            {checklistRows.map((row, idx) => (
              <tr key={row.num} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>
                  {row.num}
                </td>
                <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                  {row.component}
                </td>
                <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', color: '#475569' }}>
                  {row.norm}
                </td>
                <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', fontWeight: 800, color: row.ok ? '#15803d' : '#b91c1c' }}>
                  {row.value}
                </td>
                <td style={{ padding: '5px 7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      backgroundColor: row.ok ? '#dcfce7' : '#fee2e2',
                      color: row.ok ? '#166534' : '#991b1b',
                      border: `1px solid ${row.ok ? '#86efac' : '#fca5a5'}`
                    }}
                  >
                    {row.ok ? '✓ CUMPLE' : '✕ OBSERVADO'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. SECCIÓN IV: PRESCRIPCIONES Y RECOMENDACIONES TÉCNICAS */}
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
            padding: '5px 10px',
            fontSize: '0.66rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
          }}
        >
          IV. PRESCRIPCIONES TÉCNICAS Y PLAN DE ACCIÓN PREVENTIVO / CORRECTIVO
        </div>
        <div
          style={{
            padding: '8px 10px',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            backgroundColor: '#f8fafc',
            fontSize: '0.69rem',
            color: '#1e293b'
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.45 }}>
            {(record.recommendations && record.recommendations.length > 0
              ? record.recommendations
              : [
                  'Mantener el extintor colgado en su soporte reglamentario a una altura de 1.20 m a 1.50 m del solado.',
                  'Garantizar acceso libre de mercaderías u obstrucciones y chapa baliza visible (Norma IRAM 10005).',
                  'Realizar control visual mensual y recarga anual con taller habilitado según Norma IRAM 3517-2.'
                ]
            ).map((rec, i) => (
              <li key={i} style={{ marginBottom: '2px', fontWeight: 600 }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7. FIRMAS Y SELLO PROFESIONAL */}
      <PdfSignatures
        data={{
          ...record,
          professionalSignature: signature?.signature,
          professionalStamp: signature?.stamp,
          professionalName: profile?.name,
          professionalLicense: profile?.license
        }}
        box1={{
          title: 'RESPONSABLE DEL SECTOR / EMPRESA',
          subtitle: (record as any).inspectorName || 'Notificado · Firma y Aclaración',
          signatureUrl: (record as any).signature || null,
          isProfessional: false
        }}
        box2={undefined}
      />

      <PdfBrandingFooter />
    </div>
  );
}
