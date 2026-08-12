import React from 'react';
import { ShieldCheck, Wind, AlertTriangle, Activity, Clock, MapPin, Building2, Calendar, User } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function ConfinedSpacePdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const gasReadings = data.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '' };

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

  const o2Val = parseFloat(gasReadings.o2);
  const lelVal = parseFloat(gasReadings.lel);
  const coVal = parseFloat(gasReadings.co);
  const h2sVal = parseFloat(gasReadings.h2s);
  const hasGasAlert =
    (!isNaN(o2Val) && (o2Val < 19.5 || o2Val > 23.5)) ||
    (!isNaN(lelVal) && lelVal >= 10) ||
    (!isNaN(coVal) && coVal >= 25) ||
    (!isNaN(h2sVal) && h2sVal >= 10);

  const getGasColor = (param: string, val: string) => {
    const v = parseFloat(val);
    if (isNaN(v)) return { bg: 'bg-slate-50', color: 'text-slate-500', border: 'border-slate-200' };
    if (param === 'o2')
      return v >= 19.5 && v <= 23.5
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'lel')
      return v < 10
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'co')
      return v < 25
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    if (param === 'h2s')
      return v < 10
        ? { bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-300' }
        : { bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-300' };
    return { bg: 'bg-slate-50', color: 'text-slate-500', border: 'border-slate-200' };
  };

  const ventilationText =
    typeof data.ventilation === 'object' && data.ventilation !== null
      ? Object.entries(data.ventilation)
          .filter(([_, v]) => v)
          .map(([k]) => (k === 'forced' ? 'Forzada' : k === 'natural' ? 'Natural' : 'Extractiva'))
          .join(', ') || 'No especificada'
      : data.ventilation || 'No especificada';

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
        <div
          className={`w-full h-2 rounded-t-lg mb-5 ${
            hasGasAlert
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-900'
              : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900'
          }`}
        ></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                NORMATIVA RES. SRT 95/03
              </span>
              <span
                className={`text-white font-black text-[10px] px-2 py-0.5 rounded uppercase ${
                  hasGasAlert ? 'bg-rose-600' : 'bg-amber-600'
                }`}
              >
                {hasGasAlert ? '⚠ ALERTA ATMÓSFERA PELIGROSA' : 'PERMISO DE TRABAJO ESPECIAL'}
              </span>
            </div>
            <h1 className="m-0 text-2xl font-black text-slate-900 uppercase tracking-tight">
              PERMISO DE INGRESO A ESPACIO CONFINADO
            </h1>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wide">
              EVALUACIÓN ATMOSFÉRICA Y CONTROL DE SEGURIDAD EN INGRESOS
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <CompanyLogo style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">N° PERMISO</div>
              <div className="text-sm font-black text-amber-700">#EC-{docId}</div>
            </div>
          </div>
        </div>

        {/* Identificación del Espacio */}
        <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-5 bg-white page-break-inside-avoid shadow-xs">
          <div className="bg-slate-900 text-white font-black text-[11px] px-4 py-1.5 uppercase tracking-wider">
            IDENTIFICACIÓN DEL ESPACIO CONFINADO Y UBICACIÓN
          </div>
          <div className="p-3 bg-amber-50/60 border-b border-slate-200 flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">NOMBRE DEL ESPACIO CONFINADO</span>
            <span className="font-black text-base text-slate-900">{data.spaceName || 'No especificado'}</span>
            {data.description && <span className="text-xs font-bold text-slate-600 mt-1">{data.description}</span>}
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 size={12} /> DEPARTAMENTO
              </span>
              <span className="font-extrabold text-xs text-slate-900">{data.department || '-'}</span>
            </div>
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} /> UBICACIÓN / SECTOR
              </span>
              <span className="font-extrabold text-xs text-slate-900">{data.location || '-'}</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> TIPO DE ESPACIO
              </span>
              <span className="font-extrabold text-xs text-slate-900 capitalize">{data.spaceType || 'Tanque'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> FECHA DE EMISIÓN
              </span>
              <span className="font-extrabold text-xs text-slate-900">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : '-'}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> DURACIÓN ESTIMADA
              </span>
              <span className="font-extrabold text-xs text-slate-900">{data.duration || '-'}</span>
            </div>
          </div>
        </div>

        {/* Monitoreo Atmosférico */}
        <div className="mb-5 page-break-inside-avoid border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white p-2.5 flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-amber-400" />
              <span>MONITOREO ATMOSFÉRICO OBLIGATORIO PRE-INGRESO</span>
            </div>
            {hasGasAlert && (
              <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded text-[10px] font-black">
                ⚠ FUERA DE LÍMITES PERMITIDOS
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 p-3 bg-white">
            {[
              { key: 'o2', label: 'OXÍGENO (O₂)', unit: '%', val: gasReadings.o2, limit: '19.5 – 23.5%' },
              { key: 'lel', label: 'EXPLOSIVIDAD (LEL)', unit: '%', val: gasReadings.lel, limit: '< 10%' },
              { key: 'co', label: 'MONÓXIDO (CO)', unit: 'ppm', val: gasReadings.co, limit: '< 25 ppm' },
              { key: 'h2s', label: 'SULFÍDRICO (H₂S)', unit: 'ppm', val: gasReadings.h2s, limit: '< 10 ppm' },
              { key: 'time', label: 'HORA DE MEDICIÓN', unit: '', val: gasReadings.time, limit: '' }
            ].map((gas) => {
              const c = gas.key !== 'time' ? getGasColor(gas.key, gas.val) : { bg: 'bg-slate-50', color: 'text-slate-900', border: 'border-slate-300' };
              return (
                <div key={gas.key} className={`p-2.5 rounded-xl border text-center ${c.bg} ${c.border}`}>
                  <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">{gas.label}</span>
                  <span className={`text-base font-black block leading-none ${c.color}`}>{gas.val || '--'}</span>
                  <span className="text-[9px] font-bold text-slate-500 block mt-0.5">{gas.unit}</span>
                  {gas.limit && <span className="text-[8px] font-extrabold text-slate-400 block mt-1">Lím: {gas.limit}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ventilación y Peligros */}
        <div className="grid grid-cols-2 gap-4 mb-5 page-break-inside-avoid">
          <div className="border border-blue-300 bg-blue-50/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5 text-blue-900">
              <Wind size={18} className="text-blue-700" />
              <span className="font-black text-xs uppercase">SISTEMA DE VENTILACIÓN APLICADO</span>
            </div>
            <div className="text-xs font-extrabold text-blue-900">{ventilationText}</div>
          </div>

          <div className="border border-rose-300 bg-rose-50/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5 text-rose-900">
              <AlertTriangle size={18} className="text-rose-700" />
              <span className="font-black text-xs uppercase">PELIGROS POTENCIALES IDENTIFICADOS</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.hazards?.length > 0 ? (
                data.hazards.map((p: string, i: number) => (
                  <span key={i} className="bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Ninguno identificado</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipo de Trabajo Asignado */}
        {data.team && (
          <div className="mb-5 page-break-inside-avoid border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
              <User size={16} className="text-amber-400" />
              <span>EQUIPO DE TRABAJO ASIGNADO Y VIGILANCIA</span>
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-200 bg-white">
              <div className="p-3">
                <span className="font-black text-[10px] text-slate-500 uppercase block mb-1">ENTRANTES / TRABAJADORES</span>
                {data.team.entrants?.length > 0 ? (
                  data.team.entrants.map((e: string, i: number) => (
                    <div key={i} className="font-extrabold text-xs text-slate-900">
                      • {e}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">-</div>
                )}
              </div>
              <div className="p-3">
                <span className="font-black text-[10px] text-slate-500 uppercase block mb-1">VIGÍA EXTENO</span>
                <div className="font-extrabold text-xs text-slate-900">{data.team.attendant || '-'}</div>
              </div>
              <div className="p-3">
                <span className="font-black text-[10px] text-slate-500 uppercase block mb-1">SUPERVISOR AUTORIZANTE</span>
                <div className="font-extrabold text-xs text-slate-900">{data.team.supervisor || '-'}</div>
              </div>
              <div className="p-3">
                <span className="font-black text-[10px] text-slate-500 uppercase block mb-1">EQUIPO DE RESCATE</span>
                <div className="font-extrabold text-xs text-slate-900">{data.team.rescue || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Equipamiento de Seguridad */}
        {data.equipment && (
          <div className="mb-5 page-break-inside-avoid border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>EQUIPAMIENTO DE PROTECCIÓN Y SEGURIDAD VERIFICADO</span>
            </div>
            <div className="p-3 bg-slate-50 flex flex-wrap gap-2">
              {data.equipment.filter((e: any) => e.checked).length > 0 ? (
                data.equipment
                  .filter((e: any) => e.checked)
                  .map((e: any, i: number) => (
                    <span
                      key={i}
                      className="bg-white border border-slate-300 text-slate-900 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="text-emerald-600">✓</span> {e.name}
                    </span>
                  ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Ningún equipo seleccionado</span>
              )}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {data.observations && (
          <div className="mb-5 border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-900 text-white p-2 font-black text-xs uppercase tracking-wider">
              OBSERVACIONES Y CONDICIONES ESPECIALES DEL PERMISO
            </div>
            <div className="p-3 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
              {data.observations}
            </div>
          </div>
        )}

        {/* Firmas */}
        <div className="mt-6 page-break-inside-avoid">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator
                ? {
                    title: 'RESPONSABLE / ENTRANTE',
                    subtitle: 'Control de Ingreso',
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional
                ? {
                    title: 'GERENCIA EHS / EMISOR',
                    subtitle: (actName || 'Firma de Especialista').toUpperCase(),
                    signatureUrl: actSignature || null,
                    stampUrl: data.professionalStamp || actStamp || null,
                    isProfessional: true,
                    license: actLic || null
                  }
                : null
            }
            box3={
              data.showSignatures?.supervisor
                ? {
                    title: 'AUTORIZACIÓN DE INGRESO',
                    subtitle: 'Firma del Autorizante',
                    signatureUrl: data.signature || data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        {/* Aviso Legal */}
        <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 page-break-inside-avoid">
          <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="m-0 text-[11px] text-amber-900 font-bold leading-relaxed">
            <strong>AVISO LEGAL RES. SRT 95/03:</strong> Este permiso es de validez única por jornada/turno de ingreso. Caduca inmediatamente ante variaciones en la atmósfera medida, emergencias o suspensión de trabajos. Prohibido el ingreso sin autorización previa firmada.
          </p>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}