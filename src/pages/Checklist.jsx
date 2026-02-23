import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react';

export default function Checklist() {
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

    const [responses, setResponses] = useState({});

    const handleToggle = (itemId, status) => {
        setResponses(prev => ({ ...prev, [itemId]: status }));
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Lista de Control</h1>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Sector: Planta Industrial - Nave A</p>
                <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <div style={{ width: '40%', height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                </div>
            </div>

            {categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-primary)', textAlign: 'left' }}>{cat.name}</h3>
                    <div className="card" style={{ padding: '0', textAlign: 'left', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                        {(items[cat.id] || []).map(item => (
                            <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                <div style={{ flex: 1, fontSize: '0.9rem', textAlign: 'left', color: 'var(--color-text)' }}>{item.text}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleToggle(item.id, 'ok')}
                                        style={{
                                            padding: '0.4rem',
                                            borderRadius: '50%',
                                            background: responses[item.id] === 'ok' ? 'var(--color-primary)' : 'transparent',
                                            border: `1px solid ${responses[item.id] === 'ok' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            color: responses[item.id] === 'ok' ? 'white' : 'var(--color-text-muted)',
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => navigate('/observation')}
                                        style={{
                                            padding: '0.4rem',
                                            borderRadius: '50%',
                                            background: responses[item.id] === 'fail' ? '#ef4444' : 'transparent',
                                            border: `1px solid ${responses[item.id] === 'fail' ? '#ef4444' : 'var(--color-border)'}`,
                                            color: responses[item.id] === 'fail' ? 'white' : 'var(--color-text-muted)',
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <AlertCircle size={18} />
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
                style={{ width: '100%', marginTop: '2rem' }}
            >
                Finalizar Relevamiento
            </button>
        </div>
    );
}
