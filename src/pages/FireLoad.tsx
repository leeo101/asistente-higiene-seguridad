import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Plus, Trash2, Flame, Calculator,
  FileText, Printer, Building2, Layout, Maximize2,
  Info, TriangleAlert, ShieldCheck, History, Share2, Sparkles, Loader2, Calendar, QrCode } from
'lucide-react';
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
import { getErrorMessage } from '../utils/errorUtils';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { getCountryNormativa } from '../data/legislationData';
import { DataTable } from '../components/DataTable';
import QRModal from '../components/QRModal';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

export default function FireLoad(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showForm]);

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
    { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400, totalKcal: 0 }],

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
      const group = riskActivityGroups.find((g) =>
      g.id === formData.actividadGrupo ||
      g.label === formData.actividadGrupo
      );
      if (group) {
        setFormData((prev) => ({ ...prev, riesgo: group.defaultR || 'R3' }));
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
      const totalKcal = (formData.materiales || []).reduce((acc, m) => acc + (m.peso || 0) * (m.poderCalorifico || 0), 0);

      // 2. Madera Equivalente (Total Kcal / 4400)
      const maderaEq = totalKcal / 4400;

      // 3. Carga de Fuego Qf (Madera Eq / Superficie)
      const qf = formData.superficie > 0 ? maderaEq / formData.superficie : 0;

      // 4. Determinar RF (Simplificado según Tabla 2.2.1 Anexo VII)
      let rf = 'F0';
      const riskStr = formData.riesgo || 'R3';
      const rValue = parseInt(riskStr.replace('R', '')) || 3;

      if (qf > 0) {
        if (qf <= 15) rf = rValue <= 2 ? 'F60' : 'F30';else
        if (qf <= 30) rf = rValue <= 2 ? 'F90' : 'F60';else
        if (qf <= 60) rf = rValue <= 2 ? 'F120' : 'F90';else
        if (qf <= 100) rf = rValue <= 2 ? 'F180' : 'F120';else
        rf = 'F180+';
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
      setFormData((prev) => ({ ...prev, conclusion: data.conclusion }));
      toast.success('Conclusión generada con éxito ✨', { id: loadingToast });
    } catch (error) {
      toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
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
        const predefined = (fireMaterials || []).find((m) => {
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
        newHistory = history.map((item) => item.id === formData.id ? { ...formData, showSignatures, results, updatedAt: new Date().toISOString() } : item);
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
      toast.error('Error al guardar: ' + getErrorMessage(error));
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
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap] font-[700] text-[0.85rem]">
                    <Calendar size={15} /> {new Date(item.createdAt).toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(249,115,22,0.1)] p-[0.5rem] rounded-[10px] text-[#f97316] flex items-center justify-center">
                        <Flame size={18} />
                    </div>
                    <span className="font-[800] text-[var(--color-text)]">{item.empresa || 'Sin nombre'}</span>
                </div>

  },
  {
    header: 'Sector',
    accessor: 'sector',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] font-[600] text-[var(--color-text-muted)]">
                    <Building2 size={16} /> {item.sector}
                </span>

  },
  {
    header: 'Carga Qf',
    accessor: 'results',
    render: (item: any) =>
    <div>
                    <div className="text-[1.25rem] font-[900] text-[#f97316] line-height-[1.1]">{item.results?.cargaDeFuego?.toFixed(2)}</div>
                    <div className="text-[0.65rem] text-[var(--color-text-muted)] font-[800] uppercase letter-spacing-[0.5px] mt-[2px]">
                        Kg/m² — <span className="text-[#ef4444]">{item.results?.rfRequerida}</span>
                    </div>
                </div>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.45rem]">
                    <button
        onClick={() => {
          setFormData(item);
          if (item.showSignatures) setShowSignatures(item.showSignatures);
          setShowForm(true);
        }} className="p-[0.45rem_0.85rem] bg-[var(--color-surface)] border-[1px_solid_var(--glass-border-subtle)] rounded-[10px] cursor-pointer text-[0.75rem] font-[800] text-[var(--color-text)] flex items-center gap-[4px] transition-[all_0.2s]">

        
                        <FileText size={16} /> Ver
                    </button>
                    <button
        onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`;setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` });})}

        title="QR" className="p-[0.45rem] bg-[rgba(139,92,246,0.06)] border-[1px_solid_rgba(139,92,246,0.18)] rounded-[10px] text-[#8b5cf6] cursor-pointer flex items-center justify-center transition-[all_0.2s]">
        
                        <QrCode size={16} />
                    </button>
                    <button
        onClick={() => requirePro(() => setShareItem(item))}

        title="Compartir" className="p-[0.45rem] bg-[rgba(22,163,74,0.06)] border-[1px_solid_rgba(22,163,74,0.18)] rounded-[10px] text-[#16a34a] cursor-pointer flex items-center justify-center transition-[all_0.2s]">
        
                        <Share2 size={16} />
                    </button>
                    <button
        onClick={(e) => {e.stopPropagation();setDeleteTarget(item.id);}} className="p-[0.45rem] bg-[rgba(239,68,68,0.06)] border-[1px_solid_rgba(239,68,68,0.18)] rounded-[10px] text-[#ef4444] cursor-pointer flex items-center justify-center transition-[all_0.2s]">

        
                        <Trash2 size={16} />
                    </button>
                </div>

  }];


  return (
    <div className="container max-w-[1000px] mx-auto px-4 pb-32">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
            <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Carga de Fuego - ${(shareItem as any)?.sector || ''}`} text={shareItem ? `🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${(shareItem as any).empresa}\n📍 Sector: ${(shareItem as any).sector}\n🔥 Carga Qf: ${(shareItem as any).results?.cargaDeFuego?.toFixed(2)} Kg/m²\n🛡️ RF: ${(shareItem as any).results?.rfRequerida}` : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={`Carga_Fuego_${(shareItem as any)?.sector || 'Estudio'}.pdf`} />
            <div className="ats-pdf-offscreen">
                <FireLoadPdfGenerator data={shareItem} />
            </div>

            {!showForm ?
      <>
                    <div className="no-print">
                        <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
          title="Carga de Fuego"
          subtitle={`Cálculo según ${countryNorms.fire}`}
          icon={<Flame size={36} color="#ffffff" />} />
          
                    </div>
                    <div className="my-6 flex flex-wrap gap-4 items-center">
                        <></>
                        <div className="flex-1 min-w-[250px] relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Flame size={18} />
                            </div>
                            <input
              type="text"
              placeholder="Buscar por empresa o sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            
                        </div>
                        <select
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]">
            
                            <option value="">Todas las empresas</option>
                            {Array.from(new Set(history.map((h: any) => h.empresa).filter(Boolean))).map((empresa: string) =>
            <option key={empresa} value={empresa}>{empresa}</option>
            )}
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
                { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400, totalKcal: 0 }],

                id: ''
              });
              setShowForm(true);
            }}
            className="flex-none px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base cursor-pointer flex items-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-colors whitespace-nowrap">
            
                            <Plus size={20} /> Nuevo Cálculo
                        </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <DataTable
            data={filteredHistory}
            columns={columns}
            searchPlaceholder="Buscar..."
            searchFields={['empresa', 'sector']}
            emptyMessage="No se encontraron estudios de carga de fuego."
            emptyIcon={<Flame size={48} />} />
          
                    </div>
                </> :

      <>
            <div className="animate-fade-in ats-editor-panel">
            <ShareModal
            isOpen={showShare}
            open={showShare}
            onClose={() => setShowShare(false)}
            title={`Carga de Fuego – ${formData.empresa}`}
            text={`🔥 Estudio de Carga de Fuego\n🏗️ Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n🔥 Carga Qf: ${results.cargaDeFuego.toFixed(2)} Kg/m²\n🛡️ RF Requerida: ${results.rfRequerida}\n\nGenerado con Asistente HYS`}
            elementIdToPrint="pdf-content"
            rawMessage={``}
            fileName={`Carga_de_Fuego_${formData.empresa || 'Reporte'}.pdf`} />
          
            <ModuleFormLayout>
                <ModuleFormToolbar
                    title={editData ? 'Editar Carga de Fuego' : 'Cálculo Carga de Fuego'}
                    subtitle={`Cálculo según ${countryNorms.fire}`}
                    icon={<Flame size={28} className="text-orange-500" />}
                />

                <ModuleFormDocument id="pdf-content">
                    {/* ENCABEZADO PARA IMPRESIÓN */}
                    <div className="print-only">
                        <div className="grid grid-cols-[1fr_2fr_1fr] items-center border-b-4 border-slate-200 pb-6 mb-8 w-full gap-6">
                            <div className="text-left">
                                <p className="m-0 font-bold text-[0.65rem] uppercase text-slate-500 tracking-wider">Sistema de Gestión</p>
                                <p className="m-0 font-black text-xs uppercase text-slate-800">Control H&S</p>
                            </div>

                            <div className="text-center">
                                <h2 className="m-0 text-[1.2rem] font-black text-blue-600 uppercase tracking-wide leading-tight">
                                    {editData ? 'Editar Carga de Fuego' : 'Cálculo Carga de Fuego'}
                                </h2>
                                <p className="mt-1 text-[0.65rem] text-slate-500 font-semibold">{countryNorms.fire}</p>
                            </div>

                            <div className="flex justify-end">
                                <CompanyLogo className="h-[45px] w-[auto] max-w-[140px] object-fit-[contain]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <div className="flex flex-col gap-[8px]">
                                <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">ESTABLECIMIENTO:</span> <span className="font-[800] text-[0.9rem]">{formData.empresa || '-'}</span></div>
                                <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">SECTOR:</span> <span className="font-[800] text-[0.9rem]">{formData.sector || '-'}</span></div>
                            </div>
                            <div className="flex flex-col gap-[8px]">
                                <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">ACTIVIDAD:</span> <span className="font-[800] text-[0.9rem]">{formData.actividadResumen || '-'}</span></div>
                                <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">SUPERFICIE:</span> <span className="font-[800] text-[0.9rem]">{formData.superficie} m²</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex flex-col gap-6 flex-1 w-full">
                            
                            <ModuleFormSection title="Datos del Sector de Incendio" icon={<Building2 size={20} className="text-orange-500" />}>
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Empresa / Establecimiento</label>
                                    <div className="no-print relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Building2 size={16} />
                                        </div>
                                        <input
                          type="text"
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          placeholder="Ej: Planta Industrial Sur"
                          className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        
                                    </div>
                                    <div className="print-only p-[8px] border-bottom-[1px_solid_#eee]">{formData.empresa || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Sector / Depósito</label>
                                    <div className="no-print relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Layout size={16} />
                                        </div>
                                        <input
                          type="text"
                          value={formData.sector}
                          onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                          placeholder="Ej: Salón de Ventas"
                          className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        
                                    </div>
                                    <div className="print-only p-[8px] border-bottom-[1px_solid_#eee]">{formData.sector || '-'}</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Actividad (Resumen para Encabezado)</label>
                                <div className="no-print relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <FileText size={16} />
                                    </div>
                                    <input
                        type="text"
                        value={formData.actividadResumen}
                        onChange={(e) => setFormData({ ...formData, actividadResumen: e.target.value })}
                        placeholder="Ej: Planta Industrial, Depósito de Telas..."
                        className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      
                                </div>
                                <div className="print-only p-[8px] border-bottom-[1px_solid_#eee]">{formData.actividadResumen || '-'}</div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Descripción de Actividad</label>
                                <textarea
                      value={formData.descripcionActividad}
                      onChange={(e) => setFormData({ ...formData, descripcionActividad: e.target.value })}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Detalle los procesos y actividades que se realizan en el sector..."
                      className="no-print fireload-focus-glow w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 min-h-[80px] overflow-hidden font-inherit focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    
                                <div className="print-text-box p-[8px] border-bottom-[1px_solid_#eee]">{formData.descripcionActividad || 'Sin descripción detallada.'}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Superficie del Sector (m²)</label>
                                    <div className="no-print relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Maximize2 size={16} />
                                        </div>
                                        <input
                          type="number"
                          value={formData.superficie === 0 ? '' : formData.superficie}
                          onChange={(e) => setFormData({ ...formData, superficie: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        
                                    </div>
                                    <div className="print-only p-[8px] border-bottom-[1px_solid_#eee]">{formData.superficie} m²</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Grupo de Actividad</label>
                                    <div className="no-print relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Flame size={16} />
                                        </div>
                                        <input
                          list="activityList"
                          value={formData.actividadGrupo}
                          onChange={(e) => setFormData({ ...formData, actividadGrupo: e.target.value })}
                          placeholder="Ej: Industrial, Comercial..."
                          className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        
                                        <datalist id="activityList">
                                            {(riskActivityGroups || []).map((g) => <option key={g.id} value={g.label} />)}
                                        </datalist>
                                    </div>
                                    <div className="print-only p-[8px] border-bottom-[1px_solid_#eee]">{formData.actividadGrupo}</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nivel de Riesgo ({countryNorms.fire.split(' ')[0]})</label>
                                <div className="no-print relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <select
                        value={formData.riesgo}
                        onChange={(e) => setFormData({ ...formData, riesgo: e.target.value })}
                        className="fireload-focus-glow w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                        
                                        <option value="R1">Riesgo 1 (Explosivo)</option>
                                        <option value="R2">Riesgo 2 (Inflamable)</option>
                                        <option value="R3">Riesgo 3 (Muy Combustible)</option>
                                        <option value="R4">Riesgo 4 (Combustible)</option>
                                        <option value="R5">Riesgo 5 (Poco Combustible)</option>
                                        <option value="R6">Riesgo 6 (Incombustible)</option>
                                        <option value="R7">Riesgo 7 (Refractario)</option>
                                    </select>
                                </div>
                                <div className="print-only p-[8px] border-bottom-[1px_solid_#eee] font-[bold]">{formData.riesgo}</div>
                                <p className="no-print m-[0.4rem_0_0_0] text-[0.75rem] text-[var(--color-text-muted)] font-[500]">
                                    El riesgo afecta directamente el cálculo de la Resistencia al Fuego (RF) necesaria.
                                </p>
                            </div>
                            </ModuleFormSection>

                            <ModuleFormSection title="Inventario de Materiales Combustibles" icon={<Flame size={20} className="text-orange-500" />}>
                            <div className="flex flex-col gap-[0.8rem]">
                                {/* VISTA EN PANTALLA (Formulario Interactivo) */}
                                <div className="no-print flex flex-col gap-[0.8rem]">
                                    {(formData.materiales || []).map((m, idx) =>
                      <div key={idx} className="fireload-material-row grid gap-[0.8rem] items-end" style={{ gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1.2fr auto' }}>
                                            <div>
                                                <label className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase block mb-[0.3rem]">Material #{idx + 1}</label>
                                                <input
                            list="materialList"
                            value={m.nombre}
                            onChange={(e) => handleMaterialChange(idx, 'nombre', e.target.value)}
                            placeholder="Ej: Madera, Plásticos, Papel..."
                            className="fireload-focus-glow w-[100%] p-[0.6rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] transition-[all_0.2s]" />

                          
                                                <datalist id="materialList">
                                                    {(fireMaterials || []).map((fm, i) => <option key={i} value={fm.nombre} />)}
                                                </datalist>
                                            </div>
                                            <div className="grid grid-template-columns-[1fr] gap-[0.2rem]">
                                                <label className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase">Peso (Kg)</label>
                                                <input
                            type="number"
                            value={m.peso === 0 ? '' : m.peso}
                            onChange={(e) => handleMaterialChange(idx, 'peso', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="fireload-focus-glow w-[100%] p-[0.6rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] transition-[all_0.2s]" />

                          
                                            </div>
                                            <div className="grid grid-template-columns-[1fr] gap-[0.2rem]">
                                                <label className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase">Calor (Mcal/Kg)</label>
                                                <input
                            type="number"
                            value={m.poderCalorifico === 0 ? '' : m.poderCalorifico}
                            onChange={(e) => handleMaterialChange(idx, 'poderCalorifico', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="fireload-focus-glow w-[100%] p-[0.6rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] transition-[all_0.2s]" />

                          
                                            </div>
                                            <button
                          onClick={() => removeMaterial(idx)}

                          onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';e.currentTarget.style.transform = 'scale(1.05)';}}
                          onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';e.currentTarget.style.transform = 'none';}} className="bg-[rgba(239,_68,_68,_0.05)] border-[1px_solid_rgba(239,_68,_68,_0.15)] text-[#ef4444] p-[0.6rem] rounded-[8px] cursor-pointer flex items-center justify-center transition-[all_0.2s] align-self-[end] h-[38px] min-width-[38px]">
                          
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                      )}
                                     <button
                        onClick={addMaterial}

                        onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';e.currentTarget.style.borderColor = '#f97316';}}
                        onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(249, 115, 22, 0.03)';e.currentTarget.style.borderColor = 'var(--glass-border)';}} className="border-style-[dashed] p-[1rem] w-[100%] bg-[rgba(249,_115,_22,_0.03)] border-[2px_dashed_var(--glass-border)] text-[#f97316] rounded-[12px] font-[800] text-[0.85rem] cursor-pointer flex items-center justify-center gap-[0.5rem] transition-[all_0.2s]">
                        
                                         <Plus size={18} /> Agregar Material Combustible
                                     </button>
                                 </div>
                             </div>
                            </ModuleFormSection>
                    </div>

                    <div style={{ width: isMobile ? '100%' : '350px' }} className="results-grid no-print sticky top-[1.5rem] flex flex-col gap-[1.5rem]">
                        <div className="glass-card bg-[linear-gradient(135deg,_#f97316,_#ea580c)] text-[#ffffff] text-center p-[2rem] rounded-[var(--radius-2xl)] border-none box-shadow-[0_8px_30px_rgba(249,_115,_22,_0.35)] relative overflow-[hidden]">
                            <div className="absolute inset-[0] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent)] pointer-events-[none]" />
                            <div className="text-[0.75rem] font-[900] uppercase letter-spacing-[1px] opacity-[0.9] mb-[0.5rem] flex items-center justify-center gap-[0.3rem]">
                                <Flame size={14} /> Carga de Fuego Qf
                            </div>
                            <div className="text-[3rem] font-[900] text-shadow-[0_2px_10px_rgba(0,0,0,0.2)] line-height-[1]">{(results.cargaDeFuego || 0).toFixed(2)}</div>
                            <div className="text-[0.85rem] font-[700] opacity-[0.95] mt-[0.5rem]">Kg de Madera / m²</div>
                        </div>

                        <div className="glass-card p-[1.25rem] rounded-[var(--radius-xl)] flex flex-col gap-[0.75rem] bg-[var(--color-surface)] border-top-[1px_solid_var(--glass-border-subtle)] border-right-[1px_solid_var(--glass-border-subtle)] border-bottom-[1px_solid_var(--glass-border-subtle)]" style={{ borderLeft: `5px solid ${threat.border}` }}>
                            <div className="flex justify-space-between items-center">
                                <span className="text-[var(--color-text-muted)] text-[0.8rem] font-[700] uppercase letter-spacing-[0.5px]">Riesgo Dominante:</span>
                                <span className="font-[900] bg-[var(--color-background)] p-[0.2rem_0.6rem] rounded-[8px] border-[1px_solid_var(--glass-border-subtle)] text-[0.85rem] text-[var(--color-text)]">{formData.riesgo}</span>
                            </div>
                            <div className="flex justify-space-between items-center">
                                <span className="text-[var(--color-text-muted)] text-[0.8rem] font-[700] uppercase letter-spacing-[0.5px]">Resistencia RF Requerida:</span>
                                <span style={{ color: threat.text }} className="font-[900] text-[1.15rem]">{results.rfRequerida}</span>
                            </div>
                            <div className="flex justify-space-between items-center border-top-[1px_solid_var(--glass-border-subtle)] pt-[0.5rem] mt-[0.25rem]">
                                <span className="text-[var(--color-text-muted)] text-[0.75rem] font-[700]">Nivel de Amenaza:</span>
                                <span style={{ color: threat.text }} className="text-[0.75rem] font-[800] uppercase flex items-center gap-[4px]">
                                    <span style={{ background: threat.border }} className="w-[6px] h-[6px] rounded-[50%] inline-block"></span>
                                    {threat.label}
                                </span>
                            </div>
                        </div>

                        <div className="glass-card p-[1.5rem] rounded-[var(--radius-xl)] border-[1px_solid_var(--glass-border)] bg-[var(--color-surface)]">
                            <h4 className="m-[0_0_1rem_0] text-[0.95rem] font-[900] flex items-center gap-[0.5rem] text-[#ea580c]">
                                <ShieldCheck size={18} /> Resultados del Cálculo
                            </h4>
                            <div className="flex flex-col gap-[0.8rem] text-[0.85rem]">
                                <div className="flex justify-space-between border-bottom-[1px_solid_var(--glass-border-subtle)] pb-[0.4rem]">
                                    <span className="text-[var(--color-text-muted)] font-[600]">Carga Térmica Total</span>
                                    <span className="font-[800] text-[var(--color-text)]">{Math.round(results.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                                </div>
                                <div className="flex justify-space-between border-bottom-[1px_solid_var(--glass-border-subtle)] pb-[0.4rem]">
                                    <span className="text-[var(--color-text-muted)] font-[600]">Madera Equivalente</span>
                                    <span className="font-[800] text-[var(--color-text)]">{(results.maderaEquivalente || 0).toFixed(2)} Kg</span>
                                </div>
                                <div className="flex justify-space-between border-bottom-[1px_solid_var(--glass-border-subtle)] pb-[0.4rem]">
                                    <span className="text-[var(--color-text-muted)] font-[600]">Superficie Sector</span>
                                    <span className="font-[800] text-[var(--color-text)]">{formData.superficie} m²</span>
                                </div>
                                <div className="flex justify-space-between border-bottom-[1px_solid_var(--glass-border-subtle)] pb-[0.4rem]">
                                    <span className="text-[var(--color-text-muted)] font-[600]">Riesgo Dominante</span>
                                    <span className="font-[800] text-[#f97316]">{formData.riesgo}</span>
                                </div>
                                <div className="flex justify-space-between border-bottom-[1px_solid_var(--glass-border-subtle)] pb-[0.4rem]">
                                    <span className="text-[var(--color-text-muted)] font-[600]">RF Mínima Requerida</span>
                                    <span style={{ color: threat.text }} className="font-[800]">{results.rfRequerida}</span>
                                </div>
                                <div className="flex justify-space-between mt-[0.5rem] bg-[rgba(249,_115,_22,_0.05)] p-[0.6rem_0.8rem] rounded-[10px] border-[1px_solid_rgba(249,115,22,0.15)]">
                                    <span className="font-[700] text-[var(--color-text)] text-[0.8rem]">Extintores ABC Sugeridos</span>
                                    <span className="font-[900] text-[#f97316] text-[0.85rem]">{results.minMatafuegos} u.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INVENTARIO PARA IMPRESIÓN */}
                <div className="print-area print-only block p-[2rem] mt-[1.5rem] border-[1px_solid_#000]">
                    <h3 className="mt-[0] mb-[1.5rem] flex items-center gap-[0.7rem] text-[#000000] text-[1.2rem] font-[900]">
                        <Flame size={20} color="#000000" /> Inventario de Materiales Combustibles
                    </h3>

                    <div className="overflow-x-auto w-full">
                        <table className="w-[100%] border-collapse-[collapse] text-left text-[0.9rem]">
                            <thead>
                                <tr className="bg-[#f1f5f9] border-bottom-[2px_solid_#000]">
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800] w-[40%]">Material</th>
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800] w-[20%]">Peso (Kg)</th>
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800] w-[20%]">Poder Calorífico</th>
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800] w-[20%]">Total Calorías</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.materiales || []).map((m, idx) =>
                    <tr key={idx} className="border-bottom-[1px_solid_#cbd5e1]">
                                        <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[600]">{m.nombre || 'Sin nombre'}</td>
                                        <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">{m.peso} Kg</td>
                                        <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">{m.poderCalorifico} Mcal/Kg</td>
                                        <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[700]">{Math.round(m.totalKcal || 0).toLocaleString()} Kcal</td>
                                    </tr>
                    )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TABLA DE RESULTADOS PARA IMPRESIÓN */}
                <div className="print-area print-only block p-[2rem] mt-[2.5rem] border-[1px_solid_#000]">
                    <h3 className="mt-[0] mb-[1.5rem] flex items-center gap-[0.7rem] text-[#000000] text-[1.2rem] font-[900]">
                        Resultados Finales del Cálculo
                    </h3>

                    <div className="overflow-x-auto w-full mb-8">
                        <table className="w-[100%] border-collapse-[collapse] text-left text-[0.9rem]">
                            <thead>
                                <tr className="bg-[#f1f5f9] border-bottom-[2px_solid_#000]">
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800]">Parámetro</th>
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800]">Valor Obtenido</th>
                                    <th className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800]">Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">Carga de Fuego (Qf)</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[700]">{results.cargaDeFuego.toFixed(2)}</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">kg/m² (madera equiv.)</td>
                                </tr>
                                <tr>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">Poder Calorífico Total</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[700]">{Math.round(results.cargaTermicaTotal * 4.184).toLocaleString()}</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">kJ</td>
                                </tr>
                                <tr>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">Nivel de Riesgo</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800]">{formData.riesgo}</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">-</td>
                                </tr>
                                <tr>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">Resistencia al Fuego (RF) Requerida</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1] font-[800]">{results.rfRequerida}</td>
                                    <td className="p-[0.8rem] border-[1px_solid_#cbd5e1]">minutos</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mt-[1rem]">
                        <div className="p-[1rem] border-[1px_solid_#cbd5e1] rounded-[8px]">
                            <h4 className="m-[0_0_0.5rem_0] font-[800] text-[0.9rem]">Resumen Técnico</h4>
                            <div className="text-[0.8rem] flex flex-col gap-[0.4rem]">
                                <div className="flex justify-space-between">
                                    <span>Calor Total:</span>
                                    <span className="font-[700]">{Math.round(results.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                                </div>
                                <div className="flex justify-space-between">
                                    <span>Madera Eq:</span>
                                    <span className="font-[700]">{(results.maderaEquivalente || 0).toFixed(2)} Kg</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-[1rem] border-[1px_solid_#cbd5e1] rounded-[8px] bg-[#f8fafc]">
                            <h4 className="m-[0_0_0.5rem_0] font-[800] text-[0.9rem]">Protección Requerida</h4>
                            <div className="text-[0.8rem] flex flex-col gap-[0.4rem]">
                                <div className="flex justify-space-between">
                                    <span>Matafuegos (Mín.):</span>
                                    <span className="font-[800]">{results.minMatafuegos} unidades</span>
                                </div>
                                <div className="flex justify-space-between">
                                    <span>Tipo Sugerido:</span>
                                    <span className="font-[700]">ABC (Polvo)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE CONCLUSIÓN */}
                <ModuleFormSection title="Conclusión Profesional" icon={<FileText size={22} className="text-purple-500" />}>
                        <div className="flex justify-space-between items-center mb-[1.5rem] flex-wrap gap-[1rem]">
                        <button
                  className="no-print p-[0.65rem_1.25rem] bg-[linear-gradient(135deg,_#a855f7,_#ec4899)] box-shadow-[0_4px_15px_rgba(168,_85,_247,_0.25)] text-[#ffffff] border-none rounded-[12px] font-[800] text-[0.75rem] flex items-center gap-[0.5rem] transition-[all_0.2s] outline-[none]"
                  onClick={handleGenerateConclusion}
                  disabled={isGeneratingConclusion}
                  style={{
                    cursor: isGeneratingConclusion ? 'wait' : 'pointer'
                  }}
                  onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-1px)';e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.35)';}}
                  onMouseLeave={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.25)';}}>
                  
                            {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGeneratingConclusion ? 'REDACTANDO CONCLUSIÓN IA...' : 'REDACTAR CON IA'}
                        </button>
                    </div>

                    <textarea
                value={formData.conclusion || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, conclusion: e.target.value }))}
                className="form-input no-print fireload-focus-glow w-[100%] p-[1rem] rounded-[12px] border-[1px_solid_var(--glass-border)] bg-[var(--color-surface)] text-[var(--color-text)] min-h-[120px] resize-[vertical] font-family-[inherit] transition-[all_0.2s]"
                placeholder="Escriba la conclusión del estudio o use el botón de IA para generarla..." />
              

                    {formData.conclusion &&
              <div className="print-only text-slate-800 text-[0.85rem] whitespace-pre-wrap leading-relaxed border-[1px_solid_#cbd5e1] p-[1rem] rounded-[8px] mt-[1rem] bg-[#f8fafc]">
                            {formData.conclusion}
                        </div>
              }
                </ModuleFormSection>

                {/* SECCIÓN DE FIRMAS */}
                <ModuleFormSection title="Firmas y Validación" icon={<ShieldCheck size={22} className="text-green-500" />}>

                    <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                        <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-4">
                            <button
                    onClick={() => setShowSignatures((s) => ({ ...s, operator: !s.operator }))}
                    className={`fireload-signature-pill ${showSignatures.operator ? 'fireload-signature-pill-active' : ''}`}>
                    
                                <span style={{ background: showSignatures.operator ? '#f97316' : '#94a3b8' }} className="w-[8px] h-[8px] rounded-[50%] inline-block"></span>
                                Operador
                            </button>
                            <button
                    onClick={() => setShowSignatures((s) => ({ ...s, supervisor: !s.supervisor }))}
                    className={`fireload-signature-pill ${showSignatures.supervisor ? 'fireload-signature-pill-active' : ''}`}>
                    
                                <span style={{ background: showSignatures.supervisor ? '#f97316' : '#94a3b8' }} className="w-[8px] h-[8px] rounded-[50%] inline-block"></span>
                                Supervisor
                            </button>
                            <button
                    onClick={() => setShowSignatures((s) => ({ ...s, professional: !s.professional }))}
                    className={`fireload-signature-pill ${showSignatures.professional ? 'fireload-signature-pill-active' : ''}`}>
                    
                                <span style={{ background: showSignatures.professional ? '#f97316' : '#94a3b8' }} className="w-[8px] h-[8px] rounded-[50%] inline-block"></span>
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
                box2={showSignatures.professional ? undefined : null} />
              
                    <PdfBrandingFooter />
                </ModuleFormSection>
                </ModuleFormDocument>
            </ModuleFormLayout>
            <ModuleActionBar actions={[
                { id: 'cancel', label: 'CANCELAR', icon: <ArrowLeft size={18} />, variant: 'secondary', onClick: () => { setShowForm(false); } },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShowShare(true)) },
                { id: 'print', label: 'IMPRIMIR', icon: <Printer size={18} />, variant: 'secondary', onClick: handlePrint },
                { id: 'save', label: 'GUARDAR FICHA', icon: <Save size={18} />, variant: 'primary', onClick: () => requirePro(() => handleSave()) }
            ]} />
            </div>
            </>
      }
        </div>);

}