import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, Calendar, Timer, Warning, ArrowLeft, Trash, ShareNetwork as Share2, PencilSimple, QrCode } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

export default function DrillsHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('drills_history') || '[]');
        setHistory(h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)));
    }, [syncing]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
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
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
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
                        <Siren size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.empresa}</span>
                </div>
            )
        },
        {
            header: 'Hipótesis',
            accessor: 'hipotesis',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Warning size={14} weight="fill" color="#f59e0b" /> {item.hipotesis}
                </span>
            )
        },
        {
            header: 'Tiempo',
            accessor: 'tiempoVisual',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', background: '#fef2f2', color: '#dc2626', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, width: 'fit-content' }}>
                    <Timer size={13} /> {item.tiempoVisual}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setSelectedReport(item)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                    <button onClick={() => navigate('/drills', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/drill/${item.id}?print=true`; setQrTarget({ text: url, title: `Simulacro — ${item.empresa}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                            <Trash size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            <h3>¿Eliminar acta?</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción no se puede deshacer.</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Simulacro - ${shareItem?.empresa || ''}`} text={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} rawMessage={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} elementIdToPrint="pdf-content" fileName={`Simulacro_${shareItem?.empresa || 'acta'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <DrillPdfGenerator report={shareItem} isHeadless={true} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Actas de Simulacros</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros de evacuación</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/drills')} className="btn-primary" style={{ margin: 0, padding: '0.5rem 1rem' }}>Nuevo Simulacro</button>
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por empresa o hipótesis..."
                    searchFields={['empresa', 'hipotesis']}
                    emptyMessage="No hay simulacros registrados."
                    emptyIcon={<Siren size={48} />}
                    onEmptyAction={() => navigate('/drills')}
                    emptyActionLabel="Registrar Simulacro"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
