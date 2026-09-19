import React from 'react';
import { ShieldCheck, FlaskConical, Building2, MapPin, User, AlertTriangle, CheckCircle2, XCircle, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { evaluateChemicalAgentExposure } from '../utils/srtProtocols';

const GHS_CONFIG: Record<string, { icon: string; name: string; code: string }> = {
  explosive: { icon: '🧨', name: 'Explosivo', code: 'GHS01' },
  flammable: { icon: '🔥', name: 'Inflamable', code: 'GHS02' },
  oxidizing: { icon: '⭕', name: 'Comburente', code: 'GHS03' },
  pressure: { icon: '🍾', name: 'Gas a Presión', code: 'GHS04' },
  corrosive: { icon: '🧪', name: 'Corrosivo', code: 'GHS05' },
  toxic: { icon: '☠️', name: 'Toxicidad Aguda', code: 'GHS06' },
  harmful: { icon: '⚠️', name: 'Nocivo / Irritante', code: 'GHS07' },
  irritant: { icon: '⚠️', name: 'Irritante', code: 'GHS07' },
  sensitizing: { icon: '🗣️', name: 'Sensibilizante', code: 'GHS08' },
  carcinogenic: { icon: '🗣️', name: 'Peligro Salud / Carcinógeno', code: 'GHS08' },
  environmental: { icon: '🐟', name: 'Peligro Ambiente', code: 'GHS09' }
};

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return 'Sin especificar';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('es-AR');
  } catch (e) {
    return String(dateVal || 'Sin especificar');
  }
};

interface ChemicalSafetyPdfProps {
  data: any;
  professional?: any;
}

