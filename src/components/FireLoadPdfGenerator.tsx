import React, { useRef } from 'react';
import { Flame, ShieldCheck, Info, FileText } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function FireLoadPdfGenerator({ data }: {data: any;}): React.ReactElement | null {

  if (!data) return null;

  const countryNorms = getCountryNormativa(data.pais || 'Argentina');
  const { empresa, obra, fecha, sector, superficie, riesgo, materiales, results, conclusion } = data;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">







        
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
                            border-radius: 0 !important;
                            min-height: 0 !important;
                            height: auto !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                <div className="flex justify-space-between items-center border-bottom-[3px_solid_#e2e8f0] pb-[1rem] mb-[2rem]">
                    <div className="flex-[1]">
                        <h1 className="m-[0] text-[1.8rem] font-[900] text-[#1e293b] letter-spacing-[-0.5px]">ESTUDIO DE CARGA DE FUEGO</h1>
                        <p className="m-[0] text-[1rem] font-[700] text-[#f97316]">CÁLCULO Y RESULTADOS</p>
                    </div>
                    <div className="flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[50px] w-[auto] object-fit-[contain] max-w-[150px]" />






            
                        <div className="text-right">
                            <div className="text-[0.75rem] font-[800] text-[#64748b]">SISTEMA DE GESTIÓN HYS</div>
                            <div className="font-[800] text-[#1e293b]">{countryNorms.fire}</div>
                        </div>
                    </div>
                </div>

                <div className="border-[2px_solid_#e2e8f0] rounded-[10px] mb-[2rem] page-break-inside-[avoid]">
                    <div className="grid grid-template-columns-[1.5fr_1fr] border-bottom-[2px_solid_#e2e8f0]">
                        <div className="p-[0.8rem] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">EMPRESA / CLIENTE</span>
                            <span className="font-[800] text-[0.95rem]">{empresa || '-'}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#e2e8f0] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">OBRA / UBICACIÓN</span>
                            <span className="font-[800] text-[0.95rem]">{obra || '-'}</span>
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1fr_1fr]">
                        <div className="p-[0.8rem] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">FECHA DE ESTUDIO</span>
                            <span className="font-[800] text-[0.95rem]">{new Date(fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#e2e8f0] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">SECTOR EVALUADO</span>
                            <span className="font-[800] text-[0.95rem]">{sector || '-'}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#e2e8f0] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">SUPERFICIE</span>
                            <span className="font-[800] text-[0.95rem]">{superficie || 0} m²</span>
                        </div>
                    </div>
                </div>

                <div className="mb-[2rem]">
                    <h3 className="text-[1.1rem] font-[900] m-[0_0_1rem_0] text-[#1e293b] flex items-center gap-[0.5rem]">
                        <Flame size={20} color="#f97316" /> Inventario de Materiales Combustibles
                    </h3>
                    <div className="border-[2px_solid_#e2e8f0] rounded-[10px]">
                        <div className="grid grid-template-columns-[2fr_1fr_1.2fr_1.5fr] bg-[#f8fafc] p-[0.8rem] border-bottom-[2px_solid_#e2e8f0] font-[800] text-[0.75rem] text-[#64748b]">
                            <div>Material</div>
                            <div>Peso (Kg)</div>
                            <div>Calor (Mcal/Kg)</div>
                            <div>Total Kcal</div>
                        </div>
                        {!materiales || materiales.length === 0 ?
            <div className="p-[1rem] text-center text-[#64748b] font-style-[italic]">No hay materiales registrados</div> :

            materiales.map((m, idx) =>
            <div key={idx} style={{ borderBottom: idx === materiales.length - 1 ? 'none' : '1px solid #f1f5f9' }} className="grid grid-template-columns-[2fr_1fr_1.2fr_1.5fr] gap-[0.8rem] p-[0.8rem] page-break-inside-[avoid]">
                                    <div className="font-[700] text-[#334155] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{m.nombre || '-'}</div>
                                    <div>{m.peso} Kg</div>
                                    <div>{m.poderCalorifico} Mcal/Kg</div>
                                    <div className="font-[700]">{Math.round(m.totalKcal || 0).toLocaleString()} Kcal</div>
                                </div>
            )
            }
                    </div>
                </div>

                <div className="mb-[2rem]">
                    <h3 className="text-[1.1rem] font-[900] m-[0_0_1rem_0] text-[#1e293b] flex items-center gap-[0.5rem]">
                        <ShieldCheck size={20} color="#2563eb" /> Resultados Finales del Cálculo
                    </h3>
                    <div className="flex gap-[1rem] mb-[1rem]">
                        <div className="flex-[1] bg-[#2563eb] text-[#ffffff] rounded-[10px] p-[1.5rem] text-center">
                            <div className="text-[0.8rem] opacity-[0.9] mb-[0.5rem] font-[700] uppercase">Carga de Fuego (Qf)</div>
                            <div className="text-[2.5rem] font-[900]">{(results?.cargaDeFuego || 0).toFixed(2)}</div>
                            <div className="text-[0.8rem] font-[600]">Kg de Madera Eq. / m²</div>
                        </div>
                        <div className="flex-[1] border-[2px_solid_#e2e8f0] rounded-[10px] p-[1.5rem] flex flex-col justify-center">
                            <div className="flex justify-space-between mb-[0.8rem] pb-[0.8rem] border-bottom-[1px_dotted_#cbd5e1]">
                                <span className="text-[#64748b] text-[0.85rem] font-[600]">Riesgo Dominante:</span>
                                <span className="font-[800] text-[#1e293b] text-[0.9rem]">{riesgo || '-'}</span>
                            </div>
                            <div className="flex justify-space-between">
                                <span className="text-[#64748b] text-[0.85rem] font-[600]">Resistencia (RF):</span>
                                <span className="font-[900] text-[#f97316] text-[0.9rem]">{results?.rfRequerida || '-'} minutos</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[1rem]">
                        <div className="flex-[0_1_32%] border-[1px_solid_#e2e8f0] rounded-[8px] p-[1rem] bg-[#f8fafc]">
                            <div className="flex items-center gap-[0.5rem] mb-[0.8rem] text-[#1e293b] font-[800] text-[0.85rem]">
                                <Info size={16} /> Data Técnica
                            </div>
                            <div className="flex justify-space-between text-[0.75rem] mb-[0.4rem] text-[#475569]">
                                <span>Poder Calorífico Total:</span>
                                <span className="font-[700]">{Math.round(results?.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                            </div>
                            <div className="flex justify-space-between text-[0.75rem] text-[#475569]">
                                <span>Madera Equivalente:</span>
                                <span className="font-[700]">{(results?.maderaEquivalente || 0).toFixed(2)} Kg</span>
                            </div>
                        </div>
                        <div className="flex-[1] border-[2px_solid_#bfdbfe] rounded-[8px] p-[1rem] bg-[#eff6ff]">
                            <div className="flex items-center gap-[0.5rem] mb-[0.8rem] text-[#1d4ed8] font-[800] text-[0.85rem]">
                                <ShieldCheck size={16} /> Requisitos Extinción
                            </div>
                            <div className="flex justify-space-between text-[0.8rem] text-[#1e40af] page-break-inside-[avoid]">
                                <span>Min. Matafuegos:</span>
                                <span className="font-[900]">{results?.minMatafuegos || 0} u. (ABC)</span>
                            </div>
                            <div className="text-[0.65rem] mt-[0.5rem] opacity-[0.8] font-style-[italic] text-[#1e3a8a]">
                                * Cálculo base 1 unidad c/200m², mín. 2
                            </div>
                        </div>
                    </div>
                </div>

                {conclusion &&
        <div className="page-break-inside-[avoid] border-[1px_solid_#e2e8f0] rounded-[10px] p-[1.2rem] bg-[#fafafa] mb-[2rem]">
                        <h3 className="m-[0_0_0.8rem_0] flex items-center gap-[0.5rem] text-[1rem] text-[#1e293b] font-[800]">
                            <FileText size={18} color="#2563eb" /> Conclusión Profesional
                        </h3>
                        <div className="text-[0.85rem] text-[#334155] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere] line-height-[1.5]">
                            {conclusion}
                        </div>
                    </div>
        }

                <PdfSignatures data={data} />
            <PdfBrandingFooter />
            </div>
        </div>);

}