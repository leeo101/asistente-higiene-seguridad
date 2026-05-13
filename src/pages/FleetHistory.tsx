import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Calendar, FileText, CarFront, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FleetHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [inspections, setInspections] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('fleet_inspections_db') || '[]');
        setInspections(saved);
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Está seguro de eliminar este registro?')) {
            const updated = inspections.filter((p: any) => p.id !== id);
            localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));
            setInspections(updated);
            toast.success('Registro eliminado');
        }
    };

    const handleEdit = (form: any) => {
        navigate('/fleet-form', { state: { editData: form } });
    };

    const filteredInspections = inspections.filter((p: any) => 
        p.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brandModel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
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
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Historial de Inspecciones Vehiculares</h1>
            </div>

            <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por patente, conductor o modelo..." 
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
                        onClick={() => navigate('/fleet-form')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} /> Nueva Inspección
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredInspections.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}>
                            <CarFront size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay inspecciones registradas</h3>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Cargue la primera inspección pre-operacional.</p>
                        </div>
                    ) : (
                        filteredInspections.map((form: any) => {
                            const isApto = form.status === 'Apto';
                            
                            return (
                                <div 
                                    key={form.id}
                                    onClick={() => handleEdit(form)}
                                    className="card hover-lift"
                                    style={{
                                        cursor: 'pointer',
                                        padding: '1.5rem',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>{form.plate}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} /> {new Date(form.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span style={{ 
                                            background: isApto ? '#f0fdf4' : '#fef2f2', 
                                            color: isApto ? '#16a34a' : '#dc2626', 
                                            padding: '0.3rem 0.6rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 900,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            {isApto ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                            {form.status?.toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Modelo:</span>
                                            <span style={{ fontWeight: 600 }}>{form.brandModel || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Conductor:</span>
                                            <span style={{ fontWeight: 600 }}>{form.driver}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>Km/Hr:</span>
                                            <span style={{ fontWeight: 600 }}>{form.mileage || '-'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <FileText size={14} /> Ver / Editar
                                        </span>
                                        <button 
                                            onClick={(e) => handleDelete(form.id, e)}
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
