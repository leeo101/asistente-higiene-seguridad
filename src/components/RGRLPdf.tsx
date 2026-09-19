import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Building2, User, ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import type { RGRLSurvey } from '../types/rgrl';
import { calculateRGRLMetrics } from '../utils/rgrlEngine';

interface Props {
  data: RGRLSurvey;
}

export default function RGRLPdf({ data }: Props): React.ReactElement | null {
  if (!data) return null;

  const metrics = calculateRGRLMetrics(data.items || []);

  const annexTitle =
    data.anexo === 'anexo2_911'
      ? 'ANEXO I · CONSTRUCCIÓN (Res. SRT 529/09 — Dec. 911/96)'
      : data.anexo === 'anexo3_617'
      ? 'ANEXO I · ACTIVIDAD AGROPECUARIA (Res. SRT 74/10 — Dec. 617/97)'
      : 'ANEXO I · INDUSTRIA, COMERCIO Y SERVICIOS (Res. SRT 463/09 — Dec. 351/79)';

  // Firmas
  let actSignature: string | null = null;
  let actStamp: string | null = null;
  let actName: string | null = data.profesionalHySNombre || null;
  let actLic: string | null = data.profesionalHySMatricula || null;

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

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100 print:bg-white print:py-0">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 bg-white text-slate-900 shadow-xl rounded-2xl box-border mx-auto text-[9pt] font-sans print:shadow-none print:p-4 print:max-w-none print:rounded-none"
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
        <div className="w-full h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 rounded-t-lg mb-4"></div>

        {/* Encabezado Oficial SRT */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-950 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                SUPERINTENDENCIA DE RIESGOS DEL TRABAJO
              </span>
              <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                DECLARACIÓN JURADA ANUAL
              </span>
              <span className="bg-slate-800 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                LEY 19.587 / LEY 24.557
              </span>
            </div>
            <h1 className="m-0 text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              RELEVAMIENTO GENERAL DE RIESGOS LABORALES (R.G.R.L.)
            </h1>
            <div className="text-[10.5px] font-black text-blue-800 uppercase tracking-wide">
              {annexTitle}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <CompanyLogo style={{ maxHeight: '46px', maxWidth: '150px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">REGISTRO RGRL N°</div>
              <div className="text-xs font-black text-blue-700 font-mono">#{data.id ? data.id.slice(-8).toUpperCase() : 'S/N'}</div>
            </div>
          </div>
        </div>

        {/* Banner de Porcentaje de Cumplimiento */}
        <div className="p-3 rounded-xl border border-slate-300 bg-slate-50/80 mb-4 flex items-center justify-between shadow-2xs page-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl font-black text-2xl flex items-center justify-center min-w-[64px] border ${
                metrics.porcentajeCumplimiento >= 90
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : metrics.porcentajeCumplimiento >= 75
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {metrics.porcentajeCumplimiento}%
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                {metrics.porcentajeCumplimiento >= 90 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 inline" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600 inline" />
                )}
                NIVEL DE CUMPLIMIENTO NORMATIVO: <span className="underline">{metrics.estadoGeneral}</span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                <span className="font-bold text-emerald-800">{metrics.cumpleCount} CUMPLE</span> ·{' '}
                <span className="font-bold text-rose-800">{metrics.noCumpleCount} NO CUMPLE</span> ·{' '}
                <span className="font-bold text-slate-600">{metrics.noAplicaCount} NO APLICA</span> (Total:{' '}
                {metrics.totalItems} ítems evaluados | {metrics.evaluablesCount} evaluables)
              </div>
            </div>
          </div>
          <div className="text-right border-l border-slate-300 pl-4 text-[10px]">
            <span className="font-bold text-slate-500 block uppercase">FECHA DE RELEVAMIENTO</span>
            <span className="font-black text-slate-900 text-xs">
              {data.fechaRelevamiento ? new Date(data.fechaRelevamiento).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Datos de la Empresa y ART */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-4 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-400" /> 1. IDENTIFICACIÓN DEL ESTABLECIMIENTO Y ASEGURADORA (A.R.T.)
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-3 text-[10.5px]">
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Razón Social</span>
              <span className="font-black text-slate-900 truncate block">{data.razonSocial || 'No especificada'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">C.U.I.T. Patronal</span>
              <span className="font-mono font-bold text-slate-900 block">{data.cuit || 'No informado'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Aseguradora (ART)</span>
              <span className="font-black text-blue-700 block">{data.artNombre || 'Sin ART asignada'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">N° Contrato / Póliza</span>
              <span className="font-mono font-bold text-slate-900 block">{data.nroPoliza || 'S/N'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Establecimiento y Dirección</span>
              <span className="text-slate-800 font-semibold block truncate">
                {data.establecimientoNombre || 'Planta Principal'} — {data.direccion || 'S/D'}, {data.localidad} ({data.provincia})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Código CIIU / Actividad</span>
              <span className="text-slate-800 font-semibold block truncate">{data.ciiuActividad || 'Industrial'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Personal Ocupado</span>
              <span className="font-black text-slate-900 block">{data.cantidadTrabajadores || 0} operarios</span>
            </div>
          </div>
        </div>

        {/* Cuestionario RGRL */}
        <div className="mb-4">
          <div className="bg-slate-800 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex justify-between items-center rounded-t-lg">
            <span>2. RELEVAMIENTO DE CUMPLIMIENTO NORMATIVO (PLANILLA OFICIAL S.R.T.)</span>
            <span className="text-[9px] font-bold opacity-90">SRT / LEY 19.587</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-300 uppercase tracking-wider text-[9px]">
                <th className="p-1.5 border border-slate-300 text-center w-12">Ítem</th>
                <th className="p-1.5 border border-slate-300 text-left">Exigencia Legal Relevada</th>
                <th className="p-1.5 border border-slate-300 text-left w-40">Normativa Aplicable</th>
                <th className="p-1.5 border border-slate-300 text-center w-24">Condición</th>
                <th className="p-1.5 border border-slate-300 text-left w-44">Observaciones / Desvíos</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((it, idx) => {
                  const isCumple = it.estado === 'CUMPLE';
                  const isNoCumple = it.estado === 'NO_CUMPLE';
                  return (
                    <tr key={it.id || idx} className={`border-b border-slate-200 page-break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-slate-800">{it.codigo}</td>
                      <td className="p-1.5 border border-slate-300 font-semibold text-slate-900 leading-snug">{it.pregunta}</td>
                      <td className="p-1.5 border border-slate-300 text-slate-600 font-medium text-[9px]">{it.normativa}</td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                            isCumple
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isNoCumple
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {it.estado === 'CUMPLE' ? '✓ CUMPLE' : it.estado === 'NO_CUMPLE' ? '✗ NO CUMPLE' : 'N/A'}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-slate-700 text-[9px] font-medium">{it.observacion || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-500 italic">
                    Sin preguntas cargadas en el relevamiento
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Plan de Regularización (Solo si hay no conformidades) */}
        {data.planRegularizacion && data.planRegularizacion.length > 0 && (
          <div className="mb-4 page-break-inside-avoid">
            <div className="bg-rose-900 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex justify-between items-center rounded-t-lg">
              <span>3. PLAN DE REGULARIZACIÓN Y CRONOGRAMA DE ADECUACIÓN ANTE LA A.R.T.</span>
              <span className="text-[9px] font-bold bg-rose-950 px-2 py-0.5 rounded">{data.planRegularizacion.length} no conformidades</span>
            </div>
            <table className="w-full border-collapse border border-rose-300 text-[10px]">
              <thead>
                <tr className="bg-rose-50 text-rose-950 font-black border-b border-rose-300 uppercase tracking-wider text-[9px]">
                  <th className="p-1.5 border border-rose-300 text-center w-12">Ítem</th>
                  <th className="p-1.5 border border-rose-300 text-left">Incumplimiento a Subsanar</th>
                  <th className="p-1.5 border border-rose-300 text-left">Medida Correctiva a Implementar</th>
                  <th className="p-1.5 border border-rose-300 text-center w-20">Plazo (Días)</th>
                  <th className="p-1.5 border border-rose-300 text-center w-24">Fecha Límite</th>
                  <th className="p-1.5 border border-rose-300 text-left w-32">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {data.planRegularizacion.map((p, idx) => (
                  <tr key={p.id || idx} className={`border-b border-rose-200 page-break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}`}>
                    <td className="p-1.5 border border-rose-300 text-center font-mono font-bold text-rose-900">{p.codigo}</td>
                    <td className="p-1.5 border border-rose-300 text-slate-800 leading-snug">{p.descripcionIncumplimiento}</td>
                    <td className="p-1.5 border border-rose-300 text-slate-900 font-semibold">{p.medidaCorrectiva}</td>
                    <td className="p-1.5 border border-rose-300 text-center font-black text-slate-800">{p.plazoEstimadoDias} días</td>
                    <td className="p-1.5 border border-rose-300 text-center font-mono font-black text-rose-700">{p.fechaLimite}</td>
                    <td className="p-1.5 border border-rose-300 text-slate-700 text-[9px] font-medium">{p.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Declaración Jurada y Firmas */}
        <div className="mt-4 pt-3 border-t-2 border-slate-300 text-[9px] page-break-inside-avoid">
          <p className="text-[8.5px] text-slate-600 text-center italic mb-4 leading-relaxed">
            El presente relevamiento técnico reviste el carácter de <strong>Declaración Jurada</strong> conforme a lo dispuesto por las Resoluciones S.R.T. N° 463/09, 529/09 y 74/10. La empresa y su profesional actuante asumen formalmente el compromiso de ejecutar el cronograma de adecuaciones para subsanar los desvíos constatados.
          </p>
          <div className="grid grid-cols-2 gap-6">
            {/* Firma Empleador */}
            <div className="border border-slate-300 rounded-xl p-3 text-center flex flex-col justify-between min-h-[105px] bg-slate-50/40">
              <span className="font-black text-slate-700 uppercase text-[8.5px] block mb-1">
                FIRMA Y ACLARACIÓN DEL EMPLEADOR / APODERADO LEGAL
              </span>
              <div className="border-b border-dashed border-slate-400 w-44 mx-auto my-3 text-slate-400 text-[7.5px] italic">
                Firma y Sello de la Empresa
              </div>
              <div className="text-[9px] font-black text-slate-900 uppercase">{data.empleadorResponsable || data.razonSocial || 'Apoderado Legal'}</div>
            </div>

            {/* Firma Profesional HyS */}
            <div className="border border-slate-300 rounded-xl p-3 text-center flex flex-col justify-between min-h-[105px] bg-slate-50/40">
              <span className="font-black text-slate-700 uppercase text-[8.5px] block mb-1">
                PROFESIONAL DE HIGIENE Y SEGURIDAD RESPONSABLE
              </span>
              <div className="flex-1 flex items-center justify-center py-1">
                {actSignature ? (
                  <img src={actSignature} alt="Firma Profesional" className="max-h-12 object-contain" />
                ) : (
                  <div className="border-b border-dashed border-slate-400 w-44 mx-auto my-2 text-slate-400 text-[7.5px] italic">
                    Firma y Sello Profesional
                  </div>
                )}
              </div>
              <div className="text-[9px] font-black text-slate-900 uppercase">
                {actName || data.profesionalHySNombre || 'Especialista HyS'}
                <span className="text-[8px] text-slate-600 block font-normal font-mono">
                  Mat. Profesional: {actLic || data.profesionalHySMatricula || 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <PdfBrandingFooter />

        <div className="mt-3 text-[8px] text-slate-400 text-center font-bold tracking-wider uppercase">
          FORMULARIO HOMOLOGADO S.R.T. — SISTEMA OFICIAL DE REGISTRO Y SEGUIMIENTO DE RIESGOS LABORALES
        </div>
      </div>
    </div>
  );
}
