import React from 'react';
import { Lightbulb, Sun, Layout, FileText, Building2, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';

export default function LightingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const savedPersonal = localStorage.getItem('personalData');
  const userCountry = savedPersonal ? JSON.parse(savedPersonal).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  const { empresa, fecha, sector, descripcionActividad, tipoTarea, luxRequerido, mediciones, results, conclusion } = data;
  const meds = mediciones || [];
  const cumple = results?.cumplePromedio;

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[10mm_12mm] bg-white text-slate-800 shadow-xl rounded-lg box-border mx-auto text-[9pt] font-sans"
        style={{
          borderTop: cumple ? '10px solid #eab308' : '10px solid #dc2626'
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 5mm; }
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
          `}
        </style>

        {/* Header Tripartito */}
        <div className="flex flex-row justify-between items-start border-b-2 border-slate-200 pb-3 mb-4 w-full">
          <div className="flex-1 text-left">
            <p className="m-0 font-extrabold text-[0.65rem] uppercase text-slate-500 tracking-wider">Sistema de Gestión HSE</p>
            <p style={{ color: cumple ? '#d97706' : '#dc2626' }} className="m-0 font-black text-xs uppercase">
              {cumple ? 'Doc. Estudio de Iluminación' : '⚠ DEFICIENCIA DE ILUMINACIÓN'}
            </p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-0 font-black text-2xl tracking-tight uppercase leading-none text-slate-900">ILUMINACIÓN</h1>
            <div style={{ background: cumple ? '#eab308' : '#dc2626' }} className="mt-1 text-white px-3 py-0.5 rounded-full text-[0.65rem] font-black tracking-wider">
              ESTUDIO DE NIVELES — {countryNorms.lighting}
            </div>
          </div>

          <div className="flex-1 text-right flex flex-col items-end gap-2">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Datos del establecimiento */}
        <div className="border border-slate-300 rounded-lg mb-4 overflow-hidden">
          <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200">
              <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1"><Building2 size={12} /> EMPRESA / CLIENTE</span>
              <div className="font-extrabold text-sm text-slate-900 mt-0.5">{empresa || '-'}</div>
            </div>
            <div className="p-3">
              <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12} /> FECHA DE MEDICIÓN</span>
              <div className="font-bold text-xs text-slate-700 mt-0.5">{fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 bg-white">
            <div className="p-3 border-r border-slate-200">
              <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1"><MapPin size={12} /> SECTOR EVALUADO</span>
              <div className="font-bold text-xs text-slate-700 mt-0.5">{sector || '-'}</div>
            </div>
            <div className="p-3">
              <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase">DESCRIPCIÓN DE TAREAS</span>
              <div className="font-bold text-xs text-slate-700 mt-0.5">{descripcionActividad || '-'}</div>
            </div>
          </div>
        </div>

        {/* Requerimiento legal */}
        <div className="border border-amber-300 rounded-lg mb-4 bg-amber-50/50 flex overflow-hidden">
          <div className="flex-[2] p-3 border-r border-amber-300">
            <span className="text-[0.6rem] font-extrabold text-amber-900 uppercase flex items-center gap-1"><Layout size={12} /> TIPO DE TAREA VISUAL</span>
            <div className="font-extrabold text-xs text-slate-900 mt-0.5">{tipoTarea || '-'}</div>
          </div>
          <div className="flex-[1] p-3 flex items-center gap-3 bg-amber-100/60">
            <Sun size={24} className="text-amber-600" />
            <div>
              <div className="text-[0.6rem] font-extrabold text-amber-900 uppercase">ILUM. MÍNIMA EXIGIDA</div>
              <div className="font-black text-lg text-amber-700 leading-none">{luxRequerido || 0} <span className="text-xs text-amber-900">Lux</span></div>
            </div>
          </div>
        </div>

        {/* Tabla de mediciones */}
        <div className="mb-4 border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-amber-600 p-2 px-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-white" />
            <span className="font-black text-xs text-white uppercase tracking-wide">PUNTOS DE MEDICIÓN — {meds.length} REGISTRO{meds.length !== 1 ? 'S' : ''}</span>
          </div>
          <table className="w-full border-collapse text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-2 w-[8%] text-center font-extrabold text-slate-600 border-r border-slate-200 text-[0.65rem]">N°</th>
                <th className="p-2 text-left font-extrabold text-slate-600 border-r border-slate-200 text-[0.65rem]">PUNTO / PUESTO DE TRABAJO</th>
                <th className="p-2 w-[20%] text-center font-extrabold text-slate-600 border-r border-slate-200 text-[0.65rem]">LUX MEDIDO</th>
                <th className="p-2 w-[18%] text-center font-extrabold text-slate-600 text-[0.65rem]">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {meds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">Sin mediciones registradas</td>
                </tr>
              ) : (
                meds.map((m: any, idx: number) => {
                  const val = parseFloat(m.luxMedido) || 0;
                  const ok = val >= (parseFloat(luxRequerido) || 0);
                  return (
                    <tr key={m.id || idx} className={`border-b border-slate-200 ${ok ? (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50') : 'bg-rose-50/50'}`}>
                      <td className="p-2 text-center text-slate-500 font-bold border-r border-slate-200">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-700 border-r border-slate-200">{m.ubicacion || '-'}</td>
                      <td style={{ color: ok ? '#15803d' : '#dc2626' }} className="p-2 text-center font-black text-sm border-r border-slate-200">{m.luxMedido}</td>
                      <td className="p-2 text-center">
                        {ok ? (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black text-[0.7rem]">✓ OK</span>
                        ) : (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black text-[0.7rem]">✗ BAJO</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Evaluación normativa */}
        <div style={{ border: `1.5px solid ${cumple ? '#86efac' : '#fca5a5'}` }} className="rounded-lg mb-4 overflow-hidden">
          <div style={{ background: cumple ? '#f0fdf4' : '#fef2f2' }} className="p-3 px-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[0.65rem] font-extrabold text-slate-500 uppercase mb-1">PROMEDIO REGISTRADO</div>
              <div style={{ color: cumple ? '#16a34a' : '#dc2626' }} className="text-2xl font-black leading-none">
                {results?.promedioLux || 0} <span className="text-sm font-bold">Lux</span>
              </div>
            </div>
            <div style={{ borderLeft: `1px solid ${cumple ? '#bbf7d0' : '#fecaca'}` }} className="flex-1 min-w-[120px] px-4">
              <div className="text-xs text-slate-600 mb-0.5">Req. {countryNorms.lighting.split(' ')[0]}: <strong className="text-slate-900">{luxRequerido || 0} Lux</strong></div>
              <div className="text-xs text-slate-600 mb-0.5">Cumplen: <strong className="text-emerald-600">{results?.puntosCumplen || 0}</strong></div>
              <div className="text-xs text-slate-600">Deficientes: <strong className="text-rose-600">{results?.puntosNoCumplen || 0}</strong></div>
            </div>
            <div style={{ background: cumple ? '#16a34a' : '#dc2626' }} className="px-4 py-2 text-white rounded-lg font-black text-sm tracking-wide flex items-center gap-2">
              {cumple ? <CheckCircle size={18} /> : <AlertTriangle size={18} />} {cumple ? 'CUMPLE' : 'NO CUMPLE'}
            </div>
          </div>
        </div>

        {/* Conclusión */}
        {conclusion && (
          <div className="border border-slate-300 rounded-lg mb-4 overflow-hidden">
            <div className="bg-slate-700 p-1.5 px-3 flex items-center gap-1.5">
              <FileText size={14} className="text-white" />
              <span className="font-black text-[0.72rem] text-white uppercase tracking-wide">CONCLUSIÓN TÉCNICA PROFESIONAL</span>
            </div>
            <div className="p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 font-medium">
              {conclusion}
            </div>
          </div>
        )}

        {/* Firmas y branding footer agrupados */}
        <div className="pdf-signatures-wrapper mt-4 pt-2 border-t border-slate-200">
          <PdfSignatures data={data} />
          <PdfBrandingFooter />
        </div>
      </div>
    </div>
  );
}