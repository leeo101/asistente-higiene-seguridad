import React, { useRef } from 'react';
import { MapPin, Calendar, Clock, User, AlertCircle, AlertTriangle, ShieldCheck, Camera, FileText, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import { getCountryNormativa } from '../data/legislationData';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function StopCardPdfGenerator({ card }: {card: any;}): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);

  if (!card) return null;

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  const getTypeConfig = (type) => {
    switch (type) {
      case 'Condición Insegura':
        return {
          color: '#f59e0b',
          bg: '#fef3c7',
          bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '#f59e0b',
          icon: <AlertCircle size={32} strokeWidth={2.5} />,
          label: 'CONDICIÓN INSEGURA',
          iconBg: '#fef3c7'
        };
      case 'Acto Inseguro':
        return {
          color: '#ef4444',
          bg: '#fee2e2',
          bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '#ef4444',
          icon: <AlertTriangle size={32} strokeWidth={2.5} />,
          label: 'ACTO INSEGURO',
          iconBg: '#fee2e2'
        };
      case 'Casi Accidente':
        return {
          color: '#dc2626',
          bg: '#fef2f2',
          bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '#dc2626',
          icon: <AlertTriangle size={32} strokeWidth={2.5} />,
          label: 'CASI ACCIDENTE',
          iconBg: '#fef2f2'
        };
      case 'Acto Seguro':
        return {
          color: '#10b981',
          bg: '#d1fae5',
          bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          border: '#10b981',
          icon: <ShieldCheck size={32} strokeWidth={2.5} />,
          label: 'ACTO SEGURO',
          iconBg: '#d1fae5'
        };
      default:
        return {
          color: '#3b82f6',
          bg: '#dbeafe',
          bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '#3b82f6',
          icon: <AlertCircle size={32} strokeWidth={2.5} />,
          label: 'OBSERVACIÓN',
          iconBg: '#dbeafe'
        };
    }
  };

  const typeConfig = getTypeConfig(card.type);

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="stop-card-pdf-content"
        className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[12px] box-sizing-[border-box] m-[0_auto] font-family-[system-ui,_-apple-system,_sans-serif]"
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
                            border-top: 12px solid #2563eb !important;
                            border-radius: 0 !important;
                        }
                        .signature-container-row {
                            display: flex !important;
                            flex-direction: row !important;
                            justify-content: space-between !important;
                            align-items: flex-start !important;
                            gap: 1.5rem !important;
                            width: 100% !important;
                        }
                        .signature-item-box {
                            flex: 1 !important;
                            max-width: none !important;
                            padding: 1.2rem !important;
                            margin-top: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            border-radius: 12px !important;
                            text-align: center !important;
                        }
                        .signature-line {
                            width: 100% !important;
                            border-bottom: 2px solid #cbd5e1 !important;
                            margin-bottom: 0.8rem !important;
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




                
                                <AlertCircle size={28} color="#fbbf24" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="m-[0] text-[20pt] font-[900] uppercase letter-spacing-[-0.5px] line-height-[1]">






                  
                                    TARJETA STOP
                                </h1>
                                <p className="m-[4px_0_0_0] text-[9pt] text-[#cbd5e1] font-[600] uppercase letter-spacing-[1px]">






                  
                                    Programa de Seguridad Basada en el Comportamiento
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ml-[20px] flex-shrink-[0] text-right flex flex-col items-end gap-[0.4rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px] bg-[#ffffff] p-[8px] rounded-[8px] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)]" />










            
                        <div className="text-[0.55rem] font-[900] text-[#94a3b8] letter-spacing-[0.05em] uppercase">Doc. Controlado</div>
                    </div>
                </div>

                {/* Classification Box - Mejorado visualmente */}
                <div style={{




          background: typeConfig.bgGradient,

          border: `2px solid ${typeConfig.border}`


        }} className="flex items-stretch gap-[1.5rem] p-[1.5rem] rounded-[12px] mb-[2rem] box-shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-center bg-[#ffffff] rounded-[12px] p-[1rem] min-width-[80px] box-shadow-[0_2px_8px_rgba(0,0,0,0.1)]">








            
                        <div style={{ color: typeConfig.color }}>
                            {typeConfig.icon}
                        </div>
                    </div>
                    <div className="flex-[1] flex flex-col justify-center">
                        <div className="text-[9pt] text-[#64748b] font-[700] uppercase letter-spacing-[1px] mb-[6px]">






              
                            📋 Clasificación del Hallazgo
                        </div>
                        <div style={{


              color: typeConfig.color



            }} className="text-[22pt] font-[900] m-[0] line-height-[1.2] uppercase">
                            {card.type}
                        </div>
                    </div>
                </div>

                {/* Details Grid - Mejorado visualmente */}
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(250px,_1fr))] gap-[1rem] mb-[2rem]">




          
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] flex items-start gap-[0.8rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">







            
                        <div className="bg-[#3b82f6] text-[#ffffff] p-[8px] rounded-[8px] flex items-center justify-center">







              
                            <MapPin size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex-[1]">
                            <div className="text-[8.5pt] text-[#64748b] font-[700] uppercase letter-spacing-[0.5px] mb-[4px]">






                
                                📍 Ubicación / Área
                            </div>
                            <div className="text-[11pt] text-[#0f172a] font-[700] line-height-[1.3]">




                
                                {card.location}
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-[1px_solid_#e2e8f0] rounded-[10px] p-[1rem] flex items-start gap-[0.8rem] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]">







            
                        <div className="bg-[#10b981] text-[#ffffff] p-[8px] rounded-[8px] flex items-center justify-center">







              
                            <Calendar size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex-[1]">
                            <div className="text-[8.5pt] text-[#64748b] font-[700] uppercase letter-spacing-[0.5px] mb-[4px]">






                
                                📅 Fecha y Hora
                            </div>
                            <div className="text-[11pt] text-[#0f172a] font-[700] line-height-[1.3]">




                
                                {new Date(card.date).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                                <div className="text-[9pt] text-[#64748b] font-[600] mt-[2px]">
                                    ⏰ {card.time}hs
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description - Mejorado visualmente */}
                <div className="mb-[2rem] border-[1px_solid_#e2e8f0] rounded-[10px]">




          
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.8rem_1rem] flex items-center gap-[0.5rem] text-[#ffffff]">






            
                        <FileText size={18} strokeWidth={2.5} />
                        <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px]">





              
                            Descripción de la Observación
                        </h3>
                    </div>
                    <div className="p-[1.2rem] bg-[#ffffff] text-[#334155] text-[10.5pt] line-height-[1.7] border-[1px_solid_#e2e8f0] border-top-[none] rounded-[0_0_10px_10px]">








            
                        {card.description}
                    </div>
                </div>

                {/* Immediate Action - Mejorado visualmente */}
                {card.actionTaken &&
        <div className="mb-[2rem] border-[1px_solid_#86efac] rounded-[10px]">




          
                        <div className="bg-[linear-gradient(135deg,_#16a34a_0%,_#22c55e_100%)] p-[0.8rem_1rem] flex items-center gap-[0.5rem] text-[#ffffff]">






            
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                            <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px]">





              
                                ✅ Acción Inmediata Tomada
                            </h3>
                        </div>
                        <div className="p-[1.2rem] bg-[#f0fdf4] text-[#166534] text-[10.5pt] line-height-[1.7] border-[1px_solid_#86efac] border-top-[none] rounded-[0_0_10px_10px]">








            
                            {card.actionTaken}
                        </div>
                    </div>
        }

                {/* Photographic Evidence - Mejorado visualmente */}
                {card.photoBase64 &&
        <div className="mb-[2rem] page-break-inside-[avoid] border-[1px_solid_#e2e8f0] rounded-[10px]">





          
                        <div className="bg-[linear-gradient(135deg,_#7c3aed_0%,_#8b5cf6_100%)] p-[0.8rem_1rem] flex items-center gap-[0.5rem] text-[#ffffff]">






            
                            <Camera size={18} strokeWidth={2.5} />
                            <h3 className="m-[0] text-[10.5pt] font-[800] uppercase letter-spacing-[0.5px]">





              
                                📸 Evidencia Fotográfica
                            </h3>
                        </div>
                        <div className="p-[1rem] bg-[#f8fafc] border-bottom-[1px_solid_#e2e8f0] rounded-[0_0_10px_10px]">




            
                            <div className="w-[100%] max-w-[450px] h-[320px] rounded-[8px] border-[2px_solid_#cbd5e1] m-[0_auto] bg-[#f1f5f9] box-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">









              
                                <img
                src={card.photoBase64}
                alt="Evidencia" className="w-[100%] h-[100%] object-fit-[contain] bg-[#ffffff]" />






              
                            </div>
                        </div>
                    </div>
        }

                {/* Footer Signature - Mejorado visualmente */}
                <PdfSignatures data={card} />
            <PdfBrandingFooter />
                </div>
            </div>);

}