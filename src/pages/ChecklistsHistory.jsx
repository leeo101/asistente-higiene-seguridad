import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, FileText, Calendar, Building2, ClipboardCheck, Share2, Download } from 'lucide-react';
import { downloadCSV } from '../services/exportCsv';
import { useSync } from '../contexts/SyncContext';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', padding: '2rem',
                maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: '#0f172a' }}>¿Eliminar checklist?</h3>
                <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'white' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function ChecklistsHistory() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const historyRaw = localStorage.getItem('tool_checklists_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('tool_checklists_history', JSON.stringify(updated));
        syncCollection('tool_checklists_history', updated);
        localStorage.removeItem(`checklist_${deleteTarget}`);
        setDeleteTarget(null);
    };

    const filteredHistory = history.filter(item =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        downloadCSV(filteredHistory.map(i => {
            const stored = localStorage.getItem(`checklist_${i.id}`);
            let status = 'Aprobado';
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const items = parsed.items || parsed.checks || parsed || [];
                    const arr = Array.isArray(items) ? items : Object.values(items);
                    const nok = arr.filter(c => c.value === 'NO' || c.estado === 'NO' || c.checked === false || c.result === 'no').length;
                    const obs = arr.filter(c => c.observation || c.observacion).length;
                    if (arr.length === 0) status = 'Vacío';
                    else if (nok > 0) status = 'Rechazado';
                    else if (obs > 0) status = 'Condicionado';
                } catch { /* defaults to Aprobado */ }
            }
            return {
                id: i.id,
                fecha: new Date(i.fecha).toLocaleDateString('es-AR'),
                equipo: i.equipo,
                marca: i.marca,
                modelo: i.modelo,
                serial: i.serial,
                empresa: i.empresa,
                estado: status
            };
        }), 'checklists_herramientas', {
            id: 'ID Lista',
            fecha: 'Fecha Inspección',
            equipo: 'Equipo / Herramienta',
            marca: 'Marca',
            modelo: 'Modelo',
            serial: 'Número de Serie',
            empresa: 'Empresa',
            estado: 'Estado General'
        }, 'Reporte de Checklists y Herramientas');
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Historial de Checklists</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Controles de herramientas y maquinaria</p>
                </div>
                {filteredHistory.length > 0 && (
                    <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', color: 'white', flexShrink: 0, boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                        <Download size={14} /> Descargar Excel
                    </button>
                )}
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por equipo, empresa o serial..."
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
                    filteredHistory.map((item) => {
                        // Compute status badge from stored checklist items
                        const stored = localStorage.getItem(`checklist_${item.id}`);
                        let badgeLabel = 'Sin datos';
                        let badgeColor = '#64748b';
                        let badgeBg = 'rgba(100,116,139,0.1)';
                        if (stored) {
                            try {
                                const parsed = JSON.parse(stored);
                                const items = parsed.items || parsed.checks || parsed || [];
                                const arr = Array.isArray(items) ? items : Object.values(items);
                                const total = arr.length;
                                const nok = arr.filter(c => c.value === 'NO' || c.estado === 'NO' || c.checked === false || c.result === 'no').length;
                                const obs = arr.filter(c => c.observation || c.observacion).length;
                                if (total === 0) { badgeLabel = 'Vacío'; }
                                else if (nok > 0) { badgeLabel = 'Rechazado'; badgeColor = '#ef4444'; badgeBg = 'rgba(239,68,68,0.1)'; }
                                else if (obs > 0) { badgeLabel = 'Con Obs.'; badgeColor = '#f59e0b'; badgeBg = 'rgba(245,158,11,0.1)'; }
                                else { badgeLabel = 'Aprobado'; badgeColor = '#10b981'; badgeBg = 'rgba(16,185,129,0.1)'; }
                            } catch { badgeLabel = 'Aprobado'; badgeColor = '#10b981'; badgeBg = 'rgba(16,185,129,0.1)'; }
                        } else {
                            badgeLabel = 'Aprobado'; badgeColor = '#10b981'; badgeBg = 'rgba(16,185,129,0.1)';
                        }
                        return (
                            <div key={item.id} className="card" style={{ padding: '1.2rem', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                        <div style={{ width: '45px', height: '45px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                            <ClipboardCheck size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.equipo || 'Equipo sin nombre'}</h3>
                                                <span style={{
                                                    background: badgeBg, color: badgeColor,
                                                    border: `1px solid ${badgeColor}44`,
                                                    borderRadius: '20px', padding: '0.15rem 0.55rem',
                                                    fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap'
                                                }}>{badgeLabel}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                <Calendar size={14} /> {new Date(item.fecha).toLocaleDateString()} - <Building2 size={14} /> {item.empresa}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, flexShrink: 0 }}>
                                        #{item.serial}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                    <button
                                        onClick={() => navigate(`/checklists?id=${item.id}`)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                    >
                                        <FileText size={16} /> Ver / Editar
                                    </button>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`📋 Checklist de Seguridad\n🔧 Equipo: ${item.equipo}\n🏗️ Empresa: ${item.empresa}\n📅 Fecha: ${new Date(item.fecha).toLocaleDateString()}\n#${item.serial}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS con IA\n🔗 https://asistentehs.com`)}`}
                                        target="_blank" rel="noreferrer"
                                        style={{ padding: '0.6rem 0.9rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                                    >
                                        <Share2 size={15} /> WA
                                    </a>
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
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <ClipboardCheck size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No se encontraron registros de Checklists.</p>
                        <button onClick={() => navigate('/checklists')} className="btn-primary" style={{ marginTop: '1rem' }}>Realizar Control Nuevo</button>
                    </div>
                )}
            </div>
        </div>
    );
}
