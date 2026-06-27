import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Map as MapIcon, Calendar, ChevronRight, Trash2, Share2, Edit2, QrCode, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';

export default function RiskMapHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Historial de Mapas de Riesgo');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();

  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMap, setSelectedMap] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = JSON.parse(localStorage.getItem('risk_map_history') || '[]');
    setHistory(h.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [syncing]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('risk_map_history', JSON.stringify(updated));
    syncCollection('risk_map_history', updated);
    setDeleteTarget(null);
  };

  const filteredHistory = history.filter((item) => {
    const searchStr = `${item.empresa} ${item.sector}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  if (selectedMap) {
    return <RiskMapPdfGenerator data={selectedMap} onBack={() => setSelectedMap(null)} />;
  }

  return (
    <AnimatedPage>
        <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {deleteTarget &&
        <div className="fixed inset-[0] bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center backdrop-filter-[blur(4px)]">
                    <div className="card max-w-[320px] text-center p-[2rem]">
                        <Trash2 size={48} className="text-[#ef4444] mb-[1rem]" />
                        <h3>¿Eliminar mapa?</h3>
                        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Esta acción borrará definitivamente el mapa de {history.find((h) => h.id === deleteTarget)?.empresa}.</p>
                        <div className="flex gap-[1rem] mt-[1.5rem]">
                            <button onClick={() => setDeleteTarget(null)} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[var(--color-background)] border-none text-[var(--color-text)]">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[#ef4444] text-[white] border-none">Eliminar</button>
                        </div>
                    </div>
                </div>
        }

            <ShareModal
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Mapa de Riesgo - ${shareItem?.empresa || ''}`}
          text={shareItem ? `🗺️ Mapa de Riesgos ISO\n🏢 Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n📅 Fecha: ${shareItem.fecha}` : ''}
          elementIdToPrint="pdf-content" />
        

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                {shareItem && <RiskMapPdfGenerator data={shareItem} />}
            </div>

            <PremiumHeader
          title="Mapas de Riesgos"
          subtitle="Croquis e Identificación ISO"
          icon={<MapIcon size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

            <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem] flex-wrap">
                <></>
            </div>

            <div className="mb-[2rem] flex justify-start">
                <button
            onClick={() => {
              requirePro(() => navigate('/risk-maps'));
            }}






            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'} className="p-[0.75rem_1.5rem] bg-[#10b981] text-[#fff] border-none rounded-[14px] font-[800] text-[0.9rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-[all_0.2s]">
            
                <Plus size={18} /> Nuevo Mapa
                </button>
            </div>

            <div className="relative mb-[2rem]">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
            type="text"
            placeholder="Buscar por empresa o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-3 pr-4 pl-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />






          
            </div>

            <div className="flex flex-col gap-4">
                {filteredHistory.map((map) =>
          <div key={map.id} className="card p-[1.25rem] cursor-pointer" style={{ borderLeft: `6px solid #8b5cf6` }}
          onClick={() => setSelectedMap(map)}>
                        <div className="flex items-center gap-4">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] flex items-center justify-center flex-shrink-[0]">
                                <MapIcon size={24} />
                            </div>
                            <div className="flex-[1] min-width-[0]">
                                <div className="flex justify-space-between items-center">
                                    <h3 className="m-[0] text-[1.1rem] font-[800] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                                        {map.empresa}
                                    </h3>
                                    <span className="text-[0.85rem] font-[800] text-[var(--color-primary)]">
                                        {map.elements.length} Elementos
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-[1rem] mt-[0.5rem] text-[0.85rem] text-[var(--color-text-muted)]">
                                    <span className="flex items-center gap-[0.3rem]"><Calendar size={14} /> {new Date(map.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}</span>
                                    <span><strong>Sector:</strong> {map.sector}</span>
                                </div>
                            </div>
                            <ChevronRight className="hidden sm:block text-[var(--color-border)] flex-shrink-[0]" />
                        </div>

                        <div className="mt-[1rem] pt-[1rem] border-top-[1px_solid_var(--color-border)] flex justify-end gap-[0.8rem]">
                            <button
                onClick={(e) => {
                  e.stopPropagation();
                  requirePro(() => setShareItem(map));
                }} className="p-[0.5rem] rounded-[8px] bg-[#dcfce7] text-[#16a34a] border-[1px_solid_#86efac] flex items-center gap-[0.3rem] text-[0.8rem] font-[700]">

                
                                <Share2 size={16} /> Compartir
                            </button>
                            <button
                onClick={(e) => {
                  e.stopPropagation();
                  requirePro(() => {
                    const url = `${window.location.origin}/v/${currentUser?.uid}/riskmap/${map.id}?print=true`;
                    setQrTarget({ text: url, title: `Mapa de Riesgos — ${map.sector}` });
                  });
                }}

                title="Generar QR" className="p-[0.5rem] rounded-[8px] bg-[rgba(139,92,246,0.06)] border-[1px_solid_rgba(139,92,246,0.18)] text-[#8b5cf6] cursor-pointer flex items-center justify-center">
                
                                <QrCode size={16} />
                            </button>
                            <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/risk-maps', { state: { editData: map } });
                }} className="p-[0.5rem] rounded-[8px] bg-[#eff6ff] text-[#3b82f6] border-[1px_solid_#bfdbfe] flex items-center gap-[0.3rem] text-[0.8rem] font-[700]">

                
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                onClick={(e) => handleDelete(map.id, e)} className="p-[0.5rem] rounded-[8px] bg-[rgba(239,_68,_68,_0.05)] text-[#ef4444] border-[1px_solid_rgba(239,_68,_68,_0.2)]">

                
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
          )}

                {filteredHistory.length === 0 &&
          <div className="text-center p-[4rem_1rem] bg-[var(--color-surface)] rounded-[24px] border-[1.5px_dashed_var(--color-border)]">
                        <MapIcon size={48} className="text-[var(--color-border)] mb-[1rem] opacity-[0.5]" />
                        <h3 className="m-[0_0_0.5rem_0] text-[var(--color-text)]">No hay mapas registrados</h3>
                        <p className="m-[0] text-[var(--color-text-muted)] text-[0.9rem]">
                            {searchTerm ? 'Ningún mapa coincide con la búsqueda.' : 'Tus croquis y mapas de riesgo ISO aparecerán aquí.'}
                        </p>
                    </div>
          }
            </div>
            {qrTarget &&
        <QRModal
          text={qrTarget.text}
          title={qrTarget.title}
          onClose={() => setQrTarget(null)} />

        }
        </div>
        </AnimatedPage>);

}