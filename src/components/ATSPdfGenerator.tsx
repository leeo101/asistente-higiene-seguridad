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
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch {
      /* ignore */
    }
  }

  return { actSignature, actName, actLic };
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

  const hasCritRisk = tareas.some((t: any) => t.nivelRiesgo === 'Crítico');
  const hasHighRisk = tareas.some((t: any) => t.nivelRiesgo === 'Alto');
  const hasMedRisk = tareas.some((t: any) => t.nivelRiesgo === 'Medio');

  const keywords = ['altura', 'andamio', 'soldad', 'caliente', 'excava', 'zanja', 'loto', 'bloqueo', 'electri', 'confinado', 'izada', 'grua', 'autoelevador'];
  const matchesKeyword = keywords.some((kw) => (data.tarea || '').toLowerCase().includes(kw) || tareas.some((t: any) => (t.paso || '').toLowerCase().includes(kw) || (t.riesgo || '').toLowerCase().includes(kw)));
  const requiresPT = hasCritRisk || hasHighRisk || matchesKeyword;

  const globalRiskBg = hasCritRisk ? 'bg-rose-950' : hasHighRisk ? 'bg-rose-700' : hasMedRisk ? 'bg-amber-600' : 'bg-emerald-600';
  const globalRiskLabel = hasCritRisk ? '🛑 RIESGO CRÍTICO (REQUIERE PT)' : hasHighRisk ? '⚠️ RIESGO ALTO (REQUIERE PT)' : hasMedRisk ? 'RIESGO MEDIO' : 'RIESGO BAJO';

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100 print:bg-white print:py-0">
      <div
        id={pdfElementId}
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 bg-white text-slate-900 shadow-xl rounded-2xl box-border mx-auto text-xs font-sans print:shadow-none print:p-4 print:max-w-none print:rounded-none"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border: none !important;
              border-radius: 0 !important; 
            }
          `}
        </style>

        {/* Top Accent Line */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-t-lg mb-5"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-950 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                SISTEMA DE GESTIÓN HYS
              </span>
              <span className={`text-white font-black text-[10px] px-2 py-0.5 rounded uppercase ${globalRiskBg}`}>
                {globalRiskLabel}
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

        {/* Form Grid */}
        <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-5 bg-white page-break-inside-avoid shadow-xs">
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
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              DESCRIPCIÓN DETALLADA DE LA TAREA
            </span>
            <span className="font-bold text-xs text-slate-900 leading-relaxed block whitespace-pre-wrap">
              {data.tarea || '-'}
            </span>
          </div>
          <div className="p-3 bg-blue-50/60 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">
              PROFESIONAL HYS ACTUANTE:
            </span>
            <span className="font-extrabold text-xs text-blue-900">
              {actName || '-'} {actLic ? ` · MAT. N° ${actLic}` : ''}
            </span>
          </div>
        </div>

        {requiresPT && (
          <div className="mb-5 p-3 bg-rose-600 text-white font-black text-xs rounded-xl text-center uppercase tracking-wider shadow-xs border-2 border-rose-800 flex items-center justify-center gap-2">
            <span>🛑 ATENCIÓN: TRABAJO DE ALTO RIESGO — REQUIERE PERMISO DE TRABAJO (PT) ADJUNTO OBLIGATORIO</span>
          </div>
        )}

        {/* EPPs Requeridos */}
        {epps.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-blue-700 text-white font-black text-xs px-2 py-0.5 rounded">1</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                EQUIPOS DE PROTECCIÓN PERSONAL (EPP) REQUERIDOS
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-300 rounded-xl">
              {epps.map((epp, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 rounded-lg text-xs font-extrabold uppercase shadow-2xs"
                >
                  🛡️ {epp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Secuencia de Tareas */}
        {tareas.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-blue-700 text-white font-black text-xs px-2 py-0.5 rounded">
                {epps.length > 0 ? '2' : '1'}
              </span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                SECUENCIA DE TAREAS Y MATRIZ DE CONTROL DE RIESGOS
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[40px_2.5fr_2fr_2.5fr_100px] bg-slate-100 p-2.5 border-b-2 border-slate-300 font-black text-[11px] text-slate-700 uppercase tracking-wider">
                <div className="text-center">#</div>
                <div>PASO DE TAREA</div>
                <div>RIESGOS ASOCIADOS</div>
                <div>MEDIDAS DE CONTROL Y PREVENCIÓN</div>
                <div className="text-center">RIESGO</div>
              </div>
              {tareas.map((t, idx) => {
                const isCrit = t.nivelRiesgo === 'Crítico';
                const isAlto = t.nivelRiesgo === 'Alto';
                const isMedio = t.nivelRiesgo === 'Medio';
                return (
                  <div
                    key={t.id || idx}
                    className={`grid grid-cols-[30px_1.5fr_1.5fr_2fr_90px] gap-2 p-2.5 items-center border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <div className="text-center font-black text-xs text-slate-400">{idx + 1}</div>
                    <div className="font-extrabold text-xs text-slate-900">{t.paso || '-'}</div>
                    <div className="text-xs font-medium text-slate-700">{t.riesgo || '-'}</div>
                    <div className="text-xs font-bold text-slate-800">{t.control || '-'}</div>
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border text-center ${
                          isCrit
                            ? 'bg-rose-950 text-white border-rose-950'
                            : isAlto
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isMedio
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {t.nivelRiesgo || 'Bajo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verificación Pre-operativa Checklist */}
        {categories.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-blue-700 text-white font-black text-xs px-2 py-0.5 rounded">
                {epps.length > 0 ? '3' : '2'}
              </span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                VERIFICACIÓN DE SEGURIDAD PRE-OPERATIVA
              </h3>
            </div>
            {categories.map((cat, catIdx) => {
              const catItems = checklist.filter((item) => item.categoria === cat);
              return (
                <div key={catIdx} className="mb-4 border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white p-2 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="text-blue-400">■</span> {cat}
                  </div>
                  <div className="grid grid-cols-[3fr_110px_2fr] bg-slate-100 p-2 border-b border-slate-300 font-black text-[10px] text-slate-700 uppercase tracking-wider">
                    <div>ÍTEM DE VERIFICACIÓN</div>
                    <div className="text-center">ESTADO</div>
                    <div>OBSERVACIONES</div>
                  </div>
                  {catItems.map((item, itemIdx) => {
                    const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                    const isNO = item.estado === 'No Cumple' || item.estado === 'NO';
                    return (
                      <div
                        key={item.id || itemIdx}
                        className={`grid grid-cols-[3fr_110px_2fr] gap-3 items-center p-2 border-b border-slate-200 page-break-inside-avoid ${
                          itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{item.pregunta}</div>
                        <div className="flex justify-center">
                          {isSI ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              ✓ SI
                            </span>
                          ) : isNO ? (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              ✗ NO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              N/A
                            </span>
                          )}
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

        {/* Evidencia Fotográfica */}
        {fotos.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-blue-700 text-white font-black text-xs px-2 py-0.5 rounded">4</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                EVIDENCIA FOTOGRÁFICA REGISTRADA
              </h3>
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

        {/* Equipos de Emergencia en Zona */}
        {equiposEmergencia.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-rose-700 text-white font-black text-xs px-2 py-0.5 rounded">🧯</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                EQUIPOS DE EMERGENCIA Y RESPUESTA EN ZONA
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              {equiposEmergencia.map((eq: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-lg text-xs font-extrabold uppercase shadow-2xs"
                >
                  🧯 {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Firmas y Autorizaciones */}
        {/* Nómina de Trabajadores Autorizados */}
        {trabajadores.length > 0 && (
          <div className="mt-6 mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <span className="bg-blue-900 text-white font-black text-xs px-2 py-0.5 rounded">👥</span>
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                NÓMINA DE TRABAJADORES AUTORIZADOS (PERSONAL ACREDITADO)
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-[30px_2fr_1.2fr_1.2fr_2fr] gap-2 p-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                <div className="text-center">#</div>
                <div>NOMBRE Y APELLIDO</div>
                <div>DNI / LEGAJO</div>
                <div>FUNCIÓN</div>
                <div className="text-center">FIRMA DEL OPERARIO</div>
              </div>
              {trabajadores.map((w: any, idx: number) => (
                <div
                  key={w.id || idx}
                  className={`grid grid-cols-[30px_2fr_1.2fr_1.2fr_2fr] gap-2 p-2 items-center border-b border-slate-200 text-xs ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <div className="text-center font-black text-slate-400 text-[10px]">{idx + 1}</div>
                  <div className="font-extrabold text-slate-900">{w.nombre || '-'}</div>
                  <div className="font-bold text-slate-700">{w.dni || '-'}</div>
                  <div className="font-medium text-slate-600">{w.funcion || 'Operario'}</div>
                  <div className="h-8 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-bold">
                    Firma: __________________
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 page-break-inside-avoid">
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
                    license: actLic
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