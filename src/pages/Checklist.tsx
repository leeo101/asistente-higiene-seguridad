import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CompanyLogo from '../components/CompanyLogo';
import Breadcrumbs from '../components/Breadcrumbs';
import { ArrowLeft, CheckCircle2, AlertCircle, ClipboardCheck, ChevronRight, Shield } from 'lucide-react';

export default function Checklist(): React.ReactElement | null {
    const navigate = useNavigate();
    const categories = [
        { id: 'extintores', name: 'Extintores y Protección', icon: '🔥', color: '#ef4444' },
        { id: 'electrico', name: 'Riesgo Eléctrico', icon: '⚡', color: '#f59e0b' },
        { id: 'epp', name: 'Elementos de Protección Personal', icon: '🦺', color: '#0052CC' },
        { id: 'orden', name: 'Orden y Limpieza', icon: '🧹', color: '#10b981' },
        { id: 'senyalizacion', name: 'Señalización y Evacuación', icon: '🚦', color: '#8b5cf6' }
    ];

    const items: Record<string, { id: string; text: string }[]> = {
        extintores: [
            { id: 'e1', text: 'Extintores con carga vigente y señalizados' },
            { id: 'e2', text: 'Acceso libre a los equipos de lucha contra fuego' }
        ],
        electrico: [
            { id: 'L1', text: 'Tableros eléctricos cerrados y señalizados' },
            { id: 'L2', text: 'Puesta a tierra comprobable en equipos' }
        ],
        epp: [
            { id: 'p1', text: 'Personal utiliza calzado y casco de seguridad' },
            { id: 'p2', text: 'Entrega de EPP registrada y firmada' }
        ],
        orden: [
            { id: 'o1', text: 'Pasillos y pasarelas libres de obstáculos' },
            { id: 'o2', text: 'Residuos segregados en recipientes adecuados' }
        ],
        senyalizacion: [
            { id: 's1', text: 'Salidas de emergencia demarcadas claramente' },
            { id: 's2', text: 'Planos de evacuación visibles y actualizados' }
        ]
    };

    const flatItems = Object.values(items).flat();
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [title, setTitle] = useState('Control de Inspección');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const updateTitleInStorage = (newTitle: string) => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            try {
                const inspection = JSON.parse(current);
                inspection.title = newTitle;
                inspection.type = newTitle;
                localStorage.setItem('current_inspection', JSON.stringify(inspection));
            } catch (e) {
                console.error('Error saving title:', e);
            }
        }
    };

    // Load responses on mount
    useEffect(() => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            if (inspection.title || inspection.type) {
                setTitle(inspection.title || inspection.type);
            }
            if (inspection.responses) {
                setResponses(inspection.responses);
            }
        }
    }, []);

    // Helper to save current state to localStorage with defensive merging
    const saveToLocalStorage = (updatedResponses: Record<string, string>) => {
        const current = localStorage.getItem('current_inspection');
        let inspection: any = {};
        if (current) {
            try {
                inspection = JSON.parse(current);
            } catch (e) {
                console.error('[Checklist] Error parsing current_inspection from localStorage:', e);
                inspection = {} as any;
            }
        }
        inspection.responses = updatedResponses;
        localStorage.setItem('current_inspection', JSON.stringify(inspection));
        console.log('[Checklist] Saved responses. Total responses:', Object.keys(updatedResponses).length);
    };

    const handleToggle = (itemId: string, status: string) => {
        setResponses(prev => {
            const updated = { ...prev, [itemId]: status };
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const handleRecordFinding = (itemId: string, catName: string) => {
        // Automatically mark as fail when recording a finding
        const updated = { ...responses, [itemId]: 'fail' };
        setResponses(updated);
        saveToLocalStorage(updated);
        navigate('/observation', { state: { itemId, category: catName } });
    };

    const answered = Object.keys(responses).length;
    const total = flatItems.length;
    const progress = Math.round((answered / total) * 100);

    const okCount = Object.values(responses).filter(v => v === 'ok').length;
    const failCount = Object.values(responses).filter(v => v === 'fail').length;

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem', maxWidth: 720 }}>
            <Breadcrumbs />

            {/* ═══ Premium Header ═══ */}
            <div style={{
                marginBottom: '1.5rem', padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, #0052CC 0%, #003d99 50%, #001a66 100%)',
                borderRadius: 24, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                boxShadow: '0 10px 40px rgba(0,82,204,0.35), 0 0 80px rgba(0,82,204,0.1)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Background glows */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(0,197,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                    <></>
                    <div style={{
                        width: 56, height: 56,
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}>
                        <ClipboardCheck size={30} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        {isEditingTitle ? (
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => {
                                    setIsEditingTitle(false);
                                    updateTitleInStorage(title);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsEditingTitle(false);
                                        updateTitleInStorage(title);
                                    }
                                }}
                                autoFocus
                                style={{
                                    margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff', 
                                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', 
                                    borderRadius: '8px', padding: '0 0.5rem', outline: 'none',
                                    letterSpacing: '-0.5px', width: '100%', boxSizing: 'border-box'
                                }}
                            />
                        ) : (
                            <h1 
                                onClick={() => setIsEditingTitle(true)}
                                style={{ 
                                    margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff', 
                                    letterSpacing: '-0.5px', cursor: 'text', 
                                    borderBottom: '1px dashed rgba(255,255,255,0.4)',
                                    display: 'inline-block'
                                }}
                                title="Click para editar el título"
                            >
                                {title}
                            </h1>
                        )}
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.3px', marginTop: '0.2rem' }}>
                            Relevamiento de condiciones de seguridad
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                    <button
                        onClick={() => navigate('/risk', { state: { fromInspection: true } })}
                        style={{
                            padding: '0.55rem 1rem',
                            background: 'rgba(255,255,255,0.15)',
                            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontWeight: 700, fontSize: '0.82rem',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <AlertCircle size={14} /> IPER
                    </button>
                    <CompanyLogo style={{ height: '36px', width: 'auto', maxWidth: '110px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
                </div>
            </div>

            {/* ═══ Stats Row ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Completados', value: answered, color: '#0052CC', bg: 'rgba(0,82,204,0.08)' },
                    { label: 'Conformes ✓', value: okCount, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                    { label: 'Hallazgos ⚠', value: failCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                ].map(stat => (
                    <div key={stat.label} className="toolbox-stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ═══ Progress Bar ═══ */}
            <div className="toolbox-glass-section" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Progreso del Relevamiento
                    </span>
                    <span style={{
                        fontSize: '1.1rem', fontWeight: 900,
                        background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        {progress}%
                    </span>
                </div>
                <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: progress === 100
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : 'linear-gradient(90deg, #0052CC, #0077ff, #00c5ff)',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 8,
                        boxShadow: progress > 0 ? '0 0 12px rgba(0,119,255,0.4)' : 'none'
                    }} />
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    <span>{answered} de {total} puntos relevados</span>
                    {progress === 100 && <span style={{ color: '#10b981', fontWeight: 800 }}>✓ Completo</span>}
                </div>
            </div>

            {/* ═══ Category Sections ═══ */}
            {categories.map(cat => {
                const catItems = items[cat.id] || [];
                const catAnswered = catItems.filter(i => responses[i.id]).length;
                const catDone = catAnswered === catItems.length;

                return (
                    <div key={cat.id} style={{ marginBottom: '1.25rem' }}>
                        {/* Category Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            marginBottom: '0.6rem', padding: '0 0.25rem'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                            <span style={{
                                fontSize: '0.78rem', fontWeight: 900, color: cat.color,
                                textTransform: 'uppercase', letterSpacing: '1px', flex: 1
                            }}>{cat.name}</span>
                            {catDone && (
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 800, color: '#10b981',
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                    padding: '2px 8px', borderRadius: 20
                                }}>✓ Completado</span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                {catAnswered}/{catItems.length}
                            </span>
                        </div>

                        {/* Items Card */}
                        <div className="toolbox-glass-section" style={{ padding: 0, overflow: 'hidden' }}>
                            {catItems.map((item, idx) => {
                                const status = responses[item.id];
                                const isOk = status === 'ok';
                                const isFail = status === 'fail';

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: '1.1rem 1.25rem',
                                            borderBottom: idx < catItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            background: isFail ? 'rgba(239,68,68,0.04)' : isOk ? 'rgba(16,185,129,0.02)' : 'transparent',
                                            transition: 'background 0.25s ease'
                                        }}
                                    >
                                        {/* Item number badge */}
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isFail ? 'rgba(239,68,68,0.12)' : isOk ? 'rgba(16,185,129,0.12)' : 'var(--color-background)',
                                            border: `1px solid ${isFail ? 'rgba(239,68,68,0.3)' : isOk ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
                                            fontSize: '0.65rem', fontWeight: 900,
                                            color: isFail ? '#ef4444' : isOk ? '#10b981' : 'var(--color-text-muted)',
                                            transition: 'all 0.25s'
                                        }}>
                                            {idx + 1}
                                        </div>

                                        {/* Item text */}
                                        <div style={{
                                            flex: 1, fontSize: '0.9rem', lineHeight: 1.5,
                                            fontWeight: isFail ? 700 : 500,
                                            color: isFail ? '#ef4444' : isOk ? 'var(--color-text-muted)' : 'var(--color-text)',
                                            transition: 'color 0.2s'
                                        }}>
                                            {item.text}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                            {/* OK button */}
                                            <button
                                                onClick={() => handleToggle(item.id, 'ok')}
                                                title="Cumple"
                                                style={{
                                                    width: 44, height: 44, borderRadius: 12,
                                                    background: isOk
                                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                                        : 'var(--color-background)',
                                                    border: `2px solid ${isOk ? '#10b981' : 'var(--color-border)'}`,
                                                    color: isOk ? '#fff' : 'var(--color-text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: isOk ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                                                    transform: isOk ? 'scale(1.05)' : 'scale(1)'
                                                }}
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>

                                            {/* FAIL / Finding button */}
                                            <button
                                                onClick={() => handleRecordFinding(item.id, cat.name)}
                                                title="Registrar Hallazgo / No Conformidad"
                                                style={{
                                                    width: 44, height: 44, borderRadius: 12,
                                                    background: isFail
                                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                                        : 'var(--color-background)',
                                                    border: `2px solid ${isFail ? '#ef4444' : 'var(--color-border)'}`,
                                                    color: isFail ? '#fff' : 'var(--color-text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: isFail ? '0 4px 14px rgba(239,68,68,0.35)' : 'none',
                                                    transform: isFail ? 'scale(1.05)' : 'scale(1)'
                                                }}
                                            >
                                                <AlertCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* ═══ Finish Button ═══ */}
            <div style={{ marginTop: '1.5rem' }}>
                <button
                    onClick={() => navigate('/report')}
                    style={{
                        width: '100%', padding: '1.1rem 2rem',
                        background: progress === 100
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #0052CC, #0077ff)',
                        color: '#fff', border: 'none', borderRadius: 16,
                        fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        boxShadow: progress === 100
                            ? '0 8px 30px rgba(16,185,129,0.4)'
                            : '0 8px 30px rgba(0,82,204,0.4)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        letterSpacing: '0.5px'
                    }}
                >
                    <Shield size={22} />
                    {progress === 100 ? 'Generar Reporte Final' : `Continuar al Reporte (${progress}% completado)`}
                    <ChevronRight size={20} />
                </button>
                {progress < 100 && (
                    <p style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        Podés generar el reporte en cualquier momento
                    </p>
                )}
            </div>
        </div>
    );
}
