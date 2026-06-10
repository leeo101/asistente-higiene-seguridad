import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, RefreshCw, Eye, Trash2, Target, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const CAPA_TYPES = [{ id: 'corrective', name: 'Correctiva', icon: '🔧' }, { id: 'preventive', name: 'Preventiva', icon: '🛡️' }, { id: 'improvement', name: 'Mejora', icon: '📈' }, { id: 'containment', name: 'Contención', icon: '🚨' }];
const PRIORITY = { critical: { label: 'CRÍTICA', color: '#dc2626', days: 3, icon: '🔴' }, high: { label: 'ALTA', color: '#f59e0b', days: 7, icon: '🟠' }, medium: { label: 'MEDIA', color: '#3b82f6', days: 15, icon: '🔵' }, low: { label: 'BAJA', color: '#16a34a', days: 30, icon: '🟢' } };
const STATUS = { draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' }, open: { label: 'ABIERTA', color: '#dc2626', bg: '#fef2f2' }, in_progress: { label: 'EN PROGRESO', color: '#3b82f6', bg: '#eff6ff' }, completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' } };

export default function CAPAPage(): React.ReactElement | null {
    const navigate = useNavigate();
    const [capas, setCapas] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); const s = localStorage.getItem('ehs_capa_db'); if (s) setCapas(JSON.parse(s)); return () => window.removeEventListener('resize', h); }, []);
    const save = (d: any[]) => { localStorage.setItem('ehs_capa_db', JSON.stringify(d)); setCapas(d); };
    const updateStatus = (id: string, s: string) => save(capas.map((c: any) => c.id === id ? { ...c, status: s } : c));
    const del = (id: string) => { setConfirmModal({ isOpen: true, payload: id }); };
    
    const executeDelete = () => {
        if (confirmModal.payload) save(capas.filter((c: any) => c.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };
    
    const filtered = capas.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.responsible?.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: capas.length, open: capas.filter(c => c.status === 'open' || c.status === 'in_progress').length, completed: capas.filter(c => c.status === 'completed').length, critical: capas.filter(c => c.priority === 'critical' && c.status !== 'completed').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '0.75rem 1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={isMobile ? 18 : 20}  />
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '1.5rem', boxSizing: 'border-box' }} onClick={onClose}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', margin: 0, borderRadius: isMobile ? '28px' : 'var(--radius-2xl)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle CAPA</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <XCircle size={24} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <RefreshCw size={40} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{capa.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{capa.responsible}</div>
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
