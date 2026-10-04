import React from 'react';
import { MessageSquare, Building2, MapPin, Calendar, User, Users, Briefcase, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import ReportContentRenderer from './reports/ReportContentRenderer';

interface Attendee {
  id: string;
  nombre: string;
  dni: string;
  firma: boolean;
}

interface ToolboxTalkData {
  fecha: string;
  empresa: string;
  area: string;
  responsable: string;
  cargoResponsable: string;
  tema: string;
  desarrollo: string;
  observaciones: string;
  asistentes: Attendee[];
  operatorSignature?: string;
  signature?: string;
  supervisorSignature?: string;
  showSignatures?: { operator: boolean; professional: boolean; supervisor: boolean };
  [key: string]: any;
}

interface ProfessionalData {
  name: string;
  license: string;
  signature: string | null;
  stamp: string | null;
}

interface Props {
  data: ToolboxTalkData;
  professional: ProfessionalData;
  customId?: string;
}

export default function ToolboxTalkPdfGenerator({ data, professional, customId }: Props) {
  if (!data) return null;

  // Obtención segura de firma profesional desde localStorage
  let actSignature = (data as any).professionalSignature || (data as any).signature || (data as any).auditorSignature || null;
  let actStamp = (data as any).professionalStamp || null;
  let actName = (data as any).professionalName || (data as any).responsable || (data as any).expositor || null;
  let actLic = (data as any).professionalLicense || (data as any).license || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;

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

  const validAttendees = Array.isArray(data.asistentes) ? data.asistentes.filter((a) => a && a.nombre) : [];
  const signedCount = validAttendees.filter((a) => a.firma).length;

  // Rellenar filas vacías para que la planilla se vea profesional y completa (mínimo 6 filas)
  const filledAttendees = [
    ...validAttendees,
    ...Array(Math.max(0, 6 - validAttendees.length)).fill({ id: '', nombre: '', dni: '', firma: false })
  ].slice(0, 30);

  return (
    <div className="w-[100%] flex justify-center">
      <div
        id={customId || "pdf-content"}
        className="pdf-container print-area p-[10mm_12mm] font-family-[system-ui,_-apple-system,_sans-serif] bg-[#ffffff] text-[#1e293b] w-[100%] max-w-[210mm] min-h-[297mm] box-sizing-[border-box] relative border-top-[12px_solid_#0284c7] text-[9pt]"
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
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0 !important;
              width: 100% !important; 
              max-width: none !important;
              border-top: 12px solid #0284c7 !important; 
              border-radius: 0 !important;
              min-height: auto !important; 
              height: auto !important;
            }
            .striped-row:nth-child(even) { background-color: #f8fafc; }
            
            /* Preservación de renglones y párrafos */
            .report-content-renderer p {
              margin-top: 0 !important;
              margin-bottom: 0.65rem !important;
              min-height: 1.25em !important;
              line-height: 1.55 !important;
            }
            .report-content-renderer p:empty,
            .report-content-renderer p > br:only-child {
              display: inline-block !important;
              min-height: 1.25em !important;
              content: "" !important;
            }
            
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .talk-attendees-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}
        </style>

        {/* Encabezado Oficial */}
        <div className="flex flex-row justify-between items-center border-bottom-[3px_solid_#0f172a] pb-[0.8rem] mb-[1rem] w-[100%]">
          <div className="flex-[1] text-left">
            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
            <p className="m-[0] font-[900] text-[0.85rem] uppercase text-[#0284c7]">Capacitación Operativa / Inducción</p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-[0] font-[900] text-[2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">
              CHARLA DE 5'
            </h1>
            <div className="mt-[0.25rem] bg-[#0f172a] text-[white] p-[0.2rem_0.8rem] rounded-full text-[0.62rem] font-[800] letter-spacing-[0.1em]">
              CONSTANCIA DE CAPACITACIÓN DIARIA
            </div>
          </div>

          <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
            <CompanyLogo style={{ maxHeight: '40px', maxWidth: '125px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* BLOQUE DE METADATOS COMPLETO (Tema, Empresa, Área, Fecha, Expositor) */}
        <div className="border border-slate-300 rounded-lg mb-[1rem] overflow-hidden shadow-sm">
          {/* Título de la Charla */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <span className="text-[0.65rem] font-extrabold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} /> TEMA TRATADO EN LA CHARLA
            </span>
            <div className="text-base font-black text-slate-900 mt-1">
              {data.tema ? data.tema.toUpperCase() : 'CHARLA GENERAL DE HIGIENE Y SEGURIDAD'}
            </div>
          </div>

          {/* Datos Operativos */}
          <div className="flex flex-wrap bg-white text-[8.5pt]">
            <div className="flex-1 min-w-[130px] p-2.5 border-r border-slate-200">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Building2 size={11} className="text-sky-600" /> Empresa
              </span>
              <div className="font-extrabold text-slate-800 mt-0.5">{data.empresa || '-'}</div>
            </div>

            <div className="flex-1 min-w-[130px] p-2.5 border-r border-slate-200">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={11} className="text-sky-600" /> Área / Sector
              </span>
              <div className="font-extrabold text-slate-800 mt-0.5">{data.area || 'General / Operativa'}</div>
            </div>

            <div className="flex-1 min-w-[130px] p-2.5 border-r border-slate-200">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Calendar size={11} className="text-sky-600" /> Fecha
              </span>
              <div className="font-extrabold text-slate-800 mt-0.5">
                {data.fecha ? new Date(data.fecha + 'T12:00').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
              </div>
            </div>

            <div className="flex-1 min-w-[140px] p-2.5">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1">
                <User size={11} className="text-sky-600" /> Responsable / Expositor
              </span>
              <div className="font-extrabold text-slate-800 mt-0.5">
                {data.responsable || actName || 'Especialista EHS'}
                {data.cargoResponsable ? ` (${data.cargoResponsable})` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Desarrollo / Puntos Tratados con ReportContentRenderer */}
        {data.desarrollo && (
          <div className="mb-[1rem] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-700" />
              <span className="text-[0.65rem] font-black text-slate-800 uppercase tracking-wider">
                CONTENIDOS Y MEDIDAS PREVENTIVAS EXPLICADAS AL PERSONAL
              </span>
            </div>
            <div className="p-3 text-[8.5pt] text-slate-800 leading-relaxed bg-white">
              <ReportContentRenderer content={data.desarrollo} isPrint={true} />
            </div>
          </div>
        )}

        {/* Tabla de Asistentes y Firmas */}
        <div className="mb-[1rem]">
          <div className="flex items-center justify-between mb-1.5 avoid-break">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-sky-600" />
              <span className="text-[0.65rem] font-black text-slate-800 uppercase tracking-wider">
                NÓMINA DE ASISTENCIA Y CONSTANCIA DE FIRMA DEL PERSONAL
              </span>
            </div>
            <span className="text-[0.65rem] font-bold text-slate-500">
              Total participantes: <strong>{validAttendees.length}</strong> • Firmados: <strong>{signedCount}</strong>
            </span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-[8pt] talk-attendees-table">
              <thead>
                <tr className="bg-slate-900 text-white text-left font-bold">
                  <th className="p-2 w-[6%] text-center border-r border-slate-800">N°</th>
                  <th className="p-2 w-[46%] border-r border-slate-800">Nombre y Apellido</th>
                  <th className="p-2 w-[22%] text-center border-r border-slate-800">DNI / CUIL</th>
                  <th className="p-2 w-[26%] text-center">Firma del Trabajador</th>
                </tr>
              </thead>
              <tbody>
                {filledAttendees.map((att, idx) => (
                  <tr key={att.id || idx} className="border-b border-slate-200 striped-row">
                    <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-bold text-slate-800 border-r border-slate-200">
                      {att.nombre || ''}
                    </td>
                    <td className="p-2 text-center text-slate-600 font-mono border-r border-slate-200">
                      {att.dni || ''}
                    </td>
                    <td className="p-2 text-center">
                      {att.firma ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7pt] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 size={10} /> FIRMADO DIGITAL
                        </span>
                      ) : (
                        <div className="border-b border-dashed border-slate-300 w-4/5 mx-auto my-1"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones y Compromisos con ReportContentRenderer */}
        {data.observaciones && (
          <div className="mb-[1rem] bg-amber-50 border border-amber-200 rounded-lg overflow-hidden avoid-break shadow-sm">
            <div className="p-2 bg-amber-100/70 border-b border-amber-200 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-800" />
              <span className="text-[0.65rem] font-black text-amber-900 uppercase tracking-wider">
                OBSERVACIONES, DUDAS PLANTEADAS Y COMPROMISOS OPERATIVOS
              </span>
            </div>
            <div className="p-2.5 text-[8pt] text-amber-950 leading-relaxed bg-amber-50">
              <ReportContentRenderer content={data.observaciones} isPrint={true} />
            </div>
          </div>
        )}

        {/* Firmas de Responsabilidad */}
        <div className="avoid-break mt-3">
          <PdfSignatures
            data={data}
            box1={(data as any).showSignatures?.operator ? {
              title: 'DELEGADO / OPERADOR',
              subtitle: 'En representación de asistentes',
              signatureUrl: (data as any).operatorSignature || null,
              isProfessional: false
            } : null}
            box2={(data as any).showSignatures?.professional !== false ? {
              title: 'RESPONSABLE / EXPOSITOR',
              subtitle: (actName || 'Firma de Expositor').toUpperCase(),
              signatureUrl: (data as any).signature || actSignature || null,
              stampUrl: (data as any).professionalStamp || actStamp || null,
              isProfessional: true,
              license: (data as any).professionalLicense || actLic || null
            } : null}
            box3={(data as any).showSignatures?.supervisor ? {
              title: 'SUPERVISIÓN / VERIFICADOR',
              subtitle: 'Cierre / Control de Charla',
              signatureUrl: (data as any).supervisorSignature || null,
              isProfessional: false
            } : null} 
          />
        </div>

        <PdfBrandingFooter />

        {/* Pie de página legal */}
        <div className="w-full text-center text-[7pt] text-slate-400 mt-3 font-medium border-t border-slate-200 pt-1.5">
          Constancia oficial de capacitación diaria • Cumplimiento Ley 19.587 Dec. 351/79 y Directrices OIT / ISO 45001
        </div>
      </div>
    </div>
  );
}