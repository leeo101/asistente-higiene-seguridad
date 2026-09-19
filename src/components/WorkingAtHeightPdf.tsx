import React from 'react';
import { ShieldCheck, HeartPulse, LifeBuoy, User, MapPin, Calendar, Ruler, AlertTriangle, CheckCircle2, XCircle, Wind, Anchor, Activity, Building2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { calculateFallClearanceDistance } from '../utils/srtProtocols';

const WORK_TYPE_NAMES: Record<string, string> = {
  scaffolding: 'Andamios Tubulares / Multidireccionales (Dec. 911/96)',
  ladder: 'Escaleras de Mano / Fijas',
  roof: 'Techos y Cubiertas Frágiles',
  platform: 'Plataformas Elevadoras Móviles (PEMP)',
  lift: 'Guindolas / Silletas Suspendidas',
  structure: 'Montaje de Estructuras Metálicas',
  rope_access: 'Acceso por Cuerdas / Trabajo Vertical',
  other: 'Otro Trabajo en Altura'
};

const PRIORITY_NAMES: Record<string, string> = {
  critical: 'CRÍTICA / ALTO RIESGO',
  high: 'ALTA',
  medium: 'MEDIA',
  low: 'BAJA'
};

export default function WorkingAtHeightPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const workTypeName = WORK_TYPE_NAMES[data.workType] || data.workType || 'No especificado';
  const priorityName = PRIORITY_NAMES[data.priority] || data.priority || 'MEDIA';

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

  // Cálculo de Distancia Libre de Caída (DLC)
  const workHeight = parseFloat(data.height) || 4.5;
  const dlc = calculateFallClearanceDistance({
    lanyardLengthM: parseFloat(data.lanyardLength) || 1.8,
    deceleratorDistanceM: parseFloat(data.deceleratorDistance) || 1.2,
    workerHeightM: parseFloat(data.workerHeight) || 1.5,
    safetyMarginM: parseFloat(data.safetyMargin) || 1.0,
    availableFallHeightM: workHeight
  }, data.anchorFactor || 1);

  const docId = data.id ? String(data.id).slice(-6).toUpperCase() : 'S/N';
  const cuit = data.cuit || 'No especificado';
  const empresa = data.companyName || data.empresa || 'Establecimiento / Obra';
  const art = data.art || 'A.R.T. No especificada';
  const address = data.establishmentAddress || data.address || data.location || 'Planta Industrial';

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
            !dlc.isClearanceSafe || !data.medicalFitness
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-900'
              : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900'
          }`}
        ></div>

        {/* Encabezado Institucional SRT / Dec. 911/96 */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                RESOLUCIÓN S.R.T. N° 61/23
              </span>
              <span className="bg-amber-800 text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                DEC. 911/96 (ARTS. 54-70) & DEC. 351/79
              </span>
              <span
                className={`text-white font-black text-[9px] px-2 py-0.5 rounded uppercase ${
                  dlc.isClearanceSafe && data.medicalFitness ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {dlc.isClearanceSafe && data.medicalFitness ? 'PERMISO HABILITADO' : '⚠ ALERTA / NO HABILITADO'}
              </span>
            </div>
            <h1 className="m-0 text-xl font-black text-slate-900 uppercase tracking-tight">
              PERMISO DE TRABAJO SEGURO EN ALTURA (PTSA)
            </h1>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              CÁLCULO DE DISTANCIA LIBRE DE CAÍDA (DLC) • ANCLAJES 22 kN • APTITUD MÉDICA
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <CompanyLogo style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-300 px-3 py-1 rounded-lg shadow-2xs">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">N° PERMISO PTSA</div>
              <div className="text-sm font-black text-amber-700">#ALT-{docId}</div>
            </div>
          </div>
        </div>

        {/* Cuadro 1: Identificación Patronal y del Establecimiento */}
        <div className="border border-slate-400 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider flex justify-between">
            <span>1. IDENTIFICACIÓN PATRONAL Y DEL ESTABLECIMIENTO (RES. S.R.T. 61/23)</span>
            <span className="text-amber-400">VIGENCIA: JORNADA ÚNICA</span>
          </div>
          <div className="grid grid-cols-4 p-2.5 gap-2 text-[10.5px]">
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Razón Social / Empleador:</span>
              <span className="font-extrabold text-slate-900">{empresa}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">C.U.I.T. N°:</span>
              <span className="font-extrabold text-slate-900">{cuit}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">A.R.T.:</span>
              <span className="font-extrabold text-slate-900">{art}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Sector / Obra:</span>
              <span className="font-extrabold text-slate-900">{data.location || 'Frente de Obra'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Domicilio de la Obra / Planta:</span>
              <span className="font-semibold text-slate-800">{address}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Fecha de Emisión:</span>
              <span className="font-extrabold text-slate-900">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[9px] uppercase">Duración / Turno:</span>
              <span className="font-extrabold text-slate-900">{data.duration || 'Jornada Continua (Máx. 8h)'}</span>
            </div>
          </div>
        </div>

        {/* Cuadro 2: Datos de la Tarea, Altura y Operario */}
        <div className="border border-slate-400 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 uppercase tracking-wider">
            2. DATOS DE LA TAREA, OPERARIO Y APTITUD MÉDICA
          </div>
          <div className="grid grid-cols-4 p-2.5 gap-2 text-[10.5px] bg-amber-50/40 border-b border-slate-200">
            <div>
              <span className="text-amber-900 font-black block text-[9px] uppercase">Operario Habilitado:</span>
              <span className="font-black text-xs text-slate-900">{data.workerName || 'No especificado'}</span>
              {data.workerDni && <span className="text-[9px] text-slate-600 block">DNI: {data.workerDni}</span>}
            </div>
            <div>
              <span className="text-amber-900 font-black block text-[9px] uppercase">Apto Médico Altura:</span>
              <span className={`font-black text-xs px-2 py-0.5 rounded inline-block ${data.medicalFitness ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {data.medicalFitness ? '✓ VIGENTE / APTO' : '✕ NO VIGENTE'}
              </span>
            </div>
            <div>
              <span className="text-amber-900 font-black block text-[9px] uppercase">Altura de Trabajo:</span>
              <span className="font-black text-xs text-slate-900">{workHeight} m (Cota superior a 2.00m)</span>
            </div>
            <div>
              <span className="text-amber-900 font-black block text-[9px] uppercase">Nivel de Riesgo:</span>
              <span className="font-extrabold text-xs text-amber-800">{priorityName}</span>
            </div>
          </div>
          <div className="p-2.5 text-[10px] bg-slate-50/60">
            <span className="text-slate-500 font-bold block text-[9px] uppercase">Tipo de Sistema / Tarea en Altura:</span>
            <span className="font-extrabold text-slate-900">{workTypeName}</span>
            {data.description && <div className="mt-0.5 text-slate-700"><strong>Descripción:</strong> {data.description}</div>}
          </div>
        </div>

        {/* Cuadro 3: Memoria de Cálculo de Distancia Libre de Caída (DLC) */}
        <div className="border-2 border-slate-900 rounded-lg overflow-hidden mb-3 bg-white page-break-inside-avoid">
          <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between font-black text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Ruler size={15} className="text-amber-400" />
              <span>3. CÁLCULO DE DISTANCIA LIBRE DE CAÍDA (DLC) — RES. S.R.T. 61/23</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${dlc.isClearanceSafe ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {dlc.isClearanceSafe ? 'ESPACIO LIBRE SEGURO' : 'DISTANCIA INSUFICIENTE (PELIGRO IMPACTO)'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 p-2.5 bg-white text-center">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[8px] font-bold text-slate-500 uppercase block">Cabo de Amarre</span>
              <span className="text-sm font-black text-slate-900 block my-0.5">{data.lanyardLength || '1.80'} m</span>
              <span className="text-[7.5px] text-slate-400 block">Longitud total</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[8px] font-bold text-slate-500 uppercase block">Absorbedor</span>
              <span className="text-sm font-black text-slate-900 block my-0.5">{data.deceleratorDistance || '1.20'} m</span>
              <span className="text-[7.5px] text-slate-400 block">Elongación máx.</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[8px] font-bold text-slate-500 uppercase block">Estatura Operario</span>
              <span className="text-sm font-black text-slate-900 block my-0.5">{data.workerHeight || '1.50'} m</span>
              <span className="text-[7.5px] text-slate-400 block">Argolla a pies</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[8px] font-bold text-slate-500 uppercase block">Margen Libre</span>
              <span className="text-sm font-black text-slate-900 block my-0.5">{data.safetyMargin || '1.00'} m</span>
              <span className="text-[7.5px] text-slate-400 block">Seguridad piso</span>
            </div>
            <div className={`p-2 border rounded-lg ${dlc.isClearanceSafe ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
              <span className="text-[8px] font-black uppercase block text-slate-700">DLC Requerida</span>
              <span className={`text-base font-black block my-0.5 ${dlc.isClearanceSafe ? 'text-emerald-700' : 'text-rose-700'}`}>
                {dlc.requiredClearanceM} m
              </span>
              <span className="text-[7.5px] font-bold text-slate-600 block">Disp: {workHeight} m</span>
            </div>
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-200 text-[10px]">
            <span className="font-bold text-slate-700">Dictamen de Caída Libre:</span>{' '}
            <span className={`font-extrabold ${dlc.isClearanceSafe ? 'text-emerald-800' : 'text-rose-800'}`}>
              {dlc.recommendation}
            </span>
          </div>
        </div>

        {/* Cuadro 4: Anclaje Certificado (22 kN), Arnés IRAM 3622-1 y Clima */}
        <div className="grid grid-cols-2 gap-2.5 mb-3 page-break-inside-avoid">
          {/* Anclajes y Equipos */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5">
            <div className="text-[9.5px] font-black text-slate-900 uppercase flex items-center gap-1 border-b border-slate-200 pb-1">
              <Anchor size={13} className="text-amber-700" />
              <span>4.A. ANCLAJE (≥ 22 kN) Y SISTEMA ANTICAÍDAS</span>
            </div>
            <div className="text-[10px] space-y-1">
              <div>
                <span className="font-bold text-slate-600">Punto de Anclaje:</span>{' '}
                <span className="font-extrabold text-slate-900">
                  {data.anchorType === 'certified_structural_22kn' ? 'Estructural Certificado (≥ 22 kN / 5000 lbs)' : data.anchorType || 'Estructural Verificado (IRAM 3626)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-bold text-slate-800 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600">✓</span> Arnés IRAM 3622-1
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600">✓</span> Cabo doble en "Y"
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600">✓</span> Absorbedor impacto
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600">✓</span> Casco c/ barbiquejo
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones Climáticas y Rescate */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5">
            <div className="text-[9.5px] font-black text-slate-900 uppercase flex items-center gap-1 border-b border-slate-200 pb-1">
              <Wind size={13} className="text-blue-700" />
              <span>4.B. CLIMA Y PLAN DE RESCATE (RES. SRT 61/23)</span>
            </div>
            <div className="text-[10px] space-y-1">
              <div>
                <span className="font-bold text-slate-600">Viento Medido:</span>{' '}
                <span className="font-extrabold text-slate-900">
                  {data.weather?.windSpeedKmh ? `${data.weather.windSpeedKmh} km/h` : '≤ 20 km/h'} (Límite legal: 35 km/h)
                </span>
              </div>
              <div className="text-[9px] font-bold text-slate-800">
                <span className="text-emerald-600">✓</span> Sin lluvia ni descargas atmosféricas
              </div>
              <div className="text-[9px] font-bold text-slate-800">
                <span className="text-emerald-600">✓</span> Plan de rescate en altura para prevención de trauma por suspensión
              </div>
            </div>
          </div>
        </div>

        {/* Cuadro 5: Observaciones e Instrucciones Técnicas */}
        {data.observations && (
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-3 page-break-inside-avoid">
            <div className="bg-slate-900 text-white px-3 py-1 font-black text-[9.5px] uppercase tracking-wider">
              5. INSTRUCCIONES OPERATIVAS Y MEDIDAS PREVENTIVAS ESPECÍFICAS
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
                    title: 'OPERARIO AUTORIZADO',
                    subtitle: (data.workerName || 'Trabajador en Altura').toUpperCase(),
                    signatureUrl: data.operatorSignature || data.signature || null,
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
                    title: 'SUPERVISOR DE TRABAJO',
                    subtitle: (data.supervisor || 'Supervisor Habilitante').toUpperCase(),
                    signatureUrl: data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        {/* Aviso Legal de Validez y Caducidad */}
        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2 page-break-inside-avoid text-[9.5px]">
          <AlertTriangle size={15} className="text-amber-800 shrink-0 mt-0.5" />
          <p className="m-0 text-amber-950 font-bold leading-normal">
            <strong>MARCO NORMATIVO RES. S.R.T. N° 61/23 & DEC. 911/96:</strong> Este Permiso de Trabajo Seguro en Altura es de validez exclusiva para el turno u horario especificado (máx. 8 horas). Es obligatorio el enganche 100% permanente a puntos de anclaje de 22 kN. Se suspenden automáticamente los trabajos ante vientos superiores a 35 km/h, tormentas o si se altera el sistema anticaídas.
          </p>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}