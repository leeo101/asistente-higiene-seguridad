import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Share2, Info, QrCode, Download, BarChart2, Flame, Crosshair } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import ExtinguisherAIPdfGenerator from '../components/ExtinguisherAIPdfGenerator';

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem',
                maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar informe?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function ExtinguisherAIHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [qrTarget, setQrTarget] = useState<{ text: string, title: string } | null>(null);
    const [shareItem, setShareItem] = useState<any>(null);

    useEffect(() => {
        const raw = localStorage.getItem('extinguisher_ai_history');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            const valid = parsed.filter((item: any) => item && item.id && item.date);
            if (valid.length !== parsed.length) {
                localStorage.setItem('extinguisher_ai_history', JSON.stringify(valid));
                syncCollection('extinguisher_ai_history', valid);
            }
            setHistory(valid);
        } catch {
            setHistory([]);
        }
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('extinguisher_ai_history', JSON.stringify(updated));
        syncCollection('extinguisher_ai_history', updated);
        setDeleteTarget(null);
    };

    const filtered = history.filter(item =>
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = history.length;
    const isVigente = history.filter(i => i.status === 'vigente').length;
    const isVencido = history.filter(i => i.status === 'vencido').length;
    const compliance = total > 0 ? Math.round((isVigente / total) * 100) : 0;

    const handleExportCSV = () => {
        downloadCSV(filtered.map(i => ({
            fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
            tipo: i.type || 'N/A',
            confianza: i.confidence ? `${Math.round(i.confidence * 100)}%` : 'N/A',
            estado: i.status === 'vigente' ? 'Vigente' : 'Vencido/Revisión',
            capacidad: i.capacity || 'N/A'
        })), 'extintores_ia_historial', {
            fecha: 'Fecha', tipo: 'Tipo', confianza: 'Confianza IA', estado: 'Estado', capacidad: 'Capacidad'
        });
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Inspección IA - Extintor ${shareItem?.type || ''}`}
                text={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
                rawMessage={shareItem ? `📸 Inspección de Extintor con IA\n🧯 Tipo: ${shareItem.type || 'N/A'}\n🛡️ Estado: ${shareItem.status === 'vigente' ? '✅ Vigente' : '⚠️ Vencido'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Inspeccion_Extintor_IA_${shareItem?.type || 'Sin_Tipo'}.pdf`}
            />

            <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <ExtinguisherAIPdfGenerator item={shareItem} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/extinguisher-ai')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Historial IA</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Inspecciones de extintores</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                            <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/extinguisher-ai')}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                    >
                        <Camera size={18} /> <span className="hidden sm:inline">NUEVO</span>
                    </button>
                </div>
            </div>

            {/* Stats panel */}
            {total > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{total}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>INSPECCIONES</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{compliance}%</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VIGENTES</div>
                        </div>
                        <div style={{ background: isVencido > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isVencido > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isVencido > 0 ? '#f59e0b' : '#10b981' }}>{isVencido}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VENCIDOS</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por tipo o estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px', border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)', fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length > 0 ? (
                    filtered.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                        <Flame size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Extintor {item.type || 'Desconocido'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')} — <Crosshair size={14} /> {item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    padding: '0.3rem 0.7rem', borderRadius: '20px',
                                    background: item.status === 'vigente' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: item.status === 'vigente' ? '#10b981' : '#ef4444',
                                    flexShrink: 0
                                }}>
                                    {item.status === 'vigente' ? 'VIGENTE' : 'VENCIDO'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setShareItem(item)}
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <Share2 size={16} /> Ver Reporte / Compartir
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `Inspección — Extintor ${item.type || 'IA'}` });
                                    }}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay inspecciones guardadas.</p>
                        <button onClick={() => navigate('/extinguisher-ai')} className="btn-primary" style={{ marginTop: '1rem' }}>
                            Realizar Primera Inspección
                        </button>
                    </div>
                )}
            </div>
            {qrTarget && (
                <QRModal
                    text={qrTarget.text}
                    title={qrTarget.title}
                    onClose={() => setQrTarget(null)}
                />
            )}
        </div>
    );
}
