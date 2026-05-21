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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: '1rem', display: 'inline-block', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text)' }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
                    Esta acción no se puede deshacer y el registro se eliminará de todo el historial.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button 
                        onClick={onCancel} 
                        style={{ 
                            flex: 1, 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--glass-border-subtle)', 
                            cursor: 'pointer', 
                            fontWeight: 800,
                            color: 'var(--color-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={{ 
                            flex: 1, 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontWeight: 800, 
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Eliminar
                    </button>
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Calendar size={15} /> {new Date(item.createdAt).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(249,115,22,0.1)', padding: '0.5rem', borderRadius: '10px', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={18} weight="fill" />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{item.empresa || 'Sin nombre'}</span>
                </div>
            )
        },
        {
            header: 'Sector',
            accessor: 'sector',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    <Buildings size={16} /> {item.sector}
                </span>
            )
        },
        {
            header: 'Carga Qf',
            accessor: 'results',
            render: (item: any) => (
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316', lineHeight: 1.1 }}>{item.results?.cargaDeFuego?.toFixed(2)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                        Kg/m² — <span style={{ color: '#ef4444' }}>{item.results?.rfRequerida}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button 
                        onClick={() => navigate('/fire-load', { state: { editData: item } })} 
                        style={{ 
                            padding: '0.45rem 0.85rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--glass-border-subtle)', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            color: 'var(--color-text)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-surface-hover)';
                            e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--color-surface)';
                            e.currentTarget.style.borderColor = 'var(--glass-border-subtle)';
                        }}
                    >
                        <FileText size={16} /> Ver
                    </button>
                    <button 
                        onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`; setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` }); })} 
                        style={{ padding: '0.45rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                        title="QR"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
                    >
                        <QrCode size={16} />
                    </button>
                    <button 
                        onClick={() => requirePro(() => setShareItem(item))} 
                        style={{ padding: '0.45rem', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: '10px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                        title="Compartir"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(22,163,74,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(22,163,74,0.06)'}
                    >
                        <Share2 size={16} />
                    </button>
                    <button 
                        onClick={() => setDeleteTarget(item.id)} 
                        style={{ padding: '0.45rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '960px', paddingBottom: '6rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Carga de Fuego - ${shareItem?.sector || ''}`} text={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n🔥 Carga Qf: ${shareItem.results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF: ${shareItem.results?.rfRequerida}` : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={`Carga_Fuego_${shareItem?.sector || 'Estudio'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <FireLoadPdfGenerator data={shareItem} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--color-text)' }}>Carga de Fuego</h1>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historial de Estudios</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/fire-load')} 
                        className="btn-primary" 
                        style={{ 
                            padding: '0.7rem 1.4rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            fontSize: '0.85rem', 
                            fontWeight: 800,
                            borderRadius: '12px',
                            width: 'auto', 
                            margin: 0,
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            border: 'none',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)'
                        }}
                    >
                        <Plus size={18} weight="bold" /> Nuevo Cálculo
                    </button>
                </div>

                {/* Dashboard Panel Glassmorphic */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                }}>
                    <div className="fireload-stat-card">
                        <div className="fireload-stat-glow" style={{ background: '#f97316' }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Estudios Guardados
                                </span>
                                <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.45rem', borderRadius: '10px', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={18} />
                                </div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                {history.length}
                            </h3>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                Evaluaciones registradas
                            </p>
                        </div>
                    </div>

                    <div className="fireload-stat-card">
                        <div className="fireload-stat-glow" style={{ background: '#ef4444' }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Carga Qf Máxima
                                </span>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.45rem', borderRadius: '10px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Flame size={18} weight="fill" />
                                </div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>
                                {history.reduce((max, h) => Math.max(max, h.results?.cargaDeFuego || 0), 0).toFixed(2)}
                            </h3>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                Kg/m² en sector crítico
                            </p>
                        </div>
                    </div>

                    <div className="fireload-stat-card">
                        <div className="fireload-stat-glow" style={{ background: '#3b82f6' }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Área Evaluada
                                </span>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.45rem', borderRadius: '10px', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Buildings size={18} />
                                </div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                {history.reduce((sum, h) => sum + (h.superficie || 0), 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>m²</span>
                            </h3>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                Superficie total expuesta
                            </p>
                        </div>
                    </div>

                    <div className="fireload-stat-card">
                        <div className="fireload-stat-glow" style={{ background: '#f59e0b' }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Qf Promedio
                                </span>
                                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.45rem', borderRadius: '10px', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Flame size={18} />
                                </div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                {(history.length > 0 ? history.reduce((sum, h) => sum + (h.results?.cargaDeFuego || 0), 0) / history.length : 0).toFixed(2)}
                            </h3>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                Kg/m² de media general
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
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
                </div>

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
