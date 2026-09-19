import React from 'react';
import { Lock, Zap, AlertTriangle, ShieldCheck, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const ENERGY_MAP: Record<string, { name: string; icon: string; color: string; bg: string; border: string }> = {
  electrical: { name: 'Eléctrica', icon: '⚡', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  mechanical: { name: 'Mecánica', icon: '🔧', color: '#334155', bg: '#f1f5f9', border: '#e2e8f0' },
  hydraulic: { name: 'Hidráulica', icon: '💧', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  pneumatic: { name: 'Neumática', icon: '💨', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  thermal: { name: 'Térmica', icon: '🔥', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  chemical: { name: 'Química', icon: '🧪', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  gravitational: { name: 'Gravitacional', icon: '⬇️', color: '#5b21b6', bg: '#ede9fe', border: '#ddd6fe' },
  potential: { name: 'Gravitacional', icon: '⬇️', color: '#5b21b6', bg: '#ede9fe', border: '#ddd6fe' },
  radiation: { name: 'Radiación', icon: '☢️', color: '#b45309', bg: '#fef3c7', border: '#fde68a' }
};

const DEVICE_MAP: Record<string, { name: string; icon: string }> = {
  padlock: { name: 'Candado de seguridad', icon: '🔒' },
  hasp: { name: 'Aldaba múltiple (Hasp)', icon: '📎' },
  breaker_lock: { name: 'Bloqueo de disyuntor / interruptor', icon: '⚡' },
  valve_lock: { name: 'Bloqueo de válvula', icon: '🔩' },
  plug_lock: { name: 'Bloqueo de enchufe / clavija', icon: '🔌' },
  cable_lock: { name: 'Bloqueo universal por cable', icon: '🪢' },
  blind_flange: { name: 'Brida ciega de bloqueo', icon: '🛑' },
  tag: { name: 'Tarjeta / Etiqueta de peligro', icon: '🏷️' },
  tagout: { name: 'Tarjeta / Etiqueta de peligro', icon: '🏷️' }
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
  const hasElectrical = (data.energyTypes || []).includes('electrical') || Boolean(data.hasElectricalRisk);
  const goldenRules = data.fiveGoldenRulesElectrical || {
    corteEfectivo: false,
    bloqueoEnclavamiento: false,
    verificacionAusencia: false,
    puestaATierraCorto: false,
    senalizacionZona: false
  };

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
        <div className="w-full h-2 bg-gradient-to-r from-red-700 via-amber-600 to-red-900 rounded-t-lg mb-4"></div>

        {/* Header Institucional Argentino & OSHA */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-950 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                DEC. 351/79 CAP. 14 Y 15
              </span>
              <span className="bg-amber-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                OSHA 29 CFR 1910.147
              </span>
              <span className="bg-slate-800 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                LEY 19.587 DE HIGIENE Y SEGURIDAD
              </span>
            </div>
            <h1 className="m-0 text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Lock className="text-red-700 inline" size={24} /> PROCEDIMIENTO LOTO (BLOQUEO Y ETIQUETADO)
            </h1>
            <div className="text-[11px] font-black text-red-700 uppercase tracking-wide">
              PROTOCOLO OBLIGATORIO DE AISLAMIENTO ENERGÉTICO Y CONSIGNACIÓN EN PLANTA
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <CompanyLogo style={{ maxHeight: '46px', maxWidth: '150px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">REGISTRO LOTO N°</div>
              <div className="text-xs font-black text-red-700">#LOTO-{docId}</div>
            </div>
          </div>
        </div>

        {/* Identificación Patronal & Empresa */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 bg-white page-break-inside-avoid">
          <div className="bg-slate-800 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider">
            1. IDENTIFICACIÓN DE LA EMPRESA Y ESTABLECIMIENTO
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 p-2.5 gap-2 text-[11px]">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">RAZÓN SOCIAL / EMPRESA</span>
              <span className="font-extrabold text-slate-900">{data.companyName || 'No especificada'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">C.U.I.T. PATRONAL</span>
              <span className="font-mono font-bold text-slate-800">{data.cuit || 'No informado'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">ESTABLECIMIENTO / PLANTA</span>
              <span className="font-medium text-slate-800">{data.establishmentAddress || data.location || 'Planta Principal'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">A.R.T. ASIGNADA</span>
              <span className="font-bold text-slate-800">{data.art || 'No especificada'}</span>
            </div>
          </div>
        </div>

        {/* Info Grid del Equipo */}
        <div className="border border-slate-800 rounded-lg overflow-hidden mb-4 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider">
            2. ESPECIFICACIONES DEL EQUIPO A INTERVENIR
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">EQUIPO / MÁQUINA</span>
              <span className="font-extrabold text-xs text-slate-900">
                {data.equipmentName || 'N/A'} {data.equipmentTag ? `(${data.equipmentTag})` : ''}
              </span>
            </div>
            <div className="p-2.5 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">TIPO DE BLOQUEO</span>
              <span className="font-extrabold text-xs text-slate-900">
                {data.lockoutType === 'group' ? `Grupal (Caja Lockbox: ${data.lockBoxNumber || 'N/A'})` : 'Individual (1 Candado / 1 Operario)'}
              </span>
            </div>
            <div className="p-2.5 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">FECHA Y ESTADO</span>
              <span className="font-extrabold text-xs text-slate-900">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')} — <span className="text-emerald-700 font-black">EN VIGENCIA</span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-2 p-2.5 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">SECTOR / SECCIÓN</span>
              <span className="font-extrabold text-xs text-slate-900">
                {data.location || 'Planta'} {data.department ? ` — Depto: ${data.department}` : ''} {data.sector ? ` — Sector: ${data.sector}` : ''}
              </span>
            </div>
            <div className="p-2.5 flex flex-col gap-0.5 bg-slate-50/30">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">SUPERVISOR RESPONSABLE</span>
              <span className="font-extrabold text-xs text-slate-900">{data.supervisor || 'No designado'}</span>
            </div>
          </div>
        </div>

        {/* Energy Sources & Devices */}
        <div className="mb-4 page-break-inside-avoid">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
            <Zap className="text-amber-600" size={16} />
            <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
              3. FUENTES DE ENERGÍA PELIGROSAS Y DISPOSITIVOS DE AISLAMIENTO
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                ENERGÍAS A CONSIGNAR
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.energyTypes?.length > 0 ? (
                  data.energyTypes.map((t: string, i: number) => {
                    const e = ENERGY_MAP[t] || {
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
                        className="px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1 border shadow-2xs"
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

            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                DISPOSITIVOS DE BLOQUEO REQUERIDOS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.lotoDevices?.length > 0 ? (
                  data.lotoDevices.map((d: string, i: number) => {
                    const dev = DEVICE_MAP[d] || { name: d, icon: '🔒' };
                    return (
                      <span
                        key={i}
                        className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
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

        {/* 5 Reglas de Oro Dec. 351/79 Anexo VI (si hay riesgo eléctrico) */}
        {hasElectrical && (
          <div className="mb-4 border border-amber-400 bg-amber-50/60 rounded-lg p-2.5 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-amber-300">
              <Zap className="text-amber-700" size={16} />
              <h3 className="text-xs font-black text-amber-950 m-0 uppercase tracking-wider">
                CINCO REGLAS DE ORO DE LA ELECTRICIDAD (DECRETO 351/79 ANEXO VI & REGL. AEA 90364)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
              {[
                { key: 'corteEfectivo', label: '1. Corte visible / efectivo de las fuentes de tensión', ok: goldenRules.corteEfectivo },
                { key: 'bloqueoEnclavamiento', label: '2. Bloqueo y enclavamiento mecánico de aparatos de corte (candados)', ok: goldenRules.bloqueoEnclavamiento },
                { key: 'verificacionAusencia', label: '3. Verificación obligatoria de ausencia de tensión (0V con multímetro)', ok: goldenRules.verificacionAusencia },
                { key: 'puestaATierraCorto', label: '4. Puesta a tierra y en cortocircuito de todas las fases y neutro', ok: goldenRules.puestaATierraCorto },
                { key: 'senalizacionZona', label: '5. Señalización y delimitación de la zona de trabajo protegida', ok: goldenRules.senalizacionZona }
              ].map((rule, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-1 rounded font-bold ${rule.ok ? 'bg-emerald-100/70 text-emerald-900' : 'bg-rose-100/70 text-rose-900'}`}>
                  {rule.ok ? <CheckSquare size={14} className="text-emerald-700 shrink-0" /> : <Square size={14} className="text-rose-600 shrink-0" />}
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Isolation Points List */}
        {data.isolationPointsList?.length > 0 && (
          <div className="mb-4 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
              <ShieldCheck className="text-blue-700" size={16} />
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                4. PUNTOS ESPECÍFICOS DE AISLAMIENTO ENERGÉTICO
              </h3>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_90px] bg-slate-100 p-2 border-b border-slate-300 font-black text-[10px] text-slate-700 uppercase tracking-wider">
                <div>PUNTO / VÁLVULA / SECCIONADOR</div>
                <div>ENERGÍA</div>
                <div>DISPOSITIVO</div>
                <div>UBICACIÓN / N° CANDADO</div>
                <div className="text-center">BLOQUEADO</div>
              </div>
              {data.isolationPointsList.map((point: any, idx: number) => {
                const e = ENERGY_MAP[point.energyType] || { name: point.energyType, icon: '⚡' };
                const dev = DEVICE_MAP[point.device] || { name: point.device, icon: '🔒' };
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_90px] gap-2 items-center p-2 border-b border-slate-200 page-break-inside-avoid ${
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
                    <div className="text-xs font-medium text-slate-600">
                      {point.location || 'N/A'} {point.lockNumber ? `(Candado #${point.lockNumber})` : ''}
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          point.verified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {point.verified ? '✓ CONSIGNADO' : '✗ PENDIENTE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification & Warnings */}
        <div className="grid grid-cols-2 gap-3 mb-4 page-break-inside-avoid">
          <div className="border border-amber-300 bg-amber-50/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1 text-amber-900">
              <Lock size={16} className="text-amber-700" />
              <span className="font-black text-xs uppercase">5. VERIFICACIÓN DE ENERGÍA CERO</span>
            </div>
            <p className="m-0 text-[11px] font-medium text-slate-800 leading-relaxed">
              {data.zeroEnergyVerification?.tested ? (
                <span>
                  CONFIRMADA mediante método:{' '}
                  <strong className="text-amber-950">
                    {data.zeroEnergyVerification.method === 'try_start'
                      ? 'Intento de Arranque Local (Pulsador / Try-Out)'
                      : data.zeroEnergyVerification.method === 'tester'
                      ? 'Medición de Tensión Residual con Multímetro (0 V)'
                      : data.zeroEnergyVerification.method === 'gauge'
                      ? 'Verificación de Manómetro a 0 bar / psi'
                      : data.zeroEnergyVerification.method === 'bleed_valve'
                      ? 'Purga y Despresurización en Válvula de Alivio'
                      : data.zeroEnergyVerification.method === 'visual'
                      ? 'Inspección Visual de Desconexión Física'
                      : 'Método específico documentado'}
                  </strong>
                </span>
              ) : (
                <span className="text-rose-700 font-bold">No se ha registrado verificación formal de energía cero.</span>
              )}
            </p>
            {data.isolationPoints && (
              <p className="mt-1 text-[10px] text-slate-600 font-medium">
                <strong>Notas:</strong> {data.isolationPoints}
              </p>
            )}
          </div>

          <div className="border border-rose-300 bg-rose-50/60 rounded-lg p-3 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-rose-900">
              <AlertTriangle size={16} className="text-rose-700" />
              <span className="font-black text-xs uppercase">PRINCIPIO TAXATIVO DE SEGURIDAD</span>
            </div>
            <p className="m-0 text-[10.5px] font-black text-rose-900 uppercase leading-snug">
              UN OPERARIO = UN CANDADO = UNA LLAVE. PROHIBIDO RETIRAR CANDADOS O TARJETAS DE CONSIGNACIÓN SIN AUTORIZACIÓN EXPRESA DEL RESPONSABLE DEL PROCEDIMIENTO.
            </p>
          </div>
        </div>

        {/* Restoration Checklist */}
        {data.restorationChecklist && (
          <div className="mb-4 border border-slate-300 rounded-lg p-3 bg-slate-50/40 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-1.5 text-slate-800 border-b border-slate-200 pb-1">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span className="font-black text-xs uppercase">6. DESBLOQUEO Y RESTABLECIMIENTO SEGURO DE ENERGÍA</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-bold text-slate-800">
              <div>[{data.restorationChecklist.guardsReinstalled ? '✓' : ' '}] Protecciones y guardas mecánicas reinstaladas</div>
              <div>[{data.restorationChecklist.toolsRemoved ? '✓' : ' '}] Herramientas y materiales auxiliares retirados</div>
              <div>[{data.restorationChecklist.personnelClear ? '✓' : ' '}] Todo el personal fuera de la zona de peligro</div>
              <div>[{data.restorationChecklist.locksRemoved ? '✓' : ' '}] Candados y etiquetas retirados por sus titulares</div>
              <div className="col-span-2 text-emerald-800 font-black mt-0.5">
                [{data.restorationChecklist.authorizedRestart ? '✓' : ' '}] Re-energización y puesta en marcha plenamente AUTORIZADA
              </div>
            </div>
          </div>
        )}

        {/* Observations */}
        {data.observations && (
          <div className="mb-4 border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-[10.5px] page-break-inside-avoid">
            <span className="font-bold text-slate-700 uppercase block mb-1">INSTRUCCIONES Y OBSERVACIONES ADICIONALES:</span>
            <p className="m-0 text-slate-800 whitespace-pre-wrap">{data.observations}</p>
          </div>
        )}

        {/* Final Signatures */}
        <div className="mt-4 page-break-inside-avoid">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'OPERARIO BLOQUEADOR / AFECTADO',
                    subtitle: 'Firma y Aclaración (1 Candado)',
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional !== false
                ? {
                    title: 'RESPONSABLE HIGIENE Y SEGURIDAD',
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
                    title: 'SUPERVISOR / ENCARGADO LOTO',
                    subtitle: (data.supervisor || 'Aprobación Técnica').toUpperCase(),
                    signatureUrl: data.signature || data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        <PdfBrandingFooter />

        <div className="mt-3 text-[9px] text-slate-500 text-center font-bold tracking-wider uppercase">
          REGISTRO OFICIAL DE CONSIGNACIÓN LOTO CONFORME A DECRETO 351/79 (CAP. 14 Y 15, ANEXO VI) Y NORMA OSHA 29 CFR 1910.147
        </div>
      </div>
    </div>
  );
}