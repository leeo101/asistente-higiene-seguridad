import React, { useState, useEffect } from 'react';
import { 
  GitBranch, HelpCircle, User, Wrench, Package, Ruler, CloudSun, 
  CheckCircle2, Plus, Trash2, ArrowRight, Sparkles, AlertCircle, FileText
} from 'lucide-react';

export interface IshikawaData {
  manpower: string[];
  methodology: string[];
  machinery: string[];
  materials: string[];
  measurement: string[];
  environment: string[];
}

export interface RootCauseData {
  method: '5why' | 'ishikawa' | 'both';
  whys: string[];
  ishikawa: IshikawaData;
  rootCauseSummary: string;
}

interface RootCauseAnalyzerProps {
  initialData?: Partial<RootCauseData>;
  problemStatement?: string;
  onChange?: (data: RootCauseData) => void;
  className?: string;
}

export const RootCauseAnalyzer: React.FC<RootCauseAnalyzerProps> = ({
  initialData,
  problemStatement = '',
  onChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'5why' | 'ishikawa' | 'summary'>('5why');

  const [whys, setWhys] = useState<string[]>(
    initialData?.whys && initialData.whys.length >= 5 
      ? initialData.whys 
      : ['', '', '', '', '']
  );

  const [ishikawa, setIshikawa] = useState<IshikawaData>(
    initialData?.ishikawa || {
      manpower: [],
      methodology: [],
      machinery: [],
      materials: [],
      measurement: [],
      environment: []
    }
  );

  const [summary, setSummary] = useState<string>(initialData?.rootCauseSummary || '');

  // Active inputs for adding new tags to Ishikawa categories
  const [inputs, setInputs] = useState<{ [key in keyof IshikawaData]: string }>({
    manpower: '',
    methodology: '',
    machinery: '',
    materials: '',
    measurement: '',
    environment: ''
  });

  const handleWhyChange = (index: number, val: string) => {
    const updated = [...whys];
    updated[index] = val;
    setWhys(updated);
  };

  const handleAddIshikawaItem = (category: keyof IshikawaData) => {
    const text = inputs[category]?.trim();
    if (!text) return;
    setIshikawa(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), text]
    }));
    setInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveIshikawaItem = (category: keyof IshikawaData, index: number) => {
    setIshikawa(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index)
    }));
  };

  // Generate automated root cause summary if empty
  const generateAutoSummary = () => {
    const filledWhys = whys.filter(w => w.trim().length > 0);
    const lastWhy = filledWhys.length > 0 ? filledWhys[filledWhys.length - 1] : '';

    const ishikawaItemsCount = Object.values(ishikawa).reduce((acc, curr) => acc + curr.length, 0);

    let generatedText = '';

    if (lastWhy) {
      generatedText += `Causa Raíz Principal (5 Porqués): ${lastWhy}. `;
    }

    if (ishikawaItemsCount > 0) {
      const factors: string[] = [];
      if (ishikawa.manpower.length > 0) factors.push(`Personal (${ishikawa.manpower.join(', ')})`);
      if (ishikawa.methodology.length > 0) factors.push(`Método (${ishikawa.methodology.join(', ')})`);
      if (ishikawa.machinery.length > 0) factors.push(`Maquinaria/Equipos (${ishikawa.machinery.join(', ')})`);
      if (ishikawa.materials.length > 0) factors.push(`Materiales (${ishikawa.materials.join(', ')})`);
      if (ishikawa.environment.length > 0) factors.push(`Entorno (${ishikawa.environment.join(', ')})`);
      
      generatedText += `Factores Contribuyentes Identificados (Ishikawa): ${factors.join('; ')}.`;
    }

    setSummary(generatedText.trim() || 'No se registraron datos de causa raíz.');
  };

  useEffect(() => {
    if (onChange) {
      onChange({
        method: activeTab === 'ishikawa' ? 'ishikawa' : '5why',
        whys,
        ishikawa,
        rootCauseSummary: summary
      });
    }
  }, [whys, ishikawa, summary, activeTab]);

  const ishikawaCategories: { key: keyof IshikawaData; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: 'manpower', label: '1. Mano de Obra (Personal)', icon: <User size={18} />, color: '#3b82f6', bg: 'bg-blue-950/40 border-blue-800/40' },
    { key: 'methodology', label: '2. Método (Procedimientos)', icon: <GitBranch size={18} />, color: '#10b981', bg: 'bg-emerald-950/40 border-emerald-800/40' },
    { key: 'machinery', label: '3. Maquinaria (Equipos/EPP)', icon: <Wrench size={18} />, color: '#f59e0b', bg: 'bg-amber-950/40 border-amber-800/40' },
    { key: 'materials', label: '4. Materiales (Insumos)', icon: <Package size={18} />, color: '#8b5cf6', bg: 'bg-purple-950/40 border-purple-800/40' },
    { key: 'measurement', label: '5. Medición (Inspección)', icon: <Ruler size={18} />, color: '#ec4899', bg: 'bg-pink-950/40 border-pink-800/40' },
    { key: 'environment', label: '6. Medio Ambiente (Entorno)', icon: <CloudSun size={18} />, color: '#06b6d4', bg: 'bg-cyan-950/40 border-cyan-800/40' }
  ];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <GitBranch size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white m-0 tracking-wide flex items-center gap-2">
              Asistente Visual de Análisis Causa Raíz (RCA)
              <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                5 Porqués & Ishikawa 6M
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Identificación metódica de causas fundamentales para prevención de recurrencias.
            </p>
          </div>
        </div>

        {/* Pestañas de Selección */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('5why')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === '5why' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle size={14} /> 5 Porqués
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ishikawa')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'ishikawa' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch size={14} /> Diagrama Ishikawa (6M)
          </button>

          <button
            type="button"
            onClick={() => {
              generateAutoSummary();
              setActiveTab('summary');
            }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> Conclusión Causal
          </button>
        </div>
      </div>

      {problemStatement && (
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-200">Problema u Incidente Analizado:</span> {problemStatement}
          </div>
        </div>
      )}

      {/* Pestaña 1: Metodología 5 Porqués */}
      {activeTab === '5why' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-semibold mb-2">
            Profundice en la secuencia de causas realizando la pregunta "¿Por qué?" hasta llegar a la falla raíz de gestión o control:
          </div>

          <div className="space-y-3">
            {whys.map((whyText, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {idx + 1}º
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={whyText}
                    onChange={(e) => handleWhyChange(idx, e.target.value)}
                    placeholder={
                      idx === 0 ? '1. ¿Por qué ocurrió el hecho directo?' :
                      idx === 1 ? '2. ¿Por qué ocurrió la condición anterior?' :
                      idx === 2 ? '3. ¿Por qué falló el control o barrera?' :
                      idx === 3 ? '4. ¿Por qué no se detectó o previno previamente?' :
                      '5. Causa Raíz Fundamental de Gestión / Sistema'
                    }
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                {idx < 4 && <ArrowRight size={14} className="text-slate-600 shrink-0 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña 2: Diagrama de Ishikawa (6 Ms) */}
      {activeTab === 'ishikawa' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-semibold">
            Categorice las causas contribuyentes clasificándolas según las 6 M de Higiene y Seguridad:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ishikawaCategories.map((cat) => (
              <div key={cat.key} className={`p-4 rounded-2xl border ${cat.bg} space-y-3`}>
                <div className="flex items-center gap-2 text-sm font-black text-slate-200">
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>

                {/* Chips de causas añadidas */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {(ishikawa[cat.key] || []).map((item, itemIdx) => (
                    <span
                      key={itemIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveIshikawaItem(cat.key, itemIdx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Input para agregar causa */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={inputs[cat.key]}
                    onChange={(e) => setInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIshikawaItem(cat.key);
                      }
                    }}
                    placeholder="Agregar causa..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddIshikawaItem(cat.key)}
                    className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña 3: Conclusión Causal Consolidada */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300">
              Conclusión Final de Causa Raíz (Para Informe Oficial y CAPA)
            </label>
            <button
              type="button"
              onClick={generateAutoSummary}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40 cursor-pointer"
            >
              <Sparkles size={12} /> Auto-Generar desde 5Porqués e Ishikawa
            </button>
          </div>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[120px]"
            placeholder="Describa la causa raíz consolidada y las fallas de control identificadas..."
          />
        </div>
      )}
    </div>
  );
};

export default RootCauseAnalyzer;
