import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Search, TriangleAlert, ChevronRight, Activity, Trash2, Share2, Edit2, ArrowLeft, Calendar, FileText, MapPin, QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';

export default function AccidentHistory(): React.ReactElement | null {
    useDocumentTitle('Historial de Accidentes');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
        setHistory(h.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, [syncing]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('accident_history', JSON.stringify(updated));
        syncCollection('accident_history', updated);
        setDeleteTarget(null);
    };

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.empresa} ${item.victimaNombre} ${item.lesion}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const getSeverityColor = (sev) => {
        if (sev === 'Leve') return '#3b82f6';
        if (sev === 'Moderado') return '#fbbf24';
        if (sev === 'Grave') return '#f97316';
        if (sev === 'Mortal') return '#dc2626';
        return '#64748b';
    };

    if (selectedReport) {
        return <AccidentPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                        <h3>¿Eliminar reporte?</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción borrará definitivamente la investigación de {history.find(h => h.id === deleteTarget)?.victimaNombre}.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none' }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none' }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`}
                text={shareItem ? `⚠️ Informe de Investigación de Accidente\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''}
                rawMessage={shareItem ? `⚠️ Informe de Investigación de Accidente\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Accidente_${shareItem?.victimaNombre || 'Sin_Nombre'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <AccidentPdfGenerator report={shareItem} isHeadless={true} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Investigaciones de Accidentes</h1>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por empleado, empresa o lesión..."
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
                {filteredHistory.map((report) => {
                    const sevColor = getSeverityColor(report.gravedad);
                    return (
                        <div key={report.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `6px solid ${sevColor}` }}
                            onClick={() => setSelectedReport(report)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${sevColor}15`, color: sevColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TriangleAlert size={24} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {report.victimaNombre}
                                        </h3>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: sevColor, color: '#fff' }}>
                                            {report.gravedad}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(report.date).toLocaleDateString()}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {report.empresa}</span>
                                    </div>
                                </div>
                                <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} className="hidden sm:block" />
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShareItem(report);
                                    }}
                                    style={{ padding: '0.5rem', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                    <Share2 size={16} /> Compartir
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${report.id}?print=true`;
                                        setQrTarget({ text: url, title: `Accidente — ${report.victimaNombre}` });
                                    }}
                                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/accident-investigation', { state: { editData: report } });
                                    }}
                                    style={{ padding: '0.5rem', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button
                                    onClick={(e) => handleDelete(report.id, e)}
                                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <FileText size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay investigaciones</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún reporte coincide con la búsqueda.' : 'Los accidentes investigados aparecerán aquí.'}
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
