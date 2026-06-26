import React from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import { Flame, Calendar, Info, CheckCircle2, AlertTriangle, Crosshair, Package } from 'lucide-react';

const EXTINTOR_INFO: Record<string, {name: string;fires: string;color: string;icon: string;usage: string;}> = {
  'ABC': {
    name: 'Extintor HCFC',
    fires: 'Clase A (sólidos), B (líquidos), C (eléctricos)',
    color: '#ef4444',
    icon: '🧯',
    usage: 'Presionar palanca, apuntar a la base del fuego'
  },
  'CO2': {
    name: 'Extintor CO2 (Anhídrido Carbónico)',
    fires: 'Clase B (líquidos), C (eléctricos)',
    color: '#3b82f6',
    icon: '❄️',
    usage: 'Ideal para equipos eléctricos y electrónicos'
  },
  'Agua': {
    name: 'Extintor de Agua',
    fires: 'Clase A (sólidos: madera, papel, tela)',
    color: '#10b981',
    icon: '💧',
    usage: 'NO usar en fuegos eléctricos o líquidos'
  },
  'Espuma': {
    name: 'Extintor de Espuma',
    fires: 'Clase A y B (líquidos inflamables)',
    color: '#f59e0b',
    icon: '🫧',
    usage: 'Forma capa sobre líquidos inflamables'
  },
  'K': {
    name: 'Extintor Clase K',
    fires: 'Aceites y grasas de cocina',
    color: '#8b5cf6',
    icon: '🍳',
    usage: 'Específico para cocinas industriales'
  }
};

