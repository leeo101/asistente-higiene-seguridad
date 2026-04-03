import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Search, Trash2, FileText, Printer,
    Calendar, Building2, Flame, ExternalLink, Plus, Share2, Download, QrCode
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';

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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
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
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredHistory = history.filter(item =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Carga de Fuego - ${shareItem?.sector || ''}`}
                text={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n🔥 Carga Qf: ${shareItem.results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF Requerida: ${shareItem.results?.rfRequerida}` : ''}
                rawMessage={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n🔥 Carga Qf: ${shareItem.results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF Requerida: ${shareItem.results?.rfRequerida}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Carga_Fuego_${shareItem?.sector || 'Estudio'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <FireLoadPdfGenerator data={shareItem} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Carga de Fuego</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Estudios guardados</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/fire-load')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Nuevo Cálculo</span>
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o sector..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0, flex: 1 }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', flexShrink: 0 }}>
                                        <Flame size={21} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Calendar size={14} style={{ flexShrink: 0 }} /> <span style={{ flexShrink: 0 }}>{new Date(item.createdAt).toLocaleDateString('es-AR')}</span> - <Building2 size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sector}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f97316' }}>{item.results?.cargaDeFuego?.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Kg/m² - {item.results?.rfRequerida}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => navigate('/fire-load', { state: { editData: item } })}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <FileText size={16} /> Ver / Editar
                                </button>
                                <button
                                    onClick={() => requirePro(() => setShareItem(item))}
                                    style={{ padding: '0.6rem 0.9rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                                >
                                    <Share2 size={15} /> Compartir
                                </button>
                                <button
                                    onClick={() => {
                                        requirePro(() => {
                                            const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`;
                                            setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` });
                                        });
                                    }}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{
                                        padding: '0.6rem',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Flame size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ marginBottom: '1.5rem' }}>No se encontraron estudios de carga de fuego.</p>
                        <button onClick={() => navigate('/fire-load')} className="btn-primary" style={{ margin: '0 auto' }}>Generar mi primer Cálculo</button>
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
