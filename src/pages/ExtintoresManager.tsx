import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck,
    Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera, Share2, Pencil
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';

export default function ExtintoresManager() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { requirePro } = usePaywall();
    const { syncCollection } = useSync();
    
    const [extintores, setExtintores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [shareItem, setShareItem] = useState(null);

    const [formData, setFormData] = useState({
        numero: '',
        numeroSerie: '',
        tipo: 'ABC',
        capacidad: '5 kg',
        ubicacion: '',
        empresa: '',
        marca: '',
        fechaFabricacion: '',
        vencimientoRecarga: '',
        vencimientoPH: '',
        selloIRAM: '',
        estadoFisico: 'Operativo',
        foto: null,
        showSignatures: { professional: true, supervisor: false, operator: false },
        operatorSignature: '',
        supervisorSignature: '',
        professionalSignature: '',
        professionalName: '',
        professionalLicense: ''
    });
    const [professionalData, setProfessionalData] = useState({ name: '', license: '', signature: null, stamp: null });

    useEffect(() => {
        try {
            const lsPersonal = localStorage.getItem('personalData');
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            
            let sig = null;
            let stamp = null;
            let name = 'Profesional HSE';
            let license = '';

            if (lsStamp) {
                const parsed = JSON.parse(lsStamp);
                sig = parsed.signature;
                stamp = parsed.stamp;
            } else if (legacySig) {
                sig = legacySig;
            }
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                name = pd.name || name;
                license = pd.license || license;
            }
            
            setProfessionalData({ name, license, signature: sig, stamp });
            setFormData(prev => ({
                ...prev,
                professionalSignature: sig,
                professionalName: name,
                professionalLicense: license
            }));
        } catch(e) {}
    }, []);

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
            const oldDataStr = localStorage.getItem('extinguishers_inventory');
            const newDataStr = localStorage.getItem('extintores_inventory');
            let combined = [];
            
            if (oldDataStr) {
                try { combined = [...combined, ...JSON.parse(oldDataStr)]; } catch(e) {}
            }
            
            if (newDataStr) {
                try {
                    const newData = JSON.parse(newDataStr);
                    const existingIds = new Set(combined.map((e: any) => e.id));
                    const uniqueNew = newData.filter((e: any) => !existingIds.has(e.id));
                    combined = [...combined, ...uniqueNew];
                    localStorage.setItem('extinguishers_inventory', JSON.stringify(combined));
                    localStorage.removeItem('extintores_inventory');
                } catch(e) {}
            }

            const migrated = combined.map((ext: any) => {
                return {
                    ...ext,
                    numero: ext.numero || ext.chapa || '',
                    vencimientoRecarga: ext.vencimientoRecarga || ext.ultimaCarga || '',
                    vencimientoPH: ext.vencimientoPH || ext.ultimaPH || ''
                };
            });
            setExtintores(migrated as any);
        };
        loadData();
    }, []);

    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && extintores.length > 0 && !showForm && !editingId) {
            const extToEdit = extintores.find(e => e.id === editId);
            if (extToEdit) {
                setFormData(extToEdit);
                setEditingId(editId);
                setShowForm(true);
            }
        }
    }, [searchParams, extintores, showForm, editingId]);

    const saveToStorage = async (data) => {
        localStorage.setItem('extinguishers_inventory', JSON.stringify(data));
        setExtintores(data);
        await syncCollection('extinguishers_inventory', data);
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
        setFormData({ numero: '', numeroSerie: '', tipo: 'ABC', capacidad: '5 kg', ubicacion: '', marca: '', fechaFabricacion: '', vencimientoRecarga: '', vencimientoPH: '', selloIRAM: '', estadoFisico: 'Operativo', foto: null, empresa: '', showSignatures: { professional: true, supervisor: false, operator: false }, operatorSignature: '', supervisorSignature: '', professionalSignature: '', professionalName: '', professionalLicense: '' });
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

    // Calculate 20 year lifespan status
    const getLifespanStatus = (fechaFab) => {
        if (!fechaFab) return null;
        const d = new Date(fechaFab);
        const limitDate = new Date(d);
        limitDate.setFullYear(limitDate.getFullYear() + 20);
        
        const today = new Date();
        const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { color: '#ffffff', label: 'DAR DE BAJA (Vida útil cumplida)', bg: '#dc2626', icon: <AlertTriangle size={14} /> };
        if (diffDays <= 180) return { color: '#f59e0b', label: 'Por vencer vida útil (20 años)', bg: '#fef3c7', icon: <AlertTriangle size={14} /> };
        return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} /> };
    };

    const filtered = extintores.filter(e => {
        const matchesSearch = e.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.tipo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa === '' || e.empresa === filterEmpresa;
        return matchesSearch && matchesEmpresa;
    });

    const uniqueEmpresas = [...new Set(extintores.map(e => e.empresa).filter(Boolean))];

    const types = ['ABC', 'CO2', 'K', 'Agua', 'HCFC', 'Espuma'];

    const expiredLifespans = extintores.filter(ext => {
        const st = getLifespanStatus(ext.fechaFabricacion);
        return st && (st.label.includes('DAR DE BAJA') || st.label.includes('Por vencer vida útil'));
    });

    return (
        <div className="container" style={{ maxWidth: '1200px', paddingBottom: '8rem' }}>
            <Breadcrumbs />

            <PremiumHeader
                title="Control de Matafuegos"
                subtitle="Inventario, trazabilidad NFPA 10 y Códigos QR"
                icon={<Flame size={36} />}
            />

            <ShareModal 
                isOpen={!!shareItem} 
                open={!!shareItem} 
                onClose={() => setShareItem(null)} 
                title={`Ficha Técnica - Extintor #${shareItem?.numero}`} 
                text={shareItem ? `📋 Ficha de Extintor\n🔥 Chapa: ${shareItem.numero}\n📍 Ubicación: ${shareItem.ubicacion}` : ''} 
                rawMessage={''} 
                elementIdToPrint="pdf-content" 
                fileName={`Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`} 
            />
            <style type="text/css">
                {`
                    .ext-print-wrapper {
                        position: fixed !important;
                        left: 200vw !important;
                        top: 0 !important;
                        width: 210mm !important;
                        z-index: -9999 !important;
                    }
                    @media print {
                        .ext-print-wrapper {
                            position: relative !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            z-index: auto !important;
                        }
                    }
                `}
            </style>
            <div className="ext-print-wrapper">
                <ExtinguisherProfilePdf data={shareItem || formData} isHeadless={true} />
            </div>

            {expiredLifespans.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                    <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <div>
                        <h4 style={{ margin: 0, color: '#991b1b', fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>Alerta de Vida Útil (20 años)</h4>
                        <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Tienes {expiredLifespans.length} extintor(es) que han superado o están a punto de superar los 20 años desde su fabricación. Según la normativa vigente, deben ser dados de baja definitivamente.
                        </p>
                    </div>
                </div>
            )}

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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>CLIENTE / EMPRESA</label>
                                <input type="text" value={formData.empresa || ''} onChange={e => setFormData({...formData, empresa: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: Empresa S.A." />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Nº DE SERIE (FABRICANTE)</label>
                                <input type="text" value={formData.numeroSerie} onChange={e => setFormData({...formData, numeroSerie: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: 12345678" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>MARCA</label>
                                <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: Georgia, Melisam..." />
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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>FECHA DE FABRICACIÓN</label>
                                <input type="date" value={formData.fechaFabricacion} onChange={e => setFormData({...formData, fechaFabricacion: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>VENCIMIENTO RECARGA</label>
                                <input required type="date" value={formData.vencimientoRecarga} onChange={e => setFormData({...formData, vencimientoRecarga: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>PRUEBA HIDRÁULICA (P.H.)</label>
                                <input type="date" value={formData.vencimientoPH} onChange={e => setFormData({...formData, vencimientoPH: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>SELLO IRAM / OPDS</label>
                                <input type="text" value={formData.selloIRAM} onChange={e => setFormData({...formData, selloIRAM: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Ej: 12345" />
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
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontWeight: 800, cursor: 'pointer', color: 'var(--color-text)' }}>Cancelar</button>
                            <button type="button" onClick={() => window.print()} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '2px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Printer size={18} /> Generar PDF
                            </button>
                            <button type="button" onClick={() => { setShareItem(formData); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '2px solid #3b82f6', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Share2 size={18} /> Compartir
                            </button>
                            <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)' }}>Guardar Equipo</button>
                        </div>

                        <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                                <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas en Ficha Técnica
                            </h3>

                            <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[
                                        { id: 'professional', label: 'Profesional (Tú)' },
                                        { id: 'supervisor', label: 'Supervisor / Responsable' },
                                        { id: 'operator', label: 'Operador / Sector' }
                                    ].map(sig => {
                                        const isChecked = formData.showSignatures?.[sig.id];
                                        return (
                                            <label
                                                key={sig.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.6rem 1.25rem',
                                                    background: isChecked ? 'var(--color-primary)' : 'rgba(var(--color-text-rgb), 0.05)',
                                                    color: isChecked ? '#fff' : 'var(--color-text-muted)',
                                                    border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                    borderRadius: '2rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isChecked ? '0 4px 12px rgba(var(--color-primary-rgb), 0.3)' : 'none'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => setFormData({ ...formData, showSignatures: { ...formData.showSignatures, [sig.id]: e.target.checked } as any })}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '4px',
                                                    border: `2px solid ${isChecked ? '#fff' : 'var(--color-text-muted)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: isChecked ? '#fff' : 'transparent'
                                                }}>
                                                    {isChecked && <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '2px' }} />}
                                                </div>
                                                {sig.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* On-Sheet Visual Preview */}
                            <div className="no-print" style={{ transform: 'scale(0.9)', transformOrigin: 'top center', opacity: 0.8, pointerEvents: 'none' }}>
                                <PdfSignatures 
                                    data={formData}
                                    box1={formData.showSignatures?.operator ? {
                                        title: 'OPERADOR',
                                        subtitle: 'Responsable de sector',
                                        signatureUrl: formData.operatorSignature || null,
                                        isProfessional: false
                                    } : null}
                                    box2={formData.showSignatures?.professional !== false ? {
                                        title: 'INSPECTOR / PROFESIONAL',
                                        subtitle: (professionalData.name || 'Profesional HSE').toUpperCase(),
                                        signatureUrl: professionalData.signature || formData.professionalSignature || null,
                                        stampUrl: professionalData.stamp || null,
                                        isProfessional: true,
                                        license: professionalData.license || formData.professionalLicense || null
                                    } : null}
                                    box3={formData.showSignatures?.supervisor ? {
                                        title: 'SUPERVISOR',
                                        subtitle: 'Aprobación HSE',
                                        signatureUrl: formData.supervisorSignature || null,
                                        isProfessional: false
                                    } : null}
                                />
                            </div>

                            <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                                {formData.showSignatures?.operator && (
                                    <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                        <SignatureCanvas 
                                            onSave={(sig) => setFormData(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                            initialImage={formData.operatorSignature}
                                            label="Firma del Operador / Sector"
                                        />
                                    </div>
                                )}
                                
                                {formData.showSignatures?.supervisor && (
                                    <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                        <SignatureCanvas 
                                            onSave={(sig) => setFormData(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                            initialImage={formData.supervisorSignature}
                                            label="Firma del Supervisor"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por Nº de chapa, tipo o ubicación..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                            />
                        </div>
                        <div style={{ flex: '0 1 250px' }}>
                            <select 
                                value={filterEmpresa} 
                                onChange={e => setFilterEmpresa(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: filterEmpresa ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                            >
                                <option value="">Todas las Empresas</option>
                                {uniqueEmpresas.map(emp => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
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
                                                    {ext.empresa && (
                                                        <div style={{ display: 'inline-block', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, marginTop: '0.2rem', border: '1px solid rgba(37,99,235,0.2)' }}>
                                                            {ext.empresa}
                                                        </div>
                                                    )}
                                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.3rem' }}>
                                                        {ext.tipo} - {ext.capacidad} {ext.marca ? `(${ext.marca})` : ''}
                                                    </p>
                                                    {ext.numeroSerie && (
                                                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.1rem' }}>
                                                            S/N: {ext.numeroSerie}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => requirePro(() => generateQR(ext))} title="Código QR" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <QrCode size={18} />
                                                </button>
                                                <button onClick={() => requirePro(() => setShareItem(ext))} title="Generar PDF" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: '#10b981' }} className="hover:bg-green-50 dark:hover:bg-green-900/30">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px dashed var(--color-border)' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>P.H. (5 AÑOS)</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: phStatus.color, background: phStatus.bg, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                    {phStatus.icon} {ext.vencimientoPH ? new Date(ext.vencimientoPH).toLocaleDateString('es-AR') : '-'}
                                                </span>
                                            </div>
                                            {ext.fechaFabricacion && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: (ext.inspections && ext.inspections.length > 0) ? '1px dashed var(--color-border)' : 'none' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>VIDA ÚTIL (20 AÑOS)</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: getLifespanStatus(ext.fechaFabricacion)?.color, background: getLifespanStatus(ext.fechaFabricacion)?.bg, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                        {getLifespanStatus(ext.fechaFabricacion)?.icon} {getLifespanStatus(ext.fechaFabricacion)?.label}
                                                    </span>
                                                </div>
                                            )}
                                            {ext.inspections && ext.inspections.length > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>ÚLTIMA INSPECCIÓN</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: ext.inspections[ext.inspections.length - 1].resultado === 'C' ? '#10b981' : '#ef4444', background: ext.inspections[ext.inspections.length - 1].resultado === 'C' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                        <ShieldCheck size={14} /> {new Date(ext.inspections[ext.inspections.length - 1].fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
                                                    </span>
                                                </div>
                                            )}
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
