import React from 'react';
import PdfSignatures from './PdfSignatures';
import DualPdfHeader from './DualPdfHeader';
import PdfBrandingFooter from './PdfBrandingFooter';
import { evaluateATSSafetyCompliance } from '../utils/srtProtocols';
import ReportContentRenderer from './reports/ReportContentRenderer';

interface ChecklistItem {
  id: string | number;
  categoria: string;
  pregunta: string;
  estado: string;
  observaciones?: string;
}

interface TareaItem {
  id: number;
  paso: string;
  riesgo: string;
  control: string;
  nivelRiesgo?: string;
  normativa?: string;
  realizado?: boolean;
}

interface ATSData {
  empresa?: string;
  cuit?: string;
  obra?: string;
  tarea?: string;
  clima?: string;
  fecha?: string;
  capatazNombre?: string;
  tareas?: TareaItem[];
  checklist?: ChecklistItem[];
  epps?: string[];
  fotos?: string[];
  operatorSignature?: string | null;
  capatazSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };
  [key: string]: unknown;
}

interface ATSPdfGeneratorProps {
  atsData: ATSData | null;
  pdfElementId?: string;
}

const EPP_LABELS: Record<string, { label: string; norm: string; icon: string }> = {
  casco: { label: 'Casco de Seguridad', norm: 'IRAM 3620', icon: '🪖' },
  guantes: { label: 'Guantes de Protección', norm: 'IRAM 3607', icon: '🧤' },
  anteojos: { label: 'Protección Ocular', norm: 'IRAM 3630', icon: '🥽' },
  auditiva: { label: 'Protección Auditiva', norm: 'IRAM 4060', icon: '🎧' },
  arnes: { label: 'Arnés Cuerpo Completo', norm: 'IRAM 3622-1', icon: '🧗' },
  calzado: { label: 'Calzado de Seguridad', norm: 'IRAM 3610', icon: '🥾' },
  respiratoria: { label: 'Protección Respiratoria', norm: 'IRAM 3648', icon: '😷' },
  chaleco: { label: 'Chaleco Reflectivo', norm: 'EN ISO 20471', icon: '🦺' }
};

