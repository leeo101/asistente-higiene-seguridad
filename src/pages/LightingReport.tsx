import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ArrowLeft, Save, Plus, Trash2, Lightbulb, Calculator,
    FileText, Printer, Building2, Layout, Maximize2,
    Info, TriangleAlert, ShieldCheck, History, Share2, Sun, Sparkles, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import { getErrorMessage } from '../utils/errorUtils';
import { API_BASE_URL } from '../config';
import { getCountryNormativa } from '../data/legislationData';
import { auth } from '../firebase';
import { Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1.2rem',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as any,
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
};

// Tipos de tareas visuales basados en el Decreto 351/79 (Anexo IV) - Resumido
const visualTasks = [
    { id: 'exteriores', label: 'Áreas exteriores generales y patios', minLux: 20 },
    { id: 'circulacion', label: 'Zonas de circulación, pasillos y escaleras', minLux: 100 },
    { id: 'simples', label: 'Tareas visuales simples (Depósitos, vestuarios)', minLux: 200 },
    { id: 'moderadas', label: 'Distinción moderada de detalles (Oficinas, lectura general)', minLux: 500 },
    { id: 'finos', label: 'Distinción de detalles finos (Dibujo, inspección fina)', minLux: 1000 },
    { id: 'muy_finos', label: 'Detalles muy finos (Relojería, electrónica, microcirugía)', minLux: 2000 }
];

