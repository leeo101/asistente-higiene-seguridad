import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Activity, ShieldCheck, FileText, AlertCircle, Award } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';

export default function WorkerPortal() {
    const { dni: urlDni } = useParams();
    const navigate = useNavigate();
    const [dniInput, setDniInput] = useState(urlDni || '');
    const [searchedDni, setSearchedDni] = useState(urlDni || '');
    const [workerData, setWorkerData] = useState<any>(null);

    useEffect(() => {
        if (searchedDni) {
            fetchWorkerData(searchedDni);
        }
    }, [searchedDni]);

    const fetchWorkerData = (dni: string) => {
        // 1. Get Medical Aptitudes
        const medDataStr = localStorage.getItem('ehs_medical_db');
        const medData = medDataStr ? JSON.parse(medDataStr) : [];
        const workerAptitudes = medData.filter((m: any) => m.dni === dni);

        // 2. Get Trainings
        const trainDataStr = localStorage.getItem('training_history');
        const trainData = trainDataStr ? JSON.parse(trainDataStr) : [];
        const workerTrainings: any[] = [];
        trainData.forEach((t: any) => {
            if (t.attendees && Array.isArray(t.attendees)) {
                // If attendees have DNI, match it. For now we match if name/dni matches. 
                // Since attendees might just be strings or objects, we'll try to find a match.
                t.attendees.forEach((att: any) => {
                    if (typeof att === 'object' && att.dni === dni) {
                        workerTrainings.push({ ...t, attendeeData: att });
                    } else if (typeof att === 'string' && att.includes(dni)) {
                        workerTrainings.push({ ...t, attendeeData: { name: att } });
                    }
                });
            }
        });

        if (workerAptitudes.length > 0 || workerTrainings.length > 0) {
            // Assume the most recent aptitude has the name
            const name = workerAptitudes.length > 0 ? workerAptitudes[0].workerName : workerTrainings[0].attendeeData?.name || 'Trabajador';
            
            // Check status
            const hasValidMedical = workerAptitudes.some((a: any) => 
                (a.result === 'apto' || a.result === 'preexistencias') && 
                new Date(a.expirationDate) > new Date()
            );

            setWorkerData({
                name,
                dni,
                aptitudes: workerAptitudes,
                trainings: workerTrainings,
                status: hasValidMedical ? 'HABILITADO' : 'PENDIENTE'
            });
        } else {
            setWorkerData(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (dniInput.trim()) {
            navigate(`/worker-portal/${dniInput.trim()}`);
            setSearchedDni(dniInput.trim());
        }
    };

    return (
        <AnimatedPage>
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <ShieldCheck size={48} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Portal del Trabajador</h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Consulta de estado de aptitud y capacitaciones</p>
                    </div>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Ingrese DNI del trabajador..." 
                                value={dniInput}
                                onChange={(e) => setDniInput(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                            />
                        </div>
                        <button type="submit" style={{ padding: '0 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            Buscar
                        </button>
                    </form>

                    {searchedDni && !workerData && (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <AlertCircle size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.2rem', color: '#475569', margin: 0 }}>No se encontraron registros</h3>
                            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>No hay datos médicos ni de capacitación asociados al DNI {searchedDni}.</p>
                        </div>
                    )}

                    {workerData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Profile Card */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCircle size={48} color="#94a3b8" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>{workerData.name}</h2>
                                    <p style={{ color: '#64748b', margin: '0 0 0.8rem 0', fontWeight: 500 }}>DNI: {workerData.dni}</p>
                                    <span style={{ 
                                        padding: '0.3rem 0.8rem', 
                                        borderRadius: '20px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800,
                                        background: workerData.status === 'HABILITADO' ? '#dcfce7' : '#fef08a',
                                        color: workerData.status === 'HABILITADO' ? '#166534' : '#854d0e'
                                    }}>
                                        {workerData.status}
                                    </span>
                                </div>
                            </div>

                            {/* Aptitudes Médicas */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={20} color="#10b981" /> Aptitud Médica
                                </h3>
                                {workerData.aptitudes.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {workerData.aptitudes.map((apt: any, i: number) => {
                                            const isExpired = new Date(apt.expirationDate) < new Date();
                                            return (
                                                <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${isExpired ? '#ef4444' : '#10b981'}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>{apt.examType === 'pre' ? 'Preocupacional' : 'Periódico'}</span>
                                                        <span style={{ fontSize: '0.85rem', color: isExpired ? '#ef4444' : '#64748b', fontWeight: isExpired ? 700 : 500 }}>
                                                            Vence: {new Date(apt.expirationDate).toLocaleDateString('es-AR')}
                                                        </span>
                                                    </div>
                                                    <span style={{ 
                                                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                        background: apt.result === 'apto' ? '#dcfce7' : apt.result === 'preexistencias' ? '#fef08a' : '#fee2e2',
                                                        color: apt.result === 'apto' ? '#166534' : apt.result === 'preexistencias' ? '#854d0e' : '#991b1b'
                                                    }}>
                                                        {apt.result === 'apto' ? 'APTO' : apt.result === 'preexistencias' ? 'APTO CON PREEXISTENCIAS' : 'NO APTO'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Sin registros médicos.</p>
                                )}
                            </div>

                            {/* Capacitaciones */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={20} color="#3b82f6" /> Capacitaciones Realizadas
                                </h3>
                                {workerData.trainings.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {workerData.trainings.map((t: any, i: number) => (
                                            <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <FileText size={24} color="#94a3b8" />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#334155' }}>{t.topic}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{new Date(t.date).toLocaleDateString('es-AR')} • {t.duration} hs</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Sin capacitaciones registradas.</p>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}
