import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, MapPin, Printer, FileText, Users, Download, Trash2, Share2, Edit2,
    BookOpen, ArrowLeft, Calendar, ChevronRight, Search, QrCode
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';

export default function TrainingHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();
    const { requirePro } = usePaywall();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('training_history');
            if (raw && raw !== 'undefined') {
                const h = JSON.parse(raw);
                setHistory(Array.isArray(h) ? h.sort((a, b) => (new Date(b.date) as any) - (new Date(a.date) as any)) : []);
            } else {
                setHistory([]);
            }
        } catch (e) {
            console.error('[TrainingHistory] Error loading history:', e);
            setHistory([]);
        }
    }, [syncing]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('training_history', JSON.stringify(updated));
        syncCollection('training_history', updated);
        setDeleteTarget(null);
    };

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.tema} ${item.expositor} ${item.empresa}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (selectedTraining) {
        return <TrainingPdfGenerator data={selectedTraining} onBack={() => setSelectedTraining(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                        <h3>¿Eliminar capacitación?</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción borrará definitivamente el registro de {history.find(h => h.id === deleteTarget)?.tema}.</p>
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
                title={`Capacitación - ${shareItem?.tema || ''}`}
                text={shareItem ? `📊 Registro de Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes.length}` : ''}
                rawMessage={shareItem ? `📊 Registro de Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes.length}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Capacitacion_${shareItem?.tema || 'registro'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <TrainingPdfGenerator data={shareItem} isHeadless={true} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Capacitaciones Dictadas</h1>
                </div>
                <button onClick={() => navigate('/training-management')} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    Nueva Charla
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por tema, expositor o empresa..."
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
                {filteredHistory.map((training) => (
                    <React.Fragment key={training.id}>
                        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `6px solid #3b82f6` }}
                            onClick={() => setSelectedTraining(training)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `rgba(59,130,246,0.15)`, color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BookOpen size={24} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {training.tema}
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Users size={14} /> {training.asistentes.length}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(training.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {training.duracion} hs</span>
                                    </div>
                                </div>
                                <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} className="hidden sm:block" />
                            </div>
                        </div>

                        <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem', padding: '0 1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requirePro(() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/training/${training.id}?print=true`;
                                        setQrTarget({ text: url, title: `Capacitación — ${training.tema}` });
                                    });
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Generar QR"
                            >
                                <QrCode size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requirePro(() => setShareItem(training));
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                                <Share2 size={16} /> Compartir
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/training-management', { state: { editData: training } });
                                }}
                                style={{ padding: '0.5rem', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                onClick={(e) => handleDelete(training.id, e)}
                                className="delete-asistente-btn"
                                style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                                title="Eliminar Registro"
                            >
                                <Trash2 size={22} />
                            </button>
                        </div>
                    </React.Fragment>
                ))}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <BookOpen size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay capacitaciones</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún registro coincide con la búsqueda.' : 'Tus próximas capacitaciones aparecerán aquí.'}
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
