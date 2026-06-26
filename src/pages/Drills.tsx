import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, Calendar, Timer, Warning, ArrowLeft, Trash, ShareNetwork as Share2, PencilSimple, QrCode, Plus } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';

export default function DrillsHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = JSON.parse(localStorage.getItem('drills_history') || '[]');
    setHistory(h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)));
  }, [syncing]);

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('drills_history', JSON.stringify(updated));
    syncCollection('drills_history', updated);
    setDeleteTarget(null);
  };

  if (selectedReport) {
    return <DrillPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                        <Siren size={16} />
                    </div>
                    <span className="font-bold">{item.empresa}</span>
                </div>

  },
  {
    header: 'Hipótesis',
    accessor: 'hipotesis',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5">
                    <Warning size={14} weight="fill" color="#f59e0b" /> {item.hipotesis}
                </span>

  },
  {
    header: 'Tiempo',
    accessor: 'tiempoVisual',
    render: (item: any) =>
    <span className="flex items-center gap-1.5 py-1 px-2.5 bg-red-50 text-red-600 rounded-full text-xs font-extrabold w-fit">
                    <Timer size={13} /> {item.tiempoVisual}
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-1.5">
                    <button onClick={() => setSelectedReport(item)} className="p-[0.4rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text)]">Ver</button>
                    <button onClick={() => navigate('/drills/new', { state: { editData: item } })} title="Editar" className="p-[0.4rem] bg-[rgba(59,130,246,0.08)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] text-[#3b82f6] cursor-pointer"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/drill/${item.id}?print=true`;setQrTarget({ text: url, title: `Simulacro — ${item.empresa}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash size={15} /></button>
                </div>

  }];


  return (
    <AnimatedPage>
            <div className="container max-w-[900px] mx-auto pb-20 w-full">
                {deleteTarget &&
        <div className="fixed inset-[0] bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center backdrop-filter-[blur(4px)]">
                        <div className="card max-w-[320px] text-center p-[2rem]">
                            <Trash size={48} className="text-[#ef4444] mb-[1rem]" />
                            <h3>¿Eliminar acta?</h3>
                            <p className="text-[0.9rem] text-[var(--color-text-muted)]">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-[1rem] mt-[1.5rem]">
                                <button onClick={() => setDeleteTarget(null)} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[var(--color-background)] border-none cursor-pointer">Cancelar</button>
                                <button onClick={confirmDelete} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[#ef4444] text-[white] border-none cursor-pointer">Eliminar</button>
                            </div>
                        </div>
                    </div>
        }
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Simulacro - ${shareItem?.empresa || ''}`} text={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} rawMessage={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} elementIdToPrint="pdf-content" fileName={`Simulacro_${shareItem?.empresa || 'acta'}.pdf`} />
                <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {shareItem && <DrillPdfGenerator report={shareItem} isHeadless={true} />}
                </div>

                {/* Header Premium */}
                <div className="no-print mb-8">
                    <PremiumHeader
            title="Actas de Simulacros"
            subtitle="Registros de evacuación"
            icon={<Siren size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                    <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
                        <></>
                        <div className="flex gap-3 flex-wrap">
                            <button
                onClick={() => navigate('/drills/new')}
                className="w-auto m-0 flex items-center gap-2 py-3 px-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl font-bold cursor-pointer shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
                
                                <Plus size={20} weight="bold" />
                                Nuevo Simulacro
                            </button>
                        </div>
                    </div>
                </div>

                <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Buscar por empresa o hipótesis..."
          searchFields={['empresa', 'hipotesis']}
          emptyMessage="No hay simulacros registrados."
          emptyIcon={<Siren size={48} />} />
        

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>);

}