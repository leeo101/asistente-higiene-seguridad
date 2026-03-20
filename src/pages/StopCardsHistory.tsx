import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Calendar, AlertTriangle, ShieldCheck, MapPin, Trash2, Share2, AlertCircle, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import { HistoryCardSkeleton } from '../components/SkeletonLoader';

function DeleteConfirm({ onConfirm, onCancel }) {
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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar tarjeta?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: 'var(--color-background)', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)'
                    }}>Cancelar</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: '#ffffff'
                    }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function StopCardsHistory(): React.ReactElement | null {
    useDocumentTitle('Historial Tarjetas STOP');
        const { syncCollection, syncPulse } = useSync();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareCard, setShareCard] = useState(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const history = JSON.parse(localStorage.getItem('stop_cards_history') || '[]');
            setCards(history);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = cards.filter(c => c.id !== deleteTarget);
        localStorage.setItem('stop_cards_history', JSON.stringify(updated));
        syncCollection('stop_cards_history', updated);
        setCards(updated);
        setDeleteTarget(null);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Condición Insegura': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <AlertCircle /> };
            case 'Acto Inseguro': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle /> };
            case 'Casi Accidente': return { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', icon: <AlertTriangle /> };
            case 'Acto Seguro': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ShieldCheck /> };
            default: return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <AlertCircle /> };
        }
    };

    const filtered = cards.filter(c =>
        (c.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container page-transition" style={{ paddingBottom: '4rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            
            <ShareModal
                open={!!shareCard}
                onClose={() => setShareCard(null)}
                title={`Tarjeta STOP - ${shareCard?.type || ''}`}
                text={shareCard ? `🚨 Tarjeta STOP\n🛑 Tipo: ${shareCard.type}\n📍 Ubicación: ${shareCard.location}\n📅 Fecha: ${new Date(shareCard.date).toLocaleDateString()} ${shareCard.time}\n\n📝 Hallazgo:\n${shareCard.description}` : ''}
                elementIdToPrint="stop-card-pdf-content"
            />

            <div id="stop-card-pdf-container" style={{ position: 'fixed', left: '0', top: '0', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
                {shareCard && <StopCardPdfGenerator card={shareCard} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Tarjetas STOP</h1>
                </div>
                <button onClick={() => navigate('/stop-cards')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Plus size={18} /> <span className="hidden sm:inline">Nueva Tarjeta</span>
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por descripción, ubicación o tipo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '2.8rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? [1, 2, 3].map(i => <HistoryCardSkeleton key={i} />) : filtered.length > 0 ? filtered.map(item => {
                    const tColor = getTypeColor(item.type);
                    return (
                        <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: tColor.bg, padding: '0.8rem', borderRadius: '12px', color: tColor.color, flexShrink: 0 }}>
                                        {tColor.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 800, color: tColor.color }}>{item.type}</h4>
                                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {item.description}
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                                <Calendar size={14} /> {new Date(item.date).toLocaleDateString()} {item.time}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <MapPin size={14} /> {item.location}
                                            </span>
                                        </div>
                                    </div>
                                    {item.photoBase64 && (
                                        <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                            <img src={item.photoBase64} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>

                                {item.actionTaken && (
                                    <div style={{ background: 'var(--color-background)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-text)', borderLeft: '3px solid #10b981' }}>
                                        <strong>Acción:</strong> {item.actionTaken}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setShareCard(item)}
                                        className="btn-secondary"
                                        style={{ padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'transparent', borderRadius: '10px' }}
                                    >
                                        <Share2 size={16} /> Compartir
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/v/${currentUser?.uid}/stopcard/${item.id}?print=true`;
                                            setQrTarget({ text: url, title: `Tarjeta STOP — ${item.type}` });
                                        }}
                                        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.18)', cursor: 'pointer', background: 'rgba(139,92,246,0.06)', borderRadius: '10px' }}
                                        title="Generar QR"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(item.id)}
                                        style={{
                                            background: '#fee2e2', border: 'none', borderRadius: '10px',
                                            color: '#dc2626', cursor: 'pointer', padding: '0.5rem 0.8rem',
                                            display: 'flex', alignItems: 'center', flexShrink: 0
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <AlertTriangle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ marginBottom: '1.5rem' }}>No hay tarjetas STOP registradas</p>
                        <button onClick={() => navigate('/stop-cards')} className="btn-primary" style={{ margin: '0 auto' }}>Crear Primera Tarjeta</button>
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
