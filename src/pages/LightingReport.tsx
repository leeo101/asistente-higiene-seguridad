import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Plus, Trash2, Lightbulb, Calculator,
  FileText, Printer, Building2, Layout, Maximize2,
  Info, TriangleAlert, ShieldCheck, History, Share2, Sun, Sparkles, Loader2, Check } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
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

  if (!isFormVisible) {
    return (
      <div className="container min-h-[100vh] bg-[var(--color-background)] pb-[7rem] pt-[5.5rem]">
                <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Estudios de Iluminación"
        subtitle="Gestión e historial de estudios de iluminación y luxometría."
        icon={<Lightbulb size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
        
                
                <main className="p-[0_0_2rem_0] max-w-[1000px] m-[0_auto] w-[100%]">
                    {/* Botones de Navegación */}
                    <div className="flex gap-[1rem] p-[0_1rem] mb-[1rem]">
                        <></>
                    </div>

                    <div className="flex flex-col gap-4 mb-[2rem] px-4">
                        <div className="flex justify-end">
                            <button onClick={() => {
                  setFormData({
                    empresa: '', sector: '', descripcionActividad: '', tipoTarea: '', luxRequerido: 500, conclusion: '',
                    operatorSignature: '', supervisorSignature: '', mediciones: [{ id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 as any }]
                  });
                  setIsFormVisible(true);
                }}
                onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
                onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: '3.5rem' }}>
                                <Plus size={22} strokeWidth={2.5} /> Nuevo Estudio
                            </button>
                        </div>
                        <div className="relative w-full">
                            <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                type="text"
                placeholder="Buscar por empresa o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
                onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}}
                style={{ width: '100%', height: '100%', minHeight: '3.5rem', padding: '0.75rem 1rem 0.75rem 3.5rem', borderRadius: '1rem', border: '2px solid transparent', backgroundColor: 'rgba(241, 245, 249, 0.5)', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', fontWeight: 500, color: 'var(--color-text)' }} />
                        </div>
                    </div>

                    <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(300px,_1fr))] gap-[1.5rem] p-[0_1rem]">
                        {filteredHistory.length === 0 ?
            <div className="grid-column-[1_/_-1] text-center p-[4rem_2rem] bg-[var(--color-surface)] rounded-[24px] border-[1px_dashed_var(--color-border)]">
                                <Lightbulb size={48} className="text-[var(--color-text-light)] mb-[1rem]" />
                                <h3 className="m-[0_0_0.5rem_0]">No hay estudios registrados</h3>
                                <p className="m-[0] text-[var(--color-text-muted)]">Cargue su primer estudio de iluminación.</p>
                            </div> :

            filteredHistory.map((item: any) => {
              const isApto = item.results?.cumplePromedio;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setFormData(item.datos || item);
                    setIsFormVisible(true);
                    window.history.replaceState({ editData: item }, '');
                  }}
                  className="card hover-lift animate-fade-in cursor-pointer p-[1.5rem] rounded-[16px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)]">

                  
                                        <div className="flex justify-space-between items-start mb-[1rem]">
                                            <div>
                                                <h3 className="m-[0_0_0.25rem_0] text-[1.2rem] font-[900]">{item.empresa || 'Empresa'}</h3>
                                                <span className="text-[0.8rem] text-[var(--color-text-muted)] flex items-center gap-[0.25rem]">
                                                    <Building2 size={14} /> {item.sector || 'Sector'}
                                                </span>
                                            </div>
                                            <span style={{
                      background: isApto ? '#f0fdf4' : '#fef2f2',
                      color: isApto ? '#16a34a' : '#dc2626'




                    }} className="p-[0.3rem_0.6rem] rounded-[6px] text-[0.75rem] font-[900]">
                                                {isApto ? 'CUMPLE' : 'NO CUMPLE'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-space-between items-center pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                                            <span className="text-[0.8rem] text-[var(--color-primary)] font-[600] flex items-center gap-[0.25rem]">
                                                <FileText size={14} /> Ver / Editar
                                            </span>
                                            <button
                      onClick={(e) => handleDelete(item.id, e)}

                      title="Eliminar" className="bg-[transparent] border-none text-[#ef4444] cursor-pointer p-[0.5rem]">
                      
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>);

            })
            }
                    </div>
                </main>
                <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar estudio?"
          message="Esta acción no se puede deshacer."
          iconEmoji="🗑️" />
        
            </div>);

  }

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem] pt-[6.5rem] lighting-report-container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-content, #pdf-content * { visibility: visible !important; }
          #pdf-content {
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .lighting-report-container > *:not(main):not(style) {
            display: none !important;
          }
          .lighting-report-container, .lighting-report-container main, .app-container, .main-content {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
        
        /* Fallback for html2canvas (Compartir PDF) */
        .ats-pdf-offscreen #pdf-content {
            background: white !important;
            width: 1200px !important;
            padding: 40px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .ats-pdf-offscreen .no-print { display: none !important; }
        .ats-pdf-offscreen .print-only { display: block !important; opacity: 1 !important; visibility: visible !important; color: black !important; }
        .ats-pdf-offscreen .card { background: white !important; border: 1px solid #ccc !important; }
      `}</style>
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

            <main className="p-[2rem_1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="mb-6">
                    <></>
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

            {/* ENCABEZADO PARA IMPRESIÓN */}
            <div id="pdf-content" className="w-[100%] flex flex-col gap-[1rem] bg-[#ffffff] text-[#000000]">
                {/* Header Tripartito HSE */}
                <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%] border-top-[12px_solid_#eab308] pt-[1rem]">
                    <div className="flex-[1] text-left">
                        <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                        <p className="m-[0] font-[900] text-[0.8rem] uppercase text-[#d97706]">Doc. Estudio de Iluminación</p>
                    </div>
                    <div className="flex-[2] flex flex-col items-center justify-center text-center">
                        <h1 className="m-[0] font-[900] text-[2.4rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">ILUMINACIÓN</h1>
                        <div className="mt-[0.3rem] bg-[#eab308] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em]">
                            ESTUDIO DE NIVELES — {countryNorms.lighting}
                        </div>
                    </div>
                    <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 print-block">
                    {/* COLUMNA 1: DATOS GENERALES */}
                    <div>
                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-[var(--color-primary)] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem]">
                            <Building2 size={20} /> Datos del Establecimiento
                        </h3>

                        <div className="card p-[2rem] mb-[1.5rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Razón Social / Obra</label>
                                <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => handleDataChange('empresa', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors no-print"
                    placeholder="Nombre de la empresa..." />
                  
                                <div className="print-only p-[0.6rem] border-bottom-[1px_solid_#eee] text-[1rem] text-[#000]">{formData.empresa || '-'}</div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Sector / Área de Estudio</label>
                                <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => handleDataChange('sector', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors no-print"
                    placeholder="Ej: Nave Industrial, Administración..." />
                  
                                <div className="print-only p-[0.6rem] border-bottom-[1px_solid_#eee] text-[1rem] text-[#000]">{formData.sector || '-'}</div>
                            </div>
                            <div>
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Descripción de las Tareas</label>
                                <input
                    type="text"
                    value={formData.descripcionActividad}
                    onChange={(e) => handleDataChange('descripcionActividad', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors no-print"
                    placeholder="Ej: Trabajo en escritorio, torno mecánico..." />
                  
                                <div className="print-only p-[0.6rem] border-bottom-[1px_solid_#eee] text-[1rem] text-[#000]">{formData.descripcionActividad || '-'}</div>
                            </div>
                        </div>

                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-[var(--color-primary)] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem] mt-[2rem]">
                            <Layout size={20} /> Requerimiento Legal
                        </h3>

                        <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                            <div className="mb-6">
                                <label className="block text-[0.9rem] mb-[0.5rem] font-[700]">Tipo de Tarea Visual ({countryNorms.lighting.split(' ')[0]} o Especial)</label>
                                <input
                    list="visualTasksList"
                    value={formData.tipoTarea}
                    onChange={(e) => handleDataChange('tipoTarea', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors no-print"
                    placeholder="Seleccione o escriba el tipo de tarea..." />
                  
                                <div className="print-only p-[0.6rem] border-bottom-[1px_solid_#eee] text-[1rem] text-[#000] font-[bold]">{formData.tipoTarea || '-'}</div>
                                <datalist id="visualTasksList">
                                    {visualTasks.map((t) =>
                    <option key={t.id} value={t.label} />
                    )}
                                </datalist>
                            </div>
                            <div className="flex items-center gap-[1rem] p-[1.2rem] bg-[rgba(59,_130,_246,_0.05)] rounded-[12px] border-[1px_solid_rgba(59,_130,_246,_0.2)]">
                                <Sun size={32} color="var(--color-primary)" />
                                <div className="flex-[1]">
                                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[700] uppercase mb-[0.3rem]">Iluminación Mínima Exigida</p>
                                    <div className="flex items-center gap-[0.5rem]">
                                        <input
                        type="number"
                        value={formData.luxRequerido}
                        onChange={(e) => handleDataChange('luxRequerido', e.target.value === '' ? '' : Number(e.target.value))}
                        style={{ ...inputStyle }}
                        min="0"
                        className="no-print w-[100px] text-[1.5rem] font-[900] text-[var(--color-primary)] p-[0.5rem] bg-[var(--color-surface)]" />
                      
                                        <span className="no-print text-[1.2rem] font-[700] text-[var(--color-text)]">Lux</span>
                                        <div className="print-only text-[1.5rem] font-[800]">{formData.luxRequerido} Lux</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: MEDICIONES Y RESULTADOS */}
                    <div>
                        <h3 className="flex items-center justify-space-between mb-[1rem] text-[var(--color-primary)] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem]">
                            <div className="flex items-center gap-[0.5rem]">
                                <Lightbulb size={20} /> Puntos de Medición
                            </div>
                            <button onClick={addMedicion} className="btn-secondary no-print m-[0] p-[0.4rem_0.8rem] text-[0.8rem] flex items-center gap-[0.3rem]">
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
                                            <th className="no-print p-[1rem] text-center border-bottom-[2px_solid_var(--color-border)] font-[800]">Acción</th>
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
                            placeholder="Puesto X" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors no-print" />
                          
                                                    <div className="print-only p-[0.5rem] word-break-[break-word] overflow-wrap-[anywhere]">{med.ubicacion}</div>
                                                </td>
                                                <td className="p-[0.8rem] border-bottom-[1px_solid_var(--color-border)] w-[120px]">
                                                    <input
                            type="number"
                            value={med.luxMedido}
                            onChange={(e) => updateMedicion(index, 'luxMedido', e.target.value)}
                            style={{ ...inputStyle }}
                            placeholder="0"
                            min="0"
                            className="no-print text-center font-[800] text-[var(--color-primary)]" />
                          
                                                    <div className="print-only text-center font-[bold]">{med.luxMedido}</div>
                                                </td>
                                                <td className="no-print p-[0.8rem] border-bottom-[1px_solid_var(--color-border)] text-center w-[60px]">
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

                        <h3 className="flex items-center gap-[0.5rem] mb-[1rem] text-[var(--color-primary)] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem]">
                            <Calculator size={20} /> Evaluación Normativa
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
                <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl print:mb-0 mb-8 mt-10 print-area block clear-[both]">
                    <div className="flex justify-space-between items-center mb-[1.5rem]">
                        <h3 className="m-[0] flex items-center gap-[0.7rem] text-[var(--color-primary)]">
                            <FileText size={22} /> Conclusión Profesional
                        </h3>
                        <button
                className="no-print p-[0.6rem_1rem] bg-[linear-gradient(135deg,_#a855f7,_#ec4899)] text-[white] border-none rounded-[12px] font-[800] text-[0.75rem] flex items-center gap-[0.4rem] outline-[none]"
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
              style={{ ...inputStyle }} className="no-print min-h-[160px] resize-[vertical]"
              placeholder="Escriba la conclusión del estudio o use el botón de IA para generarla..." />
            

                    {formData.conclusion &&
            <div className="print-only text-slate-800 text-[0.85rem] whitespace-pre-wrap leading-relaxed">
                            {formData.conclusion}
                        </div>
            }
                </div>

                {/* SECCIÓN DE DATOS OBTENIDOS POR */}
                <div className="card animate-fade-in print-area mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)] clear-[both]">
                    <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                        <ShieldCheck size={22} color="var(--color-primary)" /> Firmas y Validación
                    </h3>

                    {/* Custom visual switches */}
                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
                { id: 'operator', label: 'Operador / Responsable' },
                { id: 'supervisor', label: 'Supervisor' },
                { id: 'professional', label: 'Profesional' }].
                map((sig) => {
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
                    </label>);
                })}
                        </div>
                    </div>

                <PdfSignatures
              data={{
                ...formData,
                professionalSignature: professional?.signature,
                professionalName: professional?.name,
                professionalLicense: professional?.license
              }}
              box1={showSignatures.operator ? {
                title: 'OPERADOR / RESPONSABLE',
                subtitle: 'Toma de conocimiento',
                signatureUrl: formData.operatorSignature || null,
                isProfessional: false
              } : null}
              box3={showSignatures.supervisor ? {
                title: 'SUPERVISOR H&S',
                subtitle: 'Aprobación del estudio',
                signatureUrl: formData.supervisorSignature || null,
                isProfessional: false
              } : null}
              box2={showSignatures.professional ? undefined : null} />
            

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

                    <PdfBrandingFooter />
                </div>
            </div>
            </main>
        </div>);

}