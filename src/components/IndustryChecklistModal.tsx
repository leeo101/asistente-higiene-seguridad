import React, { useState, useMemo } from 'react';
import {
  X, Search, HardHat, Wrench, Package, Tractor, Building2,
  CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, BookOpen,
  Calendar, Check, Filter, Pickaxe
} from 'lucide-react';
import {
  INDUSTRY_CHECKLISTS,
  INDUSTRY_CATEGORIES,
  IndustryChecklistTemplate
} from '../data/industryChecklists';

interface IndustryChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChecklist: (checklist: IndustryChecklistTemplate) => void;
}

export default function IndustryChecklistModal({
  isOpen,
  onClose,
  onSelectChecklist
}: IndustryChecklistModalProps): React.ReactElement | null {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<IndustryChecklistTemplate>(INDUSTRY_CHECKLISTS[0]);

  const filteredChecklists = useMemo(() => {
    return INDUSTRY_CHECKLISTS.filter(item => {
      const matchesIndustry = selectedIndustry === 'todas' || item.industry === selectedIndustry;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.normative.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.items.some(it => it.toLowerCase().includes(q));

      return matchesIndustry && matchesSearch;
    });
  }, [selectedIndustry, searchQuery]);

  // Keep activeItem valid when list changes
  React.useEffect(() => {
    if (filteredChecklists.length > 0) {
      if (!filteredChecklists.some(c => c.id === activeItem?.id)) {
        setActiveItem(filteredChecklists[0]);
      }
    }
  }, [filteredChecklists, activeItem]);

  if (!isOpen) return null;

  const getIndustryBadgeColor = (ind: string) => {
    switch (ind) {
      case 'construccion':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'metalmecanica':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'mineria':
        return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-400 dark:border-yellow-700';
      case 'logistica':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'agro':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'oficinas':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300 dark:border-violet-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'construccion': return <HardHat size={15} />;
      case 'metalmecanica': return <Wrench size={15} />;
      case 'mineria': return <Pickaxe size={15} />;
      case 'logistica': return <Package size={15} />;
      case 'agro': return <Tractor size={15} />;
      case 'oficinas': return <Building2 size={15} />;
      default: return <Filter size={15} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white m-0">
                  Catálogo de Checklists por Industria
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Normativa SRT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 m-0 font-medium hidden sm:block">
                Plantillas profesionales predefinidas conforme a Dec. 911/96, Dec. 351/79, Dec. 249/07, Dec. 617/97 y Resoluciones SRT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Industry Selector */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por equipo, tarea, riesgo o artículo normativo (ej. 'andamio', 'dec 911', 'silos', 'frenos')..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categorías por Industria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {INDUSTRY_CATEGORIES.map(cat => {
              const active = selectedIndustry === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedIndustry(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content body: 2-column on desktop */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* List panel */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[55vh] md:max-h-none p-3 space-y-2">
            {filteredChecklists.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2 opacity-70" />
                <p className="text-sm font-bold">No se encontraron checklists</p>
                <p className="text-xs text-slate-400 mt-1">Pruebe modificando el término de búsqueda o seleccionando "Todos los Sectores".</p>
              </div>
            ) : (
              filteredChecklists.map(item => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${getIndustryBadgeColor(item.industry)}`}>
                        {item.industryLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={11} /> {item.frequency}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug m-0">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 m-0">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/40 text-[10px] text-slate-500">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {item.normative}
                      </span>
                      <span className="font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {item.items.length} puntos
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail / Preview panel */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between bg-slate-50/40 dark:bg-slate-900/30">
            {activeItem ? (
              <div className="space-y-4">
                {/* Header preview */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${getIndustryBadgeColor(activeItem.industry)}`}>
                      {activeItem.industryLabel}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar size={13} className="text-blue-500" />
                      Frecuencia recomendada: {activeItem.frequency}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                    {activeItem.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 m-0 font-medium">
                    {activeItem.description}
                  </p>

                  <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60 flex items-start gap-2">
                    <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 block">
                        Marco Normativo Aplicable:
                      </span>
                      <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                        {activeItem.normative}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Puntos de Inspección ({activeItem.items.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {activeItem.criticalItems?.length || 0} ítems críticos
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                    {activeItem.items.map((pt, idx) => {
                      const isCritical = activeItem.criticalItems?.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                            isCritical
                              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                              isCritical
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 flex-1 leading-relaxed">
                            {pt}
                          </span>
                          {isCritical && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                              Crítico
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Seleccione un checklist de la lista para previsualizar sus puntos.
              </div>
            )}

            {/* Bottom action button */}
            {activeItem && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectChecklist(activeItem);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer border-none"
                >
                  <CheckCircle2 size={16} />
                  Usar este Checklist
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
