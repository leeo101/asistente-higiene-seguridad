import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, Building2,
    Trash2, Eye, FileText, Printer, Share2,
    Plus, KeySquare, Construction, Download, QrCode
} from 'lucide-react';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { permitTypes } from '../data/workPermits';

export default function WorkPermitHistory() {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [qrTarget, setQrTarget] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('work_permits_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const handleDelete = async (id) => {
        const toastId = toast(
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem' }}>¿Eliminar este permiso?</span>
                <button
                    onClick={async () => {
                        toast.dismiss(toastId);
                        const updated = history.filter(h => h.id !== id);
                        setHistory(updated);
                        localStorage.setItem('work_permits_history', JSON.stringify(updated));
                        await syncCollection('work_permits_history', updated);
                        toast.success('Permiso eliminado');
                    }}
                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                >Eliminar</button>
            </div>,
            { duration: 5000, icon: '🗑️' }
        );
    };

    const filteredHistory = history.filter(h =>
        h.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (permitTypes.find(t => t.id === h.tipoPermiso)?.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        downloadCSV(filteredHistory.map(i => ({
            id: i.id,
            fecha: i.fecha,
            empresa: i.empresa,
            obra: i.obra,
            tipo: permitTypes.find(t => t.id === i.tipoPermiso)?.label || 'Permiso',
            desde: i.validezDesde,
            hasta: i.validezHasta,
            creado: new Date(i.createdAt).toLocaleString('es-AR')
        })), 'permisos_de_trabajo', {
            id: 'ID Permiso',
            fecha: 'Fecha de Alta',
            empresa: 'Empresa',
            obra: 'Obra',
            tipo: 'Tipo de Tarea',
            desde: 'Hora de Inicio',
            hasta: 'Hora de Fin',
            creado: 'Fecha Sistema'
        }, 'Reporte de Permisos de Trabajo');
    };

    return (
        <div className="container" style={{ maxWidth: '900px', paddingBottom: '8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Permisos</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tareas críticas</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {filteredHistory.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)' }}>
                            <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/work-permit')}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">NUEVO</span>
                    </button>
                </div>
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
                        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '1.5rem' }}>No se encontraron permisos registrados.</p>
                        <button onClick={() => navigate('/work-permit')} className="btn-primary" style={{ margin: '0 auto' }}>Crear nuevo Permiso</button>
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
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => navigate('/work-permit', { state: { editData: item } })} style={{ padding: '0.6rem', background: 'var(--color-background)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-text)' }}>
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => setQrTarget({ text: `Permiso de Trabajo - ${item.empresa}\nObra: ${item.obra}\nFecha: ${item.fecha}\nTipo: ${permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}\n\nGenerado con Asistente HYS`, title: `Permiso — ${item.empresa}` })}
                                    style={{ padding: '0.6rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generar QR"
                                >
                                    <QrCode size={18} />
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`🔐 Permiso de Trabajo\n🏗️ Empresa: ${item.empresa}\n🚧 Obra: ${item.obra}\n📅 Fecha: ${item.fecha}\n📋 Tipo: ${permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS con IA\n🔗 https://asistentehs.com`)}`}
                                    target="_blank" rel="noreferrer"
                                    style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', minWidth: '40px' }}
                                    title="Compartir por WhatsApp"
                                >
                                    <Share2 size={16} /> <span className="hidden sm:inline" style={{ marginLeft: '0.3rem', fontWeight: 700, fontSize: '0.75rem' }}>WA</span>
                                </a>
                                <button onClick={() => handleDelete(item.id)} style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
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