export default function LightingReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
  const { isPro } = usePaywall();

    const [formData, setFormData] = useState({
        empresa: '',
        sector: '',
        descripcionActividad: '',
        tipoTarea: '',
        luxRequerido: 500,
        conclusion: '',
        operatorSignature: '',
        supervisorSignature: '',
        mediciones: [
            { id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 as any }
        ]
    });

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const savedHistory = localStorage.getItem('lighting_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, [isFormVisible]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, payload: id });
    };

    const executeDelete = () => {
        if (confirmModal.payload) {
            const updated = history.filter((p: any) => p.id !== confirmModal.payload);
            localStorage.setItem('lighting_history', JSON.stringify(updated));
            setHistory(updated);
            toast.success('Estudio eliminado');
        }
        setConfirmModal({ isOpen: false, payload: null });
    };

    const filteredHistory = history.filter((item: any) =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

    const handleGenerateConclusion = async () => {
        setIsGeneratingConclusion(true);
        const loadingToast = toast.loading('Redactando conclusión técnica...');
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                },
                body: JSON.stringify({
                    reportType: `Iluminación en Ambiente Laboral (${countryNorms.lighting})`,
                    reportData: {
                        luxRequerido: formData.luxRequerido,
                        promedioLux: results.promedioLux,
                        cumplePromedio: results.cumplePromedio,
                        puntosCumplen: results.puntosCumplen,
                        puntosNoCumplen: results.puntosNoCumplen,
                        descripcionActividad: formData.descripcionActividad
                    }
                })
            });
            if (!res.ok) throw new Error('Error al conectar con la IA');
            const data = await res.json();
            setFormData(prev => ({ ...prev, conclusion: data.conclusion }));
            toast.success('Conclusión generada con éxito ✨', { id: loadingToast });
        } catch (error) {
            toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
        } finally {
            setIsGeneratingConclusion(false);
        }
    };

    const [professional, setProfessional] = useState<{ name: string; license: string; signature: any; stamp?: any }>({
        name: 'Profesional',
        license: '',
        signature: null,
        stamp: null
    });

    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    const [showShare, setShowShare] = useState(false);

    let userCountry = 'argentina';
    try {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            userCountry = parsed.country || 'argentina';
        }
    } catch (error) {
        console.error('[LightingReport] Error parsing personalData:', error);
    }
    const countryNorms = getCountryNormativa(userCountry);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('personalData');
            const savedSigData = localStorage.getItem('signatureStampData');
            const legacySignature = localStorage.getItem('capturedSignature');

            let signature = legacySignature || null;
            if (savedSigData) {
                try {
                    const parsed = JSON.parse(savedSigData);
                    signature = parsed.signature || signature;
                } catch (e) {}
            }

            let profData = {
                name: 'Profesional',
                license: '',
                signature: signature
            };

            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    profData.name = data.name || 'Profesional';
                    profData.license = data.license || '';
                } catch (e) {}
            }

            setProfessional(profData);
        } catch (error) {
            console.error('Error loading professional data:', error);
        }
    }, []);

    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData.datos || location.state.editData);
            setIsFormVisible(true);
        }
    }, [location.state]);

    const [results, setResults] = useState({
        promedioLux: 0,
        cumplePromedio: false,
        puntosCumplen: 0,
        puntosNoCumplen: 0
    });

    // Actualizar lux requerido cuando cambia la tarea Y NO SE ESCRIBIÓ MANUALMENTE
    useEffect(() => {
        // Find if the current text matches any of the labels exactly (via the datalist)
        const task = visualTasks.find(t => t.label === formData.tipoTarea);
        if (task) {
            setFormData(prev => ({ ...prev, luxRequerido: task.minLux }));
        }
    }, [formData.tipoTarea]);

    // Calcular promedios y cumplimiento
    useEffect(() => {
        const meds = formData.mediciones || [];
        if (meds.length === 0) {
            setResults({ promedioLux: 0, cumplePromedio: false, puntosCumplen: 0, puntosNoCumplen: 0 });
            return;
        }

        const totalLux = meds.reduce((acc, curr) => acc + (parseFloat(curr.luxMedido) || 0), 0);
        const promedio = totalLux / meds.length;

        const cumpleProm = promedio >= formData.luxRequerido;
        const cumplen = meds.filter(m => (parseFloat(m.luxMedido) || 0) >= formData.luxRequerido).length;
        const noCumplen = meds.length - cumplen;

        setResults({
            promedioLux: Math.round(promedio),
            cumplePromedio: cumpleProm,
            puntosCumplen: cumplen,
            puntosNoCumplen: noCumplen
        });

    }, [formData.mediciones, formData.luxRequerido]);

    const handleDataChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const addMedicion = () => {
        setFormData({
            ...formData,
            mediciones: [...formData.mediciones, { id: Date.now().toString(), ubicacion: `Puesto ${formData.mediciones.length + 1}`, luxMedido: '' }]
        });
    };

    const removeMedicion = (index) => {
        const newMeds = [...formData.mediciones];
        newMeds.splice(index, 1);
        setFormData({ ...formData, mediciones: newMeds });
    };

    const updateMedicion = (index, field, value) => {
        const newMeds = [...formData.mediciones];
        newMeds[index][field] = value;
        setFormData({ ...formData, mediciones: newMeds });
    };

    const saveReport = async () => {
        try {
            const reportData = {
                id: location.state?.editData?.id || Date.now().toString(),
                date: location.state?.editData?.date || new Date().toISOString(),
                empresa: formData.empresa || 'Empresa Sin Nombre',
                sector: formData.sector || 'Sin Sector',
                results: results,
                datos: formData,
                profesionalResponsable: professional?.name || 'Profesional no registrado'
            };

            let existingHistory = [];
            try {
                const savedHistory = localStorage.getItem('lighting_history');
                if (savedHistory) {
                    existingHistory = JSON.parse(savedHistory);
                }
            } catch (e) {}

            if (location.state?.editData) {
                existingHistory = existingHistory.map(item => item.id === location.state.editData.id ? reportData : item);
            } else {
                existingHistory.push(reportData);
            }
            
            localStorage.setItem('lighting_history', JSON.stringify(existingHistory));

            if (currentUser) {
                await syncCollection('lighting_history', existingHistory);
            }

            toast.success(location.state?.editData ? 'Informe actualizado correctamente.' : 'Informe guardado en el Historial');
            setIsFormVisible(false);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error("Error saving document:", err);
            toast.error("Error al guardar en la base de datos.");
        }
    };

    if (!isFormVisible) {
        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: '5.5rem' }}>
                <PremiumHeader 
                    title="Estudios de Iluminación"
                    subtitle="Gestión e historial de estudios de iluminación y luxometría."
                    icon={<Lightbulb size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />
                
                <main style={{ padding: '0 0 2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    {/* Botones de Navegación */}
                    <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => navigate('/', { state: { scrollTo: 'lighting' } })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            INICIO
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', padding: '0 1rem' }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por empresa o sector..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px',
                                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                    color: 'var(--color-text)', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                                setFormData({
                                    empresa: '', sector: '', descripcionActividad: '', tipoTarea: '', luxRequerido: 500, conclusion: '',
                                    operatorSignature: '', supervisorSignature: '', mediciones: [{ id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 as any }]
                                });
                                setIsFormVisible(true);
                            }}
                            className="btn-primary hover-lift"
                            style={{ margin: 0, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                        >
                            <Plus size={20} /> NUEVO ESTUDIO
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', padding: '0 1rem' }}>
                        {filteredHistory.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1px dashed var(--color-border)' }}>
                                <Lightbulb size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay estudios registrados</h3>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Cargue su primer estudio de iluminación.</p>
                            </div>
                        ) : (
                            filteredHistory.map((item: any) => {
                                const isApto = item.results?.cumplePromedio;
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            setFormData(item.datos || item);
                                            setIsFormVisible(true);
                                            window.history.replaceState({ editData: item }, '');
                                        }}
                                        className="card hover-lift animate-fade-in"
                                        style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900 }}>{item.empresa || 'Empresa'}</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Building2 size={14} /> {item.sector || 'Sector'}
                                                </span>
                                            </div>
                                            <span style={{ 
                                                background: isApto ? '#f0fdf4' : '#fef2f2', 
                                                color: isApto ? '#16a34a' : '#dc2626', 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 900
                                            }}>
                                                {isApto ? 'CUMPLE' : 'NO CUMPLE'}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FileText size={14} /> Ver / Editar
                                            </span>
                                            <button 
                                                onClick={(e) => handleDelete(item.id, e)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
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
                <ConfirmModal 
                    isOpen={confirmModal.isOpen} 
                    onClose={() => setConfirmModal({ isOpen: false, payload: null })} 
                    onConfirm={executeDelete} 
                    title="¿Eliminar estudio?" 
                    message="Esta acción no se puede deshacer." 
                    iconEmoji="🗑️" 
                />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: '6.5rem' }}>
            <PremiumHeader 
                title={location.state?.editData ? 'Editar Protocolo de Iluminación' : 'Nuevo Estudio de Iluminación'}
                subtitle={`Medición según ${countryNorms.lighting}`}
                icon={<Lightbulb size={32} color="#ffffff" />}
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                
                <button
                    onClick={saveReport}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: 'white' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: 'white' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: 'white' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <></>
                </div>

            {showShare && (
                <ShareModal
                    isOpen={showShare}
                    open={showShare}
                    onClose={() => setShowShare(false)}
                    title={`Estudio de Iluminación - ${formData.empresa}`}
                    text={`🔦 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n💡 Requerido: ${formData.luxRequerido} Lux | Promedio Medido: ${results.promedioLux} Lux\n\nGenerado con Asistente HYS`}
                    rawMessage={`🔦 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n💡 Requerido: ${formData.luxRequerido} Lux | Promedio Medido: ${results.promedioLux} Lux\n\nGenerado con Asistente HYS`}
                    elementIdToPrint="pdf-content"
                    fileName={`Iluminacion_${formData.empresa}.pdf`}
                />
            )}

            {/* ENCABEZADO PARA IMPRESIÓN */}
            <div id="pdf-content" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', color: '#000000' }}>
                {/* Header Tripartito HSE */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%', borderTop: '12px solid #eab308', paddingTop: '1rem' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#d97706' }}>Doc. Estudio de Iluminación</p>
                    </div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ILUMINACIÓN</h1>
                        <div style={{ marginTop: '0.3rem', background: '#eab308', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            ESTUDIO DE NIVELES — {countryNorms.lighting}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 print-block">
                    {/* COLUMNA 1: DATOS GENERALES */}
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <Building2 size={20} /> Datos del Establecimiento
                        </h3>

                        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>Razón Social / Obra</label>
                                <input
                                    type="text"
                                    value={formData.empresa}
                                    onChange={(e) => handleDataChange('empresa', e.target.value)}
                                    style={inputStyle} className="no-print"
                                    placeholder="Nombre de la empresa..."
                                />
                                <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.empresa || '-'}</div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>Sector / Área de Estudio</label>
                                <input
                                    type="text"
                                    value={formData.sector}
                                    onChange={(e) => handleDataChange('sector', e.target.value)}
                                    style={inputStyle} className="no-print"
                                    placeholder="Ej: Nave Industrial, Administración..."
                                />
                                <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.sector || '-'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>Descripción de las Tareas</label>
                                <input
                                    type="text"
                                    value={formData.descripcionActividad}
                                    onChange={(e) => handleDataChange('descripcionActividad', e.target.value)}
                                    style={inputStyle} className="no-print"
                                    placeholder="Ej: Trabajo en escritorio, torno mecánico..."
                                />
                                <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.descripcionActividad || '-'}</div>
                            </div>
                        </div>

                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '2rem' }}>
                            <Layout size={20} /> Requerimiento Legal
                        </h3>

                        <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>Tipo de Tarea Visual ({countryNorms.lighting.split(' ')[0]} o Especial)</label>
                                <input
                                    list="visualTasksList"
                                    value={formData.tipoTarea}
                                    onChange={(e) => handleDataChange('tipoTarea', e.target.value)}
                                    style={inputStyle} className="no-print"
                                    placeholder="Seleccione o escriba el tipo de tarea..."
                                />
                                <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000', fontWeight: 'bold' }}>{formData.tipoTarea || '-'}</div>
                                <datalist id="visualTasksList">
                                    {visualTasks.map((t) => (
                                        <option key={t.id} value={t.label} />
                                    ))}
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Sun size={32} color="var(--color-primary)" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Iluminación Mínima Exigida</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            value={formData.luxRequerido}
                                            onChange={(e) => handleDataChange('luxRequerido', e.target.value === '' ? '' : Number(e.target.value))}
                                            style={{ ...inputStyle, width: '100px', fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)', padding: '0.5rem', background: 'var(--color-surface)' }}
                                            min="0"
                                            className="no-print"
                                        />
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }} className="no-print">Lux</span>
                                        <div className="print-only" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formData.luxRequerido} Lux</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: MEDICIONES Y RESULTADOS */}
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lightbulb size={20} /> Puntos de Medición
                            </div>
                            <button onClick={addMedicion} className="btn-secondary no-print" style={{ margin: 0, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Plus size={14} /> Añadir Punto
                            </button>
                        </h3>

                        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '350px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontWeight: 800 }}>Punto Exacto / Puesto</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: 800 }}>Lux Medido</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: 800 }} className="no-print">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.mediciones.map((med, index) => (
                                            <tr key={med.id} className="hover-lift" style={{ transition: 'all 0.2s' }}>
                                                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--color-border)' }}>
                                                    <input
                                                        type="text"
                                                        value={med.ubicacion}
                                                        onChange={(e) => updateMedicion(index, 'ubicacion', e.target.value)}
                                                        style={inputStyle}
                                                        placeholder="Puesto X"
                                                        className="no-print"
                                                    />
                                                    <div className="print-only" style={{ padding: '0.5rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{med.ubicacion}</div>
                                                </td>
                                                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--color-border)', width: '120px' }}>
                                                    <input
                                                        type="number"
                                                        value={med.luxMedido}
                                                        onChange={(e) => updateMedicion(index, 'luxMedido', e.target.value)}
                                                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 800, color: 'var(--color-primary)' }}
                                                        placeholder="0"
                                                        min="0"
                                                        className="no-print"
                                                    />
                                                    <div className="print-only" style={{ textAlign: 'center', fontWeight: 'bold' }}>{med.luxMedido}</div>
                                                </td>
                                                <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center', width: '60px' }} className="no-print">
                                                    <button
                                                        onClick={() => removeMedicion(index)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px', display: 'inline-flex' }}
                                                        className="hover-lift"
                                                    >
                                                        <Trash2 size={18}  />
                        </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <Calculator size={20} /> Evaluación Normativa
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
                            <div className="card" style={{ padding: '1.5rem', border: results.cumplePromedio ? '2px solid #10b981' : '2px solid #ef4444', background: results.cumplePromedio ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Nivel Promedio Registrado</p>
                                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: results.cumplePromedio ? '#10b981' : '#ef4444' }}>{results.promedioLux} Lux</p>
                                    </div>
                                    <div className="result-badge-print" style={{ background: results.cumplePromedio ? '#10b981' : '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                                        {results.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span>Requerido s/ {countryNorms.lighting}:</span>
                                        <span style={{ fontWeight: 700 }}>{formData.luxRequerido} Lux</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span>Puntos que Cumplen:</span>
                                        <span style={{ fontWeight: 700, color: '#10b981' }}>{results.puntosCumplen}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Puntos Deficientes:</span>
                                        <span style={{ fontWeight: 700, color: results.puntosNoCumplen > 0 ? '#ef4444' : 'var(--color-text)' }}>{results.puntosNoCumplen}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE CONCLUSIÓN */}
                <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl print:mb-0 mb-8 mt-10 print-area" style={{ display: 'block', clear: 'both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)' }}>
                            <FileText size={22} /> Conclusión Profesional
                        </h3>
                        <button
                            className="no-print"
                            onClick={handleGenerateConclusion}
                            disabled={isGeneratingConclusion}
                            style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', cursor: isGeneratingConclusion ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', outline: 'none' }}
                        >
                            {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGeneratingConclusion ? 'REDACTANDO...' : 'REDACTAR CON IA'}
                        </button>
                    </div>

                    <textarea
                        value={formData.conclusion || ''}
                        onChange={(e) => handleDataChange('conclusion', e.target.value)}
                        style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }} className="no-print"
                        placeholder="Escriba la conclusión del estudio o use el botón de IA para generarla..."
                    />

                    {formData.conclusion && (
                        <div className="print-only text-slate-800 text-[0.85rem] whitespace-pre-wrap leading-relaxed">
                            {formData.conclusion}
                        </div>
                    )}
                </div>

                {/* SECCIÓN DE DATOS OBTENIDOS POR */}
                <div className="card animate-fade-in print-area" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)', clear: 'both' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        <ShieldCheck size={22} color="var(--color-primary)" /> Firmas y Validación
                    </h3>

                    {/* Custom visual switches */}
                    <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { id: 'operator', label: 'Operador / Responsable' },
                                { id: 'supervisor', label: 'Supervisor' },
                                { id: 'professional', label: 'Profesional' }
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
                                            background: isChecked ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                                            color: isChecked ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            transition: 'all 0.2s ease',
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => setShowSignatures(s => ({ ...s, [sig.id]: e.target.checked }))}
                                            style={{
                                                accentColor: 'var(--color-primary)',
                                                width: '1.1rem',
                                                height: '1.1rem',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        {sig.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                <PdfSignatures
                    data={{
                        ...formData,
                        professionalSignature: professional?.signature,
                        professionalName: professional?.name,
                        professionalLicense: professional?.license
                    }}
                    box1={showSignatures.operator ? {
                        title: 'OPERADOR / RESPONSABLE',
                        subtitle: 'Toma de conocimiento',
                        signatureUrl: formData.operatorSignature || null,
                        isProfessional: false
                    } : null}
                    box3={showSignatures.supervisor ? {
                        title: 'SUPERVISOR H&S',
                        subtitle: 'Aprobación del estudio',
                        signatureUrl: formData.supervisorSignature || null,
                        isProfessional: false
                    } : null}
                    box2={showSignatures.professional ? undefined : null}
                />

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                        {showSignatures.operator && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature}
                                    label="Firma del Operador / Responsable"
                                />
                            </div>
                        )}
                        
                        {showSignatures.supervisor && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                    initialImage={formData.supervisorSignature}
                                    label="Firma del Supervisor"
                                />
                            </div>
                        )}
                    </div>

                    <PdfBrandingFooter />
                </div>
            </div>
            </main>
        </div >
    );
}
