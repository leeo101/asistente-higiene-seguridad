import React, { useState, useEffect } from 'react';
import { 
  Volume2, ShieldCheck, ShieldAlert, AlertTriangle, Info, Zap, ChevronDown, CheckCircle2, RotateCcw
} from 'lucide-react';
import { 
  calculateAdvancedNoiseAttenuation, 
  COMMERCIAL_HEARING_PROTECTORS, 
  HearingProtectorItem, 
  DetailedNoiseAttenuationResult 
} from '../utils/hygieneCalculators';

interface HearingProtectionCalculatorProps {
  initialLeq?: number;
  exposureHours?: number;
  onChange?: (result: DetailedNoiseAttenuationResult, protectorDetails: any) => void;
  className?: string;
}

export const HearingProtectionCalculator: React.FC<HearingProtectionCalculatorProps> = ({
  initialLeq = 88,
  exposureHours = 8,
  onChange,
  className = ''
}) => {
  const [leq, setLeq] = useState<number>(initialLeq);
  const [hours, setHours] = useState<number>(exposureHours);
  const [selectedProtectorId, setSelectedProtectorId] = useState<string>('3m_1110');
  const [method, setMethod] = useState<'nrr_osha' | 'snr_iso'>('nrr_osha');
  const [customNrr, setCustomNrr] = useState<number>(29);
  const [customSnr, setCustomSnr] = useState<number>(37);
  const [isDual, setIsDual] = useState<boolean>(false);
  const [secondaryNrr, setSecondaryNrr] = useState<number>(25);

  // Update internal states if props change
  useEffect(() => {
    if (initialLeq > 0) setLeq(initialLeq);
  }, [initialLeq]);

  useEffect(() => {
    if (exposureHours > 0) setHours(exposureHours);
  }, [exposureHours]);

  const selectedItem = COMMERCIAL_HEARING_PROTECTORS.find(p => p.id === selectedProtectorId);

  const activeNrr = selectedProtectorId === 'custom' ? customNrr : (selectedItem?.nrr || 29);
  const activeSnr = selectedProtectorId === 'custom' ? customSnr : (selectedItem?.snr || 35);

  const result = calculateAdvancedNoiseAttenuation(
    leq,
    activeNrr,
    activeSnr,
    hours,
    method,
    isDual,
    secondaryNrr
  );

  useEffect(() => {
    if (onChange) {
      onChange(result, {
        protectorId: selectedProtectorId,
        brandModel: selectedProtectorId === 'custom' ? 'EPP Personalizado' : `${selectedItem?.brand} ${selectedItem?.model}`,
        activeNrr,
        activeSnr,
        isDual,
        method
      });
    }
  }, [leq, hours, selectedProtectorId, customNrr, customSnr, method, isDual, secondaryNrr]);

  const getRatingBadge = () => {
    switch (result.protectionRating) {
      case 'optima':
        return {
          label: 'PROTECCIÓN ÓPTIMA (70-79 dBA)',
          bg: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200',
          badgeBg: 'bg-emerald-500 text-slate-950',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
        };
      case 'aceptable':
        return {
          label: 'PROTECCIÓN ACEPTABLE (80-84 dBA)',
          bg: 'bg-amber-950/60 border-amber-500/60 text-amber-200',
          badgeBg: 'bg-amber-500 text-slate-950',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'insuficiente':
        return {
          label: 'PROTECCIÓN INSUFICIENTE (≥85 dBA)',
          bg: 'bg-rose-950/70 border-rose-500/70 text-rose-200',
          badgeBg: 'bg-rose-600 text-white',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />
        };
      case 'sobreproteccion':
        return {
          label: 'SOBREPROTECCIÓN AUDITIVA (<70 dBA)',
          bg: 'bg-purple-950/60 border-purple-500/60 text-purple-200',
          badgeBg: 'bg-purple-500 text-white',
          icon: <Info className="w-5 h-5 text-purple-400" />
        };
    }
  };

  const ratingBadge = getRatingBadge();

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <Volume2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 tracking-wide flex items-center gap-2">
              Calculadora de Atenuación Sonora EPP
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Res. SRT 850/12
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Evaluación del nivel efectivo de ruido en oído y dosis diaria acumulada.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lavg / Leq & Horas */}
        <div className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nivel de Ruido Continuo Equivalente - Leq dB(A)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="50"
                max="140"
                value={leq}
                onChange={(e) => setLeq(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-lg focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="range"
                min="70"
                max="120"
                step="0.5"
                value={leq}
                onChange={(e) => setLeq(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Horas de Exposición por Jornada ({hours} hs)
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
              <span>1 hs</span>
              <span>4 hs</span>
              <span>8 hs (Jornada Estándar)</span>
              <span>12 hs</span>
            </div>
          </div>
        </div>

        {/* Selección de EPP Auditivo */}
        <div className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Seleccionar Protector Auditivo (Catálogo Comercial)
            </label>
            <select
              value={selectedProtectorId}
              onChange={(e) => setSelectedProtectorId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:border-emerald-500 focus:outline-none"
            >
              {COMMERCIAL_HEARING_PROTECTORS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.model} (NRR: {p.nrr} dB / SNR: {p.snr} dB)
                </option>
              ))}
              <option value="custom">⚙️ EPP Personalizado (Manual)</option>
            </select>
          </div>

          {/* Método de Cálculo Normativo */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="text-xs font-bold text-slate-300">Norma de Cálculo:</label>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMethod('nrr_osha')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  method === 'nrr_osha' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                OSHA / Res 295 (NRR)
              </button>
              <button
                type="button"
                onClick={() => setMethod('snr_iso')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  method === 'snr_iso' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ISO 4869-2 (SNR)
              </button>
            </div>
          </div>

          {/* Opción Doble Protección */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDual}
                onChange={(e) => setIsDual(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
              />
              <span>Doble Protección (Tapón + Orejera)</span>
            </label>
            {isDual && (
              <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                NRR Combinado: {result.effectiveNrr} dB (+5 dB OSHA)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resultados Gráficos y Diagnóstico */}
      <div className={`p-5 rounded-2xl border shadow-lg space-y-4 ${ratingBadge.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            {ratingBadge.icon}
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${ratingBadge.badgeBg}`}>
              {ratingBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div>
              Ruido Inicial: <span className="text-white text-sm font-black">{leq} dBA</span>
            </div>
            <div className="text-slate-400">→</div>
            <div>
              Nivel Efectivo en Oído: <span className="text-emerald-300 text-base font-black">{result.effectiveLeq} dBA</span>
            </div>
          </div>
        </div>

        {/* Barra de Comparación de Atenuación */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>Atenuación Lograda: -{result.attenuationDb} dB(A)</span>
            <span>Dosis Diaria Acumulada: {result.noiseDosePercent}%</span>
          </div>

          <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700 relative flex">
            {/* Ruido Efectivo en Oído */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.effectiveLeq < 70 ? 'bg-purple-500' :
                result.effectiveLeq <= 79.9 ? 'bg-emerald-500' :
                result.effectiveLeq <= 84.9 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (result.effectiveLeq / 120) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
            <span>0 dBA</span>
            <span>70 dBA (Límite Confort)</span>
            <span>80 dBA (Nivel Acción)</span>
            <span>85 dBA (Límite Máximo)</span>
            <span>120 dBA</span>
          </div>
        </div>

        {/* Recomendación Normativa */}
        <div className="text-xs space-y-1 pt-2 border-t border-slate-700/50">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>📋 Diagnóstico y Recomendación (Res. SRT 850/12):</span>
          </div>
          <p className="m-0 text-slate-200 font-medium leading-relaxed">
            {result.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HearingProtectionCalculator;
