import React, { useState } from 'react';
import { 
  TriangleAlert, ShieldCheck, ShieldAlert, CheckCircle2, 
  Sparkles, Layers, Sliders, Info, Zap, Flame, Leaf, Activity, Brain, Wrench, Ban, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface IpercItem {
  id: string;
  taskName: string;
  hazardCategory: string;
  hazardDescription: string;
  consequenceDescription: string;
  // Riesgo Puro Inicial
  initialProb: number; // 1-5
  initialSev: number;  // 1-5
  initialRiskScore: number;
  initialRiskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
  // Jerarquía de Control
  controlHierarchy: 'eliminacion' | 'sustitucion' | 'ingenieria' | 'administrativo' | 'epp';
  controlDescription: string;
  // Riesgo Residual Post-Control
  residualProb: number; // 1-5
  residualSev: number;  // 1-5
  residualRiskScore: number;
  residualRiskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
}

interface IpercRiskMatrix5x5Props {
  onItemEvaluated?: (item: IpercItem) => void;
  className?: string;
}

const PROBABILITY_SCALE = [
  { value: 1, label: '1 - Raro', desc: 'Sanción excepcional, casi imposible' },
  { value: 2, label: '2 - Improbable', desc: 'Poco frecuente en el sector' },
  { value: 3, label: '3 - Posible', desc: 'Ocurre eventualmente' },
  { value: 4, label: '4 - Probable', desc: 'Sucede de manera recurrente' },
  { value: 5, label: '5 - Casi Seguro', desc: 'Se espera que ocurra en la tarea' }
];

const SEVERITY_SCALE = [
  { value: 1, label: '1 - Insignificante', desc: 'Sin primeros auxilios' },
  { value: 2, label: '2 - Menor', desc: 'Lesión leve, tratamiento curativo' },
  { value: 3, label: '3 - Moderado', desc: 'Incapacidad temporal corta' },
  { value: 4, label: '4 - Mayor', desc: 'Lesión grave, secuelas permanentes' },
  { value: 5, label: '5 - Catastrófico', desc: 'Mortalidad o invalidez total' }
];

export const calcIpercRisk = (p: number, s: number) => {
  const score = p * s;
  if (score <= 4) return { level: 'bajo' as const, label: 'BAJO', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50', score };
  if (score <= 9) return { level: 'medio' as const, label: 'MEDIO', bg: 'bg-yellow-950/60 text-yellow-300 border-yellow-500/50', score };
  if (score <= 16) return { level: 'alto' as const, label: 'ALTO', bg: 'bg-orange-950/60 text-orange-300 border-orange-500/50', score };
  return { level: 'critico' as const, label: 'CRÍTICO', bg: 'bg-rose-950/80 text-rose-300 border-rose-500/60', score };
};

export const IpercRiskMatrix5x5: React.FC<IpercRiskMatrix5x5Props> = ({
  onItemEvaluated,
  className = ''
}) => {
  const [taskName, setTaskName] = useState('Trabajo en Altura sobre Estructura Metálica');
  const [hazardCategory, setHazardCategory] = useState('Mecánico');
  const [hazardDescription, setHazardDescription] = useState('Caída de distinto nivel por falta de punto de anclaje rígido');
  const [consequenceDescription, setConsequenceDescription] = useState('Traumatismo severo, fracturas o fatalidad');

  const [initialProb, setInitialProb] = useState<number>(4);
  const [initialSev, setInitialSev] = useState<number>(4);

  const [controlHierarchy, setControlHierarchy] = useState<'eliminacion' | 'sustitucion' | 'ingenieria' | 'administrativo' | 'epp'>('ingenieria');
  const [controlDescription, setControlDescription] = useState('Instalación de línea de vida de acero rígida + Arnés anticaídas con amortiguador');

  const [residualProb, setResidualProb] = useState<number>(1);
  const [residualSev, setResidualSev] = useState<number>(2);

  const initialRisk = calcIpercRisk(initialProb, initialSev);
  const residualRisk = calcIpercRisk(residualProb, residualSev);

  const handleApplyAiControls = () => {
    toast.loading('✨ Generando sugerencias de control ISO 45001 con IA...', { duration: 1000 });
    setTimeout(() => {
      setControlHierarchy('ingenieria');
      setControlDescription('Colocación de protecciones colectivas (barandas compuestas) + Sistema anticaídas certificado + ATS previo');
      setResidualProb(1);
      setResidualSev(2);
      toast.success('Sugerencia de controles aplicada');
    }, 1000);
  };

  const handleSaveAssessment = () => {
    const item: IpercItem = {
      id: `iperc-${Date.now()}`,
      taskName,
      hazardCategory,
      hazardDescription,
      consequenceDescription,
      initialProb,
      initialSev,
      initialRiskScore: initialRisk.score,
      initialRiskLevel: initialRisk.level,
      controlHierarchy,
      controlDescription,
      residualProb,
      residualSev,
      residualRiskScore: residualRisk.score,
      residualRiskLevel: residualRisk.level
    };

    if (onItemEvaluated) onItemEvaluated(item);
    toast.success('Evaluación IPERC registrada correctamente');
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <TriangleAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
              Matriz de Evaluación de Riesgos IPERC 5x5
              <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                Norma ISO 45001
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Evaluación matricial de Riesgo Puro vs Riesgo Residual y Jerarquía de Controles.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyAiControls}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
        >
          <Sparkles size={16} /> Sugerir Controles IA
        </button>
      </div>

      {/* Matriz Gráfica 5x5 Interactivas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Izquierdo: Configuración del Peligro y Riesgo Inicial */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-black text-rose-400 uppercase tracking-widest block">
            1. Riesgo Puro Inicial (Sin Controles)
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Probabilidad (P)</label>
              <select
                value={initialProb}
                onChange={(e) => setInitialProb(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
              >
                {PROBABILITY_SCALE.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Severidad / Consecuencia (C)</label>
              <select
                value={initialSev}
                onChange={(e) => setInitialSev(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
              >
                {SEVERITY_SCALE.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resultado Riesgo Inicial */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${initialRisk.bg}`}>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Riesgo Inicial P x C</span>
              <span className="text-2xl font-black">{initialRisk.score} pts - {initialRisk.label}</span>
            </div>
            <TriangleAlert size={28} />
          </div>
        </div>

        {/* Lado Derecho: Jerarquía de Controles y Riesgo Residual */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
            2. Jerarquía de Controles & Riesgo Residual
          </span>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Nivel en Jerarquía ISO 45001</label>
            <select
              value={controlHierarchy}
              onChange={(e) => setControlHierarchy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
            >
              <option value="eliminacion">🚫 1. Eliminación (Eliminar peligro del proceso)</option>
              <option value="sustitucion">🔄 2. Sustitución (Reemplazar por insumo seguro)</option>
              <option value="ingenieria">🛠️ 3. Control de Ingeniería (Guardas / Protecciones)</option>
              <option value="administrativo">📜 4. Control Administrativo (Procedimientos / ATS)</option>
              <option value="epp">👝 5. EPP (Equipo de Protección Personal)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Probabilidad Residual</label>
              <select
                value={residualProb}
                onChange={(e) => setResidualProb(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
              >
                {PROBABILITY_SCALE.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Severidad Residual</label>
              <select
                value={residualSev}
                onChange={(e) => setResidualSev(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
              >
                {SEVERITY_SCALE.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resultado Riesgo Residual */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${residualRisk.bg}`}>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Riesgo Residual Resultante</span>
              <span className="text-2xl font-black">{residualRisk.score} pts - {residualRisk.label}</span>
            </div>
            <ShieldCheck size={28} />
          </div>
        </div>
      </div>

      {/* Grilla Visual 5x5 de Mapa de Calor */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        <span className="text-xs font-black text-white uppercase tracking-widest block">
          Mapa de Calor Matriz IPERC 5x5
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 text-[11px]">
                <th className="p-2 text-left">Probabilidad \ Severidad</th>
                <th className="p-2">1. Insignificante</th>
                <th className="p-2">2. Menor</th>
                <th className="p-2">3. Moderado</th>
                <th className="p-2">4. Mayor</th>
                <th className="p-2">5. Catastrófico</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(pVal => (
                <tr key={pVal}>
                  <td className="p-2 text-left font-bold text-slate-300">{pVal}. {PROBABILITY_SCALE.find(p => p.value === pVal)?.label.split('-')[1]}</td>
                  {[1, 2, 3, 4, 5].map(sVal => {
                    const r = calcIpercRisk(pVal, sVal);
                    const isSelectedInitial = initialProb === pVal && initialSev === sVal;
                    const isSelectedResidual = residualProb === pVal && residualSev === sVal;

                    return (
                      <td 
                        key={sVal} 
                        className={`p-3 font-black border border-slate-800 transition-all ${r.bg} ${
                          isSelectedInitial ? 'ring-4 ring-rose-500 scale-105 z-10' : ''
                        } ${
                          isSelectedResidual ? 'ring-4 ring-emerald-400 scale-105 z-10' : ''
                        }`}
                      >
                        {r.score}
                        {isSelectedInitial && <span className="block text-[9px] font-black text-rose-200">INICIAL</span>}
                        {isSelectedResidual && <span className="block text-[9px] font-black text-emerald-200">RESIDUAL</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IpercRiskMatrix5x5;
