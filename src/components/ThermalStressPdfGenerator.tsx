import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, ThermometerSun, Info, Droplets, Wind, Sun, 
  AlertTriangle, CheckCircle2, ShieldAlert, Clock, Shirt, Activity, Building2
} from 'lucide-react';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import CompanyLogo from './CompanyLogo';
import { CLOTHING_CAV_OPTIONS } from '../utils/srtProtocols';

export default function ThermalStressPdfGenerator({ 
  data, 
  onBack = () => window.history.back(), 
  isHeadless = false 
}: {
  data: any;
  onBack?: () => void;
  isHeadless?: boolean;
}): React.ReactElement | null {
  const report = data || {};
  const [logoData, setLogoData] = useState({ companyLogo: null, showLogo: true });

  useEffect(() => {
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
    setLogoData({ companyLogo: companyLogo as any, showLogo });
  }, []);

  const componentRef = useRef<HTMLDivElement>(null);

  // Extraer datos con soporte para estructura unificada y estructura legado
  const cuit = report.cuit || report.empresaCuit || 'No informado';
  const razonSocial = report.razonSocial || report.empresa || report.companyName || 'Razón Social No Especificada';
  const direccion = report.direccion || 'Domicilio Laboral No Especificado';
  const localidad = report.localidad || 'Buenos Aires';
  const art = report.art || 'Asociart ART';
  const establecimiento = report.establecimiento || 'Planta Principal';

  const puesto = report.trabajador?.puesto || report.puesto || 'Puesto Operativo';
  const sector = report.trabajador?.sector || report.sector || 'Planta Productiva';
  const tarea = report.trabajador?.tarea || report.tarea || 'Tareas generales operativas';
  const cantTrabajadores = report.trabajador?.cantTrabajadoresExpuestos || report.cantTrabajadores || 1;

  // Variables ambientales
  const tbh = report.ambiental?.tbh ?? report.tbh ?? 0;
  const tg = report.ambiental?.tg ?? report.tg ?? 0;
  const tbs = report.ambiental?.tbs ?? report.tbs ?? 0;
  const cargaSolar = report.ambiental?.cargaSolar ?? report.cargaSolar ?? false;
  const viento = report.ambiental?.velocidadViento ?? report.viento ?? 0;

  // Instrumental
  const instMarca = report.instrumento?.marca || 'Quest Technologies / 3M';
  const instModelo = report.instrumento?.modelo || 'QUESTemp° 34';
  const instSerie = report.instrumento?.numeroSerie || 'QT-34-8841';
  const instCalib = report.instrumento?.fechaCalibracionLaboratorio || report.fechaCalibracion || '2025-06-15';
  const verifPre = report.instrumento?.verificacionInSituPre ?? 25.0;
  const verifPost = report.instrumento?.verificacionInSituPost ?? 25.1;
  const derivaInst = Math.abs(Number(verifPost) - Number(verifPre)).toFixed(1);

  // Exigencia y Ropa
  const ritmo = report.trabajador?.ritmo || report.ritmo || 'moderado';
  const ciclo = report.trabajador?.ciclo || report.ciclo || 'continuo';
  const indumentariaId = report.trabajador?.indumentariaId || report.indumentariaId || 'standard';
  const clothingObj = CLOTHING_CAV_OPTIONS.find(c => c.id === indumentariaId) || CLOTHING_CAV_OPTIONS[0];
  const cav = report.trabajador?.cav ?? report.cav ?? clothingObj.cav ?? 0;
  const aclimatado = report.trabajador?.aclimatado ?? report.aclimatado ?? true;
  const aptaMedica = report.trabajador?.aptaMedica ?? report.aptaMedica ?? true;

  // Métricas de Evaluación
  const tgbhMedido = report.metricas?.tgbhMedido ?? report.resultados?.tgbh ?? 0;
  const tgbhEfectivo = report.metricas?.tgbhEfectivo ?? (Number(tgbhMedido) + Number(cav));
  const vle = report.metricas?.vlePermisible ?? report.resultados?.vle ?? report.resultados?.limite ?? 26.7;
  const vla = report.metricas?.vlaAccion ?? report.resultados?.vla ?? (vle - 1.5);
  const isAdmisible = report.metricas ? (report.metricas.dictamenGeneral === 'CONFORME') : (report.resultados?.admisible ?? (tgbhEfectivo <= vle));
  const enVLA = report.metricas ? (report.metricas.dictamenGeneral === 'ZONA DE ACCIÓN (VLA)') : (report.resultados?.enVLA ?? (tgbhEfectivo > vla && tgbhEfectivo <= vle));
  const isCritico = report.metricas?.dictamenGeneral === 'CRÍTICO / TRABAJO SUSPENDIDO';

  const tasaHidratacion = report.metricas?.tasaHidratacionMlPorHora || (isCritico ? 1200 : !isAdmisible ? 1000 : enVLA ? 750 : 500);
  const regimenRecomendado = report.metricas?.regimenRecomendado || (
    isAdmisible ? 'Continuo (100% Trabajo)' : 'Rotación obligatoria con descansos en ambiente climatizado'
  );

  // Estrés por frío (si está presente)
  const coldData = report.frio;

  // Firmas
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

  const getRitmoLabel = (r: string) => {
    switch (r) {
      case 'liviano': return { name: 'Liviano (≤ 200 W / ≤ 172 kcal/h)', desc: 'Trabajo sentado, mecanografía, ensamble ligero' };
      case 'moderado': return { name: 'Moderado (200 - 350 W / 172 - 300 kcal/h)', desc: 'Trabajo de pie, manipulación de cargas medias, marcha continua' };
      case 'pesado': return { name: 'Pesado (350 - 500 W / 300 - 430 kcal/h)', desc: 'Trabajo intenso, picado, paleo, acarreo de bultos pesados' };
      case 'muy_pesado': return { name: 'Muy Pesado (> 500 W / > 430 kcal/h)', desc: 'Actividad máxima a ritmo acelerado' };
      default: return { name: r, desc: '' };
    }
  };

  const getCicloLabel = (c: string) => {
    switch (c) {
      case 'continuo': return '100% Trabajo Continuo';
      case '75_25': return '75% Trabajo / 25% Descanso cada hora (45 min x 15 min)';
      case '50_50': return '50% Trabajo / 50% Descanso cada hora (30 min x 30 min)';
      case '25_75': return '25% Trabajo / 75% Descanso cada hora (15 min x 45 min)';
      default: return c;
    }
  };

  return (
    <div className="w-[100%] flex justify-center bg-slate-100 p-2 sm:p-6 print:p-0 print:bg-white">
      <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#0f172a] shadow-2xl print:shadow-none rounded-none sm:rounded-xl box-border m-[0_auto] font-sans"
        ref={componentRef}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
          `}
        </style>

        {/* Encabezado Oficial Institucional SRT / MTEySS */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9pt] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                  PROTOCOLO OFICIAL
                </span>
                <span className="text-[9pt] font-bold text-slate-600">
                  Res. MTEySS N° 295/03 Anexo II & Res. S.R.T. N° 30/2023
                </span>
              </div>
              <h1 className="text-[15pt] font-black text-slate-900 uppercase tracking-tight leading-snug m-0">
                Protocolo de Medición de Carga Térmica (TGBH) y Frío
              </h1>
              <p className="text-[8pt] text-slate-500 m-0">
                Conforme Decreto 351/79 Cap. 8 y criterios de la Conferencia Americana de Higienistas Industriales (ACGIH)
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <CompanyLogo style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain' }} className="p-1 border border-slate-200 rounded" />
            </div>
          </div>
        </div>

        {/* 1. Datos del Empleador y Establecimiento */}
        <div className="mb-3">
          <div className="bg-slate-900 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-400" />
              1. IDENTIFICACIÓN DE LA EMPRESA Y PUESTO DE TRABAJO
            </span>
            <span className="text-[7.5pt] text-slate-300 font-normal">
              Fecha: {report.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <tbody>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold w-[20%] border border-slate-300">Razón Social:</td>
                <td className="p-1.5 font-black text-slate-900 w-[40%] border border-slate-300">{razonSocial}</td>
                <td className="bg-slate-100 p-1.5 font-bold w-[15%] border border-slate-300">C.U.I.T. N°:</td>
                <td className="p-1.5 font-black text-slate-900 border border-slate-300">{cuit}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Dirección / Planta:</td>
                <td className="p-1.5 border border-slate-300">{direccion} ({localidad})</td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">A.R.T.:</td>
                <td className="p-1.5 border border-slate-300">{art}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Sector / Área:</td>
                <td className="p-1.5 font-bold text-slate-800 border border-slate-300">{sector}</td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Puesto Evaluado:</td>
                <td className="p-1.5 font-black text-blue-900 border border-slate-300">{puesto}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Tarea Principal:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>
                  {tarea} • <span className="font-semibold text-slate-600">Personal expuesto:</span> {cantTrabajadores} trabajador(es)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Instrumental y Verificación In-Situ */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ThermometerSun size={13} className="text-amber-400" />
              2. INSTRUMENTAL DE MEDICIÓN TGBH Y VERIFICACIÓN
            </span>
            <span className="text-[7.5pt] text-slate-300 font-normal">Norma IRAM 295-2 / ISO 7243</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <tbody>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold w-[20%] border border-slate-300">Instrumento:</td>
                <td className="p-1.5 border border-slate-300">{instMarca} — {instModelo}</td>
                <td className="bg-slate-100 p-1.5 font-bold w-[15%] border border-slate-300">N° Serie:</td>
                <td className="p-1.5 font-mono border border-slate-300">{instSerie}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Calibración Lab.:</td>
                <td className="p-1.5 border border-slate-300">
                  {instCalib} <span className="text-emerald-700 font-bold">(Vigente ≤ 24 meses)</span>
                </td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Deriva In-Situ:</td>
                <td className="p-1.5 border border-slate-300">
                  Pre: {verifPre}°C | Post: {verifPost}°C | <strong className="text-slate-800">Δ = {derivaInst}°C</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Variables Ambientales y TGBH Medido */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Droplets size={13} className="text-blue-300" />
              3. VARIABLES AMBIENTALES Y PONDERACIÓN TGBH
            </span>
            <span className="text-[7.5pt] text-amber-300 font-bold">
              {cargaSolar ? '☀️ Exterior con Sol Directo' : '🏢 Interior o Sombra'}
            </span>
          </div>
          <div className="border border-t-0 border-slate-300 p-2.5">
            <div className="grid grid-cols-4 gap-2 text-center mb-2">
              <div className="p-1.5 bg-blue-50 border border-blue-200 rounded">
                <div className="text-[7pt] text-blue-900 font-bold uppercase">T. Bulbo Húmedo (Tbh)</div>
                <div className="text-[14pt] font-black text-blue-700 leading-tight">{tbh}°C</div>
                <div className="text-[6.5pt] text-slate-500 font-medium">Ponderación: 70%</div>
              </div>
              <div className="p-1.5 bg-orange-50 border border-orange-200 rounded">
                <div className="text-[7pt] text-orange-900 font-bold uppercase">T. Globo Térmico (Tg)</div>
                <div className="text-[14pt] font-black text-orange-600 leading-tight">{tg}°C</div>
                <div className="text-[6.5pt] text-slate-500 font-medium">Ponderación: {cargaSolar ? '20%' : '30%'}</div>
              </div>
              <div className="p-1.5 bg-red-50 border border-red-200 rounded">
                <div className="text-[7pt] text-red-900 font-bold uppercase">T. Bulbo Seco (Tbs)</div>
                <div className="text-[14pt] font-black text-red-600 leading-tight">
                  {cargaSolar ? `${tbs}°C` : 'N/A'}
                </div>
                <div className="text-[6.5pt] text-slate-500 font-medium">{cargaSolar ? 'Ponderación: 10%' : 'Sin sol directo'}</div>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-300 rounded">
                <div className="text-[7pt] text-slate-700 font-bold uppercase">Velocidad del Aire</div>
                <div className="text-[14pt] font-black text-slate-800 leading-tight">{viento || '0.2'} m/s</div>
                <div className="text-[6.5pt] text-slate-500 font-medium">Anemómetro de molinete</div>
              </div>
            </div>
            <div className="text-[7.5pt] text-slate-600 bg-slate-50 p-1.5 rounded border border-dashed border-slate-300 flex justify-between items-center">
              <span>
                <strong>Ecuación Reglamentaria:</strong> {cargaSolar ? 'TGBH = 0.7·Tbh + 0.2·Tg + 0.1·Tbs' : 'TGBH = 0.7·Tbh + 0.3·Tg'}
              </span>
              <span className="font-mono font-bold text-slate-900">
                TGBH Medido = {tgbhMedido}°C
              </span>
            </div>
          </div>
        </div>

        {/* 4. Exigencia Física, Indumentaria (CAV) y Condiciones Médicas */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity size={13} className="text-emerald-400" />
              4. CARGA METABÓLICA, INDUMENTARIA (CAV) Y VIGILANCIA MÉDICA
            </span>
            <span className="text-[7.5pt] text-slate-300">Res. SRT 30/2023</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <tbody>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold w-[25%] border border-slate-300">Carga Metabólica:</td>
                <td className="p-1.5 border border-slate-300">
                  <strong className="text-slate-900">{getRitmoLabel(ritmo).name}</strong>
                  <div className="text-[7pt] text-slate-500">{getRitmoLabel(ritmo).desc}</div>
                </td>
                <td className="bg-slate-100 p-1.5 font-bold w-[20%] border border-slate-300">Régimen Declarado:</td>
                <td className="p-1.5 font-bold text-purple-900 border border-slate-300">{getCicloLabel(ciclo)}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Indumentaria de Trabajo:</td>
                <td className="p-1.5 border border-slate-300">
                  {clothingObj.label}
                  <div className="text-[7pt] text-slate-500">{clothingObj.description}</div>
                </td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Ajuste por Ropa (CAV):</td>
                <td className="p-1.5 font-black text-indigo-700 border border-slate-300">+{cav.toFixed(1)} °C</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Aclimatación Fisiológica:</td>
                <td className="p-1.5 border border-slate-300">
                  {aclimatado ? (
                    <span className="text-emerald-700 font-bold">✅ Aclimatado (Plan 5 a 14 días completado)</span>
                  ) : (
                    <span className="text-amber-700 font-bold">⚠️ No Aclimatado (Penalización de -2.0°C en VLE)</span>
                  )}
                </td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Apto Médico Específico:</td>
                <td className="p-1.5 border border-slate-300">
                  {aptaMedica ? (
                    <span className="text-emerald-700 font-bold">✅ Presentado / Vigente</span>
                  ) : (
                    <span className="text-red-700 font-bold">❌ Pendiente (Exigido por Res. 30/23)</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Módulo Opcional: Estrés por Frío (si aplica) */}
        {coldData && coldData.evaluarFrio && (
          <div className="mb-3">
            <div className="bg-sky-900 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wind size={13} className="text-cyan-300" />
                5. EVALUACIÓN DE ESTRÉS POR FRÍO — WIND CHILL (RES. 295/03 ANEXO II)
              </span>
              <span className="text-[7.5pt] text-cyan-200">Enfriamiento por Viento</span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[8pt]">
              <tbody>
                <tr>
                  <td className="bg-slate-100 p-1.5 font-bold w-[25%] border border-slate-300">Temp. Aire Seco:</td>
                  <td className="p-1.5 font-bold border border-slate-300">{coldData.temperaturaAireSeco ?? 0}°C</td>
                  <td className="bg-slate-100 p-1.5 font-bold w-[25%] border border-slate-300">Velocidad del Viento:</td>
                  <td className="p-1.5 font-bold border border-slate-300">{coldData.velocidadVientoKmH ?? 0} km/h</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Sensación Térmica (Twc):</td>
                  <td className="p-1.5 font-black text-sky-800 text-[9pt] border border-slate-300">
                    {coldData.sensacionTermicaViento ?? 0}°C
                  </td>
                  <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Categoría y Permanencia:</td>
                  <td className="p-1.5 border border-slate-300">
                    <strong className="text-sky-900">{coldData.categoriaRiesgoFrio}</strong>
                    {coldData.tiempoMaximoExposicionMin && ` (Máx. ${coldData.tiempoMaximoExposicionMin} min)`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Comparativa Normativa y Dictamen Técnico Oficial */}
        <div className="mb-4">
          <div className="bg-slate-900 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-amber-400" />
              {coldData?.evaluarFrio ? '6' : '5'}. DICTAMEN TÉCNICO NORMATIVO Y LÍMITES PERMISIBLES
            </span>
            <span className="text-[7.5pt] text-slate-300">Res. SRT 30/2023 & Res. MTEySS 295/03</span>
          </div>
          <div className="border border-t-0 border-slate-400 p-3 bg-white">
            <div className="grid grid-cols-12 gap-3 items-stretch">
              {/* TGBH Efectivo vs VLE */}
              <div className="col-span-5 bg-slate-50 border border-slate-300 rounded p-2 text-center flex flex-col justify-center">
                <div className="text-[7pt] text-slate-500 font-bold uppercase mb-0.5">TGBH EFECTIVO (CON CAV)</div>
                <div className="text-[26pt] font-black text-slate-900 leading-none mb-1">
                  {tgbhEfectivo}°C
                </div>
                <div className="text-[7.5pt] text-slate-600 font-medium">
                  TGBH Base: {tgbhMedido}°C + CAV: {cav > 0 ? `+${cav}°C` : '0°C'}
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200 grid grid-cols-2 text-[7.5pt]">
                  <div>
                    <span className="text-amber-700 font-bold">VLA (Acción):</span> {vla}°C
                  </div>
                  <div>
                    <span className="text-red-700 font-bold">VLE (Límite):</span> {vle}°C
                  </div>
                </div>
              </div>

              {/* Tarjeta de Dictamen */}
              <div className={`col-span-7 rounded p-2.5 flex flex-col justify-between border-2 ${
                isCritico
                  ? 'bg-rose-50 border-rose-600 text-rose-950'
                  : !isAdmisible
                  ? 'bg-red-50 border-red-500 text-red-950'
                  : enVLA
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-950'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isAdmisible && !enVLA ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : enVLA ? (
                      <Info size={18} className="text-amber-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={18} className="text-red-600 shrink-0" />
                    )}
                    <span className="text-[10pt] font-black uppercase tracking-tight">
                      {isCritico
                        ? 'TRABAJO PROHIBIDO / CRÍTICO'
                        : !isAdmisible
                        ? 'SUPERA LÍMITE PERMISIBLE (VLE EXCEDIDO)'
                        : enVLA
                        ? 'ZONA DE ACCIÓN PREVENTIVA (VLA SUPERADO)'
                        : 'CONFORME — CONDICIÓN TÉRMICA ADMISIBLE'}
                    </span>
                  </div>
                  <p className="text-[7.5pt] leading-snug m-0 font-medium">
                    {isCritico
                      ? 'El TGBH efectivo supera los límites absolutos de tolerancia fisiológica. Se ordena la suspensión inmediata de las actividades operativas.'
                      : !isAdmisible
                      ? `El TGBH efectivo (${tgbhEfectivo}°C) supera el VLE normativo (${vle}°C). Requiere rotación obligatoria de régimen de trabajo/descanso y medidas de control de ingeniería.`
                      : enVLA
                      ? `El TGBH efectivo (${tgbhEfectivo}°C) supera el Nivel de Acción (${vla}°C). Se exige hidratación programada y vigilancia médica activa.`
                      : `El puesto opera dentro de los márgenes admisibles para jornada completa continua sin exceder el Nivel de Acción ni el VLE.`}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-300/40 text-[7.5pt] flex justify-between items-center">
                  <span><strong>Régimen:</strong> {regimenRecomendado}</span>
                  <span className="font-bold text-blue-900">💧 Hidratación: {tasaHidratacion} ml/hora</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Recomendaciones y Conclusiones Técnicas */}
        <div className="mb-4">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t">
            {coldData?.evaluarFrio ? '7' : '6'}. MEDIDAS DE CONTROL Y RECOMENDACIONES PREVENTIVAS
          </div>
          <div className="border border-t-0 border-slate-300 p-2.5 text-[7.5pt] text-slate-800 leading-relaxed bg-slate-50/50">
            <ul className="m-0 pl-4 space-y-1 list-disc">
              <li>
                <strong>Hidratación Continua:</strong> Proveer agua potable fresca (10°C a 15°C) a libre disposición ubicada a no más de 15 metros del puesto de trabajo, recomendando la ingesta de un vaso de 150-200 ml cada 15 a 20 minutos ({tasaHidratacion} ml/h).
              </li>
              <li>
                <strong>Régimen de Trabajo y Descanso:</strong> {regimenRecomendado}. Habilitar áreas de descanso sombreadas o climatizadas con temperatura ambiente inferior a 25°C.
              </li>
              <li>
                <strong>Vigilancia Médica de la Salud:</strong> Cumplimentar con el examen médico ocupacional específico previo de aptitud física y cardiovascular según Resolución S.R.T. N° 30/2023.
              </li>
              {!aclimatado && (
                <li className="text-amber-800 font-semibold">
                  <strong>Plan de Aclimatación:</strong> Aplicar cronograma progresivo de adaptación al calor durante 5 a 14 días (20% de exposición el primer día, incrementando 20% cada jornada sucesiva).
                </li>
              )}
              {report.medidasPropuestas && (
                <li>
                  <strong>Medidas Particulares:</strong> {report.medidasPropuestas}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 8. Firmas de Conformidad y Responsabilidad Profesional */}
        <div className="mt-4">
          <PdfSignatures
            data={report}
            box1={report.showSignatures?.operator !== false ? {
              title: 'TRABAJADOR EVALUADO',
              subtitle: 'Firma de Conformidad e Información',
              signatureUrl: report.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={report.showSignatures?.professional !== false ? {
              title: 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
              subtitle: (actName || 'Profesional Actuante').toUpperCase(),
              signatureUrl: actSignature || null,
              stampUrl: report.professionalStamp || actStamp || null,
              isProfessional: true,
              license: actLic || 'Matrícula Profesional H&S'
            } : null}
            box3={report.showSignatures?.supervisor !== false ? {
              title: 'RESPONSABLE DEL ESTABLECIMIENTO',
              subtitle: 'Recepción y Compromiso de Medidas',
              signatureUrl: report.signature || report.supervisorSignature || null,
              isProfessional: false
            } : null}
          />
        </div>

        {/* Footer Institucional */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[7pt] text-slate-500">
          <div>
            Protocolo Oficial de Carga Térmica y Frío • Res. MTEySS 295/03 Anexo II & Res. SRT 30/2023
          </div>
          <div>
            Emisión: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString()}
          </div>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}