import React, { useRef } from 'react';
import { ArrowLeft, Printer, Calendar, MapPin, CheckSquare, Clock, Users, Flame } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function DrillPdfGenerator({ report, onBack, isHeadless = false }: {report: any;onBack?: any;isHeadless?: boolean;}): React.ReactElement | null {


  const componentRef = useRef<HTMLDivElement>(null);


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {/* Header controls (not printed) */}
            <div className="no-print flex items-center justify-space-between mb-[1.5rem] z-[10] flex-wrap gap-[1rem]">
                <div className="flex items-center gap-[1rem]">
                    <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="m-[0] text-[1.5rem] font-[800]">Previsualización del Acta</h1>
                </div>
                <div className="flex gap-[0.8rem]">
                    <button onClick={handlePrint} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                        <Printer size={18} /> Imprimir / Exportar PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Area */}
            <div className="flex-[1] flex justify-center">
                <div
          id="pdf-content"
          className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] font-family-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]"
          ref={componentRef}>






          
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important;
                                margin: 0 !important;
                                padding: 10mm !important;
                                width: 100% !important;
                                max-width: none !important;
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important;
                            }
                            .company-logo {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                        `}
                    </style>

                    {/* Document Header */}
                    <div className="border-bottom-[3px_solid_#1e293b] pb-[1rem] mb-[1.5rem] flex justify-space-between items-start">
                        <div className="flex-[1]">
                            <h1 className="m-[0_0_0.5rem_0] text-[20pt] text-[#1e293b] font-[900] uppercase letter-spacing-[-0.5px]">
                                ACTA DE SIMULACRO DE EVACUACIÓN
                            </h1>
                            <div className="flex gap-[1.5rem] text-[#475569] text-[10pt]">
                                <span className="flex items-center gap-[0.3rem]"><strong>Empresa:</strong> {report?.empresa || 'N/A'}</span>
                                <span className="flex items-center gap-[0.3rem]"><strong>Fecha:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}</span>
                            </div>
                        </div>
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px] ml-[20px]" />







            
                    </div>

                    <p className="text-[10pt] text-[#334155] text-justify mb-[20px] line-height-[1.6]">
                        En cumplimiento con la legislación vigente en materia de Higiene y Seguridad Laboral
                        y el Plan de Contingencias de la organización, se certifica la realización de un
                        simulacro práctico de evacuación, registrándose los siguientes parámetros estructurales y de comportamiento.
                    </p>

                    {/* Hipótesis and Timing */}
                    <div className="flex gap-[1rem] mb-[1.5rem]">
                        <div className="flex-[0_1_32%] border-[1px_solid_#cbd5e1] rounded-[6px]">
                            <div className="bg-[#f8fafc] p-[8px_12px] font-[bold] border-bottom-[1px_solid_#cbd5e1] text-[10pt] flex items-center gap-[0.4rem] text-[#1e293b]">
                                <Flame size={16} color="#ef4444" /> HIPÓTESIS DEL EVENTO
                            </div>
                            <div className="p-[12px] text-[10pt]">
                                <div className="mb-[8px]"><strong>Tipo de Emergencia:</strong> {report?.hipotesis || 'N/A'}</div>
                                <div><strong>Sector/Foco de Origen:</strong> {report?.origen || 'N/A'}</div>
                                <div className="mt-[8px]"><strong>Hora de Alarma:</strong> {report?.hora || '--:--'} hs</div>
                            </div>
                        </div>

                        <div className="flex-[0_1_32%] border-[1px_solid_#cbd5e1] rounded-[6px]">
                            <div className="bg-[#f8fafc] p-[8px_12px] font-[bold] border-bottom-[1px_solid_#cbd5e1] text-[10pt] flex items-center gap-[0.4rem] text-[#1e293b]">
                                <Clock size={16} color="#3b82f6" /> DESPLIEGUE TEMPORAL
                            </div>
                            <div className="p-[12px] text-center">
                                <div className="text-[9pt] text-[#64748b] uppercase font-[600]">Tiempo Total Evacuación</div>
                                <div className="text-[28pt] font-[900] text-[#dc2626] line-height-[1] m-[8px_0]">
                                    {report?.tiempoVisual || '00:00'}
                                </div>
                                <div className="text-[9pt] text-[#475569]">Minutos : Segundos</div>
                            </div>
                        </div>
                    </div>

                    {/* Población y Vías */}
                    <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px]">
                        <div className="bg-[#f1f5f9] p-[8px_12px] font-[bold] border-bottom-[1px_solid_#cbd5e1] text-[10pt] text-[#1e293b] flex items-center gap-[0.4rem]">
                            <Users size={16} color="#8b5cf6" /> POBLACIÓN Y ESTADÍSTICAS
                        </div>
                        <div className="p-[12px] grid grid-template-columns-[1fr_1fr] gap-[12px] text-[10pt]">
                            <div><strong>Personas Evacuadas:</strong> <span className="text-[12pt] font-[900]">{report?.evacuados || '-'}</span></div>
                            <div><strong>Heridos Simulados:</strong> <span style={{ color: (report?.heridosSimulados || 0) > 0 ? '#ef4444' : '#1e293b' }} className="text-[12pt] font-[900]">{report?.heridosSimulados || '0'}</span></div>
                            <div className="grid-column-[1_/_-1]">
                                <strong>Puntos de Encuentro Utilizados:</strong>
                                <p className="m-[4px_0_0_0] bg-[#f8fafc] p-[8px] border-left-[3px_solid_#cbd5e1] min-h-[30px]">
                                    {report?.puntosEncuentro || 'No registrados'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Evaluación Checklist */}
                    <div className="mb-[1.5rem]">
                        <div className="font-[bold] text-[11pt] text-[#1e293b] border-bottom-[2px_solid_#e2e8f0] pb-[4px] mb-[12px]">
                            EVALUACIÓN DEL DESEMPEÑO
                        </div>
                        <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[10pt]">
                            <tbody>
                                <tr className="avoid-break page-break-inside-[avoid]">
                                    <td className="border-[1px_solid_#cbd5e1] p-[8px] bg-[#f8fafc] w-[50%]">¿La alarma fue perfectamente audible en todos los sectores afectados?</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[8px] font-[bold] text-center">
                                        {report?.alarmaSonó === 'Sí' ? 'SÍ, Audible' : report?.alarmaSonó || '-'}
                                    </td>
                                </tr>
                                <tr className="avoid-break page-break-inside-[avoid]">
                                    <td className="border-[1px_solid_#cbd5e1] p-[8px] bg-[#f8fafc]">¿Se cumplieron los roles de emergencia (guías, líderes de encuentro)?</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[8px] font-[bold] text-center">
                                        {report?.rolCumplido || '-'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Observaciones */}
                    <div className="mb-[2rem]">
                        <div className="font-[bold] text-[11pt] text-[#1e293b] border-bottom-[2px_solid_#e2e8f0] pb-[4px] mb-[12px]">
                            OBSERVACIONES Y OPORTUNIDADES DE MEJORA
                        </div>
                        <div className="border-[1px_solid_#cbd5e1] rounded-[4px] p-[12px] min-h-[100px] text-[10pt] bg-[#fefce8] text-[#422006]">


              
                            {report?.observaciones ? report.observaciones : 'No se registraron observaciones o desvíos técnicos durante el ejercicio.'}
                        </div>
                    </div>

                    {/* Signatures Area */}
                    <PdfSignatures
            data={report}
            box1={report.showSignatures?.operator !== false ? {
              title: 'RESPONSABLE EVACUACIÓN',
              subtitle: 'Brigada / Responsable',
              signatureUrl: report.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={report.showSignatures?.professional !== false ? {
              title: 'PROFESIONAL H&S',
              subtitle: (report.professionalName || 'Firma de Especialista').toUpperCase(),
              signatureUrl: report.professionalSignature || null,
              stampUrl: report.professionalStamp || null,
              isProfessional: true,
              license: report.professionalLicense || null
            } : null}
            box3={report.showSignatures?.supervisor !== false ? {
              title: 'SUPERVISIÓN / CIERRE',
              subtitle: 'Aprobación de Simulacro',
              signatureUrl: report.supervisorSignature || report.signature || null,
              isProfessional: false
            } : null} />
          
            <PdfBrandingFooter />

                </div>
            </div>
        </div>);

}