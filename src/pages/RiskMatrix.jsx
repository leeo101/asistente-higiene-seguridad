import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RiskMatrix() {
    const navigate = useNavigate();
    const [projectData, setProjectData] = useState({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        responsable: ''
    });

    const [rows, setRows] = useState([
        { id: Date.now(), task: '', hazardType: '', hazard: '', probableEffect: '', exposedCount: 1, probability: 1, severity: 1, controls: '' }
    ]);

    useEffect(() => {
        const savedProfile = localStorage.getItem('personalData');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setProjectData(prev => ({ ...prev, responsable: parsed.name || '' }));
        }
    }, []);

    const addRow = () => {
        setRows([...rows, { id: Date.now(), task: '', hazardType: '', hazard: '', probableEffect: '', exposedCount: 1, probability: 1, severity: 1, controls: '' }]);
    };

    const removeRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const getRiskLevel = (p, s) => {
        const product = p * s;
        if (product <= 4) return { label: 'Bajo', color: '#10b981', textColor: 'white' };
        if (product <= 9) return { label: 'Moderado', color: '#f59e0b', textColor: 'white' };
        return { label: 'Crítico', color: '#ef4444', textColor: 'white' };
    };

    const handleSave = () => {
        if (!projectData.name) {
            alert('Por favor, ingrese el nombre del proyecto/obra.');
            return;
        }

        const newEntry = {
            id: Date.now(),
            ...projectData,
            rows: rows,
            createdAt: new Date().toISOString()
        };

        const history = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');
        localStorage.setItem('risk_matrix_history', JSON.stringify([newEntry, ...history]));
        localStorage.setItem('current_risk_matrix', JSON.stringify(newEntry));
        navigate('/risk-matrix-report');
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Matriz de Riesgos (Ley 19.587)</h1>
            </div>

            {/* Header Data */}
            <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Obra / Proyecto</label>
                    <input
                        type="text"
                        value={projectData.name}
                        onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                        placeholder="Ej: Edificio Central"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ubicación</label>
                    <input
                        type="text"
                        value={projectData.location}
                        onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                        placeholder="Ej: Planta 1"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fecha</label>
                    <input
                        type="date"
                        value={projectData.date}
                        onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Responsable</label>
                    <input
                        type="text"
                        value={projectData.responsable}
                        onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
                    />
                </div>
            </div>

            {/* Matrix Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>Tarea / Proceso</th>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '120px' }}>Tipo Peligro</th>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>Peligro / Riesgo</th>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>Efecto Probable</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Exp.</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>P</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>S</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Nivel</th>
                            <th style={{ padding: '1rem', textAlign: 'left', minWidth: '200px' }}>Medidas de Control</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const level = getRiskLevel(row.probability, row.severity);
                            return (
                                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <textarea
                                            value={row.task}
                                            onChange={(e) => updateRow(row.id, 'task', e.target.value)}
                                            style={{ minHeight: '60px', padding: '0.5rem' }}
                                            placeholder="Describa la tarea"
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={row.hazardType}
                                            onChange={(e) => updateRow(row.id, 'hazardType', e.target.value)}
                                            style={{ padding: '0.3rem' }}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Físico">Físico</option>
                                            <option value="Químico">Químico</option>
                                            <option value="Biológico">Biológico</option>
                                            <option value="Ergonómico">Ergonómico</option>
                                            <option value="Psicosocial">Psicosocial</option>
                                            <option value="Mecánico">Mecánico</option>
                                            <option value="Eléctrico">Eléctrico</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <textarea
                                            value={row.hazard}
                                            onChange={(e) => updateRow(row.id, 'hazard', e.target.value)}
                                            style={{ minHeight: '60px', padding: '0.5rem' }}
                                            placeholder="Peligro y consecuencias"
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <textarea
                                            value={row.probableEffect}
                                            onChange={(e) => updateRow(row.id, 'probableEffect', e.target.value)}
                                            style={{ minHeight: '60px', padding: '0.5rem' }}
                                            placeholder="Ej: Laceración, Hipoacusia"
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <input
                                            type="number"
                                            value={row.exposedCount}
                                            onChange={(e) => updateRow(row.id, 'exposedCount', parseInt(e.target.value) || 0)}
                                            style={{ width: '50px', padding: '0.3rem', textAlign: 'center' }}
                                            min="0"
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={row.probability}
                                            onChange={(e) => updateRow(row.id, 'probability', parseInt(e.target.value))}
                                            style={{ padding: '0.3rem' }}
                                        >
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={row.severity}
                                            onChange={(e) => updateRow(row.id, 'severity', parseInt(e.target.value))}
                                            style={{ padding: '0.3rem' }}
                                        >
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <div style={{
                                            background: level.color,
                                            color: level.textColor,
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800
                                        }}>
                                            {level.label}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <textarea
                                            value={row.controls}
                                            onChange={(e) => updateRow(row.id, 'controls', e.target.value)}
                                            style={{ minHeight: '60px', padding: '0.5rem' }}
                                            placeholder="Equipo de protección, protocolos, etc."
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addRow}
                className="btn-outline"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}
            >
                <Plus size={20} /> Agregar Fila de Evaluación
            </button>

            <button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold"
                style={{ width: '100%', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
            >
                <Save size={20} /> Generar y Guardar Matriz
            </button>

            {/* Legend */}
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Guía de Valoración (Probabilidad x Severidad)</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                        <span>1-4: Bajo (Riesgo tolerable)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                        <span>5-9: Moderado (Requiere control)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                        <span>10-16: Crítico (Acción inmediata)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
