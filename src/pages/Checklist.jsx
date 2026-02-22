import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
    {
        id: 'epp',
        name: 'Elementos de Protección Personal',
        items: ['Uso de Casco', 'Uso de Calzado de Seguridad', 'Uso de Protección Ocular', 'Uso de Arnés de Seguridad']
    },
    {
        id: 'electricidad',
        name: 'Instalación Eléctrica',
        items: ['Tableros con disyuntor', 'Cableado ordenado y sin uniones expuestas', 'Puesta a tierra verificada']
    },
    {
        id: 'altura',
        name: 'Trabajo en Altura',
        items: ['Andamios asegurados', 'Barandas perimetrales', 'Líneas de vida instaladas']
    },
    {
        id: 'orden',
        name: 'Orden y Limpieza',
        items: ['Pasillos despejados', 'Acopio de materiales seguro', 'Residuos clasificados']
    }
];

export default function Checklist() {
    const navigate = useNavigate();
    const [expandedCategory, setExpandedCategory] = useState('epp');
    const [checklistState, setChecklistState] = useState({});

    const toggleCategory = (id) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    const handleStatusChange = (categoryIndex, itemIndex, status) => {
        setChecklistState(prev => ({
            ...prev,
            [`${categoryIndex}-${itemIndex}`]: status
        }));

        if (status === 'nc') {
            if (confirm("Marcaste 'No Cumple'. ¿Deseas registrar una observación ahora?")) {
                navigate('/observation');
            }
        }
    };

    const calculateProgress = () => {
        const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
        const checkedItems = Object.keys(checklistState).length;
        return Math.round((checkedItems / totalItems) * 100);
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Checklist</h1>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>{calculateProgress()}% Completado</span>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'var(--color-surface)', borderRadius: '4px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ width: `${calculateProgress()}%`, height: '100%', background: 'var(--color-secondary)', transition: 'width 0.3s ease' }}></div>
            </div>

            {CATEGORIES.map((cat, catIndex) => (
                <div key={cat.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderBottom: expandedCategory === cat.id ? '1px solid var(--color-border)' : 'none'
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{cat.name}</h3>
                        {expandedCategory === cat.id ? <ChevronUp /> : <ChevronDown />}
                    </div>

                    {expandedCategory === cat.id && (
                        <div style={{ padding: '1rem' }}>
                            {cat.items.map((item, itemIndex) => {
                                const currentStatus = checklistState[`${catIndex}-${itemIndex}`];
                                return (
                                    <div key={itemIndex} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <p style={{ margin: '0 0 0.8rem 0' }}>{item}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStatusChange(catIndex, itemIndex, 'c')}
                                                style={{ flex: 1, padding: '0.5rem', background: currentStatus === 'c' ? 'var(--color-secondary)' : 'var(--color-background)', border: `1px solid ${currentStatus === 'c' ? 'transparent' : 'var(--color-border)'}` }}
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(catIndex, itemIndex, 'nc')}
                                                style={{ flex: 1, padding: '0.5rem', background: currentStatus === 'nc' ? '#ef4444' : 'var(--color-background)', border: `1px solid ${currentStatus === 'nc' ? 'transparent' : 'var(--color-border)'}` }}
                                            >
                                                <XCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(catIndex, itemIndex, 'na')}
                                                style={{ flex: 1, padding: '0.5rem', background: currentStatus === 'na' ? 'var(--color-text-muted)' : 'var(--color-background)', border: `1px solid ${currentStatus === 'na' ? 'transparent' : 'var(--color-border)'}` }}
                                            >
                                                <MinusCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}

            <button className="btn-primary" onClick={() => navigate('/report')}>
                Finalizar Inspección
            </button>
        </div>
    );
}