export default function ChemicalSafetyPdf({ data, professional }: ChemicalSafetyPdfProps): React.ReactElement | null {
  if (!data) return null;

  // Cálculo higiénico en vivo según Res. MTEySS 295/03 Anexo IV
  const exposureMetrics = evaluateChemicalAgentExposure({
    cmp: Number(data.cmp || 0),
    concentracionMedida: Number(data.concentracionMedida || 0),
    unidadMedicion: data.unidadMedicion || 'ppm',
    viaDermica: Boolean(data.viaDermica),
    carcinogenicidad: data.carcinogenicidad,
    bei: data.bei
  });

  const isSuperaCMP = exposureMetrics.superaCMP;
  const isNivelAccion = exposureMetrics.alcanzaNivelAccion;

  const statusColor = isSuperaCMP ? '#dc2626' : isNivelAccion ? '#d97706' : '#16a34a';

  const formatFirstAid = (fa: any) => {
    if (!fa) return 'Sin especificar.';
    if (typeof fa === 'string') return fa;
    const parts = [];
    if (fa.inhalation) parts.push(`INHALACIÓN: ${fa.inhalation}`);
    if (fa.skin) parts.push(`PIEL: ${fa.skin}`);
    if (fa.eyes) parts.push(`OJOS: ${fa.eyes}`);
    if (fa.ingestion) parts.push(`INGESTIÓN: ${fa.ingestion}`);
    return parts.length > 0 ? parts.join(' | ') : 'Sin especificar.';
  };

  const nfpa = data.nfpa704 || { health: 0, flammability: 0, instability: 0, special: '' };

  const showSignatures = data.showSignatures || { operator: true, supervisor: true, professional: true };

  return (
    <div className="w-full flex justify-center bg-white text-slate-900">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-0 h-auto p-[6mm_10mm] bg-white text-slate-900 box-border mx-auto font-sans text-[8.5pt]"
        style={{ background: '#ffffff', color: '#0f172a' }}
      >
        <style type="text/css">
          {`
            @page { size: A4 portrait; margin: 6mm 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 4mm 6mm !important;
              width: 100% !important;
              max-width: none !important;
              border-top: 8px solid ${statusColor} !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Principal Institucional */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          className="avoid-break"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
              <FlaskConical size={28} color="#818cf8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', margin: 0, fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.3px', lineHeight: 1 }}>
                FICHA DE SEGURIDAD Y ESTUDIO HIGIÉNICO
              </h1>
              <p style={{ color: '#c7d2fe', margin: '3px 0 0 0', fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                SGA (RES. SRT 801/15) • CONTAMINANTES EN AIRE (RES. MTEySS 295/03 ANEXO IV)
              </p>
            </div>
          </div>

          <div className="ml-4 shrink-0 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '36px', maxWidth: '120px', objectFit: 'contain' }} className="bg-white p-1 rounded" />
            <div style={{ color: '#cbd5e1', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>
              Protocolo Oficial HSE
            </div>
          </div>
        </div>

        {/* Cuadro I: Datos del Establecimiento y Puesto */}
        <div className="border border-slate-300 rounded-md mb-2.5 overflow-hidden avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex justify-between items-center">
            <span className="font-black text-[0.7rem] text-slate-800 uppercase tracking-wide">
              I — DATOS DEL ESTABLECIMIENTO Y PUESTO DE TRABAJO (LEY 19.587)
            </span>
            <span className="text-[0.62rem] font-bold text-slate-500">
              Fecha: {formatDateSafe(data.fechaMuestreo || data.sdsDate || data.fecha || new Date())}
            </span>
          </div>
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-[0.72rem]">
            <div className="p-1.5 border-r border-slate-200">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase flex items-center gap-1">
                <Building2 size={10} /> EMPRESA / RAZÓN SOCIAL
              </span>
              <div className="font-extrabold text-slate-900 mt-0.5">{data.empresa || data.companyName || '-'}</div>
            </div>
            <div className="p-1.5 border-r border-slate-200">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase">C.U.I.T. N°</span>
              <div className="font-bold text-slate-800 mt-0.5 font-mono">{data.cuit || 'No informado'}</div>
            </div>
            <div className="p-1.5">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase">A.R.T. CONTRATADA</span>
              <div className="font-bold text-slate-800 mt-0.5">{data.art || 'No informada'}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 bg-white text-[0.72rem]">
            <div className="p-1.5 border-r border-slate-200">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={10} /> SECTOR
              </span>
              <div className="font-bold text-slate-800 mt-0.5">{data.sector || data.location || '-'}</div>
            </div>
            <div className="p-1.5 border-r border-slate-200">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase">PUESTO EVALUADO</span>
              <div className="font-bold text-slate-800 mt-0.5">{data.puesto || '-'}</div>
            </div>
            <div className="p-1.5">
              <span className="text-[0.58rem] font-black text-slate-500 uppercase flex items-center gap-1">
                <User size={10} /> RESPONSABLE TÉCNICO / MATRÍCULA
              </span>
              <div className="font-bold text-slate-800 mt-0.5">
                {professional?.name || data.profesionalNombre || 'Especialista HyS'} {professional?.license || data.profesionalMatricula ? `(${professional?.license || data.profesionalMatricula})` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Cuadro II: Identificación de Sustancia, SGA / GHS & Diamante NFPA 704 */}
        <div className="border border-slate-300 rounded-md mb-2.5 overflow-hidden avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex justify-between items-center">
            <span className="font-black text-[0.7rem] text-slate-800 uppercase tracking-wide">
              II — IDENTIFICACIÓN DE LA SUSTANCIA & SISTEMA GLOBALMENTE ARMONIZADO (RES. SRT 801/15)
            </span>
            <span
              style={{
                background: (data.signalWord || '').toUpperCase() === 'PELIGRO' ? '#dc2626' : '#d97706',
                color: '#ffffff'
              }}
              className="px-2 py-0.5 rounded text-[0.6rem] font-black tracking-widest uppercase"
            >
              {data.signalWord || 'ATENCIÓN'}
            </span>
          </div>

          <div className="p-2.5 bg-white grid grid-cols-3 gap-3 items-center">
            {/* Nombre y códigos */}
            <div className="col-span-2">
              <div className="text-base font-black text-slate-900 uppercase leading-tight">
                {data.name || 'Sustancia no especificada'}
              </div>
              {data.nombreComercial && (
                <div className="text-xs font-bold text-slate-600 mt-0.5">
                  Nombre Comercial: {data.nombreComercial}
                </div>
              )}
              <div className="flex gap-4 mt-1 text-[0.72rem] font-mono text-slate-700">
                <span>CAS: <strong>{data.casNumber || 'N/A'}</strong></span>
                <span>ONU: <strong>{data.unNumber || 'N/A'}</strong></span>
                <span>Estado: <strong>{data.estadoFisico || 'Líquido'}</strong></span>
              </div>
              {data.supplier && (
                <div className="text-[0.68rem] text-slate-500 mt-0.5">
                  Proveedor / Fabricante: {data.supplier}
                </div>
              )}
            </div>

            {/* Diamante NFPA 704 */}
            <div className="flex justify-center items-center">
              <div className="relative w-20 h-20">
                {/* Cuadrante Rojo: Inflamabilidad (Arriba) */}
                <div className="absolute top-0 left-5 w-10 h-10 bg-red-600 rotate-45 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <span className="-rotate-45">{nfpa.flammability ?? 0}</span>
                </div>
                {/* Cuadrante Azul: Salud (Izquierda) */}
                <div className="absolute top-5 left-0 w-10 h-10 bg-blue-600 rotate-45 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <span className="-rotate-45">{nfpa.health ?? 0}</span>
                </div>
                {/* Cuadrante Amarillo: Inestabilidad (Derecha) */}
                <div className="absolute top-5 right-0 w-10 h-10 bg-amber-400 rotate-45 flex items-center justify-center text-slate-900 font-black text-xs shadow-xs">
                  <span className="-rotate-45">{nfpa.instability ?? 0}</span>
                </div>
                {/* Cuadrante Blanco: Especial (Abajo) */}
                <div className="absolute bottom-0 left-5 w-10 h-10 bg-white border border-slate-300 rotate-45 flex items-center justify-center text-slate-900 font-black text-[9px] shadow-xs">
                  <span className="-rotate-45">{nfpa.special || ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pictogramas SGA */}
          <div className="border-t border-slate-200 p-2 bg-slate-50 flex items-center gap-2 flex-wrap">
            <span className="text-[0.62rem] font-black text-slate-500 uppercase mr-2">PICTOGRAMAS SGA:</span>
            {data.pictograms && data.pictograms.length > 0 ? (
              data.pictograms.map((key: string) => {
                const conf = GHS_CONFIG[key] || { icon: '⚠️', name: key, code: 'GHS' };
                return (
                  <div
                    key={key}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-rose-300 rounded shadow-xs text-[0.7rem]"
                  >
                    <span className="text-sm">{conf.icon}</span>
                    <span className="font-extrabold text-slate-800">{conf.name}</span>
                    <span className="text-[0.6rem] font-mono text-rose-600 font-bold">{conf.code}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-slate-400 text-xs italic">Sin pictogramas de peligro informados.</span>
            )}
          </div>
        </div>

        {/* Cuadro III: Límites Higiénicos Res. MTEySS 295/03 Anexo IV & Monitoreo */}
        <div className="border border-slate-300 rounded-md mb-2.5 overflow-hidden avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex justify-between items-center">
            <span className="font-black text-[0.7rem] text-slate-800 uppercase tracking-wide">
              III — LÍMITES HIGIÉNICOS Y MONITOREO AMBIENTAL (RES. MTEySS 295/03 ANEXO IV)
            </span>
            <span
              style={{ background: statusColor, color: '#ffffff' }}
              className="px-2 py-0.5 rounded text-[0.62rem] font-black tracking-wider uppercase"
            >
              {exposureMetrics.dictamenExposicion}
            </span>
          </div>

          <div className="p-2.5 bg-white">
            <div className="grid grid-cols-4 gap-2 mb-2 text-center text-[0.75rem]">
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.58rem] font-black text-slate-500 uppercase block">CONCENTRACIÓN MEDIDA</span>
                <span className="text-sm font-black text-slate-900">
                  {data.concentracionMedida || 0} <span className="text-[0.65rem] font-bold text-slate-500">{data.unidadMedicion || 'ppm'}</span>
                </span>
              </div>

              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.58rem] font-black text-slate-500 uppercase block">C.M.P. (8 HORAS)</span>
                <span className="text-sm font-black text-blue-700">
                  {data.cmp || 0} <span className="text-[0.65rem] font-bold text-slate-500">{data.unidadMedicion || 'ppm'}</span>
                </span>
              </div>

              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.58rem] font-black text-slate-500 uppercase block">ÍNDICE EXPOSICIÓN (IE)</span>
                <span className={`text-sm font-black ${isSuperaCMP ? 'text-rose-600' : isNivelAccion ? 'text-amber-600' : 'text-emerald-600'}`}>
                  IE = {exposureMetrics.indiceExposicion} ({exposureMetrics.porcentajeCMP}%)
                </span>
              </div>

              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.58rem] font-black text-slate-500 uppercase block">CRITERIO NORMATIVO</span>
                <span className="text-sm font-black text-slate-700">IE &lt; 0.50 (Conforme)</span>
              </div>
            </div>

            {/* Datos toxicológicos complementarios de Res. 295/03 */}
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50/80 text-[0.68rem] grid grid-cols-3 gap-2">
              <div>
                <span className="font-bold text-slate-600">Vía Dérmica (Skin): </span>
                <strong className={data.viaDermica ? 'text-rose-600' : 'text-slate-800'}>
                  {data.viaDermica ? 'SÍ (Absorción percutánea significativa)' : 'NO'}
                </strong>
              </div>
              <div>
                <span className="font-bold text-slate-600">Carcinogenicidad: </span>
                <strong className="text-slate-800">{data.carcinogenicidad || 'No clasificado'}</strong>
              </div>
              <div>
                <span className="font-bold text-slate-600">CMP-CPT (15 min): </span>
                <strong className="text-slate-800">{data.cmpCpt ? `${data.cmpCpt} ${data.unidadMedicion || 'ppm'}` : 'No fijado'}</strong>
              </div>
            </div>

            {data.bei && (
              <div className="mt-1.5 p-1 bg-amber-50 border border-amber-200 rounded text-[0.65rem] text-amber-900 font-medium">
                <strong>Índice Biológico de Exposición (BEI): </strong> {data.bei}
              </div>
            )}
          </div>
        </div>

        {/* Cuadro IV: Elementos de Protección Personal & Primeros Auxilios */}
        <div className="grid grid-cols-2 gap-2 mb-2.5 avoid-break">
          {/* EPP */}
          <div className="border border-slate-300 rounded-md overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1">
              <span className="font-black text-[0.68rem] text-slate-800 uppercase">
                IV — ELEMENTOS DE PROTECCIÓN PERSONAL
              </span>
            </div>
            <div className="p-2 bg-white text-[0.7rem] space-y-1">
              <div className="flex items-center gap-1.5">
                {data.ppe?.mask ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-slate-300" />}
                <span className={data.ppe?.mask ? 'font-bold text-slate-800' : 'text-slate-400'}>Protección Respiratoria con filtro específico</span>
              </div>
              <div className="flex items-center gap-1.5">
                {data.ppe?.gloves ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-slate-300" />}
                <span className={data.ppe?.gloves ? 'font-bold text-slate-800' : 'text-slate-400'}>Guantes de protección química (Nitrilo/Butilo)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {data.ppe?.goggles ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-slate-300" />}
                <span className={data.ppe?.goggles ? 'font-bold text-slate-800' : 'text-slate-400'}>Gafas herméticas de seguridad contra salpicaduras</span>
              </div>
              <div className="flex items-center gap-1.5">
                {data.ppe?.apron ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-slate-300" />}
                <span className={data.ppe?.apron ? 'font-bold text-slate-800' : 'text-slate-400'}>Traje o delantal impermeable de protección química</span>
              </div>
            </div>
          </div>

          {/* Primeros Auxilios */}
          <div className="border border-slate-300 rounded-md overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1">
              <span className="font-black text-[0.68rem] text-slate-800 uppercase">
                V — PRIMEROS AUXILIOS Y EMERGENCIA
              </span>
            </div>
            <div className="p-2 bg-white text-[0.68rem] space-y-1 text-slate-700 leading-snug">
              <p className="m-0"><strong>Inhalación:</strong> {data.firstAid?.inhalation || 'Trasladar al aire fresco. Si hay dificultad respiratoria, suministrar oxígeno.'}</p>
              <p className="m-0"><strong>Contacto dérmico:</strong> {data.firstAid?.skin || 'Lavar inmediatamente con agua y jabón durante al menos 15 minutos.'}</p>
              <p className="m-0"><strong>Contacto ocular:</strong> {data.firstAid?.eyes || 'Enjuagar con abundante agua manteniendo los párpados abiertos.'}</p>
            </div>
          </div>
        </div>

        {/* Cuadro V: Conclusiones y Dictamen Técnico */}
        <div className="border border-slate-300 rounded-md mb-3 overflow-hidden avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex justify-between items-center">
            <span className="font-black text-[0.7rem] text-slate-800 uppercase tracking-wide">
              VI — DICTAMEN TÉCNICO Y RECOMENDACIONES HIGIÉNICAS
            </span>
            <span className="text-[0.6rem] font-bold text-slate-500">Validez del Muestreo</span>
          </div>
          <div className="p-2 bg-slate-50/70 text-[0.75rem] text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
            {data.conclusiones || data.recomendaciones || exposureMetrics.recomendacionesTecnicas.join('\n')}
          </div>
        </div>

        {/* Cuadro VI: Firmas Tripartitas Enterprise */}
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="pt-2 border-t border-dashed border-slate-300 flex gap-3 pb-2 justify-end avoid-break">
          {showSignatures.operator && (
            <div className="flex-1 max-w-[200px] border border-slate-300 rounded p-1.5 flex flex-col items-center">
              <div className="h-12 w-full flex items-end justify-center border-b border-slate-200 pb-0.5 mb-1">
                {data.operatorSignature ? (
                  <img src={data.operatorSignature} alt="Firma Operador" className="max-h-11 object-contain" />
                ) : null}
              </div>
              <p className="m-0 font-black text-[0.62rem] text-slate-800 uppercase">OPERADOR / TRABAJADOR</p>
              <p className="m-0 text-[0.52rem] text-slate-500">Toma de conocimiento</p>
            </div>
          )}

          {showSignatures.supervisor && (
            <div className="flex-1 max-w-[200px] border border-slate-300 rounded p-1.5 flex flex-col items-center">
              <div className="h-12 w-full flex items-end justify-center border-b border-slate-200 pb-0.5 mb-1">
                {data.supervisorSignature ? (
                  <img src={data.supervisorSignature} alt="Firma Supervisor" className="max-h-11 object-contain" />
                ) : null}
              </div>
              <p className="m-0 font-black text-[0.62rem] text-slate-800 uppercase">SUPERVISOR / EMPLEADOR</p>
              <p className="m-0 text-[0.52rem] text-slate-500">Firma Autorizada</p>
            </div>
          )}

          {showSignatures.professional && (
            <div className="flex-1 max-w-[200px] border border-indigo-300 bg-indigo-50/30 rounded p-1.5 flex flex-col items-center">
              <div className="h-12 w-full flex items-end justify-center border-b border-indigo-300 pb-0.5 mb-1">
                {professional?.signature || data.professionalSignature ? (
                  <img src={professional?.signature || data.professionalSignature} alt="Firma Profesional" className="max-h-11 object-contain" />
                ) : null}
              </div>
              <p className="m-0 font-black text-[0.62rem] text-indigo-900 uppercase">PROFESIONAL HIGIENISTA</p>
              <p className="m-0 text-[0.52rem] text-indigo-800 font-bold">{professional?.name || data.profesionalNombre || 'Especialista HyS'}</p>
              {(professional?.license || data.profesionalMatricula) && (
                <p className="m-0 text-[0.52rem] text-indigo-700">Mat: {professional?.license || data.profesionalMatricula}</p>
              )}
            </div>
          )}
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}