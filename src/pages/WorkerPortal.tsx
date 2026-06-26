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
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <ShieldCheck size={48} className="mx-auto text-blue-500 mb-4" />
                        <h1 className="text-3xl font-extrabold text-slate-900 m-0">Portal del Trabajador</h1>
                        <p className="text-slate-500 mt-2">Consulta de estado de aptitud y capacitaciones</p>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Ingrese DNI del trabajador..." 
                                value={dniInput}
                                onChange={(e) => setDniInput(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-base bg-white"
                            />
                        </div>
                        <button type="submit" className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0">
                            Buscar
                        </button>
                    </form>

                    {searchedDni && !workerData && (
                        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 m-0">No se encontraron registros</h3>
                            <p className="text-slate-400 mt-2">No hay datos médicos ni de capacitación asociados al DNI {searchedDni}.</p>
                        </div>
                    )}

                    {workerData && (
                        <div className="flex flex-col gap-6">
                            {/* Profile Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                    <UserCircle size={48} className="text-slate-400" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{workerData.name}</h2>
                                    <p className="text-slate-500 font-medium mb-3">DNI: {workerData.dni}</p>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${workerData.status === 'HABILITADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {workerData.status}
                                    </span>
                                </div>
                            </div>

                            {/* Aptitudes Médicas */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Activity size={20} className="text-green-500" /> Aptitud Médica
                                </h3>
                                {workerData.aptitudes.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {workerData.aptitudes.map((apt: any, i: number) => {
                                            const isExpired = new Date(apt.expirationDate) < new Date();
                                            return (
                                                <div key={i} className={`p-4 bg-slate-50 rounded-xl border-l-4 ${isExpired ? 'border-red-500' : 'border-green-500'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-semibold text-slate-700">{apt.examType === 'pre' ? 'Preocupacional' : 'Periódico'}</span>
                                                        <span className={`text-sm ${isExpired ? 'text-red-500 font-bold' : 'text-slate-500 font-medium'}`}>
                                                            Vence: {new Date(apt.expirationDate).toLocaleDateString('es-AR')}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${apt.result === 'apto' ? 'bg-green-100 text-green-800' : apt.result === 'preexistencias' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {apt.result === 'apto' ? 'APTO' : apt.result === 'preexistencias' ? 'APTO CON PREEXISTENCIAS' : 'NO APTO'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">Sin registros médicos.</p>
                                )}
                            </div>

                            {/* Capacitaciones */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Award size={20} className="text-blue-500" /> Capacitaciones Realizadas
                                </h3>
                                {workerData.trainings.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {workerData.trainings.map((t: any, i: number) => (
                                            <div key={i} className="p-4 bg-slate-50 rounded-xl flex gap-4 items-center transition-all hover:bg-slate-100">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <FileText size={24} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-700">{t.topic}</div>
                                                    <div className="text-sm text-slate-500 mt-1">{new Date(t.date).toLocaleDateString('es-AR')} • {t.duration} hs</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">Sin capacitaciones registradas.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}
