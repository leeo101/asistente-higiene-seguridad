import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Warning, ShieldCheck, MapPin, Trash, ShareNetwork as Share2, QrCode, PencilSimple } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
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

const typeConfig = {
  'Condición Insegura': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'Acto Inseguro': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'Casi Accidente': { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
  'Acto Seguro': { color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
};

export default function StopCards(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Historial Tarjetas STOP');
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const [cards, setCards] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareCard, setShareCard] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    const history = JSON.parse(localStorage.getItem('stop_cards_history') || '[]');
    setCards(history);
  }, [syncPulse]);

  const confirmDelete = () => {
    const updated = cards.filter((c) => c.id !== deleteTarget);
    localStorage.setItem('stop_cards_history', JSON.stringify(updated));
    syncCollection('stop_cards_history', updated);
    setCards(updated);
    setDeleteTarget(null);
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'date',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')} {item.time}
                </span>

  },
  {
    header: 'Tipo',
    accessor: 'type',
    sortable: true,
    render: (item: any) => {
      const cfg = typeConfig[item.type] || { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
      return (
        <span style={{ background: cfg.bg, color: cfg.color }} className="p-[0.25rem_0.7rem] rounded-[999px] text-[0.72rem] font-[800] white-space-[nowrap]">
                        {item.type}
                    </span>);

    }
  },
  {
    header: 'Descripción',
    accessor: 'description',
    render: (item: any) =>
    <span className="text-[var(--color-text)] text-[0.88rem] block max-w-[250px] overflow-[hidden] text-overflow-[ellipsis] white-space-[nowrap]">
                    {item.description}
                </span>

  },
  {
    header: 'Ubicación',
    accessor: 'location',
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)]">
                    <MapPin size={14} /> {item.location}
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => navigate('/stop-cards/new', { state: { editData: item } })} title="Editar" className="p-[0.4rem] bg-[rgba(59,130,246,0.08)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] text-[#3b82f6] cursor-pointer"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/stopcard/${item.id}?print=true`;setQrTarget({ text: url, title: `Tarjeta — ${item.type}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareCard(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash size={15} /></button>
                </div>

  }];


  return (
    <AnimatedPage>
            <div className="container page-transition pb-16">
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal open={!!shareCard} onClose={() => setShareCard(null)} title={`Tarjeta STOP - ${shareCard?.type || ''}`} text={shareCard ? `🚨 Tarjeta STOP\n🛑 Tipo: ${shareCard.type}\n📍 Ubicación: ${shareCard.location}\n📅 Fecha: ${new Date(shareCard.date).toLocaleDateString('es-AR')} ${shareCard.time}\n\n📝 Hallazgo:\n${shareCard.description}` : ''} elementIdToPrint="stop-card-pdf-content" />
                <div id="stop-card-pdf-container" style={{ zIndex: -9999 }} className="fixed left-[0] top-[0] opacity-[0] pointer-events-[none]">
                    {shareCard && <StopCardPdfGenerator card={shareCard} />}
                </div>

                <div className="no-print mb-8">
                    <PremiumHeader
            title="Tarjetas STOP"
            subtitle="Observaciones de seguridad y actos subestándar"
            icon={<Warning size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                    <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
                        <></>
                        <div className="flex gap-3 flex-wrap">
                            <button
                onClick={() => navigate('/stop-cards/new')}
                className="btn-primary w-auto m-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all border-none hover:shadow-lg">
                
                                <Plus size={20} weight="bold" />
                                Nueva Tarjeta STOP
                            </button>
                        </div>
                    </div>
                </div>

                <DataTable
          data={cards}
          columns={columns}
          searchPlaceholder="Buscar por descripción, ubicación o tipo..."
          searchFields={['location', 'description', 'type']}
          emptyMessage="No hay tarjetas STOP registradas."
          emptyIcon={<Warning size={48} />} />
        

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>);

}