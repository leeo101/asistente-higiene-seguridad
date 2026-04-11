import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Timer, Users, PencilSimple, Trash, ShareNetwork as Share2, ArrowLeft, QrCode } from '@phosphor-icons/react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

export default function TrainingHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('training_history');
            if (raw && raw !== 'undefined') {
                const h = JSON.parse(raw);
                setHistory(Array.isArray(h) ? h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)) : []);
            } else {
                setHistory([]);
            }
        } catch (e) {
            setHistory([]);
        }
    }, [syncing]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('training_history', JSON.stringify(updated));
        syncCollection('training_history', updated);
        setDeleteTarget(null);
    };

    if (selectedTraining) {
        return <TrainingPdfGenerator data={selectedTraining} onBack={() => setSelectedTraining(null)} />;
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
            header: 'Tema',
            accessor: 'tema',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                        <BookOpen size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.tema}</span>
                </div>
            )
        },
        {
            header: 'Expositor',
            accessor: 'expositor',
            sortable: true,
            render: (item: any) => <span style={{ color: 'var(--color-text-muted)' }}>{item.expositor || '—'}</span>
        },
        {
            header: 'Asistentes',
            accessor: 'asistentes',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, width: 'fit-content' }}>
                    <Users size={13} /> {item.asistentes?.length || 0}
                </span>
            )
        },
        {
            header: 'Duración',
            accessor: 'duracion',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <Timer size={14} /> {item.duracion} hs
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setSelectedTraining(item)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                    <button onClick={() => navigate('/training-management', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/training/${item.id}?print=true`; setQrTarget({ text: url, title: `Capacitación — ${item.tema}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '3rem' }}>
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                            <Trash size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            <h3>¿Eliminar capacitación?</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Capacitación - ${shareItem?.tema || ''}`} text={shareItem ? `📊 Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes?.length}` : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={`Capacitacion_${shareItem?.tema || 'registro'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <TrainingPdfGenerator data={shareItem} isHeadless={true} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Capacitaciones Dictadas</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros de formación</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/training-management')} className="btn-primary" style={{ margin: 0, padding: '0.5rem 1rem' }}>Nueva Charla</button>
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por tema, expositor o empresa..."
                    searchFields={['tema', 'expositor', 'empresa']}
                    emptyMessage="No hay capacitaciones registradas."
                    emptyIcon={<BookOpen size={48} />}
                    onEmptyAction={() => navigate('/training-management')}
                    emptyActionLabel="Nueva Charla"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
