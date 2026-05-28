import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ArrowLeft, Save, Plus, Trash2, Flame, Calculator,
    FileText, Printer, Building2, Layout, Maximize2,
    Info, TriangleAlert, ShieldCheck, History, Share2, Sparkles, Loader2, Calendar, QrCode
} from 'lucide-react';
import { fireMaterials, riskActivityGroups } from '../data/fireMaterials';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import PremiumHeader from '../components/PremiumHeader';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { getCountryNormativa } from '../data/legislationData';
import { DataTable } from '../components/DataTable';
import QRModal from '../components/QRModal';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: '1rem', display: 'inline-block', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text)' }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
                    Esta acción no se puede deshacer y el registro se eliminará de todo el historial.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--glass-border-subtle)', cursor: 'pointer', fontWeight: 800, color: 'var(--color-text)', transition: 'all 0.2s' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'all 0.2s' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function FireLoad(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const { syncPulse } = useSync();

    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar Carga de Fuego' : 'Cálculo Carga de Fuego');

    const [showForm, setShowForm] = useState(!!editData);
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');

    useEffect(() => {
        const historyRaw = localStorage.getItem('fireload_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter((item: any) => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('fireload_history', JSON.stringify(updated));
        syncCollection('fireload_history', updated);
        setDeleteTarget(null);
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [formData, setFormData] = useState({
        empresa: '',
        sector: '',
        actividadResumen: '',
        descripcionActividad: '',
        superficie: 0,
        actividadGrupo: 'industrial',
        riesgo: 'R4', // Predeterminado para industrial
        conclusion: '',
        materiales: [
            { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400, totalKcal: 0 }
        ],
        id: ''
    });


    // CRITICAL: Define professional state which was causing 'not defined' crash
    const [professional, setProfessional] = useState<{
        name: string;
        license: string;
        signature: string | null;
        stamp?: string | null;
    }>({
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
            userCountry = parsed.country?.toLowerCase() || 'argentina';
        }
    } catch (error) {
        console.error('[FireLoad] Error parsing personalData:', error);
    }
    const savedData = localStorage.getItem('personalData');
    const countryNorms = getCountryNormativa(userCountry);


    useEffect(() => {
        try {
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
                signature: signature,
                stamp: null as string | null
            };

            const savedStampData = localStorage.getItem('signatureStampData');
            if (savedStampData) {
                const parsed = JSON.parse(savedStampData);
                profData.stamp = parsed.stamp || null;
            }


            if (savedData) {
                const data = JSON.parse(savedData);
                profData.name = data.name || 'Profesional';
                profData.license = data.license || '';
            }

            setProfessional(profData);
        } catch (error) {
            console.error('Error loading professional data:', error);
        }
    }, [savedData]);

    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData);
            if (location.state.editData.showSignatures) {
                setShowSignatures(location.state.editData.showSignatures);
            }
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

    const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

    const handleGenerateConclusion = async () => {
        setIsGeneratingConclusion(true);
        const loadingToast = toast.loading('Redactando conclusión técnica de incendio...');
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                },
                body: JSON.stringify({
                    reportType: `Cálculo de Carga de Fuego (${countryNorms.fire})`,
                    reportData: {
                        empresa: formData.empresa,
                        sector: formData.sector,
                        superficie: formData.superficie,
                        riesgo: formData.riesgo,
                        cargaDeFuego: results.cargaDeFuego,
                        rfRequerida: results.rfRequerida,
                        maderaEquivalente: results.maderaEquivalente,
                        matafuegos: results.minMatafuegos
                    }
                })
            });
            if (!res.ok) throw new Error('Error al conectar con la IA');
            const data = await res.json();
            setFormData(prev => ({ ...prev, conclusion: data.conclusion }));
            toast.success('Conclusión generada con éxito ✨', { id: loadingToast });
        } catch (error) {
            toast.error(`Error al generar: ${error.message}`, { id: loadingToast });
        } finally {
            setIsGeneratingConclusion(false);
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
            const val = value === '' ? 0 : parseFloat(value) || 0;
            newMaterials[index][field] = val;
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
        requirePro(() => window.print());
    };

    const handleSave = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        try {
            const historyRaw = localStorage.getItem('fireload_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            let newHistory;
            if (formData.id) {
                newHistory = history.map(item => item.id === formData.id ? { ...formData, showSignatures, results, updatedAt: new Date().toISOString() } : item);
            } else {
                const newEntry = {
                    ...formData,
                    showSignatures,
                    results,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString()
                };
                newHistory = [newEntry, ...history];
            }

            localStorage.setItem('fireload_history', JSON.stringify(newHistory));
            await syncCollection('fireload_history', newHistory);
            toast.success('Carga de Fuego guardada con éxito');
            setHistory(newHistory);
            setShowForm(false);
        } catch (error) {
            toast.error('Error al guardar: ' + error.message);
        }
    };

    const getThreatColors = () => {
        const rf = results.rfRequerida || 'F0';
        if (rf === 'F0') return { bg: 'rgba(34, 197, 94, 0.08)', border: '#22c55e', text: '#22c55e', label: 'Bajo' };
        if (rf === 'F30' || rf === 'F60') return { bg: 'rgba(234, 179, 8, 0.08)', border: '#eab308', text: '#eab308', label: 'Moderado' };
        if (rf === 'F90' || rf === 'F120') return { bg: 'rgba(249, 115, 22, 0.08)', border: '#f97316', text: '#f97316', label: 'Alto' };
        return { bg: 'rgba(239, 68, 68, 0.08)', border: '#ef4444', text: '#ef4444', label: 'Crítico' };
    };
    const threat = getThreatColors();

    const filteredHistory = history.filter((e: any) => {
        const matchesSearch = (e.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa === '' || e.empresa === filterEmpresa;
        return matchesSearch && matchesEmpresa;
    });

    const columns = [
        {
            header: 'Fecha',
            accessor: 'createdAt',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Calendar size={15} /> {new Date(item.createdAt).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(249,115,22,0.1)', padding: '0.5rem', borderRadius: '10px', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={18} />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{item.empresa || 'Sin nombre'}</span>
                </div>
            )
        },
        {
            header: 'Sector',
            accessor: 'sector',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    <Building2 size={16} /> {item.sector}
                </span>
            )
        },
        {
            header: 'Carga Qf',
            accessor: 'results',
            render: (item: any) => (
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316', lineHeight: 1.1 }}>{item.results?.cargaDeFuego?.toFixed(2)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                        Kg/m² — <span style={{ color: '#ef4444' }}>{item.results?.rfRequerida}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button 
                        onClick={() => {
                            setFormData(item);
                            if (item.showSignatures) setShowSignatures(item.showSignatures);
                            setShowForm(true);
                        }} 
                        style={{ padding: '0.45rem 0.85rem', background: 'var(--color-surface)', border: '1px solid var(--glass-border-subtle)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                    >
                        <FileText size={16} /> Ver
                    </button>
                    <button 
                        onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`; setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` }); })} 
                        style={{ padding: '0.45rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                        title="QR"
                    >
                        <QrCode size={16} />
                    </button>
                    <button 
                        onClick={() => requirePro(() => setShareItem(item))} 
                        style={{ padding: '0.45rem', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: '10px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                        title="Compartir"
                    >
                        <Share2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id); }} 
                        style={{ padding: '0.45rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="container" style={{ maxWidth: '1000px', paddingBottom: '8rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
            <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Carga de Fuego - ${(shareItem as any)?.sector || ''}`} text={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${(shareItem as any).empresa}\n📍 Sector: ${(shareItem as any).sector}\n🔥 Carga Qf: ${(shareItem as any).results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF: ${(shareItem as any).results?.rfRequerida}` : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={`Carga_Fuego_${(shareItem as any)?.sector || 'Estudio'}.pdf`} />
            <div className="ats-pdf-offscreen">
                <FireLoadPdfGenerator data={shareItem} />
            </div>

            <div className="no-print">
                <PremiumHeader
                    title="Carga de Fuego"
                    subtitle={`Cálculo según ${countryNorms.fire}`}
                    icon={<Flame size={36} />}
                />
            </div>

            {!showForm ? (
                <>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                <Flame size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por empresa o sector..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem',
                                    borderRadius: '12px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)', color: 'var(--color-text)',
                                    fontWeight: 500, outline: 'none', transition: 'all 0.2s'
                                }}
                            />
                        </div>
                        <select
                            value={filterEmpresa}
                            onChange={(e) => setFilterEmpresa(e.target.value)}
                            style={{
                                padding: '0.8rem 1rem', borderRadius: '12px',
                                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                color: 'var(--color-text)', fontWeight: 600, outline: 'none', cursor: 'pointer',
                                minWidth: '200px'
                            }}
                        >
                            <option value="">Todas las empresas</option>
                            {Array.from(new Set(history.map((h: any) => h.empresa).filter(Boolean))).map((empresa: string) => (
                                <option key={empresa} value={empresa}>{empresa}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setFormData({
                                    empresa: '',
                                    sector: '',
                                    actividadResumen: '',
                                    descripcionActividad: '',
                                    superficie: 0,
                                    actividadGrupo: 'industrial',
                                    riesgo: 'R4',
                                    conclusion: '',
                                    materiales: [
                                        { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400, totalKcal: 0 }
                                    ],
                                    id: ''
                                });
                                setShowForm(true);
                            }}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                        >
                            <Plus size={18} /> Nuevo Cálculo
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                        <DataTable
                            data={filteredHistory}
                            columns={columns}
                            searchPlaceholder="Buscar..."
                            searchFields={['empresa', 'sector']}
                            emptyMessage="No se encontraron estudios de carga de fuego."
                            emptyIcon={<Flame size={48} />}
                            onEmptyAction={() => setShowForm(true)}
                            emptyActionLabel="Generar primer Cálculo"
                        />
                    </div>
                </>
            ) : (
                <>
            <div>
            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Carga de Fuego – ${formData.empresa}`}
                text={`🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n🔥 Carga Qf: ${results.cargaDeFuego.toFixed(2)} Kg/m²\n🛡️ RF Requerida: ${results.rfRequerida}\n\nGenerado con Asistente HYS`}
                elementIdToPrint="pdf-content"
                rawMessage={``}
                fileName={`Carga_de_Fuego_${formData.empresa || 'Reporte'}.pdf`}
            />


            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', fontWeight: 800 }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', fontWeight: 800 }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={handlePrint}
                    className="btn-floating-action"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#ffffff', fontWeight: 800 }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <div id="pdf-content" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', color: '#000000' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2 }}>
                            {editData ? 'Editar Carga de Fuego' : 'Cálculo Carga de Fuego'}
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{countryNorms.fire}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <CompanyLogo style={{ height: '45px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ESTABLECIMIENTO:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.empresa || '-'}</span></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SECTOR:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.sector || '-'}</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVIDAD:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.actividadResumen || '-'}</span></div>
                         <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SUPERFICIE:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.superficie} m²</span></div>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{editData ? 'Editar Carga de Fuego' : 'Estudio de Carga de Fuego'}</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cálculo según {countryNorms.fire}</p>
                    </div>
                </div>

                <div className="main-layout flex flex-col lg:flex-row gap-6 no-print" style={{ alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, width: '100%' }}>
                        <div className="glass-card" style={{ padding: '2rem', borderTop: '3px solid #f97316', borderRadius: 'var(--radius-2xl)', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                <Building2 size={20} color="#f97316" style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))' }} /> Datos del Sector de Incendio
                            </h3>
                            <div className="grid-res-2" style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Empresa / Establecimiento</label>
                                    <div style={{ position: 'relative' }} className="no-print">
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <Building2 size={16} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={formData.empresa} 
                                            onChange={e => setFormData({ ...formData, empresa: e.target.value })} 
                                            placeholder="Ej: Planta Industrial Sur" 
                                            className="fireload-focus-glow"
                                            style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                        />
                                    </div>
                                    <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.empresa || '-'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Sector / Depósito</label>
                                    <div style={{ position: 'relative' }} className="no-print">
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <Layout size={16} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={formData.sector} 
                                            onChange={e => setFormData({ ...formData, sector: e.target.value })} 
                                            placeholder="Ej: Salón de Ventas" 
                                            className="fireload-focus-glow"
                                            style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                        />
                                    </div>
                                    <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.sector || '-'}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Actividad (Resumen para Encabezado)</label>
                                <div style={{ position: 'relative' }} className="no-print">
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <FileText size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.actividadResumen}
                                        onChange={e => setFormData({ ...formData, actividadResumen: e.target.value })}
                                        placeholder="Ej: Planta Industrial, Depósito de Telas..."
                                        className="fireload-focus-glow"
                                        style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                    />
                                </div>
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.actividadResumen || '-'}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Descripción de Actividad</label>
                                <textarea
                                    className="no-print fireload-focus-glow"
                                    value={formData.descripcionActividad}
                                    onChange={e => setFormData({ ...formData, descripcionActividad: e.target.value })}
                                    onInput={e => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                    }}
                                    placeholder="Detalle los procesos y actividades que se realizan en el sector..."
                                    style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 0.7rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '80px', overflow: 'hidden', fontFamily: 'inherit', transition: 'all 0.2s' }}
                                />
                                <div className="print-text-box" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.descripcionActividad || 'Sin descripción detallada.'}</div>
                            </div>

                            <div className="grid-res-2" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Superficie del Sector (m²)</label>
                                    <div style={{ position: 'relative' }} className="no-print">
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <Maximize2 size={16} />
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.superficie === 0 ? '' : formData.superficie}
                                            onChange={e => setFormData({ ...formData, superficie: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className="fireload-focus-glow"
                                            style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                        />
                                    </div>
                                    <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.superficie} m²</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Grupo de Actividad</label>
                                    <div style={{ position: 'relative' }} className="no-print">
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <Flame size={16} />
                                        </div>
                                        <input
                                            list="activityList"
                                            value={formData.actividadGrupo}
                                            onChange={e => setFormData({ ...formData, actividadGrupo: e.target.value })}
                                            placeholder="Ej: Industrial, Comercial..."
                                            className="fireload-focus-glow"
                                            style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                        />
                                        <datalist id="activityList">
                                            {(riskActivityGroups || []).map(g => <option key={g.id} value={g.label} />)}
                                        </datalist>
                                    </div>
                                    <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formData.actividadGrupo}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Nivel de Riesgo ({countryNorms.fire.split(' ')[0]})</label>
                                <div style={{ position: 'relative' }} className="no-print">
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <ShieldCheck size={16} />
                                    </div>
                                    <select
                                        value={formData.riesgo}
                                        onChange={e => setFormData({ ...formData, riesgo: e.target.value })}
                                        className="fireload-focus-glow"
                                        style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', transition: 'all 0.2s', appearance: 'none', WebkitAppearance: 'none' }}
                                    >
                                        <option value="R1">Riesgo 1 (Explosivo)</option>
                                        <option value="R2">Riesgo 2 (Inflamable)</option>
                                        <option value="R3">Riesgo 3 (Muy Combustible)</option>
                                        <option value="R4">Riesgo 4 (Combustible)</option>
                                        <option value="R5">Riesgo 5 (Poco Combustible)</option>
                                        <option value="R6">Riesgo 6 (Incombustible)</option>
                                        <option value="R7">Riesgo 7 (Refractario)</option>
                                    </select>
                                </div>
                                <div className="print-only" style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{formData.riesgo}</div>
                                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }} className="no-print">
                                    El riesgo afecta directamente el cálculo de la Resistencia al Fuego (RF) necesaria.
                                </p>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', borderTop: '3px solid #ea580c', borderRadius: 'var(--radius-2xl)', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                <Flame size={20} color="#ea580c" style={{ filter: 'drop-shadow(0 0 8px rgba(234, 88, 12, 0.3))' }} /> Inventario de Materiales Combustibles
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {/* VISTA EN PANTALLA (Formulario Interactivo) */}
                                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {(formData.materiales || []).map((m, idx) => (
                                        <div key={idx} className="fireload-material-row" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1.2fr auto', gap: '0.8rem', alignItems: 'end' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Material #{idx + 1}</label>
                                                <input
                                                    list="materialList"
                                                    value={m.nombre}
                                                    onChange={e => handleMaterialChange(idx, 'nombre', e.target.value)}
                                                    placeholder="Ej: Madera, Plásticos, Papel..."
                                                    className="fireload-focus-glow"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                                />
                                                <datalist id="materialList">
                                                    {(fireMaterials || []).map((fm, i) => <option key={i} value={fm.nombre} />)}
                                                </datalist>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.2rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Peso (Kg)</label>
                                                <input
                                                    type="number"
                                                    value={m.peso === 0 ? '' : m.peso}
                                                    onChange={e => handleMaterialChange(idx, 'peso', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="0"
                                                    className="fireload-focus-glow"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.2rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Calor (Mcal/Kg)</label>
                                                <input
                                                    type="number"
                                                    value={m.poderCalorifico === 0 ? '' : m.poderCalorifico}
                                                    onChange={e => handleMaterialChange(idx, 'poderCalorifico', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="0"
                                                    className="fireload-focus-glow"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', transition: 'all 0.2s' }}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeMaterial(idx)} 
                                                style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', alignSelf: 'end', height: '38px', minWidth: '38px' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'none'; }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                     <button 
                                         onClick={addMaterial} 
                                         style={{ borderStyle: 'dashed', padding: '1rem', width: '100%', background: 'rgba(249, 115, 22, 0.03)', border: '2px dashed var(--glass-border)', color: '#f97316', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                         onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'; e.currentTarget.style.borderColor = '#f97316'; }}
                                         onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                     >
                                         <Plus size={18} /> Agregar Material Combustible
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: isMobile ? '100%' : '350px' }} className="results-grid no-print">
                        <div className="glass-card" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#ffffff', textAlign: 'center', padding: '2rem', borderRadius: 'var(--radius-2xl)', border: 'none', boxShadow: '0 8px 30px rgba(249, 115, 22, 0.35)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent)', pointerEvents: 'none' }} />
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                <Flame size={14} /> Carga de Fuego Qf
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.2)', lineHeight: 1 }}>{(results.cargaDeFuego || 0).toFixed(2)}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.95, marginTop: '0.5rem' }}>Kg de Madera / m²</div>
                        </div>

                        <div className="glass-card" style={{ borderLeft: `5px solid ${threat.border}`, padding: '1.25rem', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-surface)', borderTop: '1px solid var(--glass-border-subtle)', borderRight: '1px solid var(--glass-border-subtle)', borderBottom: '1px solid var(--glass-border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Riesgo Dominante:</span>
                                <span style={{ fontWeight: 900, background: 'var(--color-background)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border-subtle)', fontSize: '0.85rem', color: 'var(--color-text)' }}>{formData.riesgo}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resistencia RF Requerida:</span>
                                <span style={{ fontWeight: 900, color: threat.text, fontSize: '1.15rem' }}>{results.rfRequerida}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>Nivel de Amenaza:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: threat.text, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: threat.border, display: 'inline-block' }}></span>
                                    {threat.label}
                                </span>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)', background: 'var(--color-surface)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ea580c' }}>
                                <ShieldCheck size={18} /> Resultados del Cálculo
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Carga Térmica Total</span>
                                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{Math.round(results.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Madera Equivalente</span>
                                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{(results.maderaEquivalente || 0).toFixed(2)} Kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Superficie Sector</span>
                                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{formData.superficie} m²</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Riesgo Dominante</span>
                                    <span style={{ fontWeight: 800, color: '#f97316' }}>{formData.riesgo}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>RF Mínima Requerida</span>
                                    <span style={{ fontWeight: 800, color: threat.text }}>{results.rfRequerida}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', background: 'rgba(249, 115, 22, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.15)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.8rem' }}>Extintores ABC Sugeridos</span>
                                    <span style={{ fontWeight: 900, color: '#f97316', fontSize: '0.85rem' }}>{results.minMatafuegos} u.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INVENTARIO PARA IMPRESIÓN */}
                <div className="print-area print-only" style={{ display: 'block', padding: '2rem', marginTop: '1.5rem', border: '1px solid #000' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#000000', fontSize: '1.2rem', fontWeight: 900 }}>
                        <Flame size={20} color="#000000" /> Inventario de Materiales Combustibles
                    </h3>

                    <div className="overflow-x-auto w-full">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #000' }}>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800, width: '40%' }}>Material</th>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800, width: '20%' }}>Peso (Kg)</th>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800, width: '20%' }}>Poder Calorífico</th>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800, width: '20%' }}>Total Calorías</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.materiales || []).map((m, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>{m.nombre || 'Sin nombre'}</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>{m.peso} Kg</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>{m.poderCalorifico} Mcal/Kg</td>
                                        <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 700 }}>{Math.round(m.totalKcal || 0).toLocaleString()} Kcal</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TABLA DE RESULTADOS PARA IMPRESIÓN */}
                <div className="print-area print-only" style={{ display: 'block', padding: '2rem', marginTop: '2.5rem', border: '1px solid #000' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#000000', fontSize: '1.2rem', fontWeight: 900 }}>
                        Resultados Finales del Cálculo
                    </h3>

                    <div className="overflow-x-auto w-full mb-8">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #000' }}>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>Parámetro</th>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>Valor Obtenido</th>
                                    <th style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>Carga de Fuego (Qf)</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 700 }}>{results.cargaDeFuego.toFixed(2)}</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>kg/m² (madera equiv.)</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>Poder Calorífico Total</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 700 }}>{Math.round(results.cargaTermicaTotal * 4.184).toLocaleString()}</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>kJ</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>Nivel de Riesgo</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>{formData.riesgo}</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>-</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>Resistencia al Fuego (RF) Requerida</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>{results.rfRequerida}</td>
                                    <td style={{ padding: '0.8rem', border: '1px solid #cbd5e1' }}>minutos</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.9rem' }}>Resumen Técnico</h4>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Calor Total:</span>
                                    <span style={{ fontWeight: 700 }}>{Math.round(results.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Madera Eq:</span>
                                    <span style={{ fontWeight: 700 }}>{(results.maderaEquivalente || 0).toFixed(2)} Kg</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.9rem' }}>Protección Requerida</h4>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Matafuegos (Mín.):</span>
                                    <span style={{ fontWeight: 800 }}>{results.minMatafuegos} unidades</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Tipo Sugerido:</span>
                                    <span style={{ fontWeight: 700 }}>ABC (Polvo)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE CONCLUSIÓN */}
                <div className="glass-card print-area" style={{ padding: '2rem', marginTop: '2.5rem', borderTop: '3px solid #a855f7', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-text)', fontSize: '1.15rem', fontWeight: 900 }}>
                            <FileText size={22} color="#a855f7" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))' }} /> Conclusión Profesional
                        </h3>
                        <button
                            className="no-print"
                            onClick={handleGenerateConclusion}
                            disabled={isGeneratingConclusion}
                            style={{ 
                                padding: '0.65rem 1.25rem', 
                                background: 'linear-gradient(135deg, #a855f7, #ec4899)', 
                                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '12px', 
                                fontWeight: 800, 
                                fontSize: '0.75rem', 
                                cursor: isGeneratingConclusion ? 'wait' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                transition: 'all 0.2s', 
                                outline: 'none' 
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.35)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.25)'; }}
                        >
                            {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGeneratingConclusion ? 'REDACTANDO CONCLUSIÓN IA...' : 'REDACTAR CON IA'}
                        </button>
                    </div>

                    <textarea
                        value={formData.conclusion || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, conclusion: e.target.value }))}
                        className="form-input no-print fireload-focus-glow"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text)',
                            minHeight: '120px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s'
                        }}
                        placeholder="Escriba la conclusión del estudio o use el botón de IA para generarla..."
                    />

                    {formData.conclusion && (
                        <div className="print-only text-slate-800 text-[0.85rem] whitespace-pre-wrap leading-relaxed" style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', marginTop: '1rem', background: '#f8fafc' }}>
                            {formData.conclusion}
                        </div>
                    )}
                </div>

                {/* SECCIÓN DE FIRMAS */}
                <div className="glass-card print-area" style={{ padding: '2rem', marginTop: '2.5rem', borderTop: '3px solid #22c55e', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-text)', fontSize: '1.15rem', fontWeight: 900 }}>
                        <ShieldCheck size={22} color="#22c55e" style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))' }} /> Firmas y Validación
                    </h3>

                    <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                        <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSignatures(s => ({ ...s, operator: !s.operator }))}
                                className={`fireload-signature-pill ${showSignatures.operator ? 'fireload-signature-pill-active' : ''}`}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: showSignatures.operator ? '#f97316' : '#94a3b8', display: 'inline-block' }}></span>
                                Operador
                            </button>
                            <button
                                onClick={() => setShowSignatures(s => ({ ...s, supervisor: !s.supervisor }))}
                                className={`fireload-signature-pill ${showSignatures.supervisor ? 'fireload-signature-pill-active' : ''}`}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: showSignatures.supervisor ? '#f97316' : '#94a3b8', display: 'inline-block' }}></span>
                                Supervisor
                            </button>
                            <button
                                onClick={() => setShowSignatures(s => ({ ...s, professional: !s.professional }))}
                                className={`fireload-signature-pill ${showSignatures.professional ? 'fireload-signature-pill-active' : ''}`}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: showSignatures.professional ? '#f97316' : '#94a3b8', display: 'inline-block' }}></span>
                                Profesional
                            </button>
                        </div>
                    </div>

                    <PdfSignatures
                        data={{
                            ...formData,
                            professionalSignature: professional?.signature,
                            professionalStamp: professional?.stamp,
                            professionalName: professional?.name,
                            professionalLicense: professional?.license
                        }}
                        box1={showSignatures.operator ? {
                            title: 'OPERADOR / DEPOSITARIO',
                            subtitle: 'Aclaración y Firma',
                            signatureUrl: null,
                            isProfessional: false
                        } : null}
                        box3={showSignatures.supervisor ? {
                            title: 'SUPERVISOR',
                            subtitle: 'DNI / ACLARACIÓN',
                            signatureUrl: null,
                            isProfessional: false
                        } : null}
                        box2={showSignatures.professional ? undefined : null}
                    />
                    <PdfBrandingFooter />
                </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
