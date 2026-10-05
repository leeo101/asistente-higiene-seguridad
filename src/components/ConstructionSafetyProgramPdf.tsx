import React from 'react';
import { HardHat, ShieldCheck, Building, Calendar, Users, MapPin, AlertTriangle, Phone, CheckCircle2 } from 'lucide-react';
import { ConstructionProgramData } from '../data/constructionSafetyData';
import ReportContentRenderer from './reports/ReportContentRenderer';
import PdfBrandingFooter from './PdfBrandingFooter';

interface ConstructionSafetyProgramPdfProps {
  data: ConstructionProgramData;
  customId?: string;
  professionalName?: string;
}

export default function ConstructionSafetyProgramPdf({
  data,
  customId = 'construction-program-pdf',
  professionalName
}: ConstructionSafetyProgramPdfProps) {
  const activeStages = (data.stages || []).filter(s => s.included);
  const responsiblePro = professionalName || data.hygieneService?.professionalName || 'Profesional H&S';
  const enrollment = data.hygieneService?.enrollmentNumber || 'A designar';

  const reasonsList: string[] = [];
  if (data.reasons?.excavationDeep) reasonsList.push('Excavación a profundidad mayor a 1.20 metros (Art. 142 y conc. Dec. 911/96 & Res. SRT 550/11)');
  if (data.reasons?.heightWork) reasonsList.push('Trabajos en altura superiores a 4.00 metros con riesgo de caída (Art. 43 y conc. Dec. 911/96)');
  if (data.reasons?.demolition) reasonsList.push('Tareas de demolición de muros o estructuras existentes (Art. 138 Dec. 911/96)');
  if (data.reasons?.largeSurface) reasonsList.push('Superficie cubierta de obra superior a los 1.000 m² (Res. SRT 51/97 Art. 2)');
  if (data.reasons?.highVoltage) reasonsList.push('Proximidad de líneas de media o alta tensión e instalaciones energizadas');
  if (data.reasons?.confinedSpacesOrTunnels) reasonsList.push('Túneles, galerías subterráneas o trabajos en espacios confinados');

  return (
    <div id={customId} className="bg-white text-slate-900 p-8 max-w-[210mm] mx-auto text-xs leading-relaxed font-sans shadow-none print:p-0">
      {/* ── Encabezado Institucional ── */}
      <div className="border-b-2 border-amber-600 pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <HardHat size={28} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Decreto 911/96 • Res. SRT 51/97 • Res. SRT 35/98 • Res. SRT 319/99
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 mb-0">
                PROGRAMA DE SEGURIDAD PARA LA CONSTRUCCIÓN
              </h1>
              <p className="text-xs text-slate-600 m-0">
                Legajo Oficial de Prevención de Riesgos Laborales para Presentación ante ART
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 border-l border-slate-200 pl-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Expediente / Programa</div>
            <div className="text-sm font-black text-amber-600 font-mono">{data.programNumber}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Fecha: {new Date(data.createdAt || Date.now()).toLocaleDateString('es-AR')}
            </div>
            <div className="mt-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                {data.status === 'approved_by_art' ? 'Aprobado ART' : data.status === 'submitted_to_art' ? 'Presentado ART' : 'Borrador Oficial'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. Sujetos Intervinientes y Datos de la Obra ── */}
      <div className="mb-6 break-inside-avoid">
        <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-t flex items-center gap-2">
          <Building size={14} className="text-amber-400" />
          <span>1. DATOS DE LA OBRA Y SUJETOS INTERVINIENTES</span>
        </div>
        <div className="border border-t-0 border-slate-300 rounded-b p-3 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Empresa Constructora / Contratista</span>
              <span className="font-bold text-slate-900 text-xs">{data.contractorName || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">CUIT Contratista</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{data.contractorCuit || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Aseguradora de Riesgos (ART)</span>
              <span className="font-bold text-slate-900 text-xs">{data.artName || 'A designar'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Comitente / Propietario</span>
              <span className="font-bold text-slate-900 text-xs">{data.comitenteName || '—'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Ubicación de la Obra</span>
              <span className="font-bold text-slate-900 text-xs">{data.siteAddress ? `${data.siteAddress}, ${data.city || ''} (${data.province || ''})` : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Tipo de Obra</span>
              <span className="font-bold text-slate-900 text-xs uppercase">{data.workType || 'Edificación'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Superficie Estimada</span>
              <span className="font-bold text-slate-900 text-xs">{data.siteSurfaceM2 ? `${data.siteSurfaceM2} m²` : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Personal Pico Previsto</span>
              <span className="font-bold text-slate-900 text-xs">{data.estimatedWorkers ? `${data.estimatedWorkers} operarios` : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Inicio</span>
              <span className="font-bold text-slate-900 text-xs">{data.startDate || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Plazo Estimado</span>
              <span className="font-bold text-slate-900 text-xs">{data.estimatedDurationMonths ? `${data.estimatedDurationMonths} meses` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Causales de Exigibilidad de Programa (Res. SRT 51/97) ── */}
      <div className="mb-6 break-inside-avoid">
        <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-t flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400" />
          <span>2. CAUSALES DE EXIGIBILIDAD DEL PROGRAMA DE SEGURIDAD (RES. SRT 51/97)</span>
        </div>
        <div className="border border-t-0 border-slate-300 rounded-b p-3 bg-slate-50/50">
          <p className="text-[11px] text-slate-600 mb-2">
            La presente obra se encuadra formalmente bajo los requerimientos del Decreto 911/96 y la Resolución SRT 51/97 en virtud de las siguientes causales técnicas:
          </p>
          <div className="space-y-1.5">
            {reasonsList.length > 0 ? (
              reasonsList.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Obra de construcción civil e infraestructura comprendida en el marco del Decreto 911/96</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Servicio de Higiene y Seguridad Laboral en Obra ── */}
      <div className="mb-6 break-inside-avoid">
        <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-t flex items-center gap-2">
          <ShieldCheck size={14} className="text-amber-400" />
          <span>3. SERVICIO DE HIGIENE Y SEGURIDAD LABORAL EN OBRA (ART. 16 DEC. 911/96)</span>
        </div>
        <div className="border border-t-0 border-slate-300 rounded-b p-3 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Profesional Responsable</span>
              <span className="font-bold text-slate-900 text-xs">{responsiblePro}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Matrícula Profesional</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{enrollment}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Carga Horaria Semanal</span>
              <span className="font-bold text-slate-900 text-xs">{data.hygieneService?.weeklyVisitHours ? `${data.hygieneService.weeklyVisitHours} hs/semana en obra` : 'Según Art. 17 Dec. 911/96'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Centro Médico ART de Urgencia</span>
              <span className="font-bold text-slate-900 text-xs">{data.hygieneService?.emergencyClinic || 'Centro de derivación rápida ART'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Teléfono de Emergencias ART</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{data.hygieneService?.emergencyPhone || '0800-333-1234'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Matriz de Etapas Constructivas, Riesgos y Medidas Preventivas ── */}
      <div className="mb-6">
        <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-t flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HardHat size={14} className="text-amber-400" />
            4. ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS POR ETAPA CONSTRUCTIVA
          </span>
          <span className="text-[10px] text-amber-300 font-normal">
            {activeStages.length} etapas reglamentarias analizadas
          </span>
        </div>
        <div className="border border-t-0 border-slate-300 rounded-b overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2.5 w-[25%] border-r border-slate-300">Etapa Constructiva</th>
                <th className="p-2.5 w-[30%] border-r border-slate-300">Riesgos Identificados</th>
                <th className="p-2.5 w-[35%] border-r border-slate-300">Medidas Preventivas Obligatorias</th>
                <th className="p-2.5 w-[10%] text-center">Marco Legal</th>
              </tr>
            </thead>
            <tbody>
              {activeStages.length > 0 ? (
                activeStages.map((stage, idx) => (
                  <tr key={stage.id || idx} className={`border-b border-slate-200 break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="p-2.5 border-r border-slate-200 align-top font-bold text-slate-900">
                      <div>{stage.name}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 align-top text-slate-700">
                      {stage.risks && stage.risks.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 m-0">
                          {stage.risks.map((r, ri) => (
                            <li key={ri}>
                              <ReportContentRenderer content={r} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 align-top text-slate-700">
                      {stage.preventiveMeasures && stage.preventiveMeasures.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 m-0">
                          {stage.preventiveMeasures.map((m, mi) => (
                            <li key={mi}>
                              <ReportContentRenderer content={m} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="p-2.5 align-top text-center font-mono text-[10px] text-slate-600">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                        {stage.applicableStandards || 'Dec. 911/96'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                    No se han seleccionado etapas constructivas en este programa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Observaciones Técnicas y Compromiso de Cumplimiento ── */}
      {data.notes && (
        <div className="mb-6 break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-t">
            5. OBSERVACIONES TÉCNICAS Y COMPROMISO DE CUMPLIMIENTO
          </div>
          <div className="border border-t-0 border-slate-300 rounded-b p-3 bg-slate-50/50">
            <ReportContentRenderer content={data.notes} />
          </div>
        </div>
      )}

      {/* ── 6. Bloque Formal de 4 Firmas Reglamentarias ── */}
      <div className="mt-8 pt-4 border-t-2 border-slate-300 break-inside-avoid">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">
          SUSCRIPCIÓN Y CONFORMIDAD FORMAL (DECRETO 911/96 • RES. SRT 51/97)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="border-t border-slate-800 pt-2 flex flex-col items-center">
            <div className="h-12 w-full flex items-center justify-center text-slate-300 italic text-[10px]">
              Firma y Sello
            </div>
            <span className="font-bold text-[11px] text-slate-900">{responsiblePro}</span>
            <span className="text-[9px] text-slate-500 uppercase">Responsable Servicio HyS</span>
            <span className="text-[9px] text-slate-400 font-mono">Mat.: {enrollment}</span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex flex-col items-center">
            <div className="h-12 w-full flex items-center justify-center text-slate-300 italic text-[10px]">
              Firma y Sello
            </div>
            <span className="font-bold text-[11px] text-slate-900">{data.contractorName || 'Constructora'}</span>
            <span className="text-[9px] text-slate-500 uppercase">Representante Técnico / Jefe Obra</span>
            <span className="text-[9px] text-slate-400 font-mono">CUIT: {data.contractorCuit || '—'}</span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex flex-col items-center">
            <div className="h-12 w-full flex items-center justify-center text-slate-300 italic text-[10px]">
              Firma y Sello
            </div>
            <span className="font-bold text-[11px] text-slate-900">{data.comitenteName || 'Comitente'}</span>
            <span className="text-[9px] text-slate-500 uppercase">Comitente / Propietario</span>
            <span className="text-[9px] text-slate-400">Inspección de Obra</span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex flex-col items-center">
            <div className="h-12 w-full flex items-center justify-center text-slate-300 italic text-[10px]">
              Firma y Sello
            </div>
            <span className="font-bold text-[11px] text-slate-900">{data.artName || 'ART Asignada'}</span>
            <span className="text-[9px] text-slate-500 uppercase">Constancia Recepción ART</span>
            <span className="text-[9px] text-slate-400 font-mono">Res. SRT 51/97</span>
          </div>
        </div>
      </div>

      {/* ── Pie de Marca y Validez Legal ── */}
      <div className="mt-8">
        <PdfBrandingFooter
          documentId={data.programNumber}
          documentType="PROGRAMA DE SEGURIDAD EN CONSTRUCCIÓN (DEC. 911/96 & RES. SRT 51/97)"
          signedBy={responsiblePro}
        />
      </div>
    </div>
  );
}
