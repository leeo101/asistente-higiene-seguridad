import React, { useRef } from 'react';
import { Flame, ShieldCheck, Info, FileText } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import PdfBrandingFooter from './PdfBrandingFooter';

const PDF_STYLES = `
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 12mm 10mm;
  }
  .ats-pdf-root {
    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 8pt;
    line-height: 1.25;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ats-pdf-root * {
    box-sizing: border-box;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .ats-pdf-section {
    margin-bottom: 0.8rem;
  }
  .ats-pdf-root > .ats-pdf-offscreen-wrap {
    display: block !important;
    width: 100% !important;
  }
  .company-logo {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @media print {
    .ats-pdf-root {
      box-shadow: none !important;
      border-radius: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .page-break-before {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`;

export default function FireLoadPdfGenerator({ data }: {data: any;}): React.ReactElement | null {

  if (!data) return null;

  const countryNorms = getCountryNormativa(data.pais || 'Argentina');
  const { empresa, obra, fecha, sector, superficie, riesgo, materiales, results, conclusion } = data;

  return (
    <div className="ats-pdf-offscreen-wrap w-[100%]">
      <div
        id="pdf-content"
        className="pdf-container print-area ats-pdf-root w-[100%] max-w-[210mm] min-h-[297mm] p-[10mm_15mm] bg-[#ffffff] text-[#0f172a] shadow-lg rounded-[8px] m-[0_auto]"
      >
        <style type="text/css">{PDF_STYLES}</style>

        <div className="flex justify-between items-center border-b-[3px] border-slate-200 pb-[1rem] mb-[2rem]">
            <div className="flex-1">
                <h1 className="m-[0] text-[24pt] font-[900] text-slate-800 tracking-tight">ESTUDIO DE CARGA DE FUEGO</h1>
                <p className="m-[0] text-[12pt] font-[800] text-orange-500">CÁLCULO Y RESULTADOS</p>
            </div>
            <div className="flex flex-col items-end gap-[0.5rem]">
                <CompanyLogo className="h-[45px] w-auto object-contain max-w-[150px]" />
                <div className="text-right mt-1">
                    <div className="text-[8pt] font-[800] text-slate-500">SISTEMA DE GESTIÓN HYS</div>
                    <div className="font-[800] text-slate-800 text-[9pt]">{countryNorms.fire}</div>
                </div>
            </div>
        </div>

        <div className="border-2 border-slate-200 rounded-lg mb-[2rem] break-inside-avoid avoid-break overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr] border-b-2 border-slate-200">
                <div className="p-3 flex flex-col gap-1">
                    <span className="text-[7.5pt] font-[900] text-slate-500 uppercase">EMPRESA / CLIENTE</span>
                    <span className="font-[800] text-[10.5pt]">{empresa || '-'}</span>
                </div>
                <div className="p-3 border-l-2 border-slate-200 flex flex-col gap-1">
                    <span className="text-[7.5pt] font-[900] text-slate-500 uppercase">OBRA / UBICACIÓN</span>
                    <span className="font-[800] text-[10.5pt]">{obra || '-'}</span>
                </div>
            </div>
            <div className="grid grid-cols-3">
                <div className="p-3 flex flex-col gap-1">
                    <span className="text-[7.5pt] font-[900] text-slate-500 uppercase">FECHA DE ESTUDIO</span>
                    <span className="font-[800] text-[10pt]">{fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-'}</span>
                </div>
                <div className="p-3 border-l-2 border-slate-200 flex flex-col gap-1">
                    <span className="text-[7.5pt] font-[900] text-slate-500 uppercase">SECTOR EVALUADO</span>
                    <span className="font-[800] text-[10pt]">{sector || '-'}</span>
                </div>
                <div className="p-3 border-l-2 border-slate-200 flex flex-col gap-1">
                    <span className="text-[7.5pt] font-[900] text-slate-500 uppercase">SUPERFICIE</span>
                    <span className="font-[800] text-[10pt]">{superficie || 0} m²</span>
                </div>
            </div>
        </div>

        <div className="mb-[2rem]">
            <h3 className="text-[14pt] font-[900] m-[0_0_1rem_0] text-slate-800 flex items-center gap-[0.5rem] border-b-2 border-slate-300 pb-[0.4rem]">
                <Flame size={20} className="text-orange-500" /> Inventario de Materiales Combustibles
            </h3>
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1.5fr] bg-slate-50 p-3 border-b-2 border-slate-200 font-[800] text-[8pt] text-slate-500">
                    <div>Material</div>
                    <div>Peso (Kg)</div>
                    <div>Calor (Mcal/Kg)</div>
                    <div>Total Kcal</div>
                </div>
                {(!materiales || materiales.length === 0) ? (
                    <div className="p-4 text-center text-slate-500 italic">No hay materiales registrados</div>
                ) : (
                    materiales.map((m: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-[2fr_1fr_1.2fr_1.5fr] gap-3 p-3 border-b border-slate-200 last:border-b-0 break-inside-avoid avoid-break items-center text-[9pt]">
                            <div className="font-[700] text-slate-700 whitespace-pre-wrap break-words">{m.nombre || '-'}</div>
                            <div className="font-[600]">{m.peso} Kg</div>
                            <div className="font-[600] text-slate-500">{m.poderCalorifico} Mcal</div>
                            <div className="font-[800] text-slate-900">{Math.round(m.calorTotal || m.totalKcal || 0).toLocaleString('es-AR')} Kcal</div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="mb-[2rem] break-inside-avoid avoid-break">
            <h3 className="text-[14pt] font-[900] m-[0_0_1rem_0] text-slate-800 flex items-center gap-[0.5rem] border-b-2 border-slate-300 pb-[0.4rem]">
                <ShieldCheck size={20} className="text-blue-500" /> Resultados del Cálculo Normativo
            </h3>
            <div className="grid grid-cols-[1.5fr_1fr_1.5fr] gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center text-center">
                    <div className="text-[8pt] font-[900] text-slate-500 uppercase mb-2">CARGA DE FUEGO (Qf)</div>
                    <div className="text-[24pt] font-[900] text-blue-600 tracking-tight leading-none">{(results?.cargaFuego || results?.cargaDeFuego || 0).toFixed(2)}</div>
                    <div className="text-[9pt] font-bold text-slate-500 mt-1">Kg Madera / m²</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center text-center">
                    <div className="text-[8pt] font-[900] text-slate-500 uppercase mb-2">RIESGO DOMINANTE</div>
                    <div className="text-[14pt] font-[900] text-slate-800 tracking-tight leading-tight">{riesgo || '-'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center text-center">
                    <div className="text-[8pt] font-[900] text-slate-500 uppercase mb-2">RESISTENCIA REQUERIDA</div>
                    <div className="text-[24pt] font-[900] text-orange-500 tracking-tight leading-none">{results?.resistenciaRequerida || results?.rfRequerida || '-'}</div>
                    <div className="text-[9pt] font-bold text-slate-500 mt-1">minutos (RF)</div>
                </div>
            </div>
        </div>

        <div className="mb-[2rem] break-inside-avoid avoid-break">
            <h3 className="text-[14pt] font-[900] m-[0_0_1rem_0] text-slate-800 flex items-center gap-[0.5rem] border-b-2 border-slate-300 pb-[0.4rem]">
                <Info size={20} className="text-slate-500" /> Exigencias de Extinción y Condiciones
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border-2 border-slate-200 rounded-lg">
                    <div className="font-[900] text-slate-800 mb-2 text-[10pt]">Extintores Portátiles</div>
                    <div className="text-slate-700 text-[9pt] leading-tight font-[600]">{results?.extincion?.descripcion || 'No especificado'}</div>
                    {results?.extincion?.condicion && (
                        <div className="mt-2 text-[8pt] font-bold text-blue-600 bg-blue-50 p-1 px-2 rounded inline-block">
                            Condición {results.extincion.condicion}
                        </div>
                    )}
                </div>
                <div className="p-4 border-2 border-emerald-200 bg-emerald-50 rounded-lg flex flex-col justify-center items-center text-center">
                    <div className="font-[900] text-emerald-900 mb-1 text-[10pt]">Matafuegos Calculados</div>
                    <div className="text-[28pt] font-[900] text-emerald-600 leading-none tracking-tight">{results?.cantidadMatafuegos || results?.minMatafuegos || 0}</div>
                    <div className="text-[8pt] font-[700] text-emerald-700 mt-1">Unidades tipo ABC requeridas (Mín. 2)</div>
                </div>
            </div>
        </div>

        {conclusion && (
            <div className="mb-[2rem] break-inside-avoid avoid-break">
                <h3 className="text-[14pt] font-[900] m-[0_0_1rem_0] text-slate-800 flex items-center gap-[0.5rem] border-b-2 border-slate-300 pb-[0.4rem]">
                    <FileText size={20} className="text-violet-500" /> Conclusión Profesional
                </h3>
                <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg text-violet-900 text-[10pt] leading-relaxed font-[600]">
                    {conclusion}
                </div>
            </div>
        )}

        <PdfSignatures data={data} />
        
        <div className="mt-[1rem] pt-[0.75rem] border-t border-slate-200 text-[7pt] text-slate-400 text-center font-[600]">
          Documento generado por Asistente HYS · {new Date().toLocaleDateString('es-AR')} · Uso exclusivo técnico-profesional
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}