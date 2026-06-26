import React from 'react';
import { Timer, Users, Target } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function EvacuationPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                    `}
                </style>

                {/* Modern Gradient Header */}
                <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] m-[-15mm_-15mm_15mm_-15mm] p-[15mm] text-[white] flex justify-space-between items-center border-bottom-[4px_solid_#38bdf8]">








          
                    <div className="flex items-center gap-[15px]">
                        <div className="bg-[rgba(56,_189,_248,_0.2)] p-[12px] rounded-[12px]">
                            <Timer size={32} color="#38bdf8" />
                        </div>
                        <div>
                            <h1 className="m-[0] text-[1.8rem] font-[900] letter-spacing-[-0.5px]">REPORTE TÉCNICO</h1>
                            <p className="m-[4px_0_0_0] text-[1rem] text-[#94a3b8] font-[600]">CÁLCULO TEÓRICO DE EVACUACIÓN</p>
                        </div>
                    </div>
                    <div className="bg-[white] p-[10px] rounded-[8px]">
                        <CompanyLogo className="h-[50px] max-w-[150px] object-fit-[contain]" />
                    </div>
                </div>

                {/* Main Info */}
                <div className="bg-[#f8fafc] p-[1.2rem] border-[1px_solid_#e2e8f0] rounded-[12px] flex justify-space-between items-center mb-[1.5rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
                    <div>
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block letter-spacing-[1px]">SECTOR / EDIFICIO</span>
                        <h2 className="m-[4px_0] text-[1.6rem] font-[900] text-[#1e293b] uppercase">{data.sector || 'N/A'}</h2>
                    </div>
                    <div className="text-right bg-[#f1f5f9] p-[0.8rem_1.2rem] rounded-[8px] border-[1px_solid_#e2e8f0]">
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block letter-spacing-[1px] mb-[4px]">FECHA DE EVALUACIÓN</span>
                        <span className="font-[800] text-[#0f172a] text-[1.1rem]">{data.date ? new Date(data.date).toLocaleDateString('es-AR') : '-'}</span>
                    </div>
                </div>

                {/* Calculation Parameters */}
                <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[900] border-bottom-[2px_solid_#e2e8f0] pb-[0.5rem] text-[#0f172a]">
                    1. PARÁMETROS DE CÁLCULO UTILIZADOS
                </h3>
                <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[0.8rem] mb-[2rem]">
                    <div className="bg-[#f8fafc] p-[1rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">POBLACIÓN ESTIMADA (N)</span>
                        <span className="font-[900] text-[1.2rem] text-[#0f172a]">{data.peopleCount} <span className="text-[0.8rem] font-[600] text-[#64748b]">personas</span></span>
                    </div>
                    <div className="bg-[#f8fafc] p-[1rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">ANCHO DE SALIDAS (A)</span>
                        <span className="font-[900] text-[1.2rem] text-[#0f172a]">{data.exitWidth} <span className="text-[0.8rem] font-[600] text-[#64748b]">m</span></span>
                    </div>
                    <div className="bg-[#f8fafc] p-[1rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">DISTANCIA MÁX. (D)</span>
                        <span className="font-[900] text-[1.2rem] text-[#0f172a]">{data.maxDistance} <span className="text-[0.8rem] font-[600] text-[#64748b]">m</span></span>
                    </div>
                    <div className="bg-[#f8fafc] p-[1rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">VELOCIDAD MARCHA (V)</span>
                        <span className="font-[900] text-[1.2rem] text-[#0f172a]">{data.walkingSpeed} <span className="text-[0.8rem] font-[600] text-[#64748b]">m/s</span></span>
                    </div>
                    <div className="bg-[#f8fafc] p-[1rem] border-[1px_solid_#e2e8f0] rounded-[10px] grid-column-[1_/_-1]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">FLUJO ESPECÍFICO (k)</span>
                        <span className="font-[900] text-[1.2rem] text-[#0f172a]">{data.specificFlow} <span className="text-[0.8rem] font-[600] text-[#64748b]">personas / (m·s)</span></span>
                    </div>
                </div>

                {/* Results */}
                <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[900] border-bottom-[2px_solid_#e2e8f0] pb-[0.5rem] text-[#0f172a]">
                    2. RESULTADOS DEL CÁLCULO
                </h3>
                <div className="bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[12px] p-[1.5rem] mb-[2rem] flex flex-col gap-[1rem]">
                    
                    <div className="flex justify-space-between border-bottom-[1px_dashed_#cbd5e1] pb-[0.8rem]">
                        <span className="font-[700] text-[0.95rem] text-[#475569]">Tiempo de Desplazamiento Teórico (D / V)</span>
                        <span className="font-[900] text-[1.1rem] text-[#0f172a]">{data.travelTime} seg</span>
                    </div>
                    
                    <div className="flex justify-space-between border-bottom-[1px_dashed_#cbd5e1] pb-[0.8rem]">
                        <span className="font-[700] text-[0.95rem] text-[#475569]">Tiempo de Paso por Puertas (N / (A·k))</span>
                        <span className="font-[900] text-[1.1rem] text-[#0f172a]">{data.flowTime} seg</span>
                    </div>

                    <div className="flex justify-space-between items-center mt-[0.5rem] p-[1.2rem] bg-[#ecfdf5] rounded-[8px] border-[2px_solid_#a7f3d0]">
                        <span className="font-[900] text-[1.2rem] uppercase text-[#065f46]">Tiempo Total de Evacuación</span>
                        <span className="font-[900] text-[1.8rem] text-[#059669]">{data.calculatedTime} seg</span>
                    </div>
                </div>

                {/* Observations */}
                <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[900] border-bottom-[2px_solid_#e2e8f0] pb-[0.5rem] text-[#0f172a]">
                    3. CONCLUSIONES Y OBSERVACIONES
                </h3>
                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px] p-[1.2rem] min-h-[80px] bg-[#ffffff]">
                    <p className="m-[0] text-[0.9rem] text-[#334155] line-height-[1.5]">{data.observations || 'Sin observaciones registradas.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'EVALUADOR TÉCNICO',
            subtitle: (data.evaluator || 'Firma del Evaluador').toUpperCase(),
            signatureUrl: data.evaluatorSignature || data.signatures?.evaluator || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'PROFESIONAL H&S',
            subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: data.professionalSignature || null,
            stampUrl: data.professionalStamp || null,
            isProfessional: true,
            license: data.professionalLicense || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'RESPONSABLE SECTOR',
            subtitle: 'Firma de Responsable',
            signatureUrl: data.supervisorSignature || data.signatures?.manager || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />

                <div className="text-center mt-[2rem] text-[0.65rem] text-[#94a3b8] border-top-[1px_solid_#e2e8f0] pt-[0.5rem]">
                    Documento generado por Asistente HYS | simulador teórico de evacuación basado en modelos estándar de dinámica peatonal.
                </div>
            </div>
        </div>);

}