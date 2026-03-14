import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, ShieldCheck, TriangleAlert, Share2, Info, FileText, QrCode, Download, BarChart2 } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';

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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar informe?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function AICameraHistory() {
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
            // Filtrar registros inválidos/corruptos
            const valid = parsed.filter(item => {
                if (!item || !item.id) return false;
                if (!item.date) return false;

                const company = String(item.company || '').trim();
                const location = String(item.location || '').trim();

                // Si ambos están vacíos o contienen 'undefined' literal, son corruptos
                const isBadCompany = !company || company === 'undefined' || company === 'null';
                const isBadLocation = !location || location === 'undefined' || location === 'null';

                if (isBadCompany && isBadLocation) return false;

                return true;
            });
            // Auto-cleanup: quita registros inválidos del localStorage y Firebase
            if (valid.length !== parsed.length) {
                localStorage.setItem('ai_camera_history', JSON.stringify(valid));
                // Push cleaned array to cloud so it doesn't come back
                syncCollection('ai_camera_history', valid);
            }
            setHistory(valid);
        } catch {
            setHistory([]);
        }
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ai_camera_history', JSON.stringify(updated));
        
        // Cleanup the full report from storage to keep it lean
        localStorage.removeItem(`ai_report_full_${deleteTarget}`);
        
        syncCollection('ai_camera_history', updated);
        setDeleteTarget(null);
    };

    const filtered = history.filter(item =>
        item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = history.length;
    const eppOk = history.filter(i => i.ppeComplete).length;
    const eppFail = history.filter(i => i.ppeComplete === false).length;
    const compliance = total > 0 ? Math.round((eppOk / Math.max(eppOk + eppFail, 1)) * 100) : 0;

    // Weekly stats for the chart
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
            resultado: i.ppeComplete ? 'EPP OK' : (i.type === 'general_risks' ? 'Entorno' : 'Falta EPP')
        })), 'camara_ia_historial', {
            empresa: 'Empresa', ubicacion: 'Ubicación', fecha: 'Fecha', resultado: 'Resultado'
        });
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Inspección IA - ${shareItem?.company || ''}`}
                text={shareItem ? `📸 Inspección Visual con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n📍 Tipo: ${shareItem.type === 'general_risks' ? 'Riesgos Generales' : 'Verificación EPP'}\n🛡️ Resultado: ${shareItem.type === 'general_risks' ? 'Análisis de entorno' : (shareItem.ppeComplete ? '✅ EPP OK' : '⚠️ Falta EPP')}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <AiReportPdfGenerator item={shareItem} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Cámara IA</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Inspecciones visuales</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                            <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/ai-camera')}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                    >
                        <Camera size={18} /> <span className="hidden sm:inline">NUEVO</span>
                    </button>
                </div>
            </div>

            {/* Stats panel */}
            {total > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06b6d4' }}>{total}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>INSPECCIONES</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{compliance}%</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>COMPLIANCE EPP</div>
                        </div>
                        <div style={{ background: eppFail > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${eppFail > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: '12px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: eppFail > 0 ? '#ef4444' : '#10b981' }}>{eppFail}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>SIN EPP</div>
                        </div>
                    </div>

                    {/* Weekly Chart */}
                    <div className="card" style={{ padding: '1.2rem', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>Tendencia de Compliance (últimas 6 semanas)</h3>
                            <BarChart2 size={16} color="var(--color-text-muted)" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', gap: '8px', padding: '0 5px' }}>
                            {weeklyStats.map((s, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ position: 'relative', width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                                        {/* Background track */}
                                        <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--color-background)', borderRadius: '4px', opacity: 0.5 }} />
                                        {/* Value bar */}
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
                        width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px', border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)', fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length > 0 ? (
                    filtered.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(6,182,212,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                                        <Camera size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.company || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString()} — <Building2 size={14} /> {item.location}
                                        </div>
                                    </div>
                                </div>
                                {item.type === 'general_risks' ? (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        fontSize: '0.75rem', fontWeight: 700,
                                        padding: '0.3rem 0.7rem', borderRadius: '20px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        flexShrink: 0
                                    }}>
                                        <Info size={14} />
                                        ENTORNO
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        fontSize: '0.75rem', fontWeight: 700,
                                        padding: '0.3rem 0.7rem', borderRadius: '20px',
                                        background: item.ppeComplete ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: item.ppeComplete ? '#10b981' : '#ef4444',
                                        flexShrink: 0
                                    }}>
                                        {item.ppeComplete ? <ShieldCheck size={14} /> : <TriangleAlert size={14} />}
                                        {item.ppeComplete ? 'EPP OK' : 'Falta EPP'}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => {
                                        const fullReportKey = `ai_report_full_${item.id}`;
                                        const savedFull = localStorage.getItem(fullReportKey);
                                        const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                                        localStorage.setItem('current_ai_inspection', JSON.stringify(reportToLoad));
                                        navigate('/ai-report');
                                    }}
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <FileText size={16} /> Ver Reporte
                                </button>
                                <button
                                    onClick={() => navigate('/ai-camera')}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <Camera size={16} /> Re-inspección
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                                        setQrTarget({ text: url, title: `Inspección — ${item.company || 'IA'}` });
                                    }}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={16} />
                                </button>
                                <button
                                    onClick={() => setShareItem(item)}
                                    style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', minWidth: '40px' }}
                                    title="Compartir"
                                >
                                    <Share2 size={16} /> <span className="hidden sm:inline" style={{ marginLeft: '0.3rem', fontWeight: 700, fontSize: '0.75rem' }}>Compartir</span>
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay inspecciones guardadas.</p>
                        <button onClick={() => navigate('/ai-camera')} className="btn-primary" style={{ marginTop: '1rem' }}>
                            Realizar Primera Inspección
                        </button>
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
