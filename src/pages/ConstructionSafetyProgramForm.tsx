import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, ArrowLeft, Save, Building, Users, Calendar,
  ShieldCheck, AlertTriangle, FileText, CheckCircle2, ChevronRight,
  Eye, Printer, X, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import {
  ConstructionProgramData, DEFAULT_CONSTRUCTION_STAGES, ConstructionStage
} from '../data/constructionSafetyData';
import { printElementAsDocument } from '../utils/pdfHelper';
import ConstructionSafetyProgramPdf from '../components/ConstructionSafetyProgramPdf';
import toast from 'react-hot-toast';

export default function ConstructionSafetyProgramForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [step, setStep] = useState<number>(1);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(() => (typeof window !== "undefined" && window.innerWidth < 640 ? 0.45 : 1));
  const [programNumber] = useState(`OBRA-${Date.now().toString().slice(-6)}`);
  const [contractorName, setContractorName] = useState(activeCompany?.name || '');
  const [contractorCuit, setContractorCuit] = useState(activeCompany?.cuit || '');
  const [artName, setArtName] = useState(activeCompany?.art || '');
  const [comitenteName, setComitenteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Buenos Aires');
  const [siteSurfaceM2, setSiteSurfaceM2] = useState<number>(500);
  const [estimatedWorkers, setEstimatedWorkers] = useState<number>(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState<number>(6);
  const [workType, setWorkType] = useState<any>('edificacion');

  // Causales Res. SRT 51/97
  const [reasons, setReasons] = useState({
    excavationDeep: true,
    heightWork: true,
    demolition: false,
    largeSurface: false,
    highVoltage: false,
    confinedSpacesOrTunnels: false
  });

  // Etapas
  const [stages, setStages] = useState<ConstructionStage[]>(DEFAULT_CONSTRUCTION_STAGES);

  // Servicio de HyS
  const [professionalName, setProfessionalName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [weeklyVisitHours, setWeeklyVisitHours] = useState<number>(5);
  const [emergencyClinic, setEmergencyClinic] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('0800-333-1234');
  const [notes, setNotes] = useState('');

  const toggleStage = (id: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, included: !s.included } : s));
  };

  const handleSave = () => {
    if (!contractorName.trim() || !siteAddress.trim() || !professionalName.trim()) {
      toast.error('Completa los campos obligatorios (Contratista, Dirección y Profesional HyS).');
      return;
    }

    const newProgram: ConstructionProgramData = {
      id: `prog_${Date.now()}`,
      companyId: activeCompany?.id,
      programNumber,
      contractorName,
      contractorCuit,
      artName,
      comitenteName,
      siteAddress,
      city,
      province,
      siteSurfaceM2,
      estimatedWorkers,
      startDate,
      estimatedDurationMonths,
      workType,
      reasons,
      stages,
      hygieneService: {
        professionalName,
        enrollmentNumber,
        weeklyVisitHours,
        emergencyClinic,
        emergencyPhone
      },
      notes,
      status: 'submitted_to_art',
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('construction_safety_programs_db');
    let list: ConstructionProgramData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) {}
    }
    list.unshift(newProgram);
    localStorage.setItem('construction_safety_programs_db', JSON.stringify(list));

    toast.success('Programa de seguridad de obra confeccionado con éxito');
    navigate('/construction-safety-program');
  };

  const currentProgramData: ConstructionProgramData = {
    id: `prog_draft`,
    companyId: activeCompany?.id,
    programNumber,
    contractorName: contractorName || 'Constructora',
    contractorCuit: contractorCuit || '30-00000000-0',
    artName,
    comitenteName: comitenteName || 'Comitente',
    siteAddress: siteAddress || 'Dirección de Obra',
    city,
    province,
    siteSurfaceM2,
    estimatedWorkers,
    startDate,
    estimatedDurationMonths,
    workType,
    reasons,
    stages,
    hygieneService: {
      professionalName: professionalName || 'Profesional H&S',
      enrollmentNumber,
      weeklyVisitHours,
      emergencyClinic,
      emergencyPhone
    },
    notes,
    status: 'submitted_to_art',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <PremiumHeader
        title="Confección de Programa de Seguridad de Obra"
        subtitle="Generador reglamentario para presentación formal ante la ART bajo Decreto 911/96 y Res. SRT 51/97"
        badge="Dec. 911/96"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <button
          onClick={() => navigate('/construction-safety-program')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a programas de obra
        </button>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { num: 1, label: 'Datos de Obra' },
            { num: 2, label: 'Aviso y Causales' },
            { num: 3, label: 'Etapas y Riesgos' },
            { num: 4, label: 'Servicio HyS' }
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                step === s.num
                  ? 'bg-amber-500 text-white shadow-sm'
                  : step > s.num
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: Datos de la Obra */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Building className="text-amber-500" size={20} />
              1. Identificación de la Obra, Contratista y Comitente
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Empresa Constructora / Contratista *
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={e => setContractorName(e.target.value)}
                  placeholder="Razón Social del Constructor"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  CUIT del Contratista
                </label>
                <input
                  type="text"
                  value={contractorCuit}
                  onChange={e => setContractorCuit(e.target.value)}
                  placeholder="XX-XXXXXXXX-X"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Aseguradora de Riesgos del Trabajo (ART)
                </label>
                <input
                  type="text"
                  value={artName}
                  onChange={e => setArtName(e.target.value)}
                  placeholder="Ej. Prevención ART, Asociart, etc."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Comitente / Propietario de la Obra *
                </label>
                <input
                  type="text"
                  value={comitenteName}
                  onChange={e => setComitenteName(e.target.value)}
                  placeholder="Persona física o jurídica contratante"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Dirección y Ubicación de la Obra *
                </label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={e => setSiteAddress(e.target.value)}
                  placeholder="Calle, Número, Parcela o Ruta"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Localidad / Partido
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ej. Tigre, La Plata, Córdoba"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Superficie Cubierta Estimada (m²)
                </label>
                <input
                  type="number"
                  value={siteSurfaceM2}
                  onChange={e => setSiteSurfaceM2(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Personal Estimado en Pico de Obra
                </label>
                <input
                  type="number"
                  value={estimatedWorkers}
                  onChange={e => setEstimatedWorkers(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha de Inicio de Obra
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Plazo de Ejecución Estimado (meses)
                </label>
                <input
                  type="number"
                  value={estimatedDurationMonths}
                  onChange={e => setEstimatedDurationMonths(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Siguiente: Causales de Aviso <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Causales de Aviso de Obra */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              2. Causales de Aviso de Obra y Exigibilidad de Programa (Res. SRT 51/97)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona todas las condiciones presentes en la obra que obligan a presentar el Programa de Seguridad ante la ART:
            </p>

            <div className="space-y-3">
              {[
                { id: 'excavationDeep', label: 'Excavaciones con profundidad mayor a 1.20 metros', desc: 'Res. SRT 550/11 & Dec. 911/96 Art. 142' },
                { id: 'heightWork', label: 'Trabajos en altura con riesgo de caída mayor a 4.00 metros', desc: 'Res. SRT 61/23 & Dec. 911/96 Art. 54' },
                { id: 'demolition', label: 'Tareas de demolición total o parcial de estructuras', desc: 'Dec. 911/96 Arts. 138-141' },
                { id: 'largeSurface', label: 'Superficie de obra mayor a 1.000 m² o más de 1 planta', desc: 'Res. SRT 51/97 Art. 2 inc. a' },
                { id: 'highVoltage', label: 'Proximidad a líneas eléctricas de Media o Alta Tensión', desc: 'Res. SRT 3068/14' },
                { id: 'confinedSpacesOrTunnels', label: 'Trabajos en túneles, galerías o espacios subterráneos', desc: 'Dec. 911/96 Cap. 11' }
              ].map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    (reasons as any)[item.id]
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(reasons as any)[item.id]}
                    onChange={() => setReasons(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Siguiente: Etapas de Obra <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Etapas Constructivas */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-amber-500" size={20} />
              3. Matriz de Etapas Constructivas, Riesgos y Medidas Preventivas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Activa las fases que componen la obra para incluir su análisis de riesgos y medidas preventivas obligatorias:
            </p>

            <div className="space-y-4">
              {stages.map(st => (
                <div
                  key={st.id}
                  className={`p-4 rounded-xl border transition-all ${
                    st.included
                      ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.included}
                        onChange={() => toggleStage(st.id)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {st.name}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {st.applicableStandards}
                    </span>
                  </div>

                  {st.included && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pl-6">
                      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                        <strong className="text-rose-700 dark:text-rose-300 block mb-1">
                          Riesgos Principales:
                        </strong>
                        <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                          {st.risks.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        <strong className="text-emerald-700 dark:text-emerald-300 block mb-1">
                          Medidas Preventivas Obligatorias:
                        </strong>
                        <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                          {st.preventiveMeasures.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Siguiente: Servicio HyS <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Servicio HyS y Guardado */}
        {step === 4 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="text-amber-500" size={20} />
              4. Servicio de Higiene y Seguridad Laboral en Obra
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Profesional de HyS Responsable *
                </label>
                <input
                  type="text"
                  value={professionalName}
                  onChange={e => setProfessionalName(e.target.value)}
                  placeholder="Nombre y Apellido del Licenciado / Ingeniero"
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
                  value={enrollmentNumber}
                  onChange={e => setEnrollmentNumber(e.target.value)}
                  placeholder="Ej. Mat. COPIME 12345 / CIPBA 6789"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Horas Semanales de Visita a Obra (Art. 16 Dec. 911/96)
                </label>
                <input
                  type="number"
                  value={weeklyVisitHours}
                  onChange={e => setWeeklyVisitHours(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Centro Médico Asistencial ART para Urgencias
                </label>
                <input
                  type="text"
                  value={emergencyClinic}
                  onChange={e => setEmergencyClinic(e.target.value)}
                  placeholder="Clínica / Sanatorio de derivación rápida"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Teléfono de Emergencias ART
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observaciones Generales y Compromiso de Cumplimiento
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Detalles sobre subcontratistas, capacitaciones de inducción previa o instalaciones especiales..."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Anterior
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Eye size={16} /> Previa A4
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printElementAsDocument('construction-program-form-print', `Programa_Seguridad_${contractorName || 'Obra'}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Printer size={16} /> Imprimir PDF
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save size={16} /> Finalizar y Guardar Programa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Previsualización A4 Realista */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/80 bg-slate-800/90 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                    Vista Previa A4 • Programa de Seguridad de Obra
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                    {contractorName || 'Constructora'} • Decreto 911/96 & Res. SRT 51/97
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* Controles de Zoom */}
                <div className="flex items-center gap-1 bg-slate-700/60 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(0.35, z - 0.1))}
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    title="Reducir Zoom"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="text-[11px] font-bold px-1.5 min-w-[38px] text-center text-slate-200">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))}
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 1)}
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    title="Restablecer Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printElementAsDocument('construction-program-preview-modal', `Programa_Seguridad_${contractorName || 'Obra'}`)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Printer size={15} /> <span className="hidden sm:inline">Imprimir / </span>Guardar PDF
                  </button>
                  <button
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                    title="Cerrar vista previa"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-950/70 flex justify-center items-start">
              <div 
                style={{
                  zoom: previewZoom,
                  transformOrigin: 'top center'
                }}
                className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300"
              >
                <ConstructionSafetyProgramPdf
                  data={currentProgramData}
                  customId="construction-program-preview-modal"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">Normativa Oficial SRT • Dec. 911/96, Res. 51/97, Res. 35/98 & Res. 319/99</span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Offscreen para Impresión Directa */}
      <div className="ats-pdf-offscreen" id="construction-program-form-print" aria-hidden="true">
        <ConstructionSafetyProgramPdf
          data={currentProgramData}
          customId="construction-program-form-print"
        />
      </div>
    </div>
  );
}
