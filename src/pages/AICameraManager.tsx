import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, ShieldCheck, TriangleAlert, Share2, Info, FileText, QrCode, Download, BarChart2, Plus } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';

function DeleteConfirm({ onConfirm, onCancel }) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar inspección?</h3>
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

export default function AICameraManager(): React.ReactElement | null {
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
                if (item.type !== 'ppe_check' && item.ppeComplete === undefined) return false; // Solo EPP
                return true;
            });
            setHistory(valid);
        } catch {
            setHistory([]);
        }
    }, [syncPulse]);

    const confirmDelete = () => {
        // Obtenemos todos, porque en localStorage están mezclados EPP y Riesgos
        const raw = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
        const updated = raw.filter(item => item.id !== deleteTarget);
        
        localStorage.setItem('ai_camera_history', JSON.stringify(updated));
        localStorage.removeItem(`ai_report_full_${deleteTarget}`);
        syncCollection('ai_camera_history', updated);
        
        setHistory(history.filter(item => item.id !== deleteTarget));
        setDeleteTarget(null);
        toast.success("Inspección eliminada");
    };

    const filtered = history.filter(item =>
        item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = history.length;
    const eppOk = history.filter(i => i.ppeComplete).length;
    const eppFail = history.filter(i => i.ppeComplete === false).length;
    const compliance = total > 0 ? Math.round((eppOk / Math.max(eppOk + eppFail, 1)) * 100) : 0;

    const getWeeklyStats = () => {
        const stats = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(now.getDate() - (i * 7 + 6));
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(now.getDate() - (i * 7));
            end.setHours(23, 59, 59, 999);

            const weekItems = history.filter(item => {
                const d = new Date(item.date);
                return d >= start && d <= end;
            });

            const wTotal = weekItems.length;
            const wOk = weekItems.filter(item => item.ppeComplete).length;
            const wFail = weekItems.filter(item => item.ppeComplete === false).length;
            const wComp = wTotal > 0 ? Math.round((wOk / Math.max(wOk + wFail, 1)) * 100) : 0;

            stats.push({ label: i === 0 ? 'Hoy' : `hace ${i}s`, value: wComp, count: wTotal });
        }
        return stats;
    };
    const weeklyStats = getWeeklyStats();

    const handleExportCSV = () => {
        downloadCSV(filtered.map(i => ({
            empresa: i.company, ubicacion: i.location,
            fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
            resultado: i.ppeComplete ? 'EPP OK' : 'Falta EPP'
        })), 'camara_epp_historial', {
            empresa: 'Empresa', ubicacion: 'Ubicación', fecha: 'Fecha', resultado: 'Resultado'
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
                title={`Inspección EPP IA - ${shareItem?.company || ''}`}
                text={shareItem ? `📸 Inspección de EPP con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n🛡️ Resultado: ${shareItem.ppeComplete ? '✅ EPP OK' : '⚠️ Falta EPP'}` : ''}
                rawMessage={shareItem ? `📸 Inspección de EPP con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n🛡️ Resultado: ${shareItem.ppeComplete ? '✅ EPP OK' : '⚠️ Falta EPP'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Inspeccion_EPP_${shareItem?.company || 'Sin_Nombre'}.pdf`}
            />

            {typeof document !== 'undefined' && createPortal(
                <div className="ats-pdf-offscreen">
                    {shareItem && <AiReportPdfGenerator item={shareItem} />}
                </div>,
                document.body
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 900, lineHeight: 1.2 }}>Cámara IA (EPP)</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Detección y cumplimiento de EPP</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.8rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', color: 'var(--color-text)' }}>
                            <Download size={16} /> EXPORTAR
                        </button>
                    )}
                    <button 
                        onClick={() => navigate('/ai-camera')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem', background: 'var(--color-primary)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(var(--color-primary-rgb), 0.3)' }}
                    >
                        <Camera size={20} /> NUEVA DETECCIÓN
                    </button>
                </div>
            </div>

            {total > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#06b6d4' }}>{total}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>ESCANEO EPP</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{compliance}%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>COMPLIANCE</div>
                        </div>
                        <div style={{ background: eppFail > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${eppFail > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: eppFail > 0 ? '#ef4444' : '#10b981' }}>{eppFail}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>SIN EPP</div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.2rem', background: 'var(--color-surface)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>Tendencia de Compliance (últimas 6 semanas)</h3>
                            <BarChart2 size={16} color="var(--color-text-muted)" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', gap: '8px', padding: '0 5px' }}>
                            {weeklyStats.map((s, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ position: 'relative', width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--color-background)', borderRadius: '4px', opacity: 0.5 }} />
                                        <div style={{
                                            width: '100%',
                                            height: `${s.value}%`,
                                            background: s.value > 80 ? '#10b981' : (s.value > 50 ? '#f59e0b' : '#ef4444'),
                                            borderRadius: '4px',
                                            zIndex: 1,
                                            transition: 'height 1s ease-out'
                                        }} title={`${s.value}% compliance (${s.count} insp)`} />
                                    </div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
                                </div>
                            ))}
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
                                    <div style={{ width: '48px', height: '48px', background: 'rgba(6,182,212,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                                        <Camera size={24} />
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
                                    background: item.ppeComplete ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: item.ppeComplete ? '#10b981' : '#ef4444',
                                    flexShrink: 0
                                }}>
                                    {item.ppeComplete ? <ShieldCheck size={16} /> : <TriangleAlert size={16} />}
                                    {item.ppeComplete ? 'EPP OK' : 'Falta EPP'}
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
                                        
                                        setTimeout(() => {
                                            const element = document.getElementById('pdf-content');
                                            if (!element) return;
                                            document.body.classList.add('printing-isolated');
                                            element.classList.add('isolated-print-target');
                                            window.print();
                                            document.body.classList.remove('printing-isolated');
                                            element.classList.remove('isolated-print-target');
                                            setShareItem(null);
                                        }, 500);
                                    }}
                                    style={{ flex: 1, padding: '0.8rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 800 }}
                                    title="Imprimir PDF"
                                >
                                    <Share2 size={18} /> <span style={{ marginLeft: '0.3rem' }}>PDF</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `Inspección EPP — ${item.company || 'IA'}` });
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
                        <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--color-text)' }}>No hay inspecciones EPP</h3>
                        <p>No se registraron inspecciones de EPP todavía.</p>
                        <button onClick={() => navigate('/ai-camera')} className="btn-primary" style={{ marginTop: '1.5rem', borderRadius: '12px', padding: '0.8rem 1.5rem' }}>
                            Iniciar Primer Escaneo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
