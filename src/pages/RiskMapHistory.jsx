import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Map as MapIcon, Calendar, ChevronRight, Trash2, Share2, Edit2, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';

export default function RiskMapHistory() {
    useDocumentTitle('Historial de Mapas de Riesgo');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMap, setSelectedMap] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('risk_map_history') || '[]');
        setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, [syncing]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('risk_map_history', JSON.stringify(updated));
        syncCollection('risk_map_history', updated);
        setDeleteTarget(null);
    };

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.empresa} ${item.sector}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (selectedMap) {
        return <RiskMapPdfGenerator mapData={selectedMap} onBack={() => setSelectedMap(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                        <h3>¿Eliminar mapa?</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción borrará definitivamente el mapa de {history.find(h => h.id === deleteTarget)?.empresa}.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none' }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none' }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Mapa de Riesgo - ${shareItem?.empresa || ''}`}
                text={shareItem ? `🗺️ Mapa de Riesgos ISO\n🏢 Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n📅 Fecha: ${shareItem.fecha}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <RiskMapPdfGenerator mapData={shareItem} isHeadless={true} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Mapas de Riesgos Guardados</h1>
                </div>
                <button onClick={() => navigate('/risk-maps')} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    Nuevo Mapa
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o sector..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px',
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        fontSize: '1rem', color: 'var(--color-text)', outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.map((map) => (
                    <div key={map.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `6px solid #8b5cf6` }}
                        onClick={() => setSelectedMap(map)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MapIcon size={24} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {map.empresa}
                                    </h3>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                        {map.elements.length} Elementos
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(map.fecha + 'T12:00:00Z').toLocaleDateString()}</span>
                                    <span><strong>Sector:</strong> {map.sector}</span>
                                </div>
                            </div>
                            <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} className="hidden sm:block" />
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShareItem(map);
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                                <Share2 size={16} /> Compartir
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/v/${currentUser?.uid}/riskmap/${map.id}?print=true`;
                                    setQrTarget({ text: url, title: `Mapa de Riesgos — ${map.sector}` });
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Generar QR"
                            >
                                <QrCode size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/risk-maps', { state: { editData: map } });
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                onClick={(e) => handleDelete(map.id, e)}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <MapIcon size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay mapas registrados</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún mapa coincide con la búsqueda.' : 'Tus croquis y mapas de riesgo ISO aparecerán aquí.'}
                        </p>
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
