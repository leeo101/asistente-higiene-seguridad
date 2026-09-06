import React from 'react';
import PdfSignatures from './PdfSignatures';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

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

function formatDate(fecha?: string): string {
  if (!fecha) return '\u2014';
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
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch {
      /* ignore */
    }
  }

  return { actSignature, actName, actLic };
}

/* ─── Estilos inline para badges ─────────────────────────────────────────
   html2canvas NO interpreta bien las clases Tailwind "inline-flex" +
   "leading-none" en contextos de salto de p\u00e1gina. Los estilos inline son
   la \u00fanica forma segura de garantizar centrado vertical perfecto. */
const B: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '1',
  verticalAlign: 'middle',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const secNum: React.CSSProperties = {
  ...B,
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  fontSize: '11px',
  backgroundColor: '#1d4ed8',
  color: '#ffffff',
  flexShrink: 0,
};

function riskStyle(nivel?: string): React.CSSProperties {
  const c = nivel === 'Cr\u00edtico', a = nivel === 'Alto', m = nivel === 'Medio';
  return {
    ...B,
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '9px',
    minWidth: '55px',
    border: '1px solid',
    backgroundColor: c ? '#0f172a' : a ? '#fee2e2' : m ? '#fef3c7' : '#d1fae5',
    color:           c ? '#ffffff' : a ? '#991b1b' : m ? '#92400e' : '#065f46',
    borderColor:     c ? '#0f172a' : a ? '#fca5a5' : m ? '#fcd34d' : '#6ee7b7',
  };
}

function siStyle(isSI: boolean, isNO: boolean): React.CSSProperties {
  return {
    ...B,
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    border: '1px solid',
    backgroundColor: isSI ? '#d1fae5' : isNO ? '#fee2e2' : '#f1f5f9',
    color:           isSI ? '#065f46' : isNO ? '#991b1b' : '#475569',
    borderColor:     isSI ? '#6ee7b7' : isNO ? '#fca5a5' : '#cbd5e1',
  };
}

