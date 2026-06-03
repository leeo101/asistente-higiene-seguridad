import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Camera, CheckCircle2, Save, X, Flame, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

const NFPA10_CHECKLIST = [
    { id: 'c1', text: 'Ubicación correcta y asignada' },
    { id: 'c2', text: 'Visibilidad y acceso sin obstrucciones' },
    { id: 'c3', text: 'Manómetro en zona verde (presión operable)' },
    { id: 'c4', text: 'Manguera y boquilla libres de obstrucciones / cortes' },
    { id: 'c5', text: 'Precinto de seguridad y pasador intactos' },
    { id: 'c6', text: 'Cartelería y señalización reglamentaria en buen estado' },
    { id: 'c7', text: 'Estado físico general (sin abolladuras ni corrosión)' }
];

export default function ExtinguisherInspection() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const [extintor, setExtintor] = useState(null);
    const [checklist, setChecklist] = useState(
        NFPA10_CHECKLIST.map(item => ({ ...item, status: null, notes: '', photos: [] }))
    );
    const [inspectorName, setInspectorName] = useState('');
    const [generalPhotos, setGeneralPhotos] = useState([]);
    const [generalObservations, setGeneralObservations] = useState('');
    const [manualResult, setManualResult] = useState<'APROBADO' | 'RECHAZADO' | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Cargar inventario y buscar el extintor
        // Se compara tanto como string como número para compatibilidad con IDs viejos y nuevos
        const tryLoad = (storageKey: string) => {
            const dataRaw = localStorage.getItem(storageKey);
            if (!dataRaw) return null;
            try {
                const inventory = JSON.parse(dataRaw);
                return inventory.find((e: any) => String(e.id) === String(id)) || null;
            } catch { return null; }
        };

        // Primero busca en la BD unificada, luego en la vieja por si no migró
        const found = tryLoad('extinguishers_inventory') || tryLoad('extintores_inventory');

        if (found) {
            setExtintor(found);
            
            // Cargar checklist de la inspección anterior si existe
            const historyRaw = localStorage.getItem('extintores_history');
            if (historyRaw) {
                try {
                    const history = JSON.parse(historyRaw);
                    const extHistory = history.filter((h: any) => String(h.extintorId) === String(id) || String(h.extintorNum) === String(found.numero || found.chapa));
                    if (extHistory.length > 0) {
                        extHistory.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                        const lastInsp = extHistory[0];
                        if (lastInsp.items && Array.isArray(lastInsp.items) && lastInsp.items.length > 0) {
                            setChecklist(lastInsp.items);
                        }
                        if (lastInsp.observaciones) {
                            setGeneralObservations(lastInsp.observaciones);
                        }
                        // Opcionalmente podemos cargar las fotos generales también, pero suele ser mejor que sean nuevas en cada inspección
                    }
                } catch (e) {}
            }
        } else {
            toast.error('Extintor no encontrado. Puede que no esté sincronizado.');
            navigate('/extintores');
        }
        
        // Cargar nombre del inspector
        const pData = localStorage.getItem('personalData');
        if (pData) {
            try { setInspectorName(JSON.parse(pData).name || ''); } catch {}
        }
    }, [id, navigate]);

    const handleStatus = (index, status) => {
        const newChecklist = [...checklist];
        newChecklist[index].status = status;
        setChecklist(newChecklist);
    };

    const handleNotes = (index, text) => {
        const newChecklist = [...checklist];
        newChecklist[index].notes = text;
        setChecklist(newChecklist);
    };

    const handleItemTextChange = (index, text) => {
        const newChecklist = [...checklist];
        newChecklist[index].text = text;
        setChecklist(newChecklist);
    };

    const handleAddItem = () => {
        setChecklist([...checklist, { id: 'c' + Date.now(), text: '', status: null, notes: '', photos: [] }]);
    };

    const handleRemoveItem = (index) => {
        const newChecklist = [...checklist];
        newChecklist.splice(index, 1);
        setChecklist(newChecklist);
    };

    const handlePhoto = (index, files) => {
        if (!files.length) return;
        const newChecklist = [...checklist];
        const reader = new FileReader();
        reader.onloadend = () => {
            newChecklist[index].photos.push(reader.result);
            setChecklist(newChecklist);
        };
        reader.readAsDataURL(files[0]);
    };

    const removePhoto = (itemIndex, photoIndex) => {
        const newChecklist = [...checklist];
        newChecklist[itemIndex].photos.splice(photoIndex, 1);
        setChecklist(newChecklist);
    };

    const handleGeneralPhoto = (files) => {
        if (!files.length) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setGeneralPhotos([...generalPhotos, reader.result]);
        };
        reader.readAsDataURL(files[0]);
    };

    const removeGeneralPhoto = (index) => {
        const newPhotos = [...generalPhotos];
        newPhotos.splice(index, 1);
        setGeneralPhotos(newPhotos);
    };

    const setAllOk = () => {
        setChecklist(checklist.map(c => ({ ...c, status: 'C' })));
    };

    const handleSave = async () => {
        if (checklist.some(c => !c.status)) {
            toast.error('Por favor, completa todos los puntos del checklist.');
            return;
        }
        if (!manualResult) {
            toast.error('Por favor, seleccione si la inspección está Aprobada o Rechazada.');
            return;
        }

        setIsSaving(true);
        const report = {
            id: Date.now().toString(),
            extintorId: extintor.id,
            extintorNum: extintor.numero || extintor.chapa || '',
            fecha: new Date().toISOString(),
            inspector: inspectorName,
            items: checklist,
            fotos: generalPhotos,
            observaciones: generalObservations,
            resultado: manualResult
        };

        const historyRaw = localStorage.getItem('extintores_history');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const newHistory = [report, ...history];

        localStorage.setItem('extintores_history', JSON.stringify(newHistory));
        await syncCollection('extintores_history', newHistory);

        // Update inventory date and add inspection for PDF
        const pdfInspection = {
            fechaVisita: report.fecha.split('T')[0],
            resultado: report.resultado === 'APROBADO' ? 'C' : 'NC',
            controles: {
                acceso: checklist[1]?.status || 'C',
                manometro: checklist[2]?.status || 'C',
                manguera: checklist[3]?.status || 'C',
                cilindro: checklist[6]?.status || 'C',
                senalizacion: checklist[5]?.status || 'C'
            },
            observacion: report.observaciones,
            fotos: report.fotos
        };

        const inventoryRaw = localStorage.getItem('extinguishers_inventory');
        const inventory = inventoryRaw ? JSON.parse(inventoryRaw) : [];
        const updatedInv = inventory.map((e: any) => {
            if (e.id === extintor.id) {
                const insps = e.inspections || [];
                return { 
                    ...e, 
                    ultimaInspeccion: report.resultado === 'APROBADO' ? report.fecha : e.ultimaInspeccion,
                    inspections: [...insps, pdfInspection]
                };
            }
            return e;
        });
        localStorage.setItem('extinguishers_inventory', JSON.stringify(updatedInv));
        await syncCollection('extinguishers_inventory', updatedInv);

        setIsSaving(false);
        toast.success(`Inspección guardada: ${report.resultado}`);
        navigate('/extintores');
    };

    if (!extintor) return <div className="p-8 text-center text-slate-500">Cargando datos del equipo...</div>;

    return (
        <div className="container" style={{ maxWidth: '600px', paddingBottom: '6rem' }}>
            {/* Mobile-optimized Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/extintores')} style={{ padding: '0.6rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                        <Flame size={20} color="#ef4444" /> {extintor.numero}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        {extintor.tipo} - {extintor.ubicacion} {extintor.marca ? `(${extintor.marca})` : ''}
                    </p>
                    {extintor.numeroSerie && (
                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                            S/N: {extintor.numeroSerie}
                        </p>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '2px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-primary)' }}>Inspección NFPA 10</h3>
                    <button onClick={setAllOk} style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 800, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        MARCAR TODO OK
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {checklist.map((item, idx) => (
                        <div key={item.id} style={{ padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.4rem' }}>{idx + 1}.</span>
                                <textarea
                                    value={item.text}
                                    onChange={e => handleItemTextChange(idx, e.target.value)}
                                    placeholder="Detalle a inspeccionar..."
                                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid transparent', borderRadius: '8px', background: 'transparent', outline: 'none', resize: 'none', minHeight: '40px', lineHeight: 1.4 }}
                                    className="hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                                />
                                <button onClick={() => handleRemoveItem(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '0.4rem', cursor: 'pointer', borderRadius: '8px' }} className="hover:bg-red-50">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="ats-status-group" style={{ marginBottom: '0.8rem' }}>
                                <button className={`ats-status-btn ${item.status === 'C' ? 'active-ok' : ''}`} onClick={() => handleStatus(idx, 'C')}>C</button>
                                <button className={`ats-status-btn ${item.status === 'NC' ? 'active-fail' : ''}`} onClick={() => handleStatus(idx, 'NC')}>NC</button>
                                <button className={`ats-status-btn ${item.status === 'NA' ? 'active-na' : ''}`} onClick={() => handleStatus(idx, 'NA')}>N/A</button>
                                
                                <label style={{ padding: '0 0.8rem', background: 'rgba(37,99,235,0.05)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginLeft: 'auto' }} title="Agregar Foto">
                                    <Camera size={18} />
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(idx, e.target.files)} />
                                </label>
                            </div>

                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Observaciones / Detalles..." 
                                        value={item.notes} 
                                        onChange={e => handleNotes(idx, e.target.value)} 
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', outline: 'none' }} 
                                    />
                                </div>
                            </div>
                            
                            {item.photos.length > 0 && (
                                <div className="animate-fade-in" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {item.photos.map((p, pIdx) => (
                                        <div key={pIdx} style={{ position: 'relative', width: '45px', height: '45px', borderRadius: '6px', overflow: 'hidden' }}>
                                            <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Evidencia" />
                                            <button onClick={() => removePhoto(idx, pIdx)} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <button onClick={handleAddItem} style={{ padding: '0.8rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px dashed rgba(37,99,235,0.3)', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> AGREGAR PREGUNTA AL CHECKLIST
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '2px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase' }}>Evidencia General</label>
                    <label style={{ padding: '0.5rem 1rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Camera size={16} /> Agregar Foto
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleGeneralPhoto(e.target.files)} />
                    </label>
                </div>
                {generalPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {generalPhotos.map((p, pIdx) => (
                            <div key={pIdx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--color-border)' }}>
                                <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Evidencia" />
                                <button onClick={() => removeGeneralPhoto(pIdx)} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', width: '22px', height: '22px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '2px solid var(--color-border)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Observaciones Generales</label>
                <textarea 
                    value={generalObservations}
                    onChange={e => setGeneralObservations(e.target.value)}
                    placeholder="Agregue comentarios adicionales sobre la inspección..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--color-border)', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
            </div>

            <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'var(--color-surface)', border: '2px solid var(--color-border)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                    Resultado de Inspección <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => setManualResult('APROBADO')}
                        style={{ 
                            flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                            background: manualResult === 'APROBADO' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                            color: manualResult === 'APROBADO' ? '#ffffff' : '#10b981',
                            border: manualResult === 'APROBADO' ? 'none' : '1px solid rgba(16, 185, 129, 0.3)',
                            boxShadow: manualResult === 'APROBADO' ? '0 8px 20px rgba(16, 185, 129, 0.3)' : 'none'
                        }}
                    >
                        APROBADO
                    </button>
                    <button 
                        onClick={() => setManualResult('RECHAZADO')}
                        style={{ 
                            flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                            background: manualResult === 'RECHAZADO' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                            color: manualResult === 'RECHAZADO' ? '#ffffff' : '#ef4444',
                            border: manualResult === 'RECHAZADO' ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                            boxShadow: manualResult === 'RECHAZADO' ? '0 8px 20px rgba(239, 68, 68, 0.3)' : 'none'
                        }}
                    >
                        RECHAZADO
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '1.2rem', background: 'var(--color-surface)', border: '2px solid var(--color-border)', marginBottom: '4rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Firma del Inspector</label>
                <input 
                    type="text" 
                    placeholder="Nombre completo" 
                    value={inspectorName} 
                    onChange={e => setInspectorName(e.target.value)} 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 700 }} 
                />
            </div>

            {/* Mobile Floating Save Button */}
            <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem', zIndex: 10 }}>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 25px rgba(37,99,235,0.4)' }}
                >
                    <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'FINALIZAR INSPECCIÓN'}
                </button>
            </div>
        </div>
    );
}
