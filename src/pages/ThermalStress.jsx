import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calculator, Info, RefreshCw, Printer, Search, Settings2, CheckCircle2, TriangleAlert, Share2, Save, ArrowLeft, ThermometerSun
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import { getCountryNormativa } from '../data/legislationData';

// SRT 295/03 Permissible Limits Table (Values in Celsius)
const LIMITS_295 = {
    'continuo': { 'liviano': 30.0, 'moderado': 26.7, 'pesado': 25.0 },
    '75_25': { 'liviano': 30.6, 'moderado': 28.0, 'pesado': 25.9 },
    '50_50': { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9 },
    '25_75': { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0 }
};

export default function ThermalStress() {
    useDocumentTitle('Cálculo Estrés Térmico');
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const { syncCollection } = useSync();

    const editData = location.state?.editData;

    const [formData, setFormData] = useState(editData || {
        puesto: '',
        sector: '',
        tarea: '',
        fecha: new Date().toISOString().split('T')[0],

        // Entorno
        cargaSolar: false,
        tbh: '', // Temperatura Bulbo Húmedo
        tg: '',  // Temperatura de Globo
        tbs: '', // Temperatura Bulbo Seco (Solo para carga solar)

        // Trabajo
        ritmo: 'moderado', // liviano, moderado, pesado
        ciclo: 'continuo', // continuo, 75_25, 50_50, 25_75
    });

    const [resultados, setResultados] = useState({
        tgbh: null,
        limite: null,
        admisible: null
    });

    const [showShareModal, setShowShareModal] = useState(false);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'



    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    const handleInput = (field, value) => {
        setFormData(p => ({ ...p, [field]: value }));
    };

    // Auto-calculate when vars change
    useEffect(() => {
        const tbh = parseFloat(formData.tbh);
        const tg = parseFloat(formData.tg);
        const tbs = formData.cargaSolar ? parseFloat(formData.tbs) : 0;

        if (!isNaN(tbh) && !isNaN(tg)) {
            let tgbhCalc = 0;
            if (formData.cargaSolar && !isNaN(tbs)) {
                // Al aire libre con carga solar
                tgbhCalc = (0.7 * tbh) + (0.2 * tg) + (0.1 * tbs);
            } else {
                // Interiores o aire libre sin carga solar
                tgbhCalc = (0.7 * tbh) + (0.3 * tg);
            }

            const limiteCalc = LIMITS_295[formData.ciclo][formData.ritmo];

            setResultados({
                tgbh: parseFloat(tgbhCalc.toFixed(1)),
                limite: limiteCalc,
                admisible: tgbhCalc <= limiteCalc
            });
        } else {
            setResultados({ tgbh: null, limite: null, admisible: null });
        }
    }, [formData.tbh, formData.tg, formData.tbs, formData.cargaSolar, formData.ritmo, formData.ciclo]);

    const doSave = () => {
        if (!formData.puesto) {
            toast.error('Debe indicar el nombre del puesto/estudio.');
            return;
        }

        if (resultados.tgbh === null) {
            toast.error('Faltan datos ambientales para calcular el TGBH.');
            return;
        }

        const report = {
            id: editData?.id || Date.now(),
            date: editData?.date || new Date().toISOString(),
            evaluador: editData?.evaluador || currentUser?.displayName || 'Profesional HSE',
            ...formData,
            resultados
        };

        let history = JSON.parse(localStorage.getItem('thermal_history') || '[]');

        if (editData) {
            history = history.map(item => item.id === editData.id ? report : item);
        } else {
            history.unshift(report);
        }

        localStorage.setItem('thermal_history', JSON.stringify(history));
        syncCollection('thermal_history', history);

        toast.success(editData ? 'Evaluación térmica actualizada.' : 'Medición guardada en el historial.');
        navigate('/thermal-stress-history');
    };

    const handleSave = () => requirePro(doSave);
    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ShareModal
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="Compartir Informe de Estrés Térmico"
                text={`🌡️ Evaluación de Estrés Térmico (TGBH)\n📍 Puesto: ${formData.puesto}\n📊 Índice: ${resultados.tgbh}°C (Límite: ${resultados.limite}°C)\n✅ Dictamen: ${resultados.admisible ? 'ADMISIBLE' : 'RIESGO'}\n\nEnviado desde Asistente HYS`}
                elementIdToPrint="pdf-content"
            />

            {/* Floating Action Bar Premium */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShareModal(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={handlePrint}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
            <div className="no-print">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Estrés Térmico Calculadora</h1>
                    </div>
                    <button onClick={() => navigate('/thermal-stress-history')} className="btn-outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem' }}>
                        <Search size={18} /> Historial
                    </button>
                </div>

                <div className="grid-2-cols" style={{ gap: '1.5rem' }}>

                    {/* Columna Izquierda: Formulario de Configuración */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                <Settings2 size={20} /> Metadatos del Puesto
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Puesto de Trabajo a Evaluar</label>
                                    <input type="text" value={formData.puesto} onChange={e => handleInput('puesto', e.target.value)} placeholder="Ej. Operador de Horno 3" style={{ fontWeight: 'bold' }} />
                                </div>
                                <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                    <div>
                                        <label>Sector / Área</label>
                                        <input type="text" value={formData.sector} onChange={e => handleInput('sector', e.target.value)} placeholder="Ej. Fundición" />
                                    </div>
                                    <div>
                                        <label>Fecha de Medición</label>
                                        <input type="date" value={formData.fecha} onChange={e => handleInput('fecha', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label>Tarea Principal que Realiza</label>
                                    <input type="text" value={formData.tarea} onChange={e => handleInput('tarea', e.target.value)} placeholder="Ej. Carga manual de lingotes y control visual" />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316' }}>
                                    <ThermometerSun size={20} /> Mediciones Ambientales
                                </h2>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(249,115,22,0.1)', padding: '0.3rem 0.8rem', borderRadius: '12px', color: '#c2410c', fontWeight: 700 }}>
                                    <input type="checkbox" checked={formData.cargaSolar} onChange={e => handleInput('cargaSolar', e.target.checked)} style={{ margin: 0 }} /> Al sol / Carga Solar
                                </label>
                            </div>

                            <div className="grid-2-cols" style={{ gap: '1rem' }}>
                                <div>
                                    <label>Temp. Bulbo Húmedo natural (Tbh) °C</label>
                                    <input type="number" step="0.1" value={formData.tbh} onChange={e => handleInput('tbh', e.target.value)} placeholder="Ej: 22.5" />
                                </div>
                                <div>
                                    <label>Temp. Globo (Tg) °C</label>
                                    <input type="number" step="0.1" value={formData.tg} onChange={e => handleInput('tg', e.target.value)} placeholder="Ej: 28.1" />
                                </div>
                                {formData.cargaSolar && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Temp. Bulbo Seco (Tbs) °C</label>
                                        <input type="number" step="0.1" value={formData.tbs} onChange={e => handleInput('tbs', e.target.value)} placeholder="Temp. Aire" style={{ borderColor: '#f97316' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>* Requerido al activar carga solar por ecuación de ponderación.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                                <RefreshCw size={20} /> Exigencia Física y Régimen
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Metabolismo / Carga de Trabajo</label>
                                    <select value={formData.ritmo} onChange={e => handleInput('ritmo', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        <option value="liviano">Liviana (Ej. Trabajo en banco, sentados 200W)</option>
                                        <option value="moderado">Moderada (Ej. Caminar con arrastre, empuje sostenido 300W)</option>
                                        <option value="pesado">Pesada (Ej. Trabajo intenso con pico/pala, cargas pesadas 400W)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Ciclo Trabajo / Descanso (Turno)</label>
                                    <select value={formData.ciclo} onChange={e => handleInput('ciclo', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        <option value="continuo">Trabajo Continuo (o &lt; 25% descanso/hr)</option>
                                        <option value="75_25">75% Trabajo, 25% Descanso c/hora</option>
                                        <option value="50_50">50% Trabajo, 50% Descanso c/hora</option>
                                        <option value="25_75">25% Trabajo, 75% Descanso c/hora</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Panel de Resultados en Vivo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card shadow-xl" style={{ border: '2px solid var(--color-primary)', background: 'var(--color-surface)', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--color-primary)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                                <Calculator size={20} /> Dictamen {countryNorms.thermal.split(' (')[0]}
                            </div>

                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Índice TGBH Calculado
                                </div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
                                    {resultados.tgbh !== null ? `${resultados.tgbh}°C` : '--'}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 1.5rem', background: 'var(--color-background)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Carga Solar Activa:</span>
                                        <span style={{ fontWeight: 800, color: formData.cargaSolar ? '#f97316' : 'var(--color-text)' }}>{formData.cargaSolar ? 'SÍ' : 'NO'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 1.5rem', background: 'var(--color-background)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Límite Máximo Permitido:</span>
                                        <span style={{ fontWeight: 800 }}>{resultados.limite !== null ? `${resultados.limite}°C` : '--'}</span>
                                    </div>
                                </div>

                                {/* Alerta de Dictamen */}
                                {resultados.admisible !== null ? (
                                    <div style={{
                                        padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                                        background: resultados.admisible ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: resultados.admisible ? '#059669' : '#dc2626',
                                        border: `2px solid ${resultados.admisible ? '#10b981' : '#ef4444'}`
                                    }}>
                                        {resultados.admisible ? <CheckCircle2 size={32} /> : <TriangleAlert size={32} />}
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>
                                                {resultados.admisible ? 'Admisible' : 'Riesgo Térmico'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
                                                {resultados.admisible ? 'El puesto no requiere rotación extra.' : 'El TGBH supera el valor tabla. Urgente rotación o mitigación.'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}>
                                        <Info size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                        Ingrese las temperaturas de globo y bulbo húmedo para ver el resultado oficial.
                                    </div>
                                )}

                            </div>


                        </div>

                        {/* Formula reference card */}
                        <div className="card" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Info size={16} /> Fundamento Legal
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                                <strong>{countryNorms.thermal} ({countryNorms.general}).</strong> El valor adoptado es TGBH (Índice T° Globo Bulbo Húmedo).
                            </p>
                            <code style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.4rem', borderRadius: '4px', display: 'block', color: '#0f172a' }}>
                                Int: TGBH = 0.7(Tbh) + 0.3(Tg)<br />
                                Ext Sol: TGBH = 0.7(Tbh) + 0.2(Tg) + 0.1(Tbs)
                            </code>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRO upgrade banner for free users */}
            <AdBanner />

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <ThermalStressPdfGenerator
                    report={{
                        id: Date.now(),
                        date: new Date().toISOString(),
                        evaluador: currentUser?.displayName || 'Profesional HSE',
                        ...formData,
                        resultados
                    }}
                    onBack={() => { }}
                />
            </div>
        </div>
    );
}
