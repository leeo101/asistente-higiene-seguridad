import React, { useRef } from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function TrainingExamPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);
  const preguntas = data.preguntas || [];

  return (
    <div id="pdf-content" className="pdf-container print-area w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#1e293b] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[Helvetica,_Arial,_sans-serif]" ref={componentRef}>
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                    .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; border-top: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                `}
            </style>

            {/* Header */}
            <div className="flex justify-space-between items-start border-bottom-[2px_solid_#e2e8f0] pb-[1rem] mb-[1.5rem]">
                <div>
                    <h2 className="m-[0_0_0.2rem_0] text-[#0f172a] text-[1.4rem] font-[900] uppercase">Evaluación de Capacitación</h2>
                    <p className="m-[0] text-[#64748b] text-[0.8rem] font-[600]">Cuestionario de Comprensión</p>
                </div>
                <CompanyLogo className="h-[35px] object-fit-[contain]" />
            </div>

            {/* Info Box */}
            <div className="border-[1px_solid_#cbd5e1] rounded-[8px] p-[1rem] mb-[1.5rem] bg-[#f8fafc]">
                <div className="grid grid-template-columns-[1fr_1fr] gap-[0.8rem]">
                    <div>
                        <span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">TEMA EVALUADO</span>
                        <div className="font-[800] text-[#0f172a] text-[0.95rem]">{data.tema || '-'}</div>
                    </div>
                    <div>
                        <span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">FECHA</span>
                        <div className="font-[800] text-[#0f172a] text-[0.95rem]">
                            {data.fecha ? new Date(data.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">INSTRUCTOR</span>
                        <div className="font-[800] text-[#0f172a] text-[0.95rem]">{data.expositor || '-'}</div>
                    </div>
                    <div>
                        <span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">EMPRESA</span>
                        <div className="font-[800] text-[#0f172a] text-[0.95rem]">{data.empresa || 'Aplicable al sitio'}</div>
                    </div>
                </div>
            </div>

            {/* Alumno Box */}
            <div className="border-[1px_solid_#0f172a] p-[1rem] mb-[2rem]">
                <div className="flex gap-[1rem] items-end">
                    <span className="font-[800] line-height-[1]">APELLIDO Y NOMBRES:</span>
                    <div className="flex-[1] border-bottom-[1px_solid_#64748b]"></div>
                </div>
                <div className="flex gap-[1rem] mt-[1rem]">
                    <div className="flex gap-[0.5rem] flex-[1] items-end">
                        <span className="font-[800] line-height-[1]">DNI:</span>
                        <div className="flex-[1] border-bottom-[1px_solid_#64748b]"></div>
                    </div>
                    <div className="flex gap-[0.5rem] flex-[1] items-end">
                        <span className="font-[800] line-height-[1]">PUESTO:</span>
                        <div className="flex-[1] border-bottom-[1px_solid_#64748b]"></div>
                    </div>
                </div>
            </div>

            {/* Preguntas */}
            <div className="mb-[3rem]">
                <h3 className="text-[1rem] text-[#0f172a] mb-[1.5rem] border-bottom-[1px_solid_#cbd5e1] pb-[0.5rem]">Desarrollo del Examen</h3>
                {preguntas.length > 0 ?
        preguntas.map((p: any, idx: number) =>
        <div key={idx} className="mb-[2rem]">
                            <p className="font-[700] m-[0_0_1rem_0] text-[0.95rem]">{idx + 1}. {p.texto}</p>
                            <div className="border-bottom-[1px_solid_#cbd5e1] mb-[1.5rem]"></div>
                            <div className="border-bottom-[1px_solid_#cbd5e1] mb-[1.5rem]"></div>
                            <div className="border-bottom-[1px_solid_#cbd5e1]"></div>
                        </div>
        ) :

        <div className="mb-[2rem]">
                        <p className="font-[700] m-[0_0_1rem_0]">1. </p>
                        <div className="border-bottom-[1px_solid_#cbd5e1] mb-[1.5rem]"></div>
                        <div className="border-bottom-[1px_solid_#cbd5e1] mb-[1.5rem]"></div>
                    </div>
        }
            </div>

            {/* Firma Alumno e Instructor */}
            <div className="flex justify-space-between mt-[4rem]">
                <div className="w-[40%] text-center">
                    <div className="border-top-[1px_solid_#0f172a] pt-[0.5rem]">
                        <p className="m-[0] font-[700] text-[0.8rem]">Firma del Evaluado</p>
                    </div>
                </div>
                <div className="w-[40%] text-center">
                    <div className="border-top-[1px_solid_#0f172a] pt-[0.5rem]">
                        <p className="m-[0] font-[700] text-[0.8rem]">Firma del Instructor</p>
                    </div>
                    <div className="absolute transform-[translateY(-120%)_translateX(20%)] opacity-[0.8]">
                        {data.signature && <img src={data.signature} alt="Firma" className="max-height-[60px]" />}
                        {data.professionalStamp && <img src={data.professionalStamp} alt="Sello" className="max-height-[60px] ml-[10px]" />}
                    </div>
                </div>
            </div>
            
            <div className="mt-[3rem]">
                <div className="border-[2px_solid_#0f172a] display-[inline-flex] items-end p-[0.5rem_1rem]">
                    <span className="font-[800] text-[1.1rem] line-height-[1]">NOTA / RESULTADO: </span>
                    <span className="inline-block w-[100px] border-bottom-[1px_solid_#0f172a] ml-[0.5rem]"></span>
                </div>
            </div>

            <PdfBrandingFooter />
        </div>);

}