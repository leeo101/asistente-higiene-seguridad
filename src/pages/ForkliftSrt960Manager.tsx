import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check,
  QrCode, Wrench, AlertOctagon, Award, RefreshCw, Key,
  Sparkles, Info, ChevronRight, Ban, Shield, Volume2, Sun, Lightbulb
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import SignatureCanvas from '../components/SignatureCanvas';
import toast from 'react-hot-toast';
import {
  ForkliftVehicle,
  ForkliftDriver,
  ForkliftDailyCheck,
  ForkliftMaintenance,
  DAILY_INSPECTION_ITEMS,
  DEFAULT_FORKLIFT_VEHICLES,
  DEFAULT_FORKLIFT_DRIVERS,
  DEFAULT_FORKLIFT_CHECKS
} from '../data/forkliftSrt960Data';
import {
  generateForkliftCredentialPdf,
  generateForkliftInspectionPdf,
  generateForkliftEquipmentTagPdf
} from '../utils/forkliftPdfGenerator';

const SAFETY_DEVICES = [
  { key: 'hasSeatbelt', label: 'Cinturón de Seguridad', subtitle: 'Obligatorio inercial o pélvico', icon: <Shield size={16} /> },
  { key: 'hasBackupAlarm', label: 'Alarma de Marcha Atrás', subtitle: 'Acústica intermitente audible', icon: <AlertTriangle size={16} /> },
  { key: 'hasStrobeLight', label: 'Baliza Ámbar 360°', subtitle: 'Destellante estroboscópica', icon: <Sun size={16} /> },
  { key: 'hasBlueSpotlight', label: 'Luz Blue Light Peatonal', subtitle: 'Proyector preventivo a piso', icon: <Lightbulb size={16} /> },
  { key: 'hasRopsFops', label: 'Cabina ROPS / FOPS', subtitle: 'Antivuelco y caída de carga', icon: <ShieldAlert size={16} /> },
  { key: 'hasLoadChart', label: 'Placa de Carga Legible', subtitle: 'Capacidad y centro de gravedad', icon: <FileText size={16} /> },
  { key: 'hasMirrors', label: 'Espejos Retrovisores', subtitle: 'Panorámica lateral y posterior', icon: <Eye size={16} /> },
  { key: 'hasHorn', label: 'Bocina / Claxon Operativo', subtitle: 'Advertencia acústica obligatoria', icon: <Volume2 size={16} /> },
  { key: 'hasFrontLights', label: 'Luces de Trabajo / Freno', subtitle: 'Focos delanteros y stop', icon: <Sparkles size={16} /> },
];

