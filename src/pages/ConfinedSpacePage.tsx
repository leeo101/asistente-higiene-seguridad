import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, Tent, Eye, Trash2, Wind, Droplets, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const PERMIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
    active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
    completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' }
};

export default function ConfinedSpacePage(): React.ReactElement | null {
    const navigate = useNavigate();
    const [permits, setPermits] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPermit, setSelectedPermit] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        const saved = localStorage.getItem('confined_space_permits_db');
        if (saved) setPermits(JSON.parse(saved));
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const savePermits = (data: any[]) => { localStorage.setItem('confined_space_permits_db', JSON.stringify(data)); setPermits(data); };

    const updateStatus = (id: string, status: string) => { savePermits(permits.map((p: any) => p.id === id ? { ...p, status } : p)); };
    const deletePermit = (id: string) => { setConfirmModal({ isOpen: true, payload: id }); };

    const executeDelete = () => {
        if (confirmModal.payload) savePermits(permits.filter((p: any) => p.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };

    const filtered = permits.filter(p => p.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) || p.location?.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: permits.length, active: permits.filter(p => p.status === 'active').length, pending: permits.filter(p => p.status === 'pending').length, completed: permits.filter(p => p.status === 'completed').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
}

function PermitCard({ permit, statusConfig, onStart, onComplete, onView, onDelete, isMobile }: any) {
    return (
        <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${statusConfig.color}`, flexShrink: 0 }}><Tent size={isMobile ? 20 : 24} color={statusConfig.color} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{permit.spaceName}</h3>
                    <span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>📍 {permit.location || 'Sin ubicación'}</span>
                    <span>👤 {permit.worker || 'Sin trabajador'}</span>
                    <span>👁️ {permit.attendant || 'Sin vigía'}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {permit.status === 'pending' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                {permit.status === 'active' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                <button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button>
                <button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd, isMobile }: any) {
    return (<div style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}><div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'var(--color-background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tent size={40} color="var(--color-text-muted)" /></div><h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Sin Permisos</h3><p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Creá permisos de espacio confinado según OSHA 1910.146</p><button onClick={onAdd} className="btn-primary" style={{ width: 'auto', margin: 0 }}><Plus size={20} style={{ marginRight: '0.5rem' }} />Primer Permiso</button></div>);
}

function DetailModal({ permit, onClose, isMobile, onPrint }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '1.5rem', boxSizing: 'border-box' }} onClick={onClose}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', margin: 0, borderRadius: isMobile ? '28px' : 'var(--radius-2xl)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle del Permiso</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <XCircle size={24} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <Tent size={40} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{permit.spaceName}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{permit.location}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
                    <button 
                        onClick={onPrint} 
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-primary)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Printer size={18} />
                        Imprimir / PDF
                    </button>
                    <button onClick={onClose} className="btn-primary" style={{ flex: 1, margin: 0 }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

