import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, User, Calendar, MapPin, ShieldCheck, Flag, CheckSquare, XSquare, AlertOctagon, HelpCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';

export default function AuditPdf({ data, customId }: { data: any; customId?: string }): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura de firma desde personalData o del dato en sí
  let actSignature = data.signature || null;
  let actName = data.professionalName || data.auditor || data.leadAuditor || null;
  let actLic = data.license || null;
  let actStamp = data.professionalStamp || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature || !actStamp) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!actSignature) actSignature = parsed.signature;
        if (!actStamp) actStamp = parsed.stamp;
      } else if (legacySig && !actSignature) {
        actSignature = legacySig;
      }

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  // Cómputo dinámico de métricas a partir del checklist real
  const checklist = Array.isArray(data.checklist) ? data.checklist : [];
  const totalItems = checklist.length;
  const conformitiesCount = checklist.filter((item: any) => item.status === 'si').length;
  const nonConformitiesCount = checklist.filter((item: any) => item.status === 'no').length;
  const naCount = checklist.filter((item: any) => item.status === 'na').length;
  
  // Porcentaje de cumplimiento sobre los aplicables
  const evaluatedItems = conformitiesCount + nonConformitiesCount;
  const complianceRate = evaluatedItems > 0 
    ? Math.round((conformitiesCount / evaluatedItems) * 100) 
    : (data.complianceRate || 100);

  // Lista de desvíos detectados
  const nonConformitiesList = checklist.filter((item: any) => item.status === 'no');

  // Tipo de auditoría legible
  const auditTypeLabel = 
    data.auditType === 'external' ? 'Auditoría Externa' :
    data.auditType === 'certification' ? 'Auditoría de Certificación' :
    data.auditType === 'surveillance' ? 'Auditoría de Seguimiento' :
    data.auditType === 'compliance' ? 'Auditoría de Cumplimiento Legal' :
    data.auditType === 'supplier' ? 'Auditoría de Proveedor' :
    'Auditoría Interna EHS';

  return (
    <div className="w-[100%] flex justify-center">
      <div
        id={customId || "pdf-content"}
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[10mm_12mm] bg-[#ffffff] text-[#1e293b] box-shadow-none rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9.5pt] font-family-[system-ui,_-apple-system,_sans-serif] border-top-[12px_solid_#2563eb]"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              font-family: system-ui, -apple-system, sans-serif; 
              background: white !important; 
            }
            .no-print, .module-form-layout, .module-form-toolbar, .module-action-bar, header, nav, aside, .sidebar { 
              display: none !important; 
            }
            .print-area {
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border-top: 12px solid #2563eb !important; 
              border-radius: 0 !important; 
              min-height: 0 !important; 
              height: auto !important; 
              max-height: none !important;
            }
            .striped-row:nth-child(even) { background-color: #f8fafc; }
            
            /* Preservación de renglones y párrafos */
            .report-content-renderer p {
              margin-top: 0 !important;
              margin-bottom: 0.75rem !important;
              min-height: 1.25em !important;
              line-height: 1.6 !important;
            }
            .report-content-renderer p:empty,
            .report-content-renderer p > br:only-child {
              display: inline-block !important;
              min-height: 1.25em !important;
              content: "" !important;
            }
            
            /* Saltos de página limpios */
            .audit-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}
        </style>

        {/* Encabezado Principal */}
        <div className="flex flex-row justify-between items-center border-bottom-[3px_solid_#0f172a] pb-[1rem] mb-[1.2rem] w-[100%]">
          <div className="flex-[1] text-left">
            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión ISO 45001 / EHS</p>
            <p className="m-[0] font-[900] text-[0.85rem] uppercase text-[#2563eb]">{auditTypeLabel}</p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-[0] font-[900] text-[2.2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">AUDITORÍA</h1>
            <div className="mt-[0.3rem] bg-[#0f172a] text-[white] p-[0.25rem_0.9rem] rounded-full text-[0.65rem] font-[800] letter-spacing-[0.1em]">
              INFORME OFICIAL DE RESULTADOS EHS
            </div>
          </div>

          <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
            <CompanyLogo style={{ maxHeight: '42px', maxWidth: '130px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Aspecto Evaluado y Metadatos de la Auditoría */}
        <div className="border-[1px_solid_#cbd5e1] rounded-[8px] mb-[1.2rem] w-[100%] overflow-[hidden] shadow-sm">
          <div className="p-[0.8rem_1rem] bg-[#f8fafc] border-bottom-[1px_solid_#cbd5e1]">
            <span className="text-[0.65rem] font-[800] text-[#2563eb] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
              <Flag size={14} /> IDENTIFICACIÓN DEL PROCESO AUDITADO
            </span>
            <div className="font-[900] text-[1.25rem] text-[#0f172a] mt-[0.2rem]">
              {data.auditTitle || data.title || 'Auditoría General de Higiene y Seguridad'}
            </div>
          </div>
          
          <div className="flex flex-wrap bg-[#ffffff]">
            <div className="flex-[1] min-w-[140px] p-[0.6rem_1rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} className="text-[#2563eb]" /> FECHA</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">
                {data.date ? new Date(data.date).toLocaleDateString('es-AR') : (data.scheduledDate || '-')}
              </div>
            </div>
            <div className="flex-[1] min-w-[140px] p-[0.6rem_1rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} className="text-[#2563eb]" /> LOCACIÓN / PLANTA</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{data.location || 'Sede Principal'}</div>
            </div>
            <div className="flex-[1] min-w-[140px] p-[0.6rem_1rem]">
              <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} className="text-[#2563eb]" /> AUDITOR LÍDER</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{actName || 'Especialista EHS'}</div>
            </div>
          </div>
        </div>

        {/* Panel de Métricas Cuantitativas de Desempeño */}
        <div className="grid grid-cols-4 gap-3 mb-[1.2rem]">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ítems Evaluados</span>
            <span className="text-xl font-black text-slate-800">{totalItems || evaluatedItems || 10}</span>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
            <span className="text-[0.65rem] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Conformidades</span>
            <span className="text-xl font-black text-emerald-600">
              {totalItems > 0 ? conformitiesCount : (data.conformities || 10)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-center">
            <span className="text-[0.65rem] font-bold text-rose-700 uppercase tracking-wider block mb-1">No Conformidades</span>
            <span className="text-xl font-black text-rose-600">
              {totalItems > 0 ? nonConformitiesCount : (data.nonConformities || 0)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-center">
            <span className="text-[0.65rem] font-bold text-blue-700 uppercase tracking-wider block mb-1">Cumplimiento Global</span>
            <span className="text-xl font-black text-blue-600">{complianceRate}%</span>
          </div>
        </div>

        {/* Objetivo y Alcance */}
        <div className="grid grid-cols-2 gap-3 mb-[1.2rem]">
          <div className="border border-slate-200 p-3 rounded-lg bg-white">
            <span className="text-[0.65rem] font-extrabold text-slate-500 uppercase block mb-1.5 border-b border-slate-100 pb-1">
              OBJETIVO DE LA AUDITORÍA
            </span>
            <div className="text-[0.8rem] text-slate-700 leading-relaxed">
              <ReportContentRenderer content={data.objective || 'Verificar el grado de cumplimiento de los procedimientos internos de Higiene, Seguridad y Medio Ambiente, y los requisitos legales obligatorios aplicables a la operación.'} isPrint={true} />
            </div>
          </div>

          <div className="border border-slate-200 p-3 rounded-lg bg-white">
            <span className="text-[0.65rem] font-extrabold text-slate-500 uppercase block mb-1.5 border-b border-slate-100 pb-1">
              ALCANCE Y METODOLOGÍA
            </span>
            <div className="text-[0.8rem] text-slate-700 leading-relaxed">
              <ReportContentRenderer content={data.scope || 'Observación técnica directa en puestos de trabajo, entrevistas a operarios/supervisores y examen de registros documentales del Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST).'} isPrint={true} />
            </div>
          </div>
        </div>

        {/* TABLA OFICIAL DE RESULTADOS DEL CHECKLIST AUDITADO */}
        {checklist.length > 0 ? (
          <div className="mb-[1.5rem]">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-200 avoid-break">
              <div className="w-2 h-5 bg-blue-600 rounded"></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider m-0">
                RELEVAMIENTO TÉCNICO DETALLADO (CHECKLIST DE CUMPLIMIENTO)
              </h3>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-[8.5pt] audit-table">
                <thead>
                  <tr className="bg-slate-900 text-white text-left font-bold">
                    <th className="p-2.5 w-[22%]">Norma / Ref. Legal</th>
                    <th className="p-2.5 w-[42%]">Aspecto / Requisito Auditado</th>
                    <th className="p-2.5 w-[14%] text-center">Dictamen</th>
                    <th className="p-2.5 w-[22%]">Observación / Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.map((item: any, idx: number) => {
                    const isConforme = item.status === 'si';
                    const isNoConforme = item.status === 'no';
                    const isNA = item.status === 'na';

                    return (
                      <tr key={item.id || idx} className="border-b border-slate-200 striped-row">
                        <td className="p-2 font-bold text-slate-800 align-top">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[7.5pt] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            {item.legal || item.clause || `Item ${idx + 1}`}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium align-top leading-tight">
                          {item.question}
                        </td>
                        <td className="p-2 text-center align-top">
                          {isConforme && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[7.5pt] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ CONFORME
                            </span>
                          )}
                          {isNoConforme && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[7.5pt] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              ✗ DESVÍO
                            </span>
                          )}
                          {isNA && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[7.5pt] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              • N/A
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-slate-600 text-[8pt] align-top">
                          {item.observation ? (
                            <span className={isNoConforme ? 'text-rose-700 font-semibold' : ''}>
                              {item.observation}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin observaciones</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* En caso de que no tenga checklist desglosado, mostrar bloque de hallazgos tradicional pero bien formateado */
          <div className="mb-[1.5rem] border border-slate-200 rounded-lg p-3 bg-white">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Hallazgos y Observaciones Detectadas</h4>
            <div className="text-[8.5pt] text-slate-800">
              <ReportContentRenderer content={data.findings || '✓ Se constató el cumplimiento general de las normativas de seguridad.\n✓ Uso de EPP conforme al nivel de riesgo.\n✓ No se detectaron desvíos críticos que supongan peligro inminente.'} isPrint={true} />
            </div>
          </div>
        )}

        {/* CUADRO DESTACADO DE NO CONFORMIDADES CRÍTICAS SI EXISTEN */}
        {nonConformitiesList.length > 0 && (
          <div className="mb-[1.5rem] p-3 rounded-lg border-l-4 border-rose-600 bg-rose-50 avoid-break shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon size={16} className="text-rose-600" />
              <span className="text-xs font-black uppercase text-rose-900 tracking-wider">
                DESVÍOS CRÍTICOS DETECTADOS (PLAN DE ACCIÓN REQUERIDO)
              </span>
            </div>
            <ul className="m-0 pl-5 text-[8.5pt] text-rose-950 space-y-1">
              {nonConformitiesList.map((nc: any, idx: number) => (
                <li key={nc.id || idx}>
                  <strong>{nc.legal || `Requisito ${idx + 1}`}:</strong> {nc.question}
                  {nc.observation && <span className="block italic text-rose-800 mt-0.5">• Evidencia: {nc.observation}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reunión de Cierre y Conclusiones */}
        <div className="avoid-break border-l-4 border-blue-600 bg-blue-50/70 p-3.5 rounded-r-lg mb-[1.5rem]">
          <span className="text-[0.7rem] font-black text-blue-900 block mb-1 uppercase tracking-wider">
            MINUTA DE CIERRE Y CONCLUSIÓN TÉCNICA DEL AUDITOR
          </span>
          {data.closingMeeting?.participants && (
            <p className="text-[8pt] text-blue-950 font-bold mb-1.5">
              👥 Participantes de la reunión de cierre: <span className="font-normal">{data.closingMeeting.participants}</span>
            </p>
          )}
          <div className="text-[8.5pt] text-blue-950 leading-relaxed font-medium">
            <ReportContentRenderer content={data.closingMeeting?.conclusions || data.conclusion || 'La auditoría concluye que el establecimiento mantiene condiciones operativas con adecuada adhesión al Sistema de Gestión EHS, debiendo implementarse las acciones correctivas señaladas dentro de los plazos establecidos.'} isPrint={true} />
          </div>
        </div>

        {/* Firmas de Responsabilidad */}
        <div className="avoid-break mt-4">
          <PdfSignatures
            data={data}
            box1={!data.showSignatures || data.showSignatures.operator ? {
              title: 'PERSONA AUDITADA / RESPONSABLE',
              subtitle: 'Firma de Conformidad',
              signatureUrl: data.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={!data.showSignatures || data.showSignatures.professional ? {
              title: 'AUDITOR LÍDER / ESPECIALISTA',
              subtitle: (actName || 'Firma de Especialista').toUpperCase(),
              signatureUrl: actSignature,
              stampUrl: actStamp,
              isProfessional: true,
              license: actLic
            } : null}
            box3={!data.showSignatures || data.showSignatures.supervisor ? {
              title: 'SUPERVISIÓN / GERENCIA',
              subtitle: 'Aprobación de Informe',
              signatureUrl: data.supervisorSignature || null,
              isProfessional: false
            } : null}
          />
        </div>

        <PdfBrandingFooter />

        {/* Pie de página legal */}
        <div className="w-full text-center text-[7pt] text-slate-400 mt-4 font-medium border-t border-slate-200 pt-2">
          Documento generado por Asistente de Higiene y Seguridad • Conforme a Directrices ISO 19011 e ISO 45001:2018
        </div>
      </div>
    </div>
  );
}