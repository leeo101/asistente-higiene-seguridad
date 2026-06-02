import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, Share2, Info, FileText, QrCode, Download, BarChart2, TriangleAlert, ShieldAlert } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';

function DeleteConfirm({ onConfirm, onCancel }) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar análisis?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function AIGeneralCameraManager(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('ai_camera_history');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            const valid = parsed.filter(item => {
                if (!item || !item.id) return false;
                if (!item.date) return false;
                if (item.type !== 'general_risks') return false; // Solo Riesgos Generales
                return true;
            });
            setHistory(valid);
        } catch {
            setHistory([]);
        }
    }, [syncPulse]);

    const confirmDelete = () => {
        const raw = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
        const updated = raw.filter(item => item.id !== deleteTarget);
        
        localStorage.setItem('ai_camera_history', JSON.stringify(updated));
        localStorage.removeItem(`ai_report_full_${deleteTarget}`);
        syncCollection('ai_camera_history', updated);
        
        setHistory(history.filter(item => item.id !== deleteTarget));
        setDeleteTarget(null);
        toast.success("Análisis eliminado");
    };

    const filtered = history.filter(item =>
        item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = history.length;
    const conRiesgo = history.filter(i => (i.findingsCount || 0) > 0).length;
    const seguros = total - conRiesgo;
    const riesgoRatio = total > 0 ? Math.round((conRiesgo / total) * 100) : 0;

    const handleExportCSV = () => {
        downloadCSV(filtered.map(i => ({
            empresa: i.company, ubicacion: i.location,
            fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
            hallazgos: i.findingsCount || 0
        })), 'camara_riesgos_historial', {
            empresa: 'Empresa', ubicacion: 'Ubicación', fecha: 'Fecha', hallazgos: 'Hallazgos IA'
        });
    };

    return (
        <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            <ShareModal
                isOpen={!!shareItem && !document.body.classList.contains('printing-isolated')}
                open={!!shareItem && !document.body.classList.contains('printing-isolated')}
                onClose={() => setShareItem(null)}
                title={`Análisis de Riesgos IA - ${shareItem?.company || ''}`}
                text={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
                rawMessage={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Riesgos_IA_${shareItem?.company || 'Sin_Nombre'}.pdf`}
            />

            {typeof document !== 'undefined' && createPortal(
                <div className="ats-pdf-offscreen">
                    {shareItem && <AiReportPdfGenerator item={shareItem} />}
                </div>,
                document.body
            )}

            <PremiumHeader
                title="Riesgos IA"
                subtitle="Análisis de entorno y hallazgos"
                icon={<ShieldAlert size={36} />}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/#tools')} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.8rem 1.2rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}>
                    <ArrowLeft size={18} /> Volver
                </button>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/ai-general-camera')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem',
                            background: '#36B37E', color: 'white', border: 'none', borderRadius: '12px',
                            fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(54, 179, 126, 0.4)'
                        }}
                    >
                        <ShieldAlert size={20} /> NUEVO ANÁLISIS
                    </button>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{
                            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem',
                            background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)',
                            borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer'
                        }}>
                            <Download size={20} /> EXPORTAR CSV
                        </button>
                    )}
                </div>
            </div>

            {total > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem' }}>
                        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#3b82f6' }}>{total}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>ESCANEO TOTAL</div>
                        </div>
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>{conRiesgo}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>CON HALLAZGOS</div>
                        </div>
                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{riesgoRatio}%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>RATIO RIESGO</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '1rem 1rem 1rem 2.8rem',
                        borderRadius: '16px', border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)', fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length > 0 ? (
                    filtered.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '48px', height: '48px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.company || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')} — <Building2 size={14} /> {item.location}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    fontSize: '0.8rem', fontWeight: 800,
                                    padding: '0.4rem 0.8rem', borderRadius: '100px',
                                    background: (item.findingsCount > 0) ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                    color: (item.findingsCount > 0) ? '#ef4444' : '#10b981',
                                    flexShrink: 0
                                }}>
                                    <Info size={16} />
                                    {item.findingsCount > 0 ? `${item.findingsCount} Hallazgos` : 'Limpio'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => {
                                        const fullReportKey = `ai_report_full_${item.id}`;
                                        const savedFull = localStorage.getItem(fullReportKey);
                                        const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                                        localStorage.setItem('current_ai_inspection', JSON.stringify(reportToLoad));
                                        navigate('/ai-report');
                                    }}
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', borderRadius: '12px' }}
                                >
                                    <FileText size={18} /> Ver Reporte Completo
                                </button>
                                <button
                                    onClick={() => {
                                        const fullReportKey = `ai_report_full_${item.id}`;
                                        const savedFull = localStorage.getItem(fullReportKey);
                                        const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                                        setShareItem(reportToLoad);
                                    }}
                                    style={{ flex: 1, padding: '0.8rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 800 }}
                                    title="Compartir Reporte"
                                >
                                    <Share2 size={18} /> <span style={{ marginLeft: '0.3rem' }}>Compartir</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `Análisis de Entorno — ${item.company || 'IA'}` });
                                    }}
                                    style={{ padding: '0.8rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '12px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={18} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                        <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--color-text)' }}>No hay análisis de riesgos</h3>
                        <p>No se registraron análisis de entorno con IA todavía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
