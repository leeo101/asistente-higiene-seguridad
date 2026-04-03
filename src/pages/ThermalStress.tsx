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

// Res. SRT 30/2023 — Valores Límite de Exposición (VLE) TGBH en °C
// Reemplaza el Anexo II del Dec. 351/79 (vigente desde 2024, prórroga Res. 7/2024)
const LIMITS_30_2023 = {
    'continuo': { 'liviano': 29.0, 'moderado': 26.7, 'pesado': 25.0 },
    '75_25':    { 'liviano': 30.6, 'moderado': 27.5, 'pesado': 25.9 },
    '50_50':    { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9 },
    '25_75':    { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0 }
};
// VLA (Valor Límite de Acción) = VLE − 1.5°C (criterio ACGIH adoptado por Res. 30/2023)
const VLA_OFFSET = 1.5;

// Tabla legado Res. 295/03 (DEROGADA — solo referencia histórica)
const LIMITS_295 = {
    'continuo': { 'liviano': 30.0, 'moderado': 26.7, 'pesado': 25.0 },
    '75_25': { 'liviano': 30.6, 'moderado': 28.0, 'pesado': 25.9 },
    '50_50': { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9 },
    '25_75': { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0 }
};

// Carga metabólica por tipo de tarea (según Res. SRT 30/2023 / ACGIH)
const METABOLIC_PREFS = [
    { id: 'liviano', label: 'Liviana (≤ 200 W) — sentado, trabajo fino', watts: 175 },
    { id: 'moderado', label: 'Moderada (200–350 W) — caminar, empuje', watts: 275 },
    { id: 'pesado', label: 'Pesada (> 350 W) — pico/pala, cargas pesadas', watts: 400 }
];

