import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Plus, Trash2, Lightbulb, Calculator,
  FileText, Printer, Building2, Layout, Maximize2,
  Info, TriangleAlert, ShieldCheck, History, Share2, Sun, Sparkles, Loader2, Check,
  CheckCircle2, XCircle, Pencil, QrCode, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import AnimatedPage from '../components/AnimatedPage';
import { DataTable } from '../components/DataTable';
import LightingPdfGenerator from '../components/LightingPdfGenerator';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import { getErrorMessage } from '../utils/errorUtils';
import { API_BASE_URL } from '../config';
import { getCountryNormativa } from '../data/legislationData';
import { auth } from '../firebase';
import { Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { ModuleActionBar } from '../components/module';
import { evaluateLightingLevel } from '../utils/hygieneCalculators';
import LightingCalculatorWidget from '../components/LightingCalculatorWidget';
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1.2rem',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box' as any,
  transition: 'all 0.3s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
};

// Tipos de tareas visuales basados en el Decreto 351/79 (Anexo IV) - Resumido
const visualTasks = [
{ id: 'exteriores', label: 'Áreas exteriores generales y patios', minLux: 20 },
{ id: 'circulacion', label: 'Zonas de circulación, pasillos y escaleras', minLux: 100 },
{ id: 'simples', label: 'Tareas visuales simples (Depósitos, vestuarios)', minLux: 200 },
{ id: 'moderadas', label: 'Distinción moderada de detalles (Oficinas, lectura general)', minLux: 500 },
{ id: 'finos', label: 'Distinción de detalles finos (Dibujo, inspección fina)', minLux: 1000 },
{ id: 'muy_finos', label: 'Detalles muy finos (Relojería, electrónica, microcirugía)', minLux: 2000 }];


