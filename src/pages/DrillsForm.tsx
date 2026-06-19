import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ArrowLeft, Save, Play, Square, TimerReset,
    Building2, Flame, Users, FileText, CheckCircle2,
    Clock, Search, Share2, Printer, Plus, Pencil, Siren
} from 'lucide-react';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function Drills(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const location = useLocation();
    const editData = location.state?.editData;

    useDocumentTitle(editData ? 'Editar Simulacro' : 'Registro de Simulacro');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [timeInSeconds, setTimeInSeconds] = useState(editData?.tiempoTotalSegundos || 0);
    const timerRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState(editData || {
        empresa: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),

        hipotesis: 'Incendio',
        origen: '',

        manualMinutes: '',
        manualSeconds: '',

        evacuados: '',
        heridosSimulados: '0',
        puntosEncuentro: '',
        viasEscape: '',

        alarmaSonó: 'Sí',
        rolCumplido: 'Sí',
        observaciones: '',

        signature: '',
        operatorSignature: '',
        supervisorSignature: '',
        professionalSignature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    });

    const [professional, setProfessional] = useState<any>({
        name: '',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setFormData((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

    const [showShareModal, setShowShareModal] = useState(false);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'

    useEffect(() => {
        window.scrollTo(0, 0);
        if (editData) {
            setFormData({
                ...editData,
                operatorSignature: editData.operatorSignature || '',
                professionalSignature: editData.professionalSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signature || '',
                signature: editData.signature || editData.supervisorSignature || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            });
        }
    }, [editData]);

    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        let stamp = null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
            stamp = parsed.stamp || null;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || '',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
        }
    }, []);



    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeInSeconds(prev => prev + 1);
            }, 1000);
        } else if (!isRunning && timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    // Timer controls
    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeInSeconds(0);
        setFormData(p => ({ ...p, manualMinutes: '', manualSeconds: '' }));
    };

    // Auto-update manual fields based on timer
    useEffect(() => {
        if (timeInSeconds > 0) {
            const m = Math.floor(timeInSeconds / 60);
            const s = timeInSeconds % 60;
            setFormData(p => ({
                ...p,
                manualMinutes: m.toString(),
                manualSeconds: s.toString()
            }));
        }
    }, [timeInSeconds]);

    const handleInput = (field, value) => {
        setFormData(p => ({ ...p, [field]: value }));
    };

    const doSave = () => {
        if (!formData.empresa || !formData.origen) {
            toast.error('Complete la empresa y el origen del siniestro.');
            return;
        }

        const mins = parseInt(formData.manualMinutes || 0);
        const secs = parseInt(formData.manualSeconds || 0);

        if (mins === 0 && secs === 0) {
            toast.error('Debe registrar un tiempo de evacuación válido.');
            return;
        }

        const report = {
            id: editData?.id || Date.now(),
            date: editData?.date || new Date().toISOString(),
            evaluador: editData?.evaluador || currentUser?.displayName || 'Profesional HSE',
            tiempoVisual: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
            tiempoTotalSegundos: (mins * 60) + secs,
            ...formData,
            professionalSignature: formData.professionalSignature || professional.signature,
            professionalName: formData.professionalName || professional.name,
            professionalLicense: formData.professionalLicense || professional.license,
            professionalStamp: formData.professionalStamp || professional.stamp,
        };

        let history = JSON.parse(localStorage.getItem('drills_history') || '[]');

        if (editData) {
            history = history.map(item => item.id === editData.id ? report : item);
        } else {
            history.unshift(report);
        }

        localStorage.setItem('drills_history', JSON.stringify(history));
        syncCollection('drills_history', history);

        toast.success(editData ? 'Simulacro actualizado correctamente.' : 'Simulacro registrado con éxito.');
        navigate('/drills');
    };

    const handleSave = () => doSave();
    const handlePrint = () => requirePro(() => window.print());

    const formatDisplayTime = (totalSecs) => {
        const m = Math.floor(totalSecs / 60);
        const s = totalSecs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print">
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    title="Compartir Acta de Simulacro"
                    text={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
                    rawMessage={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
                    elementIdToPrint="pdf-content"
                    fileName={`Simulacro_${formData.empresa || 'Registro'}.pdf`}
                />

                <div className="floating-action-bar">
                    <button onClick={(e) => { e.preventDefault(); requirePro(handleSave); }} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                        <Save size={18} /> GUARDAR
                    </button>
                    <button onClick={() => requirePro(() => setShowShareModal(true))} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                        <Share2 size={18} /> COMPARTIR
                    </button>
                    <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                        <Printer size={18} /> IMPRIMIR PDF
                    </button>
                </div>

                <div className="no-print" style={{ marginBottom: '2rem' }}>
                    <PremiumHeader 
                        title={editData ? 'Editar Acta de Simulacro' : 'Registro de Simulacro'}
                        subtitle="Gestión de Simulacros y Evacuación"
                        icon={<Siren size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)'
                            }}
                        >
                            <ArrowLeft size={18} />
                            VOLVER
                        </button>
                    </div>
                </div>

                {/* Cronómetro Flotante */}
                <div className="card shadow-2xl" style={{
                    marginBottom: '2rem', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', background: isRunning ? 'var(--color-background)' : 'var(--color-surface)',
                    border: isRunning ? '2px solid #ef4444' : '1px solid var(--color-border)',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ fontSize: '0.9rem', color: isRunning ? '#ef4444' : 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} /> Cronómetro Evacuación
                    </div>
                    <div style={{
                        fontSize: '4.5rem', fontWeight: 900, fontFamily: 'monospace',
                        color: isRunning ? '#e11d48' : 'var(--color-text)', lineHeight: 1, margin: '1rem 0'
                    }}>
                        {formatDisplayTime(timeInSeconds)}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {isRunning ? (
                            <button onClick={toggleTimer} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)' }}>
                                <Square size={18} fill="currentColor" /> Detener Evacuación
                            </button>
                        ) : (
                            <button onClick={toggleTimer} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
                                <Play size={18} fill="currentColor" /> {timeInSeconds === 0 ? 'Dar Alarma (Iniciar)' : 'Reanudar'}
                            </button>
                        )}
                        <button onClick={resetTimer} disabled={isRunning || timeInSeconds === 0} style={{ padding: '0.8rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', cursor: 'pointer', opacity: (isRunning || timeInSeconds === 0) ? 0.5 : 1 }}>
                            <TimerReset size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid #3b82f6', background: 'linear-gradient(180deg, rgba(59,130,246,0.03) 0%, rgba(0,0,0,0) 100%)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 800 }}>
                            <Building2 size={24} /> Datos del Establecimiento
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Empresa / Institución</label>
                                <input type="text" value={formData.empresa} onChange={e => handleInput('empresa', e.target.value)} placeholder="Ej. Planta Logistic Sur" style={{ fontWeight: 'bold' }} />
                            </div>
                            <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                <div>
                                    <label>Fecha</label>
                                    <input type="date" value={formData.fecha} onChange={e => handleInput('fecha', e.target.value)} />
                                </div>
                                <div>
                                    <label>Hora Evacuación</label>
                                    <input type="time" value={formData.hora} onChange={e => handleInput('hora', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316', fontWeight: 800 }}>
                            <Flame size={24} /> Hipótesis de Emergencia
                        </h2>
                        <div className="grid-2-cols" style={{ gap: '1rem' }}>
                            <div>
                                <label>Tipo de Emergencia</label>
                                <select value={formData.hipotesis} onChange={e => handleInput('hipotesis', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                    <option value="Incendio">Incendio Estructural</option>
                                    <option value="Sismo">Sismo / Terremoto</option>
                                    <option value="Derrame Químico">Derrame Químico</option>
                                    <option value="Amenaza de Bomba">Amenaza de Bomba</option>
                                    <option value="Fuga de Gas">Fuga de Gas</option>
                                </select>
                            </div>
                            <div>
                                <label>Sector de Origen (Foco)</label>
                                <input type="text" value={formData.origen} onChange={e => handleInput('origen', e.target.value)} placeholder="Ej. Archivo, Tablero Ppal." />
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid #8b5cf6', background: 'linear-gradient(180deg, rgba(139,92,246,0.03) 0%, rgba(0,0,0,0) 100%)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontWeight: 800 }}>
                            <Users size={24} /> Evaluación de la Evacuación
                        </h2>

                        <div style={{ background: 'var(--color-background)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--color-primary)', fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Tiempo Final a Registrar</label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input type="number" min="0" value={formData.manualMinutes} onChange={e => handleInput('manualMinutes', e.target.value)} placeholder="Minutos" style={{ paddingRight: '2rem' }} />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>m</span>
                                </div>
                                <span style={{ fontWeight: 'bold' }}>:</span>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input type="number" min="0" max="59" value={formData.manualSeconds} onChange={e => handleInput('manualSeconds', e.target.value)} placeholder="Segundos" style={{ paddingRight: '2rem' }} />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>s</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>* Sincronizado con cronómetro superior, pero editable manualmente.</div>
                        </div>

                        <div className="grid-2-cols" style={{ gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label>Población Evacuada</label>
                                <input type="number" value={formData.evacuados} onChange={e => handleInput('evacuados', e.target.value)} placeholder="Cant. aprox" />
                            </div>
                            <div>
                                <label>Heridos / Rescatados</label>
                                <input type="number" value={formData.heridosSimulados} onChange={e => handleInput('heridosSimulados', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label>Punto(s) de Encuentro Utilizados</label>
                                <textarea value={formData.puntosEncuentro} onChange={e => handleInput('puntosEncuentro', e.target.value)} rows={2} placeholder="Ej. PE1 - Estacionamiento Frontal"></textarea>
                            </div>

                            <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                <div>
                                    <label>¿La alarma fue audible?</label>
                                    <select value={formData.alarmaSonó} onChange={e => handleInput('alarmaSonó', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        <option value="Sí">Sí, en todos los sectores</option>
                                        <option value="Regular">Parcial / Bajo Volumen</option>
                                        <option value="No">Falla del sistema (No sonó)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>¿Rol de emergencias activo?</label>
                                    <select value={formData.rolCumplido} onChange={e => handleInput('rolCumplido', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        <option value="Sí">Sí, se guiaron a salidas</option>
                                        <option value="Con demoras">Brigadistas con fallas de rol</option>
                                        <option value="No">Falta de liderazgo/pánico</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label>Oportunidades de Mejora / Observaciones Críticas</label>
                                <textarea value={formData.observaciones} onChange={e => handleInput('observaciones', e.target.value)} rows={3} placeholder="Ej. Se detectó puerta de emergencia trabada en sector Archivo..."></textarea>
                            </div>
                    </div>
                </div>
            </div>

                {/* Firmas y Autorizaciones */}
                <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                    <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones de Simulacro
                    </h3>

                    <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { id: 'operator', label: 'Responsable Evacuación' },
                                { id: 'professional', label: 'Especialista Higiene y Seguridad' },
                                { id: 'supervisor', label: 'Supervisor / Cierre' }
                            ].map(sig => {
                                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                return (
                                    <label
                                        key={sig.id}
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        style={{
                                            padding: '0.55rem 1.1rem',
                                            borderRadius: 'var(--radius-full)',
                                            border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                            color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                            fontWeight: 750,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                                            style={{ display: 'none' }}
                                        />
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '4px',
                                            border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                            background: isChecked ? 'var(--color-primary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isChecked && <CheckCircle2 size={12} color="white" />}
                                        </div>
                                        {sig.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                            }}
                            box1={showSignatures.operator ? {
                                title: 'RESPONSABLE EVACUACIÓN',
                                subtitle: 'Brigada / Responsable',
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.professional ? {
                                title: 'PROFESIONAL H&S',
                                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                signatureUrl: formData.professionalSignature || professional.signature || null,
                                stampUrl: formData.professionalStamp || professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                            box3={showSignatures.supervisor ? {
                                title: 'SUPERVISIÓN / CIERRE',
                                subtitle: 'Aprobación de Simulacro',
                                signatureUrl: formData.supervisorSignature || formData.signature || null,
                                isProfessional: false
                            } : null}
                        />
            <PdfBrandingFooter />
                    </div>

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature}
                                    title="Firma del Responsable de Evacuación"
                                />
                            </div>
                        )}
                        
                        {showSignatures.professional && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                    initialImage={formData.professionalSignature || professional.signature}
                                    title="Firma de Especialista H&S"
                                />
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                    initialImage={formData.supervisorSignature || formData.signature}
                                    title="Firma del Supervisor de Cierre"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PRO upgrade banner for free users */}
            <AdBanner />

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <DrillPdfGenerator
                    report={{
                        id: Date.now(),
                        date: new Date().toISOString(),
                        evaluador: currentUser?.displayName || 'Profesional HSE',
                        tiempoVisual: `${(parseInt(formData.manualMinutes || 0)).toString().padStart(2, '0')}:${(parseInt(formData.manualSeconds || 0)).toString().padStart(2, '0')}`,
                        tiempoTotalSegundos: (parseInt(formData.manualMinutes || 0) * 60) + parseInt(formData.manualSeconds || 0),
                        ...formData,
                        professionalSignature: formData.professionalSignature || professional.signature,
                        professionalName: formData.professionalName || professional.name,
                        professionalLicense: formData.professionalLicense || professional.license,
                        professionalStamp: formData.professionalStamp || professional.stamp,
                    }}
                    onBack={() => { }}
                />
            </div>
        </div>
    );
}
