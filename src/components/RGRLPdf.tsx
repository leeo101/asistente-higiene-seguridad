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
      ? 'ANEXO II · CONSTRUCCIÓN (Dec. 911/96)'
      : data.anexo === 'anexo3_617'
      ? 'ANEXO III · ACTIVIDAD AGROPECUARIA (Dec. 617/97)'
      : 'ANEXO I · INDUSTRIA, COMERCIO Y SERVICIOS (Dec. 351/79)';

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
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[10mm] bg-white text-slate-900 box-border mx-auto text-[9pt] font-sans"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 2mm !important; width: 100% !important; max-width: none !important; border: none !important; min-height: auto !important; }
          `}
        </style>

        {/* Encabezado Oficial SRT */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[7.5pt] font-black tracking-wider uppercase mb-1">
              <ClipboardCheck size={12} className="text-blue-700" /> Declaración Jurada Anual · Res. S.R.T. N° 463/09
            </div>
            <h1 className="m-0 text-[1.2rem] font-black tracking-tight text-slate-900 leading-tight">
              RELEVAMIENTO GENERAL DE RIESGOS LABORALES (R.G.R.L.)
            </h1>
            <p className="m-0 text-[8pt] text-slate-600 font-bold uppercase tracking-wide">
              {annexTitle} · Res. SRT 529/09 y Res. SRT 74/10
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
            <span className="text-[7pt] font-mono font-bold text-slate-500 mt-1">ID: {data.id?.slice(0, 10)}</span>
          </div>
        </div>

        {/* Banner de Porcentaje de Cumplimiento */}
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg font-black text-[1.2rem] ${
              metrics.porcentajeCumplimiento >= 90
                ? 'bg-emerald-100 text-emerald-800'
                : metrics.porcentajeCumplimiento >= 75
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {metrics.porcentajeCumplimiento}%
            </div>
            <div>
              <div className="text-[9.5pt] font-black uppercase tracking-wide">
                Nivel de Cumplimiento Legal: {metrics.estadoGeneral}
              </div>
              <div className="text-[7.5pt] text-slate-600">
                {metrics.cumpleCount} CUMPLE · {metrics.noCumpleCount} NO CUMPLE · {metrics.noAplicaCount} NO APLICA (Total: {metrics.totalItems} puntos evaluados)
              </div>
            </div>
          </div>
          <div className="text-right border-l border-slate-200 pl-3 text-[7.5pt]">
            <span className="font-bold text-slate-500 block">Fecha Relevamiento</span>
            <span className="font-black text-slate-900">
              {data.fechaRelevamiento ? new Date(data.fechaRelevamiento).toLocaleDateString('es-AR') : '-'}
            </span>
          </div>
        </div>

        {/* Datos de la Empresa y ART */}
        <div className="border border-slate-300 rounded p-2 bg-slate-50/60 mb-3 text-[8pt]">
          <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5 text-[8pt]">
            <Building2 size={12} className="text-blue-600" /> 1. DATOS DE LA EMPRESA, ESTABLECIMIENTO Y A.R.T.
          </div>
          <div className="grid grid-cols-4 gap-y-1 gap-x-2">
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Razón Social</span>
              <span className="font-bold text-slate-900 truncate block">{data.razonSocial || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">CUIT</span>
              <span className="font-bold font-mono text-slate-900 block">{data.cuit || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Aseguradora (ART)</span>
              <span className="font-black text-blue-700 block">{data.artNombre || 'Sin ART'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">N° Póliza / Afiliación</span>
              <span className="font-mono text-slate-900 block">{data.nroPoliza || 'S/N'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block text-[7pt]">Dirección y Localidad</span>
              <span className="text-slate-800 block truncate">{data.direccion}, {data.localidad} ({data.provincia})</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Código CIIU / Actividad</span>
              <span className="text-slate-800 block truncate">{data.ciiuActividad || 'Industrial'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Trabajadores</span>
              <span className="font-bold text-slate-900 block">{data.cantidadTrabajadores || 0} operarios</span>
            </div>
          </div>
        </div>

        {/* Cuestionario RGRL */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-2 py-1 text-[8pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
            <span>2. PLANILLA DE RELEVAMIENTO DE CUMPLIMIENTO LEGAL (RES. SRT 463/09)</span>
            <span className="text-[7pt] font-normal opacity-90">SRT / Ley 19.587</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[7.5pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-1 border border-slate-300 text-center w-10">Ítem</th>
                <th className="p-1 border border-slate-300 text-left">Exigencia Legal Relevada</th>
                <th className="p-1 border border-slate-300 text-left w-36">Normativa Legal</th>
                <th className="p-1 border border-slate-300 text-center w-20">Condición</th>
                <th className="p-1 border border-slate-300 text-left w-36">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((it, idx) => {
                  const isCumple = it.estado === 'CUMPLE';
                  const isNoCumple = it.estado === 'NO_CUMPLE';
                  return (
                    <tr key={it.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-mono font-bold">{it.codigo}</td>
                      <td className="p-1 border border-slate-300 font-medium text-slate-900 leading-snug">{it.pregunta}</td>
                      <td className="p-1 border border-slate-300 text-slate-600 text-[7pt]">{it.normativa}</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[6.5pt] font-black uppercase ${
                          isCumple
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNoCumple
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {it.estado === 'CUMPLE' ? 'CUMPLE' : it.estado === 'NO_CUMPLE' ? 'NO CUMPLE' : 'NO APLICA'}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-slate-600 text-[7pt]">{it.observacion || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-slate-500 italic">Sin preguntas cargadas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Plan de Regularización (Solo si hay no conformidades) */}
        {data.planRegularizacion && data.planRegularizacion.length > 0 && (
          <div className="mb-3">
            <div className="bg-red-800 text-white px-2 py-1 text-[8pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
              <span>3. PLAN DE REGULARIZACIÓN Y ADECUACIÓN ANTE LA A.R.T. (CRONOGRAMA)</span>
              <span className="text-[7pt] font-normal opacity-90">{data.planRegularizacion.length} desvíos a subsanar</span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[7.5pt]">
              <thead>
                <tr className="bg-red-50 text-red-900 font-bold border-b border-slate-300">
                  <th className="p-1 border border-slate-300 text-center w-10">Ítem</th>
                  <th className="p-1 border border-slate-300 text-left">Incumplimiento a Subsanar</th>
                  <th className="p-1 border border-slate-300 text-left">Medida Correctiva a Implementar</th>
                  <th className="p-1 border border-slate-300 text-center w-16">Plazo (Días)</th>
                  <th className="p-1 border border-slate-300 text-center w-20">Fecha Límite</th>
                  <th className="p-1 border border-slate-300 text-left w-24">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {data.planRegularizacion.map((p, idx) => (
                  <tr key={p.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}>
                    <td className="p-1 border border-slate-300 text-center font-mono font-bold">{p.codigo}</td>
                    <td className="p-1 border border-slate-300 text-slate-800 leading-snug">{p.descripcionIncumplimiento}</td>
                    <td className="p-1 border border-slate-300 text-slate-900 font-medium">{p.medidaCorrectiva}</td>
                    <td className="p-1 border border-slate-300 text-center font-bold">{p.plazoEstimadoDias} d</td>
                    <td className="p-1 border border-slate-300 text-center font-mono font-bold text-red-700">{p.fechaLimite}</td>
                    <td className="p-1 border border-slate-300 text-slate-700 text-[7pt]">{p.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Declaración Jurada y Firmas */}
        <div className="mt-4 pt-3 border-t-2 border-slate-300 text-[8pt]">
          <p className="text-[7pt] text-slate-500 text-center italic mb-3">
            El presente relevamiento tiene carácter de Declaración Jurada conforme a la Res. S.R.T. N° 463/09, 529/09 y 74/10. La empresa asume el compromiso de cumplir con el cronograma de regularización de los puntos observados.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Firma Empleador */}
            <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[90px] bg-white">
              <span className="font-bold text-slate-700 uppercase text-[7pt] block mb-1">
                FIRMA Y ACLARACIÓN DEL EMPLEADOR / APODERADO
              </span>
              <div className="border-b border-dashed border-slate-300 w-36 mx-auto my-2 text-slate-400 text-[6.5pt] italic">
                Firma y Sello
              </div>
              <div className="text-[7.5pt] font-bold text-slate-800">{data.empleadorResponsable || data.razonSocial}</div>
            </div>

            {/* Firma Profesional HyS */}
            <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[90px] bg-white">
              <span className="font-bold text-slate-700 uppercase text-[7pt] block mb-1">
                PROFESIONAL DE HIGIENE Y SEGURIDAD RESPONSABLE
              </span>
              <div className="flex-1 flex items-center justify-center py-0.5">
                {actSignature ? (
                  <img src={actSignature} alt="Firma Profesional" className="max-h-12 object-contain" />
                ) : (
                  <div className="border-b border-dashed border-slate-300 w-36 mx-auto my-1 text-slate-400 text-[6.5pt] italic">
                    Firma y Sello
                  </div>
                )}
              </div>
              <div className="text-[7.5pt] font-bold text-slate-800">
                {actName || data.profesionalHySNombre || 'Profesional HyS'}
                <span className="text-[7pt] text-slate-500 block font-normal font-mono">
                  Mat: {actLic || data.profesionalHySMatricula || 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}
