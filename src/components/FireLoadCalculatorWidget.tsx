import React from 'react';
import { 
  Flame, ShieldAlert, ShieldCheck, Zap, Sparkles, Building2, 
  Layers, Calculator, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface FireMaterialItem {
  nombre: string;
  peso: number; // kg
  poderCalorifico: number; // kcal/kg
}

interface FireLoadCalculatorWidgetProps {
  superficie: number; // m2
  riesgo: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  materiales: FireMaterialItem[];
  className?: string;
  onConclusionGenerated?: (conclusion: string) => void;
}

export const calcFireLoadMetrics = (superficie: number, riesgo: string, materiales: FireMaterialItem[]) => {
  const totalKcal = materiales.reduce((acc, m) => acc + (Number(m.peso || 0) * Number(m.poderCalorifico || 0)), 0);
  const totalMcal = totalKcal / 1000;
  const maderaEquivKg = totalKcal / 4400; // 4.400 kcal/kg patrón madera (Dec. 351/79)
  const cargaFuegoKgM2 = superficie > 0 ? maderaEquivKg / superficie : 0;

  // Potencial Extintor Mínimo según Dec. 351/79 Anexo VII Tabla 2.1
  let potencialClaseA = '1A';
  if (cargaFuegoKgM2 > 100) potencialClaseA = '10A';
  else if (cargaFuegoKgM2 > 60) potencialClaseA = '6A';
  else if (cargaFuegoKgM2 > 30) potencialClaseA = '3A';
  else if (cargaFuegoKgM2 > 15) potencialClaseA = '2A';

  let potencialClaseB = '6B';
  if (riesgo === 'R1' || riesgo === 'R2') potencialClaseB = '20B';
  else if (riesgo === 'R3') potencialClaseB = '10B';

  const extintoresRequeridosDistancia = superficie > 0 ? Math.max(Math.ceil(superficie / 200), 1) : 1;

  return {
    totalKcal,
    totalMcal,
    maderaEquivKg,
    cargaFuegoKgM2,
    potencialClaseA,
    potencialClaseB,
    extintoresRequeridosDistancia
  };
};

export const FireLoadCalculatorWidget: React.FC<FireLoadCalculatorWidgetProps> = ({
  superficie,
  riesgo,
  materiales,
  className = '',
  onConclusionGenerated
}) => {
  const metrics = calcFireLoadMetrics(superficie, riesgo, materiales);

  const getRiesgoLabel = (r: string) => {
    switch (r) {
      case 'R1': return 'R1 - Explosivo';
      case 'R2': return 'R2 - Inflamable';
      case 'R3': return 'R3 - Muy Combustible';
      case 'R4': return 'R4 - Combustible';
      case 'R5': return 'R5 - Poco Combustible';
      default: return 'R4 - Combustible';
    }
  };

  const handleGenerateAiMemoria = () => {
    const memoria = `MEMORIA DESCRIPTIVA DE CARGA DE FUEGO (Dec. 351/79 Anexo VII):
- Superficie del Sector: ${superficie} m² | Clasificación de Riesgo: ${getRiesgoLabel(riesgo)}.
- Carga de Fuego Ponderada: ${metrics.cargaFuegoKgM2.toFixed(2)} kg/m² de madera equivalente (Total: ${metrics.maderaEquivKg.toFixed(1)} kg Madera / ${metrics.totalMcal.toFixed(1)} Mcal).
- Potencial Extintor Mínimo Exigido: ${metrics.potencialClaseA} para Clase A y ${metrics.potencialClaseB} para Clase B.
- Dotación de Extintores Mínima: ${metrics.extintoresRequeridosDistancia} extintor(es) de Polvo ABC de 5kg o 10kg distribuido(s) a una distancia máxima de 20 metros.`;

    if (onConclusionGenerated) onConclusionGenerated(memoria);
    toast.success('Memoria descriptiva técnica generada');
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
              Calculadora de Carga de Fuego & Potencial Extintor
              <span className="text-[10px] uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                Dec. SRT 351/79 Anexo VII
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Cálculo de masa equivalente en madera, poder calorífico ponderado y unidades extintoras.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateAiMemoria}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
        >
          <Sparkles size={16} /> Generar Memoria Técnica
        </button>
      </div>

      {/* Grid Indicadores Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Carga de Fuego Específica */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">
            Carga de Fuego (q)
          </span>
          <div className="text-2xl font-black text-white">
            {metrics.cargaFuegoKgM2.toFixed(2)} <span className="text-xs font-bold text-slate-400">kg/m²</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Madera equiv. por superficie
          </span>
        </div>

        {/* 2. Energía Calorífica Total */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            Energía Total (Q)
          </span>
          <div className="text-2xl font-black text-white">
            {metrics.totalMcal.toFixed(1)} <span className="text-xs font-bold text-slate-400">Mcal</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {metrics.maderaEquivKg.toFixed(0)} kg Madera equivalente
          </span>
        </div>

        {/* 3. Potencial Extintor Requerido */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
            Potencial Extintor Mínimo
          </span>
          <div className="text-2xl font-black text-emerald-300">
            {metrics.potencialClaseA} / {metrics.potencialClaseB}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Clase A (Sólidos) / Clase B (Líquidos)
          </span>
        </div>

        {/* 4. Dotación Mínima Extintores */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
            Dotación Extintores
          </span>
          <div className="text-2xl font-black text-blue-300">
            {metrics.extintoresRequeridosDistancia} <span className="text-xs font-bold text-slate-400">Unidades ABC</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            1 c/200 m² (Máx 20m distancia)
          </span>
        </div>
      </div>
    </div>
  );
};

export default FireLoadCalculatorWidget;
