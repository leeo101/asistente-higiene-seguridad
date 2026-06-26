import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Calendar, FileText, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

export default function EvacuationSimulatorHistory(): React.ReactElement | null {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [simulations, setSimulations] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
    setSimulations(saved);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = simulations.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
      setSimulations(updated);
      toast.success('Simulación eliminada');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const handleEdit = (form: any) => {
    navigate('/evacuation-form', { state: { editData: form } });
  };

  const filteredSimulations = simulations.filter((p: any) =>
  p.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.evaluator?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingTop: isMobile ? '7.5rem' : '6.5rem' }} className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem]">
            <main className="p-[0rem_1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="no-print mb-8">
                    <PremiumHeader
            title="Simulador de Evacuación"
            subtitle="Historial de simulaciones teóricas"
            icon={<Timer size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                    <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                        <></>
                        <div className="flex gap-[0.75rem] flex-wrap">
                            <button
                onClick={() => navigate('/evacuation-form')} className="w-[auto] m-[0] flex items-center gap-[0.5rem] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#10b981_0%,_#059669_100%)] text-[#ffffff] border-none rounded-[8px] font-[700] cursor-pointer box-shadow-[0_4px_15px_rgba(16,_185,_129,_0.3)] transition-[all_0.2s_ease]">
















                
                                <Plus size={20} strokeWidth={3} />
                                Nueva Simulación
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative mb-[2rem] max-w-[400px]">
                    <Search size={20} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                    <input
            type="text"
            placeholder="Buscar por sector o evaluador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.8rem_1rem_0.8rem_2.8rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] box-sizing-[border-box]" />









          
                </div>

                <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(300px,_1fr))] gap-[1.5rem]">
                    {filteredSimulations.length === 0 ?
          <div className="grid-column-[1_/_-1] text-center p-[4rem_2rem] bg-[var(--color-surface)] rounded-[var(--radius-xl)] border-[1px_dashed_var(--color-border)]">
                            <Timer size={48} className="text-[var(--color-text-light)] mb-[1rem]" />
                            <h3 className="m-[0_0_0.5rem_0]">No hay simulaciones</h3>
                            <p className="m-[0] text-[var(--color-text-muted)]">Realice la primera simulación teórica de evacuación.</p>
                        </div> :

          filteredSimulations.map((form: any) =>
          <div
            key={form.id}
            onClick={() => handleEdit(form)}
            className="card hover-lift cursor-pointer p-[1.5rem] relative">





            
                                <div className="flex justify-space-between items-start mb-[1rem]">
                                    <div>
                                        <h3 className="m-[0_0_0.25rem_0] text-[1.2rem] font-[900] uppercase">{form.sector}</h3>
                                        <span className="text-[0.8rem] text-[var(--color-text-muted)] flex items-center gap-[0.25rem]">
                                            <Calendar size={14} /> {new Date(form.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className="bg-[#f0fdf4] text-[#16a34a] p-[0.3rem_0.6rem] rounded-[6px] text-[0.85rem] font-[900] flex items-center gap-[0.25rem]">









                
                                        <Timer size={14} />
                                        {form.calculatedTime}s
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-[0.5rem] mb-[1.5rem]">
                                    <div className="flex justify-space-between text-[0.9rem]">
                                        <span className="text-[var(--color-text-muted)]">Población (N):</span>
                                        <span className="font-[600]">{form.peopleCount} pers.</span>
                                    </div>
                                    <div className="flex justify-space-between text-[0.9rem]">
                                        <span className="text-[var(--color-text-muted)]">Ancho Salidas (A):</span>
                                        <span className="font-[600]">{form.exitWidth}m</span>
                                    </div>
                                    <div className="flex justify-space-between text-[0.9rem]">
                                        <span className="text-[var(--color-text-muted)]">Evaluador:</span>
                                        <span className="font-[600]">{form.evaluator}</span>
                                    </div>
                                </div>

                                <div className="flex justify-space-between items-center pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                                    <span className="text-[0.8rem] text-[var(--color-primary)] font-[600] flex items-center gap-[0.25rem]">
                                        <FileText size={14} /> Ver Reporte
                                    </span>
                                    <button
                onClick={(e) => handleDelete(form.id, e)}







                title="Eliminar" className="bg-[transparent] border-none text-[var(--color-text-light)] cursor-pointer p-[0.5rem]">
                
                                        <Trash2 size={18} />
                        </button>
                                </div>
                            </div>
          )
          }
                </div>
            </main>

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar simulación?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}