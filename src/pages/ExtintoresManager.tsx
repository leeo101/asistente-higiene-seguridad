import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck,
    Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';

export default function ExtintoresManager() {
    const navigate = useNavigate();
    const { requirePro } = usePaywall();
    const { syncCollection } = useSync();
    
    const [extintores, setExtintores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);

    const [formData, setFormData] = useState({
        numero: '',
        tipo: 'ABC',
        capacidad: '5 kg',
        ubicacion: '',
        marca: '',
        vencimientoRecarga: '',
        vencimientoPH: '',
        estadoFisico: 'Operativo',
        foto: null
    });

    const handlePhotoUpload = (files) => {
        if (!files.length) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({...formData, foto: reader.result});
        };
        reader.readAsDataURL(files[0]);
    };

    useEffect(() => {
        const loadData = async () => {
            const dataRaw = localStorage.getItem('extintores_inventory');
            if (dataRaw) {
                setExtintores(JSON.parse(dataRaw));
            }
        };
        loadData();
    }, []);

    const saveToStorage = async (data) => {
        localStorage.setItem('extintores_inventory', JSON.stringify(data));
        setExtintores(data);
        await syncCollection('extintores_inventory', data);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const newEntry = { ...formData, id: editingId || Date.now().toString(), updatedAt: new Date().toISOString() };
        let updated;
        if (editingId) {
            updated = extintores.map(ext => ext.id === editingId ? newEntry : ext);
            toast.success('Extintor actualizado con éxito');
        } else {
            updated = [newEntry, ...extintores];
            toast.success('Extintor registrado con éxito');
        }
        await saveToStorage(updated);
        setShowForm(false);
        setEditingId(null);
        setFormData({ numero: '', tipo: 'ABC', capacidad: '5 kg', ubicacion: '', marca: '', vencimientoRecarga: '', vencimientoPH: '', estadoFisico: 'Operativo', foto: null });
    };

    const handleEdit = (ext) => {
        setFormData(ext);
        setEditingId(ext.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este extintor del inventario?')) {
            const updated = extintores.filter(ext => ext.id !== id);
            await saveToStorage(updated);
            toast.success('Extintor eliminado');
        }
    };

    const generateQR = async (ext) => {
        try {
            const link = `${window.location.origin}/extintores/inspect/${ext.id}`;
            const url = await QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
            setQrData({ ext, url, link });
            setShowQrModal(true);
        } catch (err) {
            toast.error('Error al generar QR');
            console.error(err);
        }
    };

    // Calculate expiration status
    const getExpirationStatus = (dateStr) => {
        if (!dateStr) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} /> };
        const d = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { color: '#ef4444', label: 'Vencido', bg: '#fee2e2', icon: <AlertTriangle size={14} /> };
        if (diffDays <= 30) return { color: '#f59e0b', label: 'Por vencer', bg: '#fef3c7', icon: <AlertTriangle size={14} /> };
        return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} /> };
    };

    const filtered = extintores.filter(e => 
        e.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const types = ['ABC', 'CO2', 'K', 'Agua', 'HCFC', 'Espuma'];
    
    return (
        <div className="container" style={{ maxWidth: '1200px', paddingBottom: '8rem' }}>
            <Breadcrumbs />

            <PremiumHeader
                title="Gestor de Extintores"
                subtitle="Inventario, trazabilidad NFPA 10 y Códigos QR"
                icon={<Flame size={36} />}
            />

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => requirePro(() => setShowForm(true))}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Plus size={18} /> NUEVO EQUIPO
                </button>
            </div>

            {showForm ? (
                <div className="card animate-fade-in" style={{ padding: '2rem', border: '2px solid var(--color-primary)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', marginTop: 0 }}>
                        <Flame size={24} /> {editingId ? 'Editar Extintor' : 'Registrar Nuevo Extintor'}
                    </h2>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Nº CHAPA / ID</label>
                                <input required type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: EXT-01" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>TIPO DE AGENTE</label>
                                <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-background)' }}>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>CAPACIDAD</label>
                                <input type="text" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: 5 kg" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>UBICACIÓN FÍSICA</label>
                                <input required type="text" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: Pasillo principal 1er piso" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>VENCIMIENTO RECARGA</label>
                                <input required type="date" value={formData.vencimientoRecarga} onChange={e => setFormData({...formData, vencimientoRecarga: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>PRUEBA HIDRÁULICA (P.H.)</label>
                                <input type="date" value={formData.vencimientoPH} onChange={e => setFormData({...formData, vencimientoPH: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>FOTO DEL EQUIPO (OPCIONAL)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label style={{ padding: '0.8rem 1.5rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px dashed rgba(37,99,235,0.3)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                                        <Camera size={20} /> Subir Foto
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e.target.files)} />
                                    </label>
                                    {formData.foto && (
                                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--color-border)' }}>
                                            <img src={formData.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Extintor" />
                                            <button type="button" onClick={() => setFormData({...formData, foto: null})} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Guardar Equipo</button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Nº de chapa, tipo o ubicación..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {filtered.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '20px', border: '2px dashed var(--color-border)' }}>
                                <Flame size={48} color="var(--color-text-muted)" style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
                                <h3 style={{ margin: 0, color: 'var(--color-text)' }}>No hay extintores registrados</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Añadí tu primer equipo para comenzar la gestión inteligente.</p>
                            </div>
                        ) : (
                            filtered.map(ext => {
                                const recargaStatus = getExpirationStatus(ext.vencimientoRecarga);
                                const phStatus = getExpirationStatus(ext.vencimientoPH);

                                return (
                                    <div key={ext.id} className="card hover:shadow-md transition-all" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {ext.foto ? (
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--color-border)', flexShrink: 0 }}>
                                                        <img src={ext.foto} alt="Extintor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Flame size={24} color="#ef4444" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 900 }}>
                                                        {ext.numero}
                                                    </h3>
                                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.2rem' }}>
                                                        {ext.tipo} - {ext.capacidad}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => requirePro(() => generateQR(ext))} title="Código QR" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <QrCode size={18} />
                                                </button>
                                                <button onClick={() => handleEdit(ext)} title="Editar" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }} className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                                    <Edit3 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-background)', padding: '0.6rem', borderRadius: '8px' }}>
                                            <MapPin size={16} /> 
                                            <span style={{ fontWeight: 600 }}>{ext.ubicacion}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px dashed var(--color-border)' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>RECARGA ANUAL</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: recargaStatus.color, background: recargaStatus.bg, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                    {recargaStatus.icon} {ext.vencimientoRecarga ? new Date(ext.vencimientoRecarga).toLocaleDateString('es-AR') : '-'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>P.H. (5 AÑOS)</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: phStatus.color, background: phStatus.bg, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                    {phStatus.icon} {ext.vencimientoPH ? new Date(ext.vencimientoPH).toLocaleDateString('es-AR') : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                            <button onClick={() => navigate(`/extintores/inspect/${ext.id}`)} style={{ flex: 1, padding: '0.6rem', background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb), 0.2)', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} className="hover:bg-[rgba(var(--color-primary-rgb),0.15)]">
                                                <ShieldCheck size={16} /> INSPECCIONAR
                                            </button>
                                            <button onClick={() => handleDelete(ext.id)} style={{ padding: '0.6rem', marginLeft: '0.5rem', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Eliminar">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* QR Modal */}
            {showQrModal && qrData && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <button onClick={() => setShowQrModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-background)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        
                        <h3 style={{ margin: 0, color: 'var(--color-text)', fontWeight: 900, fontSize: '1.4rem' }}>{qrData.ext.numero}</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{qrData.ext.tipo} - {qrData.ext.ubicacion}</p>
                        
                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                            <img src={qrData.url} alt="QR Extintor" style={{ width: '200px', height: '200px', display: 'block' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => {
                                const a = document.createElement('a');
                                a.href = qrData.url;
                                a.download = `QR_${qrData.ext.numero}.png`;
                                a.click();
                            }} style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Printer size={18} /> DESCARGAR QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
