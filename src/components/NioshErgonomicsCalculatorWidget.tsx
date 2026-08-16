import React from 'react';
import { 
  Accessibility, AlertCircle, CheckCircle2, AlertTriangle, 
  Sparkles, Layers, Sliders, Info, ShieldCheck, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface NioshParams {
  pesoReal: number; // kg
  distanciaH: number; // cm (25 a 63)
  distanciaV: number; // cm (0 a 175)
  desplazamientoD: number; // cm (25 a 175)
  anguloTorsionA: number; // grados (0 a 135)
  frecuenciaF: number; // levantamientos por minuto
  agarre: 'Bueno' | 'Regular' | 'Malo';
}

interface NioshErgonomicsCalculatorWidgetProps {
  params: NioshParams;
  onChangeParams?: (updated: Partial<NioshParams>) => void;
  className?: string;
}

export const calcNioshMetrics = (p: NioshParams) => {
  const LC = 25; // Constante de carga 25 kg

  // Factor de Distancia Horizontal HM = 25 / H
  const hClamped = Math.max(25, Math.min(63, p.distanciaH || 25));
  const HM = 25 / hClamped;

  // Factor de Altura Vertical VM = 1 - (0.003 * |V - 75|)
  const vClamped = Math.max(0, Math.min(175, p.distanciaV || 75));
  const VM = Math.max(0, 1 - (0.003 * Math.abs(vClamped - 75)));

  // Factor de Desplazamiento DM = 0.82 + (4.5 / D)
  const dClamped = Math.max(25, Math.min(175, p.desplazamientoD || 25));
  const DM = Math.min(1.0, 0.82 + (4.5 / dClamped));

  // Factor de Asimetría / Torsión AM = 1 - (0.0032 * A)
  const aClamped = Math.max(0, Math.min(135, p.anguloTorsionA || 0));
  const AM = Math.max(0, 1 - (0.0032 * aClamped));

  // Factor de Frecuencia FM (Aproximación por tabla SRT 886/15)
  let FM = 0.95;
  if (p.frecuenciaF > 10) FM = 0.40;
  else if (p.frecuenciaF > 5) FM = 0.60;
  else if (p.frecuenciaF > 2) FM = 0.75;
  else if (p.frecuenciaF > 1) FM = 0.85;

  // Factor de Agarre CM
  let CM = 1.0;
  if (p.agarre === 'Regular') CM = 0.95;
  if (p.agarre === 'Malo') CM = 0.90;

  // Límite de Peso Recomendado
  const LPR = LC * HM * VM * DM * AM * FM * CM;

  // Índice de Levantamiento IL = Peso / LPR
  const peso = p.pesoReal || 0;
  const IL = LPR > 0 ? peso / LPR : 0;

  let riskLevel: 'bajo' | 'moderado' | 'alto' = 'bajo';
  let riskLabel = 'ACEPTABLE (IL ≤ 1.0)';
  let riskBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';

  if (IL > 1.5) {
    riskLevel = 'alto';
    riskLabel = 'RIESGO ALTO (IL > 1.5)';
    riskBg = 'bg-rose-950/80 text-rose-300 border-rose-500/60';
  } else if (IL > 1.0) {
    riskLevel = 'moderado';
    riskLabel = 'RIESGO MODERADO (1.0 < IL ≤ 1.5)';
    riskBg = 'bg-yellow-950/60 text-yellow-300 border-yellow-500/50';
  }

  return {
    HM, VM, DM, AM, FM, CM, LPR, IL, riskLevel, riskLabel, riskBg
  };
};

export const NioshErgonomicsCalculatorWidget: React.FC<NioshErgonomicsCalculatorWidgetProps> = ({
  params,
  onChangeParams,
  className = ''
}) => {
  const metrics = calcNioshMetrics(params);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <Accessibility size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
              Calculadora de Levantamiento NIOSH (Res. SRT 886/15)
              <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                Protocolo Oficial
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Evaluación del Límite de Peso Recomendado (LPR) e Índice de Levantamiento (IL).
            </p>
          </div>
        </div>
      </div>

      {/* Grid Indicadores LPR & IL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* LPR */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">
            Límite Peso Recomendado (LPR)
          </span>
          <div className="text-3xl font-black text-white">
            {metrics.LPR.toFixed(1)} <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Carga máxima segura calculada
          </span>
        </div>

        {/* Peso Real */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
            Peso Real Manipulado
          </span>
          <div className="text-3xl font-black text-white">
            {params.pesoReal || 0} <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Peso efectivo en la tarea
          </span>
        </div>

        {/* Índice IL */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-lg ${metrics.riskBg}`}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">
              Índice de Levantamiento (IL)
            </span>
            <div className="text-3xl font-black">
              {metrics.IL.toFixed(2)}
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase">
            {metrics.riskLabel}
          </span>
        </div>
      </div>

      {/* Controles de Parámetros Interactivos */}
      {onChangeParams && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <span className="text-xs font-black text-white uppercase tracking-widest block">
            Ajustar Factores Geométricos y Operativos
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Distancia Horizontal H (cm)</label>
              <input
                type="number"
                value={params.distanciaH}
                onChange={(e) => onChangeParams({ distanciaH: parseFloat(e.target.value) || 25 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Altura Vertical V (cm)</label>
              <input
                type="number"
                value={params.distanciaV}
                onChange={(e) => onChangeParams({ distanciaV: parseFloat(e.target.value) || 75 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Torsión de Tronco A (°)</label>
              <input
                type="number"
                value={params.anguloTorsionA}
                onChange={(e) => onChangeParams({ anguloTorsionA: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NioshErgonomicsCalculatorWidget;
