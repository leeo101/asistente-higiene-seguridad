import React from 'react';
import { ShieldCheck, Wind, AlertTriangle, Activity, Clock, MapPin, Building2, Calendar, User, Wrench, CheckCircle2, XCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { evaluateAtmosphericConditions } from '../utils/srtProtocols';

interface ConfinedSpacePdfProps {
  data: any;
}

export default function ConfinedSpacePdf({ data }: ConfinedSpacePdfProps): React.ReactElement | null {
  if (!data) return null;

  const gasReadings = data.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '', stratum: 'general' };

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

  // Evaluación mediante motor oficial Res. SRT 953/10 y Res. 295/03
  const evalResult = evaluateAtmosphericConditions({
    o2: parseFloat(gasReadings.o2) || 0,
    lel: parseFloat(gasReadings.lel) || 0,
    co: parseFloat(gasReadings.co) || 0,
    h2s: parseFloat(gasReadings.h2s) || 0,
    stratum: gasReadings.stratum || 'general'
  });

  const o2Val = parseFloat(gasReadings.o2);
  const lelVal = parseFloat(gasReadings.lel);
  const coVal = parseFloat(gasReadings.co);
  const h2sVal = parseFloat(gasReadings.h2s);

  const hasGasAlert = !evalResult.isSafeToEnter && (gasReadings.o2 !== '' || gasReadings.lel !== '' || gasReadings.co !== '' || gasReadings.h2s !== '');

  const getGasColor = (param: string, val: string) => {
    const v = parseFloat(val);
    if (isNaN(v) || val === '') return { bg: 'bg-slate-50', color: 'text-slate-500', border: 'border-slate-200' };
    if (param === 'o2')
      return v >= 19.5 && v <= 23.5
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'lel')
      return v <= 10
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'co')
      return v <= 25 // Límite oficial argentino Res. 295/03
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'h2s')
      return v <= 10 // Límite oficial argentino Res. 295/03
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    return { bg: 'bg-slate-50', color: 'text-slate-500', border: 'border-slate-200' };
  };

  const ventilationText =
    typeof data.ventilation === 'object' && data.ventilation !== null
      ? Object.entries(data.ventilation)
          .filter(([_, v]) => v)
          .map(([k]) => (k === 'forced' || k === 'forced_positive' ? 'Forzada Positiva' : k === 'natural' ? 'Natural' : k === 'extractive' || k === 'forced_negative' ? 'Extractiva' : k))
          .join(', ') || 'Ventilación Mecánica No Especificada'
      : data.ventilation || 'No especificada';

  const docId = data.id ? String(data.id).slice(-6).toUpperCase() : 'S/N';
  const cuitPatronal = data.cuit || data.companyCuit || 'No especificado';
  const razonSocial = data.companyName || data.razonSocial || 'Establecimiento Industrial';
  const artNombre = data.art || data.artName || 'A.R.T. No especificada';
  const domicilio = data.establishmentAddress || data.address || data.location || 'Planta Industrial';

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
        <div
          className={`w-full h-2 rounded-t-lg mb-4 ${
            hasGasAlert
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-900'
              : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900'
          }`}
        ></div>

        {/* Encabezado Institucional SRT */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                RESOLUCIÓN S.R.T. N° 953/10
              </span>
              <span className="bg-blue-900 text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                DEC. 351/79 & RES. 295/03
              </span>
              <span
                className={`text-white font-black text-[9px] px-2 py-0.5 rounded uppercase ${
                  hasGasAlert ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                {hasGasAlert ? '⚠ ALERTA: CONDICIÓN NO SEGURA' : 'PERMISO DE TRABAJO HABILITADO'}
              </span>
            </div>
            <h1 className="m-0 text-xl font-black text-slate-900 uppercase tracking-tight">
              PERMISO DE TRABAJO SEGURO EN ESPACIOS CONFINADOS (PTSEC)
            </h1>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              EVALUACIÓN ATMOSFÉRICA ESTRATIFICADA, AISLAMIENTO LOTO Y RESCATE EXTERIOR
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <CompanyLogo style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-300 px-3 py-1 rounded-lg shadow-2xs">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">N° PERMISO PTSEC</div>
              <div className="text-sm font-black text-amber-700">#EC-{docId}</div>
            </div>
          </div>
        </div>

        {/* Cuadro 1: Identificación Patronal y del Establecimiento */}
        <div className="border border-slate-400 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider flex justify-between">
            <span>1. IDENTIFICACIÓN PATRONAL Y DEL ESTABLECIMIENTO (RES. S.R.T. 953/10)</span>
            <span className="text-amber-400">VIGENCIA: JORNADA ÚNICA</span>
          </div>
          <div className="grid grid-cols-4 p-2.5 gap-2 text-[10.5px]">
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Razón Social:</span>
              <span className="font-extrabold text-slate-900">{razonSocial}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">C.U.I.T. N°:</span>
              <span className="font-extrabold text-slate-900">{cuitPatronal}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">A.R.T.:</span>
              <span className="font-extrabold text-slate-900">{artNombre}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Sector / Planta:</span>
              <span className="font-extrabold text-slate-900">{data.location || data.sector || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Domicilio del Establecimiento:</span>
              <span className="font-semibold text-slate-800">{domicilio}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Fecha de Emisión:</span>
              <span className="font-extrabold text-slate-900">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Horario / Turno:</span>
              <span className="font-extrabold text-slate-900">{data.duration || 'Jornada Continua (Máx 8h)'}</span>
            </div>
          </div>
        </div>

        {/* Cuadro 2: Identificación del Recinto Confinado */}
        <div className="border border-slate-400 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider">
            2. CARACTERÍSTICAS DEL RECINTO Y TAREA A EJECUTAR
          </div>
          <div className="p-2.5 bg-amber-50/40 border-b border-slate-200">
            <span className="text-[9px] font-black text-amber-900 uppercase tracking-wider block">IDENTIFICACIÓN DEL ESPACIO CONFINADO:</span>
            <span className="font-black text-sm text-slate-900">{data.spaceName || 'No especificado'}</span>
            {data.description && <div className="text-[10px] font-medium text-slate-700 mt-0.5"><strong>Tarea planificada:</strong> {data.description}</div>}
          </div>
          <div className="grid grid-cols-3 p-2 gap-2 text-[10px] bg-slate-50/60">
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Tipo de Recinto:</span>
              <span className="font-extrabold text-slate-900 uppercase">{data.spaceType || 'Tanque / Recipiente'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Departamento / Área:</span>
              <span className="font-extrabold text-slate-900">{data.department || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Volumen / Acceso:</span>
              <span className="font-extrabold text-slate-900">{data.internalVolumeM3 ? `${data.internalVolumeM3} m³` : 'Boca de hombre vertical/lateral'}</span>
            </div>
          </div>
        </div>

        {/* Cuadro 3: Monitoreo Atmosférico Oficial (Res. SRT 953/10 & Res. 295/03) */}
        <div className="border-2 border-slate-900 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between font-black text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Activity size={15} className="text-amber-400" />
              <span>3. EVALUACIÓN ATMOSFÉRICA PREVIA Y CONTINUA (RES. S.R.T. 953/10 Y RES. 295/03)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${evalResult.isSafeToEnter ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {evalResult.status}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/50 border-b border-slate-200 text-[10px] flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-600">Instrumental:</span>{' '}
              <span className="font-extrabold text-slate-900">
                {data.instrument?.brand ? `${data.instrument.brand} ${data.instrument.model} (S/N: ${data.instrument.serialNumber})` : 'Detector Multigás Certificado (O2, LEL, CO, H2S)'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-600">Estrato:</span>{' '}
              <span className="font-extrabold uppercase text-amber-800">
                {gasReadings.stratum ? `${gasReadings.stratum} (Estratificación Res. 953/10)` : 'Piso / Medio / Techo'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 p-2.5 bg-white">
            {[
              { key: 'o2', label: 'OXÍGENO (O₂)', unit: '%', val: gasReadings.o2, limit: '19.5 – 23.5%', ref: 'Res. 953/10' },
              { key: 'lel', label: 'INFLAMABILIDAD (LEL)', unit: '%', val: gasReadings.lel, limit: '≤ 10% LEL', ref: 'Res. 953/10' },
              { key: 'co', label: 'MONÓXIDO (CO)', unit: 'ppm', val: gasReadings.co, limit: '≤ 25 ppm', ref: 'Res. 295/03' },
              { key: 'h2s', label: 'SULFÍDRICO (H₂S)', unit: 'ppm', val: gasReadings.h2s, limit: '≤ 10 ppm', ref: 'Res. 295/03' },
              { key: 'time', label: 'HORA CONTROL', unit: '', val: gasReadings.time || '-', limit: 'Monitoreo continuo', ref: 'In-situ' }
            ].map((gas) => {
              const c = gas.key !== 'time' ? getGasColor(gas.key, gas.val) : { bg: 'bg-slate-50', color: 'text-slate-900', border: 'border-slate-300' };
              return (
                <div key={gas.key} className={`p-2 rounded-lg border text-center ${c.bg} ${c.border}`}>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block leading-tight mb-0.5">{gas.label}</span>
                  <span className={`text-base font-black block leading-none my-1 ${c.color}`}>{gas.val !== '' ? gas.val : '--'}</span>
                  <span className="text-[8px] font-bold text-slate-500 block">{gas.unit}</span>
                  <span className="text-[7.5px] font-extrabold text-slate-500 block mt-0.5">{gas.limit}</span>
                  <span className="text-[7px] text-slate-400 block">({gas.ref})</span>
                </div>
              );
            })}
          </div>

          {evalResult.warnings.length > 0 && (
            <div className="p-2 bg-rose-50 border-t border-rose-200 text-rose-900 text-[10px] flex flex-col gap-0.5">
              {evalResult.warnings.map((w, idx) => (
                <div key={idx} className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-rose-700 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuadro 4: Verificación de Aislamiento LOTO, Ventilación y Rescate */}
        <div className="grid grid-cols-2 gap-2.5 mb-3 page-break-inside-avoid">
          {/* Ventilación y Aislamiento */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5">
            <div className="text-[9.5px] font-black text-slate-900 uppercase flex items-center gap-1 border-b border-slate-200 pb-1">
              <Wind size={13} className="text-blue-700" />
              <span>4.A. VENTILACIÓN Y ENCLAVAMIENTO (LOTO)</span>
            </div>
            <div className="text-[10px] text-slate-800">
              <span className="font-bold text-slate-600">Ventilación:</span>{' '}
              <span className="font-extrabold text-blue-900">{ventilationText}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] mt-0.5 font-bold">
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Válvulas bloqueadas
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Brida ciega instalada
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Bloqueo eléctrico LOTO
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Cañerías purgadas
              </div>
            </div>
          </div>

          {/* Sistema de Rescate y EPP */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5">
            <div className="text-[9.5px] font-black text-slate-900 uppercase flex items-center gap-1 border-b border-slate-200 pb-1">
              <ShieldCheck size={13} className="text-emerald-700" />
              <span>4.B. SISTEMA DE RESCATE SIN INGRESO ASISTIDO</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] mt-0.5 font-bold text-slate-800">
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Trípode y malacate listos
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Arnés integral clase E/A
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Línea de vida autorretráctil
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-600">✓</span> Comunicación permanente
              </div>
            </div>
          </div>
        </div>

        {/* Cuadro 5: Nómina del Personal y Roles Reglamentarios */}
        <div className="border border-slate-400 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} className="text-amber-400" />
            <span>5. PERSONAL ASIGNADO Y DESIGNACIÓN DE ROLES (RES. S.R.T. 953/10)</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-200 bg-white text-[10px]">
            <div className="p-2">
              <span className="font-black text-[8.5px] text-slate-500 uppercase block mb-1">ENTRANTES AUTORIZADOS</span>
              {data.team?.entrants?.length > 0 ? (
                data.team.entrants.map((e: string, i: number) => (
                  <div key={i} className="font-extrabold text-slate-900">
                    • {e}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 font-semibold">-</div>
              )}
            </div>
            <div className="p-2 bg-amber-50/30">
              <span className="font-black text-[8.5px] text-amber-900 uppercase block mb-1">
                VIGÍA EXTERIOR PERMANENTE (STANDBY) *
              </span>
              <div className="font-black text-slate-900">{data.team?.attendant || data.attendantName || '-'}</div>
              <span className="text-[7.5px] text-amber-800 font-bold block mt-0.5 leading-tight">
                * Prohibición taxativa de abandonar el acceso mientras haya personal dentro.
              </span>
            </div>
            <div className="p-2">
              <span className="font-black text-[8.5px] text-slate-500 uppercase block mb-1">SUPERVISOR DE ENTRADA</span>
              <div className="font-extrabold text-slate-900">{data.team?.supervisor || data.supervisorName || '-'}</div>
              <span className="font-black text-[8.5px] text-slate-500 uppercase block mt-1.5 mb-0.5">RESCATE EXTERNO:</span>
              <div className="font-extrabold text-slate-700">{data.team?.rescue || 'Equipo de Intervención Rápida'}</div>
            </div>
          </div>
        </div>

        {/* Cuadro 6: Observaciones y Conclusiones Técnicas */}
        {data.observations && (
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-3 page-break-inside-avoid">
            <div className="bg-slate-900 text-white px-3 py-1 font-black text-[9.5px] uppercase tracking-wider">
              6. OBSERVACIONES, INSTRUCCIONES Y CONDICIONES ESPECÍFICAS
            </div>
            <div className="p-2.5 bg-slate-50 text-[10px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
              {data.observations}
            </div>
          </div>
        )}

        {/* Bloque de Firmas Tripartitas Reglamentarias */}
        <div className="mt-4 page-break-inside-avoid">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'VIGÍA EXTERIOR PERMANENTE',
                    subtitle: (data.team?.attendant || data.attendantName || 'Vigía Standby').toUpperCase(),
                    signatureUrl: data.operatorSignature || data.attendantSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional !== false
                ? {
                    title: 'RESPONSABLE HIGIENE Y SEGURIDAD',
                    subtitle: (actName || data.professionalName || 'Especialista HyS').toUpperCase(),
                    signatureUrl: actSignature || null,
                    stampUrl: data.professionalStamp || actStamp || null,
                    isProfessional: true,
                    license: actLic || data.professionalLicense || null
                  }
                : null
            }
            box3={
              data.showSignatures?.supervisor !== false
                ? {
                    title: 'SUPERVISOR HABILITANTE',
                    subtitle: (data.team?.supervisor || data.supervisorName || 'Supervisor Autorizante').toUpperCase(),
                    signatureUrl: data.supervisorSignature || data.signature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        {/* Marco Legal de Validez */}
        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2 page-break-inside-avoid text-[9.5px]">
          <AlertTriangle size={15} className="text-amber-800 shrink-0 mt-0.5" />
          <p className="m-0 text-amber-950 font-bold leading-normal">
            <strong>MARCO NORMATIVO RES. S.R.T. N° 953/10 & RES. MTEySS N° 295/03 ANEXO IV:</strong> Este Permiso de Trabajo Seguro tiene carácter de declaración jurada y validez exclusiva para el turno u horario especificado (máximo 8 horas). Caduca de forma automática si se interrumpen la ventilación forzada mecánica, si se detecta alarma de gas en el monitor continuo o si el vigía debe retirarse del puesto de acceso.
          </p>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}