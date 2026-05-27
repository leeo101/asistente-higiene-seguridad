import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Flame, AlertCircle, Calendar, MapPin,
    ShieldCheck, TriangleAlert, Edit2, Trash2, Printer, FileText, CheckCircle2, Share2, QrCode,
    ClipboardCheck, Camera, Upload, X, Hash
} from 'lucide-react';
import QRModal from '../components/QRModal';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';

// Utility for calculating dates
const addMonths = (dateString, months) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString + 'T12:00:00Z');
        if (isNaN(d.getTime())) return '';
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };

    const dueDate = addMonths(lastDate, monthsValid);
    if (!dueDate) return { status: 'unknown', color: '#64748b', text: 'Fecha Inválida' };

    const today = new Date().toISOString().split('T')[0];

    const tCurrent = new Date(today).getTime();
    const tDue = new Date(dueDate).getTime();
    const diffDays = Math.ceil((tDue - tCurrent) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', color: '#ef4444', text: 'Vencido', diffDays };
    if (diffDays <= 30) return { status: 'warning', color: '#f59e0b', text: 'Próximo a Vencer', diffDays };
    return { status: 'valid', color: '#10b981', text: 'Vigente', diffDays };
};


export default function Extinguishers(): React.ReactElement | null {
    useDocumentTitle('Control de Extintores');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection, syncPulse } = useSync();

    const [extinguishers, setExtinguishers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [companyFilter, setCompanyFilter] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const { requirePro } = usePaywall();

    const [qrData, setQrData] = useState(null);

    // States for inspection modal
    const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
    const [inspectingExt, setInspectingExt] = useState(null);
    const [inspectForm, setInspectForm] = useState({
        fechaVisita: new Date().toISOString().split('T')[0],
        proximaVisita: addMonths(new Date().toISOString().split('T')[0], 1),
        manometro: 'C',
        acceso: 'C',
        senalizacion: 'C',
        manguera: 'C',
        cilindro: 'C',
        observacion: '',
        fotos: []
    });

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        chapa: '',
        ubicacion: '',
        tipo: 'Polvo Químico ABC',
        capacidad: '5 kg',
        empresa: '',
        ultimaCarga: '',
        ultimaPH: '',
        fechaFabricacion: ''
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
            newList = newList.map((e: any) => e.id === editingId ? { ...e, ...formData, id: editingId } : e);
            toast.success('Extintor actualizado.');
        } else {
            newList.push({ ...formData, id: Date.now(), inspections: [] });
            toast.success('Extintor añadido.');
        }

        setExtinguishers(newList);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(newList));
        syncCollection('extinguishers_inventory', newList);
        closeModal();
    };

    const handleDelete = (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este extintor del inventario?')) return;

        const newList = extinguishers.filter((e: any) => e.id !== id);
        setExtinguishers(newList);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(newList));
        syncCollection('extinguishers_inventory', newList);
    };

    const openModal = (extinguisher = null) => {
        if (extinguisher) {
            setFormData({
                chapa: extinguisher.chapa || '',
                ubicacion: extinguisher.ubicacion || '',
                tipo: extinguisher.tipo || 'Polvo Químico ABC',
                capacidad: extinguisher.capacidad || '5 kg',
                empresa: extinguisher.empresa || '',
                ultimaCarga: extinguisher.ultimaCarga || '',
                ultimaPH: extinguisher.ultimaPH || '',
                fechaFabricacion: extinguisher.fechaFabricacion || ''
            });
            setEditingId(extinguisher.id);
        } else {
            setFormData({
                chapa: '', ubicacion: '', tipo: 'Polvo Químico ABC', capacidad: '5 kg',
                empresa: companyFilter, ultimaCarga: '', ultimaPH: '', fechaFabricacion: ''
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const openInspectModal = (extinguisher) => {
        setInspectingExt(extinguisher);
        setInspectForm({
            fechaVisita: new Date().toISOString().split('T')[0],
            proximaVisita: addMonths(new Date().toISOString().split('T')[0], 1),
            manometro: 'C',
            acceso: 'C',
            senalizacion: 'C',
            manguera: 'C',
            cilindro: 'C',
            observacion: '',
            fotos: []
        });
        setIsInspectModalOpen(true);
    };

    const closeInspectModal = () => {
        setIsInspectModalOpen(false);
        setInspectingExt(null);
    };

    const handleSaveInspection = () => {
        if (!inspectingExt) return;

        const controls = {
            manometro: inspectForm.manometro,
            acceso: inspectForm.acceso,
            senalizacion: inspectForm.senalizacion,
            manguera: inspectForm.manguera,
            cilindro: inspectForm.cilindro
        };
        const hasFail = Object.values(controls).some(status => status === 'NC');
        const resultado = hasFail ? 'NC' : 'C';

        const newInspection = {
            id: Date.now(),
            fechaVisita: inspectForm.fechaVisita,
            proximaVisita: inspectForm.proximaVisita,
            controles: controls,
            resultado,
            observacion: inspectForm.observacion,
            fotos: inspectForm.fotos
        };

        const updatedList = extinguishers.map(e => {
            if (e.id === inspectingExt.id) {
                const inspections = e.inspections || [];
                return {
                    ...e,
                    inspections: [...inspections, newInspection],
                    // Actualizar ultimaInspeccion para que aparezca en la Ficha PDF
                    ultimaInspeccion: resultado === 'C'
                        ? new Date().toISOString()
                        : e.ultimaInspeccion
                };
            }
            return e;
        });

        setExtinguishers(updatedList);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(updatedList));
        syncCollection('extinguishers_inventory', updatedList);
        
        toast.success(`Inspección guardada. Resultado: ${resultado === 'C' ? 'CUMPLE ✓' : 'NO CUMPLE ⚠️'}`);
        closeInspectModal();
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
            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="Inventario de Extintores"
                text={`🧯 Reporte de Extintores\n🏢 Empresa: ${companyFilter || 'Todas'}\n📊 Total: ${stats.total}\n⚠️ Cargas Vencidas: ${stats.cargaVencida}\n🛠️ PH Vencidas: ${stats.phVencida}`}
                rawMessage={``}
                elementIdToPrint="pdf-content"
                fileName={`Inventario_Extintores_${companyFilter || 'Gral'}.pdf`}
            />
            {qrData && (
                <QRModal 
                    title={`QR Extintor #${qrData.chapa}`}
                    text={`app://asset/extinguisher/${qrData.id}`}
                    onClose={() => setQrData(null)}
                />
            )}

            <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                <ExtinguisherPdfGenerator extinguishers={filteredList} />
            </div>

            <div className="no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Control de Extintores</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => requirePro(() => setShowShareModal(true))} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: '#0052CC', color: '#white', borderColor: '#0052CC' }}>
                            <Share2 size={18} /> <span className="hidden sm:inline">Compartir</span>
                        </button>
                        <button onClick={() => requirePro(() => window.print())} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Printer size={18} /> <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <button onClick={() => openModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
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
                    <div className="hidden sm:grid" style={{ gridTemplateColumns: 'minmax(80px, 1fr) 2fr 1.5fr 2fr 2fr 140px', gap: '1rem', padding: '1rem', background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
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
                            const lastInspection = ext.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                            return (
                                <div key={ext.id} className="responsive-list-card" style={{ padding: '1rem', margin: '0.5rem 1rem 1rem 1rem', display: 'flex', flexDirection: 'column' }}>
                                    {/* Desktop mapping uses grid, mobile uses stacked */}
                                    <div className="sm:grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'center' }}>
                                        {/* CSS to make it a row on desktop */}
                                        <style>{`@media (min-width: 640px) { .ext-row-${ext.id} { grid-template-columns: minmax(80px, 1fr) 2fr 1.5fr 2fr 2fr 140px !important; } }`}</style>

                                        <div className={`ext-row-${ext.id}`} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', alignItems: 'center' }}>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Nº Chapa</span>
                                                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-text)' }}>#{ext.chapa}</span>
                                                {/* Mini status indicator */}
                                                <div style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.3rem', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 900, 
                                                    textTransform: 'uppercase',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '4px',
                                                    background: getStatus(ext.ultimaCarga, 12).status === 'valid' && getStatus(ext.ultimaPH, 60).status === 'valid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    color: getStatus(ext.ultimaCarga, 12).status === 'valid' && getStatus(ext.ultimaPH, 60).status === 'valid' ? '#10b981' : '#ef4444',
                                                    width: 'fit-content'
                                                }}>
                                                    {getStatus(ext.ultimaCarga, 12).status === 'valid' && getStatus(ext.ultimaPH, 60).status === 'valid' ? 'OK' : '⚠️ REVISAR'}
                                                </div>
                                                {/* Última inspección badge */}
                                                {lastInspection && (
                                                    <div style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.2rem', 
                                                        fontSize: '0.62rem', 
                                                        fontWeight: 900, 
                                                        textTransform: 'uppercase',
                                                        padding: '0.1rem 0.3rem',
                                                        borderRadius: '4px',
                                                        background: lastInspection.resultado === 'C' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                        color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444',
                                                        marginTop: '0.2rem',
                                                        width: 'fit-content'
                                                    }}>
                                                        INSP: {lastInspection.resultado} ({new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR').split('/')[0] + '/' + new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR').split('/')[1]})
                                                    </div>
                                                )}
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
                                                {ext.fechaFabricacion && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Fab: {new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}</span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Vto. Carga</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stCarga.color }}></div>
                                                    <span style={{ color: stCarga.color, fontWeight: 800, fontSize: '0.95rem' }}>{stCarga.text}</span>
                                                </div>
                                                {ext.ultimaCarga && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Últ: {new Date(ext.ultimaCarga + 'T12:00:00Z').toLocaleDateString('es-AR')}</div>}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Vto. P.H.</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stPH.color }}></div>
                                                    <span style={{ color: stPH.color, fontWeight: 800, fontSize: '0.95rem' }}>{stPH.text}</span>
                                                </div>
                                                {ext.ultimaPH && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Últ: {new Date(ext.ultimaPH + 'T12:00:00Z').toLocaleDateString('es-AR')}</div>}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.4rem', marginTop: '0.5rem' }} className="sm:justify-center sm:mt-0">
                                                <button onClick={() => setQrData(ext)} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', flex: '0 0 auto' }} title="Generar QR">
                                                    <QrCode size={16} />
                                                </button>
                                                <button onClick={() => openInspectModal(ext)} style={{ padding: '0.4rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', flex: '0 0 auto' }} title="Inspección Mensual">
                                                    <ClipboardCheck size={16} />
                                                </button>
                                                <button onClick={() => openModal(ext)} style={{ padding: '0.4rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', color: 'var(--color-primary)', cursor: 'pointer', flex: '0 0 auto' }} title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(ext.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', flex: '0 0 auto' }} title="Borrar">
                                                    <Trash2 size={16} />
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

                {/* Modal de Carga / Edición — PREMIUM */}
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ width: '100%', maxWidth: '620px', background: 'var(--color-surface)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                            {/* Header */}
                            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.6rem', display: 'flex' }}>
                                        <Flame size={22} color="#fff" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Control de Extintores</p>
                                        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                                            {editingId ? '✏️ Editar Extintor' : '➕ Nuevo Extintor'}
                                        </h2>
                                    </div>
                                </div>
                                <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '1.8rem 2rem' }}>
                                {/* Identificación */}
                                <div style={{ marginBottom: '1.4rem' }}>
                                    <p style={{ margin: '0 0 0.8rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Hash size={12} /> Identificación
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Nº Chapa / ID</label>
                                            <input type="text" value={formData.chapa} onChange={e => setFormData({ ...formData, chapa: e.target.value })} placeholder="Ej. 1045" style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800, background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Empresa / Cliente</label>
                                            <input type="text" value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} placeholder="Ej. Planta Sur" style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Ubicación Específica</label>
                                            <input type="text" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Ej. Taller Mantenimiento, Pasillo Principal..." style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Características */}
                                <div style={{ marginBottom: '1.4rem' }}>
                                    <p style={{ margin: '0 0 0.8rem', fontSize: '0.7rem', fontWeight: 900, color: '#e85d04', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Flame size={12} color="#e85d04" /> Características del Extintor
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                                        <div style={{ gridColumn: '1 / 3' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Agente Extintor (Tipo)</label>
                                            <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }}>
                                                <option value="Polvo Químico ABC">Polvo Químico ABC</option>
                                                <option value="CO2 (B-C)">CO2 (B-C)</option>
                                                <option value="Agua (A)">Agua (A)</option>
                                                <option value="Agua AFFF (A-B)">Agua AFFF (A-B)</option>
                                                <option value="Haloclean / HCFC">Haloclean / HCFC</option>
                                                <option value="Acetato de Potasio (K)">Acetato de Potasio (K)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Capacidad</label>
                                            <input type="text" value={formData.capacidad} onChange={e => setFormData({ ...formData, capacidad: e.target.value })} placeholder="5 kg" style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>📅 Fecha Fabricación</label>
                                            <input type="date" value={formData.fechaFabricacion} onChange={e => setFormData({ ...formData, fechaFabricacion: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Fechas de Servicio */}
                                <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(16,185,129,0.06) 100%)', border: '1.5px solid rgba(37,99,235,0.15)', borderRadius: '14px', padding: '1.2rem' }}>
                                    <p style={{ margin: '0 0 0.9rem', fontSize: '0.7rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Calendar size={12} color="#10b981" /> Fechas de Último Servicio
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Última Recarga (Carga)</label>
                                            <input type="date" value={formData.ultimaCarga} onChange={e => setFormData({ ...formData, ultimaCarga: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', display: 'block' }}>⏱ Vence a los 12 meses</span>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Última Prueba Hidráulica</label>
                                            <input type="date" value={formData.ultimaPH} onChange={e => setFormData({ ...formData, ultimaPH: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', display: 'block' }}>⏱ Vence a los 5 años (60 m)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1rem 2rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid var(--color-border)' }}>
                                <button onClick={closeModal} style={{ padding: '0.7rem 1.4rem', background: 'transparent', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    Cancelar
                                </button>
                                <button onClick={handleSaveExtinguisher} style={{ padding: '0.7rem 1.6rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                                    <CheckCircle2 size={16} /> Guardar Extintor
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Inspección Mensual — PREMIUM */}
                {isInspectModalOpen && inspectingExt && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ width: '100%', maxWidth: '660px', background: 'var(--color-surface)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                            {/* Header verde */}
                            <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.6rem', display: 'flex' }}>
                                        <ClipboardCheck size={22} color="#fff" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inspección Mensual</p>
                                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>Extintor #{inspectingExt.chapa}</h2>
                                    </div>
                                </div>
                                <button onClick={closeInspectModal} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Info del extintor */}
                            <div style={{ margin: '1.2rem 2rem 0', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.8rem 1.1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                <span>📍 <strong style={{ color: 'var(--color-text)' }}>{inspectingExt.ubicacion || '—'}</strong></span>
                                {inspectingExt.empresa && <span>🏢 <strong style={{ color: 'var(--color-text)' }}>{inspectingExt.empresa}</strong></span>}
                                <span>🧯 <strong style={{ color: 'var(--color-text)' }}>{inspectingExt.tipo} ({inspectingExt.capacidad})</strong></span>
                                {inspectingExt.fechaFabricacion && <span>🏭 Fab: <strong style={{ color: 'var(--color-text)' }}>{new Date(inspectingExt.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}</strong></span>}
                            </div>

                            {/* Body */}
                            <div style={{ padding: '1.4rem 2rem' }}>

                                {/* Fechas */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.4rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>📅 Fecha de Visita</label>
                                        <input
                                            type="date"
                                            value={inspectForm.fechaVisita}
                                            onChange={e => {
                                                const v = e.target.value;
                                                setInspectForm({ ...inspectForm, fechaVisita: v, proximaVisita: addMonths(v, 1) });
                                            }}
                                            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>🔄 Próxima Visita</label>
                                        <input
                                            type="date"
                                            value={inspectForm.proximaVisita}
                                            onChange={e => setInspectForm({ ...inspectForm, proximaVisita: e.target.value })}
                                            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: '10px', fontSize: '0.85rem', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                {/* Puntos de control */}
                                <p style={{ margin: '0 0 0.8rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚙️ Puntos de Control</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.4rem' }}>
                                    {[
                                        { key: 'manometro', icon: '🔵', label: 'Manómetro en zona verde (Presión adecuada)' },
                                        { key: 'acceso', icon: '🚶', label: 'Acceso despejado y libre de obstrucciones' },
                                        { key: 'senalizacion', icon: '🔺', label: 'Señalización y altura reglamentaria' },
                                        { key: 'manguera', icon: '🌀', label: 'Manguera, boquilla y precinto de seguridad' },
                                        { key: 'cilindro', icon: '🧯', label: 'Cilindro en buen estado (sin óxido ni golpes)' }
                                    ].map((item, idx) => {
                                        const val = inspectForm[item.key];
                                        const borderColor = val === 'C' ? 'rgba(16,185,129,0.4)' : val === 'NC' ? 'rgba(239,68,68,0.4)' : 'var(--color-border)';
                                        const bgColor = val === 'C' ? 'rgba(16,185,129,0.06)' : val === 'NC' ? 'rgba(239,68,68,0.06)' : 'var(--color-background)';
                                        return (
                                            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: bgColor, border: `1.5px solid ${borderColor}`, borderRadius: '12px', transition: 'all 0.2s ease' }}>
                                                <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                                                    {idx + 1}. {item.label}
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, marginLeft: '0.8rem' }}>
                                                    {[{ v: 'C', color: '#10b981', label: 'C' }, { v: 'NC', color: '#ef4444', label: 'NC' }, { v: 'NA', color: '#64748b', label: 'N/A' }].map(opt => {
                                                        const active = val === opt.v;
                                                        return (
                                                            <button
                                                                key={opt.v}
                                                                onClick={() => setInspectForm({ ...inspectForm, [item.key]: opt.v })}
                                                                style={{
                                                                    minWidth: '40px', height: '34px',
                                                                    padding: '0 0.5rem',
                                                                    borderRadius: '8px',
                                                                    border: `2px solid ${active ? opt.color : 'var(--color-border)'}`,
                                                                    background: active ? opt.color : 'transparent',
                                                                    color: active ? '#fff' : 'var(--color-text-muted)',
                                                                    fontWeight: 900,
                                                                    fontSize: '0.72rem',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s ease',
                                                                    boxShadow: active ? `0 2px 8px ${opt.color}55` : 'none'
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Observaciones */}
                                <div style={{ marginBottom: '1.4rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>📝 Observaciones / Hallazgos</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Describa cualquier anomalía observada..."
                                        value={inspectForm.observacion}
                                        onChange={e => setInspectForm({ ...inspectForm, observacion: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', resize: 'vertical', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Fotos */}
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>📷 Fotos de Evidencia</label>
                                    <input type="file" ref={fileInputRef} onChange={(e) => { const files = Array.from(e.target.files || []); let loaded = 0; const newPhotos = []; files.forEach(f => { const r = new FileReader(); r.onloadend = () => { newPhotos.push(r.result); loaded++; if (loaded === files.length) setInspectForm(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] })); }; r.readAsDataURL(f); }); }} accept="image/*" capture="environment" multiple style={{ display: 'none' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: 'rgba(37,99,235,0.1)', border: '1.5px solid rgba(37,99,235,0.25)', borderRadius: '10px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                        >
                                            <Camera size={15} /> Tomar / Subir Fotos
                                        </button>
                                        {inspectForm.fotos.length > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{inspectForm.fotos.length} foto(s) adjunta(s)</span>}
                                    </div>
                                    {inspectForm.fotos.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                                            {inspectForm.fotos.map((photo, index) => (
                                                <div key={index} style={{ position: 'relative', width: '68px', height: '68px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                                    <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button onClick={() => setInspectForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }))} style={{ position: 'absolute', top: 3, right: 3, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 900 }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1rem 2rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid var(--color-border)' }}>
                                <button onClick={closeInspectModal} style={{ padding: '0.7rem 1.4rem', background: 'transparent', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    Cancelar
                                </button>
                                <button onClick={handleSaveInspection} style={{ padding: '0.7rem 1.6rem', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                                    <CheckCircle2 size={16} /> Guardar Inspección
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