export default function ExtinguisherAIPdfGenerator({ item }: {item: any;}): React.ReactElement | null {
  if (!item) return null;

  const info = item.type && EXTINTOR_INFO[item.type] ? EXTINTOR_INFO[item.type] : {
    name: item.type || 'Extintor Desconocido',
    fires: 'Clase no especificada',
    color: '#64748b',
    icon: '🧯',
    usage: 'Verificar especificaciones'
  };

  const isVigente = item.status === 'vigente';
  const confidencePercent = item.confidence ? Math.round(item.confidence * 100) : 0;

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] font-family-[system-ui,_-apple-system,_sans-serif]">







        
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
                    `}
                </style>

                {/* Header */}
                <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[1.5rem] rounded-[12px] mb-[1.5rem] flex justify-space-between items-start text-[#ffffff]">








          
                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                            <Flame size={24} color="#ef4444" />
                            <h1 className="m-[0] text-[18pt] font-[900] uppercase letter-spacing-[-0.5px]">
                                Inspección IA de Extintor
                            </h1>
                        </div>
                        <p className="m-[0_0_1rem_0] text-[9pt] text-[#cbd5e1] uppercase letter-spacing-[1px]">
                            Análisis visual automatizado
                        </p>
                        <div className="flex gap-[1.5rem] flex-wrap">
                            <span className="flex items-center gap-[0.3rem] text-[9pt]">
                                <Calendar size={14} color="#94a3b8" /> 
                                <strong className="text-[#ef4444]">Fecha:</strong> {item.date ? new Date(item.date).toLocaleDateString('es-AR') : 'N/A'}
                            </span>
                            <span className="flex items-center gap-[0.3rem] text-[9pt]">
                                <Crosshair size={14} color="#94a3b8" /> 
                                <strong className="text-[#ef4444]">Confianza IA:</strong> {confidencePercent}%
                            </span>
                        </div>
                    </div>
                    
                    <div className="ml-[20px] flex-shrink-[0]">
                        <CompanyLogo className="h-[50px] max-w-[150px] bg-[#ffffff] p-[8px] rounded-[8px]" />
                    </div>
                </div>

                <div className="grid-2-cols gap-[1.5rem] grid grid-template-columns-[1fr_1fr] mb-[1.5rem]">
                    {/* Columna Izquierda: Foto */}
                    <div className="flex flex-col gap-[1rem]">
                        <div className="bg-[#f8fafc] border-[2px_dashed_#cbd5e1] rounded-[12px] p-[0.5rem] flex items-center justify-center min-h-[300px]">









              
                            {item.image ?
              <img src={item.image} alt="Extintor Capturado" className="w-[100%] h-[auto] rounded-[8px] object-fit-[contain] max-height-[400px]" /> :

              <div className="text-[#94a3b8] text-[9pt] text-center">Sin imagen disponible</div>
              }
                        </div>
                    </div>

                    {/* Columna Derecha: Resultados */}
                    <div className="flex flex-col gap-[1rem]">
                        
                        {/* Tipo de Extintor */}
                        <div style={{

              border: `2px solid ${info.color}`


            }} className="bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] rounded-[10px] p-[1.2rem]">
                            <div className="text-[8pt] text-[#64748b] font-[800] uppercase mb-[8px]">Tipo Identificado</div>
                            <div className="flex items-center gap-[0.5rem] mb-[4px]">
                                <span className="text-[18pt]">{info.icon}</span>
                                <div className="text-[14pt] font-[900] text-[#1e293b]">{info.name}</div>
                            </div>
                            <div className="text-[9pt] text-[#475569] font-[600]">Clases: {info.fires}</div>
                            {item.capacity &&
              <div className="flex items-center gap-[0.3rem] text-[9pt] text-[#475569] font-[600] mt-[8px]">
                                    <Package size={14} color="#94a3b8" /> Capacidad Estimada: {item.capacity}
                                </div>
              }
                        </div>

                        {/* Estado */}
                        <div style={{
              background: isVigente ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${isVigente ? '#22c55e' : '#ef4444'}`


            }} className="rounded-[10px] p-[1.2rem]">
                            <div className="text-[8pt] text-[#64748b] font-[800] uppercase mb-[8px]">Estado Operativo</div>
                            <div className="flex items-center gap-[0.5rem] mb-[8px]">
                                {isVigente ? <CheckCircle2 size={24} color="#16a34a" /> : <AlertTriangle size={24} color="#dc2626" />}
                                <div style={{ color: isVigente ? '#166534' : '#991b1b' }} className="text-[14pt] font-[900] uppercase">
                                    {isVigente ? 'VIGENTE' : 'VENCIDO / REVISIÓN'}
                                </div>
                            </div>
                            {item.lastCheck &&
              <div className="text-[8.5pt] text-[#475569] mt-[4px]"><strong>Último control:</strong> {new Date(item.lastCheck).toLocaleDateString('es-AR')}</div>
              }
                            {item.nextCheck &&
              <div className="text-[8.5pt] text-[#475569] mt-[4px]"><strong>Próximo control:</strong> {new Date(item.nextCheck).toLocaleDateString('es-AR')}</div>
              }
                            {item.phDate &&
              <div className="text-[8.5pt] text-[#3b82f6] mt-[4px]"><strong>Vencimiento P.H.:</strong> {new Date(item.phDate).toLocaleDateString('es-AR')}</div>
              }
                        </div>

                        {/* Recomendaciones */}
                        {item.recommendations && item.recommendations.length > 0 &&
            <div className="bg-[#eff6ff] border-[1px_solid_#bfdbfe] rounded-[10px] p-[1rem]">




              
                                <div className="text-[8pt] text-[#1d4ed8] font-[800] uppercase mb-[8px] flex items-center gap-[0.4rem]">
                                    <Info size={14} /> Recomendaciones
                                </div>
                                <ul className="m-[0] pl-[1.2rem] text-[8.5pt] text-[#1e3a8a] line-height-[1.5]">
                                    {item.recommendations.map((rec: string, i: number) =>
                <li key={i}>{rec}</li>
                )}
                                </ul>
                            </div>
            }
                        
                    </div>
                </div>

                {/* Signatures */}
                {(item.signature || item.inspectorName) &&
        <div className="mt-[2rem] flex justify-start gap-[4rem] pt-[2rem] border-top-[1px_solid_#e2e8f0] page-break-inside-[avoid]">







          
                        <div className="text-center w-[250px]">
                            {item.signature ?
            <img src={item.signature} alt="Firma Inspector" className="h-[80px] object-fit-[contain] mb-[0.5rem] border-bottom-[1px_solid_#cbd5e1]" /> :

            <div className="h-[80px] border-bottom-[1px_solid_#cbd5e1] mb-[0.5rem]"></div>
            }
                            <div className="text-[9pt] font-[800] text-[#334155] uppercase">
                                {item.inspectorName || 'Inspector'}
                            </div>
                            <div className="text-[8pt] text-[#64748b]">Firma del Inspector</div>
                        </div>
                    </div>
        }

                {/* Footer */}
                <div className="text-center mt-[2rem] pt-[1rem] border-top-[1px_solid_#e2e8f0] text-[7.5pt] text-[#94a3b8] line-height-[1.6]">







          
                    <div className="font-[800] text-[#64748b] uppercase letter-spacing-[1px] mb-[4px]">
                        Informe IA generado electrónicamente
                    </div>
                    <div>
                        {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString()} | 
                        Asistente H&S - Sistema de Gestión
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>);

}