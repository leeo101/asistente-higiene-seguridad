import React, { useState, useEffect } from 'react';
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

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar tarjeta?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

const typeConfig = {
    'Condición Insegura': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    'Acto Inseguro':      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    'Casi Accidente':     { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
    'Acto Seguro':        { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export default function StopCardsHistory(): React.ReactElement | null {
    useDocumentTitle('Historial Tarjetas STOP');
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [cards, setCards] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareCard, setShareCard] = useState(null);
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();

    useEffect(() => {
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
                    <button onClick={() => navigate('/stop-cards', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><ArrowLeft size={22} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Tarjetas STOP</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Observaciones de seguridad</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/stop-cards')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Plus size={18} /> Nueva Tarjeta
                    </button>
                </div>

                <DataTable
                    data={cards}
                    columns={columns}
                    searchPlaceholder="Buscar por descripción, ubicación o tipo..."
                    searchFields={['location', 'description', 'type']}
                    emptyMessage="No hay tarjetas STOP registradas."
                    emptyIcon={<Warning size={48} />}
                    onEmptyAction={() => navigate('/stop-cards')}
                    emptyActionLabel="Crear Primera Tarjeta"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
