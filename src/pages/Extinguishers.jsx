
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
    ArrowLeft, Plus, Search, Flame, AlertCircle, Calendar, MapPin,
    ShieldCheck, TriangleAlert, Edit2, Trash2, Printer, FileText, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';

// Utility for calculating dates
const addMonths = (dateString, months) => {
    const d = new Date(dateString + 'T12:00:00Z');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };

    const dueDate = addMonths(lastDate, monthsValid);
    const today = new Date().toISOString().split('T')[0];

    const tCurrent = new Date(today).getTime();
    const tDue = new Date(dueDate).getTime();
    const diffDays = Math.ceil((tDue - tCurrent) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', color: '#ef4444', text: 'Vencido', diffDays };
    if (diffDays <= 30) return { status: 'warning', color: '#f59e0b', text: 'Próximo a Vencer', diffDays };
    return { status: 'valid', color: '#10b981', text: 'Vigente', diffDays };
};

export default function Extinguishers() {
    useDocumentTitle('Control de Extintores');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection, syncPulse } = useSync();

    const [extinguishers, setExtinguishers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [companyFilter, setCompanyFilter] = useState('');

    const [formData, setFormData] = useState({
        chapa: '',
        ubicacion: '',
        tipo: 'Polvo Químico ABC',
        capacidad: '5 kg',
        empresa: '',
        ultimaCarga: '',
        ultimaPH: ''
    });

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
        setExtinguishers(stored);
    }, [syncPulse]);

    const handleSaveExtinguisher = () => {
        if (!formData.chapa || !formData.ubicacion) {
            toast.error('El número de chapa y la ubicación son obligatorios.');
            return;
        }

        let newList = [...extinguishers];
        if (editingId) {
            newList = newList.map(e => e.id === editingId ? { ...formData, id: editingId } : e);
            toast.success('Extintor actualizado.');
        } else {
            newList.push({ ...formData, id: Date.now() });
            toast.success('Extintor añadido.');
        }

        setExtinguishers(newList);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(newList));
        syncCollection('extinguishers_inventory', newList);
        closeModal();
    };

    const handleDelete = (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este extintor del inventario?')) return;

        const newList = extinguishers.filter(e => e.id !== id);
        setExtinguishers(newList);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(newList));
        syncCollection('extinguishers_inventory', newList);
    };

    const openModal = (extinguisher = null) => {
        if (extinguisher) {
            setFormData(extinguisher);
            setEditingId(extinguisher.id);
        } else {
            setFormData({
                chapa: '', ubicacion: '', tipo: 'Polvo Químico ABC', capacidad: '5 kg',
                empresa: companyFilter, ultimaCarga: '', ultimaPH: ''
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // Derived State
    const companies = [...new Set(extinguishers.map(e => e.empresa).filter(Boolean))];

    const filteredList = extinguishers.filter(e => {
        const matchSearch = String(e.chapa).toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCompany = companyFilter ? e.empresa === companyFilter : true;
        return matchSearch && matchCompany;
    });

    const stats = {
        total: filteredList.length,
        cargaVencida: filteredList.filter(e => getStatus(e.ultimaCarga, 12).status === 'expired').length,
        phVencida: filteredList.filter(e => getStatus(e.ultimaPH, 60).status === 'expired').length
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Control de Extintores</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => window.print()} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Printer size={18} /> Exportar
                        </button>
                        <button onClick={() => openModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Plus size={18} /> Nuevo
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid-3-cols" style={{ gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '12px' }}>
                            <Flame size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Total Operativos</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{stats.total}</div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: stats.cargaVencida > 0 ? '1px solid #ef4444' : '' }}>
                        <div style={{ padding: '0.8rem', background: stats.cargaVencida > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: stats.cargaVencida > 0 ? '#ef4444' : '#10b981', borderRadius: '12px' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: stats.cargaVencida > 0 ? '#ef4444' : 'var(--color-text-muted)', fontWeight: 700 }}>Cargas Vencidas</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stats.cargaVencida > 0 ? '#ef4444' : 'var(--color-text)' }}>{stats.cargaVencida}</div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: stats.phVencida > 0 ? '1px solid #ef4444' : '' }}>
                        <div style={{ padding: '0.8rem', background: stats.phVencida > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: stats.phVencida > 0 ? '#ef4444' : '#10b981', borderRadius: '12px' }}>
                            <TriangleAlert size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: stats.phVencida > 0 ? '#ef4444' : 'var(--color-text-muted)', fontWeight: 700 }}>PH Vencidas</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stats.phVencida > 0 ? '#ef4444' : 'var(--color-text)' }}>{stats.phVencida}</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por Nº de chapa o ubicación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px',
                                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                fontSize: '0.95rem', color: 'var(--color-text)', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <select
                        value={companyFilter}
                        onChange={e => setCompanyFilter(e.target.value)}
                        style={{ flex: '0 0 auto', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem' }}
                    >
                        <option value="">Todas las Empresas</option>
                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Table/List */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="hidden sm:grid" style={{ gridTemplateColumns: 'minmax(80px, 1fr) 2fr 1.5fr 2fr 2fr 100px', gap: '1rem', padding: '1rem', background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        <div>Nº Chapa</div>
                        <div>Ubicación</div>
                        <div>Tipo / Cap.</div>
                        <div>Vto. Carga (1 año)</div>
                        <div>Vto. P.H. (5 años)</div>
                        <div style={{ textAlign: 'center' }}>Acciones</div>
                    </div>

                    <div style={{ padding: '0.5rem 0' }}>
                        {filteredList.map(ext => {
                            const stCarga = getStatus(ext.ultimaCarga, 12);
                            const stPH = getStatus(ext.ultimaPH, 60);

                            return (
                                <div key={ext.id} className="responsive-list-card" style={{ padding: '1rem', margin: '0.5rem 1rem 1rem 1rem', display: 'flex', flexDirection: 'column' }}>
                                    {/* Desktop mapping uses grid, mobile uses stacked */}
                                    <div className="sm:grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'center' }}>
                                        {/* CSS to make it a row on desktop */}
                                        <style>{`@media (min-width: 640px) { .ext-row-${ext.id} { grid-template-columns: minmax(80px, 1fr) 2fr 1.5fr 2fr 2fr 100px !important; } }`}</style>

                                        <div className={`ext-row-${ext.id}`} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', alignItems: 'center' }}>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Nº Chapa</span>
                                                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-primary)' }}>#{ext.chapa}</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Ubicación</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                                    <MapPin size={16} style={{ color: 'var(--color-text-muted)' }} /> {ext.ubicacion}
                                                </div>
                                                {ext.empresa && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{ext.empresa}</div>}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Tipo / Cap.</span>
                                                <span style={{ fontWeight: 700 }}>{ext.tipo}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ext.capacidad}</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Vto. Carga</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stCarga.color }}></div>
                                                    <span style={{ color: stCarga.color, fontWeight: 800, fontSize: '0.95rem' }}>{stCarga.text}</span>
                                                </div>
                                                {ext.ultimaCarga && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Últ: {new Date(ext.ultimaCarga + 'T12:00:00Z').toLocaleDateString()}</div>}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Vto. P.H.</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stPH.color }}></div>
                                                    <span style={{ color: stPH.color, fontWeight: 800, fontSize: '0.95rem' }}>{stPH.text}</span>
                                                </div>
                                                {ext.ultimaPH && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Últ: {new Date(ext.ultimaPH + 'T12:00:00Z').toLocaleDateString()}</div>}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.5rem' }} className="sm:justify-center sm:mt-0">
                                                <button onClick={() => openModal(ext)} style={{ padding: '0.5rem 1rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700, flex: 1 }} className="sm:flex-none sm:p-2">
                                                    <Edit2 size={16} /> <span className="sm:hidden" style={{ marginLeft: '4px' }}>Editar</span>
                                                </button>
                                                <button onClick={() => handleDelete(ext.id)} style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontWeight: 700, flex: 1 }} className="sm:flex-none sm:p-2">
                                                    <Trash2 size={16} /> <span className="sm:hidden" style={{ marginLeft: '4px' }}>Borrar</span>
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {filteredList.length === 0 && (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Flame size={48} style={{ opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                                No hay extintores registrados para estos filtros.
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de Carga / Edición */}
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                                {editingId ? 'Editar Extintor' : 'Ingresar Nuevo Extintor'}
                            </h2>

                            <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                <div>
                                    <label>Nº de Chapa / ID</label>
                                    <input type="text" value={formData.chapa} onChange={e => setFormData({ ...formData, chapa: e.target.value })} placeholder="Ej. 1045" style={{ fontWeight: 'bold' }} />
                                </div>
                                <div>
                                    <label>Empresa / Cliente (Opc.)</label>
                                    <input type="text" value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} placeholder="Ej. Planta Sur" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Ubicación Específica</label>
                                    <input type="text" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Ej. Taller Mantenimiento, Pasillo Principal..." />
                                </div>

                                <div>
                                    <label>Agente Extintor (Tipo)</label>
                                    <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                        <option value="Polvo Químico ABC">Polvo Químico ABC</option>
                                        <option value="CO2 (B-C)">CO2 (B-C)</option>
                                        <option value="Agua (A)">Agua (A)</option>
                                        <option value="Agua AFFF (A-B)">Agua AFFF (A-B)</option>
                                        <option value="Haloclean / HCFC">Haloclean / HCFC</option>
                                        <option value="Acetato de Potasio (K)">Acetato de Potasio (K)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Capacidad</label>
                                    <input type="text" value={formData.capacidad} onChange={e => setFormData({ ...formData, capacidad: e.target.value })} placeholder="Ej. 5 kg, 10 lbs..." />
                                </div>

                                <div style={{ gridColumn: '1 / -1', background: 'var(--color-background)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                        <Calendar size={18} /> Fechas de Último Servicio
                                    </h3>
                                    <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                        <div>
                                            <label>Última Recarga (Carga)</label>
                                            <input type="date" value={formData.ultimaCarga} onChange={e => setFormData({ ...formData, ultimaCarga: e.target.value })} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>* Vence a los 12 meses.</span>
                                        </div>
                                        <div>
                                            <label>Última Prueba Hidráulica</label>
                                            <input type="date" value={formData.ultimaPH} onChange={e => setFormData({ ...formData, ultimaPH: e.target.value })} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>* Vence a los 5 años (60 m).</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn-outline" onClick={closeModal} style={{ margin: 0, padding: '0.8rem 1.5rem' }}>
                                    Cancelar
                                </button>
                                <button className="btn-primary" onClick={handleSaveExtinguisher} style={{ margin: 0, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={18} /> Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="print-only">
                <ExtinguisherPdfGenerator extinguishers={filteredList} />
            </div>
        </div>
    );
}
