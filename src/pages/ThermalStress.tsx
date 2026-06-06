import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    Calculator, Info, RefreshCw, Printer, Search, Settings2, CheckCircle2, TriangleAlert, Share2, Save, ArrowLeft, ThermometerSun, Pencil, MapPin, Trash2, QrCode, Plus
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { DataTable } from '../components/DataTable';
import QRModal from '../components/QRModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
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

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [isFormVisible, setIsFormVisible] = useState(!!editData);

    const [history, setHistory] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);
    const { syncing } = useSync();

    useEffect(() => {
        const loadHistory = () => {
            const h = JSON.parse(localStorage.getItem('thermal_history') || '[]');
            setHistory(h.sort((a: any, b: any) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)));
        };
        loadHistory();
        window.addEventListener('storage', loadHistory);
        return () => window.removeEventListener('storage', loadHistory);
    }, [syncing]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('thermal_history', JSON.stringify(updated));
        syncCollection('thermal_history', updated);
        setDeleteTarget(null);
    };

    const [formData, setFormData] = useState(() => {
        if (editData) {
            return {
                ...editData,
                operatorSignature: editData.operatorSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signature || '',
                signature: editData.signature || editData.supervisorSignature || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            };
        }
        return {
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
            
            // Firmas
            operatorSignature: '',
            supervisorSignature: '',
            signature: '',
            showSignatures: { operator: true, professional: true, supervisor: true }
        };
    });

    const [professional, setProfessional] = useState<any>({
        name: '',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setFormData((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

    useEffect(() => {
        window.scrollTo(0, 0);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        let stamp = null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
            stamp = parsed.stamp || null;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || '',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [resultados, setResultados] = useState({
        tgbh: null as number | null,
        vle: null as number | null,
        vla: null as number | null,
        admisible: null as boolean | null,
        enVLA: null as boolean | null,
    });

    const [shareItem, setShareItem] = useState<any>(null);

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Puesto',
            accessor: 'puesto',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: item.resultados?.admisible ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px', color: item.resultados?.admisible ? '#10b981' : '#ef4444' }}>
                        <ThermometerSun size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.puesto}</span>
                </div>
            )
        },
        {
            header: 'Sector',
            accessor: 'sector',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} /> {item.sector}
                </span>
            )
        },
        {
            header: 'TGBH',
            accessor: 'resultados',
            sortable: true,
            render: (item: any) => (
                <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '999px', fontWeight: 800 }}>
                    {item.resultados?.tgbh}°C
                </span>
            )
        },
        {
            header: 'Resultado',
            accessor: 'id',
            render: (item: any) => {
                const ok = item.resultados?.admisible;
                return (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: ok ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '0.8rem' }}>
                        {ok ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
                        {ok ? 'ADMISIBLE' : 'NO ADMISIBLE'}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => {
                        setFormData({
                            ...item,
                            operatorSignature: item.operatorSignature || '',
                            supervisorSignature: item.supervisorSignature || item.signature || '',
                            signature: item.signature || item.supervisorSignature || '',
                            showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true }
                        });
                        setIsFormVisible(true);
                    }} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/thermal/${item.id}?print=true`; setQrTarget({ text: url, title: `Estrés Térmico — ${item.puesto}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

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
            professionalSignature: formData.professionalSignature || professional.signature,
            professionalName: formData.professionalName || professional.name,
            professionalLicense: formData.professionalLicense || professional.license,
            professionalStamp: formData.professionalStamp || professional.stamp,
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
        setHistory(history);

        toast.success(editData ? 'Evaluación térmica actualizada.' : 'Medición guardada en el historial.');
        setIsFormVisible(false);
    };

    const [showUpdateAlert, setShowUpdateAlert] = useState(() => {
        return localStorage.getItem('thermal_stress_alert_dismissed') !== 'true';
    });

    const handleSave = doSave;
    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {showUpdateAlert && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', margin: 'auto', padding: '2rem', borderRadius: '16px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ background: '#fef2f2', color: '#ef4444', height: '64px', width: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <TriangleAlert size={32} />
                        </div>
                        <h2 style={{ margin: '0 0 1rem', fontWeight: 900, color: '#111827', fontSize: '1.25rem' }}>Actualización Normativa</h2>
                        <p style={{ margin: '0 0 1.5rem', color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Hemos actualizado la calculadora a la <strong>Res. SRT 30/2023</strong>. Los límites de tolerancia térmica ahora son más restrictivos. Revisa cuidadosamente el dictamen VLA y VLE.
                        </p>
                        <button 
                            onClick={() => { setShowUpdateAlert(false); localStorage.setItem('thermal_stress_alert_dismissed', 'true'); }}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', width: '100%' }}
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}
            
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                        <h3>¿Eliminar evaluación?</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title="Compartir Informe de Estrés Térmico"
                text={shareItem ? `🌡️ Evaluación Estrés Térmico (TGBH) | Res. SRT 30/2023\n📍 Puesto: ${shareItem.puesto}\n📊 TGBH: ${shareItem.resultados?.tgbh}°C | VLE: ${shareItem.resultados?.vle}°C\n✅ Dictamen: ${!shareItem.resultados?.admisible ? 'RIESGO TÉRMICO' : shareItem.resultados?.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE'}\n\nEnviado desde Asistente HYS` : ''}
                rawMessage={shareItem ? `🌡️ Evaluación Estrés Térmico (TGBH) | Res. SRT 30/2023\n📍 Puesto: ${shareItem.puesto}\n📊 TGBH: ${shareItem.resultados?.tgbh}°C | VLE: ${shareItem.resultados?.vle}°C\n✅ Dictamen: ${!shareItem.resultados?.admisible ? 'RIESGO TÉRMICO' : shareItem.resultados?.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE'}\n\nEnviado desde Asistente HYS` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Estres_Termico_${shareItem?.puesto || 'report'}.pdf`}
            />

            <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <ThermalStressPdfGenerator data={shareItem} isHeadless={true} onBack={() => {}} />}
            </div>

            {!isFormVisible ? (
                <div className="animate-fade-in" style={{ padding: '0 1rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                    <PremiumHeader
                        title="Evaluaciones de Estrés Térmico"
                        subtitle={`Res. SRT 30/2023 • ${history.length} registros`}
                        icon={<ThermometerSun size={36} color="#ffffff" />}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button onClick={() => navigate('/', { state: { scrollTo: 'thermal-stress' } })} style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem',
                                background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)',
                                borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <ArrowLeft size={20} /> INICIO
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({
                                    puesto: '', sector: '', tarea: '', fecha: new Date().toISOString().split('T')[0],
                                    cargaSolar: false, tbh: '', tg: '', tbs: '', viento: '',
                                    aptaMedica: false, aclimatado: false, ritmo: 'moderado', ciclo: 'continuo',
                                    operatorSignature: '', supervisorSignature: '', signature: '',
                                    showSignatures: { operator: true, professional: true, supervisor: true }
                                });
                                setIsFormVisible(true);
                            }}
                            style={{ flex: '0 1 auto', padding: '0.8rem 1.5rem', borderRadius: '12px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap' }}
                        >
                            <Plus size={20} /> Nuevo Estudio
                        </button>
                    </div>

                    <DataTable
                        data={history}
                        columns={columns}
                        searchPlaceholder="Buscar por puesto o sector..."
                        searchFields={['puesto', 'sector', 'tarea']}
                        emptyMessage="No hay evaluaciones térmicas registradas."
                        emptyIcon={<ThermometerSun size={48} />}
                    />

                    {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                </div>
            ) : (
                <>
                    <div className="no-print floating-action-bar">
                        <button onClick={() => setIsFormVisible(false)} className="btn-floating-action" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                            <ArrowLeft size={18} /> ATRÁS
                        </button>
                        <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                            <Save size={18} /> GUARDAR
                        </button>
                        <button onClick={() => {
                            setFormData({
                                ...formData,
                                professionalSignature: formData.professionalSignature || professional.signature,
                                professionalName: formData.professionalName || professional.name,
                                professionalLicense: formData.professionalLicense || professional.license,
                                professionalStamp: formData.professionalStamp || professional.stamp,
                            });
                            requirePro(() => {
                                const report = {
                                    id: editData?.id || Date.now(),
                                    date: editData?.date || new Date().toISOString(),
                                    evaluador: currentUser?.displayName || 'Profesional HSE',
                                    normativa: 'Res. SRT 30/2023',
                                    ...formData,
                                    professionalSignature: formData.professionalSignature || professional.signature,
                                    professionalName: formData.professionalName || professional.name,
                                    professionalLicense: formData.professionalLicense || professional.license,
                                    professionalStamp: formData.professionalStamp || professional.stamp,
                                    resultados
                                };
                                setShareItem(report);
                            });
                        }} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                            <Share2 size={18} /> COMPARTIR
                        </button>
                        <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                            <Printer size={18} /> IMPRIMIR PDF
                        </button>
                    </div>

                    <div className="no-print animate-fade-in">
                        <PremiumHeader
                            title={editData ? 'Editar Estrés Térmico' : 'Estrés Térmico Calculadora'}
                            subtitle="Res. SRT 30/2023 — reemplaza Res. 295/03 (derogada)"
                            icon={<ThermometerSun size={36} color="#ffffff" />}
                        />

                        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', zIndex: 10 }} className="no-print">
                            <button 
                                onClick={() => setIsFormVisible(false)} 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    padding: '0.5rem 1.25rem', 
                                    background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    color: '#ffffff', 
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.3px'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(54, 179, 126, 0.4)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(54, 179, 126, 0.3)'; }}
                            >
                                <ArrowLeft size={18} strokeWidth={2.5} /> Volver
                            </button>
                        </div>

                        <div className="grid-2-cols" style={{ gap: '1.5rem', marginTop: '2rem' }}>

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

                {/* Firmas y Autorizaciones */}
                <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <Pencil size={20} /> Firmas y Autorizaciones
                    </h2>

                    <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { id: 'operator', label: 'Trabajador Evaluado' },
                                { id: 'professional', label: 'Profesional Actuante' },
                                { id: 'supervisor', label: 'Responsable / Sector' }
                            ].map(sig => {
                                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                return (
                                    <label
                                        key={sig.id}
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        style={{
                                            padding: '0.55rem 1.1rem',
                                            borderRadius: 'var(--radius-full)',
                                            border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                            color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                            fontWeight: 750,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                                            style={{ display: 'none' }}
                                        />
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '4px',
                                            border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                            background: isChecked ? 'var(--color-primary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isChecked && <CheckCircle2 size={12} color="white" />}
                                        </div>
                                        {sig.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                            }}
                            box1={showSignatures.operator ? {
                                title: 'TRABAJADOR EVALUADO',
                                subtitle: 'Firma de Conformidad',
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.professional ? {
                                title: 'PROFESIONAL H&S',
                                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                signatureUrl: formData.professionalSignature || professional.signature || null,
                                stampUrl: formData.professionalStamp || professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                            box3={showSignatures.supervisor ? {
                                title: 'RESPONSABLE / SECTOR',
                                subtitle: 'Validación de Medidas',
                                signatureUrl: formData.supervisorSignature || formData.signature || null,
                                isProfessional: false
                            } : null}
                        />
                    </div>

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)]" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                        {showSignatures.operator && (
                            <SignatureCanvas 
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                initialImage={formData.operatorSignature}
                                label="Firma del Trabajador Evaluado"
                            />
                        )}
                        
                        {showSignatures.professional && (
                            <SignatureCanvas 
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                initialImage={formData.professionalSignature || professional.signature}
                                label="Firma de Profesional Actuante"
                            />
                        )}

                        {showSignatures.supervisor && (
                            <SignatureCanvas 
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                initialImage={formData.supervisorSignature || formData.signature}
                                label="Firma de Responsable / Sector"
                            />
                        )}
                    </div>
                </div>
            </div>
            </>
        )}

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
