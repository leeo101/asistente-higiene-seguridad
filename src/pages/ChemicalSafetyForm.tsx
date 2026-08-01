import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical, Shield, AlertTriangle, Printer, Share2, Pencil, CheckCircle2, Building2, Package } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';

const GHS_PICTOGRAMS = {
  explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
  flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
  oxidizing: { icon: '🔥', name: 'Comburente', color: '#dc2626' },
  corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
  toxic: { icon: '💀', name: 'Tóxico', color: '#dc2626' },
  harmful: { icon: '⚠️', name: 'Nocivo', color: '#f59e0b' },
  irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' },
  sensitizing: { icon: '🫁', name: 'Sensibilizante', color: '#f59e0b' },
  carcinogenic: { icon: '🫁', name: 'Carcinógeno', color: '#dc2626' },
  environmental: { icon: '🌊', name: 'Peligro Ambiente', color: '#16a34a' },
  pressure: { icon: '📦', name: 'Gas a Presión', color: '#dc2626' }
};

const HAZARD_CATEGORIES = [
  { id: 'fisico', name: 'Peligro Físico', icon: '🔥' },
  { id: 'salud', name: 'Peligro para la Salud', icon: '🏥' },
  { id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }
];

export default function ChemicalSafetyForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Producto Químico' : 'Nuevo Producto Químico');

  const [chemical, setChemical] = useState<any>({
    name: '',
    casNumber: '',
    unNumber: '',
    category: 'fisico',
    hazards: [],
    pictograms: [],
    storage: '',
    location: '',
    quantity: '',
    unit: 'L',
    supplier: '',
    sdsDate: '',
    expiryDate: '',
    hazardStatements: [],
    precautionaryStatements: [],
    ppe: {
      gloves: false,
      mask: false,
      goggles: false,
      apron: false
    },
    firstAid: {
      inhalation: '',
      skin: '',
      eyes: '',
      ingestion: ''
    },
    signature: '',
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setChemical((prev: any) => {
      const currentObj = (prev && typeof prev.showSignatures === 'object' && prev.showSignatures !== null)
        ? prev.showSignatures
        : { operator: true, professional: true, supervisor: true };
      const updated = typeof updater === 'function' ? updater(currentObj) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = (chemical && typeof chemical.showSignatures === 'object' && chemical.showSignatures !== null)
    ? chemical.showSignatures
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
      } else {
        setProfessional((prev: any) => ({ ...prev, signature, stamp }));
      }
    } catch (e) {
      console.error('Error al cargar datos profesionales:', e);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const editData = location.state.editData;
      setChemical({
        ...editData,
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
    }
  }, [location.state]);

  const handleSave = () => {
    if (!chemical.name.trim()) {
      toast.error('Por favor complete el Nombre del Producto');
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');
      let updated;

      const entryToSave = {
        ...chemical,
        professionalSignature: chemical.professionalSignature || professional.signature,
        professionalName: chemical.professionalName || professional.name,
        professionalLicense: chemical.professionalLicense || professional.license,
        professionalStamp: chemical.professionalStamp || professional.stamp,
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        updated = saved.map((c: any) => (c.id === chemical.id ? entryToSave : c));
        toast.success('Ficha actualizada correctamente');
      } else {
        const newEntry = {
          ...entryToSave,
          id: `CHEM-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        updated = [newEntry, ...saved];
        toast.success('Ficha guardada correctamente');
      }

      localStorage.setItem('chemical_safety_db', JSON.stringify(updated));
      navigate('/chemical-safety');
    } catch (e) {
      console.error('Error al guardar producto químico:', e);
      toast.error('Error al guardar el producto');
    }
  };

  const togglePictogram = (pictoKey: string) => {
    const current = chemical.pictograms || [];
    const updated = current.includes(pictoKey)
      ? current.filter((p: string) => p !== pictoKey)
      : [...current, pictoKey];
    setChemical({ ...chemical, pictograms: updated });
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
            title="Ficha Técnica Química (SDS)"
            text={`Ficha de Seguridad: ${chemical.name || 'Sustancia Quíimica'}`}
            rawMessage={`Ficha de Seguridad: ${chemical.name || 'Sustancia Química'}`}
            fileName={`Quimico_${chemical.name || 'Sin_Nombre'}.pdf`}
          />

          {/* Header Principal Limpio */}
          <PremiumHeader
            title={isEdit ? 'Editar Producto Químico' : 'Nuevo Producto Químico'}
            subtitle="Ficha Técnica de Seguridad basada en el Sistema Globalmente Armonizado (SGA/GHS)"
            icon={<FlaskConical size={32} color="#ffffff" />}
          />

          {/* Botón Volver Chiquito Arriba */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/chemical-safety')}
              style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Volver al Historial
            </button>
          </div>

          {/* Sección 1: Datos del Producto */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <FlaskConical size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                1. Identificación del Producto
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Nombre Comercial / Químico *
                </label>
                <input
                  type="text"
                  value={chemical.name || ''}
                  onChange={(e) => setChemical({ ...chemical, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Ej: Acetona, Ácido Sulfúrico, Cloro..."
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Número CAS
                </label>
                <input
                  type="text"
                  value={chemical.casNumber || ''}
                  onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej: 67-64-1"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Número UN
                </label>
                <input
                  type="text"
                  value={chemical.unNumber || ''}
                  onChange={(e) => setChemical({ ...chemical, unNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej: UN1090"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Categoría de Peligro
                </label>
                <select
                  value={chemical.category || 'fisico'}
                  onChange={(e) => setChemical({ ...chemical, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {HAZARD_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Ubicación / Depósito
                </label>
                <input
                  type="text"
                  value={chemical.location || ''}
                  onChange={(e) => setChemical({ ...chemical, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej: Almacén Inflamables"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Cantidad en Stock
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={chemical.quantity || ''}
                    onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej: 100"
                  />
                  <select
                    value={chemical.unit || 'L'}
                    onChange={(e) => setChemical({ ...chemical, unit: e.target.value })}
                    className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs"
                  >
                    <option value="L">Litros (L)</option>
                    <option value="kg">Kilos (kg)</option>
                    <option value="m3">m³</option>
                    <option value="unidades">Unid.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={chemical.supplier || ''}
                  onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Fecha Vencimiento SDS
                </label>
                <input
                  type="date"
                  value={chemical.expiryDate || chemical.sdsDate || ''}
                  onChange={(e) => setChemical({ ...chemical, expiryDate: e.target.value, sdsDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Pictogramas SGA */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                2. Pictogramas SGA (Sistema Globalmente Armonizado)
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {Object.entries(GHS_PICTOGRAMS).map(([key, item]) => {
                const isSelected = (chemical.pictograms || []).includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePictogram(key)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-extrabold uppercase block">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección 3: Indicaciones Frases H y P */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Shield size={18} className="text-amber-600 dark:text-amber-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                3. Indicaciones de Peligro y Prudencia (Frases H & P)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-red-700 dark:text-red-400">
                  ⚠️ Indicaciones de Peligro (Frases H)
                </label>
                <textarea
                  rows={3}
                  value={
                    Array.isArray(chemical.hazardStatements)
                      ? chemical.hazardStatements.join(', ')
                      : chemical.hazardStatements || chemical.riskPhrases || ''
                  }
                  onChange={(e) => setChemical({ ...chemical, hazardStatements: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Ej: H225 Líquido y vapores muy inflamables. H319 Provoca irritación ocular grave."
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400">
                  🛡️ Consejos de Prudencia (Frases P)
                </label>
                <textarea
                  rows={3}
                  value={
                    Array.isArray(chemical.precautionaryStatements)
                      ? chemical.precautionaryStatements.join(', ')
                      : chemical.precautionaryStatements || chemical.safetyPhrases || ''
                  }
                  onChange={(e) => setChemical({ ...chemical, precautionaryStatements: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej: P210 Mantener alejado del calor. P305 EN CASO DE CONTACTO CON LOS OJOS Aclarar cuidadosamente con agua."
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Firmas y Autorizaciones */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Pencil size={18} className="text-purple-600 dark:text-purple-400" />
              <h2 className="m-0 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                4. Firmas y Autorizaciones del Reporte
              </h2>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <span className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-wider block">
                MOSTRAR BLOQUES DE FIRMA EN EL PDF:
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'operator', label: 'Personal Afectado' },
                  { id: 'professional', label: 'Especialista H&S' },
                  { id: 'supervisor', label: 'Supervisión / Cierre' }
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
                    Firma Personal Afectado
                  </div>
                  <SignatureCanvas
                    onSave={(sig) => setChemical((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={chemical.operatorSignature}
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
                    onSave={(sig) => setChemical((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                    initialImage={chemical.professionalSignature || professional?.signature}
                    label=""
                  />
                </div>
              )}

              {showSignatures.supervisor && (
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                    Firma Supervisor / Cierre
                  </div>
                  <SignatureCanvas
                    onSave={(sig) => setChemical((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                    initialImage={chemical.supervisorSignature || chemical.signature}
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
              <CheckCircle2 size={14} /> Guardar Ficha
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
          <ChemicalSafetyPdf
            data={{
              ...chemical,
              id: (chemical as any).id || Date.now().toString(),
              createdAt: (chemical as any).createdAt || new Date().toISOString(),
              professionalSignature: chemical.professionalSignature || professional?.signature,
              professionalName: chemical.professionalName || professional?.name,
              professionalLicense: chemical.professionalLicense || professional?.license,
              professionalStamp: chemical.professionalStamp || professional?.stamp
            }}
          />
        </div>

      </div>
    </AnimatedPage>
  );
}