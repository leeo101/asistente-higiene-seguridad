import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Calculator, Info, RefreshCw, Printer, Search, Settings2, CheckCircle2, TriangleAlert, Share2, Save, ArrowLeft, ThermometerSun, Pencil, MapPin, Trash2, QrCode, Plus } from
'lucide-react';
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
import PdfBrandingFooter from '../components/PdfBrandingFooter';

// Res. SRT 30/2023 — Valores Límite de Exposición (VLE) TGBH en °C
// Reemplaza el Anexo II del Dec. 351/79 (vigente desde 2024, prórroga Res. 7/2024)
const LIMITS_30_2023 = {
  'continuo': { 'liviano': 29.0, 'moderado': 26.7, 'pesado': 25.0 },
  '75_25': { 'liviano': 30.6, 'moderado': 27.5, 'pesado': 25.9 },
  '50_50': { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9 },
  '25_75': { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0 }
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
{ id: 'pesado', label: 'Pesada (> 350 W) — pico/pala, cargas pesadas', watts: 400 }];


export default function ThermalStress(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
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
    const updated = history.filter((item) => item.id !== deleteTarget);
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
      tbh: '', // Temperatura Bulbo Húmedo natural
      tg: '', // Temperatura de Globo
      tbs: '', // Temperatura Bulbo Seco (solo con carga solar)
      viento: '', // Velocidad del aire m/s — Res. 30/2023

      // Condiciones del trabajador
      aptaMedica: false, // Apto médico específico — obligatorio Res. 30/2023
      aclimatado: false, // Aclimatación 5-14 días — Res. 30/2023

      // Exigencia física
      ritmo: 'moderado', // liviano, moderado, pesado
      ciclo: 'continuo', // continuo, 75_25, 50_50, 25_75

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
    enVLA: null as boolean | null
  });

  const [shareItem, setShareItem] = useState<any>(null);

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Puesto',
    accessor: 'puesto',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div style={{ background: item.resultados?.admisible ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.resultados?.admisible ? '#10b981' : '#ef4444' }} className="p-[0.5rem] rounded-[8px]">
                        <ThermometerSun size={16} />
                    </div>
                    <span className="font-[700]">{item.puesto}</span>
                </div>

  },
  {
    header: 'Sector',
    accessor: 'sector',
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <MapPin size={14} /> {item.sector}
                </span>

  },
  {
    header: 'TGBH',
    accessor: 'resultados',
    sortable: true,
    render: (item: any) =>
    <span className="p-[0.2rem_0.6rem] bg-[var(--color-background)] rounded-[999px] font-[800]">
                    {item.resultados?.tgbh}°C
                </span>

  },
  {
    header: 'Resultado',
    accessor: 'id',
    render: (item: any) => {
      const ok = item.resultados?.admisible;
      return (
        <span style={{ color: ok ? '#10b981' : '#ef4444' }} className="flex items-center gap-[0.4rem] font-[800] text-[0.8rem]">
                        {ok ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
                        {ok ? 'ADMISIBLE' : 'NO ADMISIBLE'}
                    </span>);

    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => {
        setFormData({
          ...item,
          operatorSignature: item.operatorSignature || '',
          supervisorSignature: item.supervisorSignature || item.signature || '',
          signature: item.signature || item.supervisorSignature || '',
          showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true }
        });
        setIsFormVisible(true);
      }} title="Editar" className="p-[0.4rem] bg-[rgba(59,130,246,0.08)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] text-[#3b82f6] cursor-pointer"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/thermal/${item.id}?print=true`;setQrTarget({ text: url, title: `Estrés Térmico — ${item.puesto}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
                </div>

  }];


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
    setFormData((p) => ({ ...p, [field]: value }));
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
        tgbhCalc = 0.7 * tbh + 0.2 * tg + 0.1 * tbs;
      } else {
        // Interior o al aire libre sin carga solar
        tgbhCalc = 0.7 * tbh + 0.3 * tg;
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
      history = history.map((item) => item.id === editData.id ? report : item);
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
    <div className="container min-h-screen flex flex-col pb-24">
            {showUpdateAlert &&
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 m-auto p-8 rounded-2xl max-w-[400px] text-center shadow-2xl">
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TriangleAlert size={32} />
                        </div>
                        <h2 className="m-0 mb-4 font-black text-slate-900 dark:text-white text-xl">Actualización Normativa</h2>
                        <p className="m-0 mb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            Hemos actualizado la calculadora a la <strong>Res. SRT 30/2023</strong>. Los límites de tolerancia térmica ahora son más restrictivos. Revisa cuidadosamente el dictamen VLA y VLE.
                        </p>
                        <button
            onClick={() => {setShowUpdateAlert(false);localStorage.setItem('thermal_stress_alert_dismissed', 'true');}}
            className="bg-red-500 hover:bg-red-600 text-white border-none py-3 px-8 rounded-xl font-extrabold cursor-pointer w-full transition-colors">
            
                            ENTENDIDO
                        </button>
                    </div>
                </div>
      }
            
            {deleteTarget &&
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-[320px] text-center">
                        <Trash2 size={48} className="text-[#ef4444] mb-[1rem]" />
                        <h3>¿Eliminar evaluación?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none cursor-pointer font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-1 p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer font-bold transition-colors">Eliminar</button>
                        </div>
                    </div>
                </div>
      }
            
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title="Compartir Informe de Estrés Térmico"
        text={shareItem ? `🌡️ Evaluación Estrés Térmico (TGBH) | Res. SRT 30/2023\n📍 Puesto: ${shareItem.puesto}\n📊 TGBH: ${shareItem.resultados?.tgbh}°C | VLE: ${shareItem.resultados?.vle}°C\n✅ Dictamen: ${!shareItem.resultados?.admisible ? 'RIESGO TÉRMICO' : shareItem.resultados?.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE'}\n\nEnviado desde Asistente HYS` : ''}
        rawMessage={shareItem ? `🌡️ Evaluación Estrés Térmico (TGBH) | Res. SRT 30/2023\n📍 Puesto: ${shareItem.puesto}\n📊 TGBH: ${shareItem.resultados?.tgbh}°C | VLE: ${shareItem.resultados?.vle}°C\n✅ Dictamen: ${!shareItem.resultados?.admisible ? 'RIESGO TÉRMICO' : shareItem.resultados?.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE'}\n\nEnviado desde Asistente HYS` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Estres_Termico_${shareItem?.puesto || 'report'}.pdf`} />
      

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                {shareItem && <ThermalStressPdfGenerator data={shareItem} isHeadless={true} onBack={() => {}} />}
            </div>

            {!isFormVisible ?
      <div className="animate-fade-in p-[0_1rem] w-[100%] max-w-[1200px] m-[0_auto]">
                    <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Evaluaciones de Estrés Térmico"
        subtitle={`Res. SRT 30/2023 • ${history.length} registros`}
        icon={<ThermometerSun size={36} color="#ffffff" />} />
        
                    
                    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                        <div className="flex gap-[1rem] items-center">
                            <></>
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
            className="flex-none px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-none font-extrabold text-[0.95rem] cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/30 whitespace-nowrap transition-all hover:-translate-y-0.5">
            
                            <Plus size={20} /> Nuevo Estudio
                        </button>
                    </div>

                    <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Buscar por puesto o sector..."
          searchFields={['puesto', 'sector', 'tarea']}
          emptyMessage="No hay evaluaciones térmicas registradas."
          emptyIcon={<ThermometerSun size={48} />} />
        

                    {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                </div> :

      <>
                    <div className="no-print floating-action-bar">
                        <button onClick={() => setIsFormVisible(false)} className="btn-floating-action bg-[var(--color-surface)] text-[var(--color-text)] border-[1px_solid_var(--color-border)]">
                            <ArrowLeft size={18} /> ATRÁS
                        </button>
                        <button onClick={(e) => {e.preventDefault();requirePro(handleSave);}} className="btn-floating-action bg-[#36B37E] text-[#ffffff]">
                            <Save size={18} /> GUARDAR
                        </button>
                        <button onClick={() => {
            setFormData({
              ...formData,
              professionalSignature: formData.professionalSignature || professional.signature,
              professionalName: formData.professionalName || professional.name,
              professionalLicense: formData.professionalLicense || professional.license,
              professionalStamp: formData.professionalStamp || professional.stamp
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
          }} className="btn-floating-action bg-[#0052CC] text-[#ffffff]">
                            <Share2 size={18} /> COMPARTIR
                        </button>
                        <button onClick={handlePrint} className="btn-floating-action bg-[#FF8B00] text-[#ffffff]">
                            <Printer size={18} /> IMPRIMIR PDF
                        </button>
                    </div>

                    <div className="no-print animate-fade-in">
                        <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
          title={editData ? 'Editar Estrés Térmico' : 'Estrés Térmico Calculadora'}
          subtitle="Res. SRT 30/2023 — reemplaza Res. 295/03 (derogada)"
          icon={<ThermometerSun size={36} color="#ffffff" />} />
          

                        <div className="no-print mt-[1.5rem] mb-[1.5rem] z-[10]">
                            <></>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

                    {/* ─── Columna Izquierda: Formulario ─── */}
                    <div className="flex flex-col gap-6">

                        {/* Metadatos */}
                        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <h2 className="text-lg font-bold m-0 mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <Settings2 size={20} /> Metadatos del Puesto
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label>Puesto de Trabajo a Evaluar</label>
                                    <input type="text" value={formData.puesto} onChange={(e) => handleInput('puesto', e.target.value)} placeholder="Ej. Operador de Horno 3" className="font-[bold]" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label>Sector / Área</label>
                                        <input type="text" value={formData.sector} onChange={(e) => handleInput('sector', e.target.value)} placeholder="Ej. Fundición" />
                                    </div>
                                    <div>
                                        <label>Fecha de Medición</label>
                                        <input type="date" value={formData.fecha} onChange={(e) => handleInput('fecha', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label>Tarea Principal que Realiza</label>
                                    <input type="text" value={formData.tarea} onChange={(e) => handleInput('tarea', e.target.value)} placeholder="Ej. Carga manual de lingotes y control visual" />
                                </div>
                            </div>
                        </div>

                        {/* Mediciones Ambientales */}
                        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                <h2 className="text-lg font-bold m-0 flex items-center gap-2 text-orange-500">
                                    <ThermometerSun size={20} /> Mediciones Ambientales
                                </h2>
                                <label className="flex items-center gap-2 text-[0.85rem] cursor-pointer bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-xl text-orange-700 dark:text-orange-400 font-bold">
                                    <input type="checkbox" checked={formData.cargaSolar} onChange={(e) => handleInput('cargaSolar', e.target.checked)} className="m-0" /> Al sol / Carga Solar
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label>Temp. Bulbo Húmedo natural (Tbh) °C</label>
                                    <input type="number" step="0.1" value={formData.tbh} onChange={(e) => handleInput('tbh', e.target.value)} placeholder="Ej: 22.5" />
                                </div>
                                <div>
                                    <label>Temp. Globo (Tg) °C</label>
                                    <input type="number" step="0.1" value={formData.tg} onChange={(e) => handleInput('tg', e.target.value)} placeholder="Ej: 28.1" />
                                </div>
                                <div>
                                    <label>Velocidad del Aire (m/s) <span className="text-[0.65rem] text-[#f97316] font-[700]">🆕 Res. 30/2023</span></label>
                                    <input type="number" step="0.1" min="0" value={formData.viento} onChange={(e) => handleInput('viento', e.target.value)} placeholder="Ej: 0.3" />
                                    <span className="text-[0.72rem] text-[var(--color-text-muted)]">Ingresarlo permite calcular la carga térmica ambiental completa.</span>
                                </div>
                                <div>
                                    <label>¿Trabajador aclimatado? <span className="text-[0.65rem] text-[#f97316] font-[700]">🆕 Res. 30/2023</span></label>
                                    <label style={{ background: formData.aclimatado ? 'rgba(16,185,129,0.1)' : 'var(--color-background)', border: `1px solid ${formData.aclimatado ? '#10b981' : 'var(--color-border)'}`, color: formData.aclimatado ? '#059669' : 'var(--color-text-muted)' }} className="flex items-center gap-[0.5rem] text-[0.85rem] cursor-pointer p-[0.5rem_0.8rem] rounded-[10px] font-[700]">
                                        <input type="checkbox" checked={formData.aclimatado} onChange={(e) => handleInput('aclimatado', e.target.checked)} className="m-0" />
                                        {formData.aclimatado ? 'Sí — 5-14 días completados' : 'No aclimatado'}
                                    </label>
                                    <span className="text-[0.72rem] text-[var(--color-text-muted)]">La aclimatación gradual eleva la tolerancia fisiológica al calor.</span>
                                </div>
                                {formData.cargaSolar &&
                  <div className="grid-column-[1_/_-1]">
                                        <label>Temp. Bulbo Seco (Tbs) °C</label>
                                        <input type="number" step="0.1" value={formData.tbs} onChange={(e) => handleInput('tbs', e.target.value)} placeholder="Temp. Aire seco" className="border-color-[#f97316]" />
                                        <span className="text-[0.75rem] text-[var(--color-text-muted)]">Requerido para la ecuación de ponderación con carga solar.</span>
                                    </div>
                  }
                            </div>
                        </div>

                        {/* Exigencia Física y Régimen */}
                        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <h2 className="text-lg font-bold m-0 mb-4 flex items-center gap-2 text-purple-500">
                                <RefreshCw size={20} /> Exigencia Física y Régimen
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label>Metabolismo / Carga de Trabajo <span className="text-[0.65rem] text-[#f97316] font-[700]">Res. 30/2023</span></label>
                                    <select value={formData.ritmo} onChange={(e) => handleInput('ritmo', e.target.value)} className="p-[0.8rem] w-[100%] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
                                        {METABOLIC_PREFS.map((m) =>
                      <option key={m.id} value={m.id}>{m.label}</option>
                      )}
                                    </select>
                                </div>
                                <div>
                                    <label>Ciclo Trabajo / Descanso (por hora)</label>
                                    <select value={formData.ciclo} onChange={(e) => handleInput('ciclo', e.target.value)} className="p-[0.8rem] w-[100%] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
                                        <option value="continuo">Trabajo Continuo (o &lt; 25% descanso/hr)</option>
                                        <option value="75_25">75% Trabajo, 25% Descanso c/hora</option>
                                        <option value="50_50">50% Trabajo, 50% Descanso c/hora</option>
                                        <option value="25_75">25% Trabajo, 75% Descanso c/hora</option>
                                    </select>
                                </div>

                                {/* Apto médico — obligatorio Res. 30/2023 */}
                                <div style={{ background: formData.aptaMedica ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.05)', border: `1px solid ${formData.aptaMedica ? '#10b981' : 'rgba(239,68,68,0.2)'}` }} className="rounded-[12px] p-[0.8rem_1rem]">
                                    <label style={{ color: formData.aptaMedica ? '#059669' : '#dc2626' }} className="flex items-center gap-[0.6rem] cursor-pointer font-[700] text-[0.87rem]">
                                        <input type="checkbox" checked={formData.aptaMedica} onChange={(e) => handleInput('aptaMedica', e.target.checked)} className="m-[0] w-[16px] h-[16px]" />
                                        ✅ Apto Médico Específico para Exposición al Calor
                                    </label>
                                    <p className="m-[0.4rem_0_0] text-[0.72rem] text-[var(--color-text-muted)]">Obligatorio por Res. SRT 30/2023. El trabajador debe tener apto médico antes de operar en ambientes con riesgo térmico.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Columna Derecha: Panel de Resultados ─── */}
                    <div className="flex flex-col gap-6">

                        {/* Card Dictamen */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-3xl overflow-hidden shadow-xl">
                            <div className="bg-blue-600 text-white p-4 flex items-center gap-2 font-extrabold">
                                <Calculator size={20} /> Dictamen — {countryNorms.thermal}
                            </div>

                            <div className="p-6 text-center">
                                {/* TGBH grande */}
                                <div className="text-[0.85rem] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1.5">
                                    Índice TGBH Calculado
                                </div>
                                <div className="text-[3.5rem] font-black leading-none text-slate-800 dark:text-slate-100 mb-5">
                                    {resultados.tgbh !== null ? `${resultados.tgbh}°C` : '--'}
                                </div>

                                {/* VLA y VLE */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="flex flex-col items-center p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                        <span className="text-[0.6rem] font-black uppercase text-amber-600 dark:text-amber-500 mb-1">VLA (Acción)</span>
                                        <span className="font-black text-amber-600 dark:text-amber-500">{resultados.vla !== null ? `${resultados.vla}°C` : '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                        <span className="text-[0.6rem] font-black uppercase text-red-600 dark:text-red-500 mb-1">VLE (Límite)</span>
                                        <span className="font-black text-red-600 dark:text-red-500">{resultados.vle !== null ? `${resultados.vle}°C` : '--'}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 col-span-full">
                                        <span className="text-slate-500 dark:text-slate-400 font-semibold text-[0.82rem]">Carga Solar:</span>
                                        <span style={{ color: formData.cargaSolar ? '#f97316' : 'var(--color-text)' }} className="font-[800] text-[0.82rem]">{formData.cargaSolar ? 'SÍ' : 'NO'}</span>
                                    </div>
                                </div>

                                {/* Dictamen 3 niveles: OK / ALERTA VLA / RIESGO VLE */}
                                {resultados.admisible !== null ?
                  <div className={`p-5 rounded-2xl flex items-center justify-center gap-3 border-2 ${!resultados.admisible ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-500' : resultados.enVLA ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-500'}`}>
                                        {!resultados.admisible ?
                    <TriangleAlert size={28} /> :
                    resultados.enVLA ? <Info size={28} /> : <CheckCircle2 size={28} />
                    }
                                        <div className="text-left">
                                            <div className="text-base font-black uppercase">
                                                {!resultados.admisible ?
                        'RIESGO TÉRMICO' :
                        resultados.enVLA ? 'ZONA DE ALERTA (VLA)' : 'ADMISIBLE'
                        }
                                            </div>
                                            <div className="text-xs font-semibold opacity-90">
                                                {!resultados.admisible ?
                        'Supera VLE. Rotación o control urgente (Res. 30/2023).' :
                        resultados.enVLA ?
                        'Supera VLA: activar monitoreo personal obligatorio.' :
                        'Por debajo del VLA. Condición segura.'
                        }
                                            </div>
                                        </div>
                                    </div> :

                  <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600">
                                        <Info size={24} className="mx-auto mb-2 opacity-50" />
                                        <p className="m-0 text-[0.85rem]">Ingresá las temperaturas de globo y bulbo húmedo para ver el resultado.</p>
                                    </div>
                  }

                                {/* Advertencia aclimatación pendiente */}
                                {!formData.aclimatado && resultados.tgbh !== null &&
                  <div className="mt-[0.8rem] p-[0.75rem_1rem] bg-[rgba(245,158,11,0.07)] border-[1px_solid_rgba(245,158,11,0.25)] rounded-[12px] text-left">
                                        <div className="text-[0.7rem] font-[900] text-[#d97706] mb-[0.25rem]">⚠️ ACLIMATACIÓN PENDIENTE — Res. SRT 30/2023</div>
                                        <p className="m-[0] text-[0.7rem] text-[var(--color-text-muted)] line-height-[1.5]">
                                            Trabajador no aclimatado. Implementar plan progresivo de <strong>5 a 14 días</strong> antes de exposición completa al calor.
                                        </p>
                                    </div>
                  }
                            </div>
                        </div>

                        {/* Card Fundamento Legal */}
                        <div className="p-6 rounded-3xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/50">
                            <h3 className="text-sm text-orange-600 dark:text-orange-500 m-0 mb-3 flex items-center gap-1.5 font-bold">
                                <Info size={16} /> Fundamento Legal
                            </h3>
                            <p className="text-[0.8rem] text-orange-900/80 dark:text-orange-200/80 m-0 mb-2 leading-relaxed">
                                <strong>{countryNorms.thermal} ({countryNorms.general})</strong> — Vigente desde 2024 (prórroga Res. 7/2024).
                                Reemplazó el Anexo II del Dec. 351/79 y art. relacionados en Dec. 911/96 y 249/07.
                                El índice adoptado es el TGBH (Temperatura de Globo y Bulbo Húmedo).
                            </p>
                            <code className="text-[0.73rem] bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-lg block text-orange-700 dark:text-orange-400 leading-[1.8]">
                                Interior: TGBH = 0.7·Tbh + 0.3·Tg<br />
                                Exterior (sol): TGBH = 0.7·Tbh + 0.2·Tg + 0.1·Tbs<br />
                                VLA = VLE &minus; 1.5°C &nbsp;(criterio ACGIH adoptado)
                            </code>
                        </div>
                    </div>
                </div>

                {/* Firmas y Autorizaciones */}
                <div className="mt-8 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                    <h2 className="text-[1.1rem] m-[0_0_1.5rem] flex items-center gap-[0.5rem] text-[var(--color-primary)]">
                        <Pencil size={20} /> Firmas y Autorizaciones
                    </h2>

                    <div className="no-print mb-8 p-6 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl w-full flex flex-col gap-5 justify-center items-center">
                        <div className="text-slate-800 dark:text-slate-100 font-extrabold text-[0.85rem] uppercase tracking-wide">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-4 flex-wrap justify-center">
                            {[
                { id: 'operator', label: 'Trabajador Evaluado' },
                { id: 'professional', label: 'Profesional Actuante' },
                { id: 'supervisor', label: 'Responsable / Sector' }].
                map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease]"
                      style={{


                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                      }}>
                      
                                        <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                      
                                        <div style={{



                        border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                        background: isChecked ? 'var(--color-primary)' : 'transparent'




                      }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                            {isChecked && <CheckCircle2 size={12} color="white" />}
                                        </div>
                                        {sig.label}
                                    </label>);

                })}
                        </div>
                    </div>

                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div className="mb-[2.5rem]">
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
                } : null} />
              
            <PdfBrandingFooter />
                    </div>

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid gap-[2rem] mt-[2rem] pt-[2rem] border-top-[1px_solid_var(--color-border)]" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
                        {showSignatures.operator &&
              <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                initialImage={formData.operatorSignature}
                label="Firma del Trabajador Evaluado" />

              }
                        
                        {showSignatures.professional &&
              <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                initialImage={formData.professionalSignature || professional.signature}
                label="Firma de Profesional Actuante" />

              }

                        {showSignatures.supervisor &&
              <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                initialImage={formData.supervisorSignature || formData.signature}
                label="Firma de Responsable / Sector" />

              }
                    </div>
                </div>
            </div>
            </>
      }

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
          onBack={() => {}} />
        
            </div>
        </div>);

}