import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Calendar, Buildings, FileText, ShareNetwork as Share2, QrCode, Trash, Plus } from '@phosphor-icons/react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function FireLoadHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const historyRaw = localStorage.getItem('fireload_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('fireload_history', JSON.stringify(updated));
        syncCollection('fireload_history', updated);
        setDeleteTarget(null);
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'createdAt',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(249,115,22,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#f97316' }}>
                        <Flame size={16} weight="fill" />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.empresa || 'Sin nombre'}</span>
                </div>
            )
        },
        {
            header: 'Sector',
            accessor: 'sector',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Buildings size={14} /> {item.sector}
                </span>
            )
        },
        {
            header: 'Carga Qf',
            accessor: 'results',
            render: (item: any) => (
                <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316' }}>{item.results?.cargaDeFuego?.toFixed(2)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Kg/m² — {item.results?.rfRequerida}</div>
                </div>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate('/fire-load', { state: { editData: item } })} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={15} /> Ver</button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`; setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><ShareNetwork as Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Carga de Fuego - ${shareItem?.sector || ''}`} text={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n🔥 Carga Qf: ${shareItem.results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF: ${shareItem.results?.rfRequerida}` : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={`Carga_Fuego_${shareItem?.sector || 'Estudio'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <FireLoadPdfGenerator data={shareItem} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><ArrowLeft size={22} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Carga de Fuego</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Estudios guardados</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/fire-load')} className="btn-primary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}>
                        <Plus size={18} /> Nuevo Cálculo
                    </button>
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por empresa o sector..."
                    searchFields={['empresa', 'sector']}
                    emptyMessage="No se encontraron estudios de carga de fuego."
                    emptyIcon={<Flame size={48} />}
                    onEmptyAction={() => navigate('/fire-load')}
                    emptyActionLabel="Generar primer Cálculo"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
