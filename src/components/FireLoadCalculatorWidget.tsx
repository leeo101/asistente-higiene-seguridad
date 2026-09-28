import React from 'react';
import { 
  Flame, ShieldAlert, ShieldCheck, Zap, Sparkles, Building2, 
  Layers, Calculator, CheckCircle2, AlertTriangle, FileText, Droplets
} from 'lucide-react';
import toast from 'react-hot-toast';
import { evaluateFullFireLoadProtocol } from '../utils/srtProtocols';
import type { FireRiskLevel, FireVentilationType } from '../types/fireload';

export interface FireMaterialItem {
  nombre: string;
  peso: number; // kg
  poderCalorifico: number; // kcal/kg
}

interface FireLoadCalculatorWidgetProps {
  superficie: number; // m2
  riesgo: FireRiskLevel;
  materiales: FireMaterialItem[];
  ventilacion?: FireVentilationType;
  className?: string;
  onConclusionGenerated?: (conclusion: string) => void;
}

export const calcFireLoadMetrics = (
  superficie: number, 
  riesgo: string, 
  materiales: FireMaterialItem[], 
  ventilacion: FireVentilationType = 'natural'
) => {
  const evaluated = evaluateFullFireLoadProtocol({
    superficie: Math.max(Number(superficie) || 1, 1),
    riesgo: (riesgo || 'R4') as FireRiskLevel,
    ventilacion,
    materiales
  });

  return {
    totalKcal: evaluated.cargaTermicaTotalKcal,
    totalMcal: evaluated.cargaTermicaTotalMcal,
    totalMJ: evaluated.cargaTermicaTotalMJ,
    maderaEquivKg: evaluated.maderaEquivalenteKg,
    cargaFuegoKgM2: evaluated.cargaFuegoKgM2,
    resistenciaFuegoRequerida: evaluated.resistenciaFuegoRequerida,
    potencialClaseA: evaluated.potencialExtintorClaseA,
    potencialClaseB: evaluated.potencialExtintorClaseB,
    potencialExtintorNominal: evaluated.potencialExtintorNominal,
    extintoresRequeridosDistancia: evaluated.minExtintores,
    distanciaMaximaRecorridoMetros: evaluated.distanciaMaximaRecorridoMetros,
    requiereRedHidrantes: evaluated.requiereRedHidrantes,
    requiereRociadoresAutomaticos: evaluated.requiereRociadoresAutomaticos
  };
};

export const FireLoadCalculatorWidget: React.FC<FireLoadCalculatorWidgetProps> = ({
  superficie,
  riesgo,
  materiales,
  ventilacion = 'natural',
  className = '',
  onConclusionGenerated
}) => {
  const metrics = calcFireLoadMetrics(superficie, riesgo, materiales, ventilacion);

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

  const tablaAplicable = ventilacion === 'natural' ? 'Tabla 2.2.1' : 'Tabla 2.2.2';

  const handleGenerateAiMemoria = () => {
    const memoria = `MEMORIA TÉCNICA Y CONCLUSIÓN (Decreto PEN 351/79 Anexo VII):
- Superficie del Sector: ${superficie} m² | Clasificación de Riesgo: ${getRiesgoLabel(riesgo)}.
- Ventilación: ${ventilacion === 'natural' ? 'Ventilación natural adecuada (≥ 1/30 S)' : 'Sin ventilación natural / Subsuelo'}.
- Carga de Fuego Ponderada: ${metrics.cargaFuegoKgM2.toFixed(2)} kg/m² de madera equivalente (Total: ${metrics.maderaEquivKg.toFixed(1)} kg Madera / ${metrics.totalMcal.toFixed(1)} Mcal).
- Resistencia Estructural Exigida a Muros: ${metrics.resistenciaFuegoRequerida} (${tablaAplicable} Anexo VII).
- Potencial Extintor Mínimo Exigido: ${metrics.potencialExtintorNominal} (Clase A: ${metrics.potencialClaseA} / Clase B: ${metrics.potencialClaseB}).
- Dotación de Extintores Mínima: ${metrics.extintoresRequeridosDistancia} extintor(es) de Polvo Químico Seco (PQS) ABC de 5 kg o 10 kg distribuidos a no más de ${metrics.distanciaMaximaRecorridoMetros} metros.
${metrics.requiereRedHidrantes ? '- Condición E1: Por dimensiones y riesgo, se exige instalación de Red de Hidrantes con reserva exclusiva.' : ''}
${metrics.requiereRociadoresAutomaticos ? '- Condición E2: Por densidad de carga de fuego en gran superficie, se exige instalación de rociadores automáticos (Sprinklers).' : ''}`;

    if (onConclusionGenerated) onConclusionGenerated(memoria.trim());
    toast.success('Memoria técnica generada con datos oficiales');
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
                Dec. 351/79 Anexo VII • IRAM 3517-2
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Cálculo de madera equivalente, poder calorífico ponderado, resistencia estructural y dotación de extinción.
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
            Carga de Fuego (Qf)
          </span>
          <div className="text-2xl font-black text-white">
            {metrics.cargaFuegoKgM2.toFixed(2)} <span className="text-xs font-bold text-slate-400">kg/m²</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {metrics.maderaEquivKg.toFixed(1)} kg Madera patrón
          </span>
        </div>

        {/* 2. Resistencia al Fuego Muros */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            Resistencia Muros (F)
          </span>
          <div className="text-2xl font-black text-amber-300">
            {metrics.resistenciaFuegoRequerida}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {tablaAplicable} (Minutos)
          </span>
        </div>

        {/* 3. Potencial Extintor Requerido */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
            Potencial Mínimo
          </span>
          <div className="text-2xl font-black text-emerald-300">
            {metrics.potencialExtintorNominal}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Clase A ({metrics.potencialClaseA}) / B ({metrics.potencialClaseB})
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
            1 c/200 m² (Mín. 2 • Máx {metrics.distanciaMaximaRecorridoMetros}m)
          </span>
        </div>
      </div>

      {/* Alertas Rápidas de Condiciones Especiales */}
      {(metrics.requiereRedHidrantes || metrics.requiereRociadoresAutomaticos) && (
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {metrics.requiereRedHidrantes && (
            <div className="flex-1 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <Droplets size={16} className="text-red-400 shrink-0" />
              <span><strong>Condición E1 Exigida:</strong> Requiere Red de Hidrantes presurizada.</span>
            </div>
          )}
          {metrics.requiereRociadoresAutomaticos && (
            <div className="flex-1 p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-center gap-2.5 text-xs text-purple-300">
              <AlertTriangle size={16} className="text-purple-400 shrink-0" />
              <span><strong>Condición E2 Exigida:</strong> Requiere sistema de rociadores automáticos (Sprinklers).</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FireLoadCalculatorWidget;
