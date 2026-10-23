import React from 'react';
import { Building2, MapPin, Calendar, UserCheck, AlertTriangle, GraduationCap, PackageCheck, ClipboardCheck, Info } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import { safeJsonParse } from '../utils/storageHelper';
import { formatProfessionTitle, DEFAULT_PROFESSION } from '../data/professionOptions';
import { formatDisplayDate } from '../utils/dateHelper';
import PdfBrandingFooter from './PdfBrandingFooter';
import ReportContentRenderer from './reports/ReportContentRenderer';

export default function ProfessionalReportPdfGenerator({ currentReport, customId }: { currentReport: any; customId?: string }): React.ReactElement | null {
  if (!currentReport) return null;

  const report = currentReport;

  const savedData = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
  const parsedPersonal = savedData ? safeJsonParse<any>(savedData, {}) : {};
  const userCountry = parsedPersonal.country || 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  // Nombre, matrícula y título del profesional actuante
  const proName = (report.responsable || report.professionalName || parsedPersonal.name || 'Profesional Actuante').toUpperCase();
  const rawTitle = report.professionalTitle || report.profession || parsedPersonal.profession || DEFAULT_PROFESSION;
  const proTitle = formatProfessionTitle(rawTitle).toUpperCase();
  const proLicense = report.professionalLicense || report.license || parsedPersonal.license;

  const hasExtraFields = report.extraFields && Object.keys(report.extraFields).some(k => report.extraFields[k] && String(report.extraFields[k]).trim() !== '');

  // Plantilla visual y etiqueta
  const templateLabels: Record<string, { label: string; badge: string; color: string }> = {
    general: { label: 'INFORME TÉCNICO DE SEGURIDAD', badge: 'RELEVAMIENTO GENERAL', color: '#0284c7' },
    accident: { label: 'INFORME DE INVESTIGACIÓN DE ACCIDENTE', badge: 'ÁRBOL DE CAUSAS & CONTROL', color: '#dc2626' },
    training: { label: 'REGISTRO OFICIAL DE CAPACITACIÓN', badge: 'FORMACIÓN CONTINUA ISO 45001', color: '#059669' },
    rgrl: { label: 'PROTOCOLO RGRL - RELEVAMIENTO DE RIESGOS', badge: 'RES. SRT 463/09', color: '#d97706' },
    epp: { label: 'CONSTANCIA DE ENTREGA DE EPP', badge: 'RES. SRT 299/11', color: '#7c3aed' }
  };

  const tplInfo = templateLabels[report.template] || templateLabels.general;

  return (
    <div className="w-[100%] flex justify-center">
      <div
        id={customId || "pdf-content"}
        data-orientation="portrait"
        className="pdf-container print-area border-none shadow-none w-[100%] max-w-[210mm] min-h-[297mm] p-[10mm_15mm] bg-[#ffffff] text-[#1e293b] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 5mm !important; 
              width: 100% !important; 
              max-width: none !important; 
              border: none !important;
              border-radius: 0 !important; 
            }
            .company-logo {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .striped-row:nth-child(even) { background-color: #f8fafc; }
            
            /* Preservación estricta de saltos de renglón y separación de párrafos en impresión */
            .report-content-renderer {
              white-space: pre-wrap !important;
              word-break: normal !important;
              overflow-wrap: break-word !important;
              line-height: 1.65 !important;
            }
            .report-content-renderer p {
              margin-top: 0 !important;
              margin-bottom: 0.85rem !important;
              min-height: 1.5em !important;
              line-height: 1.65 !important;
              white-space: pre-wrap !important;
              word-break: normal !important;
              overflow-wrap: break-word !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
              orphans: 2 !important;
              widows: 2 !important;
            }
            .report-content-renderer p:empty,
            .report-content-renderer p > br:only-child {
              display: block !important;
              min-height: 1.5em !important;
            }
            .report-content-renderer h1,
            .report-content-renderer h2,
            .report-content-renderer h3,
            .report-content-renderer h4 {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .report-development-box {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: transparent !important;
            }
          `}
        </style>

        {/* Header Rediseñado con Logo y Título Oficial */}
        <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex-[1] pr-4">
            <div 
              style={{ backgroundColor: tplInfo.color }}
              className="inline-block text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full mb-2"
            >
              {tplInfo.badge}
            </div>
            <h1 className="m-0 text-slate-900 text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase">
              {tplInfo.label}
            </h1>
            <p className="m-0 mt-1 text-base font-bold text-slate-700">
              {report.title || 'Informe Técnico Profesional de Higiene y Seguridad'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="h-[55px] flex items-center justify-end">
              <CompanyLogo style={{ maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Metadata Grid Rediseñada y Completa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-300">
          <div className="border-r border-slate-200 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 size={14} className="text-sky-600 shrink-0" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Empresa / Cliente</span>
            </div>
            <p className="m-0 font-black text-xs text-slate-900 break-words leading-snug">{report.company || '-'}</p>
          </div>

          <div className="border-r-0 sm:border-r border-slate-200 sm:pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={14} className="text-sky-600 shrink-0" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Ubicación / Planta</span>
            </div>
            <p className="m-0 font-black text-xs text-slate-900 break-words leading-snug">{report.location || 'Sede Operativa'}</p>
          </div>

          <div className="border-r border-slate-200 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={14} className="text-sky-600 shrink-0" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Fecha Relevamiento</span>
            </div>
            <p className="m-0 font-black text-xs text-slate-900">
              {formatDisplayDate(report.date || report.createdAt)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Profesional H&S</span>
            </div>
            <p className="m-0 font-black text-xs text-slate-900 break-words leading-snug">{proName}</p>
          </div>
        </div>

        {/* SECCIÓN DE DETALLE ESPECÍFICO (EXTRA FIELDS) - GARANTIZA QUE SALGAN AL IMPRIMIR */}
        {hasExtraFields && (
          <div className="mb-6 avoid-break">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-5 bg-amber-500 rounded-sm"></div>
              <h3 className="m-0 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck size={16} className="text-amber-600" />
                Detalle y Parámetros del Relevamiento
              </h3>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {report.extraFields.topic && (
                <div>
                  <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Tema de Capacitación</span>
                  <span className="font-black text-xs text-slate-900">{report.extraFields.topic}</span>
                </div>
              )}
              {report.extraFields.duration && (
                <div>
                  <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Duración</span>
                  <span className="font-black text-xs text-slate-900">{report.extraFields.duration} minutos</span>
                </div>
              )}
              {report.extraFields.eventTime && (
                <div>
                  <span className="block text-[10px] font-extrabold text-red-800 uppercase tracking-wider">Hora del Evento</span>
                  <span className="font-black text-xs text-slate-900">{report.extraFields.eventTime} hs</span>
                </div>
              )}
              {report.extraFields.affectedPerson && (
                <div>
                  <span className="block text-[10px] font-extrabold text-red-800 uppercase tracking-wider">Trabajador Afectado</span>
                  <span className="font-black text-xs text-slate-900">{report.extraFields.affectedPerson}</span>
                </div>
              )}
              {report.extraFields.jobRole && (
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Puesto / Tarea</span>
                  <span className="font-bold text-xs text-slate-900">{report.extraFields.jobRole}</span>
                </div>
              )}
              {report.extraFields.eppType && (
                <div>
                  <span className="block text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">Elementos de Protección Entregados</span>
                  <span className="font-bold text-xs text-slate-900">{report.extraFields.eppType}</span>
                </div>
              )}
              {report.extraFields.eppNorm && (
                <div>
                  <span className="block text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">Certificación / Norma</span>
                  <span className="font-bold text-xs text-slate-900">{report.extraFields.eppNorm}</span>
                </div>
              )}
              {report.extraFields.rgrlNorm && (
                <div>
                  <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Marco Normativo</span>
                  <span className="font-bold text-xs text-slate-900">{report.extraFields.rgrlNorm}</span>
                </div>
              )}
              {/* Cualquier otro campo extra */}
              {Object.entries(report.extraFields).map(([key, val]) => {
                if (['topic', 'duration', 'eventTime', 'affectedPerson', 'jobRole', 'eppType', 'eppNorm', 'rgrlNorm'].includes(key) || !val) {
                  return null;
                }
                return (
                  <div key={key}>
                    <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">{key}</span>
                    <span className="font-bold text-xs text-slate-900">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contenido Principal y Desarrollo del Informe */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2.5 avoid-break">
            <div className="w-2 h-5 bg-sky-600 rounded-sm"></div>
            <h3 className="m-0 text-slate-900 font-black text-xs uppercase tracking-wider">
              Desarrollo Técnico y Observaciones
            </h3>
          </div>
          <div className="report-development-box p-0 bg-transparent border-none shadow-none">
            <ReportContentRenderer content={report.content} isPrint={true} />
          </div>
        </div>

        {/* Registro Fotográfico si existen fotos */}
        {report.photos && report.photos.length > 0 && (
          <div className="mb-6 avoid-break">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-5 bg-sky-600 rounded-sm"></div>
              <h3 className="m-0 text-slate-900 font-black text-xs uppercase tracking-wider">
                Registro Fotográfico de Evidencias ({report.photos.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {report.photos.map((photo: any, index: number) => (
                <div key={photo.id || index} className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 p-2 avoid-break break-inside-avoid shadow-xs">
                  <img 
                    src={photo.url || photo} 
                    alt={`Evidencia ${index + 1}`} 
                    className="w-full h-44 object-cover rounded-lg border border-slate-200" 
                  />
                  {photo.description && (
                    <p className="mt-2 mb-0 text-[11px] text-slate-700 text-center font-bold">{photo.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Interviniente para Capacitación o Entrega de EPP */}
        {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 && (
          <div className="mb-6 avoid-break">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-5 bg-sky-600 rounded-sm"></div>
              <h3 className="m-0 text-slate-900 font-black text-xs uppercase tracking-wider">
                Nómina de Personal Interviniente y Firmas
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-2.5 text-left font-black w-2/5">Nombre y Apellido</th>
                    <th className="p-2.5 text-left font-black w-1/4">DNI / CUIL</th>
                    <th className="p-2.5 text-center font-black w-1/3">Firma del Trabajador</th>
                  </tr>
                </thead>
                <tbody>
                  {report.personnel.map((p: any, idx: number) => (
                    <tr className="avoid-break striped-row border-b border-slate-200" key={p.id || idx}>
                      <td className="p-2.5 text-slate-900 font-bold">{p.name || '-'}</td>
                      <td className="p-2.5 text-slate-700 font-semibold">{p.dni || '-'}</td>
                      <td className="p-2.5 h-12 align-bottom text-center">
                        <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOQUE UNIFICADO DE FIRMAS, VERIFICACIÓN Y AVISO LEGAL (INDIVISIBLE) */}
        <div 
          className="avoid-break avoid-break-strictly break-inside-avoid mt-6"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <PdfSignatures 
            data={{
              ...report,
              professionalName: proName,
              responsable: proName,
              professionalTitle: proTitle,
              profession: proTitle,
              professionalLicense: proLicense,
              professionalSignature: report.signature || report.professionalSignature,
              professionalStamp: report.stamp || report.professionalStamp
            }} 
          />
          <PdfBrandingFooter />
          <div className="w-full text-center text-[10px] text-slate-500 mt-4 font-semibold border-t border-slate-300 pt-2">
            Documento generado por Asistente de Higiene y Seguridad • Conforme a {countryNorms.general} • Auditoría ISO 45001
          </div>
        </div>
      </div>
    </div>
  );
}
