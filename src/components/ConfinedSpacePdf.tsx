import React from 'react';
import { ShieldCheck, Wind, AlertTriangle, Activity, Clock, MapPin, Building2, Calendar, User } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function ConfinedSpacePdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  const gasReadings = data.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '' };

  // Obtención segura de firma profesional desde localStorage
  let actSignature = data.professionalSignature || null;
  let actStamp = data.professionalStamp || null;
  let actName = data.professionalName || null;
  let actLic = data.professionalLicense || data.license || null;

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

  // Chequeo de valores críticos de gas
  const o2Val = parseFloat(gasReadings.o2);
  const lelVal = parseFloat(gasReadings.lel);
  const coVal = parseFloat(gasReadings.co);
  const h2sVal = parseFloat(gasReadings.h2s);
  const hasGasAlert =
  !isNaN(o2Val) && (o2Val < 19.5 || o2Val > 23.5) ||
  !isNaN(lelVal) && lelVal >= 10 ||
  !isNaN(coVal) && coVal >= 25 ||
  !isNaN(h2sVal) && h2sVal >= 10;

  const getGasColor = (param: string, val: string) => {
    const v = parseFloat(val);
    if (isNaN(v)) return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    if (param === 'o2') return v >= 19.5 && v <= 23.5 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
    if (param === 'lel') return v < 10 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
    if (param === 'co') return v < 25 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
    if (param === 'h2s') return v < 10 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
    return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  };

  const ventilationText = typeof data.ventilation === 'object' && data.ventilation !== null ?
  Object.entries(data.ventilation).filter(([_, v]) => v).map(([k]) =>
  k === 'forced' ? 'Forzada' : k === 'natural' ? 'Natural' : 'Extractiva'
  ).join(', ') || 'No especificada' :
  data.ventilation || 'No especificada';

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
        style={{





          borderTop: hasGasAlert ? '12px solid #dc2626' : '12px solid #f59e0b'
        }}>
        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                            width: 100% !important; max-width: none !important;
                            border-top: ${hasGasAlert ? '12px solid #dc2626' : '12px solid #f59e0b'} !important;
                            border-radius: 0 !important; min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Tripartito */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p style={{ color: hasGasAlert ? '#dc2626' : '#d97706' }} className="m-[0] font-[900] text-[0.8rem] uppercase">
                            {hasGasAlert ? '⚠ ALERTA: ATMÓSFERA PELIGROSA' : 'Permiso de Trabajo Especial'}
                        </p>
                    </div>

                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[1.8rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#ffffff] bg-[#0f172a] p-[0.4rem_1rem] rounded-[8px]">ESPACIO CONFINADO</h1>
                        <div style={{ background: hasGasAlert ? '#dc2626' : '#f59e0b' }} className="mt-[0.5rem] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.08em]">
                            PERMISO DE INGRESO — RES. SRT 95/03
                        </div>
                    </div>

                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                    </div>
                </div>

                {/* Identificación del Espacio */}
                <div style={{ border: hasGasAlert ? '1.5px solid #fca5a5' : '1px solid #fde68a' }} className="rounded-[6px] mb-[1.5rem] overflow-[hidden]">
                    <div style={{ background: hasGasAlert ? '#fef2f2' : '#fffbeb', borderBottom: hasGasAlert ? '1px solid #fca5a5' : '1px solid #fde68a' }} className="p-[1rem]">
                        <span style={{ color: hasGasAlert ? '#dc2626' : '#d97706' }} className="text-[0.65rem] font-[800] uppercase letter-spacing-[0.05em]">
                            IDENTIFICACIÓN DEL ESPACIO CONFINADO
                        </span>
                        <div className="font-[900] text-[1.3rem] text-[#0f172a] mt-[0.3rem]">{data.spaceName || 'No especificado'}</div>
                    </div>

                    <div className="flex bg-[#ffffff]">
                        <div className="flex-[1] p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> UBICACIÓN / SECTOR</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.location || 'No especificada'}</div>
                        </div>
                        <div className="flex-[1] p-[0.75rem_1rem] border-right-[1px_solid_#e2e8f0]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}</div>
                        </div>
                        <div className="flex-[1] p-[0.75rem_1rem]">
                            <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Clock size={12} /> DURACIÓN ESTIMADA</span>
                            <div className="font-[700] text-[0.9rem] text-[#334155] mt-[0.2rem]">{data.duration || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Monitoreo Atmosférico */}
                <div style={{ border: hasGasAlert ? '1.5px solid #fca5a5' : '1px solid #cbd5e1' }} className="mb-[1.5rem] rounded-[6px] overflow-[hidden]">
                    <div className="bg-[#e2e8f0] border-bottom-[1px_solid_#cbd5e1] p-[0.6rem_1rem] flex items-center gap-[0.5rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                        <Activity size={16} color="#0f172a" />
                        <span className="font-[900] text-[0.78rem] text-[#0f172a] uppercase letter-spacing-[0.04em]">MONITOREO ATMOSFÉRICO OBLIGATORIO</span>
                        {hasGasAlert &&
            <span className="ml-[auto] bg-[#dc2626] text-[#ffffff] p-[0.15rem_0.6rem] rounded-[10px] text-[0.65rem] font-[900] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">⚠ FUERA DE LÍMITES</span>
            }
                    </div>

                    <div className="flex flex-wrap bg-[#ffffff]">
                        {[
            { key: 'o2', label: 'O₂', unit: '%', val: gasReadings.o2, limit: '19.5 – 23.5%' },
            { key: 'lel', label: 'LEL', unit: '%', val: gasReadings.lel, limit: '< 10%' },
            { key: 'co', label: 'CO', unit: 'ppm', val: gasReadings.co, limit: '< 25 ppm' },
            { key: 'h2s', label: 'H₂S', unit: 'ppm', val: gasReadings.h2s, limit: '< 10 ppm' },
            { key: 'time', label: 'HORA', unit: '', val: gasReadings.time, limit: '' }].
            map((gas, idx) => {
              const colors = gas.key !== 'time' ? getGasColor(gas.key, gas.val) : { bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
              return (
                <div key={gas.key} style={{ background: colors.bg, border: `1px solid ${colors.border}` }} className="flex-[1_1_0] p-[0.75rem_0.5rem] text-center m-[0.3rem] rounded-[6px] min-width-[80px]">
                                    <span className="text-[0.6rem] font-[800] text-[#64748b] uppercase block">{gas.label}</span>
                                    <span style={{ color: colors.color }} className="text-[1.4rem] font-[900] block line-height-[1.2]">{gas.val || '--'}</span>
                                    <span className="text-[0.6rem] font-[700] text-[#94a3b8] block">{gas.unit}</span>
                                    {gas.limit && <span className="text-[0.55rem] text-[#94a3b8] block mt-[0.2rem]">Lím: {gas.limit}</span>}
                                </div>);

            })}
                    </div>
                </div>

                {/* Ventilación y Peligros */}
                <div className="flex gap-[1rem] mb-[1.5rem]">
                    <div className="flex-[1] border-[1px_solid_#bfdbfe] rounded-[6px] overflow-[hidden] break-inside-[avoid]">
                        <div className="bg-[#dbeafe] border-bottom-[1px_solid_#bfdbfe] p-[0.5rem_0.8rem] flex items-center gap-[0.4rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                            <Wind size={15} color="#1e40af" />
                            <span className="font-[900] text-[0.72rem] text-[#1e40af] uppercase">VENTILACIÓN</span>
                        </div>
                        <div className="p-[0.8rem] bg-[#eff6ff] text-[0.85rem] font-[700] text-[#1e40af] min-h-[50px]">
                            {ventilationText}
                        </div>
                    </div>

                    <div className="flex-[1] border-[1px_solid_#fca5a5] rounded-[6px] overflow-[hidden] break-inside-[avoid]">
                        <div className="bg-[#fee2e2] border-bottom-[1px_solid_#fca5a5] p-[0.5rem_0.8rem] flex items-center gap-[0.4rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                            <AlertTriangle size={15} color="#991b1b" />
                            <span className="font-[900] text-[0.72rem] text-[#991b1b] uppercase">PELIGROS DETECTADOS</span>
                        </div>
                        <div className="p-[0.8rem] bg-[#fef2f2] flex flex-wrap gap-[0.3rem] min-h-[50px]">
                            {data.hazards?.length > 0 ? data.hazards.map((p, i) =>
              <span key={i} className="bg-[#fee2e2] border-[1px_solid_#fca5a5] text-[#991b1b] p-[0.2rem_0.5rem] rounded-[6px] text-[0.72rem] font-[700]">{p}</span>
              ) : <span className="text-[0.8rem] text-[#64748b] font-[600]">Ninguno identificado</span>}
                        </div>
                    </div>
                </div>

                {/* Equipo de Trabajo */}
                {data.team &&
        <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px] overflow-[hidden] break-inside-[avoid]">
                        <div className="bg-[#e2e8f0] border-bottom-[1px_solid_#cbd5e1] p-[0.5rem_1rem] flex items-center gap-[0.5rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                            <User size={15} color="#0f172a" />
                            <span className="font-[900] text-[0.72rem] text-[#0f172a] uppercase">EQUIPO DE TRABAJO ASIGNADO</span>
                        </div>
                        <div className="flex bg-[#ffffff] text-[0.8rem]">
                            <div className="flex-[1] p-[0.6rem_0.8rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="font-[800] text-[#64748b] text-[0.65rem] block mb-[0.2rem]">ENTRANTES</span>
                                {data.team.entrants?.length > 0 ? data.team.entrants.map((e: string, i: number) => <div key={i} className="font-[700]">• {e}</div>) : '-'}
                            </div>
                            <div className="flex-[1] p-[0.6rem_0.8rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="font-[800] text-[#64748b] text-[0.65rem] block mb-[0.2rem]">VIGÍA</span>
                                <div className="font-[700]">{data.team.attendant || '-'}</div>
                            </div>
                            <div className="flex-[1] p-[0.6rem_0.8rem] border-right-[1px_solid_#e2e8f0]">
                                <span className="font-[800] text-[#64748b] text-[0.65rem] block mb-[0.2rem]">SUPERVISOR</span>
                                <div className="font-[700]">{data.team.supervisor || '-'}</div>
                            </div>
                            <div className="flex-[1] p-[0.6rem_0.8rem]">
                                <span className="font-[800] text-[#64748b] text-[0.65rem] block mb-[0.2rem]">RESCATE</span>
                                <div className="font-[700]">{data.team.rescue || '-'}</div>
                            </div>
                        </div>
                    </div>
        }

                {/* Equipamiento */}
                {data.equipment &&
        <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px] overflow-[hidden] break-inside-[avoid]">
                        <div className="bg-[#e2e8f0] border-bottom-[1px_solid_#cbd5e1] p-[0.5rem_1rem] flex items-center gap-[0.5rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                            <ShieldCheck size={15} color="#0f172a" />
                            <span className="font-[900] text-[0.72rem] text-[#0f172a] uppercase">EQUIPAMIENTO DE SEGURIDAD REQUERIDO</span>
                        </div>
                        <div className="bg-[#f8fafc] p-[0.8rem] flex flex-wrap gap-[0.5rem]">
                            {data.equipment.filter((e: any) => e.checked).length > 0 ?
            data.equipment.filter((e: any) => e.checked).map((e: any, i: number) =>
            <span key={i} className="bg-[#ffffff] border-[1px_solid_#cbd5e1] text-[#0f172a] p-[0.2rem_0.5rem] rounded-[4px] text-[0.75rem] font-[700] display-[inline-flex] items-center gap-[0.3rem]">
                                        <span className="text-[#16a34a]">✓</span> {e.name}
                                    </span>
            ) :
            <span className="text-[0.8rem] text-[#64748b] font-[600]">Ningún equipo seleccionado</span>
            }
                        </div>
                    </div>
        }

                {/* Observaciones */}
                {data.observations &&
        <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px] overflow-[hidden] break-inside-[avoid]">
                        <div className="bg-[#e2e8f0] border-bottom-[1px_solid_#cbd5e1] p-[0.5rem_1rem] webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                            <span className="text-[#0f172a] text-[0.65rem] font-[900] uppercase letter-spacing-[0.05em]">OBSERVACIONES Y CONCLUSIONES DEL INSPECTOR</span>
                        </div>
                        <div className="p-[0.8rem_1rem] text-[0.85rem] text-[#334155] font-[600] line-height-[1.6] white-space-[pre-wrap] bg-[#f8fafc]">
                            {data.observations}
                        </div>
                    </div>
        }

                {/* Nota legal */}
                <div className="mb-[1.5rem] bg-[#fffbeb] border-[1px_solid_#fde68a] rounded-[6px] p-[0.7rem_1rem] flex items-start gap-[0.6rem]">
                    <AlertTriangle size={16} color="#d97706" className="flex-shrink-[0] mt-[0.1rem]" />
                    <p className="m-[0] text-[0.72rem] text-[#92400e] font-[700] line-height-[1.5]">
                        <strong>AVISO LEGAL:</strong> Según Res. SRT 95/03 — Anexo I. Este permiso es de validez única por ingreso y caduca al finalizar el turno, al detectarse condiciones atmosféricas fuera de límite, o ante cualquier situación de emergencia. Prohibido el ingreso sin autorización firmada.
                    </p>
                </div>

                {/* Firmas */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator ? {
            title: 'RESPONSABLE / ENTRANTE',
            subtitle: 'Control de Ingreso',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional ? {
            title: 'PROFESIONAL H&S',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor ? {
            title: 'AUTORIZACIÓN DE INGRESO',
            subtitle: 'Firma del Autorizante',
            signatureUrl: data.signature || data.supervisorSignature || null,
            isProfessional: false
          } : null} />
        

                <PdfBrandingFooter />
            </div>
        </div>);

}