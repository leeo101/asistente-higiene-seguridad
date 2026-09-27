import React, { useState } from 'react';
import {
  Building2, X, Plus, Check, Search, Trash2, MapPin,
  ShieldCheck, ArrowLeft
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import toast from 'react-hot-toast';

interface CompanySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanySelectorModal({
  isOpen,
  onClose
}: CompanySelectorModalProps): React.ReactElement | null {
  const {
    companies,
    activeCompanyId,
    setActiveCompanyId,
    addCompany,
    deleteCompany
  } = useCompany();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    cuit: '',
    address: '',
    establishment: '',
    activity: '',
    art: ''
  });

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.cuit && c.cuit.includes(q)) ||
      (c.establishment && c.establishment.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleSelect = (id: string | 'all') => {
    setActiveCompanyId(id);
    const comp = companies.find(c => c.id === id);
    if (id === 'all') {
      toast.success('Visualizando todas las empresas');
    } else if (comp) {
      toast.success(`Empresa activa: ${comp.name}`);
    }
    onClose();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) {
      toast.error('Ingrese la razón social o nombre de la empresa');
      return;
    }
    const created = addCompany({
      name: newCompany.name.trim(),
      cuit: newCompany.cuit.trim(),
      address: newCompany.address.trim(),
      establishment: newCompany.establishment.trim(),
      activity: newCompany.activity.trim(),
      art: newCompany.art.trim()
    });
    toast.success(`Empresa creada: ${created.name}`);
    setIsCreating(false);
    setNewCompany({ name: '', cuit: '', address: '', establishment: '', activity: '', art: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/15 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-white"
        role="dialog"
        aria-modal="true"
        style={{ background: '#0f172a', borderColor: 'rgba(255, 255, 255, 0.15)' }}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/90 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Building2 size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white m-0" style={{ color: '#ffffff' }}>
                Gestión de Empresas & Clientes
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                Seleccione la empresa activa para autocompletar formularios y métricas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10 shrink-0 ml-3"
            style={{ background: 'rgba(255, 255, 255, 0.05)', minHeight: 'auto', padding: 0 }}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toggle or Search */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-3 flex-wrap">
          {!isCreating ? (
            <>
              {/* Search Bar with dedicated Flex container (No overlapping icons) */}
              <div className="flex items-center rounded-xl bg-slate-800/90 border border-white/15 px-3 py-1 flex-1 min-w-[220px] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search size={16} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por Razón Social, CUIT, Obra..."
                  className="w-full py-1.5 bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.4rem 0' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Colorful "+ Nueva Empresa" Button */}
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/40 transition-all active:scale-95 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  minHeight: 'auto'
                }}
              >
                <Plus size={16} className="text-white" />
                <span>Nueva Empresa</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
                <Plus size={14} /> Alta de Nueva Empresa / Cliente
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: 0 }}
              >
                <ArrowLeft size={14} /> Volver a la lista
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-2.5">
          {isCreating ? (
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Siderurgia Central S.A."
                  value={newCompany.name}
                  onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full p-2.5 text-xs font-medium rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                    CUIT
                  </label>
                  <input
                    type="text"
                    placeholder="30-XXXXXXXX-X"
                    value={newCompany.cuit}
                    onChange={e => setNewCompany({ ...newCompany, cuit: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                    ART Asignada
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Provincia ART / La Segunda"
                    value={newCompany.art}
                    onChange={e => setNewCompany({ ...newCompany, art: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                    Establecimiento / Sucursal / Obra
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Planta Zárate / Obra Torre 4"
                    value={newCompany.establishment}
                    onChange={e => setNewCompany({ ...newCompany, establishment: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                    Actividad Principal / CIIU
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Metalmecánica / Construcción"
                    value={newCompany.activity}
                    onChange={e => setNewCompany({ ...newCompany, activity: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#cbd5e1' }}>
                  Dirección / Localidad / Provincia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Av. Rivadavia 1234, Morón, Buenos Aires"
                  value={newCompany.address}
                  onChange={e => setNewCompany({ ...newCompany, address: e.target.value })}
                  className="w-full p-2 text-xs rounded-xl border border-white/15 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', outline: 'none', margin: 0, padding: '0.6rem 0.8rem' }}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-white/10"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', minHeight: 'auto' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer border border-blue-400/30"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#ffffff', minHeight: 'auto' }}
                >
                  Guardar y Activar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              {/* Option: All companies */}
              <div
                onClick={() => handleSelect('all')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  activeCompanyId === 'all'
                    ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/60 border-white/10 hover:border-blue-500/40 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white m-0" style={{ color: '#ffffff' }}>
                      Todas las Empresas (Sin filtro)
                    </h4>
                    <p className="text-xs text-slate-400 m-0 mt-0.5" style={{ color: '#94a3b8' }}>
                      Muestra la totalidad de mediciones, inspecciones y vencimientos globales
                    </p>
                  </div>
                </div>
                {activeCompanyId === 'all' && (
                  <span className="p-1.5 bg-blue-600 text-white rounded-full shadow-md shadow-blue-500/40 shrink-0">
                    <Check size={14} />
                  </span>
                )}
              </div>

              {filteredCompanies.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron empresas con "${searchQuery}".
                </div>
              )}

              {filteredCompanies.map(c => {
                const isActive = activeCompanyId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-800/60 border-white/10 hover:border-blue-500/40 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)',
                          border: '1px solid rgba(96, 165, 250, 0.4)',
                          color: '#93c5fd'
                        }}
                      >
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white m-0 truncate" style={{ color: '#ffffff' }}>
                            {c.name}
                          </h4>
                          {c.cuit && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93c5fd',
                                border: '1px solid rgba(96, 165, 250, 0.3)'
                              }}
                            >
                              CUIT: {c.cuit}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs mt-1 truncate" style={{ color: '#94a3b8' }}>
                          {c.establishment && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-rose-400 shrink-0" />
                              <span>{c.establishment}</span>
                            </span>
                          )}
                          {c.art && (
                            <span className="flex items-center gap-1">
                              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                              <span>{c.art}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isActive ? (
                        <span className="p-1.5 bg-blue-600 text-white rounded-full shadow-md shadow-blue-500/40">
                          <Check size={14} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar la empresa ${c.name}?`)) {
                              deleteCompany(c.id);
                              toast.success('Empresa eliminada');
                            }
                          }}
                          className="opacity-60 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-xl transition-all border border-white/5 cursor-pointer"
                          style={{ background: 'transparent', minHeight: 'auto', padding: '0.4rem' }}
                          title="Eliminar empresa"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
