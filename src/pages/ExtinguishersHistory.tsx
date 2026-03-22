import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Search, Flame, Calendar, MapPin,
    ChevronRight, AlertCircle, TriangleAlert, Printer, Share2, QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';

export default function ExtinguishersHistory(): React.ReactElement | null {
    useDocumentTitle('Historial de Extintores');
    const navigate = useNavigate();
    const { syncPulse } = useSync();
    const { currentUser } = useAuth();

    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null); // Can be a single extinguisher or the whole array

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
        setInventory(stored);
    }, [syncPulse]);

    const addMonths = (dateString, months) => {
        if (!dateString) return null;
        const d = new Date(dateString + 'T12:00:00Z');
        d.setMonth(d.getMonth() + months);
        return d;
    };

    const getStatus = (lastDate, monthsValid) => {
        if (!lastDate) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };

        const dueDate = addMonths(lastDate, monthsValid);
        const today = new Date();
        const diffDays = Math.ceil(((dueDate as any) - (today as any)) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'expired', color: '#ef4444', text: 'Vencido' };
        if (diffDays <= 30) return { status: 'warning', color: '#f59e0b', text: 'Próximo a Vencer' };
        return { status: 'valid', color: '#10b981', text: 'Vigente' };
    };

    const filteredInventory = inventory.filter(ext => {
        const searchStr = `${ext.chapa} ${ext.ubicacion} ${ext.empresa}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={Array.isArray(shareItem) ? "Inventario de Extintores" : `Extintor #${shareItem?.chapa}`}
                text={shareItem ? (Array.isArray(shareItem) 
                    ? `🧯 Inventario de Extintores\n📊 Total equipos: ${shareItem.length}\n📅 Fecha: ${new Date().toLocaleDateString()}`
                    : `🧯 Extintor #${shareItem.chapa}\n📍 Ubicación: ${shareItem.ubicacion}\n🏢 Empresa: ${shareItem.empresa || '-'}\n🔥 Tipo: ${shareItem.tipo} (${shareItem.capacidad})`) : ''}
                rawMessage={shareItem ? (Array.isArray(shareItem) 
                    ? `🧯 Inventario de Extintores\n📊 Total equipos: ${shareItem.length}\n📅 Fecha: ${new Date().toLocaleDateString()}`
                    : `🧯 Extintor #${shareItem.chapa}\n📍 Ubicación: ${shareItem.ubicacion}\n🏢 Empresa: ${shareItem.empresa || '-'}\n🔥 Tipo: ${shareItem.tipo} (${shareItem.capacidad})`) : ''}
                elementIdToPrint="pdf-content"
                fileName={Array.isArray(shareItem) ? "Inventario_Extintores.pdf" : `Extintor_${shareItem?.chapa || 'Reporte'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <ExtinguisherPdfGenerator extinguishers={Array.isArray(shareItem) ? shareItem : (shareItem ? [shareItem] : [])} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Inventario de Extintores</h1>
                </div>
                <button onClick={() => navigate('/extinguishers')} className="btn-primary" style={{ margin: 0, padding: '0.5rem 1rem' }}>
                    Gestionar / Nuevo
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por chapa, ubicación o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px',
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        fontSize: '1rem', color: 'var(--color-text)', outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredInventory.map((ext) => {
                    const stCarga = getStatus(ext.ultimaCarga, 12);
                    const stPH = getStatus(ext.ultimaPH, 60);
                    const isAnyExpired = stCarga.status === 'expired' || stPH.status === 'expired';

                    return (
                        <div key={ext.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `6px solid ${isAnyExpired ? '#ef4444' : '#10b981'}` }}
                            onClick={() => navigate('/extinguishers')}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${isAnyExpired ? '#ef4444' : '#10b981'}15`, color: isAnyExpired ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Flame size={24} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Chapa #{ext.chapa}</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                        {ext.tipo} - {ext.capacidad}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {ext.ubicacion}</span>
                                    {ext.empresa && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {ext.empresa}</span>}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: stCarga.color, fontWeight: 700 }}>
                                        <AlertCircle size={14} /> Carga: {stCarga.text}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: stPH.color, fontWeight: 700 }}>
                                        <TriangleAlert size={14} /> P.H.: {stPH.text}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShareItem(ext);
                                    }}
                                    style={{
                                        padding: '0.6rem',
                                        background: '#dcfce7',
                                        border: '1px solid #86efac',
                                        borderRadius: '10px',
                                        color: '#16a34a',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Compartir"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${ext.id}?print=true`;
                                        setQrTarget({ text: url, title: `Extintor — ${ext.chapa}` });
                                    }}
                                    style={{
                                        padding: '0.6rem',
                                        background: 'rgba(139,92,246,0.06)',
                                        border: '1px solid rgba(139,92,246,0.18)',
                                        borderRadius: '10px',
                                        color: '#8b5cf6',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Generar QR"
                                >
                                    <QrCode size={18} />
                                </button>
                                <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                            </div>
                        </div>
                    );
                })}

                {filteredInventory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <Flame size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay extintores en el inventario</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún registro coincide con la búsqueda.' : 'Registra tus matafuegos en el módulo de Control de Extintores.'}
                        </p>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                    onClick={() => navigate('/extinguishers-report')}
                    className="btn-outline"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0 }}
                >
                    <Printer size={18} /> <span className="hidden sm:inline">Imprimir Vista Previa</span>
                </button>
                <button
                    onClick={() => setShareItem(inventory)}
                    className="btn-primary"
                    style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0, background: '#16a34a', border: 'none' }}
                >
                    <Share2 size={18} /> Compartir Inventario (WA)
                </button>
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
