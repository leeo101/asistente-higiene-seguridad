import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shield, ShieldAlert, Calendar, Trash2, Share2, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';

// ─── Reusable delete confirmation dialog ───────────────────────────
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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar evaluación?</h3>
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

export default function RiskAssessmentHistory() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    useDocumentTitle('Historial Evaluación de Riesgos');

    const [data, setData] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('risk_assessment_history');
        if (raw) {
            setData(JSON.parse(raw));
        }
    }, [syncPulse]);

    const askDelete = (e, id) => {
        e.stopPropagation();
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        const current = JSON.parse(localStorage.getItem('risk_assessment_history') || '[]');
        const updated = current.filter(item => String(item.id) !== String(deleteTarget));
        localStorage.setItem('risk_assessment_history', JSON.stringify(updated));
        syncCollection('risk_assessment_history', updated);
        setData(updated);
        setDeleteTarget(null);
    };

    const getRiskColor = (label) => {
        switch (label) {
            case 'Bajo': return '#10b981';
            case 'Moderado': return '#f59e0b';
            case 'Alto': return '#f97316';
            case 'Crítico': return '#ef4444';
            default: return 'var(--color-text-muted)';
        }
    };

    const getRiskBg = (label) => {
        switch (label) {
            case 'Bajo': return 'rgba(16, 185, 129, 0.1)';
            case 'Moderado': return 'rgba(245, 158, 11, 0.1)';
            case 'Alto': return 'rgba(249, 115, 22, 0.1)';
            case 'Crítico': return 'rgba(239, 68, 68, 0.1)';
            default: return 'var(--color-background)';
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`IPER - ${shareItem?.name || ''}`}
                text={shareItem ? `🛡️ Evaluación de Riesgo (IPER)\n📝 Tarea: ${shareItem.name}\n📍 Ubicación: ${shareItem.location || '-'}\n📅 Fecha: ${new Date(shareItem.date || shareItem.createdAt).toLocaleDateString()}\n⚠️ Resultado: ${shareItem.score} (${shareItem.riskLabel})` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <RiskAssessmentPdfGenerator assessmentData={shareItem} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/history')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Evaluación de Riesgos</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Historial IPER</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/risk')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0, background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}
                >
                    <Plus size={18} /> <span className="hidden sm:inline">NUEV0</span>
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.length > 0 ? data.map(item => (
                    <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '12px', color: '#ef4444' }}>
                                    <ShieldAlert />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 800 }}>{item.name}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={14} /> {new Date(item.date || item.createdAt).toLocaleDateString()}
                                        </span>
                                        {item.location && <span>📍 {item.location}</span>}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '8px',
                                        background: getRiskBg(item.riskLabel),
                                        color: getRiskColor(item.riskLabel),
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        border: `1px solid ${getRiskColor(item.riskLabel)}40`
                                    }}>
                                        Nivel {item.riskLabel} ({item.score})
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/risk', { state: { editData: item } })}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}
                                >
                                    Editar Evaluación
                                </button>
                                <button
                                    onClick={() => setShareItem(item)}
                                    style={{ 
                                        padding: '0.6rem 1rem', 
                                        background: '#dcfce7', 
                                        border: '1px solid #86efac', 
                                        borderRadius: '12px', 
                                        color: '#16a34a', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.4rem',
                                        fontWeight: 800,
                                        fontSize: '0.8rem'
                                    }}
                                    title="Compartir Informe"
                                >
                                    <Share2 size={16} /> <span>WA</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/riskassessment/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `IPER — ${item.name}` });
                                    }}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '12px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={18} />
                                </button>
                                <button
                                    onClick={e => askDelete(e, item.id)}
                                    title="Eliminar"
                                    style={{
                                        background: '#fee2e2', border: 'none', borderRadius: '12px',
                                        color: '#dc2626', cursor: 'pointer', padding: '0.6rem 0.8rem',
                                        display: 'flex', alignItems: 'center', flexShrink: 0,
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>No hay evaluaciones de riesgo registradas</p>
                        <button onClick={() => navigate('/risk')} className="btn-primary" style={{ margin: '0 auto', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>Crear primera Evaluación</button>
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
