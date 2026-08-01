import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Users, Printer, Share2, Timer, Pencil, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import AnimatedPage from '../components/AnimatedPage';

const sanitizeDateInput = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

export default function EvacuationSimulatorForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Simulador de Evacuación' : 'Simulador de Evacuación');

  const [form, setForm] = useState<any>({
    sector: '',
    date: sanitizeDateInput(null),
    evaluator: '',

    // Variables de cálculo por defecto
    peopleCount: 50,
    exitWidth: 1.2, // metros
    maxDistance: 30, // metros
    walkingSpeed: 1.2, // m/s
    specificFlow: 1.3, // pers/(m*s)

    observations: '',
    signatures: {
      evaluator: '',
      manager: ''
    },
    evaluatorSignature: '',
    professionalSignature: '',
    supervisorSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setForm((prev: any) => {
      const currentObj = (prev && typeof prev.showSignatures === 'object' && prev.showSignatures !== null)
        ? prev.showSignatures
        : { operator: true, professional: true, supervisor: true };
      const updated = typeof updater === 'function' ? updater(currentObj) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = (form && typeof form.showSignatures === 'object' && form.showSignatures !== null)
    ? form.showSignatures
    : { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('personalData');
      const savedSigData = localStorage.getItem('signatureStampData');
      const legacySignature = localStorage.getItem('capturedSignature');

      let signature = legacySignature || null;
      let stamp = null;
      if (savedSigData) {
        const parsed = JSON.parse(savedSigData);
        signature = parsed?.signature || signature;
        stamp = parsed?.stamp || null;
      }

      if (savedData) {
        const data = JSON.parse(savedData);
        setProfessional({
          name: data?.name || '',
          license: data?.license || '',
          signature: signature,
          stamp: stamp
        });
        if (data?.name && !location.state?.editData) {
          setForm((prev: any) => ({
            ...prev,
            evaluator: prev.evaluator || data.name
          }));
        }
      } else {
        setProfessional((prev: any) => ({ ...prev, signature, stamp }));
      }
    } catch (e) {
      console.error('Error al cargar datos profesionales:', e);
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const editData = location.state.editData;
      setForm({
        sector: editData.sector || '',
        date: sanitizeDateInput(editData.date),
        evaluator: editData.evaluator || '',
        peopleCount: Number(editData.peopleCount) || 50,
        exitWidth: Number(editData.exitWidth) || 1.2,
        maxDistance: Number(editData.maxDistance) || 30,
        walkingSpeed: Number(editData.walkingSpeed) || 1.2,
        specificFlow: Number(editData.specificFlow) || 1.3,
        observations: editData.observations || '',
        signatures: editData.signatures || { evaluator: '', manager: '' },
        evaluatorSignature: editData.evaluatorSignature || editData.signatures?.evaluator || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signatures?.manager || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true },
        id: editData.id
      });
      setIsEdit(true);
    }
  }, [location.state]);

  const calculateEvacuationTime = () => {
    const peopleCount = Number(form?.peopleCount) || 1;
    const exitWidth = Number(form?.exitWidth) || 1.2;
    const maxDistance = Number(form?.maxDistance) || 30;
    const walkingSpeed = Number(form?.walkingSpeed) || 1.2;
    const specificFlow = Number(form?.specificFlow) || 1.3;

    // Tiempo de flujo (pasar por la puerta)
    const flowTime = peopleCount / (exitWidth * specificFlow);

    // Tiempo de viaje (caminar hasta la salida)
    const travelTime = maxDistance / walkingSpeed;

    // Tiempo total
    const total = flowTime + travelTime;

    return {
      flowTime: (isNaN(flowTime) ? 0 : flowTime).toFixed(1),
      travelTime: (isNaN(travelTime) ? 0 : travelTime).toFixed(1),
      total: (isNaN(total) ? 0 : total).toFixed(1)
    };
  };

  const results = calculateEvacuationTime();

  const handleSave = () => {
    if (!form?.sector || !form?.evaluator) {
      toast.error('Por favor complete el Sector y el Evaluador');
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
      let updated;

      const dataToSave = {
        ...form,
        calculatedTime: results.total,
        flowTime: results.flowTime,
        travelTime: results.travelTime,
        professionalSignature: form.professionalSignature || professional.signature,
        professionalName: form.professionalName || professional.name,
        professionalLicense: form.professionalLicense || professional.license,
        professionalStamp: form.professionalStamp || professional.stamp,
        signatures: {
          evaluator: form.evaluatorSignature || '',
          manager: form.supervisorSignature || ''
        }
      };

      if (isEdit) {
        updated = saved.map((p: any) => (p.id === form.id ? dataToSave : p));
        toast.success('Simulación actualizada correctamente');
      } else {
        const newForm = {
          ...dataToSave,
          id: `EVAC-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        updated = [newForm, ...saved];
        toast.success('Simulación guardada correctamente');
      }

      localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
      navigate('/evacuation-history');
    } catch (e) {
      console.error('Error al guardar simulación:', e);
      toast.error('Error al guardar la simulación');
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-4 pb-28 px-3 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">

        {/* Estilo estricto de impresión */}
        <style type="text/css">
          {`
            @media print {
              @page { size: A4 portrait; margin: 4mm; }
              body { background: #ffffff !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
              .screen-only, .no-print, header, nav, aside, .sidebar { display: none !important; }
              .ats-pdf-offscreen {
                position: static !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                opacity: 1 !important;
                overflow: visible !important;
              }
              #pdf-portal-container {
                display: block !important;
                position: static !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          `}
        </style>

        <div className="max-w-[1000px] mx-auto space-y-4 screen-only">

          {/* Modal de Compartir / Exportar PDF */}
          <ShareModal
            isOpen={showShareModal}
            open={showShareModal}
            onClose={() => setShowShareModal(false)}
            elementIdToPrint="pdf-portal-container"
            title="Simulación de Evacuación"
            text={`Simulación Sector ${form?.sector || 'General'} - Tiempo Total Estimado: ${results.total} segundos`}
            rawMessage={`Simulación Sector ${form?.sector || 'General'} - Tiempo Total Estimado: ${results.total} segundos`}
            fileName={`Evacuacion_${form?.sector || 'Nuevo'}.pdf`}
          />

          {/* Header Principal Limpio */}
          <PremiumHeader
            title={isEdit ? 'Editar Simulación de Evacuación' : 'Simulador de Evacuación (Teórico)'}
            subtitle="Cálculo de tiempos teóricos de escape basado en la Guía NFPA 101"
            icon={<Timer size={32} color="#ffffff" />}
          />

          {/* Botón Volver Chiquito Arriba */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/evacuation-history')}
              style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Volver al Historial
            </button>
          </div>

          {/* Sección 1: Datos del Establecimiento */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Building2 size={18} className="text-amber-600 dark:text-amber-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                1. Datos del Establecimiento
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Sector / Edificio *
                </label>
                <input
                  type="text"
                  value={form?.sector || ''}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="Ej: Planta Baja, Oficinas"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Fecha de Evaluación
                </label>
                <input
                  type="date"
                  value={form?.date || ''}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Evaluador a Cargo *
                </label>
                <input
                  type="text"
                  value={form?.evaluator || ''}
                  onChange={(e) => setForm({ ...form, evaluator: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="Nombre del evaluador"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Parámetros de Cálculo Teórico */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                2. Parámetros de Cálculo (NFPA 101)
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div>
                <label className="block mb-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Población (N)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={form?.peopleCount ?? 50}
                    onChange={(e) => setForm({ ...form, peopleCount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">pers.</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Ancho Salidas (A)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.8"
                    value={form?.exitWidth ?? 1.2}
                    onChange={(e) => setForm({ ...form, exitWidth: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">m</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Dist. Máx. (D)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={form?.maxDistance ?? 30}
                    onChange={(e) => setForm({ ...form, maxDistance: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">m</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Velocidad (V)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={form?.walkingSpeed ?? 1.2}
                    onChange={(e) => setForm({ ...form, walkingSpeed: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">m/s</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Flujo (k)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={form?.specificFlow ?? 1.3}
                    onChange={(e) => setForm({ ...form, specificFlow: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[9px] font-bold text-slate-500 shrink-0">p/(m·s)</span>
                </div>
              </div>
            </div>

            {/* Resultados Clasi-Claros del Cálculo */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex-1 w-full space-y-1 text-xs">
                <div className="flex justify-between border-b border-emerald-200 dark:border-emerald-800 pb-1">
                  <span className="text-emerald-900 dark:text-emerald-300 font-semibold">Tiempo Desplazamiento (D / V):</span>
                  <span className="font-extrabold text-emerald-950 dark:text-emerald-100">{results.travelTime} seg</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200 dark:border-emerald-800 pb-1">
                  <span className="text-emerald-900 dark:text-emerald-300 font-semibold">Tiempo Paso Salidas (N / (A · k)):</span>
                  <span className="font-extrabold text-emerald-950 dark:text-emerald-100">{results.flowTime} seg</span>
                </div>
              </div>

              <div className="text-center p-3 bg-emerald-600 rounded-xl min-w-[170px] w-full sm:w-auto shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">TIEMPO TOTAL ESTIMADO</span>
                <div className="text-2xl font-black text-white my-0.5">{results.total} <span className="text-xs font-bold">seg</span></div>
                <span className="text-[10px] text-emerald-100 font-bold block">(~{(Number(results.total) / 60).toFixed(1)} min)</span>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                Conclusiones y Observaciones Técnicas
              </label>
              <textarea
                value={form?.observations || ''}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="El tiempo de evacuación teórico es aceptable. Se recomienda realizar simulacro práctico para validar tiempos reales."
              />
            </div>
          </div>

          {/* Sección 3: Firmas y Autorizaciones */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Pencil size={18} className="text-purple-600 dark:text-purple-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                3. Firmas y Autorizaciones del Reporte
              </h2>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <span className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-wider block">
                MOSTRAR BLOQUES DE FIRMA EN EL PDF:
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'operator', label: 'Evaluador Técnico' },
                  { id: 'professional', label: 'Especialista H&S' },
                  { id: 'supervisor', label: 'Responsable Sector' }
                ].map((sig) => {
                  const isChecked = !!showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                        isChecked
                          ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{sig.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Canvas de Dibujo de Firma */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {showSignatures.operator && (
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                    Firma Evaluador Técnico
                  </div>
                  <SignatureCanvas
                    onSave={(sig) => setForm((prev: any) => ({ ...prev, evaluatorSignature: sig || '' }))}
                    initialImage={form?.evaluatorSignature}
                    label=""
                  />
                </div>
              )}

              {showSignatures.professional && (
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                    Firma Especialista H&S
                  </div>
                  <SignatureCanvas
                    onSave={(sig) => setForm((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                    initialImage={form?.professionalSignature || professional?.signature}
                    label=""
                  />
                </div>
              )}

              {showSignatures.supervisor && (
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                    Firma Responsable Sector
                  </div>
                  <SignatureCanvas
                    onSave={(sig) => setForm((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                    initialImage={form?.supervisorSignature}
                    label=""
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción Chiquitos Únicamente al Pie */}
          <div className="flex items-center justify-end gap-2 pt-2 pb-6">
            <button
              type="button"
              onClick={() => requirePro(() => setShowShareModal(true))}
              style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Share2 size={13} /> Compartir
            </button>

            <button
              type="button"
              onClick={() => requirePro(() => window.print())}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Printer size={13} /> PDF
            </button>

            <button
              type="button"
              onClick={() => requirePro(handleSave)}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '6px 16px', fontSize: '12px', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCircle2 size={14} /> Guardar Simulación
            </button>
          </div>

        </div>

        {/* Portal Offscreen para PDF Vectorial (Compartir e Imprimir) */}
        <div
          id="pdf-portal-container"
          className="ats-pdf-offscreen"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-99999px',
            width: '210mm',
            height: 'auto',
            overflow: 'visible',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: -9999,
            background: '#ffffff'
          }}
        >
          <EvacuationPdfGenerator
            data={{
              ...form,
              calculatedTime: results.total,
              flowTime: results.flowTime,
              travelTime: results.travelTime,
              professionalSignature: form?.professionalSignature || professional?.signature,
              professionalName: form?.professionalName || professional?.name,
              professionalLicense: form?.professionalLicense || professional?.license,
              professionalStamp: form?.professionalStamp || professional?.stamp,
              signatures: {
                evaluator: form?.evaluatorSignature || form?.signatures?.evaluator || '',
                manager: form?.supervisorSignature || form?.signatures?.manager || ''
              }
            }}
          />
        </div>

      </div>
    </AnimatedPage>
  );
}