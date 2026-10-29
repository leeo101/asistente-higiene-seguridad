import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, User, Calendar, MapPin, ShieldCheck, Flag, CheckSquare, XSquare, AlertOctagon, HelpCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import DualPdfHeader from './DualPdfHeader';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';

export default function AuditPdf({ data, customId }: { data: any; customId?: string }): React.ReactElement | null {
  if (!data) return null;

  // Obtención segura de firma desde personalData o del dato en sí
  let actSignature = data.signature || null;
  let actName = data.professionalName || data.auditor || data.leadAuditor || null;
  let actLic = data.license || data.professionalLicense || null;
  let actStamp = data.professionalStamp || null;
  let actTitle = data.auditorRole || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (typeof window !== 'undefined') {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData') || localStorage.getItem('signature_stamp_data');
      const legacySig = localStorage.getItem('capturedSignature') || localStorage.getItem('digital_signature');

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!actSignature) actSignature = parsed.signature;
        if (!actStamp) actStamp = parsed.stamp;
      } else if (legacySig && !actSignature) {
        actSignature = legacySig;
      }

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name || pd.fullName;
        actLic = actLic || pd.license || pd.matricula;
        if (!actTitle) {
          const prof = pd.profession || pd.profesion || '';
          actTitle = (prof.toLowerCase().includes('técnico') || prof.toLowerCase().includes('tecnico'))
            ? 'Técnico en Higiene y Seguridad'
            : 'Profesional de Higiene y Seguridad';
        }
      }
    } catch (e) {}
  }

  // Título oficial: Solo "Profesional de Higiene y Seguridad" o "Técnico en Higiene y Seguridad"
  const rawRole = (data.auditorRole || actTitle || '').toLowerCase();
  const finalRoleTitle = (rawRole.includes('técnico') || rawRole.includes('tecnico'))
    ? 'TÉCNICO EN HIGIENE Y SEGURIDAD'
    : 'PROFESIONAL DE HIGIENE Y SEGURIDAD';

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
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[6mm_10mm] bg-[#ffffff] text-[#1e293b] box-shadow-none rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[system-ui,_-apple-system,_sans-serif] border-t-4 border-blue-600"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 6mm 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              font-family: system-ui, -apple-system, sans-serif; 
              background: white !important; 
            }
            .no-print, .module-form-layout, .module-form-toolbar, .module-action-bar, nav, aside, .sidebar { 
              display: none !important; 
            }
            .dual-pdf-header {
              display: block !important;
              visibility: visible !important;
            }
            .print-area {
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border-top: 4px solid #2563eb !important; 
              border-radius: 0 !important; 
              min-height: 0 !important; 
              height: auto !important; 
              max-height: none !important;
            }
            .striped-row:nth-child(even) { background-color: #f8fafc; }
            
            /* Preservación de renglones y párrafos */
            .report-content-renderer p {
              margin-top: 0 !important;
              margin-bottom: 0.4rem !important;
              min-height: 1.2em !important;
              line-height: 1.4 !important;
            }
            .report-content-renderer p:empty,
            .report-content-renderer p > br:only-child {
              display: inline-block !important;
              min-height: 1.2em !important;
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

        {/* Encabezado Principal Institucional con Logos Centrados */}
        <DualPdfHeader
          title="INFORME OFICIAL DE AUDITORÍA EHS"
          subtitle="Dictamen de Cumplimiento Legal y Verificación Técnica según ISO 45001 / ISO 19011"
          normBadge={`ISO 45001:2018 · ${auditTypeLabel.toUpperCase()}`}
          normBadgeColor="blue"
          normBadgeIcon={<ClipboardCheck size={12} />}
          documentId={data.id || (data.assessmentNumber || 'AUD-ISO-45001')}
          establishmentName={data.facilityName || data.location || 'Establecimiento Operativo'}
          date={data.date ? new Date(data.date).toLocaleDateString('es-AR') : (data.scheduledDate ? new Date(data.scheduledDate).toLocaleDateString('es-AR') : undefined)}
          className="mb-4"
        />

        {/* Aspecto Evaluado y Metadatos de la Auditoría */}
        <div className="border border-slate-300 rounded-lg mb-2.5 w-full overflow-hidden shadow-xs text-slate-900">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[6.5pt] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <Flag size={12} /> PROCESO AUDITADO
            </span>
            <span className="text-[6.5pt] font-mono text-slate-500 font-bold">
              ID: {data.id || (data.assessmentNumber || 'AUD-ISO-45001')}
            </span>
          </div>
          <div className="px-3 py-1 bg-white">
            <div className="font-extrabold text-[10.5pt] text-slate-900 leading-tight">
              {data.auditTitle || data.title || 'Auditoría General de Higiene y Seguridad'}
            </div>
          </div>
          
          <div className="grid grid-cols-3 border-t border-slate-200 bg-slate-50/50 text-[7.2pt]">
            <div className="p-1 px-3 border-r border-slate-200">
              <span className="text-[5.8pt] font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={9} className="text-blue-600" /> FECHA</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {data.date ? new Date(data.date).toLocaleDateString('es-AR') : (data.scheduledDate || '-')}
              </div>
            </div>
            <div className="p-1 px-3 border-r border-slate-200">
              <span className="text-[5.8pt] font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={9} className="text-blue-600" /> PLANTA / SECTOR</span>
              <div className="font-bold text-slate-900 mt-0.5 truncate">{data.location || 'Sede Principal'}</div>
            </div>
            <div className="p-1 px-3">
              <span className="text-[5.8pt] font-bold text-slate-500 uppercase flex items-center gap-1">
                <User size={9} className="text-blue-600" /> {finalRoleTitle}
              </span>
              <div className="font-bold text-slate-900 mt-0.5 truncate">{actName || 'Especialista EHS'}</div>
            </div>
          </div>
        </div>

        {/* Panel de Métricas Cuantitativas de Desempeño */}
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <span className="text-[5.8pt] font-bold text-slate-500 uppercase tracking-wider block">Ítems Evaluados</span>
            <span className="text-sm font-black text-slate-800">{totalItems || evaluatedItems || 10}</span>
          </div>

          <div className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
            <span className="text-[5.8pt] font-bold text-emerald-700 uppercase tracking-wider block">Conformidades</span>
            <span className="text-sm font-black text-emerald-600">
              {totalItems > 0 ? conformitiesCount : (data.conformities || 10)}
            </span>
          </div>

          <div className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-center">
            <span className="text-[5.8pt] font-bold text-rose-700 uppercase tracking-wider block">No Conformidades</span>
            <span className="text-sm font-black text-rose-600">
              {totalItems > 0 ? nonConformitiesCount : (data.nonConformities || 0)}
            </span>
          </div>

          <div className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-center">
            <span className="text-[5.8pt] font-bold text-blue-700 uppercase tracking-wider block">Cumplimiento Global</span>
            <span className="text-sm font-black text-blue-600">{complianceRate}%</span>
          </div>
        </div>

        {/* Objetivo y Alcance */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="border border-slate-200 p-2 rounded-lg bg-white">
            <span className="text-[5.8pt] font-black text-slate-500 uppercase block mb-0.5 border-b border-slate-100 pb-0.5">
              OBJETIVO DE LA AUDITORÍA
            </span>
            <div className="text-[7pt] text-slate-700 leading-snug">
              <ReportContentRenderer content={data.objective || 'Verificar el grado de cumplimiento de los procedimientos internos de Higiene, Seguridad y Medio Ambiente, y los requisitos legales obligatorios aplicables a la operación.'} isPrint={true} />
            </div>
          </div>

          <div className="border border-slate-200 p-2 rounded-lg bg-white">
            <span className="text-[5.8pt] font-black text-slate-500 uppercase block mb-0.5 border-b border-slate-100 pb-0.5">
              ALCANCE Y METODOLOGÍA
            </span>
            <div className="text-[7pt] text-slate-700 leading-snug">
              <ReportContentRenderer content={data.scope || 'Observación técnica directa en puestos de trabajo, entrevistas a operarios/supervisores y examen de registros documentales del Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST).'} isPrint={true} />
            </div>
          </div>
        </div>

        {/* TABLA OFICIAL DE RESULTADOS DEL CHECKLIST AUDITADO */}
        {checklist.length > 0 ? (
          <div className="mb-2.5">
            <div className="flex items-center gap-1.5 mb-1.5 pb-0.5 border-b-2 border-slate-800 avoid-break">
              <div className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></div>
              <h3 className="text-[7.5pt] font-black text-slate-900 uppercase tracking-wider m-0">
                RELEVAMIENTO TÉCNICO DETALLADO (CHECKLIST DE CUMPLIMIENTO)
              </h3>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs w-full">
              <table style={{ tableLayout: 'fixed', width: '100%', boxSizing: 'border-box' }} className="border-collapse text-[7.5pt] audit-table w-full">
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '44%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '22%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-900 text-white text-left font-bold text-[7pt]">
                    <th style={{ padding: '4px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>Norma / Ref. Legal</th>
                    <th style={{ padding: '4px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>Aspecto / Requisito Auditado</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', wordBreak: 'break-word', overflowWrap: 'break-word' }}>Dictamen</th>
                    <th style={{ padding: '4px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>Observación / Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.map((item: any, idx: number) => {
                    const isConforme = item.status === 'si';
                    const isNoConforme = item.status === 'no';
                    const isNA = item.status === 'na';

                    return (
                      <tr key={item.id || idx} className="border-b border-slate-200 striped-row">
                        <td style={{ padding: '3.5px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }} className="font-bold text-slate-800 align-top">
                          <span className="inline-block px-1 py-0.2 rounded text-[6.5pt] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            {item.legal || item.clause || `Item ${idx + 1}`}
                          </span>
                        </td>
                        <td style={{ padding: '3.5px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }} className="text-slate-700 font-medium align-top leading-tight text-[7.2pt]">
                          {item.question}
                        </td>
                        <td style={{ padding: '3.5px 6px', textAlign: 'center', wordBreak: 'break-word' }} className="align-top">
                          {isConforme && (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[6.2pt] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ CONFORME
                            </span>
                          )}
                          {isNoConforme && (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[6.2pt] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              ✗ DESVÍO
                            </span>
                          )}
                          {isNA && (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[6.2pt] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              • N/A
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '3.5px 6px', wordBreak: 'break-word', overflowWrap: 'break-word' }} className="text-slate-600 text-[7pt] align-top">
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
        <div className="avoid-break border-l-4 border-blue-600 bg-blue-50/70 p-2.5 rounded-r-lg mb-2.5">
          <span className="text-[6.5pt] font-black text-blue-900 block mb-0.5 uppercase tracking-wider">
            MINUTA DE CIERRE Y CONCLUSIÓN TÉCNICA DEL AUDITOR
          </span>
          {data.closingMeeting?.participants && (
            <p className="text-[6.8pt] text-blue-950 font-bold mb-1">
              👥 Participantes del cierre: <span className="font-normal">{data.closingMeeting.participants}</span>
            </p>
          )}
          <div className="text-[7.2pt] text-blue-950 leading-relaxed font-medium">
            <ReportContentRenderer content={data.closingMeeting?.conclusions || data.conclusion || 'La auditoría concluye que el establecimiento mantiene condiciones operativas con adecuada adhesión al Sistema de Gestión EHS, debiendo implementarse las acciones correctivas señaladas dentro de los plazos establecidos.'} isPrint={true} />
          </div>
        </div>

        {/* Firmas de Responsabilidad */}
        <div className="avoid-break mt-2">
          <PdfSignatures
            compact={true}
            hideFooter={true}
            data={data}
            box1={!data.showSignatures || data.showSignatures.operator ? {
              title: 'PERSONA AUDITADA / RESPONSABLE',
              subtitle: 'Firma de Conformidad',
              signatureUrl: data.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={!data.showSignatures || data.showSignatures.professional ? {
              title: finalRoleTitle,
              subtitle: (actName || 'Firma y Sello').toUpperCase(),
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