export default function LightingReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const { isPro } = usePaywall();

  const [formData, setFormData] = useState({
    empresa: '',
    sector: '',
    descripcionActividad: '',
    tipoTarea: '',
    luxRequerido: 500,
    conclusion: '',
    operatorSignature: '',
    supervisorSignature: '',
    mediciones: [
    { id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 as any }]

  });

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [statusFilter, setStatusFilter] = useState<'all' | 'cumple' | 'noCumple'>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);

  const metrics = React.useMemo(() => {
    const total = history.length;
    let cumple = 0;
    let noCumple = 0;
    let sumaLux = 0;

    history.forEach((item: any) => {
      const isApto = item.results?.cumplePromedio;
      if (isApto) cumple++;
      else noCumple++;
      if (item.results?.promedioLux) sumaLux += parseFloat(item.results.promedioLux);
    });

    const promedioGeneral = total > 0 ? Math.round(sumaLux / total) : 0;
    return { total, cumple, noCumple, promedioGeneral };
  }, [history]);

  const filteredHistoryData = React.useMemo(() => {
    return history.filter((item: any) => {
      const isApto = item.results?.cumplePromedio;
      if (statusFilter === 'cumple') return isApto;
      if (statusFilter === 'noCumple') return !isApto;
      return true;
    });
  }, [history, statusFilter]);

  const handleExportCSV = () => {
    requirePro(() => {
      downloadCSV(history.map((i: any) => ({
        empresa: i.empresa || i.datos?.empresa,
        sector: i.sector || i.datos?.sector,
        fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
        promedioLux: i.results?.promedioLux || 0,
        cumplimiento: i.results?.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'
      })), 'historial_estudios_iluminacion', {
        empresa: 'Empresa / Cliente', sector: 'Sector Evaluado', fecha: 'Fecha de Medición',
        promedioLux: 'Promedio Lux Medido', cumplimiento: 'Dictamen Normativo'
      });
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('lighting_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [isFormVisible]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = history.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('lighting_history', JSON.stringify(updated));
      setHistory(updated);
      toast.success('Estudio eliminado');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredHistory = history.filter((item: any) =>
  item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

  const handleGenerateConclusion = async () => {
    setIsGeneratingConclusion(true);
    const loadingToast = toast.loading('Redactando conclusión técnica...');
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({
          reportType: `Iluminación en Ambiente Laboral (${countryNorms.lighting})`,
          reportData: {
            luxRequerido: formData.luxRequerido,
            promedioLux: results.promedioLux,
            cumplePromedio: results.cumplePromedio,
            puntosCumplen: results.puntosCumplen,
            puntosNoCumplen: results.puntosNoCumplen,
            descripcionActividad: formData.descripcionActividad
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

  const [professional, setProfessional] = useState<{name: string;license: string;signature: any;stamp?: any;}>({
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
      userCountry = parsed.country || 'argentina';
    }
  } catch (error) {
    console.error('[LightingReport] Error parsing personalData:', error);
  }
  const countryNorms = getCountryNormativa(userCountry);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('personalData');
      const savedSigData = localStorage.getItem('signatureStampData');
      const legacySignature = localStorage.getItem('capturedSignature');

      let signature = legacySignature || null;
      if (savedSigData) {
        try {
          const parsed = JSON.parse(savedSigData);
          signature = parsed.signature || signature;
        } catch (e) {}
      }

      let profData = {
        name: 'Profesional',
        license: '',
        signature: signature
      };

      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          profData.name = data.name || 'Profesional';
          profData.license = data.license || '';
        } catch (e) {}
      }

      setProfessional(profData);
    } catch (error) {
      console.error('Error loading professional data:', error);
    }
  }, []);

  useEffect(() => {
    if (location.state?.editData) {
      setFormData(location.state.editData.datos || location.state.editData);
      setIsFormVisible(true);
    }
  }, [location.state]);

  const [results, setResults] = useState({
    promedioLux: 0,
    cumplePromedio: false,
    puntosCumplen: 0,
    puntosNoCumplen: 0
  });

  // Actualizar lux requerido cuando cambia la tarea Y NO SE ESCRIBIÓ MANUALMENTE
  useEffect(() => {
    // Find if the current text matches any of the labels exactly (via the datalist)
    const task = visualTasks.find((t) => t.label === formData.tipoTarea);
    if (task) {
      setFormData((prev) => ({ ...prev, luxRequerido: task.minLux }));
    }
  }, [formData.tipoTarea]);

  // Calcular promedios y cumplimiento
  useEffect(() => {
    const meds = formData.mediciones || [];
    if (meds.length === 0) {
      setResults({ promedioLux: 0, cumplePromedio: false, puntosCumplen: 0, puntosNoCumplen: 0 });
      return;
    }

    const totalLux = meds.reduce((acc, curr) => acc + (parseFloat(curr.luxMedido) || 0), 0);
    const promedio = totalLux / meds.length;

    const cumpleProm = promedio >= formData.luxRequerido;
    const cumplen = meds.filter((m) => (parseFloat(m.luxMedido) || 0) >= formData.luxRequerido).length;
    const noCumplen = meds.length - cumplen;

    setResults({
      promedioLux: Math.round(promedio),
      cumplePromedio: cumpleProm,
      puntosCumplen: cumplen,
      puntosNoCumplen: noCumplen
    });

  }, [formData.mediciones, formData.luxRequerido]);

  const handleDataChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const addMedicion = () => {
    setFormData({
      ...formData,
      mediciones: [...formData.mediciones, { id: Date.now().toString(), ubicacion: `Puesto ${formData.mediciones.length + 1}`, luxMedido: '' }]
    });
  };

  const removeMedicion = (index) => {
    const newMeds = [...formData.mediciones];
    newMeds.splice(index, 1);
    setFormData({ ...formData, mediciones: newMeds });
  };

  const updateMedicion = (index, field, value) => {
    const newMeds = [...formData.mediciones];
    newMeds[index][field] = value;
    setFormData({ ...formData, mediciones: newMeds });
  };

  const saveReport = async () => {
    try {
      const reportData = {
        id: location.state?.editData?.id || Date.now().toString(),
        date: location.state?.editData?.date || new Date().toISOString(),
        empresa: formData.empresa || 'Empresa Sin Nombre',
        sector: formData.sector || 'Sin Sector',
        results: results,
        datos: formData,
        profesionalResponsable: professional?.name || 'Profesional no registrado'
      };

      let existingHistory = [];
      try {
        const savedHistory = localStorage.getItem('lighting_history');
        if (savedHistory) {
          existingHistory = JSON.parse(savedHistory);
        }
      } catch (e) {}

      if (location.state?.editData) {
        existingHistory = existingHistory.map((item) => item.id === location.state.editData.id ? reportData : item);
      } else {
        existingHistory.push(reportData);
      }

      localStorage.setItem('lighting_history', JSON.stringify(existingHistory));

      if (currentUser) {
        await syncCollection('lighting_history', existingHistory);
      }

      toast.success(location.state?.editData ? 'Informe actualizado correctamente.' : 'Informe guardado en el Historial');
      setIsFormVisible(false);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Error saving document:", err);
      toast.error("Error al guardar en la base de datos.");
    }
  };

  if (selectedReport) {
    return (
      <div className="print-only-wrapper min-h-[100vh] bg-slate-900 pb-12 pt-4">
        <div className="no-print flex items-center justify-between max-w-[210mm] mx-auto mb-4 px-4">
          <button 
            onClick={() => setSelectedReport(null)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer border border-slate-700 transition-all">
            <ArrowLeft size={16} /> Volver al Historial
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-lg shadow-amber-500/30 transition-all">
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
        <LightingPdfGenerator data={selectedReport} />
      </div>
    );
  }

  if (!isFormVisible) {
    const columns = [
      {
        header: 'Fecha Medición',
        accessor: 'date',
        sortable: true,
        render: (item: any) => (
          <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'block' }}>
            {new Date(item.date || item.datos?.fecha || Date.now()).toLocaleDateString('es-AR')}
          </span>
        )
      },
      {
        header: 'Empresa / Cliente',
        accessor: 'empresa',
        sortable: true,
        render: (item: any) => (
          <div>
            <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>
              {item.empresa || item.datos?.empresa || 'Empresa sin especificar'}
            </div>
            <div style={{ color: '#475569', fontWeight: '700', fontSize: '12px', marginTop: '2px' }}>
              📍 Sector: {item.sector || item.datos?.sector || 'General'}
            </div>
          </div>
        )
      },
      {
        header: 'Tarea / Niveles Lux',
        accessor: 'datos.tipoTarea',
        sortable: true,
        render: (item: any) => {
          const d = item.datos || item;
          const medido = item.results?.promedioLux || 0;
          const req = d.luxRequerido || 500;
          return (
            <div>
              <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '12px', display: 'block' }}>
                💡 {d.tipoTarea || 'Estudio de Luxometría'}
              </span>
              <span style={{ color: '#64748b', fontWeight: '600', fontSize: '11px' }}>
                Exigido: <strong>{req} Lux</strong> | Medido: <strong>{medido} Lux</strong>
              </span>
            </div>
          );
        }
      },
      {
        header: 'Resultado Normativo',
        accessor: 'results.cumplePromedio',
        sortable: true,
        render: (item: any) => {
          const isApto = item.results?.cumplePromedio;
          if (isApto) {
            return (
              <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> CUMPLE NORMATIVA
              </span>
            );
          }
          return (
            <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={13} /> NO CUMPLE NORMATIVA
            </span>
          );
        }
      },
      {
        header: 'Acciones',
        accessor: 'id',
        render: (item: any) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setSelectedReport(item.datos || item)} 
              style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)' }}>
              <FileText size={12} /> Ver PDF
            </button>
            
            <button 
              onClick={() => {
                setFormData(item.datos || item);
                setIsFormVisible(true);
                window.history.replaceState({ editData: item }, '');
              }} 
              style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}>
              <Pencil size={12} /> Editar
            </button>

            <button 
              onClick={() => requirePro(() => {
                const url = `${window.location.origin}/v/${currentUser?.uid}/lighting/${item.id}?print=true`;
                setQrTarget({ text: url, title: `Estudio Iluminación — ${item.empresa || item.datos?.empresa || ''}` });
              })} 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
              <QrCode size={12} /> QR
            </button>

            <button 
              onClick={() => requirePro(() => setShareItem(item.datos || item))} 
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}>
              <Share2 size={12} /> Compartir
            </button>

            <button 
              onClick={(e) => handleDelete(item.id, e)} 
              style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}>
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        )
      }
    ];

    return (
      <AnimatedPage>
        <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
          <div className="no-print">
            <PremiumHeader
              title="Estudios de Iluminación"
              subtitle={`Gestión e historial de estudios de luxometría laboral — ${countryNorms.lighting}`}
              icon={<Lightbulb size={36} color="#ffffff" />}
              color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
              }`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Evaluados</span>
                <Lightbulb size={20} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
              <span className="text-[11px] text-slate-500">Estudios cargados</span>
            </div>

            <div 
              onClick={() => setStatusFilter('cumple')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'cumple' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Cumple Normativa</span>
                <CheckCircle2 size={20} />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.cumple}</div>
              <span className="text-[11px] text-slate-500">Luxometría conforme</span>
            </div>

            <div 
              onClick={() => setStatusFilter('noCumple')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'noCumple' 
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
              }`}>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">No Cumple (Deficiente)</span>
                <XCircle size={20} />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.noCumple}</div>
              <span className="text-[11px] text-slate-500">Requiere adecuación</span>
            </div>

            <div 
              className="p-4 rounded-2xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Promedio General</span>
                <Sun size={20} />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.promedioGeneral} <span className="text-xs font-bold text-slate-600">Lux</span></div>
              <span className="text-[11px] text-slate-500">Intensidad acumulada</span>
            </div>
          </div>

          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, payload: null })}
            onConfirm={executeDelete}
            title="¿Eliminar estudio?"
            message="Esta acción no se puede deshacer."
            iconEmoji="🗑️"
          />

          {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
          <ShareModal 
            isOpen={!!shareItem} 
            open={!!shareItem} 
            onClose={() => setShareItem(null)} 
            title={`Estudio de Iluminación - ${shareItem?.empresa || ''}`} 
            text={shareItem ? `💡 Estudio de Iluminación\n🏢 Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n📅 Fecha: ${shareItem.fecha}\n💡 Promedio: ${shareItem.results?.promedioLux || 0} Lux` : ''} 
            rawMessage={shareItem ? `💡 Estudio de Iluminación\n🏢 Empresa: ${shareItem.empresa}` : ''} 
            elementIdToPrint="pdf-content" 
            fileName={`Iluminacion_${shareItem?.empresa || 'Estudio'}.pdf`} 
          />

          <div id="pdf-content" className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
            {shareItem && <LightingPdfGenerator data={shareItem} />}
          </div>

          <main className="w-full max-w-[1200px] mx-auto pb-8 mt-6">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <h3 className="m-0 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="text-amber-500" size={22} />
                Historial de Estudios de Luxometría
              </h3>
              <div className="flex gap-3 items-center">
                {history.length > 0 && (
                  <button 
                    onClick={handleExportCSV} 
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} 
                    className="flex items-center gap-1.5 border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer text-white transition-transform hover:-translate-y-0.5">
                    <Download size={14} /> EXCEL
                  </button>
                )}
                <button 
                  onClick={() => {
                    setFormData({
                      empresa: '', sector: '', descripcionActividad: '', tipoTarea: '', luxRequerido: 500, conclusion: '',
                      operatorSignature: '', supervisorSignature: '', mediciones: [{ id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 as any }]
                    });
                    setIsFormVisible(true);
                  }} 
                  className="flex items-center gap-2 px-5 py-2.5 w-auto m-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none rounded-xl font-extrabold shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 transition-all cursor-pointer">
                  <Plus size={18} /> NUEVO ESTUDIO
                </button>
              </div>
            </div>

            <DataTable
              data={filteredHistoryData}
              columns={columns}
              searchPlaceholder="Buscar por empresa, cliente, sector o tarea..."
              searchFields={['empresa', 'sector', 'datos.tipoTarea']}
              emptyMessage="No hay estudios de iluminación registrados."
              emptyIcon={<Lightbulb size={48} />}
            />
          </main>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem] pt-[6.5rem] lighting-report-container">
      {/* Contenedor oficial imprimible del PDF */}
      <div id="pdf-content" className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
        <LightingPdfGenerator data={{ ...formData, fecha: (formData as any).fecha || new Date().toISOString(), results }} />
      </div>

      <ShareModal 
        isOpen={showShare} 
        open={showShare} 
        onClose={() => setShowShare(false)} 
        title={`Estudio de Iluminación - ${formData.empresa || 'Protocolo'}`} 
        text={`💡 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n💡 Promedio: ${results?.promedioLux || 0} Lux`} 
        rawMessage={`💡 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}`} 
        elementIdToPrint="pdf-content" 
        fileName={`Iluminacion_${formData.empresa || 'Estudio'}.pdf`} 
      />

      <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title={location.state?.editData ? 'Editar Protocolo de Iluminación' : 'Nuevo Estudio de Iluminación'}
        subtitle={`Medición según ${countryNorms.lighting}`}
        icon={<Lightbulb size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />

            <ModuleActionBar
              actions={[
                {
                  id: 'share',
                  label: 'COMPARTIR',
                  icon: <Share2 size={18} />,
                  variant: 'info',
                  onClick: () => requirePro(() => setShowShare(true)),
                },
                {
                  id: 'print',
                  label: 'IMPRIMIR PDF',
                  icon: <Printer size={18} />,
                  variant: 'warning',
                  onClick: () => requirePro(() => window.print()),
                },
                {
                  id: 'save',
                  label: 'GUARDAR',
                  icon: <Save size={18} />,
                  variant: 'primary',
                  onClick: (e) => { e.preventDefault(); saveReport(); },
                },
                {
                  id: 'cancel',
                  label: 'CANCELAR',
                  icon: <ArrowLeft size={18} />,
                  variant: 'danger',
                  onClick: () => setIsFormVisible(false),
                },
              ]}
            />

            <main className="no-print p-[2rem_1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="mb-6">
                    <LightingCalculatorWidget
                      luxRequerido={formData.luxRequerido}
                      mediciones={formData.mediciones as any}
                      onConclusionGenerated={(conclusionText) => {
                        setFormData(prev => ({ ...prev, conclusion: conclusionText }));
                      }}
                    />
                </div>

            {showShare &&
              <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Estudio de Iluminación - ${formData.empresa}`}
                text={`🔦 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n💡 Requerido: ${formData.luxRequerido} Lux | Promedio Medido: ${results.promedioLux} Lux\n\nGenerado con Asistente HYS`}
                rawMessage={`🔦 Estudio de Iluminación\n🏢 Empresa: ${formData.empresa}\n📍 Sector: ${formData.sector}\n💡 Requerido: ${formData.luxRequerido} Lux | Promedio Medido: ${results.promedioLux} Lux\n\nGenerado con Asistente HYS`}
                elementIdToPrint="pdf-content"
                fileName={`Iluminacion_${formData.empresa}.pdf`} />
            }

            <div className="grid md:grid-cols-2 gap-8">
                    {/* COLUMNA 1: DATOS GENERALES */}
                    <div>
                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.1rem] border-b border-slate-700/40 pb-[0.5rem]">
                            <Building2 size={20} className="text-amber-500" /> Datos del Establecimiento
                        </h3>

                        <div className="card p-[2rem] mb-[1.5rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Razón Social / Obra</label>
                                <input
                                  type="text"
                                  value={formData.empresa}
                                  onChange={(e) => handleDataChange('empresa', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                  placeholder="Nombre de la empresa..." />
                            </div>
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Sector / Área de Estudio</label>
                                <input
                                  type="text"
                                  value={formData.sector}
                                  onChange={(e) => handleDataChange('sector', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                  placeholder="Ej: Nave Industrial, Administración..." />
                            </div>
                            <div>
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Descripción de las Tareas</label>
                                <input
                                  type="text"
                                  value={formData.descripcionActividad}
                                  onChange={(e) => handleDataChange('descripcionActividad', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                  placeholder="Ej: Trabajo en escritorio, torno mecánico..." />
                            </div>
                        </div>

                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.1rem] border-b border-slate-700/40 pb-[0.5rem] mt-[2rem]">
                            <Layout size={20} className="text-amber-500" /> Requerimiento Legal
                        </h3>

                        <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Tipo de Tarea Visual ({countryNorms.lighting.split(' ')[0]} o Especial)</label>
                                <input
                                  list="visualTasksList"
                                  value={formData.tipoTarea}
                                  onChange={(e) => handleDataChange('tipoTarea', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                  placeholder="Seleccione o escriba el tipo de tarea..." />
                                <datalist id="visualTasksList">
                                    {visualTasks.map((t) =>
                                      <option key={t.id} value={t.label} />
                                    )}
                                </datalist>
                            </div>
                            <div className="flex items-center gap-[1rem] p-[1.2rem] bg-[rgba(59,_130,_246,_0.05)] rounded-[12px] border-[1px_solid_rgba(59,_130,_246,_0.2)]">
                                <Sun size={32} className="text-amber-500" />
                                <div className="flex-[1]">
                                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">Iluminación Mínima Exigida</p>
                                    <div className="flex items-center gap-[0.5rem]">
                                        <input
                                          type="number"
                                          value={formData.luxRequerido}
                                          onChange={(e) => handleDataChange('luxRequerido', e.target.value === '' ? '' : Number(e.target.value))}
                                          style={{ ...inputStyle }}
                                          min="0"
                                          className="w-[100px] text-[1.5rem] font-[900] text-amber-500 p-[0.5rem] bg-[var(--color-surface)]" />
                                        <span className="text-[1.2rem] font-[700] text-[var(--color-text)]">Lux</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: MEDICIONES Y RESULTADOS */}
                    <div>
                        <h3 className="flex items-center justify-between mb-[1rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.1rem] border-b border-slate-700/40 pb-[0.5rem]">
                            <div className="flex items-center gap-[0.5rem]">
                                <Lightbulb size={20} className="text-amber-500" /> Puntos de Medición
                            </div>
                            <button onClick={addMedicion} className="btn-secondary m-[0] p-[0.4rem_0.8rem] text-[0.8rem] flex items-center gap-[0.3rem]">
                                <Plus size={14} /> Añadir Punto
                            </button>
                        </h3>

                        <div className="card p-[1rem] mb-[1.5rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                            <div className="overflow-x-[auto]">
                                <table className="w-[100%] border-collapse-[collapse] text-[0.9rem] min-width-[350px]">
                                    <thead>
                                        <tr className="bg-[rgba(255,255,255,0.02)] text-[var(--color-text-muted)]">
                                            <th className="p-[1rem] text-left border-bottom-[2px_solid_var(--color-border)] font-[800]">Punto Exacto / Puesto</th>
                                            <th className="p-[1rem] text-center border-bottom-[2px_solid_var(--color-border)] font-[800]">Lux Medido</th>
                                            <th className="p-[1rem] text-center border-bottom-[2px_solid_var(--color-border)] font-[800]">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.mediciones.map((med, index) =>
                                          <tr key={med.id} className="hover-lift transition-[all_0.2s]">
                                                <td className="p-[0.8rem] border-bottom-[1px_solid_var(--color-border)]">
                                                    <input
                                                      type="text"
                                                      value={med.ubicacion}
                                                      onChange={(e) => updateMedicion(index, 'ubicacion', e.target.value)}
                                                      placeholder="Puesto X" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                                </td>
                                                <td className="p-[0.8rem] border-bottom-[1px_solid_var(--color-border)] w-[120px]">
                                                    <input
                                                      type="number"
                                                      value={med.luxMedido}
                                                      onChange={(e) => updateMedicion(index, 'luxMedido', e.target.value)}
                                                      style={{ ...inputStyle }}
                                                      placeholder="0"
                                                      min="0"
                                                      className="text-center font-[800] text-amber-500" />
                                                </td>
                                                <td className="p-[0.8rem] border-bottom-[1px_solid_var(--color-border)] text-center w-[60px]">
                                                    <button
                                                      onClick={() => removeMedicion(index)}
                                                      className="hover-lift bg-[rgba(239,_68,_68,_0.1)] border-none text-[#ef4444] cursor-pointer p-[0.5rem] rounded-[10px] display-[inline-flex]">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.1rem] border-b border-slate-700/40 pb-[0.5rem]">
                            <Calculator size={20} className="text-amber-500" /> Evaluación Normativa
                        </h3>

                        <div className="grid grid-template-columns-[minmax(0,_1fr)] gap-[1rem]">
                            <div className="card p-[1.5rem]" style={{ border: results.cumplePromedio ? '2px solid #10b981' : '2px solid #ef4444', background: results.cumplePromedio ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                                <div className="flex justify-space-between items-center mb-[1rem]">
                                    <div>
                                        <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Nivel Promedio Registrado</p>
                                        <p style={{ color: results.cumplePromedio ? '#10b981' : '#ef4444' }} className="m-[0] text-[2rem] font-[800]">{results.promedioLux} Lux</p>
                                    </div>
                                    <div className="result-badge-print text-[white] p-[0.5rem_1rem] rounded-[20px] font-[800] text-[0.85rem]" style={{ background: results.cumplePromedio ? '#10b981' : '#ef4444' }}>
                                        {results.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'}
                                    </div>
                                </div>
                                <div className="text-[0.85rem]">
                                    <div className="flex justify-space-between mb-[0.4rem]">
                                        <span>Requerido s/ {countryNorms.lighting}:</span>
                                        <span className="font-[700]">{formData.luxRequerido} Lux</span>
                                    </div>
                                    <div className="flex justify-space-between mb-[0.4rem]">
                                        <span>Puntos que Cumplen:</span>
                                        <span className="font-[700] text-[#10b981]">{results.puntosCumplen}</span>
                                    </div>
                                    <div className="flex justify-space-between">
                                        <span>Puntos Deficientes:</span>
                                        <span style={{ color: results.puntosNoCumplen > 0 ? '#ef4444' : 'var(--color-text)' }} className="font-[700]">{results.puntosNoCumplen}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE CONCLUSIÓN */}
                <div className="p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8 mt-10 block clear-[both] bg-[var(--color-surface)]">
                    <div className="flex justify-space-between items-center mb-[1.5rem]">
                        <h3 className="m-[0] flex items-center gap-[0.7rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.1rem]">
                            <FileText size={22} className="text-amber-500" /> Conclusión Profesional
                        </h3>
                        <button
                          className="p-[0.6rem_1rem] bg-[linear-gradient(135deg,_#a855f7,_#ec4899)] text-[white] border-none rounded-[12px] font-[800] text-[0.75rem] flex items-center gap-[0.4rem] outline-[none]"
                          onClick={handleGenerateConclusion}
                          disabled={isGeneratingConclusion}
                          style={{ cursor: isGeneratingConclusion ? 'wait' : 'pointer' }}>
                            {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGeneratingConclusion ? 'REDACTANDO...' : 'REDACTAR CON IA'}
                        </button>
                    </div>

                    <textarea
                      value={formData.conclusion || ''}
                      onChange={(e) => handleDataChange('conclusion', e.target.value)}
                      style={{ ...inputStyle }} className="min-h-[160px] resize-[vertical]"
                      placeholder="Escriba la conclusión del estudio o use el botón de IA para generarla..." />
                </div>

                {/* SECCIÓN DE DATOS OBTENIDOS POR */}
                <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)] clear-[both]">
                    <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-amber-500 dark:text-amber-400 font-extrabold text-[1.25rem] uppercase tracking-wider">
                        <ShieldCheck size={22} className="text-amber-500" /> Firmas y Validación
                    </h3>
                    {/* Custom visual switches */}
                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
                              { id: 'operator', label: 'Operador / Responsable' },
                              { id: 'supervisor', label: 'Supervisor' },
                              { id: 'professional', label: 'Profesional' }
                            ].map((sig) => {
                              const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                              return (
                                <label
                                  key={sig.id}
                                  className="flex items-center gap-2 cursor-pointer select-none p-[0.6rem_1.25rem] rounded-[99px] transition-[all_0.3s] font-[600] text-[0.875rem] border-[2px_solid_transparent]"
                                  style={{
                                    borderColor: isChecked ? '#3b82f6' : 'var(--color-border)',
                                    background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                    color: isChecked ? '#3b82f6' : 'var(--color-text-muted)'
                                  }}>
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))}
                                      className="absolute opacity-0 w-0 h-0"
                                    />
                                    <div className={`flex items-center justify-center w-[1.25rem] h-[1.25rem] rounded-[50%] border-[2px_solid_transparent] transition-[all_0.3s] ${
                                      isChecked 
                                        ? 'border-[#3b82f6] bg-[#3b82f6]' 
                                        : 'border-[#cbd5e1]'
                                    }`}>
                                      <Check size={12} strokeWidth={3} className={`transition-[all_0.3s] ${
                                        isChecked ? 'text-[#fff] scale-100' : 'text-[transparent] scale-50'
                                      }`} />
                                    </div>
                                  </div>
                                  <span className="font-[800]">{sig.label}</span>
                                </label>
                              );
                            })}
                        </div>
                    </div>
                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                        {showSignatures.operator &&
                          <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <SignatureCanvas
                              onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                              initialImage={formData.operatorSignature}
                              label="Firma del Operador / Responsable" />
                          </div>
                        }
                        
                        {showSignatures.supervisor &&
                          <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <SignatureCanvas
                              onSave={(sig) => setFormData((prev) => ({ ...prev, supervisorSignature: sig || '' }))}
                              initialImage={formData.supervisorSignature}
                              label="Firma del Supervisor" />
                          </div>
                        }
                    </div>
                </div>
            </main>
        </div>);

}