import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowLeft, Save, Plus, Trash2, Cpu,
  ShieldCheck, AlertTriangle, Info, CheckCircle2
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import {
  ATEXZoneAssessment, ATEXEquipmentItem, ATEX_ZONES_GUIDE
} from '../data/atexData';
import toast from 'react-hot-toast';

export default function ATEXAssessmentForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [assessmentNumber] = useState(`ATEX-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState(activeCompany?.name || '');
  const [areaName, setAreaName] = useState('');
  const [substanceType, setSubstanceType] = useState<any>('gas_vapor');
  const [substanceName, setSubstanceName] = useState('');
  const [flashPointC, setFlashPointC] = useState<string>('');
  const [lelPercent, setLelPercent] = useState<string>('');
  const [ignitionTempC, setIgnitionTempC] = useState<string>('');
  
  const [assignedZone, setAssignedZone] = useState<any>('1');
  const [ventilationType, setVentilationType] = useState<any>('forced_mechanical');
  const [ventilationDegree, setVentilationDegree] = useState<any>('medium');

  const [safetyControls, setSafetyControls] = useState({
    groundingBonding: true,
    gasDetectionSystem: true,
    nonSparkingTools: true,
    antistaticFootwearRequired: true,
    hotWorkPermitMandatory: true
  });

  // Equipos Ex
  const [equipmentList, setEquipmentList] = useState<ATEXEquipmentItem[]>([
    {
      id: 'eq_1',
      tag: 'MOT-01',
      description: 'Motor de bomba de trasvase de solventes',
      exMarking: 'II 2G Ex d IIC T4 Gb',
      protectionMode: 'Ex_d',
      gasGroup: 'IIC',
      tempClass: 'T4',
      ipRating: 'IP66',
      certificateNumber: 'INTI-ATEX-2023-014',
      complianceStatus: 'compliant'
    }
  ]);

  const [auditorName, setAuditorName] = useState('');
  const [auditorEnrollment, setAuditorEnrollment] = useState('');
  const [notes, setNotes] = useState('');

  const addEquipment = () => {
    const newItem: ATEXEquipmentItem = {
      id: `eq_${Date.now()}`,
      tag: `EQ-${equipmentList.length + 1}`,
      description: '',
      exMarking: 'II 2G Ex d IIB T4',
      protectionMode: 'Ex_d',
      gasGroup: 'IIB',
      tempClass: 'T4',
      ipRating: 'IP65',
      certificateNumber: '',
      complianceStatus: 'compliant'
    };
    setEquipmentList([...equipmentList, newItem]);
  };

  const removeEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter(e => e.id !== id));
  };

  const updateEquipment = (id: string, field: string, value: any) => {
    setEquipmentList(equipmentList.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!areaName.trim() || !substanceName.trim() || !auditorName.trim()) {
      toast.error('Completa los campos obligatorios (Sector, Sustancia y Profesional Auditor).');
      return;
    }

    const newAssessment: ATEXZoneAssessment = {
      id: `atex_${Date.now()}`,
      companyId: activeCompany?.id,
      assessmentNumber,
      date,
      facilityName,
      areaName,
      substanceType,
      substanceName,
      flashPointC: flashPointC ? parseFloat(flashPointC) : undefined,
      lelPercent: lelPercent ? parseFloat(lelPercent) : undefined,
      ignitionTempC: ignitionTempC ? parseFloat(ignitionTempC) : undefined,
      assignedZone,
      ventilationType,
      ventilationDegree,
      safetyControls,
      equipmentList,
      auditorName,
      auditorEnrollment,
      status: 'valid',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('atex_assessments_db');
    let list: ATEXZoneAssessment[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newAssessment);
    localStorage.setItem('atex_assessments_db', JSON.stringify(list));

    toast.success('Evaluación de área clasificada ATEX registrada con éxito');
    navigate('/atex');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <PremiumHeader
        title="Nueva Evaluación de Área ATEX"
        subtitle="Determinación de zonas de riesgo explosivo e inventario de equipos certificados bajo IEC 60079"
        badge="IEC 60079"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <button
          onClick={() => navigate('/atex')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a evaluaciones ATEX
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Bloque 1: Ubicación y Sustancia */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} />
              1. Identificación del Sector y Sustancia Inflamable
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  N° de Informe / Estudio
                </label>
                <input
                  type="text"
                  value={assessmentNumber}
                  readOnly
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha del Estudio *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Establecimiento / Planta
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={e => setFacilityName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Sector / Nave / Instalación Evaluada *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sala de Bombas de Solventes, Tolva de Harina N° 2"
                  value={areaName}
                  onChange={e => setAreaName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Atmósfera
                </label>
                <select
                  value={substanceType}
                  onChange={e => setSubstanceType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="gas_vapor">Gases, Vapores o Nieblas Inflamables</option>
                  <option value="combustible_dust">Polvos Combustibles / Fibras</option>
                  <option value="hybrid">Mezcla Híbrida (Gas + Polvo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nombre de la Sustancia *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tolueno, Etanol, Polvo de Grano"
                  value={substanceName}
                  onChange={e => setSubstanceName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Punto de Inflamación (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 4.0"
                  value={flashPointC}
                  onChange={e => setFlashPointC(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Límite Inferior de Explosividad (LEL %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 1.2"
                  value={lelPercent}
                  onChange={e => setLelPercent(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Clasificación de Zona */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="text-amber-500" size={20} />
              2. Clasificación de Zona Asignada y Ventilación
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Zona Peligrosa Asignada *
                </label>
                <select
                  value={assignedZone}
                  onChange={e => setAssignedZone(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-amber-700 dark:text-amber-300"
                >
                  <option value="0">Zona 0 (Gas continuo &gt;1000 h/año)</option>
                  <option value="1">Zona 1 (Gas normal 10 a 1000 h/año)</option>
                  <option value="2">Zona 2 (Gas ocasional &lt;10 h/año)</option>
                  <option value="20">Zona 20 (Polvo continuo)</option>
                  <option value="21">Zona 21 (Polvo en operación normal)</option>
                  <option value="22">Zona 22 (Polvo ocasional)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {(ATEX_ZONES_GUIDE as any)[assignedZone]?.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo de Ventilación
                  </label>
                  <select
                    value={ventilationType}
                    onChange={e => setVentilationType(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="natural">Natural</option>
                    <option value="forced_mechanical">Mecánica Forzada</option>
                    <option value="none">Sin Ventilación / Confinado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Grado de Dilución
                  </label>
                  <select
                    value={ventilationDegree}
                    onChange={e => setVentilationDegree(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="high">Alto</option>
                    <option value="medium">Medio</option>
                    <option value="low">Bajo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Medidas Obligatorias de Control de Fuentes de Ignición:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { k: 'groundingBonding', label: 'Puesta a tierra disipativa e interconexión equipotencial' },
                  { k: 'gasDetectionSystem', label: 'Sistema de detección fija de gases con alarma acústica' },
                  { k: 'nonSparkingTools', label: 'Herramientas de mano antiexplosivas / antichispas' },
                  { k: 'antistaticFootwearRequired', label: 'Calzado antiestático y ropa de algodón al 100%' },
                  { k: 'hotWorkPermitMandatory', label: 'Permiso de trabajo en caliente mandatario para toda tarea' }
                ].map(item => (
                  <label key={item.k} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(safetyControls as any)[item.k]}
                      onChange={() => setSafetyControls(prev => ({ ...prev, [item.k]: !(prev as any)[item.k] }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bloque 3: Inventario de Equipos Ex */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Cpu className="text-amber-500" size={20} />
                3. Inventario y Auditoría de Equipamiento con Protección Ex
              </h2>
              <button
                type="button"
                onClick={addEquipment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                <Plus size={14} /> Agregar Equipo Ex
              </button>
            </div>

            <div className="space-y-3">
              {equipmentList.map((eq, idx) => (
                <div key={eq.id} className="p-3 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Equipo #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(eq.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Tag / Código</label>
                      <input
                        type="text"
                        value={eq.tag}
                        onChange={e => updateEquipment(eq.id, 'tag', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500">Descripción del Equipo</label>
                      <input
                        type="text"
                        value={eq.description}
                        onChange={e => updateEquipment(eq.id, 'description', e.target.value)}
                        placeholder="Ej. Luminaria estanca o Motor agitador"
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Modo Protección</label>
                      <select
                        value={eq.protectionMode}
                        onChange={e => updateEquipment(eq.id, 'protectionMode', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      >
                        <option value="Ex_d">Ex d (Antideflagrante)</option>
                        <option value="Ex_e">Ex e (Seguridad Aumentada)</option>
                        <option value="Ex_ia">Ex ia (Intrínseca Zona 0)</option>
                        <option value="Ex_ib">Ex ib (Intrínseca Zona 1)</option>
                        <option value="Ex_p">Ex p (Presurizado)</option>
                        <option value="Ex_t">Ex t (Polvos)</option>
                        <option value="standard_non_ex">No certificado (Inseguro)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Grupo de Gas / Polvo</label>
                      <select
                        value={eq.gasGroup}
                        onChange={e => updateEquipment(eq.id, 'gasGroup', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      >
                        <option value="IIA">IIA (Propano)</option>
                        <option value="IIB">IIB (Etileno)</option>
                        <option value="IIC">IIC (Hidrógeno / Acetileno)</option>
                        <option value="IIIA">IIIA (Fibras)</option>
                        <option value="IIIB">IIIB (Polvos no conductores)</option>
                        <option value="IIIC">IIIC (Polvos conductores)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Clase de Temperatura</label>
                      <select
                        value={eq.tempClass}
                        onChange={e => updateEquipment(eq.id, 'tempClass', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      >
                        <option value="T1">T1 (450°C)</option>
                        <option value="T2">T2 (300°C)</option>
                        <option value="T3">T3 (200°C)</option>
                        <option value="T4">T4 (135°C)</option>
                        <option value="T5">T5 (100°C)</option>
                        <option value="T6">T6 (85°C)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">N° Certificado Oficial</label>
                      <input
                        type="text"
                        value={eq.certificateNumber}
                        onChange={e => updateEquipment(eq.id, 'certificateNumber', e.target.value)}
                        placeholder="Ej. INTI o IECEx..."
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Estado Conformidad</label>
                      <select
                        value={eq.complianceStatus}
                        onChange={e => updateEquipment(eq.id, 'complianceStatus', e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-semibold text-emerald-600"
                      >
                        <option value="compliant">APTO PARA ZONA</option>
                        <option value="non_compliant">NO CONFORME (RIESGO)</option>
                        <option value="pending_verification">PENDIENTE INSPECCIÓN</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque 4: Auditor */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="text-blue-500" size={20} />
              4. Profesional Responsable del Estudio
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Especialista HyS Auditor *
                </label>
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={auditorName}
                  onChange={e => setAuditorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Matrícula Profesional / Registro
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mat. COPIME / CIPBA"
                  value={auditorEnrollment}
                  onChange={e => setAuditorEnrollment(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conclusiones y Recomendaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de sellado de conduit, prensaestopas Ex o adecuaciones requeridas..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/atex')}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Save size={16} /> Guardar Estudio ATEX
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
