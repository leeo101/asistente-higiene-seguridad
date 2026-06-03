import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Calendar, FileText, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';

export default function EvacuationSimulatorHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [simulations, setSimulations] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
        setSimulations(saved);
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Está seguro de eliminar esta simulación?')) {
            const updated = simulations.filter((p: any) => p.id !== id);
            localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
            setSimulations(updated);
            toast.success('Simulación eliminada');
        }
    };

    const handleEdit = (form: any) => {
        navigate('/evacuation-form', { state: { editData: form } });
    };

    const filteredSimulations = simulations.filter((p: any) => 
        p.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.evaluator?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: isMobile ? '7.5rem' : '6.5rem' }}>
            <main style={{ padding: '0rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <PremiumHeader
                    title="Simulador de Evacuación"
                    subtitle="Historial de simulaciones teóricas"
                    icon={<Timer size={36} />} onBack={() => navigate('/#activity')}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/evacuation-form')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem',
                                background: '#36B37E', color: 'white', border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(54, 179, 126, 0.4)'
                            }}
                        >
                            <Plus size={20} /> Nueva Simulación
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por sector o evaluador..." 
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredSimulations.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}>
                            <Timer size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay simulaciones</h3>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Realice la primera simulación teórica de evacuación.</p>
                        </div>
                    ) : (
                        filteredSimulations.map((form: any) => (
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
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>{form.sector}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={14} /> {new Date(form.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span style={{ 
                                        background: '#f0fdf4', 
                                        color: '#16a34a', 
                                        padding: '0.3rem 0.6rem', 
                                        borderRadius: '6px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 900,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <Timer size={14} />
                                        {form.calculatedTime}s
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Población (N):</span>
                                        <span style={{ fontWeight: 600 }}>{form.peopleCount} pers.</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Ancho Salidas (A):</span>
                                        <span style={{ fontWeight: 600 }}>{form.exitWidth}m</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Evaluador:</span>
                                        <span style={{ fontWeight: 600 }}>{form.evaluator}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FileText size={14} /> Ver Reporte
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
                                        <Trash2 size={18}  />
                        </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
