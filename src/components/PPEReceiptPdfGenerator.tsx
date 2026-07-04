import React from 'react';
import CompanyLogo from './CompanyLogo';

export default function PPEReceiptPdfGenerator({ items = [] }: {items?: any[];}): React.ReactElement | null {
  // Plantilla estándar de Resolución 299/11 SRT (Argentina)
  return (
    <div className="w-full print:m-0 print:p-0">
            <div
        id="ppe-receipt-pdf"
        className="pdf-container print-area w-full p-[10mm_15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Arial,_Helvetica,_sans-serif]">

                <style type="text/css" media="print">
                    {`
                        @page { size: A4 landscape; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                        td, th { padding: 4px; border: 1px solid #000; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    `}
                </style>

                {/* Header Res 299/11 */}
                <div className="flex justify-space-between items-center mb-[15px]">
                    <div className="w-[150px]">
                        <CompanyLogo className="max-height-[60px] max-w-[100%] object-fit-[contain]" />
                    </div>
                    <div className="text-center flex-[1]">
                        <h2 className="m-[0] text-[11pt] font-[bold]">CONSTANCIA DE ENTREGA DE ROPA DE TRABAJO Y</h2>
                        <h2 className="m-[0] text-[11pt] font-[bold]">ELEMENTOS DE PROTECCIÓN PERSONAL</h2>
                        <p className="m-[5px_0_0_0] text-[8pt]">Resolución S.R.T. N° 299/11</p>
                    </div>
                    <div className="w-[150px] text-right text-[8pt]">
                        Hoja N°: 1 / 1
                    </div>
                </div>

                {/* Datos del Empleador y Trabajador */}
                <table className="w-[100%] table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] border-collapse-[collapse]">
                    <tbody>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td colSpan={2} className="bg-[#f0f0f0] font-[bold] text-center text-[8pt]">DATOS DEL EMPLEADOR</td>
                        </tr>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td className="w-[50%]">Razón Social:</td>
                            <td className="w-[50%]">C.U.I.T. N°:</td>
                        </tr>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td>Dirección:</td>
                            <td>Localidad / Provincia:</td>
                        </tr>
                    </tbody>
                </table>

                <table className="w-[100%] table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] border-collapse-[collapse]">
                    <tbody>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td colSpan={3} className="bg-[#f0f0f0] font-[bold] text-center text-[8pt]">DATOS DEL TRABAJADOR</td>
                        </tr>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td colSpan={2} className="w-[66%]">Apellido y Nombre:</td>
                            <td className="w-[34%]">D.N.I. N°:</td>
                        </tr>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td colSpan={3}>Puesto de Trabajo:</td>
                        </tr>
                    </tbody>
                </table>

                <p className="text-[8pt] text-justify mb-[10px] line-height-[1.3]">
                    Con la firma del presente documento el trabajador declara conocer los riesgos a los que está expuesto en su puesto de trabajo, y haber recibido información y capacitación respecto del uso adecuado, conservación, mantenimiento y cuidado de los elementos de protección personal provistos. El trabajador se compromete a utilizarlos durante la jornada laboral y a solicitar su reemplazo cuando los mismos se encuentren deteriorados o hayan perdido su capacidad de protección.
                </p>

                {/* Tabla de EPPs */}
                <table className="w-[100%] table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] border-collapse-[collapse]">
                    <thead>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#f0f0f0] text-[7pt] text-center">
                            <th className="w-[20%]">PRODUCTO / EPP</th>
                            <th className="w-[10%]">TIPO / MODELO</th>
                            <th className="w-[15%]">MARCA</th>
                            <th className="w-[15%]">CERTIFICACIÓN (Sello)</th>
                            <th className="w-[10%]">CANT.</th>
                            <th className="w-[15%]">FECHA ENTREGA</th>
                            <th className="w-[15%]">FIRMA TRABAJADOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(15)].map((_, i) =>
            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] h-[25px]" key={i}>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
            )}
                    </tbody>
                </table>

                {/* Firmas finales */}
                <div className="flex justify-space-between mt-[40px]">
                    <div className="w-[45%] text-center">
                        <div className="border-bottom-[1px_solid_#000] h-[40px] mb-[5px]"></div>
                        <span className="text-[8pt]">Firma del Trabajador</span>
                    </div>
                    <div className="w-[45%] text-center">
                        <div className="border-bottom-[1px_solid_#000] h-[40px] mb-[5px]"></div>
                        <span className="text-[8pt]">Firma Responsable Higiene y Seguridad / Empleador</span>
                    </div>
                </div>
                
                <div className="text-center mt-[20px] text-[7pt] text-[#666]">
                    Formulario generado mediante Asistente HYS - Modelo conforme Anexo I Resolución SRT 299/11
                </div>
            </div>
        </div>);

}