import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, ThermometerSun, Info, Droplets, Wind, Sun, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCountryNormativa } from '../data/legislationData';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import CompanyLogo from './CompanyLogo';

export default function ThermalStressPdfGenerator({ data, onBack = () => window.history.back(), isHeadless = false }: {data: any;onBack?: () => void;isHeadless?: boolean;}): React.ReactElement | null {
  const report = data;
  const [logoData, setLogoData] = useState({ companyLogo: null, showLogo: true });

  useEffect(() => {
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
    setLogoData({ companyLogo, showLogo });
  }, []);

  const { companyLogo, showLogo } = logoData;

  const componentRef = useRef<HTMLDivElement>(null);


  const handlePrint = () => {
    window.print();
  };

  const isAdmisible = report?.resultados?.admisible;

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  // Obtención segura de firma profesional desde localStorage
  let actSignature = report?.professionalSignature || null;
  let actStamp = report?.professionalStamp || null;
  let actName = report?.professionalName || null;
  let actLic = report?.professionalLicense || null;

  if (!actSignature) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {actSignature = legacySig;}
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  // Formatting helpers
  const getRitmoName = (rtm) => {
    if (rtm === 'liviano') return { name: 'Liviana', desc: 'Trabajo en banco, sentado', icon: 'ðŸª‘' };
    if (rtm === 'moderado') return { name: 'Moderada', desc: 'Trabajo de pie, caminar con peso', icon: 'ðŸš¶' };
    if (rtm === 'pesado') return { name: 'Pesada', desc: 'Trabajo intenso con pico/pala', icon: 'â›ï¸' };
    return { name: rtm, desc: '', icon: 'â“' };
  };

  const getCicloName = (ccl) => {
    if (ccl === 'continuo') return 'Continuo (Hasta 25% descanso/hr)';
    if (ccl === '75_25') return '75% Trabajo, 25% Descanso';
    if (ccl === '50_50') return '50% Trabajo, 50% Descanso';
    if (ccl === '25_75') return '25% Trabajo, 75% Descanso';
    return ccl;
  };

  const ritmoInfo = getRitmoName(report?.ritmo);

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container card print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] font-family-[system-ui,_-apple-system,_sans-serif]"
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
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                        .gradient-header, .gradient-header * {
                            color: #ffffff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .metric-card {
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        }
                        .pdf-important-text {
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Document Header - Mejorado visualmente */}
                <div className="gradient-header p-[1.5rem] rounded-[12px] mb-[1.5rem] flex justify-space-between items-start text-[#ffffff]">







          
                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                            <ThermometerSun size={24} color="#fbbf24" />
                            <h1 className="m-[0] text-[18pt] font-[900] uppercase letter-spacing-[-0.5px]">
                                Informe de Estrés Térmico
                            </h1>
                        </div>
                        <p className="m-[0_0_1rem_0] text-[9pt] text-[#cbd5e1] uppercase letter-spacing-[1px]">
                            Índice TGBH (Temperatura Globo Bulbo Húmedo)
                        </p>
                        <div className="flex gap-[1.5rem] flex-wrap">
                            <span className="flex items-center gap-[0.3rem] text-[9pt]">
                                <MapPin size={14} color="#94a3b8" /> 
                                <strong className="text-[#fbbf24]">Sector:</strong> {report?.sector || 'N/A'}
                            </span>
                            <span className="flex items-center gap-[0.3rem] text-[9pt]">
                                <Calendar size={14} color="#94a3b8" /> 
                                <strong className="text-[#fbbf24]">Fecha:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="ml-[20px] flex-shrink-[0]">
                        <CompanyLogo className="h-[50px] max-w-[150px] bg-[#ffffff] p-[8px] rounded-[8px]" />
                    </div>
                </div>

                {/* Base Legal */}
                <div className="mb-[1.5rem] p-[1rem] bg-[linear-gradient(135deg,_#eff6ff_0%,_#dbeafe_100%)] border-[1px_solid_#bfdbfe] border-left-[4px_solid_#2563eb] rounded-[8px]">






          
                    <div className="flex items-start gap-[0.8rem]">
                        <Info size={20} color="#2563eb" className="flex-shrink-[0] mt-[2px]" />
                        <p className="m-[0] text-[9.5pt] text-[#1e3a8a] line-height-[1.5] text-justify">
                            El presente documento certifica la evaluación de las condiciones de carga térmica en el puesto de trabajo detallado,
                            realizada conforme a la estimación del <strong>TGBH (Índice de Temperatura Globo Bulbo Húmedo)</strong> y contrastado 
                            con los límites permisibles establecidos en <strong>{countryNorms.thermal}</strong> ({countryNorms.general}).
                        </p>
                    </div>
                </div>

                {/* Section 1: Puesto y Metadatos */}
                <div className="mb-[1.5rem]">
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.6rem_1rem] font-[800] text-[#ffffff] text-[10.5pt] rounded-[8px_8px_0_0] flex items-center gap-[0.5rem]">









            
                        <span className="bg-[#fbbf24] text-[#1e293b] w-[24px] h-[24px] rounded-[50%] flex items-center justify-center text-[9pt] font-[900]">1</span>
                        IDENTIFICACIÓN DEL PUESTO
                    </div>
                    <div className="border-[1px_solid_#e2e8f0] border-top-[none] rounded-[0_0_8px_8px]">
                        <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[10pt]">
                            <tbody>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#f8fafc] font-[700] w-[30%] text-[#475569]">🪑 Puesto Evaluado:</td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] font-[800] text-[#1e293b]">{report?.puesto || 'N/A'}</td>
                                </tr>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#f8fafc] font-[700] text-[#475569]">📍 Sector / Área:</td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] text-[#334155]">{report.sector || 'No especificado'}</td>
                                </tr>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#f8fafc] font-[700] text-[#475569]">📋 Tarea Principal:</td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] text-[#334155]">{report.tarea || 'No especificada'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Variables Ambientales - Mejorado visualmente */}
                <div className="mb-[1.5rem]">
                    <div className="bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] p-[0.6rem_1rem] font-[800] text-[#ffffff] text-[10.5pt] rounded-[8px_8px_0_0] flex items-center gap-[0.5rem]">









            
                        <span className="bg-[#ffffff] text-[#f97316] w-[24px] h-[24px] rounded-[50%] flex items-center justify-center text-[9pt] font-[900]">2</span>
                        VARIABLES AMBIENTALES MEDIDAS
                    </div>
                    <div className="border-[1px_solid_#fdba74] border-top-[none] rounded-[0_0_8px_8px] p-[1rem]">
                        <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[1rem] mb-[1rem]">
                            <div className="metric-card border-[2px_solid_#3b82f6] rounded-[10px] p-[12px] text-center">
                                <div className="flex items-center justify-center gap-[0.3rem] mb-[6px]">
                                    <Droplets size={16} color="#3b82f6" />
                                    <div className="text-[7.5pt] text-[#475569] font-[800] uppercase">T° Bulbo Húmedo</div>
                                </div>
                                <div className="text-[28pt] font-[900] text-[#1e40af] line-height-[1]">{report?.tbh || '0'}°C</div>
                                <div className="text-[7pt] text-[#64748b] mt-[4px] font-[600]">(Tbh)</div>
                            </div>
                            <div className="metric-card border-[2px_solid_#f97316] rounded-[10px] p-[12px] text-center">
                                <div className="flex items-center justify-center gap-[0.3rem] mb-[6px]">
                                    <ThermometerSun size={16} color="#f97316" />
                                    <div className="text-[7.5pt] text-[#475569] font-[800] uppercase">T° Globo Térmico</div>
                                </div>
                                <div className="text-[28pt] font-[900] text-[#c2410c] line-height-[1]">{report?.tg || '0'}°C</div>
                                <div className="text-[7pt] text-[#64748b] mt-[4px] font-[600]">(Tg)</div>
                            </div>
                            <div className="metric-card rounded-[10px] p-[12px] text-center" style={{ border: `2px solid ${report?.cargaSolar ? '#ef4444' : '#cbd5e1'}`, opacity: report?.cargaSolar ? 1 : 0.5 }}>
                                <div className="flex items-center justify-center gap-[0.3rem] mb-[6px]">
                                    <Sun size={16} color={report?.cargaSolar ? '#ef4444' : '#94a3b8'} />
                                    <div className="text-[7.5pt] text-[#475569] font-[800] uppercase">T° Bulbo Seco</div>
                                </div>
                                <div className="text-[28pt] font-[900] text-[#991b1b] line-height-[1]">{report?.cargaSolar ? `${report?.tbs || '0'}°C` : 'N/A'}</div>
                                <div className="text-[7pt] text-[#64748b] mt-[4px] font-[600]">(Tbs)</div>
                            </div>
                        </div>
                        <div style={{





              background: report.cargaSolar ? '#fef2f2' : '#f0f9ff',


              border: `1px solid ${report.cargaSolar ? '#fecaca' : '#bfdbfe'}`
            }} className="text-[9pt] text-[#475569] flex items-center gap-[0.5rem] p-[10px_12px] rounded-[8px]">
                            {report.cargaSolar ? <Sun size={16} color="#dc2626" /> : <Droplets size={16} color="#2563eb" />}
                            <strong>Exposición Solar:</strong> {report.cargaSolar ? 'Sí (Condición al aire libre con carga solar)' : 'NO (Condición interior o sin carga solar)'}
                        </div>
                    </div>
                </div>

                {/* Section 3: Carga de Trabajo */}
                <div className="mb-[1.5rem]">
                    <div className="bg-[linear-gradient(135deg,_#8b5cf6_0%,_#7c3aed_100%)] p-[0.6rem_1rem] font-[800] text-[#ffffff] text-[10.5pt] rounded-[8px_8px_0_0] flex items-center gap-[0.5rem]">









            
                        <span className="bg-[#ffffff] text-[#8b5cf6] w-[24px] h-[24px] rounded-[50%] flex items-center justify-center text-[9pt] font-[900]">3</span>
                        CARGA DE TRABAJO Y LÍMITES
                    </div>
                    <div className="border-[1px_solid_#c4b5fd] border-top-[none] rounded-[0_0_8px_8px]">
                        <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[10pt]">
                            <tbody>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#faf5ff] font-[700] w-[40%] text-[#475569]">
                                        {ritmoInfo.icon} Nivel Metabólico:
                                    </td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px]">
                                        <div className="font-[800] text-[#1e293b] mb-[2px]">{ritmoInfo.name}</div>
                                        <div className="text-[8.5pt] text-[#64748b]">{ritmoInfo.desc}</div>
                                    </td>
                                </tr>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#faf5ff] font-[700] text-[#475569]">
                                        🔄 Régimen Trabajo/Descanso:
                                    </td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] font-[700] text-[#1e293b]">{getCicloName(report?.ciclo)}</td>
                                </tr>
                                <tr className="avoid-break break-inside-[avoid]">
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] bg-[#faf5ff] font-[700] text-[#475569]">
                                        📊 Límite Máximo Permitido:
                                    </td>
                                    <td className="border-[1px_solid_#e2e8f0] p-[8px_10px] font-[900] text-[#7c3aed] text-[14pt]">{report?.resultados?.limite || '--'}°C</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 4: Resultados y Dictamen - Mejorado visualmente */}
                <div className="mb-[2rem]">
                    <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_100%)] p-[0.6rem_1rem] font-[800] text-[#ffffff] text-[10.5pt] rounded-[8px_8px_0_0] flex items-center gap-[0.5rem]">









            
                        <span className="bg-[#ffffff] text-[#1e293b] w-[24px] h-[24px] rounded-[50%] flex items-center justify-center text-[9pt] font-[900]">4</span>
                        DICTAMEN TGBH RESULTANTE
                    </div>
                    <div className="border-[1px_solid_#334155] border-top-[none] rounded-[0_0_8px_8px] p-[1rem]">
                        <div className="flex gap-[1rem] items-stretch flex-wrap">
                            {/* TGBH Obtenido */}
                            <div className="flex-[1] min-width-[200px] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] border-[2px_solid_#cbd5e1] rounded-[10px] p-[1.2rem] text-center">







                
                                <div className="text-[8.5pt] text-[#475569] font-[800] uppercase mb-[8px]">
                                    📈 TGBH OBTENIDO
                                </div>
                                <div className="pdf-important-text text-[36pt] font-[900] text-[#1e293b] line-height-[1] mb-[4px]">
                                    {report?.resultados?.tgbh || '--'}°C
                                </div>
                                <div className="text-[8.5pt] text-[#64748b] font-[600] bg-[#e2e8f0] p-[4px_8px] rounded-[4px] inline-block">







                  
                                    Límite: {report?.resultados?.limite || '--'}°C
                                </div>
                            </div>

                            {/* Dictamen */}
                            <div style={{


                background: isAdmisible ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: `3px solid ${isAdmisible ? '#22c55e' : '#ef4444'}`





              }} className="flex-[2] min-width-[250px] rounded-[10px] p-[1.2rem] flex flex-col justify-center">
                                <div className="flex items-center gap-[0.5rem] mb-[8px]">
                                    {isAdmisible ?
                  <CheckCircle2 size={28} color="#16a34a" /> :
                  <AlertTriangle size={28} color="#dc2626" />
                  }
                                    <div style={{


                    color: isAdmisible ? '#166534' : '#991b1b'

                  }} className="text-[13pt] font-[900] uppercase">
                                        {isAdmisible ? 'SITUACIÓN ADMISIBLE' : 'RIESGO POR ESTRÉS TÉRMICO'}
                                    </div>
                                </div>
                                <div style={{

                  color: isAdmisible ? '#15803d' : '#b91c1c'

                }} className="text-[9.5pt] line-height-[1.5]">
                                    {isAdmisible ?
                  '✅ El puesto de trabajo cumple con los valores límite umbral de estrés térmico vigentes. No se requiere rotación obligatoria especial, pero se recomienda continuar con hidratación adecuada.' :
                  '⚠️ El índice TGBH ha superado el límite admisible. SE REQUIEREN MEDIDAS INMEDIATAS: Reducir intensidad física, aumentar descansos en zonas frescas, implementar métodos de refrigeración, y garantizar hidratación constante.'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-[1rem] text-[8pt] text-[#64748b] bg-[#f8fafc] p-[8px_12px] rounded-[6px] border-[1px_dashed_#cbd5e1]">







              
                            <strong>📍 Fórmula aplicada:</strong> {report.cargaSolar ? 'TGBH = 0.7(Tbh) + 0.2(Tg) + 0.1(Tbs)' : 'TGBH = 0.7(Tbh) + 0.3(Tg)'}
                        </div>
                    </div>
                </div>

                {/* Signatures Area */}
                <PdfSignatures
          data={report}
          box1={report.showSignatures?.operator ? {
            title: 'TRABAJADOR EVALUADO',
            subtitle: 'Firma de Conformidad',
            signatureUrl: report.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={report.showSignatures?.professional ? {
            title: 'PROFESIONAL H&S',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: report.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={report.showSignatures?.supervisor ? {
            title: 'RESPONSABLE / SECTOR',
            subtitle: 'Validación de Medidas',
            signatureUrl: report.signature || report.supervisorSignature || null,
            isProfessional: false
          } : null} />
        

                {/* Footer */}
                <div className="text-center mt-[2rem] pt-[1rem] border-top-[1px_solid_#e2e8f0] text-[7.5pt] text-[#94a3b8] line-height-[1.6]">







          
                    <div className="font-[800] text-[#64748b] uppercase letter-spacing-[1px] mb-[4px]">
                        Informe generado electrónicamente
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