export default function ATSPdfGenerator({ atsData, pdfElementId = 'pdf-content' }: ATSPdfGeneratorProps): React.ReactElement | null {
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
  const docId = data.id ? String(data.id).slice(-8).toUpperCase() : 'S/N';

  const hasCritRisk = tareas.some((t: any) => t.nivelRiesgo === 'Cr\u00edtico');
  const hasHighRisk = tareas.some((t: any) => t.nivelRiesgo === 'Alto');
  const hasMedRisk  = tareas.some((t: any) => t.nivelRiesgo === 'Medio');

  const keywords = ['altura','andamio','soldad','caliente','excava','zanja','loto','bloqueo','electri','confinado','izada','grua','autoelevador'];
  const matchesKeyword = keywords.some((kw) =>
    (data.tarea || '').toLowerCase().includes(kw) ||
    tareas.some((t: any) => (t.paso || '').toLowerCase().includes(kw) || (t.riesgo || '').toLowerCase().includes(kw))
  );
  const requiresPT = hasCritRisk || hasHighRisk || matchesKeyword;

  const riskBg    = hasCritRisk ? '#0f172a' : hasHighRisk ? '#b91c1c' : hasMedRisk ? '#d97706' : '#059669';
  const riskLabel = hasCritRisk ? '\uD83D\uDED1 RIESGO CR\u00cdTICO (REQUIERE PT)' : hasHighRisk ? '\u26A0\uFE0F RIESGO ALTO (REQUIERE PT)' : hasMedRisk ? 'RIESGO MEDIO' : 'RIESGO BAJO';

  let n = 1;
  const nEpps = epps.length > 0 ? n++ : null;
  const nTareas = tareas.length > 0 ? n++ : null;
  const nChecklist = categories.length > 0 ? n++ : null;
  const nFotos = fotos.length > 0 ? n++ : null;
  const nEmerg = equiposEmergencia.length > 0 ? n++ : null;

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

        {/* Accent top bar */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-t-lg mb-5" />

        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span style={{ ...B, backgroundColor: '#0c1a4b', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px' }}>
                SISTEMA DE GESTIÓN HYS
              </span>
              <span style={{ ...B, backgroundColor: riskBg, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px' }}>
                {riskLabel}
              </span>
            </div>
            <h1 className="m-0 text-2xl font-black text-slate-900 uppercase tracking-tight">
              ANÁLISIS DE TRABAJO SEGURO (ATS)
            </h1>
            <div className="text-xs font-black text-blue-700 uppercase tracking-wide">
              EVALUACIÓN PREVENTIVA DE RIESGOS OPERATIVOS
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CompanyLogo style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">N° REF / ID</div>
              <div className="text-sm font-black text-blue-700">{docId}</div>
            </div>
          </div>
        </div>

        {/* Datos generales */}
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-2 border-slate-800 rounded-xl overflow-hidden mb-5 bg-white shadow-xs">
          <div className="bg-slate-900 text-white font-black text-[11px] px-4 py-1.5 uppercase tracking-wider">
            DATOS GENERALES DEL TRABAJO Y UBICACIÓN
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">CLIENTE / EMPRESA</span>
              <span className="font-extrabold text-sm text-slate-900">{data.empresa || '-'}</span>
            </div>
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">CUIT / CUIL</span>
              <span className="font-extrabold text-sm text-slate-900">{data.cuit || '-'}</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">UBICACIÓN / OBRA</span>
              <span className="font-extrabold text-sm text-slate-900">{data.obra || '-'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FECHA DE EJECUCIÓN</span>
              <span className="font-extrabold text-sm text-slate-900">{formatDate(data.fecha)}</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">RESPONSABLE DE TAREA</span>
              <span className="font-extrabold text-sm text-slate-900">{data.capatazNombre || '-'}</span>
            </div>
          </div>
          <div className="p-3 border-b border-slate-200 bg-white">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">DESCRIPCIÓN DETALLADA DE LA TAREA</span>
            <span className="font-bold text-xs text-slate-900 leading-relaxed block whitespace-pre-wrap">{data.tarea || '-'}</span>
          </div>
          <div className="p-3 bg-blue-50/60 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">PROFESIONAL HYS ACTUANTE:</span>
            <span className="font-extrabold text-xs text-blue-900">
              {actName || '-'}{actLic ? ` · MAT. N° ${actLic}` : ''}
            </span>
          </div>
        </div>

        {/* Advertencia PT */}
        {requiresPT && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5 p-3 bg-rose-600 text-white font-black text-xs rounded-xl text-center uppercase tracking-wider shadow-xs border-2 border-rose-800 flex items-center justify-center gap-2">
            🛑 ATENCIÓN: TRABAJO DE ALTO RIESGO — REQUIERE PERMISO DE TRABAJO (PT) ADJUNTO OBLIGATORIO
          </div>
        )}

        {/* EPPs */}
        {epps.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={secNum}>{nEpps}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">EQUIPOS DE PROTECCIÓN PERSONAL (EPP) REQUERIDOS</h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-300 rounded-xl">
              {epps.map((epp, idx) => (
                <span key={idx} style={{ ...B, backgroundColor: '#dbeafe', color: '#1e3a8a', border: '1px solid #93c5fd', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', gap: '4px' }}>
                  🛡️ {epp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Secuencia de Tareas */}
        {tareas.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={secNum}>{nTareas}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">SECUENCIA DE TAREAS Y MATRIZ DE CONTROL DE RIESGOS</h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[40px_2fr_1.8fr_2.2fr_90px] bg-slate-100 p-2.5 border-b-2 border-slate-300 font-black text-[11px] text-slate-700 uppercase tracking-wider items-center">
                <div style={{ textAlign: 'center' }}>#</div>
                <div>PASO DE TAREA</div>
                <div>RIESGOS ASOCIADOS</div>
                <div>MEDIDAS DE CONTROL Y PREVENCIÓN</div>
                <div style={{ textAlign: 'center' }}>RIESGO</div>
              </div>
              {tareas.map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className={`grid grid-cols-[40px_2fr_1.8fr_2.2fr_90px] gap-2 p-2.5 items-center border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '11px', color: '#64748b', lineHeight: '1' }}>{idx + 1}</div>
                  <div className="font-extrabold text-xs text-slate-900">{t.paso || '-'}</div>
                  <div className="text-xs font-medium text-slate-700">{t.riesgo || '-'}</div>
                  <div className="text-xs font-bold text-slate-800">
                    <div>{t.control || '-'}</div>
                    {t.normativa && (
                      <div className="text-[10px] font-bold text-blue-800 mt-1 flex items-center gap-1">
                        <span className="bg-blue-100/80 text-blue-900 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Norma</span>
                        <span>{t.normativa}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={riskStyle(t.nivelRiesgo)}>{t.nivelRiesgo || 'Bajo'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Pre-operativo */}
        {categories.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={secNum}>{nChecklist}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">VERIFICACIÓN DE SEGURIDAD PRE-OPERATIVA</h3>
            </div>
            {categories.map((cat, catIdx) => {
              const catItems = checklist.filter((item) => item.categoria === cat);
              return (
                <div
                  key={catIdx}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="mb-4 border border-slate-300 rounded-xl overflow-hidden shadow-xs avoid-break avoid-break-strictly break-inside-avoid"
                >
                  <div className="bg-slate-900 text-white p-2 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="text-blue-400">■</span> {cat}
                  </div>
                  <div className="grid grid-cols-[3fr_110px_2fr] bg-slate-100 p-2 border-b border-slate-300 font-black text-[10px] text-slate-700 uppercase tracking-wider items-center">
                    <div>ÍTEM DE VERIFICACIÓN</div>
                    <div style={{ textAlign: 'center' }}>ESTADO</div>
                    <div>OBSERVACIONES</div>
                  </div>
                  {catItems.map((item, itemIdx) => {
                    const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                    const isNO = item.estado === 'No Cumple' || item.estado === 'NO';
                    return (
                      <div
                        key={item.id || itemIdx}
                        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                        className={`grid grid-cols-[3fr_110px_2fr] gap-3 items-center p-2 border-b border-slate-200 ${itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                      >
                        <div className="font-bold text-xs text-slate-900">{item.pregunta}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={siStyle(isSI, isNO)}>{isSI ? '✓ SI' : isNO ? '✗ NO' : 'N/A'}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-600">{item.observaciones || '-'}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={secNum}>{nFotos}</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">EVIDENCIA FOTOGRÁFICA REGISTRADA</h3>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              {fotos.map((foto, idx) => (
                <div key={idx} className="w-40 h-40 rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                  <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipos Emergencia */}
        {equiposEmergencia.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={{ ...secNum, backgroundColor: '#b91c1c' }}>🧯</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">EQUIPOS DE EMERGENCIA Y RESPUESTA EN ZONA</h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              {equiposEmergencia.map((eq: string, idx: number) => (
                <span key={idx} style={{ ...B, backgroundColor: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', gap: '4px' }}>
                  🧯 {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nomina Trabajadores */}
        {trabajadores.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mt-6 mb-5">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span style={{ ...secNum, backgroundColor: '#1e3a8a' }}>👥</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">NÓMINA DE TRABAJADORES AUTORIZADOS (PERSONAL ACREDITADO)</h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-[30px_2fr_1.2fr_1.2fr_2fr] gap-2 p-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider items-center">
                <div style={{ textAlign: 'center' }}>#</div>
                <div>NOMBRE Y APELLIDO</div>
                <div>DNI / LEGAJO</div>
                <div>FUNCIÓN</div>
                <div style={{ textAlign: 'center' }}>FIRMA DEL OPERARIO</div>
              </div>
              {trabajadores.map((w: any, idx: number) => (
                <div
                  key={w.id || idx}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className={`grid grid-cols-[30px_2fr_1.2fr_1.2fr_2fr] gap-2 p-2 items-center border-b border-slate-200 text-xs ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '10px', color: '#94a3b8', lineHeight: '1' }}>{idx + 1}</div>
                  <div className="font-extrabold text-slate-900">{w.nombre || '-'}</div>
                  <div className="font-bold text-slate-700">{w.dni || '-'}</div>
                  <div className="font-medium text-slate-600">{w.funcion || 'Operario'}</div>
                  <div className="h-8 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-bold">Firma: __________________</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firmas */}
        <div
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          className="mt-6 avoid-break avoid-break-strictly break-inside-avoid pdf-signatures-wrapper"
        >
          <PdfSignatures
            data={data}
            box1={showSignatures?.operator ? { title: 'OPERADOR / CAPATAZ', subtitle: (data.capatazNombre || 'Firma y aclaración').toUpperCase(), signatureUrl: data.operatorSignature || null, isProfessional: false } : null}
            box2={showSignatures?.supervisor ? { title: 'SUPERVISOR / JEFE DE OBRA', subtitle: 'APROBACIÓN Y LIBERACIÓN', signatureUrl: data.capatazSignature || null, isProfessional: false } : null}
            box3={showSignatures?.professional ? { title: 'GERENCIA EHS / EMISOR', subtitle: (actName || 'Firma y sello').toUpperCase(), signatureUrl: actSignature, isProfessional: true, license: actLic } : null}
          />
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}
