import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, HardHat, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSync } from '../contexts/SyncContext';
import { downloadCSV } from '../services/exportCsv';

const EPP_TYPES = [
    'Casco de seguridad', 'Calzado de seguridad', 'Guantes de trabajo',
    'Lentes de seguridad', 'Protector auditivo', 'Arnés de seguridad',
    'Chaleco reflectivo', 'Mascarilla / Respirador', 'Careta facial',
    'Ropa ignífuga', 'Botas de goma', 'Rodilleras', 'Otro'
];

function getDaysUntilExpiry(purchaseDate, lifeMonths) {
    if (!purchaseDate || !lifeMonths) return null;
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + Number(lifeMonths));
    return Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }) {
    if (days === null) return null;
    if (days < 0) return (
        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={11} /> VENCIDO
        </span>
    );
    if (days <= 30) return (
        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={11} /> {days}d restantes
        </span>
    );
    return (
        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={11} /> Vigente · {days}d
        </span>
    );
}

const EMPTY_FORM = { type: '', custom: '', responsible: '', purchaseDate: '', lifeMonths: '' };

export default function PPETracker() {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        const saved = localStorage.getItem('ppe_items');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    const save = async (updated) => {
        setItems(updated);
        localStorage.setItem('ppe_items', JSON.stringify(updated));
        await syncCollection('ppe_items', updated);
    };

    const handleAdd = () => {
        if (!form.type) { toast.error('Seleccioná un tipo de EPP'); return; }
        if (!form.purchaseDate) { toast.error('Ingresá la fecha de compra/entrega'); return; }
        const newItem = {
            id: Date.now(),
            type: form.type === 'Otro' ? (form.custom || 'Otro') : form.type,
            responsible: form.responsible,
            purchaseDate: form.purchaseDate,
            lifeMonths: form.lifeMonths || 12,
            addedAt: new Date().toISOString()
        };
        save([newItem, ...items]);
        setForm(EMPTY_FORM);
        setShowForm(false);
        toast.success('EPP registrado');
    };

    const handleDelete = (id) => {
        save(items.filter(i => i.id !== id));
        toast.success('EPP eliminado');
    };

    const handleExport = () => {
        downloadCSV(items, 'ppe_tracker', {
            type: 'Tipo de EPP', responsible: 'Responsable',
            purchaseDate: 'Fecha Compra/Entrega', lifeMonths: 'Vida Útil (meses)'
        });
    };

    const expired = items.filter(i => getDaysUntilExpiry(i.purchaseDate, i.lifeMonths) < 0).length;
    const expiring = items.filter(i => { const d = getDaysUntilExpiry(i.purchaseDate, i.lifeMonths); return d !== null && d >= 0 && d <= 30; }).length;

    return (
        <div className="container" style={{ maxWidth: '700px', paddingBottom: '4rem', paddingTop: '6rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '0.5rem' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🦺 Control de EPP</h1>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Vencimientos de elementos de protección personal</p>
                </div>
                {items.length > 0 && (
                    <button onClick={handleExport} style={{ background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', color: 'white', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                        Descargar Excel
                    </button>
                )}
            </div>

            {/* Alert summary */}
            {(expired > 0 || expiring > 0) && (
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {expired > 0 && (
                        <div style={{ flex: 1, minWidth: '140px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <AlertTriangle size={20} color="#ef4444" />
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ef4444' }}>{expired}</div><div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>VENCIDOS</div></div>
                        </div>
                    )}
                    {expiring > 0 && (
                        <div style={{ flex: 1, minWidth: '140px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Clock size={20} color="#f59e0b" />
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>{expiring}</div><div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>POR VENCER</div></div>
                        </div>
                    )}
                </div>
            )}

            {/* Add form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Registrar nuevo EPP</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                        <div>
                            <label>Tipo de EPP</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="">— Seleccioná —</option>
                                {EPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        {form.type === 'Otro' && (
                            <div>
                                <label>Descripción</label>
                                <input value={form.custom} onChange={e => setForm({ ...form, custom: e.target.value })} placeholder="Ej: Pantalla de soldadura" />
                            </div>
                        )}
                        <div>
                            <label>Responsable</label>
                            <input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} placeholder="Nombre del trabajador" />
                        </div>
                        <div>
                            <label>Fecha compra / entrega</label>
                            <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                        </div>
                        <div>
                            <label>Vida útil (meses)</label>
                            <input type="number" min="1" max="120" value={form.lifeMonths} onChange={e => setForm({ ...form, lifeMonths: e.target.value })} placeholder="12" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={handleAdd} className="btn-primary" style={{ flex: 2, minWidth: '120px', margin: 0 }}>Guardar EPP</button>
                        <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} style={{ flex: 1, minWidth: '100px', padding: '0.75rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.85rem', borderRadius: '14px', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.92rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}
                >
                    <Plus size={18} /> Registrar EPP
                </button>
            )}

            {/* List */}
            {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <Shield size={48} style={{ opacity: 0.15, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                    <p style={{ fontWeight: 600 }}>Sin EPPs registrados.</p>
                    <p style={{ fontSize: '0.82rem' }}>Registrá los elementos de protección del equipo para controlar sus vencimientos.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {items.map(item => {
                        const days = getDaysUntilExpiry(item.purchaseDate, item.lifeMonths);
                        const isExpired = days !== null && days < 0;
                        return (
                            <div key={item.id} className="card" style={{ padding: '1rem 1.2rem', borderLeft: `4px solid ${isExpired ? '#ef4444' : days !== null && days <= 30 ? '#f59e0b' : '#10b981'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                            <HardHat size={16} color="var(--color-primary)" />
                                            <strong style={{ fontSize: '0.95rem' }}>{item.type}</strong>
                                            <StatusBadge days={days} />
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {item.responsible && <span>👤 {item.responsible}</span>}
                                            <span>📅 Entrega: {new Date(item.purchaseDate).toLocaleDateString('es-AR')}</span>
                                            <span>⏳ Vida útil: {item.lifeMonths} meses</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
