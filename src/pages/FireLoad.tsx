import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Flame, Calculator,
  FileText, Printer, Building2, Layout, Maximize2,
  Info, TriangleAlert, AlertTriangle, ShieldCheck, History, Share2, Sparkles, Loader2, Calendar, QrCode, Search,
  Download, Droplets, Wind
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
import { getErrorMessage } from '../utils/errorUtils';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { getCountryNormativa } from '../data/legislationData';
import { DataTable } from '../components/DataTable';
import QRModal from '../components/QRModal';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import SignatureCanvas from '../components/SignatureCanvas';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar, ModuleWizardFooter } from '../components/module';
import FireLoadCalculatorWidget from '../components/FireLoadCalculatorWidget';
import { evaluateFullFireLoadProtocol } from '../utils/srtProtocols';
import type { 
  FireLoadAssessmentProtocol, 
  FireLoadEvaluationMetrics, 
  FireMaterialItem, 
  FireRiskLevel, 
  FireVentilationType 
} from '../types/fireload';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar estudio de Carga de Fuego?"
      message="Esta acción no se puede deshacer. Se removerá del historial local."
      iconEmoji="🗑️"
    />
  );
}

export default function FireLoad(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection, syncPulse } = useSync();

  const editData = location.state?.editData;
  useDocumentTitle(editData ? 'Editar Estudio de Carga de Fuego' : 'Estudio Oficial Carga de Fuego — Dec. 351/79 Anexo VII');

  const [showForm, setShowForm] = useState(!!editData);
  const [history, setHistory] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  useEffect(() => {
    const historyRaw = localStorage.getItem('fireload_history');
    if (historyRaw) {
      try {
        setHistory(JSON.parse(historyRaw));
      } catch (e) {
        console.error('[FireLoad] Error parsing history:', e);
      }
    }
  }, [syncPulse]);

  const confirmDelete = () => {
    const updated = history.filter((item: any) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('fireload_history', JSON.stringify(updated));
    syncCollection('fireload_history', updated);
    setDeleteTarget(null);
    toast.success('Estudio de Carga de Fuego eliminado.');
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

  // Autocompletado de metadatos de empresa desde localStorage
  const getInitialCompanyDefaults = () => {
    try {
      const savedCompany = localStorage.getItem('companyData');
      const savedPersonal = localStorage.getItem('personalData');
      const comp = savedCompany ? JSON.parse(savedCompany) : {};
      const pers = savedPersonal ? JSON.parse(savedPersonal) : {};
      return {
        cuit: comp.cuit || pers.cuit || '',
        razonSocial: comp.name || comp.razonSocial || pers.company || '',
        direccion: comp.address || pers.address || '',
        localidad: comp.city || pers.city || 'Buenos Aires',
        art: comp.art || pers.art || 'Asociart ART',
        establecimiento: comp.branch || 'Planta Principal'
      };
    } catch {
      return { cuit: '', razonSocial: '', direccion: '', localidad: '', art: '', establecimiento: '' };
    }
  };

  const initialDefaults = getInitialCompanyDefaults();

  const [formData, setFormData] = useState<any>(() => {
    if (editData) {
      return {
        ...editData,
        cuit: editData.cuit || editData.empresaCuit || initialDefaults.cuit,
        razonSocial: editData.razonSocial || editData.empresa || initialDefaults.razonSocial,
        empresa: editData.empresa || editData.razonSocial || initialDefaults.razonSocial,
        direccion: editData.direccion || editData.obra || initialDefaults.direccion,
        localidad: editData.localidad || initialDefaults.localidad,
        art: editData.art || initialDefaults.art,
        establecimiento: editData.establecimiento || initialDefaults.establecimiento,
        sector: editData.sector || '',
        superficie: editData.superficie || 100,
        ventilacion: editData.ventilacion || 'natural',
        actividadResumen: editData.actividadResumen || '',
        descripcionActividad: editData.descripcionActividad || '',
        actividadGrupo: editData.actividadGrupo || 'industrial',
        riesgo: editData.riesgo || 'R4',
        conclusion: editData.conclusion || '',
        materiales: editData.materiales || [{ nombre: 'Madera (General)', peso: 500, poderCalorifico: 4400 }],
        operatorSignature: editData.operatorSignature || '',
        supervisorSignature: editData.supervisorSignature || '',
        fecha: editData.fecha || new Date().toISOString().split('T')[0],
        id: editData.id || ''
      };
    }

    return {
      cuit: initialDefaults.cuit,
      razonSocial: initialDefaults.razonSocial,
      empresa: initialDefaults.razonSocial,
      direccion: initialDefaults.direccion,
      localidad: initialDefaults.localidad,
      art: initialDefaults.art,
      establecimiento: initialDefaults.establecimiento,
      sector: '',
      superficie: 150,
      ventilacion: 'natural',
      actividadResumen: 'Depósito e Instalaciones Generales',
      descripcionActividad: '',
      actividadGrupo: 'industrial',
      riesgo: 'R4',
      conclusion: '',
      fecha: new Date().toISOString().split('T')[0],
      materiales: [
        { nombre: 'Madera (General)', peso: 600, poderCalorifico: 4400 },
        { nombre: 'Papel y Cartón', peso: 400, poderCalorifico: 4000 },
        { nombre: 'Plástico (Polietileno)', peso: 150, poderCalorifico: 11000 }
      ],
      operatorSignature: '',
      supervisorSignature: '',
      id: ''
    };
  });

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

  useEffect(() => {
    try {
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

      let profData = {
        name: 'Profesional H&S',
        license: '',
        signature: signature,
        stamp: stamp
      };

      if (savedData) {
        const data = JSON.parse(savedData);
        profData.name = data.name || 'Profesional H&S';
        profData.license = data.license || '';
      }

      setProfessional(profData);
    } catch (error) {
      console.error('Error loading professional data:', error);
    }
  }, []);

  // Motor unificado de cálculo Decreto 351/79 Anexo VII
  const [evalMetrics, setEvalMetrics] = useState<FireLoadEvaluationMetrics>(() => {
    return evaluateFullFireLoadProtocol({
      superficie: Number(formData.superficie) || 1,
      riesgo: formData.riesgo as FireRiskLevel,
      ventilacion: formData.ventilacion as FireVentilationType,
      materiales: formData.materiales
    });
  });

  // Actualizar riesgo cuando cambia el grupo de actividad
  useEffect(() => {
    if (Array.isArray(riskActivityGroups)) {
      const group = riskActivityGroups.find(
        (g) => g.id === formData.actividadGrupo || g.label === formData.actividadGrupo
      );
      if (group) {
        setFormData((prev: any) => ({ ...prev, riesgo: group.defaultR || 'R4' }));
      }
    }
  }, [formData.actividadGrupo]);

  // Recalcular todo cuando cambian materiales, superficie, riesgo o ventilación
  useEffect(() => {
    const res = evaluateFullFireLoadProtocol({
      superficie: Number(formData.superficie) || 1,
      riesgo: formData.riesgo as FireRiskLevel,
      ventilacion: formData.ventilacion as FireVentilationType,
      materiales: formData.materiales
    });
    setEvalMetrics(res);
  }, [formData.materiales, formData.superficie, formData.riesgo, formData.ventilacion]);

  const handleMaterialChange = (idx: number, field: string, value: any) => {
    const updated = [...(formData.materiales || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'nombre') {
      const found = fireMaterials.find(fm => fm.nombre.toLowerCase() === value.toLowerCase());
      if (found) {
        updated[idx].poderCalorifico = found.poderCalorifico;
      }
    }
    setFormData({ ...formData, materiales: updated });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materiales: [
        ...(formData.materiales || []),
        { nombre: 'Madera (General)', peso: 0, poderCalorifico: 4400 }
      ]
    });
  };

  const removeMaterial = (idx: number) => {
    const updated = formData.materiales.filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, materiales: updated });
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
          reportType: 'Cálculo de Carga de Fuego (Decreto 351/79 Anexo VII)',
          reportData: {
            empresa: formData.razonSocial || formData.empresa,
            cuit: formData.cuit,
            sector: formData.sector,
            superficie: `${formData.superficie} m²`,
            riesgo: formData.riesgo,
            ventilacion: formData.ventilacion,
            cargaFuego: `${evalMetrics.cargaFuegoKgM2} kg/m²`,
            resistenciaRequerida: evalMetrics.resistenciaFuegoRequerida,
            extintores: `${evalMetrics.minExtintores} extintores (${evalMetrics.potencialExtintorNominal})`,
            redHidrantes: evalMetrics.requiereRedHidrantes ? 'EXIGIDA (Condición E1)' : 'No exigida',
            rociadores: evalMetrics.requiereRociadoresAutomaticos ? 'EXIGIDOS (Condición E2)' : 'No exigidos'
          }
        })
      });

      if (!res.ok) throw new Error('Error al contactar con el servicio de IA');
      const data = await res.json();
      setFormData((prev: any) => ({ ...prev, conclusion: data.conclusion }));
      toast.success('Conclusión técnica generada', { id: loadingToast });
    } catch (err) {
      // Fallback local robusto
      const fallback = `MEMORIA TÉCNICA Y CONCLUSIÓN (Decreto 351/79 Anexo VII):
El sector "${formData.sector || 'Principal'}" de la empresa "${formData.razonSocial || formData.empresa}" posee una superficie de ${formData.superficie} m² con ventilación ${formData.ventilacion === 'natural' ? 'natural' : 'no ventilada/mecánica'}.
La Carga de Fuego ponderada resultante es de ${evalMetrics.cargaFuegoKgM2} kg/m² de madera equivalente (Riesgo ${formData.riesgo}).
Se establece una resistencia al fuego reglamentaria para muros y estructuras de ${evalMetrics.resistenciaFuegoRequerida} (Tabla 2.2.1 Anexo VII).
Se exige dotar el sector con un mínimo de ${evalMetrics.minExtintores} extintores manuales de polvo químico seco ABC con potencial no menor a ${evalMetrics.potencialExtintorNominal} a distancias no mayores a ${evalMetrics.distanciaMaximaRecorridoMetros} m (Condición E4).
${evalMetrics.requiereRedHidrantes ? 'Se requiere instalación fija de agua presurizada contra incendios / red de hidrantes (Condición E1).' : ''}
${evalMetrics.requiereRociadoresAutomaticos ? 'Por densidad de carga térmica elevada se requiere sistema de rociadores automáticos (Condición E2).' : ''}`;

      setFormData((prev: any) => ({ ...prev, conclusion: fallback }));
      toast.success('Memoria técnica generada localmente', { id: loadingToast });
    } finally {
      setIsGeneratingConclusion(false);
    }
  };

  const handlePrint = () => {
    requirePro(() => {
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  const handleSave = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!formData.sector?.trim()) {
      toast.error('Debe indicar el nombre del sector de incendio.');
      return;
    }

    try {
      const historyRaw = localStorage.getItem('fireload_history');
      const histList = historyRaw ? JSON.parse(historyRaw) : [];

      const fullProtocol: FireLoadAssessmentProtocol & Record<string, any> = {
        ...formData,
        id: formData.id || Date.now().toString(),
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        normativa: 'Decreto 351/79 Anexo VII',
        cuit: formData.cuit,
        razonSocial: formData.razonSocial || formData.empresa,
        empresa: formData.razonSocial || formData.empresa,
        direccion: formData.direccion,
        localidad: formData.localidad,
        art: formData.art,
        establecimiento: formData.establecimiento,
        sector: formData.sector,
        superficie: Number(formData.superficie) || 1,
        ventilacion: formData.ventilacion,
        actividadGrupo: formData.actividadGrupo,
        actividadResumen: formData.actividadResumen,
        descripcionActividad: formData.descripcionActividad,
        riesgo: formData.riesgo,
        materiales: formData.materiales,
        metricas: evalMetrics,

        // Compatibilidad hacia atrás
        results: {
          cargaTermicaTotal: evalMetrics.cargaTermicaTotalKcal,
          maderaEquivalente: evalMetrics.maderaEquivalenteKg,
          cargaDeFuego: evalMetrics.cargaFuegoKgM2,
          cargaFuego: evalMetrics.cargaFuegoKgM2,
          rfRequerida: evalMetrics.resistenciaFuegoRequerida,
          resistenciaRequerida: evalMetrics.resistenciaFuegoRequerida,
          minMatafuegos: evalMetrics.minExtintores,
          cantidadMatafuegos: evalMetrics.minExtintores,
          potencialExtintor: evalMetrics.potencialExtintorNominal,
          requiereRedHidrantes: evalMetrics.requiereRedHidrantes,
          requiereRociadoresAutomaticos: evalMetrics.requiereRociadoresAutomaticos
        },

        conclusion: formData.conclusion,
        professionalName: professional.name,
        professionalLicense: professional.license,
        professionalSignature: professional.signature,
        professionalStamp: professional.stamp,
        operatorSignature: formData.operatorSignature,
        supervisorSignature: formData.supervisorSignature,
        showSignatures,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let newHistory;
      if (formData.id) {
        newHistory = histList.map((item: any) => item.id === formData.id ? fullProtocol : item);
      } else {
        newHistory = [fullProtocol, ...histList];
      }

      localStorage.setItem('fireload_history', JSON.stringify(newHistory));
      await syncCollection('fireload_history', newHistory);
      toast.success('Estudio de Carga de Fuego guardado con éxito.');
      setHistory(newHistory);
      setShowForm(false);
      window.scrollTo(0, 0);
    } catch (error) {
      toast.error('Error al guardar: ' + getErrorMessage(error));
    }
  };

  const exportCsv = () => {
    if (!history.length) {
      toast.error('No hay datos registrados para exportar.');
      return;
    }
    const headers = [
      'Fecha', 'CUIT', 'Razon Social', 'Sector', 'Superficie (m2)', 'Ventilacion',
      'Riesgo', 'Total Kcal', 'Madera Eq (kg)', 'Qf (kg/m2)', 'Resistencia F Requerida',
      'Extintores Minimos', 'Potencial Extintor', 'Red Hidrantes (E1)', 'Rociadores (E2)'
    ];
    const rows = history.map((item) => {
      const met = item.metricas || item.results || {};
      return [
        item.fecha || item.createdAt ? new Date(item.fecha || item.createdAt).toLocaleDateString('es-AR') : '',
        `"${item.cuit || item.empresaCuit || ''}"`,
        `"${item.razonSocial || item.empresa || ''}"`,
        `"${item.sector || ''}"`,
        item.superficie || '',
        `"${item.ventilacion || 'natural'}"`,
        `"${item.riesgo || met.clasificacionRiesgo || ''}"`,
        met.cargaTermicaTotalKcal ?? met.cargaTermicaTotal ?? '',
        met.maderaEquivalenteKg ?? met.maderaEquivalente ?? '',
        met.cargaFuegoKgM2 ?? met.cargaDeFuego ?? '',
        `"${met.resistenciaFuegoRequerida || met.rfRequerida || ''}"`,
        met.minExtintores ?? met.cantidadMatafuegos ?? met.minMatafuegos ?? 2,
        `"${met.potencialExtintorNominal || met.potencialExtintor || ''}"`,
        met.requiereRedHidrantes ? 'SI' : 'NO',
        met.requiereRociadoresAutomaticos ? 'SI' : 'NO'
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Carga_de_Fuego_Dec351_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV oficial exportado.');
  };

  const filteredHistory = history.filter((e: any) => {
    const matchesSearch =
      (e.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.razonSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.cuit || '').includes(searchTerm) ||
      (e.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === '' || (e.empresa === filterEmpresa || e.razonSocial === filterEmpresa);
    return matchesSearch && matchesEmpresa;
  });

  const columns = [
    {
      header: 'Fecha',
      accessor: 'createdAt',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs whitespace-nowrap">
          <Calendar size={14} className="text-slate-400" />
          {item.fecha ? new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : 'S/F')}
        </span>
      )
    },
    {
      header: 'Empresa / CUIT',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <div>
          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Flame size={15} className="text-orange-500" />
            {item.razonSocial || item.empresa || 'Sin nombre'}
          </div>
          {item.cuit && (
            <div className="text-[11px] font-mono text-slate-400">CUIT: {item.cuit}</div>
          )}
        </div>
      )
    },
    {
      header: 'Sector',
      accessor: 'sector',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-xs">
          <Building2 size={14} className="text-slate-400" />
          {item.sector || 'N/A'} ({item.superficie || 0} m²)
        </span>
      )
    },
    {
      header: 'Carga Qf & Resistencia',
      accessor: 'results',
      render: (item: any) => {
        const qf = item.metricas?.cargaFuegoKgM2 ?? item.results?.cargaDeFuego ?? 0;
        const rf = item.metricas?.resistenciaFuegoRequerida ?? item.results?.rfRequerida ?? 'F30';
        return (
          <div>
            <div className="text-sm font-black text-orange-600 dark:text-orange-400">
              {Number(qf).toFixed(2)} <span className="text-[10px] font-bold text-slate-500">kg/m²</span>
            </div>
            <div className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase">
              Resistencia: {rf}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Extintores Exigidos',
      accessor: 'id',
      render: (item: any) => {
        const ext = item.metricas?.minExtintores ?? item.results?.minMatafuegos ?? 2;
        const pot = item.metricas?.potencialExtintorNominal ?? item.results?.potencialExtintor ?? '2A-10B:C';
        return (
          <div>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              {ext} unidades ABC
            </span>
            <div className="text-[10px] font-bold text-slate-500 font-mono">
              Potencial: {pot}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setFormData(item);
              if (item.showSignatures) setShowSignatures(item.showSignatures);
              setShowForm(true);
              window.scrollTo(0, 0);
            }}
            title="Editar Estudio"
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => requirePro(() => {
              const url = `${window.location.origin}/v/${currentUser?.uid}/fireload/${item.id}?print=true`;
              setQrTarget({ text: url, title: `Carga de Fuego — ${item.sector}` });
            })}
            title="Código QR"
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <QrCode size={14} />
          </button>
          <button
            onClick={() => requirePro(() => setShareItem(item))}
            title="Compartir / PDF"
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(item.id)}
            title="Eliminar"
            className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-4 pb-32">
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
      
      <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Carga de Fuego — ${(shareItem as any)?.sector || ''}`}
        text={shareItem ? `🔥 Estudio Técnico de Carga de Fuego (Decreto 351/79 Anexo VII)\n🏢 Empresa: ${(shareItem as any).razonSocial || (shareItem as any).empresa}\n📍 Sector: ${(shareItem as any).sector}\n🔥 Carga Qf: ${((shareItem as any).metricas?.cargaFuegoKgM2 ?? (shareItem as any).results?.cargaDeFuego ?? 0).toFixed(2)} kg/m²\n🛡️ Resistencia: ${(shareItem as any).metricas?.resistenciaFuegoRequerida ?? (shareItem as any).results?.rfRequerida}\n🧯 Extintores: ${(shareItem as any).metricas?.minExtintores ?? (shareItem as any).results?.minMatafuegos ?? 2} unidades (${(shareItem as any).metricas?.potencialExtintorNominal ?? (shareItem as any).results?.potencialExtintor ?? '2A-10B:C'})\n\nGenerado con Asistente H&S` : ''}
        rawMessage=""
        elementIdToPrint="pdf-content"
        fileName={`Carga_de_Fuego_${(shareItem as any)?.sector || 'Estudio'}.pdf`}
      />

      <div className="absolute left-0 opacity-[0.001] top-[-9999px] pointer-events-none">
        {shareItem && (
          <FireLoadPdfGenerator
            data={{
              ...shareItem,
              professionalSignature: (shareItem as any).professionalSignature || professional?.signature,
              professionalStamp: (shareItem as any).professionalStamp || professional?.stamp,
              professionalName: (shareItem as any).professionalName || professional?.name,
              professionalLicense: (shareItem as any).professionalLicense || professional?.license
            }}
          />
        )}
      </div>

      {!showForm ? (
        /* ─── VISTA 1: LISTADO DE HISTORIAL ─── */
        <div className="animate-fade-in space-y-6">
          <PremiumHeader
            title="Estudios de Carga de Fuego"
            subtitle={`Cálculo y Memoria Técnica según Decreto 351/79 Anexo VII • ${history.length} relevamientos`}
            icon={<Flame size={36} className="text-white" />}
          />

          <div className="flex flex-wrap gap-3 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-[240px] relative">
              <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por empresa, CUIT o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px]"
            >
              <option value="">Todas las empresas</option>
              {Array.from(new Set(history.map((h: any) => h.razonSocial || h.empresa).filter(Boolean))).map((empresa: string) => (
                <option key={empresa} value={empresa}>{empresa}</option>
              ))}
            </select>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={exportCsv}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Download size={15} /> Exportar CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    cuit: initialDefaults.cuit,
                    razonSocial: initialDefaults.razonSocial,
                    empresa: initialDefaults.razonSocial,
                    direccion: initialDefaults.direccion,
                    localidad: initialDefaults.localidad,
                    art: initialDefaults.art,
                    establecimiento: initialDefaults.establecimiento,
                    sector: '',
                    superficie: 150,
                    ventilacion: 'natural',
                    actividadResumen: 'Depósito e Instalaciones Generales',
                    descripcionActividad: '',
                    actividadGrupo: 'industrial',
                    riesgo: 'R4',
                    conclusion: '',
                    fecha: new Date().toISOString().split('T')[0],
                    materiales: [
                      { nombre: 'Madera (General)', peso: 600, poderCalorifico: 4400 },
                      { nombre: 'Papel y Cartón', peso: 400, poderCalorifico: 4000 },
                      { nombre: 'Plástico (Polietileno)', peso: 150, poderCalorifico: 11000 }
                    ],
                    operatorSignature: '',
                    supervisorSignature: '',
                    id: ''
                  });
                  setShowForm(true);
                  window.scrollTo(0, 0);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={2.5} /> Nuevo Cálculo
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <DataTable
              data={filteredHistory}
              columns={columns}
              searchPlaceholder="Buscar en historial..."
              searchFields={['empresa', 'razonSocial', 'cuit', 'sector']}
              emptyMessage="No se encontraron estudios de carga de fuego registrados."
              emptyIcon={<Flame size={48} className="text-orange-500" />}
            />
          </div>
        </div>
      ) : (
        /* ─── VISTA 2: FORMULARIO Y EDITOR DE CÁLCULO ─── */
        <>
          <div id="fireload-pdf-form" className="print-only">
            <FireLoadPdfGenerator
              data={{
                ...formData,
                metricas: evalMetrics,
                results: {
                  cargaTermicaTotal: evalMetrics.cargaTermicaTotalKcal,
                  maderaEquivalente: evalMetrics.maderaEquivalenteKg,
                  cargaDeFuego: evalMetrics.cargaFuegoKgM2,
                  cargaFuego: evalMetrics.cargaFuegoKgM2,
                  rfRequerida: evalMetrics.resistenciaFuegoRequerida,
                  resistenciaRequerida: evalMetrics.resistenciaFuegoRequerida,
                  minMatafuegos: evalMetrics.minExtintores,
                  cantidadMatafuegos: evalMetrics.minExtintores,
                  potencialExtintor: evalMetrics.potencialExtintorNominal,
                  requiereRedHidrantes: evalMetrics.requiereRedHidrantes,
                  requiereRociadoresAutomaticos: evalMetrics.requiereRociadoresAutomaticos
                },
                showSignatures,
                professionalSignature: professional?.signature,
                professionalStamp: professional?.stamp,
                professionalName: professional?.name,
                professionalLicense: professional?.license
              }}
            />
          </div>

          <div className="no-print animate-fade-in space-y-6">
            <ModuleFormLayout>
              <ModuleFormToolbar
                title={editData ? 'Editar Carga de Fuego' : 'Estudio Oficial de Carga de Fuego'}
                subtitle="Decreto PEN N° 351/79 Anexo VII • Capítulo 18: Protección contra Incendios"
                icon={<Flame size={28} className="text-orange-500" />}
              />

              <div className="space-y-6">
                {/* Widget de Cálculo Interactivo */}
                <FireLoadCalculatorWidget
                  superficie={formData.superficie}
                  riesgo={formData.riesgo as any}
                  materiales={formData.materiales}
                  onConclusionGenerated={(memoria) => {
                    setFormData((prev: any) => ({ ...prev, conclusion: memoria }));
                  }}
                />

                {/* 1. Datos del Establecimiento */}
                <ModuleFormSection title="1. Datos de la Empresa y Establecimiento" icon={<Building2 size={20} className="text-blue-500" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">C.U.I.T. N°</label>
                      <input
                        type="text"
                        value={formData.cuit}
                        onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                        placeholder="30-12345678-9"
                        className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Razón Social</label>
                      <input
                        type="text"
                        value={formData.razonSocial}
                        onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value, empresa: e.target.value })}
                        placeholder="Ej. Logística y Depósitos del Plata S.A."
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">A.R.T.</label>
                      <input
                        type="text"
                        value={formData.art}
                        onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                        placeholder="Asociart ART"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Domicilio / Ubicación de Planta</label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Av. Industrial 4500"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Localidad</label>
                      <input
                        type="text"
                        value={formData.localidad}
                        onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                        placeholder="Buenos Aires"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Fecha del Relevamiento</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </ModuleFormSection>

                {/* 2. Datos del Sector de Incendio */}
                <ModuleFormSection title="2. Características del Sector de Incendio" icon={<Building2 size={20} className="text-orange-500" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Sector / Área Evaluada *</label>
                      <input
                        type="text"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ej. Depósito Central de Mercaderías"
                        className="w-full text-xs font-black p-2.5 rounded-xl border border-orange-300 dark:border-orange-700 bg-orange-50/20 text-orange-950 dark:text-orange-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Superficie del Sector (m²) *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.superficie}
                        onChange={(e) => setFormData({ ...formData, superficie: Math.max(1, parseFloat(e.target.value) || 0) })}
                        className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Ventilación del Local</label>
                      <select
                        value={formData.ventilacion}
                        onChange={(e) => setFormData({ ...formData, ventilacion: e.target.value })}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="natural">Ventilado Naturalmente (≥ 1/30 S)</option>
                        <option value="sin_ventilacion">Sin Ventilación Natural / Subsuelo</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Actividad / Destino</label>
                      <input
                        type="text"
                        value={formData.actividadResumen}
                        onChange={(e) => setFormData({ ...formData, actividadResumen: e.target.value })}
                        placeholder="Ej. Depósito y logística de productos terminados"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Grupo de Actividad</label>
                      <select
                        value={formData.actividadGrupo}
                        onChange={(e) => setFormData({ ...formData, actividadGrupo: e.target.value })}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        {(riskActivityGroups || []).map((g) => (
                          <option key={g.id} value={g.id}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Riesgo Dominante (Dec. 351/79)</label>
                      <select
                        value={formData.riesgo}
                        onChange={(e) => setFormData({ ...formData, riesgo: e.target.value })}
                        className="w-full text-xs font-black p-2.5 rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50/20 text-orange-900 dark:text-orange-300"
                      >
                        <option value="R1">R1 (Explosivo)</option>
                        <option value="R2">R2 (Inflamable)</option>
                        <option value="R3">R3 (Muy Combustible)</option>
                        <option value="R4">R4 (Combustible)</option>
                        <option value="R5">R5 (Poco Combustible)</option>
                      </select>
                    </div>
                  </div>
                </ModuleFormSection>

                {/* 3. Inventario de Materiales Combustibles */}
                <ModuleFormSection title="3. Inventario de Materiales Combustibles" icon={<Flame size={20} className="text-orange-500" />}>
                  <div className="space-y-3">
                    <datalist id="materialList">
                      {(fireMaterials || []).map((fm, i) => <option key={i} value={fm.nombre} />)}
                    </datalist>

                    {(formData.materiales || []).map((m: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl items-end">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Material #{idx + 1}</label>
                          <input
                            list="materialList"
                            value={m.nombre}
                            onChange={(e) => handleMaterialChange(idx, 'nombre', e.target.value)}
                            placeholder="Ej. Madera, Cartón, Plásticos..."
                            className="w-full text-xs font-bold p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                          <input
                            type="number"
                            min="0"
                            value={m.peso}
                            onChange={(e) => handleMaterialChange(idx, 'peso', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Poder Cal. (kcal/kg)</label>
                          <input
                            type="number"
                            min="0"
                            value={m.poderCalorifico}
                            onChange={(e) => handleMaterialChange(idx, 'poderCalorifico', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-mono p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeMaterial(idx)}
                            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addMaterial}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors"
                    >
                      <Plus size={16} /> Agregar Material Combustible
                    </button>
                  </div>
                </ModuleFormSection>

                {/* 4. Panel de Resultados Normativos Dec. 351/79 */}
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <ShieldCheck size={18} /> Resultados Técnicos Oficiales — Dec. 351/79 Anexo VII
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Qf = ∑(Pi · Ki) / (S · 4.400)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Carga de Fuego (Qf)</div>
                      <div className="text-2xl sm:text-3xl font-black text-orange-400 my-1">{evalMetrics.cargaFuegoKgM2}</div>
                      <div className="text-[10px] text-slate-400">kg Madera / m²</div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Resistencia Muros (F)</div>
                      <div className="text-2xl sm:text-3xl font-black text-red-400 my-1">{evalMetrics.resistenciaFuegoRequerida}</div>
                      <div className="text-[10px] text-slate-400">Minutos (Tabla 2.2.1)</div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Dotación Extintores</div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 my-1">{evalMetrics.minExtintores}</div>
                      <div className="text-[10px] text-slate-400">Unidades ABC (Mín. 2)</div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Potencial Extintor</div>
                      <div className="text-xl sm:text-2xl font-black text-purple-400 my-1">{evalMetrics.potencialExtintorNominal}</div>
                      <div className="text-[10px] text-slate-400">Clase A - Clase B:C</div>
                    </div>
                  </div>

                  {/* Alertas de Condiciones E1 / E2 */}
                  {evalMetrics.requiereRedHidrantes && (
                    <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-xs text-red-300 font-medium">
                      <Droplets size={20} className="text-red-400 shrink-0" />
                      <span><strong>Condición E1 Exigida:</strong> Por superficie ({formData.superficie} m²) o carga de fuego elevada, el establecimiento debe disponer de Red de Hidrantes con reserva de agua y motobomba.</span>
                    </div>
                  )}

                  {evalMetrics.requiereRociadoresAutomaticos && (
                    <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-center gap-3 text-xs text-purple-300 font-medium">
                      <AlertTriangle size={20} className="text-purple-400 shrink-0" />
                      <span><strong>Condición E2 Exigida:</strong> Por carga de fuego extrema ({evalMetrics.cargaFuegoKgM2} kg/m²), se exige protección por rociadores automáticos (Sprinklers).</span>
                    </div>
                  )}
                </div>

                {/* 5. Memoria Técnica y Conclusión */}
                <ModuleFormSection title="5. Memoria Descriptiva y Conclusiones" icon={<FileText size={20} className="text-purple-500" />}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">
                        Redacte o genere automáticamente la memoria para bomberos y habilitación.
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateConclusion}
                        disabled={isGeneratingConclusion}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingConclusion ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generar con IA
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={formData.conclusion}
                      onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                      placeholder="Redacte la memoria descriptiva de carga de fuego y dotación de extinción..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
                    />
                  </div>
                </ModuleFormSection>

                {/* 6. Firmas Digitales */}
                <ModuleFormSection title="6. Firmas y Conformidad Profesional" icon={<FileText size={20} className="text-blue-500" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showSignatures.professional && (
                      <SignatureCanvas
                        label="Firma de Profesional H&S Actuante"
                        initialImage={formData.professionalSignature || professional.signature}
                        onSave={(sig) => setProfessional((prev) => ({ ...prev, signature: sig || null }))}
                      />
                    )}
                    {showSignatures.supervisor && (
                      <SignatureCanvas
                        label="Firma de Responsable del Establecimiento"
                        initialImage={formData.supervisorSignature}
                        onSave={(sig) => setFormData({ ...formData, supervisorSignature: sig || '' })}
                      />
                    )}
                  </div>
                </ModuleFormSection>
              </div>

              {/* Botonera Flotante Inferior */}
              <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex justify-between items-center flex-wrap gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft size={16} /> Volver al Listado
                </button>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                  >
                    <Printer size={16} /> Imprimir / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => requirePro(handleSave)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Save size={16} /> Guardar Estudio
                  </button>
                </div>
              </div>
            </ModuleFormLayout>
          </div>
        </>
      )}
    </div>
  );
}