import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { 
  Building2, 
  Flame, 
  ShieldCheck, 
  AlertTriangle,
  Wind,
  Save,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { generateLegajoPDF } from '../utils/pdf/legajoPdfGenerator';

const TABS = [
  { id: 'empresa', label: 'Datos Empresa', icon: Building2 },
  { id: 'riesgos', label: 'Riesgos', icon: AlertTriangle },
  { id: 'incendio', label: 'Incendio', icon: Flame },
  { id: 'epp', label: 'EPP & Capacitación', icon: ShieldCheck },
  { id: 'ambiente', label: 'Medio Ambiente', icon: Wind },
];

export default function LegajoForm() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const isAdmin = currentUser?.email?.toLowerCase().trim() === 'enzorodriguez31@gmail.com';
  const hasAccess = isPro || isAdmin;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState({
    empresa: {
      razonSocial: '',
      cuit: '',
      domicilio: '',
      localidad: '',
      actividad: '',
      art: '',
      cantidadEmpleados: '',
      superficie: ''
    },
    riesgos: {
      fisicos: '',
      quimicos: '',
      biologicos: '',
      ergonomicos: '',
      medidasPreventivas: ''
    },
    incendio: {
      cargaFuego: '',
      riesgoIncendio: '',
      cantidadExtintores: '',
      tipoExtintores: '',
      planEvacuacion: false,
      fechaSimulacro: ''
    },
    epp: {
      ropaTrabajo: false,
      calzadoSeguridad: false,
      proteccionOcular: false,
      proteccionAuditiva: false,
      proteccionRespiratoria: false,
      capacitacionRealizada: '',
      proximaCapacitacion: ''
    },
    ambiente: {
      iluminacionFecha: '',
      iluminacionApto: true,
      ruidoFecha: '',
      ruidoApto: true,
      puestaTierraFecha: '',
      puestaTierraApto: true
    }
  });

  useEffect(() => {
    if (id && currentUser) {
      loadLegajo(id);
    }
  }, [id, currentUser]);

  const loadLegajo = async (legajoId: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'legajos', legajoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          empresa: data.empresa || formData.empresa,
          riesgos: data.riesgos || formData.riesgos,
          incendio: data.incendio || formData.incendio,
          epp: data.epp || formData.epp,
          ambiente: data.ambiente || formData.ambiente,
        });
      }
    } catch (error) {
      console.error("Error loading legajo", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const docRef = id 
        ? doc(db, 'users', currentUser.uid, 'legajos', id)
        : doc(collection(db, 'users', currentUser.uid, 'legajos'));
      
      const legajoData = {
        ...formData,
        companyName: formData.empresa.razonSocial,
        cuit: formData.empresa.cuit,
        updatedAt: Date.now()
      };

      await setDoc(docRef, legajoData, { merge: true });
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      if (!id) {
        navigate(`/legajos/editar/${docId}`, { replace: true });
      }
    } catch (error) {
      console.error("Error saving legajo", error);
      alert("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!hasAccess) {
      alert("La exportación a PDF requiere una suscripción PRO");
      navigate('/subscription');
      return;
    }
    
    try {
      await generateLegajoPDF(formData);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Hubo un error al generar el PDF");
    }
  };

  const handleChange = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) return <div className="text-center p-12 pt-32">Cargando datos del legajo...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-24 px-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/legajos')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {id ? 'Editar Legajo Técnico' : 'Nuevo Legajo Técnico'}
              </h1>
              <p className="text-sm text-slate-500">Decreto 351/79</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium disabled:opacity-50"
            >
              {isSaved ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar Datos'}
            </button>
            
            {id && (
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
              >
                Generar PDF Final
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Forms Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        
        {/* EMPRESA TAB */}
        {activeTab === 'empresa' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Datos del Establecimiento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                <input 
                  type="text" 
                  value={formData.empresa.razonSocial}
                  onChange={e => handleChange('empresa', 'razonSocial', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej: Metalúrgica San Martín S.A."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                <input 
                  type="text" 
                  value={formData.empresa.cuit}
                  onChange={e => handleChange('empresa', 'cuit', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="30-12345678-9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Domicilio Completo</label>
                <input 
                  type="text" 
                  value={formData.empresa.domicilio}
                  onChange={e => handleChange('empresa', 'domicilio', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Calle, Número, Piso, Dpto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Principal</label>
                <input 
                  type="text" 
                  value={formData.empresa.actividad}
                  onChange={e => handleChange('empresa', 'actividad', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aseguradora (ART)</label>
                <input 
                  type="text" 
                  value={formData.empresa.art}
                  onChange={e => handleChange('empresa', 'art', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Empleados</label>
                <input 
                  type="number" 
                  value={formData.empresa.cantidadEmpleados}
                  onChange={e => handleChange('empresa', 'cantidadEmpleados', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²)</label>
                <input 
                  type="number" 
                  value={formData.empresa.superficie}
                  onChange={e => handleChange('empresa', 'superficie', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* RIESGOS TAB */}
        {activeTab === 'riesgos' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Identificación de Riesgos</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Físicos presentes</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.fisicos}
                  onChange={e => handleChange('riesgos', 'fisicos', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Ej: Ruido continuo en sector producción, carga térmica en hornos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Químicos / Riesgo Ambiental</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.quimicos}
                  onChange={e => handleChange('riesgos', 'quimicos', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Sustancias utilizadas, vapores, material particulado..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medidas Preventivas Generales Adoptadas</label>
                <textarea 
                  rows={4}
                  value={formData.riesgos.medidasPreventivas}
                  onChange={e => handleChange('riesgos', 'medidasPreventivas', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Ej: Sistema de extracción localizada instalada. Guardas de seguridad mecánicas..."
                />
              </div>
            </div>
          </div>
        )}

        {/* INCENDIO TAB */}
        {activeTab === 'incendio' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Protección Contra Incendios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carga de Fuego Calculada (Mcal/m²)</label>
                <input 
                  type="text" 
                  value={formData.incendio.cargaFuego}
                  onChange={e => handleChange('incendio', 'cargaFuego', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgo de Incendio (R1 a R7)</label>
                <select 
                  value={formData.incendio.riesgoIncendio}
                  onChange={e => handleChange('incendio', 'riesgoIncendio', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Seleccione...</option>
                  <option value="R1">Riesgo 1 (Explosivo)</option>
                  <option value="R2">Riesgo 2 (Inflamable)</option>
                  <option value="R3">Riesgo 3 (Muy Combustible)</option>
                  <option value="R4">Riesgo 4 (Combustible)</option>
                  <option value="R5">Riesgo 5 (Poco Combustible)</option>
                  <option value="R6">Riesgo 6 (Incombustible)</option>
                  <option value="R7">Riesgo 7 (Refractario)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Total de Extintores</label>
                <input 
                  type="number" 
                  value={formData.incendio.cantidadExtintores}
                  onChange={e => handleChange('incendio', 'cantidadExtintores', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input 
                  type="checkbox" 
                  id="planEvacuacion"
                  checked={formData.incendio.planEvacuacion}
                  onChange={e => handleChange('incendio', 'planEvacuacion', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor="planEvacuacion" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Cuenta con Plan de Evacuación aprobado
                </label>
              </div>
            </div>
          </div>
        )}

        {/* EPP TAB */}
        {activeTab === 'epp' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">EPP y Capacitaciones</h2>
            
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-3">Elementos de Protección Personal (Res 299/11)</p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.ropaTrabajo} onChange={e => handleChange('epp', 'ropaTrabajo', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Ropa de Trabajo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.calzadoSeguridad} onChange={e => handleChange('epp', 'calzadoSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Calzado de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionOcular} onChange={e => handleChange('epp', 'proteccionOcular', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Ocular</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionAuditiva} onChange={e => handleChange('epp', 'proteccionAuditiva', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Auditiva</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Última Capacitación General (Tema y Fecha)</label>
                <textarea 
                  rows={2}
                  value={formData.epp.capacitacionRealizada}
                  onChange={e => handleChange('epp', 'capacitacionRealizada', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Uso de extintores - 15/05/2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Capacitación Programada</label>
                <textarea 
                  rows={2}
                  value={formData.epp.proximaCapacitacion}
                  onChange={e => handleChange('epp', 'proximaCapacitacion', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Riesgo Eléctrico - Octubre 2024"
                />
              </div>
            </div>
          </div>
        )}

        {/* AMBIENTE TAB */}
        {activeTab === 'ambiente' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Estudios de Medio Ambiente (Res 905/15)</h2>
            
            <div className="space-y-4">
              {/* Iluminación */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Medición de Iluminación (Res 84/12)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select 
                      value={formData.ambiente.iluminacionApto ? "si" : "no"}
                      onChange={e => handleChange('ambiente', 'iluminacionApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input 
                    type="date" 
                    value={formData.ambiente.iluminacionFecha}
                    onChange={e => handleChange('ambiente', 'iluminacionFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Ruido */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Medición de Ruido (Res 85/12)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select 
                      value={formData.ambiente.ruidoApto ? "si" : "no"}
                      onChange={e => handleChange('ambiente', 'ruidoApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input 
                    type="date" 
                    value={formData.ambiente.ruidoFecha}
                    onChange={e => handleChange('ambiente', 'ruidoFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

               {/* PAT */}
               <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Puesta a Tierra (Res 900/15)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select 
                      value={formData.ambiente.puestaTierraApto ? "si" : "no"}
                      onChange={e => handleChange('ambiente', 'puestaTierraApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input 
                    type="date" 
                    value={formData.ambiente.puestaTierraFecha}
                    onChange={e => handleChange('ambiente', 'puestaTierraFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
