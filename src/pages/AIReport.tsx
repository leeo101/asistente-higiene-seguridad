import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  CheckCircle2,
  Save,
  Building2,
  MapPin,
  User,
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import { toast } from 'react-hot-toast';
import { printElementAsDocument } from '../utils/pdfHelper';
import { safeGetLocalStorage } from '../utils/storageHelper';

export default function AIReport(): React.ReactElement | null {
  const { requirePro, isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();

  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [riskLevel, setRiskLevel] = useState('Medio');
  const [ppeOverrides, setPpeOverrides] = useState({
    helmetUsed: true,
    shoesUsed: true,
    glovesUsed: true,
    clothingUsed: true,
    glassesUsed: true,
    hearingUsed: true
  });
  const [showShare, setShowShare] = useState(false);
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  useEffect(() => {
    if (loading || !isPro) return;
    const parsedData = safeGetLocalStorage<any>('current_ai_inspection', null);
    if (parsedData) {
      setData(parsedData);
      setCompany(parsedData.company || 'Empresa Local');
      setLocation(parsedData.location || 'Planta Principal');
      setWorkerName(
        parsedData.workerName ||
          parsedData.operator ||
          (parsedData.type === 'general_risks' ? 'Responsable del Sector' : 'Operario en Puesto')
      );
      setTaskDescription(
        parsedData.taskDescription ||
          (parsedData.type === 'general_risks'
            ? 'Inspección general de condiciones y medio ambiente de trabajo (CyMAT)'
            : 'Verificación en puesto de uso obligatorio de Elementos de Protección Personal')
      );
      setNotes(parsedData.notes || parsedData.observations || '');
      setImmediateAction(parsedData.analysis?.immediateAction || '');
      setRiskLevel(parsedData.analysis?.riskLevel || (parsedData.analysis?.ppeComplete ? 'Bajo' : 'Alto'));
      setPpeOverrides({
        helmetUsed: Boolean(parsedData.analysis?.helmetUsed),
        shoesUsed: Boolean(parsedData.analysis?.shoesUsed),
        glovesUsed: Boolean(parsedData.analysis?.glovesUsed),
        clothingUsed: Boolean(parsedData.analysis?.clothingUsed),
        glassesUsed:
          parsedData.analysis?.glassesUsed !== undefined
            ? Boolean(parsedData.analysis.glassesUsed)
            : Boolean(parsedData.analysis?.ppeComplete),
        hearingUsed:
          parsedData.analysis?.hearingUsed !== undefined
            ? Boolean(parsedData.analysis.hearingUsed)
            : Boolean(parsedData.analysis?.ppeComplete)
      });
    }
  }, [isPro, loading]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-bold">Cargando permisos...</div>
      </div>
    );
  }

  if (!isPro) return null;
  if (!data) return <div className="container">Cargando informe técnico...</div>;

  const isGeneralRisks = data.type === 'general_risks';
  const computedPpeComplete =
    ppeOverrides.helmetUsed &&
    ppeOverrides.shoesUsed &&
    ppeOverrides.glovesUsed &&
    ppeOverrides.clothingUsed;

  const mergedReportData = {
    ...data,
    company,
    location,
    workerName,
    taskDescription,
    notes,
    analysis: {
      ...(data.analysis || {}),
      riskLevel,
      immediateAction,
      ...(isGeneralRisks
        ? {}
        : {
            ...ppeOverrides,
            ppeComplete: computedPpeComplete
          })
    }
  };

  const handleSaveChanges = () => {
    try {
      localStorage.setItem('current_ai_inspection', JSON.stringify(mergedReportData));
      const storageKey = isGeneralRisks ? 'ai_general_camera_history' : 'ai_camera_history';
      const history = safeGetLocalStorage<any[]>(storageKey, []);
      if (Array.isArray(history) && history.length > 0) {
        const updated = history.map((item: any) =>
          String(item.id) === String(mergedReportData.id)
            ? {
                ...item,
                company: mergedReportData.company,
                location: mergedReportData.location,
                workerName: mergedReportData.workerName,
                taskDescription: mergedReportData.taskDescription,
                notes: mergedReportData.notes,
                ppeComplete: mergedReportData.analysis?.ppeComplete,
                analysis: mergedReportData.analysis
              }
            : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        syncCollection(storageKey, updated);
      }
      setData(mergedReportData);
      toast.success('Datos del informe técnico actualizados y sincronizados');
    } catch (err) {
      console.error('Error al actualizar informe IA:', err);
      toast.error('No se pudieron guardar los cambios');
    }
  };

  const handlePrint = () =>
    requirePro(async () => {
      handleSaveChanges();
      try {
        toast.loading('Preparando documento A4...', { id: 'pdf-print' });
        await printElementAsDocument('pdf-content', `Informe IA – ${company || 'Seguridad'}`);
        toast.dismiss('pdf-print');
      } catch (err) {
        toast.dismiss('pdf-print');
        console.error('Error al imprimir con iframe, usando fallback nativo:', err);
        const el = document.getElementById('pdf-content');
        if (el) {
          document.body.classList.add('printing-isolated');
          el.classList.add('isolated-print-target');
        }
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-isolated');
          if (el) el.classList.remove('isolated-print-target');
        }, 1000);
      }
    });

  return (
    <div className="container max-w-5xl mx-auto pt-4 md:pt-8 pb-28 px-3 sm:px-4">
      <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Informe IA – ${company}`}
        text={`🤖 INFORME TÉCNICO DE INSPECCIÓN IA\n\n🏢 Empresa: ${company}\n📍 Sector: ${location}\n👤 Auditado: ${workerName}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString('es-AR') : ''}\n⚠️ Nivel de Riesgo: ${riskLevel}\n\nGenerado con Asistente H&S`}
        rawMessage={`🤖 INFORME TÉCNICO DE INSPECCIÓN IA\n\n🏢 Empresa: ${company}\n📍 Sector: ${location}\n👤 Auditado: ${workerName}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString('es-AR') : ''}\n⚠️ Nivel de Riesgo: ${riskLevel}\n\nGenerado con Asistente H&S`}
        elementIdToPrint="pdf-content"
        fileName={`Informe_IA_${(company || 'Seguridad').replace(/\s+/g, '_')}.pdf`}
      />

      {/* BARRA SUPERIOR RESPONSIVA */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ margin: 0, padding: '0 14px', height: '40px', fontSize: '0.78rem' }}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border-none rounded-xl font-black transition-all shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <ArrowLeft size={16} className="text-blue-400 shrink-0" />
          <span>VOLVER AL HISTORIAL</span>
        </button>

        <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveChanges}
            style={{ margin: 0, padding: '0 12px', height: '40px', fontSize: '0.76rem' }}
            className="flex items-center justify-center gap-1.5 rounded-xl font-extrabold text-white bg-slate-700 hover:bg-slate-600 border-none cursor-pointer shadow-sm transition-all whitespace-nowrap"
          >
            <Save size={15} className="shrink-0" />
            <span>Guardar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleSaveChanges();
              requirePro(() => setShowShare(true));
            }}
            style={{ margin: 0, padding: '0 12px', height: '40px', fontSize: '0.76rem' }}
            className="flex items-center justify-center gap-1.5 rounded-xl font-extrabold text-white bg-sky-600 hover:bg-sky-500 border-none cursor-pointer shadow-sm transition-all whitespace-nowrap"
          >
            <Share2 size={15} className="shrink-0" />
            <span>Compartir</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{ margin: 0, padding: '0 12px', height: '40px', fontSize: '0.76rem' }}
            className="flex items-center justify-center gap-1.5 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 border-none cursor-pointer shadow-sm transition-all whitespace-nowrap"
          >
            <Printer size={15} className="shrink-0" />
            <span>PDF A4</span>
          </button>
        </div>
      </div>

      {/* PANEL DE EDICIÓN TÉCNICA (NO SE IMPRIME, ACTUALIZA EL PDF EN VIVO) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="m-0 text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              Datos Técnicos del Acta (Edición en Vivo para el PDF)
            </h3>
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
              Completá o ajustá los datos del relevamiento antes de exportar o compartir el PDF oficial.
            </p>
          </div>
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {isGeneralRisks ? 'Modo: Riesgos IA' : 'Modo: Cámara EPP IA'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"
            >
              <Building2 size={13} /> Empresa / Cliente
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre de la empresa"
              style={{ margin: 0, padding: '0.5rem 0.75rem', height: '38px', fontSize: '0.84rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"
            >
              <MapPin size={13} /> Sector / Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Nave 2 / Taller"
              style={{ margin: 0, padding: '0.5rem 0.75rem', height: '38px', fontSize: '0.84rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"
            >
              <User size={13} /> {isGeneralRisks ? 'Responsable Sector' : 'Operario Auditado'}
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="Nombre y Apellido / Legajo"
              style={{ margin: 0, padding: '0.5rem 0.75rem', height: '38px', fontSize: '0.84rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"
            >
              <AlertTriangle size={13} /> Nivel de Riesgo
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.84rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              <option value="Bajo">Bajo / Controlado</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase block"
            >
              Acción Correctiva / Preventiva Inmediata (24 hs)
            </label>
            <input
              type="text"
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              placeholder="Medida inmediata exigida al sector u operario..."
              style={{ margin: 0, padding: '0.5rem 0.75rem', height: '38px', fontSize: '0.83rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label
              style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }}
              className="text-slate-600 dark:text-slate-300 uppercase block"
            >
              Observaciones Adicionales del Profesional
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones técnicas, N° de OT, condiciones del puesto..."
              style={{ margin: 0, padding: '0.5rem 0.75rem', height: '38px', fontSize: '0.83rem' }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {/* En modo EPP: Botones rápidos para validar/corregir detección de cada EPP */}
        {!isGeneralRisks && (
          <div className="mb-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Validación Profesional de EPP en Escena (Tocá para alternar Cumple / Falta):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { key: 'helmetUsed', label: 'Casco IRAM 3620' },
                { key: 'shoesUsed', label: 'Calzado IRAM 3610' },
                { key: 'glovesUsed', label: 'Guantes IRAM 3607' },
                { key: 'clothingUsed', label: 'Ropa / Chaleco' },
                { key: 'glassesUsed', label: 'Prot. Ocular' },
                { key: 'hearingUsed', label: 'Prot. Auditiva' }
              ].map((item) => {
                const active = Boolean((ppeOverrides as any)[item.key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setPpeOverrides((prev) => ({
                        ...prev,
                        [item.key]: !(prev as any)[item.key]
                      }))
                    }
                    style={{
                      margin: 0,
                      padding: '6px 10px',
                      height: '36px',
                      fontSize: '0.73rem',
                      backgroundColor: active ? '#dcfce7' : '#fee2e2',
                      color: active ? '#166534' : '#991b1b',
                      border: `1.5px solid ${active ? '#86efac' : '#fca5a5'}`
                    }}
                    className="rounded-xl font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>{active ? '✓' : '✕'}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Configuración de Firmas */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase">
            Firmas a incluir en el PDF A4:
          </span>
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            {[
              { key: 'operator', label: isGeneralRisks ? 'Resp. Sector' : 'Operador' },
              { key: 'supervisor', label: 'Supervisor' },
              { key: 'professional', label: 'Profesional' }
            ].map((sig) => {
              const checked = Boolean((showSignatures as any)[sig.key]);
              return (
                <button
                  key={sig.key}
                  type="button"
                  onClick={() =>
                    setShowSignatures((prev) => ({
                      ...prev,
                      [sig.key]: !(prev as any)[sig.key]
                    }))
                  }
                  style={{
                    margin: 0,
                    padding: '0 12px',
                    height: '34px',
                    fontSize: '0.74rem',
                    backgroundColor: checked ? '#eff6ff' : 'transparent',
                    color: checked ? '#1d4ed8' : '#64748b',
                    border: `1.5px solid ${checked ? '#3b82f6' : '#cbd5e1'}`
                  }}
                  className="rounded-xl font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle2 size={13} className={checked ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{sig.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VISTA PREVIA Y DOCUMENTO IMPRIMIBLE A4 */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-x-auto">
        <AiReportPdfGenerator data={mergedReportData} showSignatures={showSignatures} />
      </div>
    </div>
  );
}
