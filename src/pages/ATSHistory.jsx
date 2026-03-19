
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { ArrowLeft, Search, Trash2, FileText, Printer, Building2, Calendar, ShieldCheck, X, Share2, ClipboardList, QrCode, Download } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';

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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar ATS?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function ATSHistory() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const historyRaw = localStorage.getItem('ats_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ats_history', JSON.stringify(updated));
        syncCollection('ats_history', updated);
        setDeleteTarget(null);
    };

    const filteredHistory = history.filter(item =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.obra?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleExportCSV = () => {
        downloadCSV(filteredHistory.map(i => ({
            empresa: i.empresa, obra: i.obra, fecha: i.fecha,
            responsable: i.capatazNombre || '', tarea: i.tarea || ''
        })), 'ats_historial', {
            empresa: 'Empresa', obra: 'Obra/Proyecto', fecha: 'Fecha',
            responsable: 'Responsable', tarea: 'Tarea'
        });
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`ATS - ${shareItem?.obra || ''}`}
                text={shareItem ? `📋 Análisis de Trabajo Seguro (ATS)\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}\n👷 Responsable: ${shareItem.capatazNombre || '-'}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <ATSPdfGenerator atsData={shareItem} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Historial de ATS</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Análisis guardados</p>
                    </div>
                </div>
                {filteredHistory.length > 0 && (
                    <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                        <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                    </button>
                )}
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa u obra..."
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                                        <ClipboardList size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {item.fecha} - <Building2 size={14} /> {item.obra}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/ats', { state: { editData: item } })}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <FileText size={16} /> Ver / Editar
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/ats/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `ATS — ${item.empresa}` });
                                    }}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={16} />
                                </button>
                                <button
                                    onClick={() => setShareItem(item)}
                                    style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}
                                    title="Compartir Informe"
                                >
                                    <Share2 size={15} /> <span className="hidden sm:inline" style={{ marginLeft: '0.4rem', fontWeight: 700, fontSize: '0.8rem' }}>WA</span>
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
                        <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ marginBottom: '1.5rem' }}>No se encontraron registros de ATS.</p>
                        <button onClick={() => navigate('/ats')} className="btn-primary" style={{ margin: '0 auto' }}>Crear mi primer ATS</button>
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
        </div >
    );
}
