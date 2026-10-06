import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check,
  QrCode, Wrench, AlertOctagon, Award, RefreshCw, Key,
  Sparkles, Info, ChevronRight, Ban
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
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

  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedVehicleForCheck, setSelectedVehicleForCheck] = useState<string>('');
  const [selectedDriverForCheck, setSelectedDriverForCheck] = useState<string>('');
  const [checkShift, setCheckShift] = useState<'manana' | 'tarde' | 'noche'>('manana');
  const [checkHours, setCheckHours] = useState<number>(0);
  const [checkResponses, setCheckResponses] = useState<{ [id: string]: 'conforme' | 'no_conforme' | 'no_aplica' }>({});
  const [checkObservations, setCheckObservations] = useState('');

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
        status: 'habilitado'
      } as ForkliftDriver;
      saveDrivers([newD, ...drivers]);
      toast.success('Conductor habilitado según Res. SRT 960/15');
    }
    setShowDriverModal(false);
  };

  // Check Pre-operacional
  const handleOpenNewCheck = (defaultVehicleId?: string) => {
    const vId = defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : '');
    const v = vehicles.find(x => x.id === vId);
    setSelectedVehicleForCheck(vId);
    setCheckHours(v ? v.currentHours : 100);
    setSelectedDriverForCheck(drivers.length > 0 ? drivers[0].id : '');
    setCheckShift('manana');
    setCheckObservations('');

    // Iniciar con todo 'conforme' por defecto para agilizar
    const initResp: { [id: string]: 'conforme' | 'no_conforme' | 'no_aplica' } = {};
    DAILY_INSPECTION_ITEMS.forEach(it => {
      initResp[it.id] = 'conforme';
    });
    setCheckResponses(initResp);
    setShowCheckModal(true);
  };

  const handleToggleCheckItem = (itemId: string, value: 'conforme' | 'no_conforme' | 'no_aplica') => {
    setCheckResponses(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSaveDailyCheck = () => {
    const veh = vehicles.find(v => v.id === selectedVehicleForCheck);
    const drv = drivers.find(d => d.id === selectedDriverForCheck);

    if (!veh || !drv) {
      toast.error('Seleccione autoelevador y conductor habilitado');
      return;
    }

    // Detectar fallas críticas
    let hasCrit = false;
    DAILY_INSPECTION_ITEMS.forEach(it => {
      if (it.isCritical && checkResponses[it.id] === 'no_conforme') {
        hasCrit = true;
      }
    });

    const newCheck: ForkliftDailyCheck = {
      id: `check-${Date.now()}`,
      companyId: activeCompany?.id,
      vehicleId: veh.id,
      vehicleCode: veh.internalCode,
      driverId: drv.id,
      driverName: drv.fullName,
      driverCuil: drv.cuil,
      date: new Date().toISOString().split('T')[0],
      shift: checkShift,
      startHours: checkHours,
      responses: checkResponses,
      observations: checkObservations,
      hasCriticalFailure: hasCrit,
      result: hasCrit ? 'bloqueado_fuera_de_servicio' : 'aprobado',
      driverSignatureName: drv.fullName,
      supervisorSignatureName: 'Servicio de Higiene y Seguridad',
      resolved: !hasCrit,
      createdAt: new Date().toISOString()
    };

    saveChecks([newCheck, ...checks]);

    // Actualizar estado del vehículo y horómetro
    const updatedVehicles = vehicles.map(v => {
      if (v.id === veh.id) {
        return {
          ...v,
          currentHours: Math.max(v.currentHours, checkHours),
          status: hasCrit ? ('fuera_de_servicio' as const) : ('operativo' as const)
        };
      }
      return v;
    });
    saveVehicles(updatedVehicles);

    if (hasCrit) {
      toast.error('EQUIPO BLOQUEADO: Se detectó falla en ítem crítico. Se inmovilizó el autoelevador conforme Res. 960/15 Art. 6.', {
        duration: 6000
      });
    } else {
      toast.success('Checklist pre-operacional aprobado. Equipo habilitado para operar.', { duration: 4000 });
    }

    setShowCheckModal(false);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors">
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
            <button
              onClick={() => handleOpenNewCheck()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Nuevo Check Pre-operacional
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

            {/* Barra de búsqueda y botón según tab */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en el registro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-60"
                />
              </div>

              {activeTab === 'vehicles' && (
                <button
                  onClick={handleOpenNewVehicle}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Alta Autoelevador
                </button>
              )}
              {activeTab === 'drivers' && (
                <button
                  onClick={handleOpenNewDriver}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Alta Conductor
                </button>
              )}
              {activeTab === 'checks' && (
                <button
                  onClick={() => handleOpenNewCheck()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Check Pre-op
                </button>
              )}
              {activeTab === 'maintenance' && (
                <button
                  onClick={() => handleOpenMaintenance()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
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
                          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => handleOpenNewCheck(veh.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-1 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Check Hoy
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => generateForkliftEquipmentTagPdf(veh, activeCompany?.name)}
                                title="Descargar Rótulo Oficial de Seguridad A4"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditVehicle(veh)}
                                title="Editar datos"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'vehicle', id: veh.id })}
                                title="Eliminar equipo"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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

                          {/* Botón de impresión de Credencial Oficial */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => generateForkliftCredentialPdf(drv, activeCompany?.name, activeCompany?.cuit)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Credencial Plastificable PDF
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditDriver(drv)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'driver', id: drv.id })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
                                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      PDF Oficial
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ type: 'check', id: check.id })}
                                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  {editingVehicle ? 'Editar Autoelevador' : 'Alta de Autoelevador (Res. SRT 960/15)'}
                </h3>
                <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Código Interno (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: AE-01"
                      value={vehicleForm.internalCode}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, internalCode: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Marca (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Toyota, Linde, Crown"
                      value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: 8FGU25"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Propulsión</label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      <option value="combustion_glp">Combustión GLP (Gas)</option>
                      <option value="combustion_diesel">Combustión Diésel</option>
                      <option value="electric">Eléctrico a Batería</option>
                      <option value="reach_truck">Retráctil Reach Truck</option>
                      <option value="order_picker">Apilador Eléctrico</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Capacidad Máx (kg)</label>
                    <input
                      type="number"
                      value={vehicleForm.capacityKg}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Horómetro Actual (hs)</label>
                    <input
                      type="number"
                      value={vehicleForm.currentHours}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, currentHours: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sector de Operación / Planta</label>
                    <input
                      type="text"
                      placeholder="Ej: Depósito Central - Racks"
                      value={vehicleForm.sectorLocation}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, sectorLocation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Extintor N° / Vencimiento</label>
                    <input
                      type="text"
                      placeholder="Ej: EXT-04 (Vence 2026-12)"
                      value={vehicleForm.fireExtinguisherNumber}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fireExtinguisherNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Dispositivos de seguridad instalados */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Dispositivos Reglamentarios de Seguridad:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasSeatbelt}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasSeatbelt: e.target.checked })}
                      />
                      <span>Cinturón de Seguridad</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasBackupAlarm}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasBackupAlarm: e.target.checked })}
                      />
                      <span>Alarma de Marcha Atrás</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasStrobeLight}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasStrobeLight: e.target.checked })}
                      />
                      <span>Baliza Ámbar 360°</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasBlueSpotlight}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasBlueSpotlight: e.target.checked })}
                      />
                      <span>Luz Blue Light Peatonal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasRopsFops}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasRopsFops: e.target.checked })}
                      />
                      <span>Cabina ROPS / FOPS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleForm.hasLoadChart}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, hasLoadChart: e.target.checked })}
                      />
                      <span>Placa de Carga Legible</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Guardar Autoelevador
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ALTA / EDICIÓN DE CONDUCTOR */}
        {showDriverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  {editingDriver ? 'Editar Conductor' : 'Habilitar Conductor (Res. SRT 960/15)'}
                </h3>
                <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre Completo (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Apellido y Nombre"
                      value={driverForm.fullName}
                      onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">CUIL (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="20-XXXXXXXX-X"
                      value={driverForm.cuil}
                      onChange={(e) => setDriverForm({ ...driverForm, cuil: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">DNI</label>
                    <input
                      type="text"
                      value={driverForm.dni}
                      onChange={(e) => setDriverForm({ ...driverForm, dni: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Horas Curso (min 10)</label>
                    <input
                      type="number"
                      value={driverForm.courseHours}
                      onChange={(e) => setDriverForm({ ...driverForm, courseHours: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Apto Médico</label>
                    <select
                      value={driverForm.medicalFitStatus}
                      onChange={(e) => setDriverForm({ ...driverForm, medicalFitStatus: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      <option value="apto">Apto Completo</option>
                      <option value="apto_con_restriccion">Apto con Restricción (Lentes)</option>
                      <option value="no_apto">No Apto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Emisión</label>
                    <input
                      type="date"
                      value={driverForm.issueDate}
                      onChange={(e) => setDriverForm({ ...driverForm, issueDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Vencimiento (1 Año)</label>
                    <input
                      type="date"
                      value={driverForm.expiryDate}
                      onChange={(e) => setDriverForm({ ...driverForm, expiryDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Entidad Capacitadora / Certificado</label>
                  <input
                    type="text"
                    value={driverForm.courseEntity}
                    onChange={(e) => setDriverForm({ ...driverForm, courseEntity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowDriverModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Guardar Conductor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHECKLIST PRE-OPERACIONAL TÁCTIL */}
        {showCheckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 my-8 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    Checklist Pre-operacional Diario (Res. SRT 960/15 Anexo III)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control obligatorio previo al turno. Marque conforme o detecte desvíos.
                  </p>
                </div>
                <button onClick={() => setShowCheckModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de equipo y conductor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Autoelevador (*)</label>
                  <select
                    value={selectedVehicleForCheck}
                    onChange={(e) => {
                      setSelectedVehicleForCheck(e.target.value);
                      const v = vehicles.find(x => x.id === e.target.value);
                      if (v) setCheckHours(v.currentHours);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.internalCode} - {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Conductor (*)</label>
                  <select
                    value={selectedDriverForCheck}
                    onChange={(e) => setSelectedDriverForCheck(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Turno</label>
                    <select
                      value={checkShift}
                      onChange={(e) => setCheckShift(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      <option value="manana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Horas Motor</label>
                    <input
                      type="number"
                      value={checkHours}
                      onChange={(e) => setCheckHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Lista táctil de los 15 ítems */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {DAILY_INSPECTION_ITEMS.map((item, idx) => {
                  const state = checkResponses[item.id] || 'conforme';
                  const isFail = state === 'no_conforme';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isFail
                          ? 'border-red-400 bg-red-50/40 dark:bg-red-950/30 dark:border-red-800'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-400 text-[10px]">#{idx + 1}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                          {item.isCritical && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                              Crítico
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{item.description}</p>
                      </div>

                      {/* Botones selectores directos */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item.id, 'conforme')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                            state === 'conforme'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Conforme
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item.id, 'no_conforme')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                            state === 'no_conforme'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          No Conforme
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item.id, 'no_aplica')}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                            state === 'no_aplica'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Observaciones adicionales del turno / hallazgos:
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle cualquier desvío, ruido anómalo o situación preventiva..."
                  value={checkObservations}
                  onChange={(e) => setCheckObservations(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyCheck}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                >
                  Finalizar y Guardar Checklist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MANTENIMIENTO PREVENTIVO */}
        {showMaintenanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 my-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  Registrar Servicio Técnico / Mantenimiento
                </h3>
                <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMaintenance} className="space-y-3 text-xs">
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

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Guardar Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VER CÓDIGO QR DEL EQUIPO */}
        {qrModalVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Rótulo Digital QR</span>
                <button onClick={() => setQrModalVehicle(null)} className="text-slate-400 hover:text-slate-600">
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
