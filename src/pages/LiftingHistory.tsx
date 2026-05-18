import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Calendar, FileText, Weight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LiftingHistory(): React.ReactElement | null {
    useDocumentTitle('Historial de Izajes');
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
        setPlans(saved);
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Está seguro de eliminar este registro?')) {
            const updated = plans.filter((p: any) => p.id !== id);
            localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
            setPlans(updated);
            toast.success('Registro eliminado');
        }
    };

    const handleEdit = (plan: any) => {
        navigate('/lifting-form', { state: { editData: plan } });
    };

    const filteredPlans = plans.filter((p: any) => 
        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: '6rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Historial de Izajes</h1>
            </div>

            <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por ubicación o equipo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 2.8rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => navigate('/lifting-form')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            flex: '1 1 150px'
                        }}
                    >
                        <Plus size={20} /> Nuevo Plan
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredPlans.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}>
                            <FileText size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay planes registrados</h3>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Cree el primer plan de izaje seguro.</p>
                        </div>
                    ) : (
                        filteredPlans.map((plan: any) => {
                            const isCritical = parseFloat(plan.loadWeight) / parseFloat(plan.equipmentCapacity) * 100 >= 75;
                            
                            return (
                                <div 
                                    key={plan.id}
                                    onClick={() => handleEdit(plan)}
                                    className="card hover-lift"
                                    style={{
                                        cursor: 'pointer',
                                        padding: '1.5rem',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>{plan.location}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} /> {new Date(plan.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {isCritical && (
                                            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>CRÍTICO</span>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Equipo:</span>
                                            <span style={{ fontWeight: 600 }}>{plan.equipment}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Carga:</span>
                                            <span style={{ fontWeight: 600 }}>{plan.loadWeight} kg</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Capacidad:</span>
                                            <span style={{ fontWeight: 600 }}>{plan.equipmentCapacity} kg</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Weight size={14} /> Ver / Editar
                                        </span>
                                        <button 
                                            onClick={(e) => handleDelete(plan.id, e)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-text-light)',
                                                cursor: 'pointer',
                                                padding: '0.5rem'
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
