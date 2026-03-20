import React from 'react';

import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import CompanyLogo from '../components/CompanyLogo';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react';

export default function Checklist(): React.ReactElement | null {
    const navigate = useNavigate();
    const categories = [
        { id: 'extintores', name: 'Extintores y Protección' },
        { id: 'electrico', name: 'Riesgo Eléctrico' },
        { id: 'epp', name: 'Elementos de Protección Personal' },
        { id: 'orden', name: 'Orden y Limpieza' },
        { id: 'senyalizacion', name: 'Señalización y Evacuación' }
    ];

    const items = {
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
    const [responses, setResponses] = useState({});

    // Load responses on mount
    useEffect(() => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            if (inspection.responses) {
                setResponses(inspection.responses);
            }
        }
    }, []);

    // Helper to save current state to localStorage with defensive merging
    const saveToLocalStorage = (updatedResponses) => {
        const current = localStorage.getItem('current_inspection');
        let inspection = {};
        if (current) {
            try {
                inspection = JSON.parse(current);
            } catch {

                console.error('[Checklist] Error parsing current_inspection from localStorage:', e);
                // If parsing fails, start with an empty inspection object
                inspection = {};
            }
        }

        // MERGE: Ensure we keep existing data (like observations, photos, etc.)
        // and only update the 'responses' field.
        const finalResponses = updatedResponses; // updatedResponses already contains the latest state for responses
        
        inspection.responses = finalResponses;
        localStorage.setItem('current_inspection', JSON.stringify(inspection));
        console.log('[Checklist] Saved responses. Total responses:', Object.keys(finalResponses).length);
    };

    const handleToggle = (itemId, status) => {
        setResponses(prev => {
            const updated = { ...prev, [itemId]: status };
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const handleRecordFinding = (itemId, catName) => {
        // Automatically mark as fail when recording a finding
        const updated = { ...responses, [itemId]: 'fail' };
        setResponses(updated);
        saveToLocalStorage(updated);
        navigate('/observation', { state: { itemId, category: catName } });
    };

    const progress = Math.round((Object.keys(responses).length / flatItems.length) * 100);

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Control</h1>
                </div>

                <div style={{ textAlign: 'center' }}>
                     <button 
                        onClick={() => navigate('/risk', { state: { fromInspection: true } })}
                        className="btn-outline"
                        style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.4rem 0.6rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            borderColor: 'var(--color-primary)',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            margin: 0,
                            borderRadius: '10px'
                        }}
                    >
                        <AlertCircle size={14} /> Evaluación IPER
                    </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                     <CompanyLogo style={{ height: '32px', width: 'auto', maxWidth: '100px', objectFit: 'contain' }} />
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Progreso del Relevamiento</p>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>{progress}%</span>
                </div>
                <div style={{ height: '10px', background: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
                </div>
            </div>

            {categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.name}</h3>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {(items[cat.id] || []).map(item => (
                            <div 
                                key={item.id} 
                                style={{ 
                                    padding: '1.2rem', 
                                    borderBottom: '1px solid var(--color-border)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1rem', 
                                    background: responses[item.id] === 'fail' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: responses[item.id] === 'fail' ? 600 : 400, color: responses[item.id] === 'fail' ? '#ef4444' : 'inherit' }}>
                                    {item.text}
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <button
                                        onClick={() => handleToggle(item.id, 'ok')}
                                        style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '12px',
                                            background: responses[item.id] === 'ok' ? '#10b981' : 'var(--color-surface)',
                                            border: `2px solid ${responses[item.id] === 'ok' ? '#10b981' : 'var(--color-border)'}`,
                                            color: responses[item.id] === 'ok' ? 'white' : 'var(--color-text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: 900
                                        }}
                                        title="Cumple"
                                    >
                                        {responses[item.id] === 'ok' ? '✓' : <CheckCircle2 size={22} />}
                                    </button>
                                    <button
                                        onClick={() => handleRecordFinding(item.id, cat.name)}
                                        style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '12px',
                                            background: responses[item.id] === 'fail' ? '#ef4444' : 'var(--color-surface)',
                                            border: `2px solid ${responses[item.id] === 'fail' ? '#ef4444' : 'var(--color-border)'}`,
                                            color: responses[item.id] === 'fail' ? 'white' : 'var(--color-text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: 900
                                        }}
                                        title="No Conformidad / Hallazgo"
                                    >
                                        {responses[item.id] === 'fail' ? '✕' : <AlertCircle size={22} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                className="btn-primary"
                onClick={() => navigate('/report')}
                style={{ width: '100%', marginTop: '1rem', padding: '1.2rem', fontSize: '1rem' }}
            >
                Finalizar y Generar Reporte
            </button>
        </div>
    );
}
