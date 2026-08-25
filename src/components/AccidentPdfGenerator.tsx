import React from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, Clock, TriangleAlert, User, FileText, Building2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function AccidentPdfGenerator({ report, onBack, isHeadless = false }: { report: any; onBack?: any; isHeadless?: boolean; }): React.ReactElement | null {

  const getSeverityStyle = (sev: any) => {
    if (sev === 'Leve') return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', borderTop: '#3b82f6', label: 'LEVE — Sin Baja' };
    if (sev === 'Moderado') return { color: '#b45309', bg: '#fffbeb', border: '#fde68a', borderTop: '#f59e0b', label: 'MODERADO — Con Baja' };
    if (sev === 'Grave') return { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', borderTop: '#f97316', label: 'GRAVE — Internación' };
    if (sev === 'Mortal') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', borderTop: '#dc2626', label: 'MORTAL' };
    return { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', borderTop: '#64748b', label: sev };
  };

  const sev = getSeverityStyle(report?.gravedad);

  // Obtener firma profesional desde report o localStorage
  let actSignature: string | null = report?.professionalSignature || null;
  let actStamp: string | null = report?.professionalStamp || null;
  let actName: string | null = report?.professionalName || null;
  let actLic: string | null = report?.professionalLicense || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  return (
    <div className={`w-full ${isHeadless ? 'block p-0 m-0' : 'container flex flex-col pb-4'}`}>
      {!isHeadless && (
        <div className="no-print flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-full text-slate-800 dark:text-white hover:bg-slate-100">
              <ArrowLeft size={20} />
            </button>
            <h1 className="m-0 text-xl font-black text-slate-900 dark:text-white">Informe de Investigación de Accidente</h1>
          </div>
          <button onClick={() => window.print()} className="btn-primary m-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow">
            <Printer size={18} /> Imprimir / PDF
          </button>
        </div>
      )}

      <div className={isHeadless ? 'block p-0 m-0' : 'flex justify-center'}>
        <div
          id="pdf-content"
          className="pdf-container print-area w-full max-w-[210mm] bg-white text-slate-900 p-[6mm_8mm] shadow-xl rounded-xl border border-slate-200 box-border text-[8pt] font-sans"
          style={{
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          <style type="text/css" media="print">{`
            @page { size: A4 portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; background: white !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
            .no-print, nav, header, aside, .sidebar, .module-form-toolbar, .module-action-bar, .module-wizard-footer { display: none !important; }
            #pdf-content, .print-area {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              opacity: 1 !important;
              visibility: visible !important;
              z-index: 999999 !important;
            }
          `}</style>

          {/* Header Alto Contraste en Blanco/Slate con Borde Azul */}
          <div className="bg-slate-50 border-2 border-slate-300 border-t-4 border-t-blue-600 rounded-xl p-3 mb-2.5 flex justify-between items-center flex-row gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <span className="text-[0.55rem] font-black text-blue-700 uppercase tracking-widest block">
                  SISTEMA DE GESTIÓN DE HIGIENE Y SEGURIDAD EN EL TRABAJO
                </span>
                <h1 style={{ color: '#0f172a' }} className="m-0 text-xs font-black uppercase tracking-tight leading-none">
                  INFORME DE INVESTIGACIÓN DE ACCIDENTE
                </h1>
                <span className="text-[0.58rem] text-slate-600 font-bold block mt-0.5">
                  Res. SRT 7/2026 · Dec. 549/2025 · Metodología Árbol de Causas (SRT)
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <CompanyLogo style={{ maxHeight: '30px', maxWidth: '95px', objectFit: 'contain' }} />
              <span className="px-2 py-0.5 rounded-md text-[0.56rem] font-black uppercase text-white shadow-sm" style={{ backgroundColor: sev.borderTop }}>
                ⚠ {sev.label}
              </span>
              <span className="text-[0.54rem] font-mono text-slate-500 font-bold">Ref: INV-{report?.id?.toString().slice(-6) || '000000'}</span>
            </div>
          </div>

          {/* 1 - Datos del Siniestro y Registro ART */}
          <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-blue-600 px-2.5 py-1 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={12} className="text-amber-600" />
                <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                  1 — DATOS DEL SINIESTRO Y REGISTRO ART
                </span>
              </div>
              {report?.artNombre && (
                <span className="px-2 py-0.5 rounded text-[0.55rem] font-black bg-blue-100 text-blue-900 border border-blue-300 uppercase">
                  🏥 {report.artNombre}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
              <div className="p-1.5 col-span-1">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">EMPRESA / RAZÓN SOCIAL</span>
                <div style={{ color: '#0f172a' }} className="font-extrabold text-[0.8rem] mt-0.5">{report?.empresa || '-'}</div>
              </div>
              <div className="p-1.5 col-span-1">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">FECHA DEL HECHO</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">
                  {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
                </div>
              </div>
              <div className="p-1.5 col-span-1">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">HORA APROX.</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.hora || 'N/E'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 bg-white border-b border-slate-200 divide-x divide-slate-200">
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">UBICACIÓN / SECTOR</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.ubicacion || '-'}</div>
              </div>
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">N° SINIESTRO / DENUNCIA ART</span>
                <div style={{ color: '#0f172a' }} className="font-extrabold text-[0.78rem] mt-0.5">{report?.numeroSiniestro || 'Sin denuncia'}</div>
              </div>
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">SANATORIO / CENTRO MÉDICO</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.centroMedico || 'N/E'}</div>
              </div>
            </div>

            {report?.hhtTotal && (
              <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 flex justify-between items-center text-[0.6rem] font-bold border-t border-emerald-200">
                <span style={{ color: '#065f46' }}>📊 ÍNDICORES SRT (RES. 503/14):</span>
                <div className="flex gap-3" style={{ color: '#065f46' }}>
                  <span>IF: <strong>{((1 * 1000000) / (parseFloat(report.hhtTotal) || 100000)).toFixed(2)}</strong></span>
                  <span>IG: <strong>{(((parseFloat(report.diasIltEstimados) || 0) * 1000000) / (parseFloat(report.hhtTotal) || 100000)).toFixed(2)}</strong></span>
                  <span>HHT ANUAL: {report.hhtTotal} hrs</span>
                </div>
              </div>
            )}
          </div>

          {/* 2 - Datos del Accidentado y Lesión */}
          <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-red-600 px-2.5 py-1 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-red-600" />
                <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                  2 — DATOS DEL ACCIDENTADO Y VALORACIÓN DE LA LESIÓN (RES. SRT 7/2026)
                </span>
              </div>
              {report?.diasIltEstimados && (
                <span className="px-2 py-0.5 rounded text-[0.55rem] font-black bg-red-100 text-red-900 border border-red-300 uppercase">
                  ILT: {report.diasIltEstimados} días de baja
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">NOMBRE Y APELLIDO</span>
                <div style={{ color: '#0f172a' }} className="font-extrabold text-[0.8rem] mt-0.5">{report?.victimaNombre || '-'}</div>
              </div>
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">DNI / CUIL</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.victimaDni || '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 bg-white border-b border-slate-200 divide-x divide-slate-200">
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">PUESTO DE TRABAJO</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.victimaPuesto || '-'}</div>
              </div>
              <div className="p-1.5">
                <span className="text-[0.54rem] font-black text-slate-500 uppercase block">ANTIGÜEDAD EN EL PUESTO</span>
                <div style={{ color: '#0f172a' }} className="font-bold text-[0.78rem] mt-0.5">{report?.victimaAntiguedad || '-'}</div>
              </div>
            </div>

            {report?.mecanismoAccidente && (
              <div className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border-b border-blue-200 text-[0.62rem] font-bold">
                ⚙️ MECANISMO DE ACCIDENTE: <span style={{ color: '#1e3a8a' }} className="font-extrabold">{report.mecanismoAccidente}</span>
              </div>
            )}

            <div className="grid grid-cols-2 bg-red-50/50 p-1.5 gap-2">
              <div>
                <span className="text-[0.54rem] font-black text-red-800 uppercase block">DIAGNÓSTICO / TIPO DE LESIÓN</span>
                <div style={{ color: '#7f1d1d' }} className="font-extrabold text-[0.78rem] mt-0.5">{report?.lesion || 'No especificada'}</div>
              </div>
              <div>
                <span className="text-[0.54rem] font-black text-red-800 uppercase block">PARTE ANATÓMICA AFECTADA</span>
                <div style={{ color: '#7f1d1d' }} className="font-extrabold text-[0.78rem] mt-0.5">
                  {report?.parteCuerpoEspecifica || report?.parteCuerpo || 'No especificada'}
                </div>
              </div>
            </div>
          </div>

          {/* 3 - Descripción del Hecho y Factores Ambientales */}
          <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-emerald-600 px-2.5 py-1 flex items-center gap-1.5">
              <FileText size={12} className="text-emerald-700" />
              <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                3 — DESCRIPCIÓN DETALLADA Y FACTORES DEL ENTORNO
              </span>
            </div>

            <div style={{ color: '#0f172a' }} className="p-2 text-[0.78rem] leading-relaxed font-semibold bg-slate-50 text-justify whitespace-pre-wrap">
              {report?.descripcionHecho || 'Sin descripción detallada.'}
            </div>

            {/* Checklist Entorno */}
            {report?.condicionesAmbientales && Object.values(report.condicionesAmbientales).some(Boolean) && (
              <div className="p-1.5 bg-white border-t border-slate-200">
                <div style={{ color: '#0f172a' }} className="text-[0.54rem] font-black uppercase mb-0.5">
                  MAPA DE FACTORES DEL ENTORNO DETECTADOS:
                </div>
                <div className="flex flex-wrap gap-1">
                  {report.condicionesAmbientales.iluminacionDeficiente && <span style={{ color: '#0f172a' }} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[0.58rem] font-black">💡 Iluminación insuficiente</span>}
                  {report.condicionesAmbientales.ordenLimpiezaDeficiente && <span style={{ color: '#0f172a' }} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[0.58rem] font-black">🧹 Orden y limpieza deficiente</span>}
                  {report.condicionesAmbientales.pisoResbaladizo && <span style={{ color: '#0f172a' }} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[0.58rem] font-black">💧 Piso resbaladizo</span>}
                  {report.condicionesAmbientales.ruidoElevado && <span style={{ color: '#0f172a' }} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[0.58rem] font-black">🎧 Ruido ambiente elevado</span>}
                  {report.condicionesAmbientales.eppAusenteOInadecuado && <span style={{ color: '#7f1d1d' }} className="px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-[0.58rem] font-black">🛡️ EPP ausente o no usado</span>}
                  {report.condicionesAmbientales.ventilacionInsuficiente && <span style={{ color: '#0f172a' }} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[0.58rem] font-black">💨 Ventilación insuficiente</span>}
                  {report.condicionesAmbientales.faltaGuardaProteccion && <span style={{ color: '#7f1d1d' }} className="px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-[0.58rem] font-black">⚙️ Ausencia guardas / LOTO</span>}
                </div>
              </div>
            )}

            {report?.testigos?.some((t: any) => t.nombre) && (
              <div className="p-1.5 bg-white border-t border-slate-200 space-y-0.5">
                <div className="text-[0.54rem] font-black text-slate-500 uppercase mb-0.5">TESTIGOS INTERVINIENTES:</div>
                {report.testigos.filter((t: any) => t.nombre).map((t: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-[0.7rem] p-1 bg-slate-50 rounded border-l-2 border-slate-400">
                    <span style={{ color: '#0f172a' }} className="font-extrabold min-w-[95px]">{t.nombre}:</span>
                    <span className="text-slate-700 italic">"{t.declaracion}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4 - Análisis Causal "5 Porqués" & Árbol de Causas */}
          <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-purple-600 px-2.5 py-1 flex items-center gap-1.5">
              <Search size={12} className="text-purple-700" />
              <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                4 — ANÁLISIS CAUSAL — ÁRBOL DE CAUSAS (METODOLOGÍA SRT)
              </span>
            </div>

            <div className="p-1.5 bg-purple-50 border-b border-purple-200">
              <span className="text-[0.54rem] font-black text-purple-900 uppercase block">EFECTO PRINCIPAL / ACCIDENTE</span>
              <div style={{ color: '#3b0764' }} className="font-extrabold text-[0.78rem] mt-0.5">{report?.problemaCentral || 'No definido'}</div>
            </div>

            <div className="p-2 bg-white space-y-1">
              {report?.porques?.filter((p: any) => p).map((pq: string, idx: number) => (
                <div key={idx} style={{ paddingLeft: `${idx * 6}px` }} className="flex items-start gap-1.5">
                  <div
                    style={{
                      backgroundColor: idx === report.porques.filter((p: any) => p).length - 1 ? '#7c3aed' : '#f1f5f9',
                      color: idx === report.porques.filter((p: any) => p).length - 1 ? '#ffffff' : '#475569'
                    }}
                    className="w-3.5 h-3.5 rounded-full border border-purple-300 flex items-center justify-center font-black text-[0.54rem] shrink-0 mt-0.5"
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[0.52rem] font-black text-slate-400 uppercase block">Nivel {idx + 1} de Causalidad</span>
                    <div style={{ color: '#0f172a' }} className="font-bold text-[0.72rem] leading-snug">{pq}</div>
                  </div>
                </div>
              ))}

              {report?.porques?.filter((p: any) => p).length > 0 && (
                <div className="mt-1 p-1 bg-purple-50 border border-dashed border-purple-300 rounded-md">
                  <span className="text-[0.54rem] font-black text-purple-900 uppercase block">✓ CAUSA RAÍZ SISTÉMICA IDENTIFICADA</span>
                  <div style={{ color: '#3b0764' }} className="font-extrabold text-[0.75rem] mt-0.5">
                    {[...report.porques].filter((p: any) => p).reverse()[0]}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5 - Plan de Acción Correctiva */}
          <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-amber-600 px-2.5 py-1 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-amber-700" />
              <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                5 — PLAN DE ACCIÓN CORRECTIVA Y PREVENTIVA (CAPA)
              </span>
            </div>

            <table className="w-full border-collapse text-[7.5pt]">
              <thead>
                <tr className="bg-amber-50/70 border-b border-amber-200">
                  <th className="p-1 text-left font-extrabold text-amber-950 w-1/2 uppercase text-[0.55rem]">Acción Correctiva</th>
                  <th className="p-1 text-left font-extrabold text-amber-950 w-1/4 uppercase text-[0.55rem]">Responsable</th>
                  <th className="p-1 text-center font-extrabold text-amber-950 w-1/4 uppercase text-[0.55rem]">Fecha Límite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report?.medidas?.filter((m: any) => m.accion).length > 0 ? (
                  report.medidas.filter((m: any) => m.accion).map((m: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td style={{ color: '#0f172a' }} className="p-1 font-bold">{m.accion}</td>
                      <td className="p-1 font-semibold text-slate-700">{m.responsable || '-'}</td>
                      <td className="p-1 text-center font-semibold text-slate-700">
                        {m.fechaLimite ? new Date(m.fechaLimite + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-1.5 text-center text-slate-400 italic">No se definieron medidas correctivas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 6 - Registro Fotográfico (Si existe) */}
          {report?.fotos && report.fotos.length > 0 && (
            <div className="border border-slate-300 rounded-lg mb-2 overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 border-l-4 border-l-cyan-600 px-2.5 py-1 flex items-center gap-1.5">
                <FileText size={12} className="text-cyan-700" />
                <span style={{ color: '#0f172a' }} className="font-black text-[0.68rem] uppercase tracking-wider">
                  6 — REGISTRO FOTOGRÁFICO / EVIDENCIA DEL SINIESTRO
                </span>
              </div>
              <div className="p-1.5 grid grid-cols-3 gap-1.5 bg-slate-50">
                {report.fotos.map((foto: string, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center">
                    <img src={foto} alt={`Evidencia ${idx + 1}`} className="w-full h-auto max-h-[85px] object-contain block rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenedor Unificado de Firmas y Footer (Garantiza 2 Páginas Máximo) */}
          <div className="pdf-signatures-wrapper avoid-break break-inside-avoid w-full block mt-2 border-t border-slate-300 pt-2 text-center" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <PdfSignatures
              data={report}
              box1={report.showSignatures?.operator ? {
                title: 'ACCIDENTADO / TESTIGO',
                subtitle: 'Declaración y firma',
                signatureUrl: report.operatorSignature || null,
                isProfessional: false
              } : null}
              box2={report.showSignatures?.professional ? {
                title: 'PROFESIONAL H&S',
                subtitle: (actName || 'Firma de Especialista').toUpperCase(),
                signatureUrl: actSignature || null,
                stampUrl: report.professionalStamp || actStamp || null,
                isProfessional: true,
                license: actLic || null
              } : null}
              box3={report.showSignatures?.supervisor ? {
                title: 'SUPERVISOR / EMPLEADOR',
                subtitle: 'Validación del informe',
                signatureUrl: report.signature || report.supervisorSignature || null,
                isProfessional: false
              } : null}
            />

            <PdfBrandingFooter />
          </div>
        </div>
      </div>
    </div>
  );
}