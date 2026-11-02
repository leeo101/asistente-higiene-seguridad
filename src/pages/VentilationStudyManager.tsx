import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check,
  Sparkles, Info, ChevronRight, Ban, Edit3, Gauge,
  Fan, AlertOctagon, RefreshCw, Thermometer, Table, Wrench
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PdfSignatures from '../components/PdfSignatures';
import toast from 'react-hot-toast';
import {
  VentilationStudy,
  VentilationEquipment,
  AnemometerPoint,
  WorkplaceActivityType,
  RoomEnvironmentType,
  ENVIRONMENT_AIR_CHANGES,
  DEC351_VENTILATION_TABLE,
  VENTILATION_LEGAL_CHECKS,
  calcVentilationMetrics,
  DEFAULT_VENTILATION_STUDIES
} from '../data/ventilationData';
import { generateVentilationProtocolPdf } from '../utils/ventilationPdfGenerator';
import { getSavedProfessionalData } from '../utils/jsPdfSignatureHelper';
import SignatureCanvas from '../components/SignatureCanvas';

export default function VentilationStudyManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Estados principales
  const [studies, setStudies] = useState<VentilationStudy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showReferenceTable, setShowReferenceTable] = useState(false);

  // Modal de Calculador / Estudio
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulario reactivo - Datos del sector y geometría
  const [sectorName, setSectorName] = useState('');
  const [activityType, setActivityType] = useState<WorkplaceActivityType>('moderada');
  const [environmentType, setEnvironmentType] = useState<RoomEnvironmentType>('taller_mecanico');
  const [surfaceM2, setSurfaceM2] = useState<number>(100);
  const [heightM, setHeightM] = useState<number>(4);
  const [workersCount, setWorkersCount] = useState<number>(5);
  const [naturalOpeningsAreaM2, setNaturalOpeningsAreaM2] = useState<number>(2);
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [recommendations, setRecommendations] = useState('');

  // Instrumental de medición y contaminantes
  const [anemometerBrandModel, setAnemometerBrandModel] = useState('Testo 410-2 / Termo-Anemómetro Digital');
  const [anemometerSerial, setAnemometerSerial] = useState('SN-41088421');
  const [anemometerCalibrationDate, setAnemometerCalibrationDate] = useState('2026-03-15');
  const [anemometerCertNumber, setAnemometerCertNumber] = useState('CERT-INTI-2026-0891');
  const [contaminantType, setContaminantType] = useState('Calor convectivo, polvo en suspensión y humos de proceso');
  const [filterSystem, setFilterSystem] = useState('Rejillas metálicas atrapa-partículas y descarga a 4 vientos');

  // Checklist legal Cap. 11 Dec. 351/79
  const [verificacionesLegales, setVerificacionesLegales] = useState<string[]>([...VENTILATION_LEGAL_CHECKS]);

  // Firmas Digitales (Formato ATS con Profesional en el Centro)
  const [evaluatorTitle, setEvaluatorTitle] = useState(() => getSavedProfessionalData().profession || 'PROFESIONAL DE HIGIENE Y SEGURIDAD');
  const [evaluatorName, setEvaluatorName] = useState(() => getSavedProfessionalData().name || 'Ing. / Lic. Higiene y Seguridad');
  const [evaluatorLicense, setEvaluatorLicense] = useState(() => getSavedProfessionalData().license || 'Matrícula Profesional Vigente');
  const [evaluatorSignature, setEvaluatorSignature] = useState<string | null>(() => getSavedProfessionalData().signature || null);
  const [evaluatorStamp, setEvaluatorStamp] = useState<string | null>(() => getSavedProfessionalData().stamp || null);

  const [representativeName, setRepresentativeName] = useState('Representante Legal / Empleador');
  const [representativeSignature, setRepresentativeSignature] = useState<string | null>(null);

  const [supervisorName, setSupervisorName] = useState('Jefe de Planta / Mantenimiento');
  const [supervisorSignature, setSupervisorSignature] = useState<string | null>(null);

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    professional: true,
    supervisor: true
  });

  // Equipos en el modal
  const [equipments, setEquipments] = useState<VentilationEquipment[]>([
    { id: 'eq-1', type: 'extractor_axial', tag: 'EXT-01', flowRateM3H: 3500, quantity: 1, diameterMm: 500 }
  ]);

  // Puntos de medición anemométrica
  const [points, setPoints] = useState<AnemometerPoint[]>([
    { id: 'p-1', location: 'Puesto Operativo Principal', airVelocityMS: 0.35, co2Ppm: 580, temperatureC: 22.5 }
  ]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Clave de almacenamiento por empresa
  const storageKey = useMemo(() => {
    return activeCompany ? `ventilation_studies_db_${activeCompany.id}` : 'ventilation_studies_db_default';
  }, [activeCompany]);

  // Carga inicial
  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setStudies(JSON.parse(raw));
      } catch (e) {
        setStudies(DEFAULT_VENTILATION_STUDIES);
      }
    } else {
      setStudies(DEFAULT_VENTILATION_STUDIES);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_VENTILATION_STUDIES));
    }
  }, [storageKey]);

  // Guardado
  const saveStudies = (data: VentilationStudy[]) => {
    setStudies(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Cálculo en vivo dentro del formulario
  const liveMetrics = useMemo(() => {
    return calcVentilationMetrics(
      surfaceM2,
      heightM,
      workersCount,
      activityType,
      environmentType,
      equipments,
      naturalOpeningsAreaM2
    );
  }, [surfaceM2, heightM, workersCount, activityType, environmentType, equipments, naturalOpeningsAreaM2]);

  // Métricas acumuladas para los KPIs
  const kpis = useMemo(() => {
    const total = studies.length;
    const compliant = studies.filter(s => s.isCompliant).length;
    const deficient = studies.filter(s => !s.isCompliant).length;
    const totalFlow = studies.reduce((acc, s) => acc + s.totalActualFlowRateM3H, 0);
    const avgRenH = total > 0
      ? Math.round((studies.reduce((acc, s) => acc + s.actualAirChangesPerHour, 0) / total) * 10) / 10
      : 0;

    return { total, compliant, deficient, totalFlow, avgRenH };
  }, [studies]);

  // Plantillas rápidas preconfiguradas
  const applyQuickTemplate = (preset: 'soldadura' | 'pintura' | 'deposito') => {
    if (preset === 'soldadura') {
      setSectorName('Taller de Mecanizado y Soldadura');
      setActivityType('moderada');
      setEnvironmentType('soldadura_humos');
      setSurfaceM2(240);
      setHeightM(4.8);
      setWorkersCount(12);
      setNaturalOpeningsAreaM2(8);
      setContaminantType('Humos metálicos de soldadura MIG/MAG (Óxidos de Fe, Mn) y calor');
      setFilterSystem('Campana localizada + Pre-filtro metálico antichispas y cartucho HEPA');
      setEquipments([
        { id: `eq-${Date.now()}-1`, type: 'extractor_axial', tag: 'EXT-AX-01', flowRateM3H: 6500, quantity: 2, diameterMm: 600 },
        { id: `eq-${Date.now()}-2`, type: 'campana_extraccion', tag: 'CAMP-SOLD-01', flowRateM3H: 3500, quantity: 1, diameterMm: 350 }
      ]);
      setPoints([
        { id: `p-${Date.now()}-1`, location: 'Bancada de Soldadura MIG N° 1', airVelocityMS: 0.55, co2Ppm: 620, temperatureC: 24.5 },
        { id: `p-${Date.now()}-2`, location: 'Sector Tornos CNC y Fresadoras', airVelocityMS: 0.35, co2Ppm: 540, temperatureC: 22.8 }
      ]);
      setRecommendations('El sistema de ventilación forzada y captación localizada supera el caudal reglamentario del Dec. 351/79 Cap. 11. Mantener velocidad de captura ≥ 0,50 m/s en frente de campana de soldadura.');
      toast.success('Plantilla cargada: Taller de Soldadura');
    } else if (preset === 'pintura') {
      setSectorName('Cabina de Pintura y Preparación de Superficies');
      setActivityType('moderada');
      setEnvironmentType('cabina_pintura');
      setSurfaceM2(48);
      setHeightM(3.2);
      setWorkersCount(2);
      setNaturalOpeningsAreaM2(1.5);
      setContaminantType('Vapores orgánicos (COV / Solventes) y nieblas de pulverización');
      setFilterSystem('Filtro Paint-Stop de fibra de vidrio + Banco de Carbón Activado');
      setEquipments([
        { id: `eq-${Date.now()}-1`, type: 'extractor_centrifugo', tag: 'CENT-AP-01', flowRateM3H: 4200, quantity: 1, diameterMm: 450 }
      ]);
      setPoints([
        { id: `p-${Date.now()}-1`, location: 'Frente de Pistola Soplete (Zona Operario)', airVelocityMS: 0.52, co2Ppm: 510, temperatureC: 21.5 },
        { id: `p-${Date.now()}-2`, location: 'Pleno de Inyección Superior', airVelocityMS: 0.48, co2Ppm: 450, temperatureC: 20.8 }
      ]);
      setRecommendations('La cabina cumple con las renovaciones horarias mínimas para dilución de vapores inflamables (Art. 67 Dec. 351/79). Verificar diferencial de presión del banco de filtros Paint-Stop mensualmente.');
      toast.success('Plantilla cargada: Cabina de Pintura');
    } else {
      setSectorName('Nave de Depósito, Picking y Expedición');
      setActivityType('moderada');
      setEnvironmentType('deposito_logistica');
      setSurfaceM2(450);
      setHeightM(6.0);
      setWorkersCount(8);
      setNaturalOpeningsAreaM2(16);
      setContaminantType('Polvo ambiental de cartón/embalaje y carga térmica solar');
      setFilterSystem('Ventilación cruzada natural + Extractores eólicos y axiales de cumbrera');
      setEquipments([
        { id: `eq-${Date.now()}-1`, type: 'extractor_axial', tag: 'EXT-NAVE-01', flowRateM3H: 5500, quantity: 2, diameterMm: 650 },
        { id: `eq-${Date.now()}-2`, type: 'extractor_eolico', tag: 'EOL-TECHO', flowRateM3H: 1800, quantity: 4, diameterMm: 600 }
      ]);
      setPoints([
        { id: `p-${Date.now()}-1`, location: 'Pasillo Central de Racks', airVelocityMS: 0.32, co2Ppm: 520, temperatureC: 23.0 },
        { id: `p-${Date.now()}-2`, location: 'Mesa de Consolidación y Packing', airVelocityMS: 0.40, co2Ppm: 560, temperatureC: 22.5 }
      ]);
      setRecommendations('Renovación horaria adecuada según Anexo III Dec. 351/79. Garantizar que los portones de carga y rejillas inferiores permanezcan libres de obstrucciones por pallets.');
      toast.success('Plantilla cargada: Depósito y Logística');
    }
  };

  // Manejo de apertura de modal
  const handleOpenNew = () => {
    setEditingId(null);
    setSectorName('Depósito y Logística');
    const pro = getSavedProfessionalData();
    setEvaluatorTitle(pro.profession || 'PROFESIONAL DE HIGIENE Y SEGURIDAD');
    setEvaluatorName(pro.name || 'Ing. / Lic. Higiene y Seguridad');
    setEvaluatorLicense(pro.license || 'Matrícula Profesional Vigente');
    setEvaluatorSignature(pro.signature || null);
    setEvaluatorStamp(pro.stamp || null);
    setRepresentativeName('Representante Legal / Empleador');
    setRepresentativeSignature(null);
    setSupervisorName('Jefe de Planta / Mantenimiento');
    setSupervisorSignature(null);
    setShowSignatures({ operator: true, professional: true, supervisor: true });

    setActivityType('moderada');
    setEnvironmentType('deposito_logistica');
    setSurfaceM2(150);
    setHeightM(4.5);
    setWorkersCount(6);
    setNaturalOpeningsAreaM2(4);
    setStudyDate(new Date().toISOString().split('T')[0]);
    setAnemometerBrandModel('Testo 410-2 / Termo-Anemómetro Digital');
    setAnemometerSerial('SN-41088421');
    setAnemometerCalibrationDate('2026-03-15');
    setAnemometerCertNumber('CERT-INTI-2026-0891');
    setContaminantType('Calor convectivo, polvo en suspensión y humos de proceso');
    setFilterSystem('Rejillas metálicas atrapa-partículas y descarga a 4 vientos');
    setVerificacionesLegales([...VENTILATION_LEGAL_CHECKS]);
    setRecommendations('');
    setEquipments([
      { id: `eq-${Date.now()}`, type: 'extractor_axial', tag: 'EXT-01', flowRateM3H: 4000, quantity: 2, diameterMm: 600 }
    ]);
    setPoints([
      { id: `p-${Date.now()}`, location: 'Pasillo Central Operativo', airVelocityMS: 0.32, co2Ppm: 550, temperatureC: 22.4 }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (study: VentilationStudy) => {
    setEditingId(study.id);
    setSectorName(study.sectorName);
    setActivityType(study.activityType);
    setEnvironmentType(study.environmentType);
    setSurfaceM2(study.surfaceM2);
    setHeightM(study.heightM);
    setWorkersCount(study.workersCount);
    setNaturalOpeningsAreaM2(study.naturalOpeningsAreaM2);
    setEvaluatorTitle(study.evaluatorTitle || 'PROFESIONAL DE HIGIENE Y SEGURIDAD');
    setEvaluatorName(study.evaluatorName);
    setEvaluatorLicense(study.evaluatorLicense);
    setEvaluatorSignature(study.evaluatorSignature || null);
    setEvaluatorStamp(study.evaluatorStamp || null);
    setRepresentativeName(study.representativeName || 'Representante Legal / Empleador');
    setRepresentativeSignature(study.representativeSignature || null);
    setSupervisorName(study.supervisorName || 'Jefe de Planta / Mantenimiento');
    setSupervisorSignature(study.supervisorSignature || null);
    setShowSignatures(study.showSignatures || { operator: true, professional: true, supervisor: true });

    setAnemometerBrandModel(study.anemometerBrandModel || 'Testo 410-2 / Termo-Anemómetro Digital');
    setAnemometerSerial(study.anemometerSerial || 'SN-41088421');
    setAnemometerCalibrationDate(study.anemometerCalibrationDate || '2026-03-15');
    setAnemometerCertNumber(study.anemometerCertNumber || 'CERT-INTI-2026-0891');
    setContaminantType(study.contaminantType || 'Calor convectivo, polvo en suspensión y humos de proceso');
    setFilterSystem(study.filterSystem || 'Rejillas metálicas atrapa-partículas y descarga a 4 vientos');
    setVerificacionesLegales(
      Array.isArray(study.verificacionesLegales)
        ? study.verificacionesLegales
        : [...VENTILATION_LEGAL_CHECKS]
    );

    setStudyDate(study.date);
    setRecommendations(study.recommendations);
    setEquipments(study.equipments || []);
    setPoints(study.measurementPoints || []);
    setShowModal(true);
  };

  // Manejo de equipos dinámicos en el modal
  const handleAddEquipment = () => {
    setEquipments([
      ...equipments,
      {
        id: `eq-${Date.now()}`,
        type: 'extractor_axial',
        tag: `EXT-0${equipments.length + 1}`,
        flowRateM3H: 3000,
        quantity: 1,
        diameterMm: 500
      }
    ]);
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipments(equipments.filter(e => e.id !== id));
  };

  const handleUpdateEquipment = (id: string, field: keyof VentilationEquipment, val: any) => {
    setEquipments(equipments.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  // Manejo de puntos de medición
  const handleAddPoint = () => {
    setPoints([
      ...points,
      {
        id: `p-${Date.now()}`,
        location: `Puesto Operativo ${points.length + 1}`,
        airVelocityMS: 0.30,
        co2Ppm: 580,
        temperatureC: 22.5
      }
    ]);
  };

  const handleRemovePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const handleUpdatePoint = (id: string, field: keyof AnemometerPoint, val: any) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  // Redactar dictamen automático
  const handleAutoDraftRecommendations = () => {
    if (liveMetrics.isCompliant) {
      setRecommendations(
        `El sector "${sectorName || 'Evaluado'}" registra un caudal total instalado de ${liveMetrics.totalActualFlowRateM3H.toLocaleString()} m³/h (${liveMetrics.actualAirChangesPerHour} Ren/h), superando el requerimiento mínimo legal de ${liveMetrics.totalRequiredFlowRateM3H.toLocaleString()} m³/h exigido por el Decreto 351/79 Cap. 11 y Anexo III (Cobertura del ${liveMetrics.coveragePercent}%). Se recomienda mantener el plan de limpieza semestral de álabes, rejillas y filtros, y verificar la libre circulación de aire exterior de reposición.`
      );
    } else {
      setRecommendations(
        `ATENCIÓN: El sector "${sectorName || 'Evaluado'}" presenta un DÉFICIT DE CAUDAL de ${liveMetrics.flowDeficitM3H.toLocaleString()} m³/h respecto al mínimo exigido por el Decreto 351/79 Cap. 11 (${liveMetrics.totalRequiredFlowRateM3H.toLocaleString()} m³/h requeridos vs. ${liveMetrics.totalActualFlowRateM3H.toLocaleString()} m³/h instalados). Se deberá incorporar extracción mecánica adicional o campana de captación localizada en fuente antes de los próximos 30 días y efectuar nueva medición anemométrica.`
      );
    }
    toast.success('Dictamen técnico redactado automáticamente');
  };

  // Guardar estudio
  const handleSaveStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) {
      toast.error('Indique el nombre del sector evaluado');
      return;
    }

    const calculated = calcVentilationMetrics(
      surfaceM2,
      heightM,
      workersCount,
      activityType,
      environmentType,
      equipments,
      naturalOpeningsAreaM2
    );

    const studyData: VentilationStudy = {
      id: editingId || `vent-${Date.now()}`,
      companyId: activeCompany?.id,
      sectorName,
      activityType,
      environmentType,
      date: studyDate,
      evaluatorTitle,
      evaluatorName,
      evaluatorLicense,
      evaluatorSignature: evaluatorSignature || undefined,
      evaluatorStamp: evaluatorStamp || undefined,
      representativeName,
      representativeSignature: representativeSignature || undefined,
      supervisorName,
      supervisorSignature: supervisorSignature || undefined,
      showSignatures,
      anemometerBrandModel,
      anemometerSerial,
      anemometerCalibrationDate,
      anemometerCertNumber,
      contaminantType,
      filterSystem,
      verificacionesLegales,
      surfaceM2,
      heightM,
      volumeM3: calculated.volumeM3,
      workersCount,
      equipments,
      naturalOpeningsAreaM2,
      measurementPoints: points,
      cubicMetersPerPerson: calculated.cubicMetersPerPerson,
      requiredFlowRateByPersonsM3H: calculated.requiredFlowRateByPersonsM3H,
      recommendedAirChangesPerHour: calculated.recommendedAirChangesPerHour,
      requiredFlowRateByVolumeM3H: calculated.requiredFlowRateByVolumeM3H,
      totalRequiredFlowRateM3H: calculated.totalRequiredFlowRateM3H,
      totalActualFlowRateM3H: calculated.totalActualFlowRateM3H,
      actualAirChangesPerHour: calculated.actualAirChangesPerHour,
      flowDeficitM3H: calculated.flowDeficitM3H,
      coveragePercent: calculated.coveragePercent,
      isCompliant: calculated.isCompliant,
      recommendations,
      status: calculated.isCompliant ? 'conforme' : 'no_conforme',
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      const updated = studies.map(s => s.id === editingId ? studyData : s);
      saveStudies(updated);
      toast.success('Estudio de ventilación actualizado');
    } else {
      saveStudies([studyData, ...studies]);
      toast.success('Estudio de ventilación registrado conforme a Dec. 351/79');
    }

    setShowModal(false);
  };

  // Eliminar estudio
  const confirmDelete = () => {
    if (!deleteTargetId) return;
    saveStudies(studies.filter(s => s.id !== deleteTargetId));
    toast.success('Estudio eliminado');
    setDeleteTargetId(null);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'SECTOR',
      'ACTIVIDAD',
      'AMBIENTE',
      'INSTRUMENTO',
      'VOLUMEN_M3',
      'PERSONAS',
      'CAUDAL_REQUERIDO_M3H',
      'CAUDAL_REAL_M3H',
      'RENOVACIONES_REALES_RENH',
      'COBERTURA_PORCENTAJE',
      'ESTADO',
      'FECHA'
    ];

    const rows = studies.map(s => [
      `"${s.id}"`,
      `"${s.sectorName}"`,
      `"${s.activityType}"`,
      `"${s.environmentType}"`,
      `"${s.anemometerBrandModel || 'Termo-Anemómetro'}"`,
      `"${s.volumeM3}"`,
      `"${s.workersCount}"`,
      `"${s.totalRequiredFlowRateM3H}"`,
      `"${s.totalActualFlowRateM3H}"`,
      `"${s.actualAirChangesPerHour}"`,
      `"${s.coveragePercent}%"`,
      `"${s.status}"`,
      `"${s.date}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estudios_Ventilacion_Dec351_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Datos exportados en CSV');
  };

  const filteredStudies = useMemo(() => {
    return studies.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          s.sectorName.toLowerCase().includes(q) ||
          s.evaluatorName.toLowerCase().includes(q) ||
          (s.contaminantType || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studies, filterStatus, searchTerm]);

  return (
    <AnimatedPage>
      <div
        style={{ paddingTop: '7rem' }}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Premium SIN botones adentro del recuadro y separado de la barra superior */}
          <PremiumHeader
            title="Ventilación & Calidad de Aire"
            subtitle="Cálculo de Caudales Mínimos, Renovaciones Horarias y Anemometría — Decreto 351/79 Cap. 11 y Anexo III"
            badge="Dec. 351/79 Cap. 11 y Anexo III"
            icon={<Wind size={36} color="#ffffff" />}
            gradient="linear-gradient(135deg, #0f172a 0%, #0f766e 55%, #0284c7 100%)"
            onBack={() => navigate('/')}
          />

          {/* Barra de Acciones Principal Ubicada Debajo del Recuadro con Botones Coloridos */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
              border: '1px solid #99f6e4',
              borderRadius: '18px',
              padding: '0.9rem 1.25rem',
              boxShadow: '0 8px 20px -6px rgba(13, 148, 136, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)'
                }}
              >
                <Fan size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                  Panel de Gestión de Ventilación Industrial y Confort Ambiental
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                  Control de caudales por operario, renovaciones horarias (Ren/h), velocidad de captura y CO₂
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowReferenceTable(!showReferenceTable)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.05rem',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: showReferenceTable
                    ? 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Table size={16} />
                {showReferenceTable ? 'Ocultar Tabla Dec. 351/79' : 'Tabla Oficial Dec. 351/79'}
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.05rem',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileSpreadsheet size={16} />
                Exportar CSV
              </button>

              <button
                type="button"
                onClick={handleOpenNew}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.38)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus size={17} />
                Nuevo Estudio de Ventilación
              </button>
            </div>
          </div>

          {/* Panel Desplegable: Tabla Oficial Decreto 351/79 Cap. 11 y Anexo III */}
          {showReferenceTable && (
            <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-black">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Tablas Oficiales de Ventilación — Ley 19.587 / Decreto 351/79 (Cap. 11 Arts. 64-70)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Caudal mínimo de aire exterior por persona según cubaje del local y renovaciones horarias por actividad
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReferenceTable(false)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-indigo-600 text-white font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Cubaje por Persona (m³/pers.)</th>
                        <th className="p-2.5 text-center">Actividad Sedentaria</th>
                        <th className="p-2.5 text-center">Actividad Moderada</th>
                        <th className="p-2.5 text-center">Actividad Pesada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {DEC351_VENTILATION_TABLE.sedentaria.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-black text-slate-800 dark:text-slate-200">
                            {row.maxCubicM3 === Infinity ? 'Más de 12 m³ por persona' : `Hasta ${row.maxCubicM3} m³ por persona`}
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-700">{row.flowPerPerson} m³/h</td>
                          <td className="p-2 text-center font-bold text-sky-700">{DEC351_VENTILATION_TABLE.moderada[idx]?.flowPerPerson} m³/h</td>
                          <td className="p-2 text-center font-bold text-amber-700">{DEC351_VENTILATION_TABLE.pesada[idx]?.flowPerPerson} m³/h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-teal-700 text-white font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Tipo de Local / Ambiente de Trabajo</th>
                        <th className="p-2.5 text-center">Mínimo Exigido</th>
                        <th className="p-2.5 text-center">Óptimo Recomendado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {Object.entries(ENVIRONMENT_AIR_CHANGES).map(([key, item]) => (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{item.label}</td>
                          <td className="p-2 text-center font-black text-teal-700">{item.minRenH} Ren/h</td>
                          <td className="p-2 text-center font-bold text-indigo-600">{item.maxRenH} Ren/h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tarjetas de KPIs con Bordes de Color e Iconografía Destacada */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border-2 border-teal-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Sectores Auditados</span>
                <div
                  style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#ffffff' }}
                  className="p-2 rounded-xl shadow-sm"
                >
                  <Wind className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.total}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600 font-extrabold">{kpis.compliant} Conformes</span>
                <span className="text-slate-400">•</span>
                <span className={kpis.deficient > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}>
                  {kpis.deficient} con Déficit
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-sky-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Caudal Total Instalado</span>
                <div
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', color: '#ffffff' }}
                  className="p-2 rounded-xl shadow-sm"
                >
                  <Fan className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.totalFlow.toLocaleString()} <span className="text-xs font-bold text-sky-600">m³/h</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Capacidad total de inyección y extracción
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-amber-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Renovaciones Promedio</span>
                <div
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: '#ffffff' }}
                  className="p-2 rounded-xl shadow-sm"
                >
                  <Gauge className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.avgRenH} <span className="text-xs font-bold text-amber-600">Ren/h</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Tasa horaria de recambio de aire ambiental
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Conformidad Legal</span>
                <div
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}
                  className="p-2 rounded-xl shadow-sm"
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.total > 0 ? Math.round((kpis.compliant / kpis.total) * 100) : 100}%
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Sectores que cumplen o superan la tabla oficial
              </div>
            </div>
          </div>

          {/* Banner de Referencia Técnica Dec. 351/79 */}
          <div className="bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent border-l-4 border-teal-600 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-black text-slate-900 dark:text-white">
                Criterios Oficiales de Ventilación — Decreto 351/79 Capítulo 11 (Arts. 64 al 70) y Anexo III
              </p>
              <p>
                El caudal mínimo de aire exterior por trabajador se determina por tabla según cubicaje (m³/persona) y tipo de actividad (Sedentaria: 12-43 m³/h, Moderada: 18-65 m³/h, Pesada: 24-86 m³/h). Cuando existan fuentes de calor, humos de soldadura o vapores químicos, prima la tasa de renovaciones horarias requeridas para la dilución adecuada y la captación localizada en fuente.
              </p>
            </div>
          </div>

          {/* Barra de Buscador Corregida (compacta en una sola fila, sin superposición de lupa) y Píldoras de Filtro Coloridas */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
              padding: '0.85rem 1.15rem',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flex: '1 1 320px',
                maxWidth: '520px',
                height: '42px',
                padding: '0 0.95rem',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
            >
              <Search
                size={17}
                style={{
                  color: '#0d9488',
                  flexShrink: 0
                }}
              />
              <input
                type="text"
                placeholder="Buscar por sector, contaminante o profesional actuante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  padding: 0,
                  margin: 0
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    border: 'none',
                    background: '#e2e8f0',
                    color: '#475569',
                    borderRadius: '999px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: filterStatus === 'all' ? 'none' : '1px solid #cbd5e1',
                  background: filterStatus === 'all' ? 'linear-gradient(135deg, #0f766e 0%, #0284c7 100%)' : '#f8fafc',
                  color: filterStatus === 'all' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  boxShadow: filterStatus === 'all' ? '0 4px 10px rgba(15, 118, 110, 0.25)' : 'none'
                }}
              >
                Todos ({studies.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('conforme')}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: filterStatus === 'conforme' ? 'none' : '1px solid #a7f3d0',
                  background: filterStatus === 'conforme' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ecfdf5',
                  color: filterStatus === 'conforme' ? '#ffffff' : '#047857',
                  cursor: 'pointer',
                  boxShadow: filterStatus === 'conforme' ? '0 4px 10px rgba(16, 185, 129, 0.28)' : 'none'
                }}
              >
                ✓ Aprobados ({kpis.compliant})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('no_conforme')}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: filterStatus === 'no_conforme' ? 'none' : '1px solid #fecdd3',
                  background: filterStatus === 'no_conforme' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : '#fff1f2',
                  color: filterStatus === 'no_conforme' ? '#ffffff' : '#be123c',
                  cursor: 'pointer',
                  boxShadow: filterStatus === 'no_conforme' ? '0 4px 10px rgba(225, 29, 72, 0.28)' : 'none'
                }}
              >
                ⚠️ Con Déficit ({kpis.deficient})
              </button>
            </div>
          </div>

          {/* Lista de Estudios */}
          {filteredStudies.length === 0 ? (
            <EmptyStateIllustrated
              title="No hay estudios de ventilación registrados"
              description="Realice el primer estudio para calcular los caudales de renovación reglamentarios y puntos anemométricos de sus sectores."
              actionLabel="Nuevo Estudio de Ventilación"
              onAction={handleOpenNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredStudies.map((study) => {
                const isOk = study.isCompliant;
                const pts = study.measurementPoints || [];
                const avgVel = pts.length > 0
                  ? (pts.reduce((acc, p) => acc + p.airVelocityMS, 0) / pts.length).toFixed(2)
                  : null;
                const maxCo2 = pts.length > 0
                  ? Math.max(...pts.map(p => p.co2Ppm || 0))
                  : null;
                const envLabel = ENVIRONMENT_AIR_CHANGES[study.environmentType]?.label || study.environmentType;

                return (
                  <div
                    key={study.id}
                    className={`bg-white dark:bg-slate-900 border-2 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                      isOk
                        ? 'border-slate-200/90 dark:border-slate-800'
                        : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                    }`}
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-base text-slate-900 dark:text-white">
                              {study.sectorName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              {envLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            📅 {study.date} • 📐 {study.surfaceM2} m² × {study.heightM} m = <strong>{study.volumeM3} m³</strong> • 👥 {study.workersCount} operarios
                          </span>
                        </div>

                        <span
                          style={{
                            padding: '0.28rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            background: isOk
                              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                              : 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
                            color: isOk ? '#065f46' : '#9f1239',
                            border: isOk ? '1px solid #34d399' : '1px solid #fb7185'
                          }}
                        >
                          {isOk ? '✓ APROBADO' : '⚠️ DÉFICIT'}
                        </span>
                      </div>

                      {/* Etiquetas de Instrumento y Contaminante */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                          <Gauge size={11} /> {study.anemometerBrandModel || 'Termo-Anemómetro Digital Calibrado'}
                        </span>
                        {study.contaminantType && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-xs">
                            🧪 {study.contaminantType}
                          </span>
                        )}
                      </div>

                      {/* Indicadores técnicos principales */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 my-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Caudal Exigido</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 text-sm">
                            {study.totalRequiredFlowRateM3H.toLocaleString()} <span className="text-[10px] font-normal">m³/h</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Caudal Real</span>
                          <span className={`font-black text-sm ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {study.totalActualFlowRateM3H.toLocaleString()} <span className="text-[10px] font-normal">m³/h</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Renovaciones</span>
                          <span className="font-black text-sky-700 dark:text-sky-400 text-sm">
                            {study.actualAirChangesPerHour} <span className="text-[10px] font-normal">Ren/h</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Cobertura</span>
                          <span className={`font-black text-sm ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {study.coveragePercent}%
                          </span>
                        </div>
                      </div>

                      {/* Resumen de Anemometría y Equipos */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-teal-50/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-slate-800 my-2">
                        <span>
                          <strong>{(study.equipments || []).length}</strong> equipos mecánicos
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{pts.length}</strong> ptos. anemométricos {avgVel ? `(${avgVel} m/s prom.)` : ''}
                        </span>
                        {maxCo2 ? (
                          <>
                            <span>•</span>
                            <span className={maxCo2 > 1000 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                              CO₂: {maxCo2} ppm
                            </span>
                          </>
                        ) : null}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 my-1.5">
                        {study.recommendations || 'Sin observaciones técnicas adicionales.'}
                      </p>
                    </div>

                    {/* Acciones con Botones Coloridos */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => generateVentilationProtocolPdf(study, activeCompany?.name, activeCompany?.cuit, false)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.48rem 0.85rem',
                            borderRadius: '10px',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 3px 8px rgba(16, 185, 129, 0.28)'
                          }}
                        >
                          <Printer size={14} />
                          Imprimir PDF
                        </button>

                        <button
                          type="button"
                          onClick={() => generateVentilationProtocolPdf(study, activeCompany?.name, activeCompany?.cuit, true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.48rem 0.8rem',
                            borderRadius: '10px',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)'
                          }}
                        >
                          <Download size={14} />
                          Descargar
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(study)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#92400e',
                            background: '#fef3c7',
                            border: '1px solid #f59e0b',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={13} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(study.id)}
                          title="Eliminar estudio"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#be123c',
                            background: '#ffe4e6',
                            border: '1px solid #fda4af',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: CALCULADOR Y ESTUDIO DE VENTILACIÓN */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 my-8 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Wind className="w-5 h-5 text-teal-600" />
                    {editingId ? 'Editar Estudio Técnico de Ventilación' : 'Nuevo Cálculo y Protocolo de Ventilación (Dec. 351/79)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memoria de cálculo oficial de caudales, renovaciones horarias, puntos anemométricos y firmas digitales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Plantillas Rápidas */}
              <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-3 rounded-2xl border border-teal-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span className="font-black text-teal-900 dark:text-teal-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Cargar Plantilla Técnica Preconfigurada:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('soldadura')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🔥 Taller de Soldadura
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('pintura')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🎨 Cabina de Pintura
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('deposito')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🏭 Depósito / Nave Industrial
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveStudy} className="space-y-5">
                {/* 1. Datos del Sector y Contaminantes */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    1. Identificación del Sector y Agentes Ambientales
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sector Evaluado (*)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Taller de Pintura y Soldadura"
                        value={sectorName}
                        onChange={(e) => setSectorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha de Medición</label>
                      <input
                        type="date"
                        value={studyDate}
                        onChange={(e) => setStudyDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contaminante / Agente Ambiental a Diluir o Captar
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Humos de soldadura, vapores orgánicos COV, calor..."
                        value={contaminantType}
                        onChange={(e) => setContaminantType(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Sistema de Filtración / Tratamiento de Efluentes (Art. 67)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Filtros Paint-Stop + Carbón Activado / Ciclón..."
                        value={filterSystem}
                        onChange={(e) => setFilterSystem(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Geometría y Ocupación */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                    2. Parámetros Dimensionales del Local y Ocupación (Anexo III Dec. 351/79)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Superficie (m²)</label>
                      <input
                        type="number"
                        min="1"
                        value={surfaceM2}
                        onChange={(e) => setSurfaceM2(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Altura Media (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={heightM}
                        onChange={(e) => setHeightM(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Personal en Turno</label>
                      <input
                        type="number"
                        min="1"
                        value={workersCount}
                        onChange={(e) => setWorkersCount(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Aberturas Naturales (m²)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={naturalOpeningsAreaM2}
                        onChange={(e) => setNaturalOpeningsAreaM2(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Tipo de Actividad Física (Anexo III)</label>
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as WorkplaceActivityType)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        <option value="sedentaria">Sedentaria (Oficinas / Control / Laboratorio)</option>
                        <option value="moderada">Moderada (Talleres / Ensamble / Fabricación)</option>
                        <option value="pesada">Pesada (Fundición / Cargas Manuales Intensas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Destino del Ambiente (Renovaciones/Hora)</label>
                      <select
                        value={environmentType}
                        onChange={(e) => setEnvironmentType(e.target.value as RoomEnvironmentType)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        {Object.entries(ENVIRONMENT_AIR_CHANGES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label} (Mín: {v.minRenH} Ren/h | Máx: {v.maxRenH} Ren/h)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Instrumental de Medición Utilizado */}
                <div className="bg-sky-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-sky-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-sky-950 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-sky-600" />
                    3. Instrumental Utilizado (Anemómetro / Termo-Anemómetro / Medidor IAQ)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-slate-600 font-bold block mb-1">Marca y Modelo del Instrumento</label>
                      <input
                        type="text"
                        value={anemometerBrandModel}
                        onChange={(e) => setAnemometerBrandModel(e.target.value)}
                        placeholder="Ej: Testo 410-2 / Extech AN200"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">N° de Serie</label>
                      <input
                        type="text"
                        value={anemometerSerial}
                        onChange={(e) => setAnemometerSerial(e.target.value)}
                        placeholder="SN-41088421"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-bold block mb-1">Certificado Calibración</label>
                      <input
                        type="text"
                        value={anemometerCertNumber}
                        onChange={(e) => setAnemometerCertNumber(e.target.value)}
                        placeholder="CERT-INTI-2026"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Equipos de Ventilación Mecánica */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Fan className="w-4 h-4 text-teal-600" />
                      4. Relevamiento de Equipos de Extracción / Inyección Mecánica
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Equipo
                    </button>
                  </div>

                  {equipments.map((eq) => (
                    <div key={eq.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block">Tag / ID</label>
                        <input
                          type="text"
                          placeholder="EXT-01"
                          value={eq.tag}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'tag', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold block">Tipo de Equipo</label>
                        <select
                          value={eq.type}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'type', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        >
                          <option value="extractor_axial">Extractor Axial de Muro</option>
                          <option value="extractor_eolico">Extractor Eólico de Techo</option>
                          <option value="extractor_centrifugo">Extractor Centrífugo</option>
                          <option value="inyector_aire_fresco">Inyector de Aire Fresco</option>
                          <option value="campana_extraccion">Campana de Extracción Localizada</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block">Caudal Unit. (m³/h)</label>
                        <input
                          type="number"
                          placeholder="m³/h unitario"
                          value={eq.flowRateM3H}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'flowRateM3H', Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block">Diámetro (mm)</label>
                        <input
                          type="number"
                          placeholder="Ø mm"
                          value={eq.diameterMm || 500}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'diameterMm', Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div className="flex items-end gap-1.5">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-bold block">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            value={eq.quantity}
                            onChange={(e) => handleUpdateEquipment(eq.id, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. Puntos de Medición Anemométrica y Calidad de Aire Interior (NUEVO EN UI) */}
                <div className="bg-teal-50/50 dark:bg-slate-800/60 p-4 rounded-2xl border border-teal-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-teal-950 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-teal-600" />
                        5. Puntos de Medición Anemométrica y Calidad de Aire en Puestos
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Velocidad de confort recomendada: 0,15 a 0,50 m/s (frente de campana ≥ 0,50 m/s) • CO₂ máx recomendado: ≤ 1.000 ppm
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPoint}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Punto
                    </button>
                  </div>

                  {points.map((pt) => {
                    const velOk = pt.airVelocityMS >= 0.15 && pt.airVelocityMS <= 1.5;
                    const co2Ok = (pt.co2Ppm || 400) <= 1000;
                    return (
                      <div key={pt.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-bold block">Puesto / Ubicación</label>
                          <input
                            type="text"
                            placeholder="Ej: Frente de Campana Soldadura"
                            value={pt.location}
                            onChange={(e) => handleUpdatePoint(pt.id, 'location', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">Velocidad (m/s)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={pt.airVelocityMS}
                            onChange={(e) => handleUpdatePoint(pt.id, 'airVelocityMS', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">CO₂ Ambiental (ppm)</label>
                          <input
                            type="number"
                            step="10"
                            min="350"
                            value={pt.co2Ppm || 550}
                            onChange={(e) => handleUpdatePoint(pt.id, 'co2Ppm', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block">Temp. Bulbo Seco (°C)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={pt.temperatureC || 22}
                            onChange={(e) => handleUpdatePoint(pt.id, 'temperatureC', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                            velOk && co2Ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {velOk && co2Ok ? '✓ APTO' : '⚠️ REVISAR'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(pt.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 6. Verificación Reglamentaria Decreto 351/79 Cap. 11 (NUEVO EN UI) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    6. Lista de Verificación Normativa — Decreto 351/79 Cap. 11 (Arts. 64 al 70)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {VENTILATION_LEGAL_CHECKS.map((itemText, idx) => {
                      const checked = verificacionesLegales.includes(itemText);
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setVerificacionesLegales((prev) =>
                              checked ? prev.filter((x) => x !== itemText) : [...prev, itemText]
                            )
                          }
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                            checked
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400'
                              : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 font-black text-white ${
                            checked ? 'bg-emerald-600' : 'bg-rose-500'
                          }`}>
                            {checked ? '✓' : '✕'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                              {itemText}
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-white/80 text-slate-600 border border-slate-200">
                              Dec. 351/79 Cap. 11 • {checked ? 'CUMPLE' : 'NO CUMPLE'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Panel de Resultados en Tiempo Real y Recomendaciones */}
                <div className={`p-4 rounded-2xl border-2 ${
                  liveMetrics.isCompliant
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-900/60'
                    : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-400 dark:border-rose-900/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-teal-600" />
                      Diagnóstico de Ventilación en Tiempo Real (Dec. 351/79):
                    </span>

                    <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                      liveMetrics.isCompliant
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {liveMetrics.isCompliant ? '✓ APROBADO / CONFORME' : `⚠️ DÉFICIT: ${liveMetrics.flowDeficitM3H.toLocaleString()} m³/h`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block font-bold">Volumen Total:</span>
                      <span className="font-black text-sm">{liveMetrics.volumeM3} m³ ({liveMetrics.cubicMetersPerPerson} m³/pers.)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold">Caudal Exigido:</span>
                      <span className="font-black text-sm">{liveMetrics.totalRequiredFlowRateM3H.toLocaleString()} m³/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold">Caudal Real Instalado:</span>
                      <span className="font-black text-sm text-teal-700">{liveMetrics.totalActualFlowRateM3H.toLocaleString()} m³/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold">Renovaciones Reales:</span>
                      <span className="font-black text-sm">{liveMetrics.actualAirChangesPerHour} Ren/h (Mín {liveMetrics.recommendedAirChangesPerHour})</span>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones con botón de redacción automática */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      7. Conclusiones, Dictamen Técnico y Recomendaciones de Ingeniería
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDraftRecommendations}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Redactar Dictamen Automático
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Indique medidas correctivas, mantenimiento de extractores o necesidad de aspiración localizada..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* 8. Firmas Digitales y Cuadro de Firma Formato ATS (Profesional en el Centro) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border-2 border-emerald-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs block">
                        8. Firmas Digitales del Protocolo (Formato ATS — Profesional H&S en el Centro ⭐)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Dibuje las firmas digitales en pantalla o deje en blanco para firmar en papel impreso.
                      </span>
                    </div>
                  </div>

                  {/* Toggles de visibilidad de cada caja */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={showSignatures.operator}
                        onChange={(e) => setShowSignatures(s => ({ ...s, operator: e.target.checked }))}
                      />
                      <span>1. Representante Empresa (Izq.)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 cursor-pointer font-black text-emerald-900 dark:text-emerald-300">
                      <input
                        type="checkbox"
                        checked={showSignatures.professional}
                        onChange={(e) => setShowSignatures(s => ({ ...s, professional: e.target.checked }))}
                      />
                      <span>2. Profesional HyS (Centro ⭐)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={showSignatures.supervisor}
                        onChange={(e) => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))}
                      />
                      <span>3. Jefe Planta / Mant. (Der.)</span>
                    </label>
                  </div>

                  {/* Datos y Lienzos de las 3 Firmas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Izquierda: Representante */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-black text-[11px] text-slate-700 uppercase block">
                        1. Representante / Empleador (Izq.)
                      </span>
                      <input
                        type="text"
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        placeholder="Nombre Apoderado / Empleador"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                      <SignatureCanvas
                        label="Firma Empleador / Rep. Legal"
                        initialImage={representativeSignature}
                        onSave={(sig) => setRepresentativeSignature(sig)}
                        height={110}
                      />
                    </div>

                    {/* Centro: Profesional H&S */}
                    <div className="bg-emerald-50/50 dark:bg-slate-900 p-3 rounded-xl border-2 border-emerald-500 space-y-2">
                      <span className="font-black text-[11px] text-emerald-800 uppercase block">
                        2. Profesional H&S Actuante (Centro ⭐)
                      </span>
                      <input
                        type="text"
                        value={evaluatorTitle}
                        onChange={(e) => setEvaluatorTitle(e.target.value)}
                        placeholder="Título Profesional"
                        className="w-full p-1.5 rounded-lg border border-emerald-300 text-xs font-bold bg-white"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={evaluatorName}
                          onChange={(e) => setEvaluatorName(e.target.value)}
                          placeholder="Nombre y Apellido"
                          className="w-full p-1.5 rounded-lg border border-emerald-300 text-xs font-bold bg-white"
                        />
                        <input
                          type="text"
                          value={evaluatorLicense}
                          onChange={(e) => setEvaluatorLicense(e.target.value)}
                          placeholder="Matrícula"
                          className="w-full p-1.5 rounded-lg border border-emerald-300 text-xs font-bold bg-white"
                        />
                      </div>
                      <SignatureCanvas
                        label="Firma Profesional HyS (Centro)"
                        initialImage={evaluatorSignature}
                        onSave={(sig) => setEvaluatorSignature(sig)}
                        height={110}
                      />
                    </div>

                    {/* Derecha: Jefe de Planta / Mantenimiento */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-black text-[11px] text-slate-700 uppercase block">
                        3. Jefe de Planta / Mant. (Der.)
                      </span>
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="Nombre Jefe de Planta"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                      <SignatureCanvas
                        label="Firma Jefe de Planta / Mant."
                        initialImage={supervisorSignature}
                        onSave={(sig) => setSupervisorSignature(sig)}
                        height={110}
                      />
                    </div>
                  </div>

                  {/* Vista Previa en Vivo del Cuadro de Firmas estilo ATS */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 text-center">
                      Vista Previa Oficial del Cuadro de Firmas (Idéntico a ATS con Profesional en el Centro)
                    </div>
                    <PdfSignatures
                      data={{
                        id: editingId || 'vent-preview',
                        showSignatures
                      }}
                      box1={
                        showSignatures.operator
                          ? {
                              title: 'REPRESENTANTE DEL ESTABLECIMIENTO',
                              subtitle: representativeName || activeCompany?.name || 'Firma y Aclaración',
                              signatureUrl: representativeSignature,
                              isProfessional: false
                            }
                          : null
                      }
                      box2={
                        showSignatures.professional
                          ? {
                              title: evaluatorTitle || 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
                              subtitle: evaluatorName || 'Ing. / Lic. Higiene y Seguridad',
                              license: evaluatorLicense || 'Mat. Vigente',
                              signatureUrl: evaluatorSignature,
                              stampUrl: evaluatorStamp,
                              isProfessional: true
                            }
                          : null
                      }
                      box3={
                        showSignatures.supervisor
                          ? {
                              title: 'JEFE DE PLANTA / MANTENIMIENTO',
                              subtitle: supervisorName || 'Conformidad Operativa',
                              signatureUrl: supervisorSignature,
                              isProfessional: false
                            }
                          : null
                      }
                      compact={true}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
                    }}
                    className="px-6 py-2.5 rounded-xl font-black transition-all cursor-pointer"
                  >
                    Guardar Estudio y Cálculos Oficiales
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!deleteTargetId}
          title="¿Eliminar estudio de ventilación?"
          message="Se borrará el registro y los cálculos asociados de la base de datos."
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
