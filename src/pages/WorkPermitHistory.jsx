import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, Building2,
    Trash2, Eye, FileText, Printer, Share2,
    Plus, HardHat, Construction
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { permitTypes } from '../data/workPermits';

export default function WorkPermitHistory() {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('work_permits_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este permiso?')) {
            const updated = history.filter(h => h.id !== id);
            setHistory(updated);
            localStorage.setItem('work_permits_history', JSON.stringify(updated));
            await syncCollection('work_permits_history', updated);
            toast.success('Permiso eliminado');
        }
    };

    const filteredHistory = history.filter(h =>
        h.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (permitTypes.find(t => t.id === h.tipoPermiso)?.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '900px', paddingBottom: '8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Historial de Permisos</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Registro de tareas críticas</p>
                </div>
                <button
                    onClick={() => navigate('/work-permit')}
                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> NUEVO
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa, obra o tipo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '20px', border: '1px dashed var(--color-border)' }}>
                        <Construction size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>No se encontraron permisos registrados.</p>
                    </div>
                ) : (
                    filteredHistory.map(item => (
                        <div key={item.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={12} /> {item.fecha}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 800 }}>{item.empresa}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Building2 size={14} /> {item.obra}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navigate('/work-permit', { state: { editData: item } })} style={{ padding: '0.6rem', background: 'var(--color-background)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-text)' }}>
                                    <Eye size={18} />
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`🔐 Permiso de Trabajo\n🏗️ Empresa: ${item.empresa}\n🚧 Obra: ${item.obra}\n📅 Fecha: ${item.fecha}\n📋 Tipo: ${permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS con IA\n🔗 https://asistentehs-b594e.web.app`)}`}
                                    target="_blank" rel="noreferrer"
                                    style={{ padding: '0.6rem 0.8rem', background: '#dcfce7', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none' }}
                                >
                                    <Share2 size={16} /> WA
                                </a>
                                <button onClick={() => handleDelete(item.id)} style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
