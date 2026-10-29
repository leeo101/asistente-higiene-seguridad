import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Check,
  Flame,
  Eye,
  Printer,
  Download,
  User,
  Award,
  X
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import ATEXPdfGenerator from '../components/ATEXPdfGenerator';
import {
  ATEXZoneAssessment,
  ATEXEquipmentItem,
  ATEXSafetyControls,
  ATEX_ZONES_GUIDE,
  ATEX_MANDATORY_CONTROLS
} from '../data/atexData';
import { generatePdfBlob, printElementAsDocument } from '../utils/pdfHelper';
import toast from 'react-hot-toast';

export default function ATEXAssessmentForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const printRef = useRef<HTMLDivElement>(null);

  const [assessmentNumber] = useState(`ATEX-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState(activeCompany?.name || '');
  const [areaName, setAreaName] = useState('');
  const [substanceType, setSubstanceType] = useState<'gas_vapor' | 'combustible_dust' | 'hybrid'>('gas_vapor');
  const [substanceName, setSubstanceName] = useState('');
  const [flashPointC, setFlashPointC] = useState<string>('');
  const [lelPercent, setLelPercent] = useState<string>('');
  const [ignitionTempC, setIgnitionTempC] = useState<string>('');

  const [assignedZone, setAssignedZone] = useState<'0' | '1' | '2' | '20' | '21' | '22'>('1');
  const [ventilationType, setVentilationType] = useState<'natural' | 'forced_mechanical' | 'none'>('forced_mechanical');
  const [ventilationDegree, setVentilationDegree] = useState<'high' | 'medium' | 'low'>('medium');

  const [safetyControls, setSafetyControls] = useState<ATEXSafetyControls>({
    groundingBonding: true,
    gasDetectionSystem: true,
    nonSparkingTools: true,
    antistaticFootwearRequired: true,
    hotWorkPermitMandatory: true,
    exConduitSealsVerified: true,
    explosionReliefVenting: true,
    areaSignageAtExPosted: true
  });

  // Equipos Ex
  const [equipmentList, setEquipmentList] = useState<ATEXEquipmentItem[]>([
    {
      id: 'eq_1',
      tag: 'MOT-01',
      description: 'Motor de bomba de trasvase de solventes inflamables',
      exMarking: 'II 2G Ex d IIC T4 Gb',
      protectionMode: 'Ex_d',
      gasGroup: 'IIC',
      tempClass: 'T4',
      ipRating: 'IP66',
      certificateNumber: 'INTI-ATEX-2024-014',
      complianceStatus: 'compliant'
    }
  ]);

  // Personal Responsable y Firmas Digitalizadas (estilo ATS)
  const [operatorName, setOperatorName] = useState('');
  const [operatorLicense, setOperatorLicense] = useState('');
  const [plantResponsible, setPlantResponsible] = useState('');
  const [plantResponsibleRole, setPlantResponsibleRole] = useState('Jefatura de Planta / Mantenimiento');
  const [auditorName, setAuditorName] = useState('');
  const [auditorEnrollment, setAuditorEnrollment] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('ESPECIALISTA EN HIGIENE Y SEGURIDAD LABORAL');

  const [operatorSig, setOperatorSig] = useState<string | null>(null);
  const [plantResponsibleSig, setPlantResponsibleSig] = useState<string | null>(null);
  const [auditorSig, setAuditorSig] = useState<string | null>(null);
  const [professionalStamp, setProfessionalStamp] = useState<string | null>(null);

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  const [notes, setNotes] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Precargar datos del profesional H&S desde Configuración (igual que en ATS y Arc Flash)
  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const pData = localStorage.getItem('personalData');
      if (pData) {
        const parsed = JSON.parse(pData);
        const name = parsed.fullName || parsed.name || '';
        const lic = parsed.license || parsed.matricula || '';
        const title = parsed.profession || parsed.title || parsed.specialty || '';
        if (name) setAuditorName(name);
        if (lic) setAuditorEnrollment(lic);
        if (title) setProfessionalTitle(title.toUpperCase());
      }
      const sData = localStorage.getItem('signatureStampData');
      if (sData) {
        const parsed = JSON.parse(sData);
        if (parsed.signature) setAuditorSig(parsed.signature);
        if (parsed.stamp) setProfessionalStamp(parsed.stamp);
      }
      const legacySig = localStorage.getItem('capturedSignature');
      if (legacySig) {
        setAuditorSig(prev => prev || legacySig);
      }
    } catch (e) {
      console.error('Error precargando firma profesional en ATEX:', e);
    }
  }, []);

  const toggleControl = (key: keyof ATEXSafetyControls) => {
    setSafetyControls(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setAllControls = (val: boolean) => {
    setSafetyControls({
      groundingBonding: val,
      gasDetectionSystem: val,
      nonSparkingTools: val,
      antistaticFootwearRequired: val,
      hotWorkPermitMandatory: val,
      exConduitSealsVerified: val,
      explosionReliefVenting: val,
      areaSignageAtExPosted: val
    });
  };

  const totalChecks = ATEX_MANDATORY_CONTROLS.length;
  const completedChecks = ATEX_MANDATORY_CONTROLS.filter(c => Boolean(safetyControls[c.key])).length;
  const allCompleted = completedChecks === totalChecks;

  const zoneInfo = ATEX_ZONES_GUIDE[assignedZone] || ATEX_ZONES_GUIDE['1'];

  const addEquipment = () => {
    const newItem: ATEXEquipmentItem = {
      id: `eq_${Date.now()}`,
      tag: `EQ-0${equipmentList.length + 1}`,
      description: '',
      exMarking: assignedZone.startsWith('2') && assignedZone.length === 2 ? 'II 2D Ex tb IIIC T135°C Db' : 'II 2G Ex d IIB T4 Gb',
      protectionMode: assignedZone.length === 2 ? 'Ex_t' : 'Ex_d',
      gasGroup: assignedZone.length === 2 ? 'IIIB' : 'IIB',
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

  const updateEquipment = (id: string, field: keyof ATEXEquipmentItem, value: any) => {
    setEquipmentList(prev =>
      prev.map(e => {
        if (e.id !== id) return e;
        const updated = { ...e, [field]: value };
        // Actualizar marcado Ex sugerido automáticamente si cambia modo, grupo o clase T
        if (field === 'protectionMode' || field === 'gasGroup' || field === 'tempClass') {
          const modeLabel = updated.protectionMode.replace('_', ' ');
          const isDust = updated.gasGroup.startsWith('III');
          const cat = isDust ? 'II 2D' : 'II 2G';
          const epl = isDust ? 'Db' : 'Gb';
          updated.exMarking = `${cat} ${modeLabel} ${updated.gasGroup} ${updated.tempClass} ${epl}`;
        }
        return updated;
      })
    );
  };

  // Objeto reactivo en tiempo real para Vista Previa e Impresión A4
  const currentAssessmentObject: ATEXZoneAssessment = useMemo(() => ({
    id: 'atex_preview',
    companyId: activeCompany?.id,
    assessmentNumber,
    date,
    facilityName: facilityName.trim() || activeCompany?.name || 'Planta Industrial',
    areaName: areaName.trim() || 'Sector de Almacenamiento / Proceso Inflamable',
    substanceType,
    substanceName: substanceName.trim() || 'Sustancia Inflamable / Combustible',
    flashPointC: flashPointC !== '' ? parseFloat(flashPointC) : undefined,
    lelPercent: lelPercent !== '' ? parseFloat(lelPercent) : undefined,
    ignitionTempC: ignitionTempC !== '' ? parseFloat(ignitionTempC) : undefined,
    assignedZone,
    ventilationType,
    ventilationDegree,
    safetyControls,
    equipmentList,
    auditorName: auditorName.trim() || 'Profesional H&S Actuante',
    auditorEnrollment: auditorEnrollment.trim(),
    operatorName: operatorName.trim() || undefined,
    operatorLicense: operatorLicense.trim() || undefined,
    plantResponsible: plantResponsible.trim() || undefined,
    plantResponsibleRole: plantResponsibleRole.trim() || undefined,
    operatorSignature: operatorSig,
    plantResponsibleSignature: plantResponsibleSig,
    auditorSignature: auditorSig,
    professionalStamp,
    professionalTitle,
    showSignatures,
    status: 'valid',
    notes: notes.trim() || undefined,
    createdAt: new Date().toISOString()
  }), [
    activeCompany,
    assessmentNumber,
    date,
    facilityName,
    areaName,
    substanceType,
    substanceName,
    flashPointC,
    lelPercent,
    ignitionTempC,
    assignedZone,
    ventilationType,
    ventilationDegree,
    safetyControls,
    equipmentList,
    auditorName,
    auditorEnrollment,
    operatorName,
    operatorLicense,
    plantResponsible,
    plantResponsibleRole,
    operatorSig,
    plantResponsibleSig,
    auditorSig,
    professionalStamp,
    professionalTitle,
    showSignatures,
    notes
  ]);

  const handlePrintPDF = async (downloadOnly: boolean = false) => {
    const sanitizedArea = (areaName || 'Sector_ATEX').replace(/\s+/g, '_');
    const fileName = `Estudio_ATEX_${assessmentNumber}_${sanitizedArea}.pdf`;
    const targetId = showPreviewModal && !downloadOnly ? 'pdf-content-atex-preview' : 'pdf-content-atex-form';

    if (downloadOnly) {
      const loadingToast = toast.loading('Generando estudio ATEX en PDF oficial...');
      try {
        const blob = await generatePdfBlob('pdf-content-atex-form', false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success('Estudio ATEX descargado en PDF correctamente', { id: loadingToast });
      } catch (err) {
        console.error(err);
        toast.error('Error al generar el PDF', { id: loadingToast });
      }
    } else {
      await printElementAsDocument(targetId, `Estudio ATEX ${assessmentNumber}`, false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!areaName.trim() || !substanceName.trim() || !auditorName.trim()) {
      toast.error('Completa los campos obligatorios (Sector, Sustancia y Profesional Auditor).');
      return;
    }

    const newAssessment: ATEXZoneAssessment = {
      ...currentAssessmentObject,
      id: `atex_${Date.now()}`,
      areaName: areaName.trim(),
      substanceName: substanceName.trim(),
      auditorName: auditorName.trim(),
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('atex_assessments_db');
    let list: ATEXZoneAssessment[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (err) {
        // ignore
      }
    }
    list.unshift(newAssessment);
    localStorage.setItem('atex_assessments_db', JSON.stringify(list));

    toast.success('Estudio de clasificación de área ATEX guardado exitosamente');
    navigate('/atex');
  };

  return (
    <AnimatedPage>
      <div
        className="container pb-[6rem] min-h-[100vh] flex flex-col"
        style={{ paddingTop: '7.5rem' }}
      >
        <PremiumHeader
          title="Nueva Evaluación de Área Clasificada (ATEX)"
          subtitle="Determinación de zonas de riesgo explosivo, control de fuentes de ignición y auditoría Ex bajo IEC 60079 y Dec. 351/79"
          badge="IEC 60079 & Dec. 351/79 Cap. 18"
          icon={<Zap size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/atex')}
        />

        <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior con botón Volver */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/atex')}
              style={{
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                minHeight: 'unset',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Volver al padrón de estudios ATEX
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* ========================================================
                BLOQUE 1: Identificación del Sector y Sustancia Inflamable
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Identificación del Sector y Sustancia Inflamable / Combustible
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Datos del establecimiento, sector operativo y propiedades físico-químicas de la sustancia (FDS / SGA)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    N° de Informe / Estudio
                  </label>
                  <input
                    type="text"
                    value={assessmentNumber}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha del Estudio *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Establecimiento / Planta
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de la empresa o planta"
                    value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Sector / Nave / Instalación Evaluada *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sala de Bombas de Solventes, Pañol de Inflamables, Silo de Harina N° 2..."
                    value={areaName}
                    onChange={e => setAreaName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tipo de Atmósfera Explosiva
                  </label>
                  <select
                    value={substanceType}
                    onChange={e => setSubstanceType(e.target.value as any)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="gas_vapor">Gases, Vapores o Nieblas Inflamables (IEC 60079-10-1)</option>
                    <option value="combustible_dust">Polvos Combustibles / Fibras (IEC 60079-10-2)</option>
                    <option value="hybrid">Mezcla Híbrida Gas + Polvo</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Nombre de la Sustancia / Agente *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tolueno, Gas Natural, Etanol, Polvo de Cereal..."
                    value={substanceName}
                    onChange={e => setSubstanceName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Punto de Inflamación (Flash Point °C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 4.0 °C"
                    value={flashPointC}
                    onChange={e => setFlashPointC(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      LEL / LIE (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej. 1.2 %"
                      value={lelPercent}
                      onChange={e => setLelPercent(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      Temp. Ignición (°C)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Ej. 480 °C"
                      value={ignitionTempC}
                      onChange={e => setIgnitionTempC(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Zonificación Reglamentaria ATEX y Ventilación
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Flame size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      2. Clasificación de Zona Peligrosa ATEX y Condiciones de Ventilación
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Seleccioná la zona clasificada según la frecuencia y duración de la atmósfera explosiva
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1.5px solid #fde68a',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 900
                  }}
                >
                  ZONA {assignedZone} · {zoneInfo.epl} ({zoneInfo.category})
                </span>
              </div>

              {/* Tarjetas Interactivas de Selección de Zona ATEX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(['0', '1', '2', '20', '21', '22'] as const).map(zKey => {
                  const z = ATEX_ZONES_GUIDE[zKey];
                  const isSelected = assignedZone === zKey;
                  const isCritical = zKey === '0' || zKey === '20';
                  const isModerate = zKey === '1' || zKey === '21';

                  const activeBorder = isCritical ? '#dc2626' : isModerate ? '#d97706' : '#059669';
                  const activeBg = isCritical ? '#fef2f2' : isModerate ? '#fffbeb' : '#ecfdf5';
                  const badgeBg = isCritical ? '#dc2626' : isModerate ? '#d97706' : '#059669';

                  return (
                    <div
                      key={zKey}
                      onClick={() => setAssignedZone(zKey)}
                      style={{
                        backgroundColor: isSelected ? activeBg : '#ffffff',
                        border: isSelected ? `2.5px solid ${activeBorder}` : '1.5px solid #e2e8f0',
                        boxShadow: isSelected ? '0 6px 16px rgba(217, 119, 6, 0.14)' : '0 1px 2px rgba(0,0,0,0.03)',
                        borderRadius: '14px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            backgroundColor: isSelected ? badgeBg : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#334155',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 900
                          }}
                        >
                          ZONA {zKey}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: isSelected ? activeBorder : '#64748b'
                          }}
                        >
                          {z.epl} · {z.hours}
                        </span>
                      </div>
                      <div>
                        <div style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: 800 }}>
                          {z.label}
                        </div>
                        <p style={{ color: '#475569', fontSize: '11px', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                          {z.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen Técnico de la Zona Seleccionada */}
              <div
                style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a' }}
                className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span style={{ color: '#92400e' }} className="text-[11px] font-black uppercase tracking-wider block">
                    Exigencia Reglamentaria para Zona {assignedZone} ({zoneInfo.category} / {zoneInfo.epl}):
                  </span>
                  <p style={{ color: '#78350f' }} className="text-xs font-bold m-0 mt-0.5">
                    {zoneInfo.protectionReq}
                  </p>
                </div>
              </div>

              {/* Parámetros de Ventilación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Régimen de Ventilación del Sector (IEC 60079-10-1)
                  </label>
                  <select
                    value={ventilationType}
                    onChange={e => setVentilationType(e.target.value as any)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="natural">Ventilación Natural (Aberturas permanentes / Aire libre)</option>
                    <option value="forced_mechanical">Ventilación Mecánica Forzada (Extracción localizada Ex)</option>
                    <option value="none">Sin Ventilación / Recinto Confinado o Cerrado</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Grado de Efectividad de Dilución
                  </label>
                  <select
                    value={ventilationDegree}
                    onChange={e => setVentilationDegree(e.target.value as any)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="high">Alto (VH — Reduce volumen explosivo a zona despreciable)</option>
                    <option value="medium">Medio (VM — Controla la concentración estable bajo el LEL)</option>
                    <option value="low">Bajo (VL — La atmósfera explosiva persiste tras cesar el escape)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 3: Medidas Obligatorias de Control de Fuentes de Ignición
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      3. Medidas Obligatorias de Control de Fuentes de Ignición (IEC 60079 / Dec. 351/79)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Hacé clic en cada medida para verificar su cumplimiento técnico en el área clasificada
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAllControls(!allCompleted)}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {allCompleted ? 'Desmarcar Todas' : 'Marcar Todas'}
                  </button>

                  <div
                    style={{
                      backgroundColor: allCompleted ? '#dcfce7' : '#fef3c7',
                      color: allCompleted ? '#166534' : '#92400e',
                      border: allCompleted ? '1.5px solid #86efac' : '1.5px solid #fde68a',
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {allCompleted ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>
                      {completedChecks} de {totalChecks} Verificadas ({Math.round((completedChecks / totalChecks) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(completedChecks / totalChecks) * 100}%`,
                    backgroundColor: allCompleted ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>

              {/* Lista Interactiva de Medidas Obligatorias */}
              <div className="space-y-3">
                {ATEX_MANDATORY_CONTROLS.map(item => {
                  const isChecked = Boolean(safetyControls[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleControl(item.key)}
                      style={{
                        backgroundColor: isChecked ? '#f0fdf4' : '#ffffff',
                        border: isChecked ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        boxShadow: isChecked
                          ? '0 4px 12px rgba(16, 185, 129, 0.12)'
                          : '0 1px 3px rgba(0,0,0,0.03)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Checkbox Pill Personalizado */}
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            backgroundColor: isChecked ? '#10b981' : '#ffffff',
                            border: isChecked ? 'none' : '2px solid #94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && <Check size={16} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              color: isChecked ? '#064e3b' : '#1e293b',
                              fontWeight: isChecked ? 800 : 600,
                              fontSize: '13.5px',
                              margin: 0,
                              lineHeight: 1.35
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              color: isChecked ? '#047857' : '#64748b',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              margin: '2px 0 0 0'
                            }}
                          >
                            {item.desc}
                          </p>
                          <span
                            style={{
                              color: isChecked ? '#059669' : '#94a3b8',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                            className="block mt-1"
                          >
                            Normativa aplicable: {item.law}
                          </span>
                        </div>
                      </div>

                      {/* Badge de Estado Derecha */}
                      <div className="flex-shrink-0">
                        <span
                          style={{
                            backgroundColor: isChecked ? '#d1fae5' : '#f1f5f9',
                            color: isChecked ? '#047857' : '#64748b',
                            border: isChecked ? '1px solid #86efac' : '1px solid #cbd5e1',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isChecked ? '✓ Cumple' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================
                BLOQUE 4: Inventario y Auditoría de Equipamiento Ex
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      4. Inventario y Auditoría de Equipamiento con Protección Ex (IEC 60079-14)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Relevamiento de motores, luminarias, sensores y tableros instalados dentro de la zona clasificada
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addEquipment}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <Plus size={15} /> Agregar Equipo Ex
                </button>
              </div>

              <div className="space-y-4">
                {equipmentList.map((eq, idx) => {
                  const isCompliant = eq.complianceStatus === 'compliant';
                  const isNonCompliant = eq.complianceStatus === 'non_compliant';

                  return (
                    <div
                      key={eq.id}
                      style={{
                        backgroundColor: isCompliant ? '#f8fafc' : isNonCompliant ? '#fef2f2' : '#fffbeb',
                        border: isCompliant
                          ? '1.5px solid #cbd5e1'
                          : isNonCompliant
                          ? '1.5px solid #fca5a5'
                          : '1.5px solid #fde68a'
                      }}
                      className="p-4 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              backgroundColor: '#0f172a',
                              color: '#fbbf24',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 900,
                              fontFamily: 'monospace'
                            }}
                          >
                            EQUIPO #{idx + 1} · {eq.tag}
                          </span>
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              fontFamily: 'monospace'
                            }}
                          >
                            Marcado: {eq.exMarking}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEquipment(eq.id)}
                          title="Eliminar equipo"
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Quitar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Tag / Identificación
                          </label>
                          <input
                            type="text"
                            value={eq.tag}
                            onChange={e => updateEquipment(eq.id, 'tag', e.target.value)}
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-mono font-bold px-3 py-2 border rounded-lg outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Descripción del Equipo / Instalación
                          </label>
                          <input
                            type="text"
                            value={eq.description}
                            onChange={e => updateEquipment(eq.id, 'description', e.target.value)}
                            placeholder="Ej. Motor agitador, Luminaria Ex, Sensor de nivel..."
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                          />
                        </div>

                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Modo de Protección Ex
                          </label>
                          <select
                            value={eq.protectionMode}
                            onChange={e => updateEquipment(eq.id, 'protectionMode', e.target.value)}
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                          >
                            <option value="Ex_d">Ex d (Envolvente Antideflagrante)</option>
                            <option value="Ex_e">Ex e (Seguridad Aumentada)</option>
                            <option value="Ex_ia">Ex ia (Seg. Intrínseca Zona 0)</option>
                            <option value="Ex_ib">Ex ib (Seg. Intrínseca Zona 1)</option>
                            <option value="Ex_p">Ex p (Presurización Interna)</option>
                            <option value="Ex_t">Ex t (Protección Polvos Comb.)</option>
                            <option value="standard_non_ex">Estándar No Ex (Inseguro)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Grupo de Gas / Polvo
                          </label>
                          <select
                            value={eq.gasGroup}
                            onChange={e => updateEquipment(eq.id, 'gasGroup', e.target.value)}
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                          >
                            <option value="IIA">IIA (Propano / Solventes)</option>
                            <option value="IIB">IIB (Etileno / Éteres)</option>
                            <option value="IIC">IIC (Hidrógeno / Acetileno)</option>
                            <option value="IIIA">IIIA (Fibras Combustibles)</option>
                            <option value="IIIB">IIIB (Polvos No Conductores)</option>
                            <option value="IIIC">IIIC (Polvos Conductores)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Clase de Temperatura
                          </label>
                          <select
                            value={eq.tempClass}
                            onChange={e => updateEquipment(eq.id, 'tempClass', e.target.value)}
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                          >
                            <option value="T1">T1 (Máx. 450 °C)</option>
                            <option value="T2">T2 (Máx. 300 °C)</option>
                            <option value="T3">T3 (Máx. 200 °C)</option>
                            <option value="T4">T4 (Máx. 135 °C)</option>
                            <option value="T5">T5 (Máx. 100 °C)</option>
                            <option value="T6">T6 (Máx. 85 °C)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            N° Certificado (INTI / IECEx)
                          </label>
                          <input
                            type="text"
                            value={eq.certificateNumber}
                            onChange={e => updateEquipment(eq.id, 'certificateNumber', e.target.value)}
                            placeholder="Ej. INTI-ATEX-2024-014"
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                            className="w-full text-xs font-mono px-3 py-2 border rounded-lg outline-none"
                          />
                        </div>

                        <div>
                          <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                            Dictamen de Auditoría
                          </label>
                          <select
                            value={eq.complianceStatus}
                            onChange={e => updateEquipment(eq.id, 'complianceStatus', e.target.value)}
                            style={{
                              backgroundColor: isCompliant ? '#dcfce7' : isNonCompliant ? '#fee2e2' : '#fef3c7',
                              color: isCompliant ? '#166534' : isNonCompliant ? '#991b1b' : '#92400e',
                              borderColor: isCompliant ? '#86efac' : isNonCompliant ? '#fca5a5' : '#fde68a'
                            }}
                            className="w-full text-xs font-extrabold px-3 py-2 border rounded-lg outline-none"
                          >
                            <option value="compliant">✓ APTO PARA ZONA</option>
                            <option value="non_compliant">✗ NO CONFORME (RIESGO)</option>
                            <option value="pending_verification">⚠ PENDIENTE INSPECCIÓN</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================
                BLOQUE 5: Responsables y Firmas Digitalizadas (Estilo ATS)
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      5. Profesional Responsable, Conformidad y Firmas Digitalizadas
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Validación técnica y firmas digitalizadas estilo ATS para el estudio de clasificación ATEX
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  Firma Profesional Precargada
                </span>
              </div>

              {/* Selector de visibilidad de cajas de firma */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>
                  INCLUIR FIRMAS EN EL ESTUDIO PDF:
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.operator}
                    onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))}
                    style={{ accentColor: '#2563eb', width: '15px', height: '15px' }}
                  />
                  Responsable Operativo del Sector
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.supervisor}
                    onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))}
                    style={{ accentColor: '#2563eb', width: '15px', height: '15px' }}
                  />
                  Jefe de Planta / Mantenimiento
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#047857' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.professional}
                    onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))}
                    style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                  />
                  Profesional H&S (Con sello y matrícula)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Responsable Operativo del Sector */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <User size={16} className="text-blue-600" />
                    1. Responsable del Sector
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                      Nombre y Apellido (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Gómez (O en blanco para firmar en planta)"
                      value={operatorName}
                      onChange={e => setOperatorName(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                      Legajo / DNI / Cargo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Encargado Sala de Bombas"
                      value={operatorLicense}
                      onChange={e => setOperatorLicense(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* 2. Jefe de Planta / Mantenimiento */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <CheckCircle2 size={16} className="text-purple-600" />
                    2. Jefe de Planta / Mant.
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                      Nombre Responsable Planta
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ing. Roberto Díaz"
                      value={plantResponsible}
                      onChange={e => setPlantResponsible(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">
                      Área / Gerencia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Jefatura de Mantenimiento"
                      value={plantResponsibleRole}
                      onChange={e => setPlantResponsibleRole(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* 3. Profesional H&S Auditor (Destacado en esmeralda como en ATS) */}
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    3. Profesional H&S Auditor
                  </div>
                  <div>
                    <label style={{ color: '#065f46' }} className="block text-[11px] font-bold mb-1">
                      Especialista H&S Actuante *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre y Apellido del Profesional"
                      value={auditorName}
                      onChange={e => setAuditorName(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#6ee7b7' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#065f46' }} className="block text-[11px] font-bold mb-1">
                      Matrícula Profesional (Ley 19.587)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Mat. N° MP.4457"
                      value={auditorEnrollment}
                      onChange={e => setAuditorEnrollment(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#6ee7b7' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Conclusiones y Recomendaciones Técnicas (Sellos Cortafuego, Prensaestopas Ex, Adecuaciones)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones sobre sellado de canalizaciones (EYS), verificación de continuidad de tierras (<10 ohm), plan de limpieza de polvos..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* PIZARRAS INTERACTIVAS DE FIRMA DIGITAL EN EL CONTENIDO (IGUAL QUE ATS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {showSignatures.operator && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <SignatureCanvas
                      label="Firma Responsable del Sector (Opcional — en blanco si firma en planta)"
                      initialImage={operatorSig || null}
                      onSave={sig => setOperatorSig(sig || null)}
                    />
                  </div>
                )}

                {showSignatures.supervisor && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <SignatureCanvas
                      label="Firma Jefe de Planta / Mantenimiento (Opcional)"
                      initialImage={plantResponsibleSig || null}
                      onSave={sig => setPlantResponsibleSig(sig || null)}
                    />
                  </div>
                )}

                {showSignatures.professional && (
                  <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-300">
                    <SignatureCanvas
                      label="Firma Digital del Profesional H&S"
                      initialImage={auditorSig || null}
                      onSave={sig => setAuditorSig(sig || null)}
                    />
                  </div>
                )}
              </div>

              {/* VISTA PREVIA EN VIVO DEL CUADRO DE FIRMAS OFICIAL (IDÉNTICO A ATS) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.25rem'
                  }}
                >
                  Vista Previa en Vivo del Cuadro de Firmas en el Estudio ATEX Impreso:
                </div>
                <PdfSignatures
                  data={{
                    ...currentAssessmentObject,
                    showSignatures,
                    professionalSignature: auditorSig,
                    professionalStamp: professionalStamp,
                    professionalName: auditorName,
                    professionalLicense: auditorEnrollment,
                    professionalTitle: professionalTitle
                  }}
                  box1={
                    showSignatures.operator
                      ? {
                          title: 'RESPONSABLE OPERATIVO DEL SECTOR',
                          subtitle: (operatorName || 'ENCARGADO DE SECTOR / PLANTA').toUpperCase(),
                          signatureUrl: operatorSig || null,
                          license: operatorLicense ? `Leg./Mat. ${operatorLicense}` : null,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    showSignatures.supervisor
                      ? {
                          title: 'JEFE DE PLANTA / MANTENIMIENTO',
                          subtitle: (
                            plantResponsible
                              ? `${plantResponsible}${plantResponsibleRole ? ` (${plantResponsibleRole})` : ''}`
                              : 'GERENCIA TÉCNICA / OPERACIONES'
                          ).toUpperCase(),
                          signatureUrl: plantResponsibleSig || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box3={
                    showSignatures.professional
                      ? {
                          title: professionalTitle || 'ESPECIALISTA EN ÁREAS CLASIFICADAS',
                          subtitle: (auditorName || 'FIRMA Y SELLO PROFESIONAL').toUpperCase(),
                          signatureUrl: auditorSig || null,
                          stampUrl: professionalStamp || null,
                          isProfessional: true,
                          license: auditorEnrollment || null,
                          profession: professionalTitle || null
                        }
                      : null
                  }
                  compact={true}
                  hideFooter={true}
                />
              </div>
            </div>

            {/* ========================================================
                Botones Finales: Vista Previa A4, Imprimir, Descargar PDF y Guardar Estudio
               ======================================================== */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/atex')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Botón Vista Previa A4 */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset'
                  }}
                >
                  <Eye size={16} />
                  <span>Vista Previa A4</span>
                </button>

                {/* Botón Imprimir Estudio */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(false)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir Estudio</span>
                </button>

                {/* Botón Descargar PDF */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(true)}
                  style={{
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
                  }}
                >
                  <Download size={16} />
                  <span>Descargar PDF</span>
                </button>

                {/* Botón Guardar Estudio ATEX */}
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <Save size={16} />
                  <span>Guardar Estudio ATEX</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* CONTENEDOR A4 OFFSCREEN PARA IMPRESIÓN Y DESCARGA PDF DIRECTA */}
        <div
          className="ats-pdf-offscreen"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '210mm',
            backgroundColor: '#ffffff',
            zIndex: -1
          }}
          ref={printRef}
        >
          <ATEXPdfGenerator
            assessment={currentAssessmentObject}
            companyName={activeCompany?.name}
            pdfElementId="pdf-content-atex-form"
          />
        </div>

        {/* MODAL DE VISTA PREVIA A4 OFICIAL */}
        {showPreviewModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={18} color="#fbbf24" />
                <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                  Vista Previa Oficial A4 — Estudio {assessmentNumber}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handlePrintPDF(false)}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintPDF(true)}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.65rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
                borderRadius: '0 0 12px 12px',
                overflow: 'hidden'
              }}
            >
              <ATEXPdfGenerator
                assessment={currentAssessmentObject}
                companyName={activeCompany?.name}
                pdfElementId="pdf-content-atex-preview"
              />
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
