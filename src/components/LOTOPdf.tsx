import React from 'react';
import { Lock, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
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

export default function LOTOPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

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
      } else if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const docId = data.id ? String(data.id).slice(-6).toUpperCase() : 'S/N';

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100 print:bg-white print:py-0">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 bg-white text-slate-900 shadow-xl rounded-2xl box-border mx-auto text-xs font-sans print:shadow-none print:p-4 print:max-w-none print:rounded-none"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border: none !important;
              border-radius: 0 !important; 
            }
          `}
        </style>

        {/* Top Accent Line */}
        <div className="w-full h-2 bg-gradient-to-r from-red-700 via-amber-600 to-red-900 rounded-t-lg mb-5"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-950 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                ESTÁNDAR OSHA 29 CFR 1910.147
              </span>
              <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
                CONTROL DE ENERGÍAS PELIGROSAS
              </span>
            </div>
            <h1 className="m-0 text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Lock className="text-red-700 inline" size={24} /> PROCEDIMIENTO LOTO (BLOQUEO Y ETIQUETADO)
            </h1>
            <div className="text-xs font-black text-red-700 uppercase tracking-wide">
              PROTOCOLO OBLIGATORIO DE AISLAMIENTO ENERGÉTICO
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <CompanyLogo style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">REGISTRO N°</div>
              <div className="text-sm font-black text-red-700">#LOTO-{docId}</div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-5 bg-white page-break-inside-avoid shadow-xs">
          <div className="bg-slate-900 text-white font-black text-[11px] px-4 py-1.5 uppercase tracking-wider">
            ESPECIFICACIONES DEL EQUIPO Y UBICACIÓN
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">EQUIPO / MÁQUINA</span>
              <span className="font-extrabold text-sm text-slate-900">
                {data.equipmentName || 'N/A'} {data.equipmentTag ? `(${data.equipmentTag})` : ''}
              </span>
            </div>
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TIPO BLOQUEO</span>
              <span className="font-extrabold text-sm text-slate-900">
                {data.lockoutType === 'group' ? `Grupal (Caja: ${data.lockBoxNumber || 'N/A'})` : 'Individual'}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FECHA REGISTRO</span>
              <span className="font-extrabold text-sm text-slate-900">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-2 p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">UBICACIÓN / DEPARTAMENTO</span>
              <span className="font-extrabold text-sm text-slate-900">
                {data.location || 'No especificada'} {data.department ? ` - Depto: ${data.department}` : ''}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-0.5 bg-slate-50/30">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ESTADO PROCEDIMIENTO</span>
              <span className="font-extrabold text-sm text-emerald-700 uppercase">✓ ACTIVO / EN VIGENCIA</span>
            </div>
          </div>
        </div>

        {/* Energy Sources & Devices */}
        <div className="mb-5 page-break-inside-avoid">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
            <Zap className="text-amber-600" size={18} />
            <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
              FUENTES DE ENERGÍA Y DISPOSITIVOS DE BLOQUEO REQUERIDOS
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                ENERGÍAS A BLOQUEAR
              </span>
              <div className="flex flex-wrap gap-2">
                {data.energyTypes?.length > 0 ? (
                  data.energyTypes.map((t: string, i: number) => {
                    const e = ENERGY_MAP[t as keyof typeof ENERGY_MAP] || {
                      name: t,
                      icon: '⚡',
                      color: '#1e40af',
                      bg: '#eff6ff',
                      border: '#dbeafe'
                    };
                    return (
                      <span
                        key={i}
                        style={{ background: e.bg, borderColor: e.border, color: e.color }}
                        className="px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border shadow-2xs"
                      >
                        <span>{e.icon}</span> {e.name}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500">Ninguna especificada</span>
                )}
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                DISPOSITIVOS DE SEGURIDAD REQUERIDOS
              </span>
              <div className="flex flex-wrap gap-2">
                {data.lotoDevices?.length > 0 ? (
                  data.lotoDevices.map((d: string, i: number) => {
                    const dev = DEVICE_MAP[d as keyof typeof DEVICE_MAP] || { name: d, icon: '🔧' };
                    return (
                      <span
                        key={i}
                        className="bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{dev.icon}</span> {dev.name}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500">Ninguno especificado</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Isolation Points List */}
        {data.isolationPointsList?.length > 0 && (
          <div className="mb-5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <ShieldCheck className="text-blue-700" size={18} />
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                PUNTOS DE AISLAMIENTO ESPECÍFICOS Y VERIFICACIÓN
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_90px] bg-slate-100 p-2.5 border-b-2 border-slate-300 font-black text-[11px] text-slate-700 uppercase tracking-wider">
                <div>PUNTO DE AISLAMIENTO</div>
                <div>ENERGÍA</div>
                <div>DISPOSITIVO</div>
                <div>UBICACIÓN</div>
                <div className="text-center">VERIFICADO</div>
              </div>
              {data.isolationPointsList.map((point: any, idx: number) => {
                const e = ENERGY_MAP[point.energyType as keyof typeof ENERGY_MAP] || { name: point.energyType, icon: '⚡' };
                const dev = DEVICE_MAP[point.device as keyof typeof DEVICE_MAP] || { name: point.device, icon: '🔒' };
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_90px] gap-3 items-center p-2.5 border-b border-slate-200 page-break-inside-avoid ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900">{point.name || 'N/A'}</div>
                    <div className="text-xs font-bold text-slate-700">
                      {e.icon} {e.name}
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      {dev.icon} {dev.name}
                    </div>
                    <div className="text-xs font-medium text-slate-600">{point.location || 'N/A'}</div>
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                          point.verified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {point.verified ? '✓ SÍ' : '✗ NO'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification & Warnings */}
        <div className="grid grid-cols-2 gap-4 mb-5 page-break-inside-avoid">
          <div className="border border-amber-300 bg-amber-50/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5 text-amber-900">
              <Lock size={18} className="text-amber-700" />
              <span className="font-black text-xs uppercase">VERIFICACIÓN DE ENERGÍA CERO</span>
            </div>
            <p className="m-0 text-xs font-medium text-slate-800 leading-relaxed">
              {data.zeroEnergyVerification?.tested ? (
                <span>
                  CONFIRMADA mediante método:{' '}
                  <strong className="text-amber-950">
                    {data.zeroEnergyVerification.method === 'try_start'
                      ? 'Intento de Arranque Local'
                      : data.zeroEnergyVerification.method === 'tester'
                      ? 'Medición con Instrumento'
                      : data.zeroEnergyVerification.method === 'gauge'
                      ? 'Verificación de Presión'
                      : data.zeroEnergyVerification.method === 'visual'
                      ? 'Inspección Visual'
                      : 'Método especificado'}
                  </strong>
                </span>
              ) : (
                <span>No se ha registrado verificación formal de energía cero.</span>
              )}
            </p>
            {data.isolationPoints && (
              <p className="mt-2 text-[11px] text-slate-600 font-medium">
                <strong>Notas adicionales:</strong> {data.isolationPoints}
              </p>
            )}
          </div>

          <div className="border border-rose-300 bg-rose-50/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5 text-rose-900">
              <AlertTriangle size={18} className="text-rose-700" />
              <span className="font-black text-xs uppercase">ADVERTENCIA CRÍTICA DE SEGURIDAD</span>
            </div>
            <p className="m-0 text-xs font-black text-rose-900 uppercase leading-relaxed">
              PROHIBIDO RETIRAR CANDADOS O ETIQUETAS DE BLOQUEO SIN AUTORIZACIÓN DEL RESPONSABLE DEL PROCEDIMIENTO.
            </p>
          </div>
        </div>

        {/* Restoration Checklist */}
        {data.restorationChecklist && (
          <div className="mb-5 border border-slate-300 rounded-xl p-3.5 bg-slate-50/40 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 text-slate-800 border-b border-slate-200 pb-1">
              <span className="font-black text-xs uppercase">DESBLOQUEO Y RESTABLECIMIENTO DE ENERGÍA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
              <div>[{data.restorationChecklist.guardsReinstalled ? '✓' : ' '}] Protecciones y guardas reinstaladas</div>
              <div>[{data.restorationChecklist.toolsRemoved ? '✓' : ' '}] Herramientas y materiales retirados</div>
              <div>[{data.restorationChecklist.personnelClear ? '✓' : ' '}] Todo el personal fuera del área de peligro</div>
              <div>[{data.restorationChecklist.locksRemoved ? '✓' : ' '}] Candados y etiquetas retirados</div>
              <div className="col-span-2 text-emerald-800 font-extrabold mt-1">
                [{data.restorationChecklist.authorizedRestart ? '✓' : ' '}] Re-energización y reinicio plenamente AUTORIZADO
              </div>
            </div>
          </div>
        )}

        {/* Final Signatures */}
        <div className="mt-6 page-break-inside-avoid">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'PERSONAL AFECTADO',
                    subtitle: 'Firma y Aclaración',
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional !== false
                ? {
                    title: 'GERENCIA EHS / ESPECIALISTA',
                    subtitle: (actName || 'Firma de Especialista').toUpperCase(),
                    signatureUrl: actSignature || null,
                    stampUrl: data.professionalStamp || actStamp || null,
                    isProfessional: true,
                    license: actLic || null
                  }
                : null
            }
            box3={
              data.showSignatures?.supervisor !== false
                ? {
                    title: 'ENCARGADO DE BLOQUEO',
                    subtitle: 'Aprobación / Supervisor',
                    signatureUrl: data.signature || data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        <PdfBrandingFooter />

        <div className="mt-4 text-[10px] text-slate-400 text-center font-black tracking-widest uppercase">
          REGISTRO OFICIAL DE BLOQUEO CONFORME A NORMAS INTERNACIONALES DE SEGURIDAD INDUSTRIAL (OSHA 29 CFR 1910.147)
        </div>
      </div>
    </div>
  );
}