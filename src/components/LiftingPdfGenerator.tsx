import React from 'react';
import { Weight, ShieldCheck, CheckCircle2, Wind, Calendar, MapPin, UserCheck } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function LiftingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const loadWeight = parseFloat(data.loadWeight) || 0;
  const capacity = parseFloat(data.equipmentCapacity) || 1;
  const loadPercentage = (loadWeight / capacity) * 100;
  const isCritical = loadPercentage >= 75;

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <div className="w-full flex justify-center bg-slate-100 p-4 print:p-0 print:bg-transparent">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[15mm_18mm] bg-white text-slate-900 shadow-xl rounded-xl border border-slate-200 box-sizing-border-box m-0-auto font-sans print:shadow-none print:border-none print:m-0 print:p-0"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
              border: none !important;
            }
          `}
        </style>

        {/* ═══ HEADER EJECUTIVO (Azul Marino / Slate Corporativo - Sin dorado) ═══ */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl mb-6 text-white shadow-md flex justify-between items-center relative overflow-hidden border-b-4 border-blue-600">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-center border border-white/20 shadow-inner">
              <Crane size={32} color="#38bdf8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/60">
                  ASME B30.5 / OSHA 1926.1400
                </span>
                <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full ${isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                  {isCritical ? '🔴 IZAJE CRÍTICO' : '🟢 IZAJE ESTÁNDAR'}
                </span>
              </div>
              <h1 className="m-0 text-xl font-black uppercase tracking-tight text-white leading-none">
                Plan de Izaje Seguro
              </h1>
              <p className="m-0 mt-1 text-xs text-slate-300 font-medium">
                Permiso de Trabajo Crítico y Hoja de Maniobra de Carga
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 z-10">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              <CompanyLogo style={{ maxHeight: '40px', maxWidth: '130px', objectFit: 'contain' }} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Doc. Controlado</span>
          </div>
        </div>

        {/* ═══ DATOS PRINCIPALES Y UBICACIÓN ═══ */}
        <div className={`p-4 rounded-xl border mb-6 flex flex-wrap justify-between items-center gap-4 ${isCritical ? 'bg-red-50/70 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <MapPin size={14} className="text-blue-600" />
              <span>Ubicación / Sector de Maniobra</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 m-0">{data.location || 'Planta General'}</h2>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span>Equipo: <strong className="text-slate-900">{data.equipment || 'Grúa Móvil'}</strong></span>
              {data.maxRadius && <span>• Radio Máx: <strong className="text-slate-900">{data.maxRadius} m</strong></span>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Capacidad Utilizada</div>
            <div className={`text-2xl font-black ${isCritical ? 'text-red-600' : 'text-emerald-600'}`}>
              {loadPercentage ? loadPercentage.toFixed(1) : '0.0'}%
            </div>
            <div className={`text-[10px] font-bold uppercase ${isCritical ? 'text-red-700' : 'text-emerald-700'}`}>
              {isCritical ? '⚠️ Requiere Supervisión Senior' : '✓ Dentro de margen seguro'}
            </div>
          </div>
        </div>

        {/* ═══ METADATOS TÉCNICOS EN GRILLA ═══ */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-blue-600" /> Fecha / Hora
            </span>
            <span className="text-xs font-extrabold text-slate-900 block">
              {formattedDate} {data.time && `• ${data.time} hs`}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Wind size={12} className="text-blue-600" /> Viento Máximo
            </span>
            <span className="text-xs font-extrabold text-slate-900 block">
              {data.windSpeed ? `${data.windSpeed} km/h` : 'No especificado'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <UserCheck size={12} className="text-blue-600" /> Operador Grúa
            </span>
            <span className="text-xs font-extrabold text-slate-900 block truncate" title={data.personnel?.operator}>
              {data.personnel?.operator || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <ShieldCheck size={12} className="text-blue-600" /> Rigger / Señalero
            </span>
            <span className="text-xs font-extrabold text-slate-900 block truncate" title={data.personnel?.rigger}>
              {data.personnel?.rigger || '—'}
            </span>
          </div>
        </div>

        {/* ═══ CÁLCULO DE CARGA Y RIGGING ═══ */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="bg-slate-100 border-b border-slate-200 text-slate-900 px-4 py-2.5 flex items-center justify-between">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-900">
              <Weight size={16} className="text-blue-600" /> Evaluación de Carga y Capacidad
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">ASME B30.5</span>
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-700 w-2/3">Peso Total a Izar (Pieza + Aparejos + Ganchos)</td>
                <td className="p-3 font-black text-slate-900 text-right">{data.loadWeight ? `${parseFloat(data.loadWeight).toLocaleString('es-AR')} kg` : '0 kg'}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-white">
                <td className="p-3 font-semibold text-slate-700">Capacidad Bruta de la Grúa (al radio especificado)</td>
                <td className="p-3 font-black text-slate-900 text-right">{data.equipmentCapacity ? `${parseFloat(data.equipmentCapacity).toLocaleString('es-AR')} kg` : '0 kg'}</td>
              </tr>
              <tr className={isCritical ? 'bg-red-100 text-red-950' : 'bg-emerald-100 text-emerald-950'}>
                <td className="p-3 font-black">Porcentaje de Capacidad Solicitada (%)</td>
                <td className="p-3 font-black text-right text-sm">
                  {loadPercentage ? loadPercentage.toFixed(1) : 0}% ({isCritical ? 'CRÍTICO' : 'DENTRO DE NORMA'})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ═══ APAREJOS Y ACCESORIOS SELECCIONADOS ═══ */}
        {data.riggingElements && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
              Accesorios de Izaje Inspeccionados:
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className={`px-2.5 py-1 rounded-lg border ${data.riggingElements.slings ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {data.riggingElements.slings ? '✓' : '✕'} Eslingas (Sintéticas / Acero)
              </span>
              <span className={`px-2.5 py-1 rounded-lg border ${data.riggingElements.shackles ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {data.riggingElements.shackles ? '✓' : '✕'} Grilletes Certificados
              </span>
              <span className={`px-2.5 py-1 rounded-lg border ${data.riggingElements.spreaderBar ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {data.riggingElements.spreaderBar ? '✓' : '✕'} Percha / Balancín
              </span>
              <span className={`px-2.5 py-1 rounded-lg border ${data.riggingElements.hooks ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {data.riggingElements.hooks ? '✓' : '✕'} Ganchos con Traba de Seguridad
              </span>
            </div>
          </div>
        )}

        {/* ═══ CHECKLIST DE SEGURIDAD ═══ */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="bg-slate-100 border-b border-slate-200 text-slate-900 px-4 py-2.5 flex items-center justify-between">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-900">
              <CheckCircle2 size={16} className="text-emerald-600" /> Verificación Pre-Maniobra (Checklist)
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">OSHA 1926.1400</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {[
              { key: 'groundStable', label: 'Terreno firme, nivelado y estabilizadores extendidos al 100% con platos de apoyo.' },
              { key: 'areaIsolated', label: 'Zona de radio de giro delimitada, vallada y señalizada (prohibido tránsito de personas).' },
              { key: 'weatherGood', label: 'Condiciones meteorológicas favorables (viento < 32 km/h, sin tormenta ni visibilidad nula).' },
              { key: 'powerLinesClear', label: 'Distancia de seguridad mantenida a líneas eléctricas de media/alta tensión.' },
              { key: 'elementsInspected', label: 'Accesorios de izaje inspeccionados con código de color vigente y rotulación visible.' }
            ].map((item, idx) => {
              const isChecked = data.checklist?.[item.key];
              return (
                <div key={idx} className="p-2.5 px-4 flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold shrink-0 text-xs ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-300'}`}>
                    {isChecked ? '✓' : '✕'}
                  </div>
                  <span className={isChecked ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ OBSERVACIONES Y MEDIDAS PREVENTIVAS ═══ */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
            Observaciones y Medidas de Seguridad Complementarias:
          </span>
          <p className="m-0 text-xs font-medium text-slate-700 leading-relaxed">
            {data.observations || 'Sin observaciones adicionales. Maniobra sujeta al cumplimiento estricto del presente plan de izaje.'}
          </p>
        </div>

        {/* ═══ FIRMAS DIGITALES ═══ */}
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
          } : null}
        />

        <PdfBrandingFooter />
      </div>
    </div>
  );
}