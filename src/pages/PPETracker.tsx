import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Plus, Trash2, HardHat, TriangleAlert, CheckCircle, Clock, Shield,
    Download, QrCode, ExternalLink, Info, Footprints, Hand, Glasses, Ear, Shirt,
    Wind, Eye, Flame, Activity, HelpCircle, User, Calendar, ShieldCheck, Award, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSync } from '../contexts/SyncContext';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import PPEReceiptPdfGenerator from '../components/PPEReceiptPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';
import Breadcrumbs from '../components/Breadcrumbs';

const EPP_TYPES = [
    'Casco de seguridad', 'Calzado de seguridad', 'Guantes de trabajo',
    'Lentes de seguridad', 'Protector auditivo', 'Arnés de seguridad',
    'Chaleco reflectivo', 'Mascarilla / Respirador', 'Careta facial',
    'Ropa ignífuga', 'Botas de goma', 'Rodilleras', 'Otro'
];

// Configuración visual de colores e iconos premium para cada tipo de EPP
const EPP_CONFIG = {
    'Casco de seguridad': { icon: HardHat, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    'Calzado de seguridad': { icon: Footprints, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    'Guantes de trabajo': { icon: Hand, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    'Lentes de seguridad': { icon: Glasses, color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
    'Protector auditivo': { icon: Ear, color: '#14B8A6', bg: 'rgba(20,184,166,0.08)' },
    'Arnés de seguridad': { icon: Shield, color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
    'Chaleco reflectivo': { icon: Shirt, color: '#84CC16', bg: 'rgba(132,204,22,0.08)' },
    'Mascarilla / Respirador': { icon: Wind, color: '#A855F7', bg: 'rgba(168,85,247,0.08)' },
    'Careta facial': { icon: Eye, color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
    'Ropa ignífuga': { icon: Flame, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
    'Botas de goma': { icon: Footprints, color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
    'Rodilleras': { icon: Activity, color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
    'Otro': { icon: HelpCircle, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }
};

function getPPEConfig(type) {
    // Buscar coincidencia exacta o por palabra, sino retornar el fallback 'Otro'
    if (EPP_CONFIG[type]) return EPP_CONFIG[type];
    const foundKey = Object.keys(EPP_CONFIG).find(key => type.toLowerCase().includes(key.toLowerCase()));
    return foundKey ? EPP_CONFIG[foundKey] : EPP_CONFIG['Otro'];
}

// Normas de certificación aceptadas por Res. SIyC 18/25
const CERT_STANDARDS = ['IRAM', 'ISO', 'EN (Europeo)', 'ANSI', 'NIOSH', 'NFPA', 'IEC', 'Otra'];

function getDaysUntilExpiry(purchaseDate, lifeMonths) {
    if (!purchaseDate || !lifeMonths) return null;
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + Number(lifeMonths));
    return Math.ceil(((expiry as any) - (new Date() as any)) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }) {
    if (days === null) return null;
    if (days < 0) return (
        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            <TriangleAlert size={11} /> VENCIDO
        </span>
    );
    if (days <= 30) return (
        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Clock size={11} /> {days}d restantes
        </span>
    );
    return (
        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={11} /> Vigente · {days}d
        </span>
    );
}

const EMPTY_FORM = { type: '', custom: '', responsible: '', purchaseDate: '', lifeMonths: '', certStandard: '', certNumber: '' };

export default function PPETracker(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [items, setItems] = useState<any[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    
    // Check if device is mobile to adjust padding
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('ppe_items');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    const save = async (updated) => {
        setItems(updated);
        localStorage.setItem('ppe_items', JSON.stringify(updated));
        await syncCollection('ppe_items', updated);
    };

    const handleAdd = async () => {
        if (!form.type) { toast.error('Seleccioná un tipo de EPP'); return; }
        if (!form.purchaseDate) { toast.error('Ingresá la fecha de compra/entrega'); return; }
        
        const newItem = {
            id: Date.now(),
            type: form.type === 'Otro' ? (form.custom || 'Otro') : form.type,
            responsible: form.responsible,
            purchaseDate: form.purchaseDate,
            lifeMonths: form.lifeMonths || 12,
            certStandard: form.certStandard,
            certNumber: form.certNumber,
            addedAt: new Date().toISOString()
        };

        const updated = [newItem, ...items];
        await save(updated);
        
        toast.success('EPP registrado');
        setForm(EMPTY_FORM);
        setIsFormVisible(false);
    };

    const handleDelete = (id) => {
        save(items.filter(i => i.id !== id));
        toast.success('EPP eliminado');
    };

    const handleExport = () => {
        downloadCSV(items, 'ppe_tracker', {
            type: 'Tipo de EPP', responsible: 'Responsable',
            purchaseDate: 'Fecha Compra/Entrega', lifeMonths: 'Vida Útil (meses)',
            certStandard: 'Certificación', certNumber: 'N° Certificado'
        });
    };

    const showARStamp = form.certStandard && form.certNumber;

    // Cálculos estadísticos para el panel de salud superior
    const total = items.length;
    const expired = items.filter(i => getDaysUntilExpiry(i.purchaseDate, i.lifeMonths) !== null && getDaysUntilExpiry(i.purchaseDate, i.lifeMonths)! < 0).length;
    const expiring = items.filter(i => {
        const d = getDaysUntilExpiry(i.purchaseDate, i.lifeMonths);
        return d !== null && d >= 0 && d <= 30;
    }).length;
    const active = total - expired - expiring;

    // Puntuación de protección general (EPP seguros del equipo)
    const protectionScore = total > 0 ? Math.round(((active + expiring) / total) * 100) : 100;



    return (
        <div className="container" style={{ maxWidth: '750px', paddingBottom: '4rem', paddingTop: '6rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '180px' }}>
                    <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Control de EPP</h1>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Res. SIyC 18/25 · Res. SRT 299/11</p>
                    </div>
                </div>
                {items.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => requirePro(() => window.print())} style={{ background: '#2563eb', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                            <span className="hidden sm:inline">IMPRIMIR RES. 299/11</span><span className="inline sm:hidden">RES 299/11</span>
                        </button>
                        <button onClick={handleExport} style={{ background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Banner normativa actualizada */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(139,92,246,0.05))',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '0.85rem 1.1rem',
                marginBottom: '1.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.8rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    <QrCode size={22} color="#2563eb" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>🆕 Res. SIyC 18/25 — Vigente desde Feb 2025</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        Los EPP comercializados en Argentina ahora deben contar con el <strong style={{ color: 'var(--color-text)' }}>Marcado "AR" ✓✓ + Código QR de trazabilidad</strong>.
                        Se aceptan certificaciones <strong style={{ color: 'var(--color-text)' }}>ISO, EN, ANSI, NIOSH, NFPA, IEC</strong> (ya no solo IRAM).
                        El uso obligatorio en planta sigue rigiendo por Res. SRT 299/11.
                    </p>
                </div>
            </div>

            {/* 📊 Premium Safety Hub Dashboard (Siempre visible si hay EPPs) */}
            {items.length > 0 && (
                <div className="card" style={{
                    background: 'var(--gradient-card)',
                    padding: '1.2rem 1.5rem',
                    borderRadius: '20px',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--glass-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: 'var(--glass-shadow)',
                    animation: 'scaleIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                                Estado de Protección del Equipo
                            </h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                Monitoreo de cumplimiento de normas y vida útil.
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: protectionScore >= 80 ? 'rgba(16,185,129,0.08)' : protectionScore >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '99px',
                            border: `1px solid ${protectionScore >= 80 ? 'rgba(16,185,129,0.2)' : protectionScore >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: protectionScore >= 80 ? '#10b981' : protectionScore >= 50 ? '#f59e0b' : '#ef4444',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: '0.5px'
                        }}>
                            <ShieldCheck size={13} />
                            <span>{protectionScore}% SEGURO</span>
                        </div>
                    </div>

                    {/* Barra de progreso de protección lineal */}
                    <div style={{ width: '100%', background: 'var(--color-border)', height: '7px', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            width: `${protectionScore}%`,
                            background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                            height: '100%',
                            borderRadius: '99px',
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
                        }} />
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <div style={{
                            background: 'rgba(16,185,129,0.03)',
                            border: '1px solid rgba(16,185,129,0.12)',
                            borderRadius: '12px',
                            padding: '0.6rem 0.4rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', color: '#10b981', marginBottom: '0.15rem' }}>
                                <ShieldCheck size={14} />
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{active}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Vigentes</div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(245,158,11,0.03)',
                            border: '1px solid rgba(245,158,11,0.12)',
                            borderRadius: '12px',
                            padding: '0.6rem 0.4rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', marginBottom: '0.15rem' }}>
                                <Clock size={14} />
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{expiring}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Por Vencer</div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(239,68,68,0.03)',
                            border: '1px solid rgba(239,68,68,0.12)',
                            borderRadius: '12px',
                            padding: '0.6rem 0.4rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', color: '#ef4444', marginBottom: '0.15rem' }}>
                                <TriangleAlert size={14} />
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{expired}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Vencidos</div>
                        </div>
                    </div>
                </div>
            )}

            {!isFormVisible ? (
                <>
                    <button
                        onClick={() => setIsFormVisible(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.85rem', border: '1px solid #10b981', background: '#10b981', color: '#ffffff', cursor: 'pointer', fontSize: '0.92rem', marginBottom: '1.5rem', borderRadius: '12px' }}
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Registrar EPP</span><span className="inline sm:hidden">REGISTRAR</span>
                    </button>

                    {/* List */}
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Shield size={48} style={{ opacity: 0.15, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                            <p style={{ fontWeight: 600 }}>Sin EPPs registrados.</p>
                            <p style={{ fontSize: '0.82rem' }}>Registrá los elementos de protección del equipo para controlar sus vencimientos.</p>
                        </div>
                    ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {items.map((item, index) => {
                        const days = getDaysUntilExpiry(item.purchaseDate, item.lifeMonths);
                        const isExpired = days !== null && days < 0;
                        const config = getPPEConfig(item.type);
                        const IconComponent = config.icon;

                        // Cálculos para la "Barra de Vida Útil"
                        const maxDays = Number(item.lifeMonths || 12) * 30.4;
                        const pct = days !== null ? Math.max(0, Math.min(100, (days / maxDays) * 100)) : 100;
                        
                        // Color de estado correspondiente
                        const statusColor = isExpired ? '#ef4444' : (days !== null && days <= 30 ? '#f59e0b' : '#10b981');
                        const statusColorLight = isExpired ? 'rgba(239,68,68,0.1)' : (days !== null && days <= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)');

                        return (
                            <div
                                key={item.id}
                                className="card stagger-item"
                                style={{
                                    padding: '1.1rem 1.3rem',
                                    borderLeft: `5px solid ${statusColor}`,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: `${index * 0.08}s`
                                }}
                            >
                                {/* Brillo sutil de fondo del estado */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${statusColorLight} 0%, transparent 100%)`,
                                    opacity: 0.15,
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            {/* Icono circular del tipo de EPP */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: config.bg,
                                                color: config.color,
                                                border: `1px solid rgba(var(--color-primary-rgb), 0.08)`
                                            }}>
                                                <IconComponent size={15} strokeWidth={2.2} />
                                            </div>
                                            <strong style={{ fontSize: '0.98rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                                                {item.type}
                                            </strong>
                                            <StatusBadge days={days} />
                                        </div>

                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem 1rem', marginTop: '0.6rem' }}>
                                            {item.responsible && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                                    👤 <span style={{ opacity: 0.75 }}>Responsable:</span> {item.responsible}
                                                </span>
                                            )}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                📅 <span style={{ opacity: 0.75 }}>Entrega:</span> {new Date(item.purchaseDate).toLocaleDateString('es-AR')}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                ⏳ <span style={{ opacity: 0.75 }}>Vida útil:</span> {item.lifeMonths} meses
                                            </span>
                                            {item.certStandard && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 750 }}>
                                                    ✓✓ {item.certStandard}{item.certNumber ? ` · ${item.certNumber}` : ''}
                                                </span>
                                            )}
                                        </div>

                                        {/* 📊 Barra de progreso de Vida Útil Restante */}
                                        {days !== null && days > 0 && (
                                            <div style={{ marginTop: '0.9rem', maxWidth: '380px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    <span>Vida útil restante</span>
                                                    <span>{Math.round(pct)}% ({days} días)</span>
                                                </div>
                                                <div style={{ width: '100%', height: '5px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${pct}%`,
                                                        background: statusColor,
                                                        height: '100%',
                                                        borderRadius: '99px',
                                                        transition: 'width 0.5s ease-in-out'
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'rgba(239,68,68,0.04)',
                                            border: '1px solid rgba(239,68,68,0.12)',
                                            borderRadius: '8px',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.04)';
                                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.12)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <PPEReceiptPdfGenerator />
            </div>
            </>
            ) : (
                <div className="animate-fade-in">
                    <PremiumHeader 
                        title="Nuevo Registro de EPP"
                        subtitle="Registrá un nuevo Elemento de Protección Personal y hacele seguimiento a su vida útil."
                        icon={<Shield size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #10b981, #059669)"
                    />
                    <div className="card" style={{ padding: '2.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* 🪖 EPP Visual Grid Selector */}
                            <div style={{ gridColumn: '1 / -1', marginBottom: '0.2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)' }}>
                                    Tipo de EPP
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                    gap: '0.5rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '0.3rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    background: 'rgba(15,23,42,0.01)',
                                }} className="slim-scrollbar">
                                    {EPP_TYPES.map(t => {
                                        const config = getPPEConfig(t);
                                        const IconComponent = config.icon;
                                        const isSelected = form.type === t;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setForm({ ...form, type: t })}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.65rem 0.4rem',
                                                    borderRadius: '10px',
                                                    border: isSelected ? `2.5px solid ${config.color}` : '1.5px solid var(--color-border)',
                                                    background: isSelected ? config.bg : 'var(--color-surface)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isSelected ? `0 4px 10px ${config.bg}` : 'var(--shadow-sm)',
                                                    transform: isSelected ? 'scale(1.02)' : 'none',
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? '#ffffff' : config.bg,
                                                    color: config.color,
                                                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    <IconComponent size={15} strokeWidth={2.2} />
                                                </div>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: isSelected ? 800 : 600,
                                                    color: isSelected ? 'var(--color-text)' : 'var(--color-text-muted)',
                                                    textAlign: 'center',
                                                    lineHeight: 1.15,
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {t}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {form.type === 'Otro' && (
                                <div style={{ gridColumn: '1 / -1', animation: 'scaleIn 0.25s ease-out' }}>
                                    <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>Descripción del EPP Especial</label>
                                    <input
                                        className="input-professional"
                                        value={form.custom}
                                        onChange={e => setForm({ ...form, custom: e.target.value })}
                                        placeholder="Ej: Pantalla de soldadura fotosensible"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>Responsable (Trabajador)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-professional"
                                        style={{ paddingLeft: '2.3rem' }}
                                        value={form.responsible}
                                        onChange={e => setForm({ ...form, responsible: e.target.value })}
                                        placeholder="Nombre del trabajador"
                                    />
                                    <User size={14} color="var(--color-text-light)" style={{ position: 'absolute', left: '0.9rem', top: '1.05rem' }} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>Fecha de compra / entrega</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-professional"
                                        style={{ paddingLeft: '2.3rem' }}
                                        type="date"
                                        value={form.purchaseDate}
                                        onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                                    />
                                    <Calendar size={14} color="var(--color-text-light)" style={{ position: 'absolute', left: '0.9rem', top: '1.05rem', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>Vida útil (meses)</label>
                                <input
                                    className="input-professional"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={form.lifeMonths}
                                    onChange={e => setForm({ ...form, lifeMonths: e.target.value })}
                                    placeholder="12"
                                />
                            </div>
                            
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>Norma de Certificación</label>
                                <select
                                    className="input-professional"
                                    value={form.certStandard}
                                    onChange={e => setForm({ ...form, certStandard: e.target.value })}
                                >
                                    <option value="">— Seleccioná —</option>
                                    {CERT_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div style={{ gridColumn: form.certStandard ? 'auto' : '1 / -1' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem' }}>N° de Certificado / Sello AR</label>
                                <input
                                    className="input-professional"
                                    value={form.certNumber}
                                    onChange={e => setForm({ ...form, certNumber: e.target.value })}
                                    placeholder="Ej: AR-2025-001234"
                                />
                            </div>

                            {showARStamp && (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(37,99,235,0.06) 100%)',
                                    border: '1px dashed rgba(245,158,11,0.35)',
                                    borderRadius: '14px',
                                    padding: '0.8rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    animation: 'scaleIn 0.3s ease-out',
                                    boxShadow: '0 4px 12px rgba(245,158,11,0.04)'
                                }}>
                                    <div style={{
                                        flexShrink: 0, width: '46px', height: '46px', borderRadius: '50%',
                                        background: 'radial-gradient(circle, #fcd34d 0%, #d97706 100%)',
                                        border: '2px solid #ffffff', boxShadow: '0 0 12px rgba(217,119,6,0.3), inset 0 0 6px rgba(255,255,255,0.5)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: '#78350f', fontFamily: 'var(--font-heading)', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.2px',
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        <Award size={14} strokeWidth={2.5} style={{ marginBottom: '-1px' }} />
                                        <span>CONFORME</span>
                                        <span style={{ fontSize: '0.35rem', opacity: 0.85 }}>Sello AR</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <CheckCircle size={12} /> Marcado AR Homologado
                                        </h4>
                                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                                            Este EPP cumple las directivas de trazabilidad y QR exigidas por la **Res. SIyC 18/25**.
                                        </p>
                                    </div>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)', boxShadow: 'var(--shadow-sm)', animation: 'pulse-soft 2.5s infinite'
                                    }}>
                                        <QrCode size={18} strokeWidth={2.2} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="no-print floating-action-bar">
                        <button
                            onClick={() => setIsFormVisible(false)}
                            className="btn-floating-action"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                            <X size={18} /> CANCELAR
                        </button>
                        <button
                            onClick={handleAdd}
                            className="btn-floating-action"
                            style={{ background: '#10b981', color: '#ffffff', border: 'none' }}
                        >
                            <ShieldCheck size={18} /> GUARDAR EPP
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
