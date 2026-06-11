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
            iconEmoji="🗑️"
        />
    );
}

const typeConfig = {
    'Condición Insegura': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    'Acto Inseguro':      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    'Casi Accidente':     { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
    'Acto Seguro':        { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
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
        const updated = cards.filter(c => c.id !== deleteTarget);
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
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')} {item.time}
                </span>
            )
        },
        {
            header: 'Tipo',
            accessor: 'type',
            sortable: true,
            render: (item: any) => {
                const cfg = typeConfig[item.type] || { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
                return (
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {item.type}
                    </span>
                );
            }
        },
        {
            header: 'Descripción',
            accessor: 'description',
            render: (item: any) => (
                <span style={{ color: 'var(--color-text)', fontSize: '0.88rem', display: 'block', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                </span>
            )
        },
        {
            header: 'Ubicación',
            accessor: 'location',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                    <MapPin size={14} /> {item.location}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate('/stop-cards/new', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/stopcard/${item.id}?print=true`; setQrTarget({ text: url, title: `Tarjeta — ${item.type}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareCard(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container page-transition" style={{ paddingBottom: '4rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal open={!!shareCard} onClose={() => setShareCard(null)} title={`Tarjeta STOP - ${shareCard?.type || ''}`} text={shareCard ? `🚨 Tarjeta STOP\n🛑 Tipo: ${shareCard.type}\n📍 Ubicación: ${shareCard.location}\n📅 Fecha: ${new Date(shareCard.date).toLocaleDateString('es-AR')} ${shareCard.time}\n\n📝 Hallazgo:\n${shareCard.description}` : ''} elementIdToPrint="stop-card-pdf-content" />
                <div id="stop-card-pdf-container" style={{ position: 'fixed', left: '0', top: '0', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
                    {shareCard && <StopCardPdfGenerator card={shareCard} />}
                </div>

                <div className="no-print" style={{ marginBottom: '2rem' }}>
                    <PremiumHeader 
                        title="Tarjetas STOP"
                        subtitle="Observaciones de seguridad y actos subestándar"
                        icon={<Warning size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate('/', { state: { scrollTo: 'stop-cards' } })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            INICIO
                        </button>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => navigate('/stop-cards/new')}
                                style={{
                                    width: 'auto',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
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
                    emptyIcon={<Warning size={48} />}
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
