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

// Premium Stat Card component for the dashboard header
function StatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: string | number; color: string; gradient: string }) {
    return (
        <div className="training-stat-card" style={{ cursor: 'pointer' }}>
            <div className="training-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    background: gradient,
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${color}30`,
                    color: '#ffffff'
                }}>
                    {React.cloneElement(icon as React.ReactElement<any>, { color: '#ffffff', size: 20 })}
                </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </div>
        </div>
    );
}

export default function TrainingHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);
    const [shareItem, setShareItem] = useState<any>(null);
    const [selectedTraining, setSelectedTraining] = useState<any>(null);

    useDocumentTitle('Historial de Capacitaciones');

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

    // Calculations for the EHS Training Hub Dashboard
    const totalCharlas = history.length;
    const totalAsistentes = history.reduce((acc, item) => acc + (item.asistentes?.length || 0), 0);
    const totalHours = history.reduce((acc, item) => acc + (parseFloat(item.duracion) || 0), 0);
    const avgDuration = totalCharlas > 0 ? (totalHours / totalCharlas).toFixed(1) : '0';

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
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
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
                    <button onClick={() => navigate('/training-management', { state: { editData: item } })} style={{ padding: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Editar"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/training/${item.id}?print=true`; setQrTarget({ text: url, title: `Capacitación — ${item.tema}` }); })} style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.5rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar"><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '3rem' }}>
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                        <div className="glass-card" style={{ maxWidth: '360px', width: '95%', textAlign: 'center', padding: '2.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
                            <Trash size={48} style={{ color: '#ef4444', margin: '0 auto 1.5rem auto' }} />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>¿Eliminar capacitación?</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Esta acción es permanente y no se podrá deshacer.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 700 }}>Cancelar</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>Eliminar</button>
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
                    <button
                        onClick={() => navigate('/training-management')}
                        className="btn-primary"
                        style={{
                            margin: 0,
                            padding: '0.6rem 1.5rem',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(var(--color-primary-rgb), 0.3)',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        Nueva Charla
                    </button>
                </div>

                {/* EHS Training Hub Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <StatCard
                        icon={<BookOpen />}
                        label="Charlas Dictadas"
                        value={totalCharlas}
                        color="#8b5cf6"
                        gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                    />
                    <StatCard
                        icon={<Users />}
                        label="Personal Capacitado"
                        value={totalAsistentes}
                        color="#10b981"
                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    />
                    <StatCard
                        icon={<Timer />}
                        label="Horas Totales"
                        value={`${totalHours} hs`}
                        color="#f59e0b"
                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    />
                    <StatCard
                        icon={<Timer />}
                        label="Duración Promedio"
                        value={`${avgDuration} hs`}
                        color="#3b82f6"
                        gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    />
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
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
                </div>

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
