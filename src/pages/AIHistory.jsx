import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, ChevronRight,
    Trash2, Sparkles, Download, FileText, HardHat,
    ShieldAlert, Lightbulb, Gavel, Share2
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import AiAdvisorPdfGenerator from '../components/AiAdvisorPdfGenerator';
import toast from 'react-hot-toast';

export default function AIHistory() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ai_advisor_history');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setHistory(parsed.filter(item => item && item.id && item.task));
                } else {
                    setHistory([]);
                }
            } else {
                setHistory([]);
            }
        } catch (e) {
            console.error("Error parsing AI history:", e);
            setHistory([]);
        }
    }, [syncPulse]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        const toastId = toast(
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem' }}>¿Eliminar este registro?</span>
                <button
                    onClick={() => {
                        const updated = history.filter(item => item.id !== id);
                        setHistory(updated);
                        localStorage.setItem('ai_advisor_history', JSON.stringify(updated));
                        syncCollection('ai_advisor_history', updated);
                        if (selectedItem?.id === id) setSelectedItem(null);
                        toast.dismiss(toastId);
                        toast.success('Registro eliminado');
                    }}
                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                >Eliminar</button>
            </div>,
            { duration: 5000, icon: '🗑️' }
        );
    };

    const [shareItem, setShareItem] = useState(null);

    const filteredHistory = history.filter(item =>
        item.task.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedItem) {
        return (
            <div className="container" style={{ paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Detalle del Análisis IA</h1>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                {new Date(selectedItem.date).toLocaleString()}
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{selectedItem.task}</h3>
                        </div>
                        <button
                            onClick={() => setShareItem(selectedItem)}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                        >
                            <Share2 size={16} /> Compartir Reporte
                        </button>
                    </div>

                    <ShareModal
                        open={!!shareItem}
                        onClose={() => setShareItem(null)}
                        title={`Análisis IA - ${shareItem?.task || ''}`}
                        text={shareItem ? `✨ Análisis de Seguridad (IA)\n📋 Tarea: ${shareItem.task}\n🚨 Riesgos: ${(shareItem.riesgos || []).slice(0, 2).join(', ')}...\n🛡️ EPP: ${(shareItem.epp || []).slice(0, 2).join(', ')}...\n📚 Normativa: ${(shareItem.normativa || []).join(', ')}` : ''}
                        elementIdToPrint="pdf-content"
                    />

                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                        {shareItem && <AiAdvisorPdfGenerator data={shareItem} />}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.8rem' }}>
                                <ShieldAlert size={18} /> <h4 style={{ margin: 0 }}>Riesgos</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {(selectedItem.riesgos || []).map((it, i) => <li key={i}>{it}</li>)}
                                {(!selectedItem.riesgos || selectedItem.riesgos.length === 0) && <li>No hay riesgos detectados</li>}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', marginBottom: '0.8rem' }}>
                                <HardHat size={18} /> <h4 style={{ margin: 0 }}>EPP</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {(selectedItem.epp || []).map((it, i) => <li key={i}>{it}</li>)}
                                {(!selectedItem.epp || selectedItem.epp.length === 0) && <li>No hay EPP recomendados</li>}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #10b981' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.8rem' }}>
                                <Lightbulb size={18} /> <h4 style={{ margin: 0 }}>Medidas</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {(selectedItem.recomendaciones || []).map((it, i) => <li key={i}>{it}</li>)}
                                {(!selectedItem.recomendaciones || selectedItem.recomendaciones.length === 0) && <li>No hay medidas preventivas</li>}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #8b5cf6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.8rem' }}>
                                <Gavel size={18} /> <h4 style={{ margin: 0 }}>Normativa</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0, listStyle: 'none' }}>
                                {(selectedItem.normativa || []).map((it, i) => <li key={i}>• {it}</li>)}
                                {(!selectedItem.normativa || selectedItem.normativa.length === 0) && <li>No hay normativa registrada</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Análisis IA - ${shareItem?.task || ''}`}
                text={shareItem ? `✨ Análisis de Seguridad (IA)\n📋 Tarea: ${shareItem.task}\n🚨 Riesgos: ${(shareItem.riesgos || []).slice(0, 2).join(', ')}...\n🛡️ EPP: ${(shareItem.epp || []).slice(0, 2).join(', ')}...\n📚 Normativa: ${(shareItem.normativa || []).join(', ')}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <AiAdvisorPdfGenerator data={shareItem} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#activity')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Sparkles size={24} color="var(--color-primary)" />
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Consultas IA</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Asesoría técnica</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/ai-advisor')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                >
                    <Sparkles size={18} /> <span className="hidden sm:inline">NUEVA CONSULTA</span>
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por tarea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.8rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map(item => (
                        <div
                            key={item.id}
                            className="card"
                            onClick={() => setSelectedItem(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                        >
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.8rem', borderRadius: '12px', color: 'var(--color-primary)' }}>
                                <Sparkles size={24} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.task}</h4>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShareItem(item); }}
                                    style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', color: '#16a34a', cursor: 'pointer', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', minWidth: '40px' }}
                                    title="Compartir"
                                >
                                    <Share2 size={18} /> <span className="hidden sm:inline" style={{ marginLeft: '0.3rem', fontWeight: 700, fontSize: '0.75rem' }}>Compartir</span>
                                </button>
                                <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <ChevronRight size={20} color="var(--color-text-muted)" style={{ alignSelf: 'center' }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Sparkles size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ marginBottom: '1.5rem' }}>{searchTerm ? 'No se encontraron resultados' : 'Aún no tienes consultas guardadas'}</p>
                        <button onClick={() => navigate('/ai-advisor')} className="btn-primary" style={{ margin: '0 auto' }}>Hacer una consulta ahora</button>
                    </div>
                )}
            </div>
        </div>
    );
}
