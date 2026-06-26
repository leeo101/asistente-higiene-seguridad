import React, { useRef } from 'react';
import { ArrowLeft, Printer, Users, Calendar, MapPin, Clock, BookOpen, Briefcase, GraduationCap } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function TrainingPdfGenerator({ data, onBack = () => window.history.back(), isHeadless = false }: {data: any;onBack?: () => void;isHeadless?: boolean;}): React.ReactElement | null {
  const training = data;
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isLandscape = (training?.asistentes?.length || 0) > 20;

  // Obtención segura de firma desde personalData
  let actSignature = null;
  let actStamp = null;
  let actName = training?.expositor || null;
  let actLic = null;

  try {
    const lsPersonal = localStorage.getItem('personalData');
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');

    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      actSignature = parsed.signature;
      actStamp = parsed.stamp;
    } else if (legacySig) {
      actSignature = legacySig;
    }

    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      if (!actName || actName === pd.name) {
        actName = pd.name;
        actLic = pd.license;
      }
    }
  } catch (e) {}

  return (
    <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {/* Header controls (not printed) */}
            <div className="no-print flex items-center justify-space-between mb-[1.5rem] z-[10] flex-wrap gap-[1rem]">
                <div className="flex items-center gap-[1rem]">
                    <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="m-[0] text-[1.5rem] font-[800]">Previsualización de Planilla</h1>
                </div>
                <div className="flex gap-[0.8rem]">
                    <button onClick={handlePrint} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                        <Printer size={18} /> Imprimir / Exportar PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Area */}
            <div className="flex-[1] flex justify-center overflow-x-[auto]">
                <div
          id="pdf-content"
          className="pdf-container print-area p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif] border-top-[12px_solid_#2563eb]"
          ref={componentRef}
          style={{
            width: isLandscape ? '297mm' : '210mm',
            minHeight: isLandscape ? '210mm' : '297mm'





          }}>
          
                    <style type="text/css" media="print">
                        {`
                            @page {
                                size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                                margin: 10mm;
                            }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important; margin: 0 !important; padding: 5mm !important; 
                                width: 100% !important; max-width: none !important; 
                                border-top: 12px solid #2563eb !important; border-radius: 0 !important; 
                                min-height: auto !important; height: auto !important;
                            }
                        `}
                    </style>

                    {/* Header Sequence */}
                    <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.8rem] w-[100%]">
                        <div className="flex-[1] text-left">
                            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                            <p className="m-[0] font-[900] text-[0.8rem] uppercase text-[#2563eb]">Doc. Reg. Capacitación</p>
                        </div>

                        <div className="flex-[2] flex flex-col items-center justify-center text-center">
                            <h1 className="m-[0] font-[900] text-[2.2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">ENTRENAMIENTO</h1>
                            <div className="mt-[0.3rem] bg-[#3b82f6] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                                PLANILLA OFICIAL DE ASISTENCIA
                            </div>
                        </div>

                        <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                            <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />

              
                        </div>
                    </div>

                    {/* Datos de la Capacitación */}
                    <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.5rem] w-[100%]">
                        <div className="p-[1rem] bg-[#f8fafc] border-bottom-[1px_solid_#cbd5e1]">
                            <span className="text-[0.65rem] font-[800] text-[#3b82f6] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                                <GraduationCap size={14} /> TEMA DICTADO
                            </span>
                            <div className="font-[900] text-[1.3rem] text-[#0f172a] mt-[0.4rem] line-break-[anywhere]">{training.tema || '-'}</div>
                        </div>
                        
                        <div className="grid grid-template-columns-[repeat(4,_1fr)] bg-[#ffffff]">
                            <div className="p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1] border-bottom-[1px_solid_#cbd5e1]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{training?.fecha ? new Date(training.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}</div>
                            </div>
                            <div className="p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1] border-bottom-[1px_solid_#cbd5e1]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Clock size={12} /> DURACIÓN</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{training.duracion || 0} Horas</div>
                            </div>
                            <div className="p-[0.8rem_1rem] border-right-[1px_solid_#cbd5e1] border-bottom-[1px_solid_#cbd5e1]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> LOCACIÓN</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{training.ubicacion || 'No esp.'}</div>
                            </div>
                            <div className="p-[0.8rem_1rem] border-bottom-[1px_solid_#cbd5e1]">
                                <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Briefcase size={12} /> EMPRESA / RAZÓN SOCIAL</span>
                                <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem] white-space-[nowrap] text-overflow-[ellipsis]">{training.empresa || 'Aplicable al sitio'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Texto Legal */}
                    <div className="mb-[1.5rem] bg-[#f1f5f9] border-left-[4px_solid_#94a3b8] p-[1rem] rounded-[4px]">
                        <p className="m-[0] text-[0.8rem] text-[#334155] line-height-[1.5] font-style-[italic] font-[600]">
                            Los abajo firmantes declaran haber recibido, comprendido e internalizado la capacitación técnica impartida en materia de Higiene y Seguridad Laboral 
                            sobre el tema detallado arriba, recibiendo respuesta satisfactoria a las consultas realizadas y comprometiéndose irrevocablemente a aplicar 
                            las normativas preventivas e instrucciones en sus labores diarias para salvaguardar su integridad física y la de sus compañeros.
                        </p>
                    </div>

                    {/* Tabla de Asistentes */}
                    <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[9pt] mb-[2rem]">
                        <thead>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#1e293b] text-[#ffffff]">
                                <th className="p-[0.6rem_0.4rem] w-[5%] text-center font-[800] border-[1px_solid_#0f172a]">N°</th>
                                <th className="p-[0.6rem_0.8rem] w-[30%] text-left font-[800] border-[1px_solid_#0f172a]">Apellido y Nombres</th>
                                <th className="p-[0.6rem_0.8rem] w-[15%] text-center font-[800] border-[1px_solid_#0f172a]">DNI / CUIL</th>
                                <th className="p-[0.6rem_0.8rem] w-[20%] text-left font-[800] border-[1px_solid_#0f172a]">Puesto de Trabajo</th>
                                <th className="p-[0.6rem_0.8rem] w-[15%] text-center font-[800] border-[1px_solid_#0f172a]">Nota / Eval.</th>
                                <th className="p-[0.6rem_0.8rem] w-[15%] text-center font-[800] border-[1px_solid_#0f172a]">Firma del Asistente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {training?.asistentes?.map((asist, idx) =>
              <tr className="avoid-break page-break-inside-[avoid]" key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.6rem_0.4rem] text-center text-[#64748b] font-[700]">{idx + 1}</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.6rem_0.8rem] font-[700] text-[#1e293b]">{asist.nombre}</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.6rem_0.8rem] text-center text-[#334155]">{asist.dni}</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.6rem_0.8rem] text-[#334155]">{asist.puesto}</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.6rem_0.8rem] text-center font-[800] text-[#0f172a]">{asist.nota || '-'}</td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[0.2rem_0.8rem] text-center vertical-align-[middle]">
                                        {asist.firma ? <img src={asist.firma} alt="Firma" className="max-height-[30px] max-w-[100%] object-fit-[contain]" /> : ''}
                                    </td>
                                </tr>
              )}
                            {/* Rendimiento de líneas vacías para rellenar */}
                            {Array.from({ length: Math.max(0, 5 - (training?.asistentes?.length || 0)) }).map((_, i) =>
              <tr className="avoid-break page-break-inside-[avoid]" key={`empty-${i}`}>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.4rem]"></td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.8rem]"></td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.8rem]"></td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.8rem]"></td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.8rem]"></td>
                                    <td className="border-[1px_solid_#cbd5e1] p-[1.2rem_0.8rem]"></td>
                                </tr>
              )}
                        </tbody>
                    </table>

                    {/* Area de Certificación final y firmas */}
                    <PdfSignatures
            data={training}
            box1={training.showSignatures?.operator ? {
              title: 'DELEGADO / ASISTENTE',
              subtitle: 'En representación de asistentes',
              signatureUrl: training.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={training.showSignatures?.professional ? {
              title: 'INSTRUCTOR / EXPOSITOR',
              subtitle: (actName || 'Firma de Especialista').toUpperCase(),
              signatureUrl: training.signature || actSignature || null,
              stampUrl: training.professionalStamp || actStamp || null,
              isProfessional: true,
              license: training.professionalLicense || actLic || null
            } : null}
            box3={training.showSignatures?.supervisor ? {
              title: 'SUPERVISIÓN / VERIFICADOR',
              subtitle: 'Verificación de Capacitación',
              signatureUrl: training.supervisorSignature || null,
              isProfessional: false
            } : null} />
          

                <PdfBrandingFooter />
                </div>
            </div>
        </div>);

}