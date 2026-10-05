import React from 'react';
import { 
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, User, Calendar, 
  RefreshCw, Target, HelpCircle, GitFork, FileText, Check, AlertCircle 
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';

interface CAPAPdfProps {
  data: any;
  customId?: string;
}

export default function CAPAPdf({ data, customId }: CAPAPdfProps): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura de firma desde personalData o del dato en sí
  let actSignature = data.signature || data.professionalSignature || null;
  let actName = data.professionalName || data.leadAuditor || null;
  let actLic = data.license || data.professionalLicense || null;
  let actStamp = data.stamp || data.professionalStamp || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature || null;
        actStamp = parsed.stamp || null;
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

  const isCritical = data.priority === 'critical';
  const elementId = customId || 'pdf-content';

  // Métodos de Causa Raíz
  const rootCause = data.rootCause || {};
  const whys = [
    rootCause.why1,
    rootCause.why2,
    rootCause.why3,
    rootCause.why4,
    rootCause.why5
  ].filter(Boolean);

  const hasIshikawa = rootCause.ishikawa && (
    (Array.isArray(rootCause.ishikawa.manpower) && rootCause.ishikawa.manpower.length > 0) ||
    (Array.isArray(rootCause.ishikawa.methodology) && rootCause.ishikawa.methodology.length > 0) ||
    (Array.isArray(rootCause.ishikawa.machinery) && rootCause.ishikawa.machinery.length > 0) ||
    (Array.isArray(rootCause.ishikawa.materials) && rootCause.ishikawa.materials.length > 0) ||
    (Array.isArray(rootCause.ishikawa.measurement) && rootCause.ishikawa.measurement.length > 0) ||
    (Array.isArray(rootCause.ishikawa.environment) && rootCause.ishikawa.environment.length > 0) ||
    typeof rootCause.ishikawa.manpower === 'string' && rootCause.ishikawa.manpower.trim() !== ''
  );

  const finalCause = rootCause.finalCause || data.rootCauseAnalysis;
  const verification = data.verification || {};
  const actionsList = Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : null;

  return (
    <div className="w-[100%] flex justify-center">
      <div
        id={elementId}
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-0 h-auto p-[10mm_12mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
        style={{
          borderTop: isCritical ? '12px solid #dc2626' : '12px solid #2563eb'
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important; margin: 0 !important; padding: 5mm !important; 
              width: 100% !important; max-width: none !important; 
              border-top: ${isCritical ? '12px solid #dc2626' : '12px solid #2563eb'} !important; border-radius: 0 !important; 
              min-height: auto !important; height: auto !important;
            }
          `}
        </style>

        {/* Encabezado Principal Oficial */}
        <div className="flex flex-row justify-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1rem] mb-[1.2rem] w-[100%]">
          <div className="flex-[1] text-left">
            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">
              Sistema Integrado de Gestión EHS
            </p>
            <p style={{ color: isCritical ? '#dc2626' : '#2563eb' }} className="m-[0] font-[900] text-[0.8rem] uppercase">
              ISO 45001 / ISO 9001 • Mejora Continua
            </p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-[0] font-[900] text-[2.2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">
              CAPA
            </h1>
            <div
              style={{ background: isCritical ? '#dc2626' : '#3b82f6' }}
              className="mt-[0.3rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]"
            >
              PLAN DE ACCIÓN CORRECTIVA Y PREVENTIVA
            </div>
          </div>

          <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Ficha Técnica y Metadatos de la Acción */}
        <div
          style={{ border: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1' }}
          className="rounded-[6px] mb-[1.2rem] w-[100%] overflow-[hidden]"
        >
          <div
            style={{
              background: isCritical ? '#fef2f2' : '#f8fafc',
              borderBottom: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1'
            }}
            className="p-[0.8rem_1rem] flex justify-between items-center"
          >
            <div>
              <span
                style={{ color: isCritical ? '#dc2626' : '#3b82f6' }}
                className="text-[0.65rem] font-[800] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]"
              >
                <RefreshCw size={14} /> IDENTIFICADOR ÚNICO: #{data.id || 'CAPA-REG'}
              </span>
              <div className="font-[900] text-[1.2rem] text-[#0f172a] mt-[0.2rem]">
                {data.title || data.problemStatement || 'Sin título especificado'}
              </div>
            </div>
            <div className="text-right">
              <span
                style={{
                  background: data.status === 'completed' || data.status === 'closed' ? '#dcfce7' : isCritical ? '#fee2e2' : '#eff6ff',
                  color: data.status === 'completed' || data.status === 'closed' ? '#16a34a' : isCritical ? '#b91c1c' : '#1d4ed8'
                }}
                className="p-[0.35rem_0.85rem] rounded-[6px] text-[0.75rem] font-[800] uppercase inline-block border border-current"
              >
                ESTADO: {data.status?.toUpperCase() || 'ABIERTA'}
              </span>
            </div>
          </div>

          <div className="flex bg-[#ffffff] divide-x divide-slate-200">
            <div className="flex-[1] p-[0.6rem_0.8rem]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]">
                <AlertTriangle size={12} /> ORIGEN / FUENTE
              </span>
              <div className="font-[700] text-[0.82rem] text-[#334155] mt-[0.1rem]">
                {data.source || 'Inspección / Auditoría'}
              </div>
            </div>
            <div className="flex-[1] p-[0.6rem_0.8rem]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]">
                <Calendar size={12} /> FECHA APERTURA
              </span>
              <div className="font-[700] text-[0.82rem] text-[#334155] mt-[0.1rem]">
                {data.date || data.originDate || (data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : '-')}
              </div>
            </div>
            <div className="flex-[1] p-[0.6rem_0.8rem] bg-[#f8fafc]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]">
                <Clock size={12} /> FECHA LÍMITE
              </span>
              <div
                style={{ color: isCritical ? '#dc2626' : '#0f172a' }}
                className="font-[900] text-[0.82rem] mt-[0.1rem]"
              >
                {data.dueDate ? new Date(data.dueDate).toLocaleDateString('es-AR') : 'Sin fecha límite'}
              </div>
            </div>
            <div className="flex-[1] p-[0.6rem_0.8rem]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]">
                <User size={12} /> RESPONSABLE
              </span>
              <div className="font-[700] text-[0.82rem] text-[#334155] mt-[0.1rem]">
                {data.responsible || 'No asignado'}
              </div>
            </div>
          </div>
        </div>

        {/* Sección 1 y 2: Descripción del Hallazgo y Tratamiento Inmediato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-[1.2rem]">
          <div className="border border-slate-300 p-4 rounded-lg bg-white flex flex-col">
            <span className="text-[0.7rem] font-[900] text-[#475569] block mb-2 border-b border-slate-200 pb-1 uppercase flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              1. DESCRIPCIÓN DEL HALLAZGO / DESVIACIÓN TÉCNICA
            </span>
            <div className="text-[0.82rem] text-[#1e293b] leading-relaxed flex-1">
              <ReportContentRenderer content={data.description || data.problemStatement || 'No se ingresó una descripción detallada del hallazgo.'} />
            </div>
          </div>

          <div className="border border-slate-300 p-4 rounded-lg bg-white flex flex-col">
            <span className="text-[0.7rem] font-[900] text-[#475569] block mb-2 border-b border-slate-200 pb-1 uppercase flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-600" />
              2. ACCIÓN DE TRATAMIENTO INMEDIATO (CONTENCIÓN)
            </span>
            <div className="text-[0.82rem] text-[#1e293b] leading-relaxed flex-1">
              <ReportContentRenderer content={data.immediateAction || 'Se procedió al bloqueo preventivo e interrupción temporal de la actividad para contener la amenaza inminente asociada.'} />
            </div>
          </div>
        </div>

        {/* Sección 3: Análisis de Causa Raíz (5 Porqués / Ishikawa / Causa Final) */}
        {(whys.length > 0 || hasIshikawa || finalCause) && (
          <div className="mb-[1.2rem] border border-blue-200 bg-blue-50/50 p-4 rounded-lg">
            <h3 className="m-0 mb-2.5 text-[0.75rem] font-[900] text-blue-900 flex items-center gap-2 uppercase">
              <GitFork size={15} className="text-blue-700" />
              3. METODOLOGÍA Y ANÁLISIS DE CAUSA RAÍZ
            </h3>

            {/* Secuencia de 5 Porqués */}
            {whys.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <span className="text-[0.65rem] font-[800] uppercase text-blue-800 tracking-wider block">
                  Método de los 5 Porqués:
                </span>
                <div className="space-y-1">
                  {whys.map((why: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/90 p-2 rounded border border-blue-100">
                      <span className="font-extrabold text-blue-700 text-[0.75rem] min-w-[20px]">
                        {idx + 1}º
                      </span>
                      <div className="text-[0.8rem] text-slate-800 flex-1">
                        <ReportContentRenderer content={why} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Causa Fundamental Final */}
            {finalCause && (
              <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                <span className="text-[0.65rem] font-[900] uppercase text-emerald-800 tracking-wider flex items-center gap-1.5 mb-1">
                  <Target size={13} className="text-emerald-700" />
                  Causa Raíz Fundamental Identificada:
                </span>
                <div className="text-[0.82rem] font-bold text-emerald-950">
                  <ReportContentRenderer content={finalCause} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección 4: Plan de Acción Definitivo */}
        <div className="mb-[1.2rem] bg-[#ecfdf5] border-[1px_solid_#a7f3d0] p-[1rem] rounded-[6px]">
          <h3 className="m-[0_0_0.5rem_0] text-[0.78rem] font-[900] text-[#065f46] flex items-center gap-[0.5rem] uppercase">
            <ShieldCheck size={16} /> 4. PLAN DE ACCIÓN DEFINITIVO (RESOLUCIÓN DE RAÍZ)
          </h3>
          <div className="text-[0.82rem] text-[#064e3b] leading-relaxed">
            <ReportContentRenderer content={data.actionPlan || 'El plan definitivo contempla la readecuación operativa, controles de ingeniería e instrucción al personal involucrado.'} />
          </div>

          {/* Tabla de Acciones Específicas si existen */}
          {actionsList && (
            <div className="mt-3 overflow-hidden rounded border border-emerald-300 bg-white">
              <table className="w-full text-left border-collapse text-[0.75rem]">
                <thead>
                  <tr className="bg-emerald-100/70 text-emerald-900 border-b border-emerald-300 font-bold uppercase text-[0.65rem]">
                    <th className="p-2">Acción Específica</th>
                    <th className="p-2">Responsable</th>
                    <th className="p-2">Fecha Límite</th>
                    <th className="p-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {actionsList.map((act: any, i: number) => (
                    <tr key={i} className="text-slate-800">
                      <td className="p-2 font-medium">{act.description}</td>
                      <td className="p-2 text-slate-600">{act.responsible || '-'}</td>
                      <td className="p-2 text-slate-600">{act.dueDate ? new Date(act.dueDate).toLocaleDateString('es-AR') : '-'}</td>
                      <td className="p-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold uppercase bg-slate-100 text-slate-700">
                          {act.status || 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sección 5: Verificación de Eficacia y Cierre */}
        <div className="mb-[1.2rem] border border-slate-300 p-3 rounded-lg bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
            <span className="text-[0.7rem] font-[900] text-slate-700 uppercase flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              5. VERIFICACIÓN DE EFICACIA Y SEGUIMIENTO (ISO 45001 CLAUSE 10.2)
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${verification.implemented ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                {verification.implemented ? '✓ IMPLEMENTADA' : '○ PENDIENTE IMPL.'}
              </span>
              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${verification.effective || data.effectivenessVerified ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                {verification.effective || data.effectivenessVerified ? '✓ EFICACIA COMPROBADA' : '○ EFICACIA EN SEGUIMIENTO'}
              </span>
            </div>
          </div>
          <div className="text-[0.78rem] text-slate-700 leading-normal">
            <ReportContentRenderer content={verification.comments || data.observations || 'Se verificará que las medidas correctivas adoptadas eviten la recurrencia del desvío sin generar nuevos riesgos operativos.'} />
          </div>
        </div>

        {/* Firmas de Responsabilidad */}
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-signatures-wrapper mt-[1rem]">
          <PdfSignatures
            data={data}
            box1={data.showSignatures?.operator !== false ? {
              title: 'RESPONSABLE / OPERADOR',
              subtitle: 'Firma de Conformidad',
              signatureUrl: data.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={data.showSignatures?.professional !== false ? {
              title: 'PROFESIONAL ACTUANTE',
              subtitle: (actName || 'Firma de Especialista').toUpperCase(),
              signatureUrl: data.signature || actSignature || null,
              stampUrl: data.professionalStamp || actStamp || null,
              isProfessional: true,
              license: actLic
            } : null}
            box3={data.showSignatures?.supervisor !== false ? {
              title: 'SUPERVISIÓN / CIERRE',
              subtitle: 'Aprobación y Cierre CAPA',
              signatureUrl: data.supervisorSignature || null,
              isProfessional: false
            } : null} 
          />
        </div>

        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-brand-container mt-[0.5rem]">
          <PdfBrandingFooter />
        </div>
      </div>
    </div>
  );
}