function formatDate(fecha?: string): string {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

function resolveProfessional(data: ATSData) {
  let actSignature = data.professionalSignature || null;
  let actName = data.professionalName || null;
  let actLic = data.professionalLicense || null;

  if (!actSignature || !actName) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;

      if (!actSignature) {
        if (lsStamp) actSignature = JSON.parse(lsStamp).signature;
        else if (legacySig) actSignature = legacySig;
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

  return { actSignature, actName, actLic };
}

const B: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '1',
  verticalAlign: 'middle',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const secNum: React.CSSProperties = {
  ...B,
  width: '22px',
  height: '22px',
  borderRadius: '6px',
  fontSize: '11px',
  backgroundColor: '#1d4ed8',
  color: '#ffffff',
  flexShrink: 0
};

function riskStyle(nivel?: string): React.CSSProperties {
  const c = nivel === 'Crítico';
  const a = nivel === 'Alto';
  const m = nivel === 'Medio';
  return {
    ...B,
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '9px',
    minWidth: '58px',
    border: '1px solid',
    backgroundColor: c ? '#881337' : a ? '#fee2e2' : m ? '#fef3c7' : '#d1fae5',
    color: c ? '#ffffff' : a ? '#991b1b' : m ? '#92400e' : '#065f46',
    borderColor: c ? '#881337' : a ? '#fca5a5' : m ? '#fcd34d' : '#6ee7b7'
  };
}

function siStyle(isSI: boolean, isNO: boolean): React.CSSProperties {
  return {
    ...B,
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '10px',
    border: '1px solid',
    backgroundColor: isSI ? '#d1fae5' : isNO ? '#fee2e2' : '#f1f5f9',
    color: isSI ? '#065f46' : isNO ? '#991b1b' : '#475569',
    borderColor: isSI ? '#6ee7b7' : isNO ? '#fca5a5' : '#cbd5e1'
  };
}

export default function ATSPdfGenerator({
  atsData,
  pdfElementId = 'pdf-content'
}: ATSPdfGeneratorProps): React.ReactElement | null {
  if (!atsData) return null;

  const data = atsData;
  const showSignatures = data.showSignatures || { operator: true, supervisor: true, professional: true };
  const { actSignature, actName, actLic } = resolveProfessional(data);
  const tareas = data.tareas || [];
  const checklist = data.checklist || [];
  const epps = data.epps || [];
  const fotos = data.fotos || [];
  const equiposEmergencia: string[] = (data as any).equiposEmergencia || [];
  const trabajadores: any[] = (data as any).trabajadores || [];

  const categories = [...new Set(checklist.map((item) => item.categoria))];
  const docId = data.id ? String(data.id).slice(-8).toUpperCase() : 'ATS-001';

  const hasCritRisk = tareas.some((t: any) => t.nivelRiesgo === 'Crítico');
  const hasHighRisk = tareas.some((t: any) => t.nivelRiesgo === 'Alto');
  const hasMedRisk = tareas.some((t: any) => t.nivelRiesgo === 'Medio');

  const keywords = [
    'altura',
    'andamio',
    'soldad',
    'caliente',
    'excava',
    'zanja',
    'loto',
    'bloqueo',
    'electri',
    'confinado',
    'izada',
    'grua',
    'autoelevador'
  ];
  const matchesKeyword = keywords.some(
    (kw) =>
      (data.tarea || '').toLowerCase().includes(kw) ||
      tareas.some((t: any) => (t.paso || '').toLowerCase().includes(kw) || (t.riesgo || '').toLowerCase().includes(kw))
  );
  const requiresPT = hasCritRisk || hasHighRisk || matchesKeyword;

  const riskBg = hasCritRisk ? '#881337' : hasHighRisk ? '#b91c1c' : hasMedRisk ? '#d97706' : '#059669';
  const riskLabel = hasCritRisk
    ? '🛑 RIESGO CRÍTICO (REQUIERE PTAR)'
    : hasHighRisk
    ? '⚠️ RIESGO ALTO (REQUIERE PTAR)'
    : hasMedRisk
    ? '🟡 RIESGO MEDIO'
    : '🟢 RIESGO BAJO';

  let n = 1;
  const nEpps = epps.length > 0 ? n++ : null;
  const nTareas = tareas.length > 0 ? n++ : null;
  const nChecklist = categories.length > 0 ? n++ : null;
  const nFotos = fotos.length > 0 ? n++ : null;
  const nEmerg = equiposEmergencia.length > 0 ? n++ : null;
  const nWorkers = trabajadores.length > 0 ? n++ : null;

  const compliance = evaluateATSSafetyCompliance(atsData || {});

  const checklistCumpleCount = checklist.filter((i) => i.estado === 'Cumple' || i.estado === 'SI').length;
  const checklistNoCumpleCount = checklist.filter((i) => i.estado === 'No Cumple' || i.estado === 'NO').length;
  const checklistNaCount = checklist.filter((i) => i.estado === 'N/A' || i.estado === 'NA').length;

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100 print:bg-white print:py-0">
      <div
        id={pdfElementId}
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 bg-white text-slate-900 shadow-xl rounded-2xl box-border mx-auto text-xs font-sans print:shadow-none print:p-4 print:max-w-none print:rounded-none"
      >
        <style type="text/css" media="print">{`
          @page { size: A4 portrait; margin: 8mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow:none!important; margin:0!important; padding:0!important; width:100%!important; max-width:none!important; border:none!important; border-radius:0!important; }
        `}</style>

        {/* Barra Tricolor Institucional de Seguridad */}
        <div
          style={{
            height: '8px',
            width: '100%',
            borderRadius: '999px',
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 35%, #f59e0b 70%, #059669 100%)'
          }}
        />

        {/* Header Corporativo / ISO con Doble Membrete */}
        <DualPdfHeader
          title="ANÁLISIS DE TRABAJO SEGURO (ATS)"
          subtitle="Evaluación Preventiva de Riesgos por Pasos, Jerarquía de Controles y Liberación Operativa · IPERC"
          normBadge="Ley 19.587 · Dec. 911/96 · Dec. 351/79 · ISO 45001"
          normBadgeColor="emerald"
          documentId={docId}
          establishmentName={atsData?.empresa || atsData?.obra}
          establishmentCuit={atsData?.cuit}
          establishmentAddress={atsData?.obra}
          consultantName={actName || atsData?.professionalName}
          consultantLicense={actLic || atsData?.professionalLicense}
          date={formatDate(atsData?.fecha)}
        />

        {/* Resumen Ejecutivo / Métricas de Control (KPIs) */}
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">
              📋
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase">Secuencia</div>
              <div className="text-sm font-black text-slate-900">{tareas.length} Pasos</div>
            </div>
          </div>

          <div
            className={`border rounded-xl p-2.5 flex items-center gap-2.5 ${
              hasCritRisk
                ? 'bg-rose-50 border-rose-300'
                : hasHighRisk
                ? 'bg-amber-50 border-amber-300'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                hasCritRisk
                  ? 'bg-rose-700 text-white'
                  : hasHighRisk
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {hasCritRisk ? '🛑' : hasHighRisk ? '⚠️' : '✓'}
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase">Nivel Máximo</div>
              <div
                className={`text-sm font-black ${
                  hasCritRisk ? 'text-rose-800' : hasHighRisk ? 'text-amber-800' : 'text-emerald-800'
                }`}
              >
                {hasCritRisk ? 'Crítico (PTAR)' : hasHighRisk ? 'Alto Riesgo' : hasMedRisk ? 'Medio' : 'Bajo'}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-sm shrink-0">
              🛡️
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase">EPPs Exigidos</div>
              <div className="text-sm font-black text-slate-900">{epps.length} Elementos</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
              👥
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase">Cuadrilla</div>
              <div className="text-sm font-black text-slate-900">
                {trabajadores.length > 0 ? `${trabajadores.length} Operarios` : 'Acreditada'}
              </div>
            </div>
          </div>
        </div>

        {/* Datos Generales del Trabajo y Entorno */}
        <div
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          className="border-2 border-slate-800 rounded-xl overflow-hidden mb-4 bg-white shadow-2xs"
        >
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1.5 uppercase tracking-wider flex justify-between items-center">
            <span>DATOS GENERALES DEL TRABAJO, UBICACIÓN Y ENTORNO OPERATIVO</span>
            <span className="text-slate-300 font-bold text-[9px]">EXPEDIENTE ATS #{docId}</span>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CLIENTE / EMPRESA</span>
              <span className="font-extrabold text-xs text-slate-900">{data.empresa || '—'}</span>
            </div>
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CUIT / CUIL</span>
              <span className="font-extrabold text-xs text-slate-900">{data.cuit || '—'}</span>
            </div>
            <div className="p-2.5 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">UBICACIÓN / OBRA / SECTOR</span>
              <span className="font-extrabold text-xs text-slate-900">{data.obra || '—'}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">FECHA DE EJECUCIÓN</span>
              <span className="font-extrabold text-xs text-slate-900">{formatDate(data.fecha)}</span>
            </div>
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CAPATAZ / SUPERVISOR</span>
              <span className="font-extrabold text-xs text-slate-900">{data.capatazNombre || '—'}</span>
            </div>
            <div className="p-2.5 flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CONDICIÓN CLIMÁTICA</span>
              <span className="font-extrabold text-xs text-slate-900">
                {String((data as any).clima || 'Soleado / Normal')}
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-white">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              DESCRIPCIÓN DETALLADA DE LA TAREA A EJECUTAR
            </span>
            <div className="text-xs text-slate-900 leading-relaxed font-bold">
              <ReportContentRenderer content={data.tarea || '—'} />
            </div>
          </div>
        </div>

        {/* Dictamen Técnico de Auditoría y Jerarquía de Controles */}
        <div
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          className="mb-4 p-2.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between gap-2 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                ...B,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '9px',
                backgroundColor:
                  compliance.dictamen === 'CONFORME'
                    ? '#d1fae5'
                    : compliance.dictamen === 'OBSERVADO'
                    ? '#fef3c7'
                    : '#fee2e2',
                color:
                  compliance.dictamen === 'CONFORME'
                    ? '#065f46'
                    : compliance.dictamen === 'OBSERVADO'
                    ? '#92400e'
                    : '#991b1b',
                border: `1px solid ${
                  compliance.dictamen === 'CONFORME'
                    ? '#6ee7b7'
                    : compliance.dictamen === 'OBSERVADO'
                    ? '#fcd34d'
                    : '#fca5a5'
                }`
              }}
            >
              AUDITORÍA IPERC: {compliance.dictamen}
            </span>
            <span className="text-[10px] font-bold text-slate-700">
              Jerarquía de Controles (Ley 19.587 / Dec. 911/96)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-800 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              Ingeniería/Colectivos: <strong className="text-blue-700">{compliance.engineeringRatio}%</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              Pasos Controlados: <strong>{compliance.stepsWithControls}/{compliance.totalSteps}</strong>
            </span>
            <span
              style={{
                ...B,
                padding: '4px 9px',
                borderRadius: '6px',
                fontSize: '9px',
                backgroundColor: riskBg,
                color: '#ffffff'
              }}
            >
              {riskLabel}
            </span>
          </div>
        </div>

        {/* Advertencia PT */}
        {requiresPT && (
          <div
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className="mb-4 p-2.5 bg-rose-600 text-white font-black text-[11px] rounded-xl text-center uppercase tracking-wider shadow-2xs border-2 border-rose-800 flex items-center justify-center gap-2"
          >
            🛑 ATENCIÓN: TAREA CON CONDICIÓN CRÍTICA — REQUIERE PERMISO DE TRABAJO DE ALTO RIESGO (PTAR) ADJUNTO
          </div>
        )}

        {/* 1. EPPs Exigidos */}
        {epps.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <div className="flex items-center gap-2">
                <span style={secNum}>{nEpps}</span>
                <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                  EQUIPOS DE PROTECCIÓN PERSONAL (EPP) OBLIGATORIOS · RES. SRT 299/11
                </h3>
              </div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase">Certificación Sello &quot;S&quot;</span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
              {epps.map((epp, idx) => {
                const info = EPP_LABELS[String(epp).toLowerCase()] || {
                  label: String(epp).toUpperCase(),
                  norm: 'Res. SRT 299/11',
                  icon: '🛡️'
                };
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200"
                  >
                    <span className="text-sm shrink-0">{info.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-slate-900 leading-tight">{info.label}</div>
                      <div className="text-[8px] font-bold text-blue-700 uppercase">{info.norm}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Secuencia Operativa de Tareas */}
        {tareas.length > 0 && (
          <div className="mb-5">
            <div
              data-avoid-break="true"
              style={{ breakInside: 'avoid', pageBreakInside: 'avoid', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
              className="flex items-center justify-between gap-2 mb-2 pb-1 border-b-2 border-slate-800 avoid-break"
            >
              <div className="flex items-center gap-2">
                <span style={secNum}>{nTareas}</span>
                <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                  SECUENCIA DE TAREAS, PELIGROS Y MATRIZ DE CONTROLES PREVENTIVOS
                </h3>
              </div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase">
                {tareas.length} Etapas Evaluadas
              </span>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div
                data-avoid-break="true"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                className="grid grid-cols-[44px_1.9fr_1.8fr_2.3fr_86px] bg-slate-900 text-white p-2.5 border-b border-slate-800 font-black text-[10px] uppercase tracking-wider items-center"
              >
                <div style={{ textAlign: 'center' }}>PASO</div>
                <div>1. ETAPA / SECUENCIA</div>
                <div>2. RIESGOS Y PELIGROS</div>
                <div>3. MEDIDAS PREVENTIVAS Y NORMA</div>
                <div style={{ textAlign: 'center' }}>4. RIESGO</div>
              </div>
              {tareas.map((t, idx) => {
                const rowAccent =
                  t.nivelRiesgo === 'Crítico'
                    ? '#881337'
                    : t.nivelRiesgo === 'Alto'
                    ? '#dc2626'
                    : t.nivelRiesgo === 'Medio'
                    ? '#d97706'
                    : '#059669';
                return (
                  <div
                    key={t.id || idx}
                    data-avoid-break="true"
                    style={{
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      borderLeft: `4px solid ${rowAccent}`
                    }}
                    className={`grid grid-cols-[44px_1.9fr_1.8fr_2.3fr_86px] gap-2 p-2.5 items-center border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    }`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span
                        style={{
                          ...B,
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontSize: '10px'
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 leading-snug">{t.paso || '—'}</div>
                    <div className="text-xs font-semibold text-slate-700 leading-snug">{t.riesgo || '—'}</div>
                    <div className="text-xs font-bold text-slate-800 leading-snug">
                      <div>{t.control || '—'}</div>
                      {t.normativa && (
                        <div className="text-[9.5px] font-bold text-blue-800 mt-1 flex items-center gap-1">
                          <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">
                            ⚖️ Norma
                          </span>
                          <span>{t.normativa}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={riskStyle(t.nivelRiesgo)}>{t.nivelRiesgo || 'Bajo'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Checklist Pre-operativo */}
        {categories.length > 0 && (
          <div className="mb-5">
            {categories.map((cat, catIdx) => {
              const catItems = checklist.filter((item) => item.categoria === cat);
              return (
                <div key={catIdx} className="mb-4">
                  {catIdx === 0 && (
                    <div
                      data-avoid-break="true"
                      style={{
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                        breakAfter: 'avoid',
                        pageBreakAfter: 'avoid'
                      }}
                      className="flex items-center justify-between gap-2 mb-2 pb-1 border-b-2 border-slate-800 avoid-break"
                    >
                      <div className="flex items-center gap-2">
                        <span style={secNum}>{nChecklist}</span>
                        <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                          LISTA DE VERIFICACIÓN DE SEGURIDAD PRE-OPERATIVA EN CAMPO
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          ✓ {checklistCumpleCount} CUMPLE
                        </span>
                        {checklistNoCumpleCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            ✗ {checklistNoCumpleCount} NO CUMPLE
                          </span>
                        )}
                        {checklistNaCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {checklistNaCount} N/A
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    data-avoid-break="true"
                    style={{
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid'
                    }}
                    className="border border-slate-300 rounded-t-xl overflow-hidden shadow-xs avoid-break"
                  >
                    <div className="bg-slate-900 text-white px-3 py-1.5 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-blue-400">■</span> {cat}
                      </span>
                      <span className="text-[9px] text-slate-300">{catItems.length} ítems</span>
                    </div>
                    <div className="grid grid-cols-[3.2fr_100px_1.8fr] bg-slate-100 px-2.5 py-1.5 border-b border-slate-300 font-black text-[9.5px] text-slate-700 uppercase tracking-wider items-center">
                      <div>PUNTO DE VERIFICACIÓN PREVENTIVA</div>
                      <div style={{ textAlign: 'center' }}>DICTAMEN</div>
                      <div>OBSERVACIONES / DESVÍOS</div>
                    </div>
                  </div>

                  <div className="border-x border-b border-slate-300 rounded-b-xl overflow-hidden shadow-xs">
                    {catItems.map((item, itemIdx) => {
                      const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                      const isNO = item.estado === 'No Cumple' || item.estado === 'NO';
                      const isLast = itemIdx === catItems.length - 1;
                      return (
                        <div
                          key={item.id || itemIdx}
                          data-avoid-break="true"
                          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                          className={`grid grid-cols-[3.2fr_100px_1.8fr] gap-3 items-center px-2.5 py-2 avoid-break ${
                            !isLast ? 'border-b border-slate-200' : ''
                          } ${itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                        >
                          <div className="font-bold text-xs text-slate-900">{item.pregunta}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={siStyle(isSI, isNO)}>
                              {isSI ? '✓ CUMPLE' : isNO ? '✗ NO CUMPLE' : 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-600">{item.observaciones || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Evidencia Fotográfica */}
        {fotos.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={secNum}>{nFotos}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                REGISTRO FOTOGRÁFICO DEL ENTORNO Y MEDIDAS DE CONTROL
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {fotos.map((foto, idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border border-slate-300 bg-slate-50 shadow-xs flex flex-col"
                >
                  <div className="h-44 w-full overflow-hidden bg-slate-900">
                    <img src={foto} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase">
                    <span>📸 Evidencia Fotográfica #{idx + 1}</span>
                    <span>Fecha: {formatDate(data.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Equipos de Emergencia */}
        {equiposEmergencia.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={{ ...secNum, backgroundColor: '#b91c1c' }}>{nEmerg || '🧯'}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                EQUIPOS DE EMERGENCIA, CONTENCIÓN Y RESPUESTA EN ZONA
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              {equiposEmergencia.map((eq: string, idx: number) => (
                <span
                  key={idx}
                  style={{
                    ...B,
                    backgroundColor: '#fee2e2',
                    color: '#7f1d1d',
                    border: '1px solid #fca5a5',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    gap: '4px'
                  }}
                >
                  🧯 {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6. Nómina de Trabajadores Autorizados */}
        {trabajadores.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mt-5 mb-5">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <div className="flex items-center gap-2">
                <span style={{ ...secNum, backgroundColor: '#1e3a8a' }}>{nWorkers || '👥'}</span>
                <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                  NÓMINA DE CUADRILLA NOTIFICADA Y AUTORIZADA (CHARLA PREVIA 5 MIN)
                </h3>
              </div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase">
                Constancia de Instrucción Preventiva
              </span>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-[32px_2fr_1.1fr_1.2fr_1.8fr] gap-2 p-2 bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider items-center">
                <div style={{ textAlign: 'center' }}>#</div>
                <div>APELLIDO Y NOMBRE DEL OPERARIO</div>
                <div>DNI / LEGAJO</div>
                <div>FUNCIÓN / PUESTO</div>
                <div style={{ textAlign: 'center' }}>CONFORMIDAD Y FIRMA</div>
              </div>
              {trabajadores.map((w: any, idx: number) => (
                <div
                  key={w.id || idx}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className={`grid grid-cols-[32px_2fr_1.1fr_1.2fr_1.8fr] gap-2 p-2 items-center border-b border-slate-200 text-xs ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '10px',
                      color: '#64748b',
                      lineHeight: '1'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="font-extrabold text-slate-900">{w.nombre || '—'}</div>
                  <div className="font-bold text-slate-700">{w.dni || '—'}</div>
                  <div className="font-semibold text-slate-600">{w.funcion || 'Operario'}</div>
                  <div className="h-7 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-bold">
                    Firma: ______________________
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Cuadro de Firmas de Liberación */}
        <div
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          className="mt-6 avoid-break pdf-signatures-wrapper"
        >
          <PdfSignatures
            data={data}
            box1={
              showSignatures?.operator
                ? {
                    title: 'OPERADOR / CAPATAZ',
                    subtitle: (data.capatazNombre || 'Firma y aclaración').toUpperCase(),
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              showSignatures?.supervisor
                ? {
                    title: 'SUPERVISOR / JEFE DE OBRA',
                    subtitle: 'APROBACIÓN Y LIBERACIÓN',
                    signatureUrl: data.capatazSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box3={
              showSignatures?.professional
                ? {
                    title: 'GERENCIA EHS / EMISOR',
                    subtitle: (actName || 'Firma y sello').toUpperCase(),
                    signatureUrl: actSignature,
                    isProfessional: true,
                    license: actLic || undefined
                  }
                : null
            }
          />
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}
