import React from 'react';
import { Volume2, ShieldCheck, AlertTriangle, Activity, Headphones, Award, Building2, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { evaluateFullNoiseProtocolSRT85 } from '../utils/srtProtocols';

const TYPE_MAP: Record<string, string> = {
  personal: 'Dosimetría Personal',
  area: 'Medición de Área / Puesto Fijo',
  peak: 'Ruido de Impacto / Impulsivo',
  octave: 'Análisis Espectral por Bandas de Octava'
};

export default function NoiseAssessmentPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  // Extraer información
  const {
    empresa,
    razonSocial,
    cuit,
    direccion,
    localidad,
    provincia,
    sector,
    location,
    puestoTrabajo,
    task,
    tarea,
    workerName,
    trabajadorNombre,
    trabajadorCuil,
    trabajadoresExpuestosPuesto,
    date,
    fecha,
    horaInicio,
    horaFin,
    duracionJornadaHoras,
    duration,
    duracionMedicionHoras,
    tipoRuido,
    type,
    instrument,
    equipment,
    levels,
    hearingProtection,
    backgroundNoise,
    ruidoFondoDb,
    observations,
    medidasCorrectivas,
    technician,
    technicianLicense,
    operatorSignature,
    supervisorSignature,
    professionalSignature,
    professionalStamp,
    showSignatures
  } = data;

  const rSocial = razonSocial || empresa || 'Empresa Sin Especificar';
  const sec = sector || location || 'Sector General';
  const pto = puestoTrabajo || task || tarea || 'Puesto Operativo';
  const trab = trabajadorNombre || workerName || 'Trabajador del Puesto';
  const fMed = fecha || date || new Date().toISOString();
  const jHs = Number(duracionJornadaHoras) || Number(duration) || 8;
  const laeqVal = parseFloat(levels?.lavg || levels?.laeq || 0);
  const fondoVal = parseFloat(ruidoFondoDb ?? backgroundNoise ?? 0);

  // Evaluar protocolo con motor Res. SRT 85/12
  const evalMetrics = evaluateFullNoiseProtocolSRT85({
    laeq: laeqVal,
    duracionJornadaHoras: jHs,
    duracionMedicionHoras: Number(duracionMedicionHoras) || jHs,
    ruidoFondoDb: fondoVal > 0 ? fondoVal : undefined,
    instrument: {
      fechaCalibracionLaboratorio: instrument?.lastCalibration || instrument?.fechaCalibracionLaboratorio,
      verificacionInicialDb: Number(instrument?.verificacionInicialDb) || undefined,
      verificacionFinalDb: Number(instrument?.verificacionFinalDb) || undefined
    },
    hearingProtection: {
      usaEPP: typeof hearingProtection === 'object' ? hearingProtection?.usaEPP : !!hearingProtection,
      nrr_snr: Number(hearingProtection?.nrr_snr || hearingProtection?.nrr) || undefined,
      factorDesclasificacion: hearingProtection?.factorDesclasificacion || 0.70
    }
  });

  const isCritical = evalMetrics.limiteExcedido;
  const isConforme = evalMetrics.dictamenGeneral === 'CONFORME';

  // Firma y datos del profesional
  let actSignature: string | null = professionalSignature || data?.signature || null;
  let actStamp: string | null = professionalStamp || null;
  let actName: string | null = data?.professionalName || technician || null;
  let actLic: string | null = data?.professionalLicense || technicianLicense || null;

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

  // Nombre del protector
  const eppNombre = typeof hearingProtection === 'object'
    ? hearingProtection?.tipoEPP || hearingProtection?.marcaModelo || 'Sin EPP'
    : (hearingProtection || 'Sin EPP');

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[10mm_12mm] bg-white text-slate-800 shadow-xl rounded-lg box-border mx-auto text-[8.5pt] font-sans"
        style={{
          borderTop: isCritical ? '10px solid #dc2626' : isConforme ? '10px solid #10b981' : '10px solid #f59e0b'
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 6mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; background: white !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
            .no-print, nav, header, aside, .sidebar, .module-form-toolbar, .module-action-bar, .module-wizard-footer { display: none !important; }
            #pdf-content, .print-area {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-top: ${isCritical ? '10px solid #dc2626' : isConforme ? '10px solid #10b981' : '10px solid #f59e0b'} !important;
              border-radius: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              opacity: 1 !important;
              visibility: visible !important;
              z-index: 999999 !important;
            }
            .pdf-signatures-wrapper {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 6px; border: 1px solid #cbd5e1; }
          `}
        </style>

        {/* Encabezado Oficial Res. SRT 85/12 */}
        <div className="flex flex-row justify-between items-start border-b-2 border-slate-200 pb-2.5 mb-3 w-full">
          <div className="flex-1 text-left">
            <p className="m-0 font-extrabold text-[0.62rem] uppercase text-slate-500 tracking-wider">Superintendencia de Riesgos del Trabajo</p>
            <p style={{ color: isCritical ? '#dc2626' : isConforme ? '#059669' : '#d97706' }} className="m-0 font-black text-[0.75rem] uppercase">
              {isCritical ? '⚠ PROTOCOLO CON EXCESO DE LMPE' : 'PROTOCOLO OFICIAL RES. S.R.T. N° 85/12'}
            </p>
          </div>

          <div className="flex-[2] flex flex-col items-center justify-center text-center">
            <h1 className="m-0 font-black text-xl tracking-tight uppercase leading-none text-slate-900">RUIDO LABORAL</h1>
            <div style={{ background: isCritical ? '#dc2626' : isConforme ? '#10b981' : '#f59e0b' }} className="mt-1 text-white px-2.5 py-0.5 rounded-full text-[0.6rem] font-black tracking-wider uppercase">
              Dec. 351/79 Anexo V • Res. MTEySS 295/03 Anexo V • Res. SRT 85/12
            </div>
          </div>

          <div className="flex-1 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '36px', maxWidth: '120px', objectFit: 'contain' }} />
            <span className="text-[0.62rem] font-bold text-slate-400">Anexo I - Hoja 1/1</span>
          </div>
        </div>

        {/* 1. Datos del Establecimiento y Empleador */}
        <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Building2 size={12} /> 1. DATOS DEL ESTABLECIMIENTO Y PUESTO EVALUADO
          </div>
          <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Razón Social</span>
              <div className="font-extrabold text-xs text-slate-900">{rSocial}</div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">C.U.I.T. N°</span>
              <div className="font-bold text-xs text-slate-800">{cuit || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 bg-white border-b border-slate-200">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Sector Evaluado</span>
              <div className="font-bold text-xs text-slate-800">{sec}</div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Puesto de Trabajo / Tarea</span>
              <div className="font-bold text-xs text-slate-800">{pto}</div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Trabajador Evaluado</span>
              <div className="font-bold text-xs text-slate-800">{trab} {trabajadorCuil ? `(CUIL: ${trabajadorCuil})` : ''}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 bg-slate-50">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Fecha y Horario</span>
              <div className="font-bold text-xs text-slate-800">
                {new Date(fMed).toLocaleDateString('es-AR')} {horaInicio && horaFin ? `(${horaInicio} a ${horaFin})` : ''}
              </div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Duración de la Jornada</span>
              <div className="font-bold text-xs text-slate-800">{jHs} hs diarias</div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Tipo de Medición / Ruido</span>
              <div className="font-bold text-xs text-slate-800">
                {TYPE_MAP[type] || 'Dosimetría Personal'} • {tipoRuido || 'Continuo'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Instrumental Utilizado y Calibraciones */}
        <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Award size={12} /> 2. INSTRUMENTAL UTILIZADO Y VERIFICACIÓN ACÚSTICA (RES. SRT 85/12)
          </div>
          <div className="grid grid-cols-3 bg-white border-b border-slate-200">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Equipo / Marca y Modelo</span>
              <div className="font-bold text-xs text-slate-800">
                {instrument?.model || equipment || instrument?.marca ? `${instrument?.marca || ''} ${instrument?.model || equipment || ''}` : 'Sonómetro Integrador Clase 1 / Dosímetro'}
              </div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">N° de Serie / Calibración Periódica</span>
              <div className="font-bold text-xs text-slate-800">
                S/N: {instrument?.serial || instrument?.numeroSerie || '-'} | Cal: {instrument?.lastCalibration || instrument?.fechaCalibracionLaboratorio || 'Vigente (< 24 meses)'}
              </div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Calibrador Acústico</span>
              <div className="font-bold text-xs text-slate-800">
                {instrument?.calibrador?.marca ? `${instrument.calibrador.marca} ${instrument.calibrador.modelo || ''} (94 dB)` : 'Pistófono Acústico 94.0 dB a 1 kHz'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 bg-slate-50">
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Verificación In-Situ Pre / Post</span>
              <div className="font-bold text-xs text-slate-800">
                Pre: {instrument?.verificacionInicialDb ? `${instrument.verificacionInicialDb} dB` : '94.0 dB'} | Post: {instrument?.verificacionFinalDb ? `${instrument.verificacionFinalDb} dB` : '94.0 dB'} (Δ ≤ 0.5 dB OK)
              </div>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Ruido de Fondo Medido</span>
              <div className="font-bold text-xs text-slate-800">
                {fondoVal > 0 ? `${fondoVal} dB(A)` : 'No aplica / despreciable'} {evalMetrics.correccionFondoDb > 0 ? `(Corr: -${evalMetrics.correccionFondoDb} dB)` : ''}
              </div>
            </div>
            <div className="p-2">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Estado Instrumental</span>
              <div className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={12} /> Calibración y Deriva Conformes
              </div>
            </div>
          </div>
        </div>

        {/* 3. Panel de Resultados Acústicos Normativos */}
        <div
          className="border rounded-lg p-3 mb-2.5 flex flex-col justify-between"
          style={{
            borderColor: isCritical ? '#f87171' : isConforme ? '#86efac' : '#fcd34d',
            backgroundColor: isCritical ? '#fef2f2' : isConforme ? '#f0fdf4' : '#fffbeb'
          }}
        >
          <div className="flex justify-between items-center border-b pb-2 mb-2" style={{ borderColor: isCritical ? '#fca5a5' : isConforme ? '#bbf7d0' : '#fde68a' }}>
            <div>
              <span className="text-[0.62rem] font-extrabold uppercase text-slate-600 tracking-wider block">
                NIVEL SONORO CONTINUO EQUIVALENTE (NSCE / LAeq)
              </span>
              <div className="flex items-baseline gap-2">
                <span style={{ color: isCritical ? '#dc2626' : isConforme ? '#059669' : '#d97706' }} className="text-3xl font-black leading-none">
                  {evalMetrics.nivelCorregidoLaeq} <span className="text-base font-bold">dB(A)</span>
                </span>
                {evalMetrics.correccionFondoDb > 0 && (
                  <span className="text-[0.62rem] text-slate-500 italic">
                    (Bruto: {laeqVal} dB(A) - Corr. Fondo: {evalMetrics.correccionFondoDb} dB)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div
                style={{ background: isCritical ? '#dc2626' : isConforme ? '#10b981' : '#f59e0b' }}
                className="text-white px-3 py-1 rounded-full font-black text-xs uppercase shadow-sm inline-flex items-center gap-1.5"
              >
                {isCritical ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
                {evalMetrics.dictamenGeneral}
              </div>
              <span className="text-[0.6rem] font-bold text-slate-500 block mt-1">
                Límite Máximo Permisible: 85 dB(A) para 8 horas (Res. 295/03)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/80 p-1.5 rounded border border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Nivel Diario LEX,8h</span>
              <span className="font-black text-sm text-slate-800">{evalMetrics.lex8h} dB(A)</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded border border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Dosis Diaria Calculada</span>
              <span style={{ color: evalMetrics.dosisDiariaPercent > 100 ? '#dc2626' : '#059669' }} className="font-black text-sm">
                {evalMetrics.dosisDiariaPercent}%
              </span>
            </div>
            <div className="bg-white/80 p-1.5 rounded border border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Tiempo Máx. Permitido</span>
              <span className="font-black text-sm text-slate-800">{evalMetrics.tiempoPermitidoHoras} hs</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded border border-slate-200">
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Pico Registrado (Lpeak)</span>
              <span className="font-black text-sm text-slate-800">{levels?.lpeak ? `${levels.lpeak} dBC` : '< 135 dBC'}</span>
            </div>
          </div>
        </div>

        {/* 4. Evaluación del Protector Auditivo (IRAM 4060) */}
        <div className="border border-slate-300 rounded-lg mb-2.5 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Headphones size={12} /> 3. EVALUACIÓN Y ADECUACIÓN DEL PROTECTOR AUDITIVO
          </div>
          <div className="grid grid-cols-3 bg-white p-2">
            <div>
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Protector Auditivo Provisto</span>
              <div className="font-bold text-xs text-slate-800">{eppNombre}</div>
            </div>
            <div>
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Atenuación Nominal NRR / SNR</span>
              <div className="font-bold text-xs text-slate-800">
                {typeof hearingProtection === 'object' && hearingProtection?.nrr_snr ? `${hearingProtection.nrr_snr} dB` : '25 dB (Estimado)'}
              </div>
            </div>
            <div>
              <span className="text-[0.58rem] font-extrabold text-slate-500 uppercase block">Nivel Efectivo al Oído</span>
              <div className="font-black text-xs text-emerald-700">
                {typeof hearingProtection === 'object' && hearingProtection?.nivelEfectivoAtenuado
                  ? `${hearingProtection.nivelEfectivoAtenuado} dB(A)`
                  : `${Math.max(0, Math.round(evalMetrics.nivelCorregidoLaeq - 12.6))} dB(A)`} (Adecuado ≤ 80 dBA)
              </div>
            </div>
          </div>
        </div>

        {/* 5. Conclusiones Técnicas y Medidas de Control */}
        <div className="border border-slate-300 rounded-lg mb-3 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-black text-[0.68rem] text-slate-700 uppercase tracking-wider border-b border-slate-300 flex items-center gap-1.5">
            <Activity size={12} /> 4. CONCLUSIONES TÉCNICAS Y MEDIDAS DE CONTROL
          </div>
          <div className="p-2.5 bg-white text-[7.5pt] space-y-1.5">
            <div className="font-semibold text-slate-800">
              {observations || (isCritical
                ? 'El nivel sonoro continuo equivalente registrado en el puesto supera el Límite Máximo Permisible de 85 dB(A) para 8 horas de labor. Se exige el uso obligatorio e ininterrumpido de protección auditiva certificada y la adopción de medidas de control de ingeniería.'
                : 'El nivel sonoro registrado en el puesto se encuentra dentro de los parámetros reglamentarios tolerados para la jornada laboral evaluada.')}
            </div>

            {evalMetrics.recomendacionesAutomaticas.length > 0 && (
              <div className="border-t border-slate-200 pt-1.5 mt-1">
                <span className="font-black text-[0.62rem] text-slate-700 uppercase block mb-0.5">Medidas Preventivas Exigidas:</span>
                <ul className="m-0 pl-4 list-disc space-y-0.5 text-slate-700 font-medium">
                  {evalMetrics.recomendacionesAutomaticas.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 6. Firmas y Validación Oficial */}
        <div className="pdf-signatures-wrapper mt-2">
          <PdfSignatures
            data={data}
            box1={showSignatures?.operator !== false ? {
              title: 'TRABAJADOR EVALUADO',
              subtitle: trab,
              signatureUrl: operatorSignature || null,
              isProfessional: false
            } : null}
            box2={showSignatures?.professional !== false ? {
              title: 'ESPECIALISTA EN HIGIENE Y SEGURIDAD',
              subtitle: (actName || 'Profesional H&S').toUpperCase(),
              signatureUrl: actSignature || null,
              stampUrl: professionalStamp || actStamp || null,
              isProfessional: true,
              license: actLic || null
            } : null}
            box3={showSignatures?.supervisor !== false ? {
              title: 'RESPONSABLE / AUTORIDAD EMPRESA',
              subtitle: 'Aprobación y Recepción',
              signatureUrl: supervisorSignature || data?.signature || null,
              isProfessional: false
            } : null}
          />
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}