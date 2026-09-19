import React from 'react';
import { Users, Building2, ShieldCheck, Activity, Stethoscope } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import type { RARSurvey } from '../types/rar';
import { calculateRARStats, getAgentByCode } from '../utils/rarCatalog';

interface Props {
  data: RARSurvey;
}

export default function RARPdf({ data }: Props): React.ReactElement | null {
  if (!data) return null;

  const stats = calculateRARStats(data.trabajadores || []);

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
  } catch (e) {}

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

        {/* Encabezado Oficial */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[7.5pt] font-black tracking-wider uppercase mb-1">
              <Stethoscope size={12} className="text-emerald-700" /> Declaración Jurada Anual · Res. S.R.T. N° 37/10
            </div>
            <h1 className="m-0 text-[1.2rem] font-black tracking-tight text-slate-900 leading-tight">
              RELEVAMIENTO DE AGENTES DE RIESGO (R.A.R.)
            </h1>
            <p className="m-0 text-[8pt] text-slate-600 font-bold uppercase tracking-wide">
              Nómina de Trabajadores Expuestos a Exámenes Médicos Periódicos (Dec. 658/96)
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
            <span className="text-[7pt] font-mono font-bold text-slate-500 mt-1">ID: {data.id?.slice(0, 10)}</span>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-900 font-black text-[1.1rem]">
              {stats.totalTrabajadores}
              <span className="text-[8pt] font-normal block text-blue-700">Trabajadores</span>
            </div>
            <div>
              <div className="text-[9pt] font-black uppercase tracking-wide text-slate-900">
                {stats.trabajadoresExpuestos} Expuestos ({stats.porcentajeExpuestos}%) · {stats.trabajadoresNoExpuestos} Sin Exposición Nociva
              </div>
              <div className="text-[7.5pt] text-slate-600">
                Físicos: {stats.conteoPorCategoria.Físico} · Químicos: {stats.conteoPorCategoria.Químico} · Ergonómicos: {stats.conteoPorCategoria.Ergonómico} · Biológicos: {stats.conteoPorCategoria.Biológico}
              </div>
            </div>
          </div>
          <div className="text-right border-l border-slate-200 pl-3 text-[7.5pt]">
            <span className="font-bold text-slate-500 block">Vigencia Anual</span>
            <span className="font-black text-slate-900">
              {data.fechaRelevamiento ? new Date(data.fechaRelevamiento).toLocaleDateString('es-AR') : '-'}
            </span>
          </div>
        </div>

        {/* Datos de la Empresa y ART */}
        <div className="border border-slate-300 rounded p-2 bg-slate-50/60 mb-3 text-[8pt]">
          <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5 text-[8pt]">
            <Building2 size={12} className="text-blue-600" /> 1. IDENTIFICACIÓN DE LA EMPRESA Y A.R.T.
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
              <span className="font-bold text-slate-500 block text-[7pt]">Póliza / Contrato</span>
              <span className="font-mono text-slate-900 block">{data.nroPoliza || 'S/N'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block text-[7pt]">Establecimiento / Dirección</span>
              <span className="text-slate-800 block truncate">{data.establecimientoNombre} - {data.direccion} ({data.localidad}, {data.provincia})</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block text-[7pt]">CIIU / Actividad Económica</span>
              <span className="text-slate-800 block truncate">{data.ciiuActividad || 'Industrial'}</span>
            </div>
          </div>
        </div>

        {/* Tabla Oficial de Trabajadores Expuestos */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-2 py-1 text-[8pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
            <span>2. NÓMINA DE TRABAJADORES EXPUESTOS (ANEXO I RES. SRT 37/10)</span>
            <span className="text-[7pt] font-normal opacity-90">SRT / Ley 24.557</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[7.5pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-1 border border-slate-300 text-center w-8">N°</th>
                <th className="p-1 border border-slate-300 text-left w-24">CUIL / DNI</th>
                <th className="p-1 border border-slate-300 text-left">Apellido y Nombre</th>
                <th className="p-1 border border-slate-300 text-left w-32">Puesto / Tarea</th>
                <th className="p-1 border border-slate-300 text-left w-24">Sector</th>
                <th className="p-1 border border-slate-300 text-left">Agentes de Riesgo Declarados (Código SRT)</th>
                <th className="p-1 border border-slate-300 text-center w-14">Hs/Día</th>
                <th className="p-1 border border-slate-300 text-center w-12">EPP</th>
              </tr>
            </thead>
            <tbody>
              {data.trabajadores && data.trabajadores.length > 0 ? (
                data.trabajadores.map((w, idx) => {
                  const hasAgents = w.agentesCodigos && w.agentesCodigos.length > 0;
                  return (
                    <tr key={w.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-1 border border-slate-300 font-mono font-bold text-slate-800">{w.cuil}</td>
                      <td className="p-1 border border-slate-300 font-medium text-slate-900">{w.nombre}</td>
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
                                  className="inline-block px-1.5 py-0.5 rounded text-[6.5pt] font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200"
                                  title={ag?.nombre || code}
                                >
                                  {code} - {ag?.nombre ? ag.nombre.slice(0, 22) + '…' : ''}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[7pt]">Sin agentes declarados</span>
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-2 text-center text-slate-500 italic">No se registraron trabajadores en la nómina</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Declaración Jurada y Firmas */}
        <div className="mt-4 pt-3 border-t-2 border-slate-300 text-[8pt]">
          <p className="text-[7pt] text-slate-500 text-center italic mb-3">
            El presente formulario tiene carácter de Declaración Jurada para la realización de los Exámenes Médicos Periódicos (Res. S.R.T. N° 37/10 y Dec. 658/96). Los datos suministrados son fidedignos y representan las condiciones efectivas de exposición en los puestos de trabajo.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Firma Empleador */}
            <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[90px] bg-white">
              <span className="font-bold text-slate-700 uppercase text-[7pt] block mb-1">
                FIRMA DEL EMPLEADOR / REPRESENTANTE LEGAL
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
