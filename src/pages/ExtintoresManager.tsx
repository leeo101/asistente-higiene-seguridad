import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck,
    Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera, Share2, Pencil, Download
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
import { DataTable } from '../components/DataTable';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import ExcelJS from 'exceljs';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const formatType = (tipo: string) => {
  
    if (!tipo) return 'N/A';
    const t = String(tipo).toUpperCase();
    if (t === 'ABC') return 'HCFC';
    if (t === 'BC') return 'CO2';
    return tipo;
};


export default function ExtintoresManager() {
    const { requirePro } = usePaywall();
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { syncCollection } = useSync();
    
    const [extintores, setExtintores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [shareItem, setShareItem] = useState<any | null>(null);
    const [printItem, setPrintItem] = useState<any | null>(null);

    const [globalShowSignatures, setGlobalShowSignatures] = useState({ operator: false, professional: true, supervisor: false });
    const [globalSignaturesData, setGlobalSignaturesData] = useState({ operatorSignature: '', supervisorSignature: '' });
    const [showGlobalSignatureModal, setShowGlobalSignatureModal] = useState(false);

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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => {
        window.scrollTo(0, 0);
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
        if (showGlobalSignatureModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showGlobalSignatureModal]);

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
        setConfirmModal({ isOpen: true, payload: id });
    };

    const executeDelete = async () => {
        if (confirmModal.payload) {
            const updated = extintores.filter(ext => ext.id !== confirmModal.payload);
            await saveToStorage(updated);
            toast.success('Extintor eliminado');
        }
        setConfirmModal({ isOpen: false, payload: null });
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

    // Calculate Recarga expiration status (add 1 year to the performed date)
    const getRecargaExpirationStatus = (dateStr) => {
        if (!dateStr) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
        const d = new Date(dateStr + 'T12:00:00Z');
        if (isNaN(d.getTime())) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
        d.setFullYear(d.getFullYear() + 1);
        const today = new Date();
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const expDate = d.toLocaleDateString('es-AR');
        if (diffDays < 0) return { color: '#ef4444', label: 'Vencido', bg: '#fee2e2', icon: <AlertTriangle size={14} />, expirationDate: expDate };
        if (diffDays <= 30) return { color: '#f59e0b', label: 'Por vencer', bg: '#fef3c7', icon: <AlertTriangle size={14} />, expirationDate: expDate };
        return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} />, expirationDate: expDate };
    };

    // Calculate PH expiration status (add 5 years to the performed date)
    const getPHExpirationStatus = (dateStr) => {
        if (!dateStr) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
        const d = new Date(dateStr + 'T12:00:00Z');
        if (isNaN(d.getTime())) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
        d.setFullYear(d.getFullYear() + 5);
        const today = new Date();
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const expDate = d.toLocaleDateString('es-AR');
        if (diffDays < 0) return { color: '#ef4444', label: 'Vencido', bg: '#fee2e2', icon: <AlertTriangle size={14} />, expirationDate: expDate };
        if (diffDays <= 30) return { color: '#f59e0b', label: 'Por vencer', bg: '#fef3c7', icon: <AlertTriangle size={14} />, expirationDate: expDate };
        return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} />, expirationDate: expDate };
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

    const handlePrintPdf = () => {
        setPrintItem(filtered);
        
        setTimeout(() => {
            // Ya no ocultamos el root, porque si el body queda vacío (sin altura), 
            // Android Chrome centra verticalmente los elementos con position: absolute.
            // Al dejar el root invisible (por CSS) pero ocupando espacio, y el PDF en position: absolute top 0,
            // garantizamos que quede pegado arriba.
            
            window.print();
            
            // Wait 10 seconds before clearing to allow Android's print spooler to capture the DOM
            setTimeout(() => {
                setPrintItem(null);
            }, 10000);
        }, 500);
    };

    const handleExportExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Extintores');

            worksheet.columns = [
                { header: 'Chapa', key: 'chapa', width: 15 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Capacidad', key: 'capacidad', width: 15 },
                { header: 'Ubicación', key: 'ubicacion', width: 30 },
                { header: 'Empresa', key: 'empresa', width: 25 },
                { header: 'Venc. Recarga', key: 'recarga', width: 20 },
                { header: 'Venc. PH', key: 'ph', width: 20 },
                { header: 'Vida Útil', key: 'vidaUtil', width: 20 }
            ];

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

            filtered.forEach(ext => {
                worksheet.addRow({
                    chapa: ext.numero,
                    tipo: formatType(ext.tipo),
                    capacidad: ext.capacidad,
                    ubicacion: ext.ubicacion,
                    empresa: ext.empresa || '',
                    recarga: ext.vencimientoRecarga ? new Date(ext.vencimientoRecarga + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
                    ph: ext.vencimientoPH ? new Date(ext.vencimientoPH + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
                    vidaUtil: ext.fechaFabricacion ? new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR') : ''
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Inventario_Extintores_${filterEmpresa || 'Completo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            toast.error('Error al exportar Excel');
        }
    };

    const uniqueEmpresas = [...new Set(extintores.map(e => e.empresa).filter(Boolean))];

    const types = ['HCFC', 'CO2', 'K', 'Agua', 'Espuma'];

    const expiredLifespans = extintores.filter(ext => {
        const st = getLifespanStatus(ext.fechaFabricacion);
        return st && (st.label.includes('DAR DE BAJA') || st.label.includes('Por vencer vida útil'));
    });

    const columns = [
        {
            header: 'Nº',
            accessor: 'index',
            width: '60px',
            render: (_: any, idx: number) => (
                <div style={{ fontWeight: 900, color: 'var(--color-text-muted)', fontSize: '1rem', textAlign: 'center', background: 'var(--color-background)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                    {idx + 1}
                </div>
            )
        },
        {
            header: 'Chapa',
            accessor: 'numero',
            sortable: true,
            render: (item: any) => {
                const stCarga = getRecargaExpirationStatus(item.vencimientoRecarga);
                const isExpired = stCarga.color === '#ef4444' || getPHExpirationStatus(item.vencimientoPH).color === '#ef4444';
                const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.3rem', borderRadius: '6px', color: isExpired ? '#ef4444' : '#10b981' }}>
                                <Flame size={14} />
                            </div>
                            <span style={{ fontWeight: 800 }}>#{item.numero}</span>
                        </div>
                        {lastInspection && (
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.1rem', 
                                fontSize: '0.6rem', 
                                fontWeight: 900, 
                                padding: '0.05rem 0.2rem',
                                borderRadius: '4px',
                                background: lastInspection.resultado === 'C' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444',
                                width: 'fit-content'
                            }}>
                                INSP: {lastInspection.resultado}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Tipo',
            accessor: 'tipo',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
                        {formatType(item.tipo)} — {item.capacidad}
                    </span>
                    {item.fechaFabricacion && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Fab: {new Date(item.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {item.empresa || '-'}
                </span>
            )
        },
        {
            header: 'Ubicación',
            accessor: 'ubicacion',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                    <MapPin size={14} /> {item.ubicacion}
                </span>
            )
        },
        {
            header: 'Carga',
            accessor: 'vencimientoRecarga',
            sortable: true,
            render: (item: any) => {
                const st = getRecargaExpirationStatus(item.vencimientoRecarga);
                return (
                    <span style={{ color: st.color, fontWeight: 700, fontSize: '0.8rem' }}>{st.label} ({st.expirationDate || '-'})</span>
                );
            }
        },
        {
            header: 'P.H.',
            accessor: 'vencimientoPH',
            sortable: true,
            render: (item: any) => {
                const st = getPHExpirationStatus(item.vencimientoPH);
                return (
                    <span style={{ color: st.color, fontWeight: 700, fontSize: '0.8rem' }}>{st.label} ({st.expirationDate || '-'})</span>
                );
            }
        },
        {
            header: 'Vida Útil',
            accessor: 'fechaFabricacion',
            sortable: true,
            render: (item: any) => {
                const st = getLifespanStatus(item.fechaFabricacion);
                if (!st) return <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>Sin Dato</span>;
                return (
                    <span style={{ color: st.color, fontWeight: 700, fontSize: '0.8rem' }}>{st.label}</span>
                );
            }
        },
        {
            header: 'Última Inspec.',
            accessor: 'id',
            sortable: false,
            render: (item: any) => {
                const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
                if (!lastInspection) return <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>-</span>;
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.8rem', color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444' }}>
                        <ShieldCheck size={14} /> 
                        {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => {
                const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
                let isInspectedRecently = false;
                if (lastInspection) {
                    const d = new Date(lastInspection.fechaVisita + 'T12:00:00Z');
                    const today = new Date();
                    const diffDays = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 35) { // 35 days to allow a bit of overlap for monthly inspections
                        isInspectedRecently = true;
                    }
                }

                const inspColor = isInspectedRecently ? '#10b981' : '#ef4444';
                const inspBg = isInspectedRecently ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
                const inspBorder = isInspectedRecently ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';

                return (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button onClick={() => navigate(`/extintores/inspect/${item.id}`)} style={{ padding: '0.4rem', background: inspBg, border: `1px solid ${inspBorder}`, borderRadius: '8px', color: inspColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.75rem' }} title="Inspeccionar">
                            <ShieldCheck size={15} /> INSP
                        </button>
                        <button onClick={() => handleEdit(item)} style={{ padding: '0.4rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', color: '#2563eb', cursor: 'pointer' }} title="Editar"><Edit3 size={15} /></button>
                        <button onClick={() => requirePro(() => generateQR(item))} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                        <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                        <button onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }} title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="container" style={{ maxWidth: '1200px', paddingBottom: '8rem' }}>
            {!showForm && (
                <>
                    <PremiumHeader
                        title="Control de Matafuegos"
                        subtitle="Inventario, trazabilidad NFPA 10 y Códigos QR"
                        icon={<Flame size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/', { state: { scrollTo: 'extintores' } })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            INICIO
                        </button>
                    </div>
                </>
            )}

            {showGlobalSignatureModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '6rem 1rem 2rem 1rem' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '850px', background: '#fff', borderRadius: '12px', padding: '1.2rem 1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', margin: '0 auto' }}>
                        <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <Pencil size={20} color="#3b82f6" /> Firmas del Reporte Global
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.4 }}>
                            Seleccioná qué firmas aparecerán en el reporte final y dibujalas a continuación.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
                            {/* Operador */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: globalShowSignatures.operator ? '#f8fafc' : '#f1f5f9', padding: '1rem', borderRadius: '10px', border: globalShowSignatures.operator ? '2px solid #cbd5e1' : '1px solid #e2e8f0', opacity: globalShowSignatures.operator ? 1 : 0.6, transition: 'all 0.2s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155', fontWeight: 700, fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                                    <input type="checkbox" checked={globalShowSignatures.operator} onChange={(e) => setGlobalShowSignatures(prev => ({ ...prev, operator: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    Operador / Responsable
                                </label>
                                <div style={{ background: '#fff', borderRadius: '8px', border: 'none', display: 'flex', flexDirection: 'column', pointerEvents: globalShowSignatures.operator ? 'auto' : 'none' }}>
                                    <SignatureCanvas 
                                        title="" 
                                        height={100}
                                        onSave={(sig) => setGlobalSignaturesData(prev => ({ ...prev, operatorSignature: sig }))}
                                        initialImage={globalSignaturesData.operatorSignature}
                                    />
                                </div>
                            </div>

                            {/* Profesional Actuante */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: globalShowSignatures.professional ? '#f0fdf4' : '#f1f5f9', padding: '1rem', borderRadius: '10px', border: globalShowSignatures.professional ? '2px solid #86efac' : '1px solid #e2e8f0', opacity: globalShowSignatures.professional ? 1 : 0.6, transition: 'all 0.2s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#166534', fontWeight: 700, fontSize: '0.9rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.4rem' }}>
                                    <input type="checkbox" checked={globalShowSignatures.professional} onChange={(e) => setGlobalShowSignatures(prev => ({ ...prev, professional: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    Profesional Actuante
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '150px', background: '#fff', border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '0.5rem', textAlign: 'center' }}>
                                    {professionalData?.signature ? (
                                        <img src={professionalData.signature} alt="Firma Profesional" style={{ maxHeight: '65px', objectFit: 'contain', marginBottom: '0.4rem' }} />
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Sin firma</span>
                                    )}
                                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>{professionalData?.name || 'No configurado'}</p>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>{professionalData?.license ? `Mat. ${professionalData.license}` : 'Sin matrícula'}</p>
                                </div>
                            </div>

                            {/* Supervisor */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: globalShowSignatures.supervisor ? '#f8fafc' : '#f1f5f9', padding: '1rem', borderRadius: '10px', border: globalShowSignatures.supervisor ? '2px solid #cbd5e1' : '1px solid #e2e8f0', opacity: globalShowSignatures.supervisor ? 1 : 0.6, transition: 'all 0.2s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155', fontWeight: 700, fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                                    <input type="checkbox" checked={globalShowSignatures.supervisor} onChange={(e) => setGlobalShowSignatures(prev => ({ ...prev, supervisor: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    Supervisión / Cierre
                                </label>
                                <div style={{ background: '#fff', borderRadius: '8px', border: 'none', display: 'flex', flexDirection: 'column', pointerEvents: globalShowSignatures.supervisor ? 'auto' : 'none' }}>
                                    <SignatureCanvas 
                                        title="" 
                                        height={100}
                                        onSave={(sig) => setGlobalSignaturesData(prev => ({ ...prev, supervisorSignature: sig }))}
                                        initialImage={globalSignaturesData.supervisorSignature}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                            <button onClick={() => setShowGlobalSignatureModal(false)} style={{ background: '#e2e8f0', color: '#475569', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', fontSize: '0.9rem' }} className="hover-scale">
                                Cancelar
                            </button>
                            <button onClick={() => setShowGlobalSignatureModal(false)} style={{ background: '#3b82f6', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'} onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'} className="hover-scale">
                                <CheckCircle2 size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ShareModal 
                isOpen={!!shareItem} 
                open={!!shareItem} 
                onClose={() => setShareItem(null)} 
                title={Array.isArray(shareItem) ? "Inventario de Extintores" : `Ficha Técnica - Extintor #${shareItem?.numero}`} 
                text={shareItem ? (Array.isArray(shareItem) ? `🧯 Inventario de Extintores\n📊 Total: ${shareItem.length}` : `📋 Ficha de Extintor\n🔥 Chapa: ${shareItem.numero}\n📍 Ubicación: ${shareItem.ubicacion}`) : ''} 
                rawMessage={''} 
                elementIdToPrint="pdf-content" 
                fileName={Array.isArray(shareItem) ? `Inventario_Extintores_${filterEmpresa || 'Completo'}.pdf` : `Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`} 
            />
            {(printItem || shareItem) && createPortal(
                <div 
                    className="ats-pdf-offscreen active-portal-print" 
                    aria-hidden="true"
                >
                    {(printItem && !Array.isArray(printItem)) || (shareItem && !Array.isArray(shareItem)) ? (
                        <ExtinguisherProfilePdf data={printItem || shareItem || formData} isHeadless={true} />
                    ) : (
                        <ExtinguisherPdfGenerator extinguishers={Array.isArray(printItem) ? printItem : (Array.isArray(shareItem) ? shareItem : [])} showSignatures={globalShowSignatures} globalSignatures={globalSignaturesData} />
                    )}
                </div>,
                document.body
            )}

            {!showForm && expiredLifespans.length > 0 && (
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


            {showForm ? (
                <div className="card animate-fade-in ats-editor-panel" style={{ padding: '0', border: 'none', background: 'transparent' }}>
                    <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                        <PremiumHeader 
                            title={editingId ? 'Editar Extintor' : 'Registrar Nuevo Extintor'}
                            subtitle="Ficha Técnica del Extintor"
                            icon={<Flame size={32} color="#ffffff" />}
                            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <></>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); requirePro(() => handleSave(e)); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '2px solid var(--color-primary)' }}>
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
                                <select value={formatType(formData.tipo)} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-background)' }}>
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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ÚLTIMA CARGA</label>
                                <input required type="date" value={formData.vencimientoRecarga} onChange={e => setFormData({...formData, vencimientoRecarga: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ÚLTIMA PRUEBA HIDRÁULICA</label>
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
                            <button type="button" onClick={() => {
                                setPrintItem(formData);
                                setTimeout(() => {
                                    window.print();
                                    setTimeout(() => setPrintItem(null), 10000);
                                }, 600);
                            }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '2px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <PdfBrandingFooter />
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
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={() => requirePro(() => setShowForm(true))}
                            style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap' }}
                        >
                            <Plus size={20} /> Nuevo Matafuego
                        </button>
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

                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {filtered.length > 0 && (
                            <>
                                <style>
                                    {`
                                        .action-btn-premium {
                                            display: flex;
                                            align-items: center;
                                            gap: 0.5rem;
                                            padding: 0.6rem 1.2rem;
                                            font-size: 0.8rem;
                                            font-weight: 800;
                                            border-radius: 50px;
                                            border: none;
                                            cursor: pointer;
                                            color: white;
                                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                            letter-spacing: 0.5px;
                                        }
                                        .btn-pdf {
                                            background: linear-gradient(135deg, #f87171, #ef4444);
                                            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                                        }
                                        .btn-pdf:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
                                        }
                                        .btn-excel {
                                            background: linear-gradient(135deg, #10b981, #059669);
                                            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                                        }
                                        .btn-excel:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                                        }
                                        .btn-share {
                                            background: linear-gradient(135deg, #3b82f6, #2563eb);
                                            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                                        }
                                        .btn-share:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                                        }
                                    `}
                                </style>
                                <button onClick={() => requirePro(() => setShowGlobalSignatureModal(true))} className="action-btn-premium" style={{ background: '#475569', boxShadow: '0 4px 15px rgba(71, 85, 105, 0.3)' }}>
                                    <Pencil size={16} /> FIRMAS PDF
                                </button>
                                <button onClick={() => requirePro(handlePrintPdf)} className="action-btn-premium btn-pdf">
                                    <Printer size={16} /> IMPRIMIR PDF
                                </button>
                                <button onClick={() => requirePro(handleExportExcel)} className="action-btn-premium btn-excel">
                                    <Download size={16} /> EXPORTAR EXCEL
                                </button>
                                <button onClick={() => requirePro(() => setShareItem(filtered))} className="action-btn-premium btn-share">
                                    <Share2 size={16} /> COMPARTIR
                                </button>
                            </>
                        )}
                    </div>

                    <DataTable
                        data={filtered}
                        columns={columns}
                        searchPlaceholder="" // Search is handled manually above, or we can use DataTable's search
                        emptyMessage="No hay extintores registrados."
                        emptyIcon={<Flame size={48} />}
                        onEmptyAction={() => setShowForm(true)}
                        emptyActionLabel="Nuevo Matafuego"
                    />

                </>
            )}

            {/* Confirm Modal */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ isOpen: false, payload: null })} 
                onConfirm={executeDelete} 
                title="¿Eliminar extintor?" 
                message="Esta acción no se puede deshacer." 
                iconEmoji="🗑️" 
            />

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
