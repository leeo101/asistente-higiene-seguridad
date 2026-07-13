import React from 'react';
import { Lock, Zap, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const ENERGY_MAP = {
  electrical: { name: 'Eléctrica', icon: '⚡', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  mechanical: { name: 'Mecánica', icon: '🔧', color: '#334155', bg: '#f1f5f9', border: '#e2e8f0' },
  hydraulic: { name: 'Hidráulica', icon: '💧', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  pneumatic: { name: 'Neumática', icon: '💨', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  thermal: { name: 'Térmica', icon: '🔥', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  chemical: { name: 'Química', icon: '🧪', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  potential: { name: 'Gravitatoria', icon: '⛰️', color: '#5b21b6', bg: '#ede9fe', border: '#ddd6fe' }
};

const DEVICE_MAP = {
  padlock: { name: 'Candado de seguridad', icon: '🔒' },
  hasp: { name: 'Aldaba (Hasp)', icon: '📎' },
  valve_lock: { name: 'Bloqueo de válvula', icon: '🔩' },
  breaker_lock: { name: 'Bloqueo de disyuntor', icon: '⚡' },
  tag: { name: 'Etiqueta de peligro', icon: '🏷️' }
};

export default function LOTOPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  // Obtener firma profesional desde data o localStorage
  let actSignature: string | null = data?.professionalSignature || null;
  let actStamp: string | null = data?.professionalStamp || null;
  let actName: string | null = data?.professionalName || null;
  let actLic: string | null = data?.professionalLicense || data?.license || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

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

                {/* Header */}
                <div className="flex justify-space-between items-center border-bottom-[3px_solid_#333] pb-[1rem] mb-[1.5rem]">
                    <div>
                        <h1 className="m-[0] text-[1.6rem] font-[900]">PROCEDIMIENTO LOTO (BLOQUEO Y ETIQUETADO)</h1>
                        <p className="m-[0] text-[0.9rem] font-[700] text-[#666]">SEGÚN ESTÁNDAR OSHA 29 CFR 1910.147</p>
                    </div>
                    <CompanyLogo className="h-[50px] max-w-[150px] object-fit-[contain]" />
                </div>

                {/* Info Grid */}
                <div className="grid grid-template-columns-[1.5fr_1fr_1fr] gap-[0] border-[1.5px_solid_#000] mb-[1.5rem]">
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">EQUIPO / MÁQUINA</span>
                        <span className="font-[700]">{data.equipmentName || 'N/A'} {data.equipmentTag ? `(${data.equipmentTag})` : ''}</span>
                    </div>
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">TIPO BLOQUEO</span>
                        <span className="font-[700]">{data.lockoutType === 'group' ? `Grupal (Caja: ${data.lockBoxNumber || 'N/A'})` : 'Individual'}</span>
                    </div>
                    <div className="p-[0.5rem] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">FECHA</span>
                        <span className="font-[700]">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}</span>
                    </div>
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000]" style={{ gridColumn: 'span 2', borderRight: '1.5px solid #000' }}>
                        <span className="text-[0.6rem] font-[900] block">UBICACIÓN / DEPARTAMENTO</span>
                        <span className="font-[700]">{data.location || 'No especificada'}{data.department ? ` - Depto: ${data.department}` : ''}</span>
                    </div>
                    <div className="p-[0.5rem]">
                        <span className="text-[0.6rem] font-[900] block">ID PROCEDIMIENTO</span>
                        <span className="font-[700]">#LOTO-{data.id?.slice(-6) || 'N/A'}</span>
                    </div>
                </div>

                {/* Energy Sources */}
                <div className="mb-[1.5rem]">
                    <h3 className="text-[0.9rem] font-[900] bg-[#1e293b] text-[#fff] p-[0.5rem] mb-[0.5rem] flex items-center gap-[0.5rem]">
                        <Zap size={18} /> FUENTES DE ENERGÍA Y BLOQUEO
                    </h3>
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                        <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                            <span className="text-[0.7rem] font-[900] text-[#64748b] block mb-[0.3rem]">ENERGÍAS A BLOQUEAR</span>
                            <div className="flex flex-wrap gap-[6px]">
                                {data.energyTypes?.length > 0 ? data.energyTypes.map((t: string, i: number) => {
                  const e = ENERGY_MAP[t as keyof typeof ENERGY_MAP] || { name: t, icon: '⚡', color: '#1e40af', bg: '#eff6ff', border: '#dbeafe' };
                  return (
                    <span key={i} style={{ background: e.bg, border: `1px solid ${e.border}`, color: e.color }} className="p-[4px_8px] rounded-[4px] text-[0.8rem] font-[800] flex items-center gap-[4px]">
                                            <span>{e.icon}</span> {e.name}
                                        </span>);

                }) : <span className="text-[0.8rem] text-[#666]">Ninguna especificada</span>}
                            </div>
                        </div>
                        <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                            <span className="text-[0.7rem] font-[900] text-[#64748b] block mb-[0.3rem]">DISPOSITIVOS REQUERIDOS</span>
                            <div className="flex flex-wrap gap-[6px]">
                                {data.lotoDevices?.length > 0 ? data.lotoDevices.map((d: string, i: number) => {
                  const dev = DEVICE_MAP[d as keyof typeof DEVICE_MAP] || { name: d, icon: '🔧' };
                  return (
                    <span key={i} className="bg-[#f8fafc] border-[1px_solid_#e2e8f0] text-[#334155] p-[4px_8px] rounded-[4px] text-[0.8rem] font-[800] flex items-center gap-[4px]">
                                            <span>{dev.icon}</span> {dev.name}
                                        </span>);

                }) : <span className="text-[0.8rem] text-[#666]">Ninguno especificado</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Isolation Points List */}
                {data.isolationPointsList?.length > 0 && (
                    <div className="mb-[1.5rem]">
                        <h3 className="text-[0.9rem] font-[900] bg-[#1e293b] text-[#fff] p-[0.5rem] mb-[0.5rem]">
                            PUNTOS DE AISLAMIENTO ESPECÍFICOS
                        </h3>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[8pt]" style={{ border: '1px solid #cbd5e1' }}>
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-300">
                                    <th className="p-[4px_8px] border-r border-slate-300 font-[900] w-1/4" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>Punto</th>
                                    <th className="p-[4px_8px] border-r border-slate-300 font-[900] w-1/5" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>Energía</th>
                                    <th className="p-[4px_8px] border-r border-slate-300 font-[900] w-1/5" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>Dispositivo</th>
                                    <th className="p-[4px_8px] border-r border-slate-300 font-[900] w-1/5" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>Ubicación</th>
                                    <th className="p-[4px_8px] font-[900] w-1/6 text-center" style={{ padding: '6px' }}>¿Verificado?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.isolationPointsList.map((point: any, idx: number) => {
                                    const e = ENERGY_MAP[point.energyType as keyof typeof ENERGY_MAP] || { name: point.energyType, icon: '⚡' };
                                    const dev = DEVICE_MAP[point.device as keyof typeof DEVICE_MAP] || { name: point.device, icon: '🔒' };
                                    return (
                                        <tr key={idx} className="border-b border-slate-300" style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <td className="p-[4px_8px] border-r border-slate-300 font-[750]" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>{point.name || 'N/A'}</td>
                                            <td className="p-[4px_8px] border-r border-slate-300" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>{e.icon} {e.name}</td>
                                            <td className="p-[4px_8px] border-r border-slate-300" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>{dev.icon} {dev.name}</td>
                                            <td className="p-[4px_8px] border-r border-slate-300" style={{ borderRight: '1px solid #cbd5e1', padding: '6px' }}>{point.location || 'N/A'}</td>
                                            <td className="p-[4px_8px] text-center font-[900] text-emerald-700" style={{ padding: '6px' }}>{point.verified ? 'SÍ' : 'NO'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Verification & Warnings */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.5rem]">
                    <div className="border-[1px_solid_#fbd38d] bg-[#fffaf0] rounded-[6px] p-[0.8rem]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#c05621]">
                            <Lock size={18} />
                            <span className="font-[900] text-[0.85rem]">VERIFICACIÓN DE ENERGÍA CERO</span>
                        </div>
                        <p className="m-[0] text-[0.8rem]">
                            {data.zeroEnergyVerification?.tested ? (
                                <span>
                                    CONFIRMADA mediante método: {
                                        data.zeroEnergyVerification.method === 'try_start' ? 'Intento de Arranque Local' :
                                        data.zeroEnergyVerification.method === 'tester' ? 'Medición con Instrumento' :
                                        data.zeroEnergyVerification.method === 'gauge' ? 'Verificación de Presión' :
                                        data.zeroEnergyVerification.method === 'visual' ? 'Inspección Visual' : 'Método especificado'
                                    }.
                                </span>
                            ) : (
                                <span>No se ha registrado verificación formal de energía cero.</span>
                            )}
                        </p>
                        {data.isolationPoints && (
                            <p className="m-[0.5rem_0_0_0] text-[0.75rem] text-slate-600"><strong>Notas:</strong> {data.isolationPoints}</p>
                        )}
                    </div>
                    <div className="border-[1px_solid_#feb2b2] bg-[#fff5f5] rounded-[6px] p-[0.8rem]">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#c53030]">
                            <AlertTriangle size={18} />
                            <span className="font-[900] text-[0.85rem]">ADVERTENCIA CRÍTICA</span>
                        </div>
                        <p className="m-[0] text-[0.8rem] font-[700]">PROHIBIDO RETIRAR BLOQUEOS SIN AUTORIZACIÓN DEL RESPONSABLE DEL TRABAJO.</p>
                    </div>
                </div>

                {/* Restoration Checklist */}
                {data.restorationChecklist && (
                    <div className="mb-[1.5rem] border-[1px_solid_#cbd5e1] rounded-[6px] p-[0.8rem] bg-slate-50/30">
                        <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-slate-700">
                            <span className="font-[900] text-[0.85rem] uppercase">Desbloqueo y Restablecimiento (Retiro de Bloqueos)</span>
                        </div>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[4px_12px] text-[8.5pt]">
                            <div>[ {data.restorationChecklist.guardsReinstalled ? 'X' : ' ' } ] Protecciones y guardas reinstaladas</div>
                            <div>[ {data.restorationChecklist.toolsRemoved ? 'X' : ' ' } ] Herramientas y materiales retirados</div>
                            <div>[ {data.restorationChecklist.personnelClear ? 'X' : ' ' } ] Todo el personal fuera del área de peligro</div>
                            <div>[ {data.restorationChecklist.locksRemoved ? 'X' : ' ' } ] Candados y etiquetas de bloqueo retirados</div>
                            <div className="grid-column-span-2" style={{ gridColumn: 'span 2', fontWeight: 'bold' }}>
                                [ {data.restorationChecklist.authorizedRestart ? 'X' : ' ' } ] Re-energización y reinicio plenamente AUTORIZADO
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'PERSONAL AFECTADO',
            subtitle: 'Firma y Aclaración',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'PROFESIONAL H&S',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'ENCARGADO BLOQUEO',
            subtitle: 'Aprobación / Supervisor',
            signatureUrl: data.signature || data.supervisorSignature || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />

                <div className="mt-[2rem] text-[0.6rem] text-[#64748b] text-center font-[900] letter-spacing-[0.1em]">
                    REGISTRO DE BLOQUEO CONFORME A NORMAS INTERNACIONALES DE SEGURIDAD INDUSTRIAL.
                </div>
            </div>
        </div>);

}