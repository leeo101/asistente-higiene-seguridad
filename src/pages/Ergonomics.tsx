import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

import {
  Plus, FileText, ArrowLeft,
  Accessibility, Clock, Trash2, Search, Calendar, Building2, TriangleAlert } from
'lucide-react';
import { useSync } from '../contexts/SyncContext';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

export default function Ergonomics(): React.ReactElement | null {
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('ergonomics_history');
    if (saved) setHistory(JSON.parse(saved));
  }, [syncPulse]);

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('ergonomics_history', JSON.stringify(updated));
    syncCollection('ergonomics_history', updated);
    setDeleteTarget(null);
  };

  const filteredHistory = history.
  sort((a, b) => b.id - a.id).
  filter((item) =>
  item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container max-w-[1200px] mx-auto pb-32">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <PremiumHeader
        title="Protocolo de Ergonomía"
        subtitle="Res. SRT 886/15 • Evaluación disergonómica"
        icon={<Accessibility size={36} color="#ffffff" />} />
      

            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap relative z-10">
                <div className="flex gap-[1rem] items-center">
                    <></>
                </div>
                <button
          onClick={() => navigate('/ergonomics-form')}
          style={{ backgroundColor: '#10b981', color: 'white' }}
          className="flex-none px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer border-none">
          
                    <Plus size={20} /> Nuevo Estudio
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-8">
                <Search size={20} className="absolute text-slate-400 pointer-events-none" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
          type="text"
          placeholder="Buscar por empresa, sector o puesto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '3rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
          className="w-full py-4 pr-4 rounded-2xl border-2 text-base outline-none shadow-sm focus:border-emerald-500 transition-colors" />
        
            </div>

            {/* History List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistory.length > 0 ?
        filteredHistory.map((item) =>
        <div key={item.id} className="card hover:shadow-md transition-all p-6 border flex flex-col gap-4 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                            <div className="flex justify-space-between items-start">
                                <div className="flex gap-[1rem] items-start">
                                    <div className="w-[48px] h-[48px] bg-[rgba(59,_130,_246,_0.1)] rounded-[12px] flex items-center justify-center text-[var(--color-primary)] flex-shrink-[0]">
                                        <Accessibility size={24} />
                                    </div>
                                    <div>
                                        <h3 className="m-0 text-xl font-black" style={{ color: 'var(--color-text)' }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <p className="m-0 text-sm font-bold mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            {item.puesto} · {item.sector}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm p-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
                                <Calendar size={16} /> 
                                <span className="font-semibold">{new Date(parseInt(item.id)).toLocaleDateString('es-AR')}</span>
                            </div>

                            <div className="flex justify-space-between items-center text-[0.8rem] p-[0.4rem_0] border-bottom-[1px_dashed_var(--color-border)]">
                                <span className="font-[800] text-[var(--color-text-muted)]">NIVEL DE RIESGO</span>
                                <span style={{ background: item.riesgo === 'Moderado' ? '#fef3c7' : '#d1fae5', color: item.riesgo === 'Moderado' ? '#f59e0b' : '#10b981' }} className="flex items-center gap-[0.4rem] font-[800] p-[0.2rem_0.6rem] rounded-[999px]">
                                    {item.riesgo || 'Tolerable'}
                                </span>
                            </div>

                            <div className="flex justify-space-between mt-[0.5rem] pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                                <button
              onClick={() => navigate('/ergonomics-form', { state: { editData: item } })}
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' }}
              className="hover:opacity-80 flex-[1] p-[0.6rem] rounded-[8px] font-[800] text-[0.8rem] cursor-pointer flex justify-center items-center gap-[0.5rem] transition-opacity">
              
                                    <FileText size={16} /> VER / EDITAR
                                </button>
                                <button
              onClick={() => setDeleteTarget(item.id)}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'none' }}
              title="Eliminar" className="p-[0.6rem] ml-[0.5rem] rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity flex justify-center items-center">
              
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
        ) :

        <div className="grid-column-[1_/_-1] p-[3rem] text-center rounded-[20px] border-[2px_dashed_var(--color-border)]" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <Accessibility size={48} color="var(--color-text-muted)" className="m-[0_auto] mb-[1rem] opacity-[0.5]" />
                        <h3 className="m-[0] text-[var(--color-text)]">No hay estudios registrados</h3>
                        <p className="text-[var(--color-text-muted)] text-[0.9rem]">Creá tu primer evaluación ergonómica para comenzar.</p>
                    </div>
        }
            </div>
        </div>);

}