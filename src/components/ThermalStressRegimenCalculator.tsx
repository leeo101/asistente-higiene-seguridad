import React, { useState } from 'react';
import { 
  ThermometerSun, ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  Droplets, Flame, Info, Shirt, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';

export interface ThermalRegimenResult {
  tgbhMeasured: number;
  cavCorrection: number;
  tgbhEffective: number;
  vleLimit: number;
  vlaAction: number;
  regimenType: '100_0' | '75_25' | '50_50' | '25_75' | 'prohibido';
  workMinutes: number;
  restMinutes: number;
  status: 'admisible' | 'alerta' | 'excedido' | 'critico';
  hydrationMlPerHour: number;
  recommendations: string[];
}

interface ThermalStressRegimenCalculatorProps {
  onCalculate?: (result: ThermalRegimenResult) => void;
  className?: string;
}

// Res. SRT 30/2023 — Tabla de Aislamiento de Indumentaria (CAV)
const CLOTHING_CAV_OPTIONS = [
  { id: 'standard', label: 'Ropa de Trabajo Estándar (Algodón)', cav: 0.0, icon: '👕' },
  { id: 'coverall', label: 'Mameluco de Algodón Pesado', cav: 1.5, icon: '👔' },
  { id: 'tyvek', label: 'Traje Impermeable / Tyvek / PVC', cav: 3.0, icon: '🥼' },
  { id: 'aluminized', label: 'Traje Aluminizado / Estanco Químico', cav: 11.0, icon: '🛡️' }
];

// Res. SRT 30/2023 — Límites VLE (°C)
const VLE_TABLE: Record<string, Record<string, number>> = {
  '100_0': { 'liviano': 29.0, 'moderado': 26.7, 'pesado': 25.0 },
  '75_25': { 'liviano': 30.6, 'moderado': 27.5, 'pesado': 25.9 },
  '50_50': { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9 },
  '25_75': { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0 }
};

export const ThermalStressRegimenCalculator: React.FC<ThermalStressRegimenCalculatorProps> = ({
  onCalculate,
  className = ''
}) => {
  const [tbh, setTbh] = useState<number>(24.5);
  const [tg, setTg] = useState<number>(31.0);
  const [tbs, setTbs] = useState<number>(30.0);
  const [isOutdoorSun, setIsOutdoorSun] = useState<boolean>(true);
  const [metabolicRate, setMetabolicRate] = useState<'liviano' | 'moderado' | 'pesado'>('moderado');
  const [selectedClothing, setSelectedClothing] = useState<string>('standard');
  const [isAcclimatized, setIsAcclimatized] = useState<boolean>(true);

  // Cálculo del TGBH Medido
  const tgbhMeasured = isOutdoorSun 
    ? 0.7 * tbh + 0.2 * tg + 0.1 * tbs 
    : 0.7 * tbh + 0.3 * tg;

  // Ajuste por Vestimenta (CAV)
  const clothingObj = CLOTHING_CAV_OPTIONS.find(c => c.id === selectedClothing) || CLOTHING_CAV_OPTIONS[0];
  const cav = clothingObj.cav;
  const tgbhEffective = tgbhMeasured + cav;

  // Determinación de Régimen Trabajo/Descanso
  let regimenType: '100_0' | '75_25' | '50_50' | '25_75' | 'prohibido' = '100_0';
  let workMinutes = 60;
  let restMinutes = 0;

  const vleContinuous = VLE_TABLE['100_0'][metabolicRate] - (!isAcclimatized ? 2.0 : 0.0);
  const vlaAction = vleContinuous - 1.5;

  if (tgbhEffective <= vleContinuous) {
    regimenType = '100_0';
    workMinutes = 60;
    restMinutes = 0;
  } else if (tgbhEffective <= VLE_TABLE['75_25'][metabolicRate]) {
    regimenType = '75_25';
    workMinutes = 45;
    restMinutes = 15;
  } else if (tgbhEffective <= VLE_TABLE['50_50'][metabolicRate]) {
    regimenType = '50_50';
    workMinutes = 30;
    restMinutes = 30;
  } else if (tgbhEffective <= VLE_TABLE['25_75'][metabolicRate]) {
    regimenType = '25_75';
    workMinutes = 15;
    restMinutes = 45;
  } else {
    regimenType = 'prohibido';
    workMinutes = 0;
    restMinutes = 60;
  }

  // Determinar Status
  let status: 'admisible' | 'alerta' | 'excedido' | 'critico' = 'admisible';
  if (regimenType === 'prohibido') status = 'critico';
  else if (tgbhEffective > vleContinuous) status = 'excedido';
  else if (tgbhEffective > vlaAction) status = 'alerta';

  // Hidratación recomendada
  const hydrationMl = status === 'critico' ? 1200 : status === 'excedido' ? 1000 : status === 'alerta' ? 750 : 500;

  const recommendations: string[] = [];
  if (status === 'critico') {
    recommendations.push('🛑 DETENCIÓN INMEDIATA DE TAREAS: El TGBH efectivo supera los límites admisibles absolutos.');
    recommendations.push('Trasladar al personal a un área climatizada o sombreada con ventilación forzada.');
  } else if (status === 'excedido') {
    recommendations.push(`⚠️ APLICAR RÉGIMEN DE TRABAJO/DESCANSO: ${workMinutes} min de trabajo x ${restMinutes} min de descanso por hora.`);
    recommendations.push('Garantizar puesto de descanso sombreado a temperatura inferior a 25°C.');
  } else if (status === 'alerta') {
    recommendations.push('🟡 ZONA DE ACCIÓN (VLA Excedido): Iniciar vigilancia médica de hidratación y pulso.');
  } else {
    recommendations.push('🟢 DENTRO DE LÍMITES PERMISIBLES: Mantener hidratación continua.');
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header Widget */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <ThermometerSun size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
              Calculadora de Estrés Térmico TGBH (Res. SRT 30/2023)
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Norma SRT Vigente
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Evaluación de carga térmica con corrección por ropa (CAV) y régimen Trabajo/Descanso.
            </p>
          </div>
        </div>
      </div>

      {/* Sliders y Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Temperaturas Medidas */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">1. Temperaturas (°C)</span>
          
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
              <span>T. Bulbo Húmedo (Tbh):</span>
              <span className="font-extrabold text-amber-400">{tbh.toFixed(1)} °C</span>
            </div>
            <input 
              type="range" min="15" max="38" step="0.1" value={tbh}
              onChange={(e) => setTbh(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
              <span>T. de Globo (Tg):</span>
              <span className="font-extrabold text-rose-400">{tg.toFixed(1)} °C</span>
            </div>
            <input 
              type="range" min="15" max="55" step="0.1" value={tg}
              onChange={(e) => setTg(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
              <span>T. Bulbo Seco (Tbs):</span>
              <span className="font-extrabold text-blue-400">{tbs.toFixed(1)} °C</span>
            </div>
            <input 
              type="range" min="15" max="45" step="0.1" value={tbs}
              onChange={(e) => setTbs(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Factores Operativos y Vestimenta */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">2. Entorno y Ropa (CAV)</span>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Exposición Solar</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsOutdoorSun(true)}
                className={`py-1.5 px-2 rounded-xl font-bold border transition-colors ${isOutdoorSun ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                ☀️ Sol Exterior
              </button>
              <button
                type="button"
                onClick={() => setIsOutdoorSun(false)}
                className={`py-1.5 px-2 rounded-xl font-bold border transition-colors ${!isOutdoorSun ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                🏠 Sombra / Interior
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Aislamiento por Ropa (CAV Res. 30/23)</label>
            <select
              value={selectedClothing}
              onChange={(e) => setSelectedClothing(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              {CLOTHING_CAV_OPTIONS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label} (+{c.cav}°C)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Carga Metabólica</label>
            <select
              value={metabolicRate}
              onChange={(e) => setMetabolicRate(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              <option value="liviano">Liviana (≤ 200W) - Tareas livianas</option>
              <option value="moderado">Moderada (200-350W) - Caminar / Cargas</option>
              <option value="pesado">Pesada (&gt; 350W) - Esfuerzo continuo</option>
            </select>
          </div>
        </div>

        {/* Resultados e Indicador Gráfico de Régimen */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">3. Dictamen Térmico</span>

            {/* Medidor de TGBH Efectivo */}
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 mb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">TGBH Efectivo (+CAV)</span>
                <span className="text-2xl font-black text-amber-400">{tgbhEffective.toFixed(1)} °C</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Límite VLE</span>
                <span className="text-sm font-extrabold text-slate-200">{vleContinuous.toFixed(1)} °C</span>
              </div>
            </div>

            {/* Reloj Gráfico de Ciclo por Hora */}
            <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-white">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-amber-400" /> Régimen por Hora
                </span>
                <span className="text-amber-300">
                  {workMinutes}m Trabajo / {restMinutes}m Descanso
                </span>
              </div>

              {/* Barra Proporcional Trabajo/Descanso */}
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${(workMinutes / 60) * 100}%` }}
                  className="bg-amber-500 h-full transition-all flex items-center justify-center text-[9px] font-black text-slate-950 uppercase"
                >
                  {workMinutes > 0 && `${workMinutes} min`}
                </div>
                <div 
                  style={{ width: `${(restMinutes / 60) * 100}%` }}
                  className="bg-blue-600 h-full transition-all flex items-center justify-center text-[9px] font-black text-white uppercase"
                >
                  {restMinutes > 0 && `${restMinutes} min`}
                </div>
              </div>
            </div>
          </div>

          {/* Hidratación Recomendada */}
          <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-blue-200 font-bold flex items-center gap-1.5">
              <Droplets size={16} className="text-blue-400" /> Plan de Hidratación:
            </span>
            <span className="font-black text-blue-300">{hydrationMl} ml / hora</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalStressRegimenCalculator;
