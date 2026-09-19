import React from 'react';
import { Building2, MapPin, User, Briefcase, Activity, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import { OFFICIAL_PLANILLA1_FACTORS, calculateNioshSrt886 } from '../utils/srtProtocols';

interface ErgonomicsPdfGeneratorProps {
  data: any;
  profile: any;
  signature: any;
  showSignatures: { operator: boolean; supervisor: boolean; professional: boolean; };
}

export default function ErgonomicsPdfGenerator({ data, profile, signature, showSignatures }: ErgonomicsPdfGeneratorProps) {
  if (!data) return null;

  // Normalizar datos de planilla 1
  const p1Raw = data.planilla1 || {};
  const isP1Active = (factorId: string, legacyKey?: string) => {
    if (p1Raw[factorId] !== undefined) return Boolean(p1Raw[factorId]);
    if (legacyKey && p1Raw[legacyKey] !== undefined) return Boolean(p1Raw[legacyKey]);
    return false;
  };

  // Mapeo retrocompatible de factores
  const factorMap: Record<string, string> = {
    '1_levantamiento': 'levantamientoCarga',
    '2_empuje': 'empujeArrastre',
    '3_transporte': 'transporteCargas',
    '4_bipedestacion': 'bipedestacion',
    '5_movimientos_repetitivos': 'movimientosRepetitivos',
    '6_posturas_forzadas': 'posturasForzadas',
    '7_vibraciones_mano_brazo': 'vibracionesManoBrazo',
    '8_vibraciones_cuerpo_entero': 'vibracionesCuerpoEntero',
    '9_confort_termico': 'estresTermico',
    '10_estres_contacto': 'estresContacto'
  };

  const hasLifting = isP1Active('1_levantamiento', 'levantamientoCarga');

  // Cálculo NIOSH si hay levantamiento
  const nioshInput = {
    pesoCargaKg: Number(data.calculoLevantamiento?.pesoCargaKg ?? data.calculoLevantamiento?.peso ?? 0),
    distanciaHCm: Number(data.calculoLevantamiento?.distanciaHCm ?? (data.calculoLevantamiento?.distanciaH === 'cerca' ? 25 : data.calculoLevantamiento?.distanciaH === 'lejos' ? 55 : 35)),
    distanciaVCm: Number(data.calculoLevantamiento?.distanciaVCm ?? data.calculoLevantamiento?.distanciaV ?? 75),
    desplazamientoDCm: Number(data.calculoLevantamiento?.desplazamientoDCm ?? 25),
    anguloTorsionDeg: Number(data.calculoLevantamiento?.anguloTorsionDeg ?? data.calculoLevantamiento?.torsion ?? 0),
    frecuenciaLiftsMin: Number(data.calculoLevantamiento?.frecuenciaLiftsMin ?? data.calculoLevantamiento?.frecuencia ?? 0.2),
    duracionHoras: Number(data.calculoLevantamiento?.duracionHoras ?? data.calculoLevantamiento?.duracion ?? 1),
    calidadAgarre: (data.calculoLevantamiento?.calidadAgarre || data.calculoLevantamiento?.agarre || 'Bueno') as any
  };

  const nioshMetrics = calculateNioshSrt886(nioshInput);

  const nivelRiesgoFinal = data.nivelRiesgoGlobal || (nioshMetrics.nivelRiesgo === 'Nivel 3 (No Aceptable)' ? 'Nivel 3 (No Aceptable)' : data.riesgo === 'Moderado' ? 'Nivel 2 (Moderado)' : 'Nivel 1 (Aceptable)');
  const isHighRisk = nivelRiesgoFinal.includes('Nivel 3') || data.riesgo === 'Alto';
  const isModerateRisk = nivelRiesgoFinal.includes('Nivel 2') || data.riesgo === 'Moderado';

  const borderColor = isHighRisk ? '#dc2626' : isModerateRisk ? '#f59e0b' : '#10b981';

  return (
    <div
      id="pdf-content"
      className="report-print print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0 bg-[white] text-[#1e293b] p-[12mm_15mm] rounded-[8px] box-shadow-[0_4px_6px_rgba(0,0,0,0.1)] min-h-[29.7cm] h-[auto] font-family-[Helvetica,_Arial,_sans-serif] text-[8.5pt]"
      style={{ borderTop: `12px solid ${borderColor}` }}
    >
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .report-print { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            border: none !important;
            border-top: 12px solid ${borderColor} !important;
          }
          .company-logo { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        `}
      </style>

      {/* Header Institucional S.R.T. */}
      <div className="flex flex-row justify-between items-start border-b-[2px] border-slate-300 pb-3 mb-4 w-full">
        <div className="flex-1 text-left">
          <p className="m-0 font-extrabold text-[0.65rem] uppercase text-slate-500 tracking-wider">
            Superintendencia de Riesgos del Trabajo
          </p>
          <p style={{ color: borderColor }} className="m-0 font-black text-[0.8rem] uppercase tracking-wide">
            Resolución S.R.T. N° 886/15 — Anexo I
          </p>
        </div>
        <div className="flex-[2] flex flex-col items-center justify-center text-center">
          <h1 className="m-0 font-black text-[1.8rem] tracking-tight uppercase leading-none text-slate-900">
            PROTOCOLO DE ERGONOMÍA
          </h1>
          <div
            style={{ background: borderColor }}
            className="mt-1 text-white px-3 py-0.5 rounded-full text-[0.65rem] font-black tracking-wider uppercase"
          >
            {nivelRiesgoFinal}
          </div>
        </div>
        <div className="flex-1 text-right flex flex-col items-end gap-1">
          <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
        </div>
      </div>

      {/* I — Datos del Establecimiento y Puesto */}
      <div className="border border-slate-300 rounded-md mb-3.5 overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex justify-between items-center">
          <span className="font-black text-[0.72rem] text-slate-800 uppercase tracking-wide">
            I — DATOS DEL ESTABLECIMIENTO Y DEL PUESTO DE TRABAJO (Res. 886/15)
          </span>
          <span className="text-[0.65rem] font-bold text-slate-500">
            Fecha: {data.fechaEvaluacion || data.fecha || new Date().toLocaleDateString('es-AR')}
          </span>
        </div>
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
          <div className="p-2 border-r border-slate-200">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1">
              <Building2 size={11} /> EMPRESA / RAZÓN SOCIAL
            </span>
            <div className="font-extrabold text-[0.85rem] text-slate-900 mt-0.5">{data.empresa || '-'}</div>
          </div>
          <div className="p-2 border-r border-slate-200">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase">C.U.I.T. N°</span>
            <div className="font-bold text-[0.85rem] text-slate-800 mt-0.5 font-mono">{data.cuit || 'No informado'}</div>
          </div>
          <div className="p-2">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase">A.R.T. / AFILIADO</span>
            <div className="font-bold text-[0.85rem] text-slate-800 mt-0.5">{data.art || 'No informada'}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 bg-white border-b border-slate-200">
          <div className="p-2 border-r border-slate-200">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1">
              <MapPin size={11} /> SECTOR
            </span>
            <div className="font-bold text-[0.8rem] text-slate-800 mt-0.5">{data.sector || '-'}</div>
          </div>
          <div className="p-2 border-r border-slate-200">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1">
              <Briefcase size={11} /> PUESTO DE TRABAJO
            </span>
            <div className="font-bold text-[0.8rem] text-slate-800 mt-0.5">{data.puesto || '-'}</div>
          </div>
          <div className="p-2 border-r border-slate-200">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase">TRABAJADORES EXPUESTOS</span>
            <div className="font-bold text-[0.8rem] text-slate-800 mt-0.5">
              V: {data.trabajadoresVarones || 0} / M: {data.trabajadoresMujeres || 0}
            </div>
          </div>
          <div className="p-2">
            <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase flex items-center gap-1">
              <User size={11} /> EVALUADOR / MATRÍCULA
            </span>
            <div className="font-bold text-[0.8rem] text-slate-800 mt-0.5">
              {profile?.name || data.profesionalNombre || 'Especialista HyS'} {profile?.license ? `(${profile.license})` : ''}
            </div>
          </div>
        </div>

        <div className="p-2 bg-slate-50 text-[0.75rem]">
          <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase block">DESCRIPCIÓN DE LA TAREA Y CICLO DE TRABAJO</span>
          <p className="m-0 mt-0.5 font-medium text-slate-700">
            {data.descripcionTarea || 'Operaciones habituales del puesto evaluado sin especificaciones adicionales.'}
          </p>
        </div>
      </div>

      {/* II — Planilla 1: Identificación de Factores de Riesgo */}
      <div className="border border-slate-300 rounded-md mb-3.5 overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex justify-between items-center">
          <span className="font-black text-[0.72rem] text-slate-800 uppercase tracking-wide">
            II — PLANILLA 1: IDENTIFICACIÓN DE FACTORES DE RIESGO ERGONÓMICO (ANEXO I RES. SRT 886/15)
          </span>
          <span className="text-[0.65rem] font-extrabold text-slate-600">
            10 Factores Reglamentarios
          </span>
        </div>
        <table className="w-full text-left border-collapse text-[0.72rem]">
          <thead>
            <tr className="bg-slate-200/80 text-slate-700 border-b border-slate-300 font-extrabold text-[0.65rem] uppercase">
              <th className="p-1.5 text-center w-8 border-r border-slate-300">N°</th>
              <th className="p-1.5 border-r border-slate-300">Factor de Riesgo Ergonómico</th>
              <th className="p-1.5 border-r border-slate-300">Criterio Técnico Oficial SRT</th>
              <th className="p-1.5 text-center w-20 border-r border-slate-300">Presencia</th>
              <th className="p-1.5 text-center w-24">Planilla Derivada</th>
            </tr>
          </thead>
          <tbody>
            {OFFICIAL_PLANILLA1_FACTORS.map((factor, index) => {
              const legacyKey = factorMap[factor.id];
              const isPresent = isP1Active(factor.id, legacyKey);
              return (
                <tr
                  key={factor.id}
                  className={`border-b border-slate-200 ${isPresent ? 'bg-amber-50/60 font-semibold' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="p-1 text-center font-bold border-r border-slate-200 text-slate-600">
                    {factor.numero}
                  </td>
                  <td className="p-1 border-r border-slate-200 text-slate-800">
                    {factor.nombre}
                  </td>
                  <td className="p-1 border-r border-slate-200 text-slate-600 text-[0.68rem]">
                    {factor.criterioSrt}
                  </td>
                  <td className="p-1 text-center border-r border-slate-200">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[0.65rem] font-black">
                        <CheckCircle2 size={10} /> SÍ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">
                        <XCircle size={10} /> NO
                      </span>
                    )}
                  </td>
                  <td className="p-1 text-center text-slate-700 font-mono text-[0.65rem]">
                    {isPresent && factor.requierePlanilla2 ? (
                      <span className="font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {factor.planillaDerivada}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* III — Planilla 2.A: Levantamiento Manual de Cargas (Ecuación NIOSH) */}
      {hasLifting && (
        <div className="border border-slate-300 rounded-md mb-3.5 overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex justify-between items-center">
            <span className="font-black text-[0.72rem] text-slate-800 uppercase tracking-wide">
              III — PLANILLA 2.A: EVALUACIÓN DE LEVANTAMIENTO MANUAL DE CARGAS (ECUACIÓN NIOSH)
            </span>
            <span
              style={{ background: nioshMetrics.nivelRiesgo.includes('Nivel 3') ? '#dc2626' : nioshMetrics.nivelRiesgo.includes('Nivel 2') ? '#f59e0b' : '#10b981' }}
              className="text-white text-[0.65rem] font-black px-2 py-0.5 rounded"
            >
              {nioshMetrics.nivelRiesgo}
            </span>
          </div>
          <div className="p-2.5 bg-white">
            <div className="grid grid-cols-4 gap-2 mb-2 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase block">PESO REAL (M)</span>
                <span className="text-base font-black text-slate-900">{nioshMetrics.pesoCargaKg} kg</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase block">L.P.R. CALCULADO</span>
                <span className="text-base font-black text-blue-700">{nioshMetrics.lprKg} kg</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase block">ÍNDICE DE LEVANTAMIENTO</span>
                <span className={`text-base font-black ${nioshMetrics.indiceLevantamiento > 1.5 ? 'text-rose-600' : nioshMetrics.indiceLevantamiento > 1.0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  IL = {nioshMetrics.indiceLevantamiento}
                </span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.6rem] font-extrabold text-slate-500 uppercase block">LÍMITE ADMISIBLE (SRT)</span>
                <span className="text-base font-black text-slate-700">IL ≤ 1.0 (Máx 25 kg)</span>
              </div>
            </div>

            {/* Factores de reducción NIOSH */}
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[0.68rem] grid grid-cols-6 gap-1 text-center font-mono">
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">HM (Horiz.)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.HM} ({nioshMetrics.distanciaHCm} cm)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">VM (Vert.)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.VM} ({nioshMetrics.distanciaVCm} cm)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">DM (Despl.)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.DM} ({nioshMetrics.desplazamientoDCm} cm)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">AM (Asimet.)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.AM} ({nioshMetrics.anguloTorsionDeg}°)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">FM (Frec.)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.FM} ({nioshMetrics.frecuenciaLiftsMin} lev/min)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[0.6rem] font-bold">CM (Agarre)</span>
                <span className="font-bold text-slate-800">{nioshMetrics.multiplicadores.CM} ({nioshMetrics.calidadAgarre})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IV — Planilla 3: Matriz de Medidas Preventivas y Correctivas */}
      <div className="border border-slate-300 rounded-md mb-3.5 overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex justify-between items-center">
          <span className="font-black text-[0.72rem] text-slate-800 uppercase tracking-wide">
            IV — PLANILLA 3: MATRIZ DE MEDIDAS PREVENTIVAS Y CORRECTIVAS (RES. SRT 886/15)
          </span>
          <span className="text-[0.65rem] font-bold text-slate-500">
            Jerarquía de Controles
          </span>
        </div>
        <table className="w-full text-left border-collapse text-[0.72rem]">
          <thead>
            <tr className="bg-slate-200/80 text-slate-700 border-b border-slate-300 font-extrabold text-[0.65rem] uppercase">
              <th className="p-1.5 border-r border-slate-300">Factor de Riesgo</th>
              <th className="p-1.5 border-r border-slate-300">Medida de Intervención Propuesta</th>
              <th className="p-1.5 border-r border-slate-300 text-center w-28">Tipo de Medida</th>
              <th className="p-1.5 border-r border-slate-300 text-center w-20">Plazo</th>
              <th className="p-1.5 text-center w-28">Responsable</th>
            </tr>
          </thead>
          <tbody>
            {(data.medidasAccion && data.medidasAccion.length > 0) ? (
              data.medidasAccion.map((med: any, i: number) => (
                <tr key={med.id || i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="p-1.5 font-bold border-r border-slate-200 text-slate-800">{med.factorRiesgo}</td>
                  <td className="p-1.5 border-r border-slate-200 text-slate-700">{med.medidaPropuesta}</td>
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">
                      {med.tipoMedida}
                    </span>
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-600">{med.plazo}</td>
                  <td className="p-1.5 text-center text-slate-700">{med.responsable}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-1.5 font-bold border-r border-slate-200 text-slate-800">
                  {hasLifting ? 'Levantamiento de Cargas' : 'Ergonomía General'}
                </td>
                <td className="p-1.5 border-r border-slate-200 text-slate-700">
                  {data.recomendaciones || 'Capacitar a los trabajadores en métodos seguros de manipulación manual y pausas ergonómicas activas.'}
                </td>
                <td className="p-1.5 border-r border-slate-200 text-center">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">
                    {hasLifting ? 'Ingeniería / Org.' : 'Capacitación'}
                  </span>
                </td>
                <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-600">60 días</td>
                <td className="p-1.5 text-center text-slate-700">Servicio HyS / Operaciones</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* V — Conclusiones y Dictamen Técnico */}
      <div className="border border-slate-300 rounded-md mb-4 overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex justify-between items-center">
          <span className="font-black text-[0.72rem] text-slate-800 uppercase tracking-wide">
            V — CONCLUSIONES Y RECOMENDACIONES TÉCNICAS (DICTAMEN PROFESIONAL)
          </span>
          <span className="text-[0.65rem] font-bold text-slate-500">
            Validez Anual
          </span>
        </div>
        <div className="p-2.5 bg-slate-50/60 text-[0.78rem] text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
          {data.conclusiones || data.recomendaciones || 'El puesto evaluado cumple con los parámetros ergonómicos básicos bajo las condiciones relevadas al momento del estudio.'}
        </div>
      </div>

      {/* Firmas Tripartitas Enterprise */}
      <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="pt-3 border-t-2 border-dashed border-slate-300 flex gap-4 pb-2 justify-end">
        {showSignatures.operator && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-1 max-w-[240px] border border-slate-300 rounded-md p-2 flex flex-col items-center">
            <div className="h-16 w-full flex items-end justify-center border-b border-slate-200 pb-1 mb-1">
              {data.operatorSignature ? (
                <img src={data.operatorSignature} alt="Firma Operador" className="max-h-14 object-contain" />
              ) : null}
            </div>
            <p className="m-0 font-black text-[0.68rem] text-slate-800 uppercase">OPERADOR / TRABAJADOR</p>
            <p className="m-0 text-[0.58rem] text-slate-500">Toma de conocimiento</p>
          </div>
        )}

        {showSignatures.supervisor && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-1 max-w-[240px] border border-slate-300 rounded-md p-2 flex flex-col items-center">
            <div className="h-16 w-full flex items-end justify-center border-b border-slate-200 pb-1 mb-1">
              {data.supervisorSignature ? (
                <img src={data.supervisorSignature} alt="Firma Supervisor" className="max-h-14 object-contain" />
              ) : null}
            </div>
            <p className="m-0 font-black text-[0.68rem] text-slate-800 uppercase">SUPERVISOR / EMPLEADOR</p>
            <p className="m-0 text-[0.58rem] text-slate-500">Firma Autorizada</p>
          </div>
        )}

        {showSignatures.professional && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="flex-1 max-w-[240px] border border-emerald-300 bg-emerald-50/40 rounded-md p-2 flex flex-col items-center">
            <div className="h-16 w-full flex items-end justify-center border-b border-emerald-300 pb-1 mb-1">
              {signature?.signature ? (
                <img src={signature.signature} alt="Firma Profesional" className="max-h-14 object-contain" />
              ) : null}
            </div>
            <p className="m-0 font-black text-[0.68rem] text-emerald-900 uppercase">PROFESIONAL ACTUANTE</p>
            <p className="m-0 text-[0.58rem] text-emerald-800 font-bold">{profile?.name || data.profesionalNombre || 'Especialista H&S'}</p>
            {(profile?.license || data.profesionalMatricula) && (
              <p className="m-0 text-[0.58rem] text-emerald-700">Mat: {profile?.license || data.profesionalMatricula}</p>
            )}
          </div>
        )}
      </div>

      <PdfBrandingFooter />
    </div>
  );
}
