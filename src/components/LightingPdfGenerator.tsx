import React from 'react';
import { Lightbulb, Sun, Layout, FileText, Building2, MapPin, Calendar, AlertTriangle, CheckCircle, Shield, Award } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';

export default function LightingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const savedPersonal = localStorage.getItem('personalData');
  const userCountry = savedPersonal ? JSON.parse(savedPersonal).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  const {
    empresa,
    cuit,
    direccion,
    localidad,
    fecha,
    sector,
    descripcionActividad,
    tipoTarea,
    luxRequerido,
    mediciones,
    results,
    conclusion,
    instrumento,
    condicionMeteorologica,
    largoLocalM,
    anchoLocalM,
    alturaMontajeM
  } = data;

  const meds = mediciones || [];
  const cumple = results?.cumplePromedio ?? (results?.dictamenGeneral === 'CONFORME');
  const uniformidad = results?.factorUniformidad ?? (results?.uniformidad ?? 0);
  const uniformidadOk = uniformidad >= 0.50;

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[10mm_12mm] bg-white text-slate-800 shadow-xl rounded-lg box-border mx-auto text-[8.5pt] font-sans"
        style={{
          borderTop: cumple ? '10px solid #eab308' : '10px solid #dc2626'
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 6mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; background: white !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
            .no-print, nav, header, aside, .sidebar, .module-form-toolbar, .module-action-bar, .module-wizard-footer { display: none !important; }
            #pdf-content, .print-area {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-top: ${cumple ? '10px solid #eab308' : '10px solid #dc2626'} !important;
              border-radius: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              opacity: 1 !important;
              visibility: visible !important;
              z-index: 999999 !important;
            }
            .pdf-signatures-wrapper {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 6px; border: 1px solid #cbd5e1; }
          `}
        </style>

        {/* Header Oficial Res. SRT 84/12 */}
        <div className="flex flex-row justify-between items-start border-b-2 border-slate-200 pb-2.5 mb-3 w-full">
          <div className="flex-1 text-left">
            <p className="m-0 font-extrabold text-[0.62rem] uppercase text-slate-500 tracking-wider">Superintendencia de Riesgos del Trabajo</p>
            <p style={{ color: cumple ? '#d97706' : '#dc2626' }} className="m-0 font-black text-[0.75rem] uppercase">
              {cumple ? 'PROTOCOLO OFICIAL RES. S.R.T. N° 84/12' : '⚠ PROTOCOLO CON NO CONFORMIDADES'}
            </p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-0 font-black text-xl tracking-tight uppercase leading-none text-slate-900">ILUMINACIÓN LABORAL</h1>
            <div style={{ background: cumple ? '#eab308' : '#dc2626' }} className="mt-1 text-white px-2.5 py-0.5 rounded-full text-[0.6rem] font-black tracking-wider uppercase">
              Dec. 351/79 Anexo IV • Res. SRT 84/12 • IRAM AADL J 20-06
            </div>
          </div>

          <div className="flex-1 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '36px', maxWidth: '120px', objectFit: 'contain' }} />
            <span className="text-[0.62rem] font-bold text-slate-400">Anexo I - Hoja 1/1</span>
          </div>
        </div>

        {/* 1. Datos del Establecimiento */}
        <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Building2 size={12} /> 1. DATOS DEL ESTABLECIMIENTO Y EMPLEADOR
          </div>
          <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Razón Social</span>
              <div className="font-extrabold text-xs text-slate-900">{empresa || '-'}</div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">C.U.I.T. N°</span>
              <div className="font-bold text-xs text-slate-800">{cuit || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 bg-white">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Sector Evaluado</span>
              <div className="font-bold text-xs text-slate-800">{sector || '-'}</div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Fecha y Hora</span>
              <div className="font-bold text-xs text-slate-800">
                {fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-'}
              </div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Condición Meteorológica</span>
              <div className="font-bold text-xs text-slate-800">{condicionMeteorologica || 'Luz Artificial Plena'}</div>
            </div>
          </div>
        </div>

        {/* 2. Instrumental y Parámetros del Recinto */}
        <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Award size={12} /> 2. INSTRUMENTAL UTILIZADO Y DIMENSIONES DEL RECINTO
          </div>
          <div className="grid grid-cols-3 bg-white">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Instrumento / Modelo</span>
              <div className="font-bold text-xs text-slate-800">
                {instrumento?.marca ? `${instrumento.marca} ${instrumento.modelo || ''}` : 'Luxómetro Digital Clase A/B'}
              </div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">N° Serie / Calibración</span>
              <div className="font-bold text-xs text-slate-800">
                {instrumento?.numeroSerie ? `S/N: ${instrumento.numeroSerie}` : '-'} | Cal: {instrumento?.fechaCalibracion || 'Vigente (< 24 meses)'}
              </div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Dimensiones / Altura</span>
              <div className="font-bold text-xs text-slate-800">
                {largoLocalM && anchoLocalM ? `${largoLocalM}m x ${anchoLocalM}m` : 'Área Operativa'} {alturaMontajeM ? `| H. Montaje: ${alturaMontajeM}m` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Requerimiento Normativo y Tarea Visual */}
        <div className="border border-amber-300 rounded-lg mb-2.5 bg-amber-50/40 flex overflow-hidden">
          <div className="flex-[2] p-2 border-r border-amber-300">
            <span className="text-[0.58rem] font-extrabold text-amber-900 uppercase flex items-center gap-1"><Layout size={11} /> TAREA VISUAL SEGÚN ANEXO IV DEC. 351/79</span>
            <div className="font-extrabold text-xs text-slate-900 mt-0.5">{tipoTarea || descripcionActividad || 'Tareas Generales de Oficina y Planta'}</div>
          </div>
          <div className="flex-[1] p-2 flex items-center gap-2 bg-amber-100/70">
            <Sun size={20} className="text-amber-600 shrink-0" />
            <div>
              <div className="text-[0.58rem] font-extrabold text-amber-900 uppercase">ILUMINANCIA EXIGIDA (Emin)</div>
              <div className="font-black text-base text-amber-700 leading-none">{luxRequerido || 0} <span className="text-xs text-amber-900">Lux</span></div>
            </div>
          </div>
        </div>

        {/* 4. Tabla de Puntos de Medición (Res. SRT 84/12 Anexo I) */}
        <div className="mb-2.5 border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-amber-600 px-3 py-1 flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5 font-black text-[0.7rem] uppercase tracking-wide">
              <Lightbulb size={13} /> 3. PUNTOS DE MEDICIÓN ({meds.length} PUNTOS RELEVADOS)
            </div>
            <span className="text-[0.62rem] font-bold opacity-90">Protocolo Res. SRT 84/12</span>
          </div>
          <table className="w-full text-[7.5pt]">
            <thead>
              <tr className="bg-slate-100 font-extrabold text-slate-700 text-center">
                <th className="w-[6%] py-1">Pto</th>
                <th className="text-left w-[36%] py-1">Ubicación / Puesto de Trabajo</th>
                <th className="w-[14%] py-1">Plano Trab.</th>
                <th className="w-[14%] py-1">Tipo Luz</th>
                <th className="w-[14%] py-1">Lux Medido</th>
                <th className="w-[16%] py-1">Conformidad</th>
              </tr>
            </thead>
            <tbody>
              {meds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-slate-400 italic">Sin mediciones cargadas</td>
                </tr>
              ) : (
                meds.map((m: any, idx: number) => {
                  const val = parseFloat(m.luxMedido) || 0;
                  const req = parseFloat(m.luxRequeridoNorma) || parseFloat(luxRequerido) || 0;
                  const ok = val >= req;
                  return (
                    <tr key={m.id || idx} className={`border-b border-slate-200 ${ok ? (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50') : 'bg-rose-50/60'}`}>
                      <td className="p-1 text-center font-bold text-slate-600">{m.codigoPunto || `P${idx + 1}`}</td>
                      <td className="p-1 font-semibold text-slate-800">{m.puestoTrabajo || m.ubicacion || '-'}</td>
                      <td className="p-1 text-center text-slate-600">{m.alturaPlanoTrabajoM ? `${m.alturaPlanoTrabajoM} m` : '0.80 m'}</td>
                      <td className="p-1 text-center text-slate-600">{m.tipoIluminacion || 'Artificial'}</td>
                      <td style={{ color: ok ? '#15803d' : '#dc2626' }} className="p-1 text-center font-black text-[8.5pt]">
                        {val} Lux
                      </td>
                      <td className="p-1 text-center">
                        {ok ? (
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black text-[0.65rem]">✓ CUMPLE</span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black text-[0.65rem]">✗ DEFICIENTE</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Cuadro Estadístico y Dictamen de Uniformidad (IRAM AADL J 20-06) */}
        <div style={{ border: `1.5px solid ${cumple ? '#86efac' : '#fca5a5'}` }} className="rounded-lg mb-2.5 overflow-hidden">
          <div style={{ background: cumple ? '#f0fdf4' : '#fef2f2' }} className="p-2.5 px-3 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <div className="text-[0.58rem] font-extrabold text-slate-500 uppercase mb-0.5">ILUMINANCIA MEDIA (Emed)</div>
              <div style={{ color: cumple ? '#16a34a' : '#dc2626' }} className="text-xl font-black leading-none">
                {results?.promedioLux || results?.iluminanciaMedia || 0} <span className="text-xs font-bold">Lux</span>
              </div>
            </div>

            <div style={{ borderLeft: `1px solid ${cumple ? '#bbf7d0' : '#fecaca'}` }} className="px-3">
              <div className="text-[0.68rem] text-slate-600">Emin / Emax: <strong>{results?.iluminanciaMinima || 0} / {results?.iluminanciaMaxima || 0} Lux</strong></div>
              <div className="text-[0.68rem] text-slate-600">
                Factor Uniformidad (U = Emin/Emed): <strong className={uniformidadOk ? 'text-emerald-700' : 'text-amber-700'}>{uniformidad.toFixed(2)}</strong> (U ≥ 0.50)
              </div>
            </div>

            <div style={{ background: cumple ? '#16a34a' : '#dc2626' }} className="px-3 py-1.5 text-white rounded-md font-black text-xs tracking-wide flex items-center gap-1.5">
              {cumple ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
              {cumple ? 'CUMPLE RES. SRT 84/12' : 'NO CUMPLE RES. SRT 84/12'}
            </div>
          </div>
        </div>

        {/* 6. Conclusión Técnica y Medidas de Adecuación */}
        {conclusion && (
          <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
            <div className="bg-slate-700 px-3 py-1 flex items-center gap-1.5">
              <FileText size={12} className="text-white" />
              <span className="font-black text-[0.65rem] text-white uppercase tracking-wide">CONCLUSIONES TÉCNICAS Y RECOMENDACIONES PREVENTIVAS</span>
            </div>
            <div className="p-2 text-[7.5pt] text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 font-medium">
              {conclusion}
            </div>
          </div>
        )}

        {/* 7. Firmas Oficiales */}
        <div className="pdf-signatures-wrapper mt-3 pt-2 border-t border-slate-200">
          <PdfSignatures data={data} />
          <PdfBrandingFooter />
        </div>
      </div>
    </div>
  );
}