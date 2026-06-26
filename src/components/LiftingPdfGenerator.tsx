import React from 'react';
import { Weight, AlertTriangle } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function LiftingPdfGenerator({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  const loadPercentage = parseFloat(data.loadWeight) / parseFloat(data.equipmentCapacity) * 100;
  const isCritical = loadPercentage >= 75;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[12px] box-sizing-[border-box] m-[0_auto] font-family-[system-ui,_-apple-system,_sans-serif]">







        
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
                            border-top: 12px solid #2563eb !important;
                            border-radius: 0 !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                    `}
                </style>

                {/* Header - Mejorado visualmente */}
                <div className="gradient-header p-[1.5rem] rounded-[12px] mb-[1.5rem] flex justify-space-between items-start text-[#ffffff]">







          
                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                            <div className="bg-[rgba(255,255,255,0.2)] p-[8px] rounded-[8px] backdrop-filter-[blur(10px)]">




                
                                <Crane size={28} color="#38bdf8" />
                            </div>
                            <div>
                                <h1 className="m-[0] text-[20pt] font-[900] uppercase letter-spacing-[-0.5px] line-height-[1]">






                  
                                    PLAN DE IZAJE SEGURO
                                </h1>
                                <p className="m-[4px_0_0_0] text-[9pt] text-[#cbd5e1] font-[600] uppercase letter-spacing-[1px]">






                  
                                    PERMISO DE TRABAJO CRÍTICO
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ml-[20px] flex-shrink-[0] text-right flex flex-col items-end gap-[0.4rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px] bg-[#ffffff] p-[8px] rounded-[8px] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)]" />










            
                        <div className="text-[0.55rem] font-[900] text-[#94a3b8] letter-spacing-[0.05em] uppercase">Doc. Controlado</div>
                    </div>
                </div>

                {/* Main Info */}
                <div style={{
          background: isCritical ? '#fef2f2' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',

          border: `1px solid ${isCritical ? '#fca5a5' : '#e2e8f0'}`





        }} className="p-[1.2rem] rounded-[10px] flex justify-space-between items-center mb-[1.5rem]">
                    <div>
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px]">UBICACIÓN / ÁREA</span>
                        <h2 className="m-[0.2rem_0] text-[16pt] font-[900] text-[#0f172a]">{data.location || 'N/A'}</h2>
                        <span className="text-[10pt] font-[700] text-[#334155]">Equipo: {data.equipment}</span>
                    </div>
                    <div className="text-right">
                        <span style={{
              background: isCritical ? '#ef4444' : '#10b981'







            }} className="text-[#ffffff] p-[0.5rem_1.2rem] rounded-[20px] font-[800] text-[9pt] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)] letter-spacing-[0.5px]">
                            {isCritical ? 'IZAJE CRÍTICO (>75%)' : 'IZAJE ESTÁNDAR'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[1rem] mb-[2rem]">




          
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">FECHA Y HORA</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.date ? new Date(data.date).toLocaleDateString('es-AR') : ''} {data.time}</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">VELOCIDAD DEL VIENTO</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.windSpeed} km/h</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">OPERADOR DEL EQUIPO</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.personnel?.operator || '-'}</span>
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">
                        <span className="text-[7.5pt] font-[800] text-[#64748b] block uppercase letter-spacing-[0.5px] mb-[4px]">RIGGER / SEÑALERO</span>
                        <span className="text-[11pt] font-[800] text-[#0f172a]">{data.personnel?.rigger || '-'}</span>
                    </div>
                </div>

                {/* Calculation */}
                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.8rem_1rem] text-[#ffffff]">
                        <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px] flex items-center gap-[0.5rem]">
                            <Weight size={18} /> CÁLCULO DE CARGA
                        </h3>
                    </div>
                    <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[10pt]">
                        <tbody>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                                <td className="border-bottom-[1px_solid_#e2e8f0] p-[0.8rem_1rem] font-[700] w-[60%] bg-[#f8fafc] text-[#334155]">Peso Total a Izar (Carga + Aparejos)</td>
                                <td className="border-bottom-[1px_solid_#e2e8f0] p-[0.8rem_1rem] text-right font-[800] text-[#0f172a]">{data.loadWeight} kg</td>
                            </tr>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                                <td className="border-bottom-[1px_solid_#e2e8f0] p-[0.8rem_1rem] font-[700] bg-[#f8fafc] text-[#334155]">Capacidad de la Grúa al Radio Máx</td>
                                <td className="border-bottom-[1px_solid_#e2e8f0] p-[0.8rem_1rem] text-right font-[800] text-[#0f172a]">{data.equipmentCapacity} kg</td>
                            </tr>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                                <td style={{ background: isCritical ? '#fee2e2' : '#f0fdf4', color: isCritical ? '#b91c1c' : '#16a34a' }} className="p-[0.8rem_1rem] font-[800]">Porcentaje de Capacidad de Uso</td>
                                <td style={{ background: isCritical ? '#fee2e2' : '#f0fdf4', color: isCritical ? '#b91c1c' : '#16a34a' }} className="p-[0.8rem_1rem] text-right font-[900] text-[11pt]">{loadPercentage ? loadPercentage.toFixed(1) : 0}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Checklist */}
                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px]">
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.8rem_1rem] text-[#ffffff]">
                        <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px]">
                            VERIFICACIÓN DE SEGURIDAD
                        </h3>
                    </div>
                    <ul className="list-style-[none] p-[0] m-[0] bg-[#ffffff]">
                        {[
            { key: 'groundStable', label: 'Terreno Firme y Nivelado (Apoyos extendidos al 100%)' },
            { key: 'areaIsolated', label: 'Área Delimitada y Señalizada' },
            { key: 'weatherGood', label: 'Condiciones Climáticas Favorables (Sin tormenta)' },
            { key: 'powerLinesClear', label: 'Distancia Segura a Líneas Eléctricas' },
            { key: 'elementsInspected', label: 'Elementos de Izaje Inspeccionados y Operativos' }].
            map((item, idx) => {
              const isChecked = data.checklist?.[item.key];
              return (
                <li key={idx} style={{

                  borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',





                  background: isChecked ? '#f8fafc' : '#ffffff'
                }} className="p-[0.8rem_1rem] flex items-center gap-[0.8rem] text-[9.5pt] text-[#334155]">
                                    <div style={{

                    background: isChecked ? '#10b981' : '#f1f5f9',
                    border: `1px solid ${isChecked ? '#10b981' : '#cbd5e1'}`

                  }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center">
                                        {isChecked && <span className="text-[#fff] text-[12px] line-height-[1]">✓</span>}
                                    </div>
                                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{item.label}</span>
                                </li>);

            })}
                    </ul>
                </div>

                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] bg-[#f8fafc]">
                    <span className="text-[8pt] font-[800] block mb-[0.5rem] text-[#64748b] uppercase letter-spacing-[0.5px]">OBSERVACIONES</span>
                    <p className="m-[0] text-[9.5pt] text-[#334155] line-height-[1.5]">{data.observations || 'Sin observaciones.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'OPERADOR DEL EQUIPO',
            subtitle: (data.personnel?.operator || 'Firma del Operador').toUpperCase(),
            signatureUrl: data.operatorSignature || data.signatures?.operator || null,
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
            title: 'SUPERVISOR DE IZAJE',
            subtitle: (data.personnel?.supervisor || 'Firma del Supervisor').toUpperCase(),
            signatureUrl: data.supervisorSignature || data.signatures?.supervisor || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />

            </div>
        </div>);

}