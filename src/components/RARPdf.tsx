import React from 'react';
import { Users, Building2, ShieldCheck, Activity, Stethoscope, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import type { RARSurvey } from '../types/rar';
import { calculateRARStats, getAgentByCode, getRecommendedMedicalExams } from '../utils/rarCatalog';
import { evaluateRarProtocolSafety } from '../utils/srtProtocols';

interface Props {
  data: RARSurvey;
}

export default function RARPdf({ data }: Props): React.ReactElement | null {
  if (!data) return null;

  const stats = calculateRARStats(data.trabajadores || []);
  const evaluation = evaluateRarProtocolSafety(data);

  // Firmas
  let actSignature: string | null = null;
  let actStamp: string | null = null;
  let actName: string | null = data.profesionalNombre || null;
  let actLic: string | null = data.profesionalMatricula || null;

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
  } catch (e) {
    console.error('Error loading signature for RAR PDF:', e);
  }

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[10mm] bg-white text-slate-900 box-border mx-auto text-[8.5pt] font-sans"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 landscape; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 2mm !important; width: 100% !important; max-width: none !important; border: none !important; min-height: auto !important; }
          `}
        </style>

        {/* Encabezado Oficial Institucional SRT */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[7.5pt] font-black tracking-wider uppercase mb-1">
              <Stethoscope size={12} className="text-emerald-700" /> Declaración Jurada Anual · Res. S.R.T. N° 37/10 · Ley 24.557
            </div>
            <h1 className="m-0 text-[1.25rem] font-black tracking-tight text-slate-900 leading-tight">
              RELEVAMIENTO DE AGENTES DE RIESGO (R.A.R.)
            </h1>
            <p className="m-0 text-[8pt] text-slate-600 font-bold uppercase tracking-wide">
              Nómina de Trabajadores Expuestos a Exámenes Médicos Periódicos (Decreto 658/96 y Res. S.R.T. N° 81/19)
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
            <span className="text-[7pt] font-mono font-bold text-slate-500 mt-1">ID: {data.id?.slice(0, 14)}</span>
          </div>
        </div>

        {/* Métricas Rápidas y Alerta de Cancerígenos */}
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-600 text-white font-black text-center min-w-[68px]">
              <span className="text-[1.2rem] leading-none block">{stats.totalTrabajadores}</span>
              <span className="text-[7pt] font-semibold uppercase tracking-wider block opacity-90">Personal</span>
            </div>
            <div>
              <div className="text-[9pt] font-black uppercase tracking-wide text-slate-900">
                {stats.trabajadoresExpuestos} Expuestos ({stats.porcentajeExpuestos}%) · {stats.trabajadoresNoExpuestos} Sin Exposición Nociva
              </div>
              <div className="text-[7.5pt] text-slate-600 mt-0.5">
                Físicos: <span className="font-bold">{stats.conteoPorCategoria.Físico}</span> · 
                Químicos: <span className="font-bold">{stats.conteoPorCategoria.Químico}</span> · 
                Ergonómicos: <span className="font-bold">{stats.conteoPorCategoria.Ergonómico}</span> · 
                Biológicos: <span className="font-bold">{stats.conteoPorCategoria.Biológico}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats.trabajadoresConCancerigenos > 0 && (
              <div className="px-2.5 py-1 rounded bg-rose-100 border border-rose-300 text-rose-900 text-[7.5pt] font-black uppercase flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-rose-600" />
                <span>{stats.trabajadoresConCancerigenos} c/ Cancerígenos (Res. 81/19)</span>
              </div>
            )}
            <div className="text-right border-l border-slate-200 pl-3 text-[7.5pt]">
              <span className="font-bold text-slate-500 block">Vigencia Anual</span>
              <span className="font-black text-slate-900">
                {data.fechaRelevamiento ? new Date(data.fechaRelevamiento).toLocaleDateString('es-AR') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Identificación de la Empresa y A.R.T. */}
        <div className="border border-slate-300 rounded p-2.5 bg-slate-50/60 mb-3 text-[8pt]">
          <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5 text-[8pt]">
            <Building2 size={12} className="text-emerald-700" /> 1. IDENTIFICACIÓN DEL ESTABLECIMIENTO Y ASEGURADORA (A.R.T.)
          </div>
          <div className="grid grid-cols-4 gap-y-1.5 gap-x-3">
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Razón Social</span>
              <span className="font-bold text-slate-900 truncate block">{data.razonSocial || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">C.U.I.T. Patronal</span>
              <span className="font-bold font-mono text-slate-900 block">{data.cuit || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Aseguradora (A.R.T.)</span>
              <span className="font-black text-emerald-800 block">{data.artNombre || 'Sin ART'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">Contrato / Póliza N°</span>
              <span className="font-mono text-slate-900 block">{data.nroPoliza || 'S/N'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block text-[7pt]">Establecimiento / Domicilio</span>
              <span className="text-slate-800 block truncate">
                {data.establecimientoNombre} - {data.direccion} ({data.localidad}, {data.provincia})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">N° Establecimiento SRT</span>
              <span className="font-mono text-slate-800 block">{data.establecimientoNumero || '001'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7pt]">CIIU / Rama Actividad</span>
              <span className="text-slate-800 block truncate">{data.ciiuActividad || 'Industrial'}</span>
            </div>
          </div>
        </div>

        {/* 2. Nómina Oficial de Trabajadores Expuestos (Anexo I Res. SRT 37/10) */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-2.5 py-1 text-[8pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
            <span>2. NÓMINA OFICIAL DE TRABAJADORES EXPUESTOS (ANEXO I RES. S.R.T. 37/10)</span>
            <span className="text-[7pt] font-normal opacity-90">SRT / Ley 24.557</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[7.5pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-1 border border-slate-300 text-center w-7">N°</th>
                <th className="p-1 border border-slate-300 text-left w-24">C.U.I.L.</th>
                <th className="p-1 border border-slate-300 text-left">Apellido y Nombre</th>
                <th className="p-1 border border-slate-300 text-left w-28">Puesto / Tarea</th>
                <th className="p-1 border border-slate-300 text-left w-20">Sector</th>
                <th className="p-1 border border-slate-300 text-left">Agentes de Riesgo Declarados (Código SRT)</th>
                <th className="p-1 border border-slate-300 text-center w-12">Hs/Día</th>
                <th className="p-1 border border-slate-300 text-center w-12">EPP</th>
                <th className="p-1 border border-slate-300 text-left w-48">Estudios Médicos Periódicos (ART)</th>
              </tr>
            </thead>
            <tbody>
              {data.trabajadores && data.trabajadores.length > 0 ? (
                data.trabajadores.map((w, idx) => {
                  const hasAgents = w.agentesCodigos && w.agentesCodigos.length > 0;
                  const reqExams = getRecommendedMedicalExams(w.agentesCodigos || []);

                  return (
                    <tr key={w.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-1 border border-slate-300 font-mono font-bold text-slate-800">{w.cuil}</td>
                      <td className="p-1 border border-slate-300 font-semibold text-slate-900">{w.nombre}</td>
                      <td className="p-1 border border-slate-300">{w.puesto}</td>
                      <td className="p-1 border border-slate-300 text-slate-600">{w.sector}</td>
                      <td className="p-1 border border-slate-300">
                        {hasAgents ? (
                          <div className="flex flex-wrap gap-1">
                            {w.agentesCodigos.map(code => {
                              const ag = getAgentByCode(code);
                              return (
                                <span
                                  key={code}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[6.5pt] font-mono font-bold border ${
                                    ag?.esCancerigeno
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}
                                  title={ag?.nombre || code}
                                >
                                  {code} - {ag?.nombre ? ag.nombre.slice(0, 18) + '…' : ''}
                                  {ag?.esCancerigeno && ' ☣️'}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[7pt]">Sin agentes nocivos declarados</span>
                        )}
                      </td>
                      <td className="p-1 border border-slate-300 text-center font-bold">{w.horasExposicionDiaria || 8}h</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span className={`inline-block px-1 py-0.5 rounded text-[6.5pt] font-black ${
                          w.eppAdecuado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {w.eppAdecuado ? 'SÍ' : 'NO'}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-[6.5pt] text-slate-700">
                        {reqExams.length > 0 ? (
                          <ul className="m-0 pl-3 list-disc space-y-0.5">
                            {reqExams.slice(0, 2).map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                            {reqExams.length > 2 && (
                              <li className="font-bold text-slate-500">+{reqExams.length - 2} estudio(s) más</li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-slate-400 italic">No requiere exámenes periódicos</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-2 text-center text-slate-500 italic">No se registraron trabajadores en la nómina</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Consolidado de Exámenes Médicos Periódicos para la ART */}
        {evaluation.examenesMedicosConsolidados.length > 0 && (
          <div className="border border-slate-300 rounded p-2 bg-slate-50/70 mb-3 text-[7.5pt]">
            <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet size={12} className="text-emerald-700" />
              <span>3. BATERÍA CONSOLIDADA DE EXÁMENES MÉDICOS PERIÓDICOS (COORDINACIÓN CON A.R.T.)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {evaluation.examenesMedicosConsolidados.map((ex, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-200">
                  <span className="text-slate-700 truncate">{ex.examen}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 font-bold text-slate-900 text-[7pt] ml-2">
                    {ex.cantidadTrabajadores} operario(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Conclusiones y Observaciones */}
        {data.conclusionTecnica && (
          <div className="border border-slate-200 rounded p-2 bg-white mb-3 text-[7.5pt]">
            <div className="font-bold text-slate-800 mb-1 uppercase text-[7pt]">4. Conclusiones y Dictamen Técnico:</div>
            <p className="m-0 text-slate-700 leading-snug whitespace-pre-line">{data.conclusionTecnica}</p>
          </div>
        )}

        {/* Declaración Jurada y Firmas Bipartitas */}
        <div className="mt-3 pt-2.5 border-t-2 border-slate-300 text-[8pt]">
          <p className="text-[6.5pt] text-slate-500 text-center italic mb-2.5">
            El presente formulario tiene carácter de Declaración Jurada ante la A.R.T. y la Superintendencia de Riesgos del Trabajo (Res. S.R.T. N° 37/10 y Dec. 658/96). Los datos suministrados son fidedignos y reflejan las condiciones efectivas de exposición en los puestos de trabajo.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Firma Empleador */}
            <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[85px] bg-white">
              <span className="font-bold text-slate-700 uppercase text-[7pt] block mb-1">
                REPRESENTANTE LEGAL / TITULAR EMPLEADOR
              </span>
              <div className="border-b border-dashed border-slate-300 w-36 mx-auto my-1.5 text-slate-400 text-[6.5pt] italic">
                Firma y Aclaración
              </div>
              <div className="text-[7.5pt] font-bold text-slate-800">
                {data.empleadorResponsable || data.razonSocial}
                <span className="text-[6.5pt] text-slate-500 block font-normal">Titular / Apoderado</span>
              </div>
            </div>

            {/* Firma Profesional HyS */}
            <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[85px] bg-white">
              <span className="font-bold text-slate-700 uppercase text-[7pt] block mb-1">
                PROFESIONAL DE HIGIENE Y SEGURIDAD EN EL TRABAJO
              </span>
              <div className="flex-1 flex items-center justify-center py-0.5">
                {actSignature ? (
                  <img src={actSignature} alt="Firma Profesional" className="max-h-11 object-contain" />
                ) : (
                  <div className="border-b border-dashed border-slate-300 w-36 mx-auto my-1 text-slate-400 text-[6.5pt] italic">
                    Firma y Sello
                  </div>
                )}
              </div>
              <div className="text-[7.5pt] font-bold text-slate-800">
                {actName || data.profesionalNombre || 'Profesional HyS'}
                <span className="text-[7pt] text-slate-500 block font-normal font-mono">
                  Mat: {actLic || data.profesionalMatricula || 'Pendiente'}
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

