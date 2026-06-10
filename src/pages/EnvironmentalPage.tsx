import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, Leaf, Eye, Trash2, Activity, Droplets, Wind } from 'lucide-react';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const MONITORING_TYPES = [{ id: 'air', name: 'Calidad de Aire', icon: '💨' }, { id: 'water', name: 'Calidad de Agua', icon: '💧' }, { id: 'noise', name: 'Ruido', icon: '🔊' }, { id: 'waste', name: 'Residuos', icon: '♻️' }, { id: 'emissions', name: 'Emisiones', icon: '🏭' }, { id: 'soil', name: 'Suelo', icon: '🌱' }];
const STATUS = { normal: { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4' }, warning: { label: 'PRECAUCIÓN', color: '#f59e0b', bg: '#fffbeb' }, critical: { label: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' } };

export default function EnvironmentalPage(): React.ReactElement | null {
    const navigate = useNavigate();
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); const s = localStorage.getItem('environmental_measurements_db'); if (s) setMeasurements(JSON.parse(s)); return () => window.removeEventListener('resize', h); }, []);
    const save = (d: any[]) => { localStorage.setItem('environmental_measurements_db', JSON.stringify(d)); setMeasurements(d); };
    
    const del = (id: string) => { setConfirmModal({ isOpen: true, payload: id }); };

    const executeDelete = () => {
        if (confirmModal.payload) save(measurements.filter((m: any) => m.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };
    const filtered = measurements.filter(m => m.stationName.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: measurements.length, normal: measurements.filter(m => m.status === 'normal').length, warning: measurements.filter(m => m.status === 'warning').length, critical: measurements.filter(m => m.status === 'critical').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
function DetailModal({ measurement, onClose, isMobile }: any) { return (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '1.5rem', boxSizing: 'border-box' }} onClick={onClose}><div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', margin: 0, borderRadius: isMobile ? '28px' : 'var(--radius-2xl)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}><h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle</h2><button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button></div><div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }}><Leaf size={40} color="#10b981" style={{ marginBottom: '0.5rem' }} /><div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{measurement.stationName}</div><div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{measurement.location}</div></div><button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>Cerrar</button></div></div>); }
