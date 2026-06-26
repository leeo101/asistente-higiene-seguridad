import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Calendar, HeartPulse, UserCheck, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';

export default function MedicalAptitudes() {
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const [exams, setExams] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    
    const [formData, setFormData] = useState({
        id: '',
        workerName: '',
        dni: '',
        examType: 'periodico',
        examDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
        result: 'apto',
        notes: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const data = localStorage.getItem('ehs_medical_db');
        if (data) {
            setExams(JSON.parse(data));
        }
    }, []);

    const handleSave = () => {
        if (!formData.workerName || !formData.dni) {
            toast.error('Complete el nombre y DNI del trabajador.');
            return;
        }
        
        const newRecord = {
            ...formData,
            id: formData.id || `MED-${Date.now()}`
        };

        let updated;
        if (formData.id) {
            updated = exams.map(e => e.id === formData.id ? newRecord : e);
            toast.success('Examen actualizado.');
        } else {
            updated = [newRecord, ...exams];
            toast.success('Examen registrado exitosamente.');
        }

        setExams(updated);
        localStorage.setItem('ehs_medical_db', JSON.stringify(updated));
        syncCollection('ehs_medical_db', updated);
        setShowForm(false);
        setFormData({
            id: '',
            workerName: '',
            dni: '',
            examType: 'periodico',
            examDate: new Date().toISOString().split('T')[0],
            expirationDate: '',
            result: 'apto',
            notes: ''
        });
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case 'apto': return <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><CheckCircle2 size={14}/> Apto</span>;
            case 'preexistencias': return <span style={{ color: '#d97706', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><AlertTriangle size={14}/> Apto c/ Preexistencias</span>;
            case 'no_apto': return <span style={{ color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><XCircle size={14}/> No Apto</span>;
            default: return null;
        }
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'examDate',
            render: (item: any) => new Date(item.examDate).toLocaleDateString('es-AR')
        },
        {
            header: 'Trabajador',
            accessor: 'workerName',
            render: (item: any) => <div style={{ fontWeight: 700 }}>{item.workerName} <br/><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>DNI: {item.dni}</span></div>
        },
        {
            header: 'Tipo de Examen',
            accessor: 'examType',
            render: (item: any) => <span style={{ textTransform: 'capitalize' }}>{item.examType.replace('_', ' ')}</span>
        },
        {
            header: 'Vencimiento',
            accessor: 'expirationDate',
            render: (item: any) => {
                if (!item.expirationDate) return '-';
                const exp = new Date(item.expirationDate);
                const isExpired = exp < new Date();
                return <span style={{ color: isExpired ? '#dc2626' : 'inherit', fontWeight: isExpired ? 800 : 'normal' }}>{exp.toLocaleDateString('es-AR')} {isExpired && ' (Vencido)'}</span>;
            }
        },
        {
            header: 'Resultado',
            accessor: 'result',
            render: (item: any) => getResultBadge(item.result)
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

    const filtered = exams.filter(e => e.workerName.toLowerCase().includes(searchTerm.toLowerCase()) || e.dni.includes(searchTerm));

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <PremiumHeader 
                    title="Aptitudes Médicas"
                    subtitle="Gestión de exámenes preocupacionales y periódicos"
                    icon={<HeartPulse size={36} color="#ffffff" />}
                />
                
                {showForm ? (
                    <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem', borderRadius: '1rem', background: 'var(--color-surface)' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>
                            <FileText size={20} /> {formData.id ? 'Editar Examen' : 'Nuevo Registro'}
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Trabajador</label>
                                <input type="text" value={formData.workerName} onChange={e => setFormData({...formData, workerName: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>DNI / CUIL</label>
                                <input type="text" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Tipo de Examen</label>
                                <select value={formData.examType} onChange={e => setFormData({...formData, examType: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <option value="preocupacional">Preocupacional</option>
                                    <option value="periodico">Periódico</option>
                                    <option value="egreso">De Egreso</option>
                                    <option value="cambio_tarea">Cambio de Tareas</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Resultado</label>
                                <select value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <option value="apto">Apto</option>
                                    <option value="preexistencias">Apto con Preexistencias</option>
                                    <option value="no_apto">No Apto</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Fecha Examen</label>
                                <input type="date" value={formData.examDate} onChange={e => setFormData({...formData, examDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Vencimiento (Opcional)</label>
                                <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Observaciones</label>
                                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
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
                                <input type="text" placeholder="Buscar trabajador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            {!isMobile && (
                                <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={18} /> Nuevo Examen
                                </button>
                            )}
                        </div>
                        
                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--color-surface)' }}>
                            <DataTable 
                                data={filtered}
                                columns={columns}
                                emptyMessage="No hay registros médicos cargados."
                                emptyIcon={<HeartPulse size={48} />}
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
