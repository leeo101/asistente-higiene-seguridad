import React from 'react';
import { 
  Sun, Lightbulb, CheckCircle2, AlertTriangle, ShieldCheck, 
  Sparkles, Layers, Sliders, Activity, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface LightingPoint {
  id: string;
  ubicacion: string;
  luxMedido: number;
}

interface LightingCalculatorWidgetProps {
  luxRequerido: number; // Lux exigidos por norma
  mediciones: LightingPoint[];
  className?: string;
  onConclusionGenerated?: (conclusion: string) => void;
}

export const calcLightingMetrics = (luxRequerido: number, mediciones: LightingPoint[]) => {
  const valid = mediciones.map(m => Number(m.luxMedido || 0));
  const count = valid.length;

  if (count === 0) {
    return {
      eMed: 0,
      eMin: 0,
      eMax: 0,
      uniformidad: 0,
      cumpleNivel: false,
      cumpleUniformidad: false,
      dictamen: 'SIN MEDICIONES',
      badgeBg: 'bg-slate-950/60 text-slate-400 border-slate-800'
    };
  }

  const sum = valid.reduce((a, b) => a + b, 0);
  const eMed = sum / count;
  const eMin = Math.min(...valid);
  const eMax = Math.max(...valid);
  const uniformidad = eMed > 0 ? eMin / eMed : 0;

  const cumpleNivel = eMed >= luxRequerido;
  const cumpleUniformidad = uniformidad >= 0.5;

  let dictamen = 'CUMPLE PROTOCOLO RES. SRT 84/12';
  let badgeBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50';

  if (!cumpleNivel) {
    dictamen = 'NO CUMPLE - NIVEL LUMÍNICO INSUFICIENTE';
    badgeBg = 'bg-rose-950/80 text-rose-300 border-rose-500/60';
  } else if (!cumpleUniformidad) {
    dictamen = 'ALERTA - ILUMINACIÓN DESUNIFORME (U < 0.5)';
    badgeBg = 'bg-yellow-950/60 text-yellow-300 border-yellow-500/50';
  }

  return {
    eMed,
    eMin,
    eMax,
    uniformidad,
    cumpleNivel,
    cumpleUniformidad,
    dictamen,
    badgeBg
  };
};

export const LightingCalculatorWidget: React.FC<LightingCalculatorWidgetProps> = ({
  luxRequerido,
  mediciones,
  className = '',
  onConclusionGenerated
}) => {
  const metrics = calcLightingMetrics(luxRequerido, mediciones);

  const handleGenerateAiConclusion = () => {
    const text = `CONCLUSIÓN TÉCNICA DE ILUMINACIÓN (Res. SRT 84/12 & Dec. 351/79):
- Exigencia Reglamentaria: ${luxRequerido} lux en plano de trabajo.
- Iluminancia Media Medida (Emed): ${metrics.eMed.toFixed(1)} lux | Mínima (Emin): ${metrics.eMin} lux.
- Factor de Uniformidad (U = Emin/Emed): ${metrics.uniformidad.toFixed(2)} (Mínimo recomendado: 0.50).
- DICTAMEN FINAL: ${metrics.dictamen}. Se recomienda mantener limpios los difusores y reemplazar luminarias agotadas.`;

    if (onConclusionGenerated) onConclusionGenerated(text);
    toast.success('Conclusión lumínica técnica generada');
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <Sun size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
              Calculadora de Iluminación & Uniformidad
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Res. SRT 84/12
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Evaluación de Illuminancia Media ($E_{'{med}'}$), Mínima ($E_{'{min}'}$) y Factor de Uniformidad ($U$).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateAiConclusion}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
        >
          <Sparkles size={16} /> Generar Conclusión Técnica
        </button>
      </div>

      {/* Grid Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Emed */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            Iluminancia Media (Emed)
          </span>
          <div className="text-2xl font-black text-white">
            {metrics.eMed.toFixed(0)} <span className="text-xs font-bold text-slate-400">lux</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Exigido por tarea: {luxRequerido} lux
          </span>
        </div>

        {/* Emin */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
            Iluminancia Mínima (Emin)
          </span>
          <div className="text-2xl font-black text-white">
            {metrics.eMin} <span className="text-xs font-bold text-slate-400">lux</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Máxima registrada: {metrics.eMax} lux
          </span>
        </div>

        {/* Uniformidad U */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">
            Factor de Uniformidad (U)
          </span>
          <div className="text-2xl font-black text-purple-300">
            {metrics.uniformidad.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Mínimo recomendado: U ≥ 0.50
          </span>
        </div>

        {/* Dictamen */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-lg ${metrics.badgeBg}`}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">
              Dictamen Res. SRT 84/12
            </span>
            <div className="text-sm font-black mt-1 leading-tight">
              {metrics.dictamen}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightingCalculatorWidget;