export default function ThermalStress(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const { syncCollection } = useSync();

    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar Estrés Térmico' : 'Cálculo Estrés Térmico');

    const [formData, setFormData] = useState(editData || {
        puesto: '',
        sector: '',
        tarea: '',
        fecha: new Date().toISOString().split('T')[0],

        // Mediciones ambientales
        cargaSolar: false,
        tbh: '',     // Temperatura Bulbo Húmedo natural
        tg: '',      // Temperatura de Globo
        tbs: '',     // Temperatura Bulbo Seco (solo con carga solar)
        viento: '',  // Velocidad del aire m/s — Res. 30/2023

        // Condiciones del trabajador
        aptaMedica: false,  // Apto médico específico — obligatorio Res. 30/2023
        aclimatado: false,  // Aclimatación 5-14 días — Res. 30/2023

        // Exigencia física
        ritmo: 'moderado',   // liviano, moderado, pesado
        ciclo: 'continuo',   // continuo, 75_25, 50_50, 25_75
    });

    const [resultados, setResultados] = useState({
        tgbh: null as number | null,
        vle: null as number | null,
        vla: null as number | null,
        admisible: null as boolean | null,
        enVLA: null as boolean | null,
    });

    const [showShareModal, setShowShareModal] = useState(false);

    let userCountry = 'argentina';
    try {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            userCountry = parsed.country || 'argentina';
        }
    } catch (error) {
        console.error('[ThermalStress] Error parsing personalData:', error);
    }
    const countryNorms = getCountryNormativa(userCountry);

    const handleInput = (field, value) => {
        setFormData(p => ({ ...p, [field]: value }));
    };

    // Cálculo automático según Res. SRT 30/2023
    useEffect(() => {
        const tbh = parseFloat(formData.tbh);
        const tg = parseFloat(formData.tg);
        const tbs = formData.cargaSolar ? parseFloat(formData.tbs) : 0;

        if (!isNaN(tbh) && !isNaN(tg)) {
            let tgbhCalc = 0;
            if (formData.cargaSolar && !isNaN(tbs)) {
                // Al aire libre con carga solar directa
                tgbhCalc = (0.7 * tbh) + (0.2 * tg) + (0.1 * tbs);
            } else {
                // Interior o al aire libre sin carga solar
                tgbhCalc = (0.7 * tbh) + (0.3 * tg);
            }

            const vleCalc = LIMITS_30_2023[formData.ciclo][formData.ritmo];
            const vlaCalc = parseFloat((vleCalc - VLA_OFFSET).toFixed(1));

            setResultados({
                tgbh: parseFloat(tgbhCalc.toFixed(1)),
                vle: vleCalc,
                vla: vlaCalc,
                admisible: tgbhCalc <= vleCalc,
                enVLA: tgbhCalc > vlaCalc && tgbhCalc <= vleCalc
            });
        } else {
            setResultados({ tgbh: null, vle: null, vla: null, admisible: null, enVLA: null });
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
        if (!formData.aptaMedica) {
            toast(`⚠️ Res. 30/2023 exige apto médico específico para exposición al calor. Verifique.`, { icon: '📋', duration: 4000 });
        }

        const report = {
            id: editData?.id || Date.now(),
            date: editData?.date || new Date().toISOString(),
            evaluador: editData?.evaluador || currentUser?.displayName || 'Profesional HSE',
            normativa: 'Res. SRT 30/2023',
            ...formData,
            resultados
        };

        let history = [];
        try {
            const savedHistory = localStorage.getItem('thermal_history');
            if (savedHistory) history = JSON.parse(savedHistory);
        } catch (error) {
            console.error('[ThermalStress] Error parsing thermal_history:', error);
        }

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
                text={`🌡️ Evaluación Estrés Térmico (TGBH) | Res. SRT 30/2023\n📍 Puesto: ${formData.puesto}\n📊 TGBH: ${resultados.tgbh}°C | VLE: ${resultados.vle}°C | VLA: ${resultados.vla}°C\n✅ Dictamen: ${!resultados.admisible ? 'RIESGO TÉRMICO' : resultados.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE'}\n\nEnviado desde Asistente HYS`}
                elementIdToPrint="pdf-content"
            />

            {/* Floating Action Bar */}
            <div className="no-print floating-action-bar">
                <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                    <Save size={18} /> GUARDAR
                </button>
                <button onClick={() => requirePro(() => setShowShareModal(true))} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <div className="no-print">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{editData ? 'Editar Estrés Térmico' : 'Estrés Térmico Calculadora'}</h1>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#f97316', fontWeight: 700 }}>Res. SRT 30/2023 — reemplaza Res. 295/03 (derogada)</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/thermal-stress-history')} className="btn-outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem' }}>
                        <Search size={18} /> Historial
                    </button>
                </div>

                <div className="grid-2-cols" style={{ gap: '1.5rem' }}>

                    {/* ─── Columna Izquierda: Formulario ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Metadatos */}
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

                        {/* Mediciones Ambientales */}
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
                                <div>
                                    <label>Velocidad del Aire (m/s) <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700 }}>🆕 Res. 30/2023</span></label>
                                    <input type="number" step="0.1" min="0" value={formData.viento} onChange={e => handleInput('viento', e.target.value)} placeholder="Ej: 0.3" />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Ingresarlo permite calcular la carga térmica ambiental completa.</span>
                                </div>
                                <div>
                                    <label>¿Trabajador aclimatado? <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700 }}>🆕 Res. 30/2023</span></label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: formData.aclimatado ? 'rgba(16,185,129,0.1)' : 'var(--color-background)', padding: '0.5rem 0.8rem', borderRadius: '10px', border: `1px solid ${formData.aclimatado ? '#10b981' : 'var(--color-border)'}`, fontWeight: 700, color: formData.aclimatado ? '#059669' : 'var(--color-text-muted)' }}>
                                        <input type="checkbox" checked={formData.aclimatado} onChange={e => handleInput('aclimatado', e.target.checked)} style={{ margin: 0 }} />
                                        {formData.aclimatado ? 'Sí — 5-14 días completados' : 'No aclimatado'}
                                    </label>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>La aclimatación gradual eleva la tolerancia fisiológica al calor.</span>
                                </div>
                                {formData.cargaSolar && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Temp. Bulbo Seco (Tbs) °C</label>
                                        <input type="number" step="0.1" value={formData.tbs} onChange={e => handleInput('tbs', e.target.value)} placeholder="Temp. Aire seco" style={{ borderColor: '#f97316' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requerido para la ecuación de ponderación con carga solar.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exigencia Física y Régimen */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                                <RefreshCw size={20} /> Exigencia Física y Régimen
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Metabolismo / Carga de Trabajo <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700 }}>Res. 30/2023</span></label>
                                    <select value={formData.ritmo} onChange={e => handleInput('ritmo', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        {METABOLIC_PREFS.map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Ciclo Trabajo / Descanso (por hora)</label>
                                    <select value={formData.ciclo} onChange={e => handleInput('ciclo', e.target.value)} style={{ padding: '0.8rem', width: '100%', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        <option value="continuo">Trabajo Continuo (o &lt; 25% descanso/hr)</option>
                                        <option value="75_25">75% Trabajo, 25% Descanso c/hora</option>
                                        <option value="50_50">50% Trabajo, 50% Descanso c/hora</option>
                                        <option value="25_75">25% Trabajo, 75% Descanso c/hora</option>
                                    </select>
                                </div>

                                {/* Apto médico — obligatorio Res. 30/2023 */}
                                <div style={{ background: formData.aptaMedica ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.05)', border: `1px solid ${formData.aptaMedica ? '#10b981' : 'rgba(239,68,68,0.2)'}`, borderRadius: '12px', padding: '0.8rem 1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700, color: formData.aptaMedica ? '#059669' : '#dc2626', fontSize: '0.87rem' }}>
                                        <input type="checkbox" checked={formData.aptaMedica} onChange={e => handleInput('aptaMedica', e.target.checked)} style={{ margin: 0, width: '16px', height: '16px' }} />
                                        ✅ Apto Médico Específico para Exposición al Calor
                                    </label>
                                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Obligatorio por Res. SRT 30/2023. El trabajador debe tener apto médico antes de operar en ambientes con riesgo térmico.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Columna Derecha: Panel de Resultados ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Card Dictamen */}
                        <div className="card shadow-xl" style={{ border: '2px solid var(--color-primary)', background: 'var(--color-surface)', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--color-primary)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                                <Calculator size={20} /> Dictamen — {countryNorms.thermal}
                            </div>

                            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                {/* TGBH grande */}
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    Índice TGBH Calculado
                                </div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text)', marginBottom: '1.2rem' }}>
                                    {resultados.tgbh !== null ? `${resultados.tgbh}°C` : '--'}
                                </div>

                                {/* VLA y VLE */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#d97706', marginBottom: '0.2rem' }}>VLA (Acción)</span>
                                        <span style={{ fontWeight: 900, color: '#d97706' }}>{resultados.vla !== null ? `${resultados.vla}°C` : '--'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#dc2626', marginBottom: '0.2rem' }}>VLE (Límite)</span>
                                        <span style={{ fontWeight: 900, color: '#dc2626' }}>{resultados.vle !== null ? `${resultados.vle}°C` : '--'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'var(--color-background)', borderRadius: '10px', border: '1px solid var(--color-border)', gridColumn: '1 / -1' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.82rem' }}>Carga Solar:</span>
                                        <span style={{ fontWeight: 800, color: formData.cargaSolar ? '#f97316' : 'var(--color-text)', fontSize: '0.82rem' }}>{formData.cargaSolar ? 'SÍ' : 'NO'}</span>
                                    </div>
                                </div>

                                {/* Dictamen 3 niveles: OK / ALERTA VLA / RIESGO VLE */}
                                {resultados.admisible !== null ? (
                                    <div style={{
                                        padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                                        background: !resultados.admisible ? 'rgba(239,68,68,0.1)' : (resultados.enVLA ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'),
                                        color: !resultados.admisible ? '#dc2626' : (resultados.enVLA ? '#d97706' : '#059669'),
                                        border: `2px solid ${!resultados.admisible ? '#ef4444' : (resultados.enVLA ? '#f59e0b' : '#10b981')}`
                                    }}>
                                        {!resultados.admisible
                                            ? <TriangleAlert size={28} />
                                            : (resultados.enVLA ? <Info size={28} /> : <CheckCircle2 size={28} />)
                                        }
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase' }}>
                                                {!resultados.admisible
                                                    ? 'RIESGO TÉRMICO'
                                                    : (resultados.enVLA ? 'ZONA DE ALERTA (VLA)' : 'ADMISIBLE')
                                                }
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>
                                                {!resultados.admisible
                                                    ? 'Supera VLE. Rotación o control urgente (Res. 30/2023).'
                                                    : (resultados.enVLA
                                                        ? 'Supera VLA: activar monitoreo personal obligatorio.'
                                                        : 'Por debajo del VLA. Condición segura.')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}>
                                        <Info size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Ingresá las temperaturas de globo y bulbo húmedo para ver el resultado.</p>
                                    </div>
                                )}

                                {/* Advertencia aclimatación pendiente */}
                                {!formData.aclimatado && resultados.tgbh !== null && (
                                    <div style={{ marginTop: '0.8rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', textAlign: 'left' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#d97706', marginBottom: '0.25rem' }}>⚠️ ACLIMATACIÓN PENDIENTE — Res. SRT 30/2023</div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                            Trabajador no aclimatado. Implementar plan progresivo de <strong>5 a 14 días</strong> antes de exposición completa al calor.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Fundamento Legal */}
                        <div className="card" style={{ padding: '1.5rem', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.25)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#ea580c', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Info size={16} /> Fundamento Legal
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#7c3513', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                                <strong>{countryNorms.thermal} ({countryNorms.general})</strong> — Vigente desde 2024 (prórroga Res. 7/2024).
                                Reemplazó el Anexo II del Dec. 351/79 y art. relacionados en Dec. 911/96 y 249/07.
                                El índice adoptado es el TGBH (Temperatura de Globo y Bulbo Húmedo).
                            </p>
                            <code style={{ fontSize: '0.73rem', background: 'rgba(249,115,22,0.08)', padding: '0.6rem', borderRadius: '6px', display: 'block', color: '#c2410c', lineHeight: 1.8 }}>
                                Interior: TGBH = 0.7·Tbh + 0.3·Tg<br />
                                Exterior (sol): TGBH = 0.7·Tbh + 0.2·Tg + 0.1·Tbs<br />
                                VLA = VLE &minus; 1.5°C &nbsp;(criterio ACGIH adoptado)
                            </code>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRO upgrade banner */}
            <AdBanner />

            {/* Reporte oculto para impresión directa */}
            <div className="print-only">
                <ThermalStressPdfGenerator
                    data={{
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
