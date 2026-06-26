import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Calendar, AlertTriangle, FileText, CheckCircle2, Siren, Users, Map, FirstAid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';

export default function EmergencyPlan() {
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const [plans, setPlans] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        facility: '',
        lastUpdate: new Date().toISOString().split('T')[0],
        nextDrill: '',
        brigadeLeader: '',
        status: 'active',
        emergencyContacts: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const data = localStorage.getItem('ehs_emergency_plans');
        if (data) {
            setPlans(JSON.parse(data));
        }
    }, []);

    const handleSave = () => {
        if (!formData.title || !formData.facility) {
            toast.error('Complete el título y la instalación.');
            return;
        }
        
        const newRecord = {
            ...formData,
            id: formData.id || `EMP-${Date.now()}`
        };

        let updated;
        if (formData.id) {
            updated = plans.map(p => p.id === formData.id ? newRecord : p);
            toast.success('Plan de Emergencia actualizado.');
        } else {
            updated = [newRecord, ...plans];
            toast.success('Plan de Emergencia registrado exitosamente.');
        }

        setPlans(updated);
        localStorage.setItem('ehs_emergency_plans', JSON.stringify(updated));
        syncCollection('ehs_emergency_plans', updated);
        setShowForm(false);
        setFormData({
            id: '',
            title: '',
            facility: '',
            lastUpdate: new Date().toISOString().split('T')[0],
            nextDrill: '',
            brigadeLeader: '',
            status: 'active',
            emergencyContacts: ''
        });
    };

    const columns = [
        {
            header: 'Título / Instalación',
            accessor: 'title',
            render: (item: any) => <div style={{ fontWeight: 700 }}>{item.title} <br/><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{item.facility}</span></div>
        },
        {
            header: 'Última Revisión',
            accessor: 'lastUpdate',
            render: (item: any) => new Date(item.lastUpdate).toLocaleDateString('es-AR')
        },
        {
            header: 'Líder de Brigada',
            accessor: 'brigadeLeader'
        },
        {
            header: 'Próximo Simulacro',
            accessor: 'nextDrill',
            render: (item: any) => {
                if (!item.nextDrill) return '-';
                return new Date(item.nextDrill).toLocaleDateString('es-AR');
            }
        },
        {
            header: 'Estado',
            accessor: 'status',
            render: (item: any) => (
                <span style={{ 
                    color: item.status === 'active' ? '#16a34a' : '#d97706', 
                    background: item.status === 'active' ? '#f0fdf4' : '#fffbeb', 
                    padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' 
                }}>
                    {item.status === 'active' ? 'Vigente' : 'En Revisión'}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <button onClick={() => { setFormData(item); setShowForm(true); }} style={{ padding: '4px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                    Editar
                </button>
            )
        }
    ];

    const filtered = plans.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.facility.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <PremiumHeader 
                    title="Planes de Emergencia"
                    subtitle="Gestión de roles, brigadas y simulacros"
                    icon={<Siren size={36} color="#ffffff" />}
                />
                
                {showForm ? (
                    <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem', borderRadius: '1rem', background: 'var(--color-surface)' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>
                            <Map size={20} /> {formData.id ? 'Editar Plan' : 'Nuevo Plan'}
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Título del Plan</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} placeholder="Ej: Plan Evacuación Sede Central" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Instalación / Sector</label>
                                <input type="text" value={formData.facility} onChange={e => setFormData({...formData, facility: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Líder de Brigada</label>
                                <input type="text" value={formData.brigadeLeader} onChange={e => setFormData({...formData, brigadeLeader: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Estado</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <option value="active">Vigente</option>
                                    <option value="review">En Revisión</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Fecha de Última Revisión</label>
                                <input type="date" value={formData.lastUpdate} onChange={e => setFormData({...formData, lastUpdate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Próximo Simulacro</label>
                                <input type="date" value={formData.nextDrill} onChange={e => setFormData({...formData, nextDrill: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Contactos de Emergencia (Bomberos, Ambulancia, etc.)</label>
                                <textarea value={formData.emergencyContacts} onChange={e => setFormData({...formData, emergencyContacts: e.target.value})} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={handleSave} className="btn-primary" style={{ flex: 1, background: '#10b981' }}>Guardar</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input type="text" placeholder="Buscar plan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            {!isMobile && (
                                <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={18} /> Nuevo Plan
                                </button>
                            )}
                        </div>
                        
                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--color-surface)' }}>
                            <DataTable 
                                data={filtered}
                                columns={columns}
                                emptyMessage="No hay planes de emergencia cargados."
                                emptyIcon={<Siren size={48} />}
                            />
                        </div>

                        {isMobile && (
                            <button onClick={() => setShowForm(true)} style={{ position: 'fixed', bottom: '5rem', right: '1.5rem', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <Plus size={24} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AnimatedPage>
    );
}
