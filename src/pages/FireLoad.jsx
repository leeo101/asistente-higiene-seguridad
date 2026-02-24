import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Flame, Calculator,
    FileText, Printer, Building2, Layout, Maximize2,
    Info, AlertTriangle, ShieldCheck, History
} from 'lucide-react';
import { fireMaterials, riskActivityGroups } from '../data/fireMaterials';
import { useAuth } from '../contexts/AuthContext';

export default function FireLoad() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const [formData, setFormData] = useState({
        empresa: '',
        sector: '',
        actividadResumen: '',
        descripcionActividad: '',
        superficie: 0,
        actividadGrupo: 'industrial',
        riesgo: 'R4', // Predeterminado para industrial
        materiales: [
            { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400, totalKcal: 0 }
        ]
    });

    // CRITICAL: Define professional state which was causing 'not defined' crash
    const [professional, setProfessional] = useState({
        name: 'Profesional',
        license: '',
        signature: null
    });

    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('personalData');
            const savedSigData = localStorage.getItem('signatureStampData');
            const legacySignature = localStorage.getItem('capturedSignature');

            let signature = legacySignature || null;
            if (savedSigData) {
                const parsed = JSON.parse(savedSigData);
                signature = parsed.signature || signature;
            }

            let profData = {
                name: 'Profesional',
                license: '',
                signature: signature
            };

            if (savedData) {
                const data = JSON.parse(savedData);
                profData.name = data.name || 'Profesional';
                profData.license = data.license || '';
            }

            setProfessional(profData);
        } catch (error) {
            console.error('Error loading professional data:', error);
        }
    }, []);

    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData);
        }
    }, [location.state]);

    const [results, setResults] = useState({
        cargaTermicaTotal: 0,
        maderaEquivalente: 0,
        cargaDeFuego: 0,
        rfRequerida: 'F0',
        minMatafuegos: 0
    });

    // Actualizar riesgo cuando cambia el grupo de actividad
    useEffect(() => {
        // Robust check for riskActivityGroups
        if (Array.isArray(riskActivityGroups)) {
            const group = riskActivityGroups.find(g =>
                g.id === formData.actividadGrupo ||
                g.label === formData.actividadGrupo
            );
            if (group) {
                setFormData(prev => ({ ...prev, riesgo: group.defaultR || 'R3' }));
            }
        }
    }, [formData.actividadGrupo]);

    // Recalcular todo cuando cambian los materiales o la superficie
    useEffect(() => {
        calculateFireLoad();
    }, [formData.materiales, formData.superficie, formData.riesgo]);

    const calculateFireLoad = () => {
        try {
            // 1. Carga Térmica Total (Sumatoria de Peso * Poder Calorífico)
            const totalKcal = (formData.materiales || []).reduce((acc, m) => acc + ((m.peso || 0) * (m.poderCalorifico || 0)), 0);

            // 2. Madera Equivalente (Total Kcal / 4400)
            const maderaEq = totalKcal / 4400;

            // 3. Carga de Fuego Qf (Madera Eq / Superficie)
            const qf = formData.superficie > 0 ? maderaEq / formData.superficie : 0;

            // 4. Determinar RF (Simplificado según Tabla 2.2.1 Anexo VII)
            let rf = 'F0';
            const riskStr = formData.riesgo || 'R3';
            const rValue = parseInt(riskStr.replace('R', '')) || 3;

            if (qf > 0) {
                if (qf <= 15) rf = rValue <= 2 ? 'F60' : 'F30';
                else if (qf <= 30) rf = rValue <= 2 ? 'F90' : 'F60';
                else if (qf <= 60) rf = rValue <= 2 ? 'F120' : 'F90';
                else if (qf <= 100) rf = rValue <= 2 ? 'F180' : 'F120';
                else rf = 'F180+';
            }

            // 5. Cálculo de Matfuegos (1 cada 200m2, mínimo 2)
            const matafuegosCalc = Math.max(2, Math.ceil(formData.superficie / 200));

            setResults({
                cargaTermicaTotal: totalKcal,
                maderaEquivalente: maderaEq,
                cargaDeFuego: qf,
                rfRequerida: rf,
                minMatafuegos: matafuegosCalc
            });
        } catch (error) {
            console.error('Error in calculation:', error);
        }
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...formData.materiales];
        if (field === 'nombre') {
            newMaterials[index].nombre = value;

            // Normalize string for better matching (remove parentheses and extra spaces)
            const normalize = (str) => str.toLowerCase().replace(/[()]/g, '').trim();
            const normalizedValue = normalize(value);

            if (normalizedValue === '') {
                newMaterials[index].poderCalorifico = 0;
            } else {
                // Try to find an exact or fuzzy match
                const predefined = (fireMaterials || []).find(m => {
                    const normalizedName = normalize(m.nombre);
                    return normalizedName === normalizedValue ||
                        normalizedName.includes(normalizedValue) ||
                        normalizedValue.includes(normalizedName);
                });

                if (predefined) {
                    newMaterials[index].poderCalorifico = predefined.poderCalorifico;
                }
            }
        } else {
            newMaterials[index][field] = parseFloat(value) || 0;
        }

        newMaterials[index].totalKcal = (newMaterials[index].peso || 0) * (newMaterials[index].poderCalorifico || 0);
        setFormData({ ...formData, materiales: newMaterials });
    };

    const addMaterial = () => {
        setFormData({
            ...formData,
            materiales: [...formData.materiales, { nombre: '', peso: 0, poderCalorifico: 0, totalKcal: 0 }]
        });
    };

    const removeMaterial = (index) => {
        if (formData.materiales.length > 1) {
            setFormData({
                ...formData,
                materiales: formData.materiales.filter((_, i) => i !== index)
            });
        }
    };

    const handlePrint = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') {
            navigate('/subscribe');
            return;
        }
        window.print();
    };

    const handleSave = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        try {
            const historyRaw = localStorage.getItem('fireload_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            let newHistory;
            if (formData.id) {
                newHistory = history.map(item => item.id === formData.id ? { ...formData, results, updatedAt: new Date().toISOString() } : item);
            } else {
                const newEntry = {
                    ...formData,
                    results,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString()
                };
                newHistory = [newEntry, ...history];
            }

            localStorage.setItem('fireload_history', JSON.stringify(newHistory));
            alert('Carga de Fuego guardada con éxito');
            navigate('/fire-load-history');
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>

            <div className="print-header">
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>INFORME TÉCNICO: ESTUDIO DE CARGA DE FUEGO</h1>
                <p style={{ margin: '5px 0', fontSize: '1rem', color: '#444' }}>Determinación de Carga Térmica y Resistencia al Fuego - Dec. 351/79</p>
                <div style={{ textAlign: 'left', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                        <div><strong>Empresa:</strong> {formData.empresa}</div>
                        <div><strong>Sector:</strong> {formData.sector}</div>
                    </div>
                    <div><strong>Actividad:</strong> {formData.actividadResumen || 'No especificada'}</div>
                </div>
            </div>

            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Estudio de Carga de Fuego</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cálculo según Dec. 351/79 Anexo VII</p>
                </div>
            </div>

            <div className="main-layout flex flex-col lg:flex-row gap-6" style={{ alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                            <Building2 size={20} color="var(--color-primary)" /> Datos del Sector de Incendio
                        </h3>
                        <div className="grid-res-2" style={{ marginBottom: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Empresa / Establecimiento</label>
                                <input type="text" value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} placeholder="Ej: Planta Industrial Sur" />
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.empresa || '-'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sector / Depósito</label>
                                <input type="text" value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })} placeholder="Ej: Salón de Ventas" />
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.sector || '-'}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Actividad (Resumen para Encabezado)</label>
                            <input
                                type="text"
                                value={formData.actividadResumen}
                                onChange={e => setFormData({ ...formData, actividadResumen: e.target.value })}
                                placeholder="Ej: Planta Industrial, Depósito de Telas..."
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Descripción de Actividad</label>
                            <textarea
                                value={formData.descripcionActividad}
                                onChange={e => setFormData({ ...formData, descripcionActividad: e.target.value })}
                                onInput={e => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                placeholder="Detalle los procesos y actividades que se realizan en el sector..."
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '80px', overflow: 'hidden', fontFamily: 'inherit' }}
                            />
                            <div className="print-text-box">{formData.descripcionActividad || 'Sin descripción detallada.'}</div>
                        </div>
                        <div className="grid-res-2">
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Superficie del Sector (m²)</label>
                                <input type="number" value={formData.superficie} onChange={e => setFormData({ ...formData, superficie: parseFloat(e.target.value) || 0 })} />
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.superficie} m²</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Grupo de Actividad</label>
                                <input
                                    list="activityList"
                                    value={formData.actividadGrupo}
                                    onChange={e => setFormData({ ...formData, actividadGrupo: e.target.value })}
                                    placeholder="Ej: Industrial, Comercial..."
                                />
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.actividadGrupo}</div>
                                <datalist id="activityList">
                                    {(riskActivityGroups || []).map(g => <option key={g.id} value={g.label} />)}
                                </datalist>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nivel de Riesgo (Anexo VII)</label>
                            <select
                                value={formData.riesgo}
                                onChange={e => setFormData({ ...formData, riesgo: e.target.value })}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                className="no-print"
                            >
                                <option value="R1">Riesgo 1 (Explosivo)</option>
                                <option value="R2">Riesgo 2 (Inflamable)</option>
                                <option value="R3">Riesgo 3 (Muy Combustible)</option>
                                <option value="R4">Riesgo 4 (Combustible)</option>
                                <option value="R5">Riesgo 5 (Poco Combustible)</option>
                                <option value="R6">Riesgo 6 (Incombustible)</option>
                                <option value="R7">Riesgo 7 (Refractario)</option>
                            </select>
                            <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{formData.riesgo}</div>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="no-print">
                                El riesgo afecta directamente el cálculo de la Resistencia al Fuego (RF) necesaria.
                            </p>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                            <Flame size={20} color="#f97316" /> Inventario de Materiales Combustibles
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="print-only" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: '0.8rem', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '5px' }}>
                                <div>Material</div>
                                <div>Peso (Kg)</div>
                                <div>Calor (Mcal/Kg)</div>
                                <div>Total Kcal</div>
                            </div>
                            {(formData.materiales || []).map((m, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr auto', gap: '0.8rem', alignItems: 'end', paddingBottom: '0.8rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Material</label>
                                            <input
                                                list="materialList"
                                                value={m.nombre}
                                                onChange={e => handleMaterialChange(idx, 'nombre', e.target.value)}
                                                placeholder="Nombre..."
                                            />
                                            <datalist id="materialList">
                                                {(fireMaterials || []).map((fm, i) => <option key={i} value={fm.nombre} />)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Peso (Kg)</label>
                                            <input type="number" value={m.peso} onChange={e => handleMaterialChange(idx, 'peso', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Calor (Mcal/Kg)</label>
                                            <input type="number" value={m.poderCalorifico} onChange={e => handleMaterialChange(idx, 'poderCalorifico', e.target.value)} />
                                        </div>
                                        <button onClick={() => removeMaterial(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '0.5rem', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="print-only material-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: '0.8rem' }}>
                                        <div>{m.nombre || 'Sin nombre'}</div>
                                        <div>{m.peso} Kg</div>
                                        <div>{m.poderCalorifico} Mcal/Kg</div>
                                        <div>{Math.round(m.totalKcal || 0).toLocaleString()} Kcal</div>
                                    </div>
                                </React.Fragment>
                            ))}
                            <button onClick={addMaterial} className="no-print" style={{ borderStyle: 'dashed', padding: '0.8rem', width: '100%', background: 'transparent', border: '1px dashed var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px', cursor: 'pointer' }}>
                                <Plus size={18} /> Agregar Material
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="results-grid">
                    <div className="card" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Carga de Fuego Qf</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{(results.cargaDeFuego || 0).toFixed(2)}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Kg de Madera / m²</div>
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid #f97316' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Riesgo Dominante:</span>
                            <span style={{ fontWeight: 700 }}>{formData.riesgo}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Resistencia RF:</span>
                            <span style={{ fontWeight: 700, color: '#f97316' }}>{results.rfRequerida}</span>
                        </div>
                    </div>

                    <div className="bg-white text-black p-4 md:p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8 mt-10 print-area" style={{ display: 'block' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <ShieldCheck size={22} color="var(--color-primary)" /> Resultados Finales del Cálculo
                        </h3>

                        <div className="overflow-x-auto w-full mb-8">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'var(--color-background)' }}>
                                    <tr>
                                        <th style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Parámetro</th>
                                        <th style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Valor Obtenido</th>
                                        <th style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Unidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Carga de Fuego (Qf)</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 700 }}>{results.cargaDeFuego.toFixed(2)}</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>kg/m² (madera equiv.)</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Poder Calorífico Total</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 700 }}>{Math.round(results.cargaTermicaTotal * 4.184).toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>kJ</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Nivel de Riesgo</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 800, color: 'var(--color-primary)' }}>{formData.riesgo}</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>-</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>Resistencia al Fuego (RF) Requerida</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 800 }}>{results.rfRequerida}</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid var(--color-border)' }}>minutos</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="card" style={{ padding: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Info size={16} /> Resumen Técnico
                            </h4>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Calor Total:</span>
                                    <span>{Math.round(results.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Madera Eq:</span>
                                    <span>{(results.maderaEquivalente || 0).toFixed(2)} Kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: '1px solid var(--color-border)' }}>
                                    <span style={{ fontWeight: 600 }}>Matafuegos Sugeridos:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{results.minMatafuegos} u. (Tipo ABC)</span>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1rem', border: '2px solid var(--color-primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)' }}>
                                <ShieldCheck size={18} /> Requerimientos de Protección
                            </h4>
                            <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Matafuegos (Mín.):</span>
                                    <span style={{ fontWeight: 800 }}>{results.minMatafuegos} unidades</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }} className="no-print">
                                    <span>Tipo Sugerido:</span>
                                    <span>ABC (Polvo)</span>
                                </div>
                                <p style={{ margin: '10px 0 0 0', fontSize: '0.7rem', fontStyle: 'italic', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                                    * Cálculo basado en 1 unidad cada 200m² con un mínimo de 2 por sector.
                                </p>
                            </div>
                        </div>

                        <button
                            className="no-print flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 w-full mt-2 shadow-sm border-0 cursor-pointer"
                            onClick={handleSave}
                        >
                            <Save size={18} /> GUARDAR DATOS
                        </button>

                        <button
                            className="no-print flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 w-full mt-2 shadow-sm border-0 cursor-pointer"
                            onClick={handlePrint}
                        >
                            <Printer size={18} /> IMPRIMIR / GENERAR PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE FIRMAS */}
            <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8 mt-10 print-area" style={{ display: 'block', clear: 'both' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <ShieldCheck size={22} color="var(--color-primary)" /> Firmas y Validación
                </h3>

                <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                    <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Profesional
                        </label>
                    </div>
                </div>

                <div className="flex flex-row justify-around items-start w-full gap-8">
                    {showSignatures.operator && (
                        <div className="flex-1 flex flex-col items-center pt-24">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                                <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words min-h-[0.8rem]">Aclaración y Firma</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="flex-1 flex flex-col items-center pt-24">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR</p>
                                <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words min-h-[0.8rem]">DNI / ACLARACIÓN</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="flex-1 flex flex-col items-center">
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '1px dashed var(--color-border)', borderRadius: '4px', minHeight: '100px', background: 'white', padding: '0.5rem', width: '100%' }}>
                                {professional.signature ? (
                                    <img src={professional.signature} alt="Firma" style={{ height: '45px', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ height: '45px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999' }}>Sin Firma</div>
                                )}
                            </div>
                            <div className="print:block hidden w-full border-t-2 border-slate-400 border-dashed mt-8 mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>{professional.name}</p>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Matrícula: {professional.license}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