export default function ForkliftSrt960Manager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Tabs de navegación
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'checks' | 'maintenance'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de datos
  const [vehicles, setVehicles] = useState<ForkliftVehicle[]>([]);
  const [drivers, setDrivers] = useState<ForkliftDriver[]>([]);
  const [checks, setChecks] = useState<ForkliftDailyCheck[]>([]);
  const [maintenances, setMaintenances] = useState<ForkliftMaintenance[]>([]);

  // Modales
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ForkliftVehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Partial<ForkliftVehicle>>({
    internalCode: '',
    brand: '',
    model: '',
    serialNumber: '',
    year: new Date().getFullYear(),
    type: 'combustion_glp',
    capacityKg: 2500,
    maxLiftHeightMeters: 4.5,
    mastType: 'triplex',
    tireType: 'solidas_macizas',
    status: 'operativo',
    currentHours: 100,
    lastServiceHours: 0,
    nextServiceHours: 250,
    fireExtinguisherNumber: 'EXT-ABC-01',
    fireExtinguisherExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sectorLocation: 'Depósito Central',
    hasRopsFops: true,
    hasSeatbelt: true,
    hasBackupAlarm: true,
    hasStrobeLight: true,
    hasBlueSpotlight: true,
    hasLoadChart: true,
    notes: ''
  });

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<ForkliftDriver | null>(null);
  const [driverForm, setDriverForm] = useState<Partial<ForkliftDriver>>({
    fullName: '',
    dni: '',
    cuil: '',
    licenseNumber: `SRT960-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    courseHours: 10,
    courseEntity: 'Servicio de Higiene y Seguridad / Instituto Homologado',
    courseCertificateNumber: 'CERT-960-001',
    medicalFitDate: new Date().toISOString().split('T')[0],
    medicalFitExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    medicalFitStatus: 'apto',
    authorizedVehicleTypes: ['Autoelevador Frontal (GLP/Diésel)'],
    bloodType: '0 Rh+',
    emergencyContact: '',
    notes: ''
  });



  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<ForkliftMaintenance>>({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'preventivo_programado',
    operatingHours: 0,
    provider: 'Taller Central / Servicio Técnico Oficial',
    technicianName: '',
    description: 'Cambio de filtros de aceite y aire, lubricación de cadenas del mástil, ajuste de frenos y revisión de mangueras hidráulicas.',
    replacedItems: 'Filtro de aceite, filtro hidráulico, aceite ISO VG 68.',
    nextDueHours: 250,
    status: 'completado'
  });

  const [qrModalVehicle, setQrModalVehicle] = useState<ForkliftVehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'vehicle' | 'driver' | 'check' | 'maintenance'; id: string } | null>(null);

  // Carga inicial
  useEffect(() => {
    window.scrollTo(0, 0);

    const rawV = localStorage.getItem('forklift_vehicles_db');
    if (rawV) {
      try { setVehicles(JSON.parse(rawV)); } catch (e) { setVehicles(DEFAULT_FORKLIFT_VEHICLES); }
    } else {
      setVehicles(DEFAULT_FORKLIFT_VEHICLES);
      localStorage.setItem('forklift_vehicles_db', JSON.stringify(DEFAULT_FORKLIFT_VEHICLES));
    }

    const rawD = localStorage.getItem('forklift_drivers_db');
    if (rawD) {
      try { setDrivers(JSON.parse(rawD)); } catch (e) { setDrivers(DEFAULT_FORKLIFT_DRIVERS); }
    } else {
      setDrivers(DEFAULT_FORKLIFT_DRIVERS);
      localStorage.setItem('forklift_drivers_db', JSON.stringify(DEFAULT_FORKLIFT_DRIVERS));
    }

    const rawC = localStorage.getItem('forklift_daily_checks_db');
    if (rawC) {
      try { setChecks(JSON.parse(rawC)); } catch (e) { setChecks(DEFAULT_FORKLIFT_CHECKS); }
    } else {
      setChecks(DEFAULT_FORKLIFT_CHECKS);
      localStorage.setItem('forklift_daily_checks_db', JSON.stringify(DEFAULT_FORKLIFT_CHECKS));
    }

    const rawM = localStorage.getItem('forklift_maintenance_db');
    if (rawM) {
      try { setMaintenances(JSON.parse(rawM)); } catch (e) { setMaintenances([]); }
    } else {
      setMaintenances([]);
    }
  }, []);

  // Guardado en storage
  const saveVehicles = (data: ForkliftVehicle[]) => {
    setVehicles(data);
    localStorage.setItem('forklift_vehicles_db', JSON.stringify(data));
  };

  const saveDrivers = (data: ForkliftDriver[]) => {
    setDrivers(data);
    localStorage.setItem('forklift_drivers_db', JSON.stringify(data));
  };

  const saveChecks = (data: ForkliftDailyCheck[]) => {
    setChecks(data);
    localStorage.setItem('forklift_daily_checks_db', JSON.stringify(data));
  };

  const saveMaintenances = (data: ForkliftMaintenance[]) => {
    setMaintenances(data);
    localStorage.setItem('forklift_maintenance_db', JSON.stringify(data));
  };

  // KPIs
  const metrics = useMemo(() => {
    const totalVehicles = vehicles.length;
    const operativeVehicles = vehicles.filter(v => v.status === 'operativo').length;
    const outOfServiceVehicles = vehicles.filter(v => v.status === 'fuera_de_servicio' || v.status === 'mantenimiento').length;
    const operativePercent = totalVehicles > 0 ? Math.round((operativeVehicles / totalVehicles) * 100) : 100;

    const todayStr = new Date().toISOString().split('T')[0];
    const activeDrivers = drivers.filter(d => d.expiryDate >= todayStr && d.medicalFitStatus === 'apto').length;
    const expiringSoonDrivers = drivers.filter(d => {
      const days = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return days >= 0 && days <= 30;
    }).length;
    const expiredDrivers = drivers.filter(d => d.expiryDate < todayStr).length;

    const totalChecks = checks.length;
    const checksWithFailure = checks.filter(c => c.hasCriticalFailure).length;
    const complianceRate = totalChecks > 0 ? Math.round(((totalChecks - checksWithFailure) / totalChecks) * 100) : 100;

    return {
      totalVehicles,
      operativeVehicles,
      outOfServiceVehicles,
      operativePercent,
      totalDrivers: drivers.length,
      activeDrivers,
      expiringSoonDrivers,
      expiredDrivers,
      totalChecks,
      checksWithFailure,
      complianceRate
    };
  }, [vehicles, drivers, checks]);

  // Manejo de vehículos
  const handleOpenNewVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      internalCode: `AE-0${vehicles.length + 1}`,
      brand: 'Toyota',
      model: '8FGU25',
      serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      year: new Date().getFullYear(),
      type: 'combustion_glp',
      capacityKg: 2500,
      maxLiftHeightMeters: 4.5,
      mastType: 'triplex',
      tireType: 'solidas_macizas',
      status: 'operativo',
      currentHours: 100,
      lastServiceHours: 0,
      nextServiceHours: 250,
      fireExtinguisherNumber: 'EXT-ABC',
      fireExtinguisherExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sectorLocation: 'Depósito Central',
      hasRopsFops: true,
      hasSeatbelt: true,
      hasBackupAlarm: true,
      hasStrobeLight: true,
      hasBlueSpotlight: true,
      hasLoadChart: true,
      hasMirrors: true,
      hasHorn: true,
      hasFrontLights: true,
      notes: ''
    });
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (veh: ForkliftVehicle) => {
    setEditingVehicle(veh);
    setVehicleForm(veh);
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.internalCode || !vehicleForm.brand) {
      toast.error('Complete el código y la marca del autoelevador');
      return;
    }

    if (editingVehicle) {
      const updated = vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...vehicleForm } as ForkliftVehicle : v);
      saveVehicles(updated);
      toast.success('Autoelevador actualizado correctamente');
    } else {
      const newV: ForkliftVehicle = {
        ...vehicleForm,
        id: `forklift-v-${Date.now()}`,
        companyId: activeCompany?.id,
        createdAt: new Date().toISOString().split('T')[0]
      } as ForkliftVehicle;
      saveVehicles([newV, ...vehicles]);
      toast.success('Nuevo autoelevador registrado en el padrón');
    }
    setShowVehicleModal(false);
  };

  // Manejo de conductores
  const handleOpenNewDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      fullName: '',
      dni: '',
      cuil: '',
      licenseNumber: `SRT960-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      courseHours: 10,
      courseEntity: 'Servicio HyS Propio / Instituto Certificado',
      courseCertificateNumber: `CERT-960-${Math.floor(1000 + Math.random() * 9000)}`,
      medicalFitDate: new Date().toISOString().split('T')[0],
      medicalFitExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      medicalFitStatus: 'apto',
      authorizedVehicleTypes: ['Autoelevador Frontal (GLP/Diésel)'],
      bloodType: '0 Rh+',
      emergencyContact: '',
      notes: ''
    });
    setShowDriverModal(true);
  };

  const handleEditDriver = (driver: ForkliftDriver) => {
    setEditingDriver(driver);
    setDriverForm(driver);
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.fullName || !driverForm.cuil) {
      toast.error('Complete el nombre y CUIL del conductor');
      return;
    }

    if (editingDriver) {
      const updated = drivers.map(d => d.id === editingDriver.id ? { ...d, ...driverForm } as ForkliftDriver : d);
      saveDrivers(updated);
      toast.success('Conductor actualizado con éxito');
    } else {
      const newD: ForkliftDriver = {
        ...driverForm,
        id: `forklift-d-${Date.now()}`,
        companyId: activeCompany?.id,
        status: driverForm.status || 'habilitado'
      } as ForkliftDriver;
      saveDrivers([newD, ...drivers]);
      toast.success('Conductor habilitado según Res. SRT 960/15');
    }
    setShowDriverModal(false);
  };

  // Check Pre-operacional (Navegación al nuevo apartado dedicado)
  const handleOpenNewCheck = (defaultVehicleId?: string) => {
    navigate('/autoelevadores/check', { state: { vehicleId: defaultVehicleId } });
  };

    // Mantenimiento
  const handleOpenMaintenance = (vehId?: string) => {
    const targetVeh = vehicles.find(v => v.id === vehId) || vehicles[0];
    setMaintenanceForm({
      vehicleId: targetVeh ? targetVeh.id : '',
      date: new Date().toISOString().split('T')[0],
      type: 'preventivo_programado',
      operatingHours: targetVeh ? targetVeh.currentHours : 100,
      provider: 'Servicio Técnico Autorizado',
      technicianName: '',
      description: 'Mantenimiento preventivo programado según horas de funcionamiento.',
      replacedItems: 'Filtros, lubricantes, revisión de presión de neumáticos.',
      nextDueHours: targetVeh ? targetVeh.currentHours + 250 : 250,
      status: 'completado'
    });
    setShowMaintenanceModal(true);
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find(v => v.id === maintenanceForm.vehicleId);
    if (!veh) {
      toast.error('Seleccione un autoelevador válido');
      return;
    }

    const newM: ForkliftMaintenance = {
      id: `maint-${Date.now()}`,
      companyId: activeCompany?.id,
      vehicleId: veh.id,
      vehicleCode: veh.internalCode,
      date: maintenanceForm.date || new Date().toISOString().split('T')[0],
      type: maintenanceForm.type || 'preventivo_programado',
      operatingHours: maintenanceForm.operatingHours || veh.currentHours,
      provider: maintenanceForm.provider || '',
      technicianName: maintenanceForm.technicianName || '',
      description: maintenanceForm.description || '',
      replacedItems: maintenanceForm.replacedItems || '',
      nextDueHours: maintenanceForm.nextDueHours || veh.currentHours + 250,
      status: 'completado',
      createdAt: new Date().toISOString()
    };

    saveMaintenances([newM, ...maintenances]);

    // Actualizar vehículo a operativo y registrar horas
    const updatedVehicles = vehicles.map(v => {
      if (v.id === veh.id) {
        return {
          ...v,
          lastServiceHours: newM.operatingHours,
          nextServiceHours: newM.nextDueHours,
          status: 'operativo' as const
        };
      }
      return v;
    });
    saveVehicles(updatedVehicles);

    toast.success('Registro de mantenimiento guardado. Equipo re-habilitado como operativo.');
    setShowMaintenanceModal(false);
  };

  // Eliminación con confirmación
  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'vehicle') {
      saveVehicles(vehicles.filter(v => v.id !== deleteTarget.id));
      toast.success('Autoelevador eliminado del padrón');
    } else if (deleteTarget.type === 'driver') {
      saveDrivers(drivers.filter(d => d.id !== deleteTarget.id));
      toast.success('Conductor eliminado del registro');
    } else if (deleteTarget.type === 'check') {
      saveChecks(checks.filter(c => c.id !== deleteTarget.id));
      toast.success('Registro de checklist eliminado');
    } else if (deleteTarget.type === 'maintenance') {
      saveMaintenances(maintenances.filter(m => m.id !== deleteTarget.id));
      toast.success('Registro de mantenimiento eliminado');
    }

    setDeleteTarget(null);
  };

  // Exportar todo a CSV
  const exportAllToCsv = () => {
    const csvRows = [
      'TIPO_REGISTRO,CODIGO,NOMBRE_O_DESCRIPCION,ESTADO,FECHA_O_VIGENCIA,HORAS_MOTOR',
      ...vehicles.map(v => `AUTOELEVADOR,"${v.internalCode}","${v.brand} ${v.model}","${v.status}","${v.year}","${v.currentHours}"`),
      ...drivers.map(d => `CONDUCTOR,"${d.dni}","${d.fullName}","${d.status}","${d.expiryDate}","${d.courseHours} hs"`),
      ...checks.map(c => `CHECK_DIARIO,"${c.vehicleCode}","${c.driverName}","${c.result}","${c.date}","${c.startHours} hs"`)
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Res960_Autoelevadores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Base de datos exportada en formato CSV');
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors" style={{ paddingTop: '7.5rem' }}>
        {/* Header Premium */}
        <PremiumHeader
          title="Autoelevadores & Maquinaria"
          subtitle="Gestión Integral de Vehículos Autopropulsados de Carga — Resolución S.R.T. N° 960/15"
          badge="Res. SRT 960/15"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportAllToCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Exportar CSV
            </button>
          </div>
        </PremiumHeader>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          {/* Métricas y KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flota de Equipos</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.totalVehicles}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.operativeVehicles} Operativos</span>
                <span className="text-slate-400">•</span>
                <span className={metrics.outOfServiceVehicles > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}>
                  {metrics.outOfServiceVehicles} Fuera de servicio
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conductores Habilitados</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.activeDrivers} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalDrivers}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {metrics.expiringSoonDrivers > 0 ? (
                  <span className="text-amber-500 font-bold">{metrics.expiringSoonDrivers} por vencer (&lt;30d)</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Todos con carnet al día</span>
                )}
                {metrics.expiredDrivers > 0 && (
                  <span className="text-red-500 font-bold">({metrics.expiredDrivers} vencidos)</span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conformidad Pre-op</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.complianceRate}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Basado en {metrics.totalChecks} inspecciones diarias registradas
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paradas Críticas (Art. 6)</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.checksWithFailure}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Inmovilizaciones automáticas por riesgo inminente
              </div>
            </div>
          </div>

          {/* Banner de cumplimiento legal SRT */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Marco Legal Obligatorio: Resolución S.R.T. N° 960/15 (B.O. 06/05/2015)
              </p>
              <p>
                Todo conductor debe contar con <strong>capacitación teórica-práctica mínima de 10 hs</strong>, evaluación médica periódica y <strong>credencial habilitante con vigencia máxima de 1 año</strong>. El checklist diario es obligatorio antes de cada turno; cualquier falla en ítems críticos inmoviliza inmediatamente el equipo.
              </p>
            </div>
          </div>

          {/* Tabs principales */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl">
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'vehicles'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                Padrón de Equipos ({vehicles.length})
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'drivers'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                Conductores & Carnets ({drivers.length})
              </button>
              <button
                onClick={() => setActiveTab('checks')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'checks'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Checklists Diarios ({checks.length})
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'maintenance'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Mantenimiento ({maintenances.length})
              </button>
            </div>

            {/* Barra de búsqueda y botones principales */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 pointer-events-none z-10"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'block'
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar en el registro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '0.75rem',
                    height: '38px',
                    minHeight: '38px',
                    boxSizing: 'border-box'
                  }}
                  className="text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56 shadow-xs font-semibold"
                />
              </div>

              {activeTab === 'vehicles' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleOpenNewVehicle}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    style={{ minHeight: '38px' }}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Alta Autoelevador
                  </button>
                  <button
                    onClick={() => handleOpenNewCheck()}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    style={{ minHeight: '38px' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Nuevo Check Pre-op
                  </button>
                </div>
              )}
              {activeTab === 'drivers' && (
                <button
                  onClick={handleOpenNewDriver}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  style={{ minHeight: '38px' }}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Alta Conductor
                </button>
              )}
              {activeTab === 'checks' && (
                <button
                  onClick={() => handleOpenNewCheck()}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  style={{ minHeight: '38px' }}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Nuevo Check Pre-operacional
                </button>
              )}
              {activeTab === 'maintenance' && (
                <button
                  onClick={() => handleOpenMaintenance()}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  style={{ minHeight: '38px' }}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Registrar Service
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: VEHÍCULOS Y EQUIPOS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              {vehicles.length === 0 ? (
                <EmptyStateIllustrated
                  title="No hay autoelevadores registrados"
                  description="Comience agregando los vehículos autopropulsados para gestionar sus inspecciones y hojas de vida."
                  actionLabel="Registrar Autoelevador"
                  onAction={handleOpenNewVehicle}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles
                    .filter(v =>
                      v.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.sectorLocation.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((veh) => {
                      const isOutOfService = veh.status === 'fuera_de_servicio';
                      const isMaintenance = veh.status === 'mantenimiento';

                      return (
                        <div
                          key={veh.id}
                          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                            isOutOfService
                              ? 'border-red-400 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/20'
                              : isMaintenance
                              ? 'border-amber-400 dark:border-amber-800/80'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {/* Banner de estado superior */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                  {veh.internalCode}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isOutOfService
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300'
                                    : isMaintenance
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300'
                                }`}>
                                  {isOutOfService ? 'INMOVILIZADO / CRÍTICO' : isMaintenance ? 'EN SERVICE' : 'OPERATIVO'}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                {veh.brand} {veh.model} ({veh.year})
                              </p>
                            </div>

                            <button
                              onClick={() => setQrModalVehicle(veh)}
                              title="Ver Código QR del equipo"
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Especificaciones */}
                          <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800/80 my-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Capacidad</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{veh.capacityKg} kg</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Horómetro</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{veh.currentHours} hs</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Ubicación</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">{veh.sectorLocation}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Extintor</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{veh.fireExtinguisherNumber}</span>
                            </div>
                          </div>

                          {/* Medidas de seguridad instaladas */}
                          <div className="flex items-center gap-1.5 flex-wrap my-1">
                            {veh.hasSeatbelt && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                Cinturón 3P
                              </span>
                            )}
                            {veh.hasBackupAlarm && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                Alarma Rev
                              </span>
                            )}
                            {veh.hasStrobeLight && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                Baliza 360°
                              </span>
                            )}
                            {veh.hasBlueSpotlight && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                Blue Spot
                              </span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                            <button
                              onClick={() => handleOpenNewCheck(veh.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Check Hoy
                            </button>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => generateForkliftEquipmentTagPdf(veh, activeCompany?.name)}
                                title="Descargar Rótulo Oficial de Seguridad A4"
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Rótulo A4</span>
                              </button>
                              <button
                                onClick={() => handleEditVehicle(veh)}
                                title="Editar datos"
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'vehicle', id: veh.id })}
                                title="Eliminar equipo"
                                className="p-1.5 px-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONDUCTORES Y CARNETS HABILITANTES */}
          {activeTab === 'drivers' && (
            <div className="space-y-4">
              {drivers.length === 0 ? (
                <EmptyStateIllustrated
                  title="No hay conductores habilitados cargados"
                  description="Registre a los maquinistas capacitados conforme al curso teórico-práctico de 10 hs (Res. SRT 960/15)."
                  actionLabel="Habilitar Conductor"
                  onAction={handleOpenNewDriver}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers
                    .filter(d =>
                      d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.cuil.includes(searchTerm) ||
                      d.dni.includes(searchTerm) ||
                      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((drv) => {
                      const isExpired = new Date(drv.expiryDate) < new Date();
                      const daysLeft = Math.round((new Date(drv.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));

                      return (
                        <div
                          key={drv.id}
                          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md relative flex flex-col justify-between ${
                            isExpired
                              ? 'border-red-400 dark:border-red-800 bg-red-50/20 dark:bg-red-950/20'
                              : daysLeft <= 30
                              ? 'border-amber-400 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                                  {drv.fullName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                                    {drv.fullName}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    DNI {drv.dni} | CUIL {drv.cuil}
                                  </p>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isExpired
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : daysLeft <= 30
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              }`}>
                                {isExpired ? 'CARNET VENCIDO' : daysLeft <= 30 ? `VENCE EN ${daysLeft}D` : 'HABILITADO'}
                              </span>
                            </div>

                            {/* Detalles de la habilitación */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 my-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between">
                                <span className="text-slate-400">N° Habilitación:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{drv.licenseNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Capacitación SRT:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{drv.courseHours} horas (Aprobado)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Apto Médico:</span>
                                <span className={`font-semibold ${
                                  drv.medicalFitStatus === 'apto' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  {drv.medicalFitStatus === 'apto' ? 'Apto Sin Restricciones' : 'Apto con Restricción'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Vigencia Anual:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{drv.expiryDate}</span>
                              </div>
                            </div>

                            {/* Maquinaria autorizada */}
                            <div className="text-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                Equipos Autorizados:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {drv.authorizedVehicleTypes.map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Botón de impresión de Credencial Oficial y acciones */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            <button
                              onClick={() => generateForkliftCredentialPdf(drv, activeCompany?.name, activeCompany?.cuit)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Credencial PDF
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditDriver(drv)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title="Editar datos del conductor"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'driver', id: drv.id })}
                                className="p-1.5 px-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
                                title="Eliminar conductor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHECKLIST PRE-OPERACIONAL DIARIO */}
          {activeTab === 'checks' && (
            <div className="space-y-4">
              {checks.length === 0 ? (
                <EmptyStateIllustrated
                  title="No hay inspecciones pre-operacionales"
                  description="Realice la primera verificación previa al turno para garantizar la seguridad operativa y cumplir con el Art. 6."
                  actionLabel="Realizar Check Pre-operacional"
                  onAction={() => handleOpenNewCheck()}
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">Fecha / Turno</th>
                          <th className="p-3.5">Autoelevador</th>
                          <th className="p-3.5">Conductor Habilitado</th>
                          <th className="p-3.5">Horómetro</th>
                          <th className="p-3.5">Resultado</th>
                          <th className="p-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {checks
                          .filter(c =>
                            c.vehicleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.date.includes(searchTerm)
                          )
                          .map((check) => {
                            const isBlocked = check.hasCriticalFailure;
                            const veh = vehicles.find(v => v.id === check.vehicleId);

                            return (
                              <tr
                                key={check.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                                  isBlocked ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                                }`}
                              >
                                <td className="p-3.5">
                                  <span className="font-bold text-slate-900 dark:text-white block">{check.date}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{check.shift}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className="font-black text-amber-600 dark:text-amber-400">{check.vehicleCode}</span>
                                  <span className="text-[10px] text-slate-400 block">{veh ? `${veh.brand} ${veh.model}` : ''}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{check.driverName}</span>
                                  <span className="text-[10px] text-slate-400">{check.driverCuil}</span>
                                </td>
                                <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                                  {check.startHours} hs
                                </td>
                                <td className="p-3.5">
                                  {isBlocked ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300">
                                      <AlertOctagon className="w-3 h-3" />
                                      BLOQUEADO / CRÍTICO
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      APROBADO
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => generateForkliftInspectionPdf(check, veh, activeCompany?.name, activeCompany?.cuit)}
                                      title="Descargar Planilla Oficial Res. SRT 960/15 PDF"
                                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      Planilla PDF
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ type: 'check', id: check.id })}
                                      className="p-1.5 px-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
                                      title="Eliminar check"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MANTENIMIENTO Y HORÓMETRO */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              {maintenances.length === 0 ? (
                <EmptyStateIllustrated
                  title="No hay mantenimientos registrados"
                  description="Lleve el libro de vida y mantenimiento preventivo por horómetro para asegurar la trazabilidad del parque automotor."
                  actionLabel="Registrar Service"
                  onAction={() => handleOpenMaintenance()}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenances
                    .filter(m =>
                      m.vehicleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.provider.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((maint) => (
                      <div
                        key={maint.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                              {maint.vehicleCode}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              {maint.date}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 capitalize">
                              {maint.type.replace('_', ' ')}
                            </h4>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {maint.operatingHours} hs de motor
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {maint.description}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Repuestos:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{maint.replacedItems || 'Ninguno'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Proveedor / Taller:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{maint.provider}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Próximo Service:</span>
                            <span className="font-bold text-amber-600">{maint.nextDueHours} hs</span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setDeleteTarget({ type: 'maintenance', id: maint.id })}
                            className="p-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer flex items-center gap-1"
                            title="Eliminar service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: ALTA / EDICIÓN DE AUTOELEVADOR */}
        {showVehicleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden my-auto animate-scale-up">
              {/* Header fijo */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      {editingVehicle ? 'Editar Ficha de Autoelevador' : 'Alta de Autoelevador (Res. SRT 960/15)'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Padrón y especificaciones técnicas oficiales de seguridad operativa
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body scrollable */}
              <form onSubmit={handleSaveVehicle} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                  {/* Bloque 1: Identificación Principal */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Key size={13} className="text-blue-500" /> Identificación del Vehículo
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Código Interno (*)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: AE-01, CLARK-02"
                          value={vehicleForm.internalCode || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, internalCode: e.target.value.toUpperCase() })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-black"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">N° de Serie / Chasis</label>
                        <input
                          type="text"
                          placeholder="Ej: TY8-9482103"
                          value={vehicleForm.serialNumber || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, serialNumber: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Estado Operativo</label>
                        <select
                          value={vehicleForm.status || 'operativo'}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        >
                          <option value="operativo">🟢 Operativo / Habilitado</option>
                          <option value="mantenimiento">🟡 En Service / Taller</option>
                          <option value="fuera_de_servicio">🔴 Inmovilizado / Bloqueado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Marca (*)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Toyota, Linde, Crown"
                          value={vehicleForm.brand || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Modelo</label>
                        <input
                          type="text"
                          placeholder="Ej: 8FGU25, H50FT"
                          value={vehicleForm.model || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Año de Fabricación</label>
                        <input
                          type="number"
                          placeholder="Ej: 2024"
                          value={vehicleForm.year || new Date().getFullYear()}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Capacidad y Especificaciones Técnicas */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Activity size={13} className="text-emerald-500" /> Especificaciones Mecánicas y Operativas
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Propulsión</label>
                        <select
                          value={vehicleForm.type || 'combustion_glp'}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                          <option value="combustion_glp">Combustión GLP (Gas)</option>
                          <option value="combustion_diesel">Combustión Diésel</option>
                          <option value="combustion_nafta">Combustión Nafta</option>
                          <option value="electric">Eléctrico a Batería</option>
                          <option value="reach_truck">Retráctil Reach Truck</option>
                          <option value="order_picker">Apilador Eléctrico</option>
                          <option value="stacker">Transpaleta Eléctrica</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Capacidad Máx de Carga (kg)</label>
                        <input
                          type="number"
                          value={vehicleForm.capacityKg || 2500}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Horómetro Actual (hs)</label>
                        <input
                          type="number"
                          value={vehicleForm.currentHours || 0}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, currentHours: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Altura Máx de Elevación (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ej: 4.5"
                          value={vehicleForm.maxLiftHeightMeters || 4.5}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, maxLiftHeightMeters: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Mástil</label>
                        <select
                          value={vehicleForm.mastType || 'triplex'}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, mastType: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                          <option value="simplex">Simplex (1 etapa)</option>
                          <option value="duplex">Duplex (2 etapas)</option>
                          <option value="triplex">Triplex (3 etapas)</option>
                          <option value="cuadruplex">Cuádruplex (4 etapas)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Neumáticos</label>
                        <select
                          value={vehicleForm.tireType || 'solidas_macizas'}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, tireType: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                          <option value="solidas_macizas">Sólidas Macizas / Superelásticas</option>
                          <option value="neumaticas">Neumáticas con Cámara</option>
                          <option value="poliuretano">Poliuretano (Cushion / Interior)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 3: Ubicación y Protección Contra Incendios */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <MapPin size={13} className="text-rose-500" /> Ubicación y Seguridad contra Incendio
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sector de Operación / Planta</label>
                        <input
                          type="text"
                          placeholder="Ej: Depósito Central - Bahía 3"
                          value={vehicleForm.sectorLocation || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, sectorLocation: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Extintor N° Obligatorio</label>
                        <input
                          type="text"
                          placeholder="Ej: EXT-AE-01"
                          value={vehicleForm.fireExtinguisherNumber || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, fireExtinguisherNumber: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vencimiento del Extintor</label>
                        <input
                          type="date"
                          value={vehicleForm.fireExtinguisherExpiry || ''}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, fireExtinguisherExpiry: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 4: Dispositivos Reglamentarios de Seguridad (Interactive Cards) */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            Dispositivos Reglamentarios de Seguridad (Res. SRT 960/15 Art. 3)
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Marque los elementos obligatorios instalados y verificados en la unidad
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {SAFETY_DEVICES.map((dev) => {
                        const isInstalled = Boolean(vehicleForm[dev.key as keyof typeof vehicleForm]);
                        return (
                          <div
                            key={dev.key}
                            onClick={() => setVehicleForm({ ...vehicleForm, [dev.key]: !isInstalled })}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                              isInstalled
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                              isInstalled
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            }`}>
                              {dev.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-black text-xs leading-tight ${
                                  isInstalled
                                    ? 'text-emerald-900 dark:text-emerald-200'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {dev.label}
                                </span>
                                {isInstalled ? (
                                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium leading-tight">
                                {dev.subtitle}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloque 5: Observaciones / Notas */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Observaciones Técnicas / Limitaciones Operativas
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Indique notas de servicio, ensayos de horquillas, restricciones de rampa o sector..."
                      value={vehicleForm.notes || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Footer fijo con botones */}
                <div className="flex items-center justify-end gap-2 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    {editingVehicle ? 'Actualizar Autoelevador' : 'Guardar y Habilitar Equipo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ALTA / EDICIÓN DE CONDUCTOR (RES. SRT 960/15 ART. 4 Y 5) */}
        {showDriverModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden my-auto animate-scale-up">
              {/* Header fijo */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      {editingDriver ? 'Editar Conductor Habilitado' : 'Alta de Conductor (Res. SRT 960/15)'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Padrón oficial, acreditación de capacitación teórica/práctica y apto médico anual
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body scrollable */}
              <form onSubmit={handleSaveDriver} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                  {/* Bloque 1: Identificación del Conductor */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <User size={13} className="text-blue-500" /> Identificación del Conductor
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre Completo (*)</label>
                        <input
                          type="text"
                          required
                          placeholder="Apellido y Nombre del Operador"
                          value={driverForm.fullName || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-black"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">N° Habilitación / Carnet</label>
                        <input
                          type="text"
                          placeholder="Ej: HAB-960-2026-001"
                          value={driverForm.licenseNumber || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value.toUpperCase() })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">CUIL (*)</label>
                        <input
                          type="text"
                          required
                          placeholder="20-XXXXXXXX-X"
                          value={driverForm.cuil || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, cuil: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">DNI</label>
                        <input
                          type="text"
                          placeholder="Ej: 35.123.456"
                          value={driverForm.dni || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, dni: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Estado de Habilitación</label>
                        <select
                          value={driverForm.status || 'habilitado'}
                          onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        >
                          <option value="habilitado">🟢 Habilitado Oficial</option>
                          <option value="vencido">🔴 Carnet Vencido</option>
                          <option value="suspendido">🟡 Suspendido Temporalmente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Capacitación Teórica-Práctica (Art. 4 Res. SRT 960/15) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Award size={13} className="text-amber-500" /> Capacitación Teórico-Práctica (Mínimo 10 hs)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Carga Horaria (*)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Mínimo 10 hs"
                          value={driverForm.courseHours ?? 10}
                          onChange={(e) => setDriverForm({ ...driverForm, courseHours: Number(e.target.value) })}
                          className={`w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 font-bold ${
                            (driverForm.courseHours ?? 0) < 10 
                              ? 'border-amber-500 text-amber-600 focus:ring-amber-500' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                          }`}
                        />
                        {(driverForm.courseHours ?? 0) < 10 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                            ⚠️ Art. 4 exige mín. 10 horas de curso
                          </span>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Entidad Capacitadora</label>
                        <input
                          type="text"
                          placeholder="Ej: Servicio de Higiene y Seguridad / Instituto Homologado"
                          value={driverForm.courseEntity || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, courseEntity: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">N° de Certificado / Acta de Aprobación</label>
                      <input
                        type="text"
                        placeholder="Ej: CERT-960-2026-084"
                        value={driverForm.courseCertificateNumber || ''}
                        onChange={(e) => setDriverForm({ ...driverForm, courseCertificateNumber: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Bloque 3: Apto Psicofísico Médico (Art. 4 Res. SRT 960/15) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Activity size={13} className="text-emerald-500" /> Apto Psicofísico Médico Obligatorio (Periodicidad Anual)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dictamen Médico</label>
                        <select
                          value={driverForm.medicalFitStatus || 'apto'}
                          onChange={(e) => setDriverForm({ ...driverForm, medicalFitStatus: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        >
                          <option value="apto">🟢 Apto Completo (Sin Restricciones)</option>
                          <option value="apto_con_restriccion">🟡 Apto con Restricción (Lentes / Audífonos)</option>
                          <option value="no_apto">🔴 No Apto para Operar</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Examen Médico</label>
                        <input
                          type="date"
                          value={driverForm.medicalFitDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const d = new Date(val);
                            let exp = driverForm.medicalFitExpiry || '';
                            if (!isNaN(d.getTime())) {
                              d.setFullYear(d.getFullYear() + 1);
                              exp = d.toISOString().split('T')[0];
                            }
                            setDriverForm({ ...driverForm, medicalFitDate: val, medicalFitExpiry: exp });
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vencimiento Apto (1 Año)</label>
                        <input
                          type="date"
                          value={driverForm.medicalFitExpiry || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, medicalFitExpiry: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 4: Maquinaria y Equipos Autorizados (Art. 5) */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Truck size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                          Equipos Autorizados a Operar (Art. 5 Res. SRT 960/15)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Seleccione los tipos de autoelevadores evaluados en la práctica
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Autoelevador Frontal (GLP/Diésel)',
                        'Autoelevador Frontal Eléctrico',
                        'Retráctil / Reach Truck',
                        'Apilador Eléctrico',
                        'Transpaleta Eléctrica con Plataforma',
                        'Plataforma Elevadora Móvil de Personal (PEMP)'
                      ].map((tipo) => {
                        const currentTypes = driverForm.authorizedVehicleTypes || [];
                        const isSelected = currentTypes.includes(tipo);
                        return (
                          <div
                            key={tipo}
                            onClick={() => {
                              const updatedTypes = isSelected
                                ? currentTypes.filter(t => t !== tipo)
                                : [...currentTypes, tipo];
                              setDriverForm({ ...driverForm, authorizedVehicleTypes: updatedTypes });
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 font-medium'
                            }`}
                          >
                            <span className="text-xs leading-snug">{tipo}</span>
                            {isSelected ? (
                              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloque 5: Vigencia del Carnet y Contacto de Emergencia */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-500" /> Vigencia de Credencial y Datos de Emergencia
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Emisión Credencial (*)</label>
                        <input
                          type="date"
                          required
                          value={driverForm.issueDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const d = new Date(val);
                            let exp = driverForm.expiryDate || '';
                            if (!isNaN(d.getTime())) {
                              d.setFullYear(d.getFullYear() + 1);
                              exp = d.toISOString().split('T')[0];
                            }
                            setDriverForm({ ...driverForm, issueDate: val, expiryDate: exp });
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Vencimiento (1 Año)</label>
                        <input
                          type="date"
                          required
                          value={driverForm.expiryDate || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, expiryDate: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-amber-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Grupo y Factor Sanguíneo</label>
                        <select
                          value={driverForm.bloodType || '0 Rh+'}
                          onChange={(e) => setDriverForm({ ...driverForm, bloodType: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        >
                          <option value="0 Rh+">0 Rh+ (Positivo)</option>
                          <option value="0 Rh-">0 Rh- (Negativo)</option>
                          <option value="A Rh+">A Rh+ (Positivo)</option>
                          <option value="A Rh-">A Rh- (Negativo)</option>
                          <option value="B Rh+">B Rh+ (Positivo)</option>
                          <option value="B Rh-">B Rh- (Negativo)</option>
                          <option value="AB Rh+">AB Rh+ (Positivo)</option>
                          <option value="AB Rh-">AB Rh- (Negativo)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contacto de Emergencia / Teléfono</label>
                        <input
                          type="text"
                          placeholder="Ej: Laura Pérez (Esposa) - 11 5544-3322"
                          value={driverForm.emergencyContact || ''}
                          onChange={(e) => setDriverForm({ ...driverForm, emergencyContact: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Observaciones / Restricciones Operativas</label>
                      <input
                        type="text"
                        placeholder="Ej: Uso permanente de lentes correctivos recetados. Prohibición de operar en vía pública."
                        value={driverForm.notes || ''}
                        onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer fijo con botones */}
                <div className="flex items-center justify-end gap-2 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDriverModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    {editingDriver ? 'Actualizar Conductor' : 'Guardar y Habilitar Conductor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANTENIMIENTO PREVENTIVO */}
        {showMaintenanceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden my-auto animate-scale-up">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  Registrar Servicio Técnico / Mantenimiento
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMaintenance} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Autoelevador</label>
                    <select
                      value={maintenanceForm.vehicleId}
                      onChange={(e) => {
                        const v = vehicles.find(x => x.id === e.target.value);
                        setMaintenanceForm({
                          ...maintenanceForm,
                          vehicleId: e.target.value,
                          operatingHours: v ? v.currentHours : 100,
                          nextDueHours: v ? v.currentHours + 250 : 250
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.internalCode} - {v.brand}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={maintenanceForm.date}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Horómetro (hs)</label>
                    <input
                      type="number"
                      value={maintenanceForm.operatingHours}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, operatingHours: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Próx. Service (hs)</label>
                    <input
                      type="number"
                      value={maintenanceForm.nextDueHours}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextDueHours: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Proveedor / Taller</label>
                  <input
                    type="text"
                    value={maintenanceForm.provider}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, provider: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Trabajos Realizados</label>
                  <textarea
                    rows={2}
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Repuestos Utilizados</label>
                  <input
                    type="text"
                    value={maintenanceForm.replacedItems}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, replacedItems: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                </div>

                <div className="flex items-center justify-end gap-2 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    Guardar Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VER CÓDIGO QR DEL EQUIPO */}
        {qrModalVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-up">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Rótulo Digital QR</span>
                <button onClick={() => setQrModalVehicle(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block border-2 border-slate-200 shadow-inner">
                <QRCodeSVG
                  value={`hys-forklift://${qrModalVehicle.id}/${qrModalVehicle.internalCode}`}
                  size={180}
                  level="H"
                />
              </div>

              <div>
                <h4 className="font-black text-2xl text-slate-900 dark:text-white">
                  {qrModalVehicle.internalCode}
                </h4>
                <p className="text-xs text-slate-500">
                  {qrModalVehicle.brand} {qrModalVehicle.model} ({qrModalVehicle.capacityKg} kg)
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Escanear con la cámara para iniciar el checklist pre-operacional
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => generateForkliftEquipmentTagPdf(qrModalVehicle, activeCompany?.name)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Descargar Rótulo Oficial A4 (Imprimir)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="¿Confirmar eliminación?"
          message="Esta acción borrará el registro de la base de datos local y no se podrá deshacer."
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </AnimatedPage>
  );
}
