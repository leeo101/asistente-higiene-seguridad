import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes, Plus, Search, Calendar, Download, Trash2,
  AlertTriangle, CheckCircle2, ShieldAlert,
  Edit2, Eye, FileSpreadsheet,
  AlertOctagon, Check, Layers, Sliders, ShieldCheck,
  Building, Wrench, Ban, Printer
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import toast from 'react-hot-toast';
import {
  RackSystem,
  RackInspectionReport,
  RackDamageItem,
  RackType,
  RackRiskLevel,
  RACK_TYPE_LABELS,
  RACK_RISK_INFO,
  IRAM_38500_LIMITS,
  DEFAULT_RACKS,
  DEFAULT_RACK_INSPECTIONS
} from '../data/rackInspectionData';
import {
  generateRackTechnicalReportPdf,
  generateRackLockoutTagPdf
} from '../utils/rackInspectionPdfGenerator';

const STORAGE_RACKS_KEY = 'hys_rack_systems_data';
const STORAGE_INSPECTIONS_KEY = 'hys_rack_inspections_data';

export default function RackInspectionManager(): React.ReactElement | null {
  const { activeCompany } = useCompany();

  // Tabs principales
  const [activeTab, setActiveTab] = useState<'racks' | 'inspections' | 'criteria'>('racks');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Estados de datos
  const [racks, setRacks] = useState<RackSystem[]>([]);
  const [inspections, setInspections] = useState<RackInspectionReport[]>([]);

  // Modales
  const [showRackModal, setShowRackModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInspectionDetailModal, setShowInspectionDetailModal] = useState(false);
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<RackInspectionReport | null>(null);
  const [editingRack, setEditingRack] = useState<RackSystem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ type: 'rack' | 'inspection'; id: string } | null>(null);

  // Formulario de Rack
  const [rackForm, setRackForm] = useState<Partial<RackSystem>>({
    rackCode: 'RACK-04',
    warehouseSector: 'Nave Central - Pasillo 04',
    rackType: 'selectivo',
    manufacturer: 'Mecalux',
    installationYear: new Date().getFullYear(),
    totalBays: 6,
    totalLevels: 4,
    maxBayLoadKg: 12000,
    maxLevelLoadKg: 2000,
    lastInspectionDate: new Date().toISOString().split('T')[0],
    nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currentStatus: 'conforme'
  });

  // Formulario de Inspección
  const [inspectionForm, setInspectionForm] = useState<Partial<RackInspectionReport>>({
    rackId: '',
    rackCode: '',
    warehouseSector: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: 'Lic. en Higiene y Seguridad',
    inspectorRegistration: 'Mat. HyS Profesional',
    overallResult: 'conforme',
    generalChecks: {
      loadPlatesPresent: true,
      safetyPinsPresent: true,
      groundAnchorsSecured: true,
      columnProtectorsPresent: true,
      verticalityCompliant: true,
      clearAisles: true,
      palletConditionGood: true
    },
    damages: [],
    conclusions: 'La estantería inspeccionada cumple satisfactoriamente con los parámetros de la Norma IRAM 38500. Sin deformaciones de riesgo.',
    actionPlan: 'Continuar con las inspecciones periódicas anuales y chequeos visuales semanales por el personal de depósito.',
    immediateUnloadRequired: false
  });

  // Estado temporal de daño a agregar en el modal de inspección
  const [newDamage, setNewDamage] = useState<Partial<RackDamageItem>>({
    bayNumber: 1,
    levelNumber: 1,
    component: 'puntal',
    componentLabel: 'Puntal en Plano de Pasillo',
    damageLevel: 'ambar',
    measuredDeformationMm: 4.5,
    allowableToleranceMm: 3.0,
    description: '',
    correctiveAction: 'Reparación o sustitución en menos de 4 semanas.',
    isResolved: false
  });

  // Calculadora interactiva de flechas IRAM (Pestaña Criterios)
  const [calcComponent, setCalcComponent] = useState<'puntal_trans' | 'puntal_long' | 'larguero'>('puntal_trans');
  const [calcMeasuredMm, setCalcMeasuredMm] = useState<number>(4.0);
  const [calcBeamLengthM, setCalcBeamLengthM] = useState<number>(2.7);

  // Carga inicial LocalStorage
  useEffect(() => {
    try {
      const storedRacks = localStorage.getItem(STORAGE_RACKS_KEY);
      if (storedRacks) {
        setRacks(JSON.parse(storedRacks));
      } else {
        setRacks(DEFAULT_RACKS);
        localStorage.setItem(STORAGE_RACKS_KEY, JSON.stringify(DEFAULT_RACKS));
      }

      const storedInspections = localStorage.getItem(STORAGE_INSPECTIONS_KEY);
      if (storedInspections) {
        setInspections(JSON.parse(storedInspections));
      } else {
        setInspections(DEFAULT_RACK_INSPECTIONS);
        localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(DEFAULT_RACK_INSPECTIONS));
      }
    } catch {
      setRacks(DEFAULT_RACKS);
      setInspections(DEFAULT_RACK_INSPECTIONS);
    }
  }, []);

  const saveRacks = (updated: RackSystem[]) => {
    setRacks(updated);
    localStorage.setItem(STORAGE_RACKS_KEY, JSON.stringify(updated));
  };

  const saveInspections = (updated: RackInspectionReport[]) => {
    setInspections(updated);
    localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(updated));
  };

  // KPIs
  const totalRacks = racks.length;
  const greenRacks = racks.filter(r => r.currentStatus === 'conforme').length;
  const amberRacks = racks.filter(r => r.currentStatus === 'riesgo_ambar').length;
  const redRacks = racks.filter(r => r.currentStatus === 'peligro_rojo').length;

  // Filtrado de racks
  const filteredRacks = useMemo(() => {
    return racks.filter(r => {
      const matchesSearch =
        r.rackCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.warehouseSector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.currentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [racks, searchTerm, filterStatus]);

  // Filtrado de inspecciones
  const filteredInspections = useMemo(() => {
    return inspections.filter(i => {
      const matchesSearch =
        i.rackCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.warehouseSector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'conforme' && i.overallResult === 'conforme') ||
        (filterStatus === 'riesgo_ambar' && i.overallResult === 'riesgo_ambar') ||
        (filterStatus === 'peligro_rojo' && i.overallResult === 'peligro_rojo_descarga_inmediata');
      return matchesSearch && matchesStatus;
    });
  }, [inspections, searchTerm, filterStatus]);

  // Manejo de Rack (Crear/Editar)
  const handleOpenCreateRackModal = () => {
    setEditingRack(null);
    setRackForm({
      rackCode: `RACK-${String(racks.length + 1).padStart(2, '0')}`,
      warehouseSector: 'Nave Central - Pasillo 01',
      rackType: 'selectivo',
      manufacturer: 'Mecalux / Estantería Metálica',
      installationYear: new Date().getFullYear(),
      totalBays: 6,
      totalLevels: 4,
      maxBayLoadKg: 12000,
      maxLevelLoadKg: 2000,
      lastInspectionDate: new Date().toISOString().split('T')[0],
      nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentStatus: 'conforme'
    });
    setShowRackModal(true);
  };

  const handleEditRack = (r: RackSystem) => {
    setEditingRack(r);
    setRackForm({ ...r });
    setShowRackModal(true);
  };

  const handleSaveRack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rackForm.rackCode || !rackForm.warehouseSector) {
      toast.error('Complete el código y sector del rack');
      return;
    }

    const typeKey = (rackForm.rackType || 'selectivo') as RackType;
    const typeLabel = RACK_TYPE_LABELS[typeKey] || 'Selectivo Convencional';

    if (editingRack) {
      const updated = racks.map(r =>
        r.id === editingRack.id
          ? ({
              ...r,
              ...rackForm,
              rackType: typeKey,
              rackTypeLabel: typeLabel
            } as RackSystem)
          : r
      );
      saveRacks(updated);
      toast.success('Rack actualizado correctamente');
    } else {
      const newRack: RackSystem = {
        ...(rackForm as RackSystem),
        id: `rack-${Date.now()}`,
        rackType: typeKey,
        rackTypeLabel: typeLabel,
        currentStatus: rackForm.currentStatus || 'conforme'
      };
      saveRacks([newRack, ...racks]);
      toast.success('Nuevo rack incorporado al inventario');
    }

    setShowRackModal(false);
  };

  // Manejo de Inspección
  const handleOpenCreateInspectionModal = (targetRack?: RackSystem) => {
    const defaultTarget = targetRack || racks[0];
    if (!defaultTarget) {
      toast.error('Debe registrar al menos una estantería antes de inspeccionar');
      return;
    }

    setInspectionForm({
      rackId: defaultTarget.id,
      rackCode: defaultTarget.rackCode,
      warehouseSector: defaultTarget.warehouseSector,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: 'Lic. en Higiene y Seguridad',
      inspectorRegistration: 'Mat. HyS Profesional',
      overallResult: 'conforme',
      generalChecks: {
        loadPlatesPresent: true,
        safetyPinsPresent: true,
        groundAnchorsSecured: true,
        columnProtectorsPresent: true,
        verticalityCompliant: true,
        clearAisles: true,
        palletConditionGood: true
      },
      damages: [],
      conclusions: 'La estructura responde a las exigencias normativas IRAM 38500 sin deformaciones críticas.',
      actionPlan: 'Mantener control visual preventivo y limpieza de pasillos.',
      immediateUnloadRequired: false
    });
    setShowInspectionModal(true);
  };

  // Agregar Daño al formulario de inspección
  const handleAddDamageToInspection = () => {
    if (!newDamage.description) {
      toast.error('Ingrese una breve descripción del daño observado');
      return;
    }

    const damageItem: RackDamageItem = {
      id: `dmg-${Date.now()}`,
      bayNumber: Number(newDamage.bayNumber) || 1,
      levelNumber: Number(newDamage.levelNumber) || 0,
      component: newDamage.component || 'puntal',
      componentLabel: newDamage.componentLabel || 'Puntal de Bastidor',
      damageLevel: newDamage.damageLevel || 'ambar',
      measuredDeformationMm: Number(newDamage.measuredDeformationMm) || 0,
      allowableToleranceMm: Number(newDamage.allowableToleranceMm) || 3.0,
      description: newDamage.description || '',
      correctiveAction: newDamage.correctiveAction || 'Reparar según norma.',
      isResolved: false
    };

    const updatedDamages = [...(inspectionForm.damages || []), damageItem];

    // Reevaluación automática de resultado global según daños
    const hasRed = updatedDamages.some(d => d.damageLevel === 'rojo');
    const hasAmber = updatedDamages.some(d => d.damageLevel === 'ambar');

    const newOverall = hasRed
      ? 'peligro_rojo_descarga_inmediata'
      : hasAmber
      ? 'riesgo_ambar'
      : 'conforme';

    setInspectionForm({
      ...inspectionForm,
      damages: updatedDamages,
      overallResult: newOverall,
      immediateUnloadRequired: hasRed,
      conclusions: hasRed
        ? 'ALTO RIESGO DE COLAPSO ESTRUCTURAL (Semáforo ROJO). Se constata daño severo que exige descarga inmediata de vanos afectados conforme a Norma IRAM 38500.'
        : hasAmber
        ? 'Estantería en Nivel Ámbar. Deformación superior a tolerancia sin colapso inminente. Prohibida la recarga tras retirar pallets.'
        : inspectionForm.conclusions
    });

    setNewDamage({
      bayNumber: 1,
      levelNumber: 1,
      component: 'puntal',
      componentLabel: 'Puntal de Bastidor',
      damageLevel: 'ambar',
      measuredDeformationMm: 4.5,
      allowableToleranceMm: 3.0,
      description: '',
      correctiveAction: 'Reparación o sustitución antes de 4 semanas.',
      isResolved: false
    });

    toast.success('Daño clasificado y añadido a la matriz de inspección');
  };

  const handleRemoveDamageFromInspection = (id: string) => {
    const updatedDamages = (inspectionForm.damages || []).filter(d => d.id !== id);
    const hasRed = updatedDamages.some(d => d.damageLevel === 'rojo');
    const hasAmber = updatedDamages.some(d => d.damageLevel === 'ambar');

    const newOverall = hasRed
      ? 'peligro_rojo_descarga_inmediata'
      : hasAmber
      ? 'riesgo_ambar'
      : 'conforme';

    setInspectionForm({
      ...inspectionForm,
      damages: updatedDamages,
      overallResult: newOverall,
      immediateUnloadRequired: hasRed
    });
  };

  // Guardar Inspección
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.rackId || !inspectionForm.inspectorName) {
      toast.error('Complete el inspector y seleccione el rack inspeccionado');
      return;
    }

    const newReport: RackInspectionReport = {
      ...(inspectionForm as RackInspectionReport),
      id: `insp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    saveInspections([newReport, ...inspections]);

    // Actualizar también el status del Rack en la tabla de racks
    const newRackStatus =
      newReport.overallResult === 'peligro_rojo_descarga_inmediata'
        ? 'peligro_rojo'
        : newReport.overallResult === 'riesgo_ambar'
        ? 'riesgo_ambar'
        : 'conforme';

    const updatedRacks = racks.map(r =>
      r.id === newReport.rackId
        ? {
            ...r,
            currentStatus: newRackStatus as any,
            lastInspectionDate: newReport.inspectionDate,
            nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        : r
    );
    saveRacks(updatedRacks);

    setShowInspectionModal(false);
    toast.success('Protocolo de inspección IRAM 38500 guardado exitosamente');
  };

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;

    if (confirmDeleteId.type === 'rack') {
      const updated = racks.filter(r => r.id !== confirmDeleteId.id);
      saveRacks(updated);
      toast.success('Estantería eliminada del inventario');
    } else {
      const updated = inspections.filter(i => i.id !== confirmDeleteId.id);
      saveInspections(updated);
      toast.success('Protocolo de inspección eliminado');
    }

    setConfirmDeleteId(null);
  };

  // Generación de PDFs
  const handleDownloadTechnicalReport = (insp: RackInspectionReport) => {
    const rack = racks.find(r => r.id === insp.rackId);
    const companyName = activeCompany?.name || 'Establecimiento Logístico S.A.';
    const companyCuit = activeCompany?.cuit || '30-71234567-8';
    try {
      generateRackTechnicalReportPdf(insp, rack, companyName, companyCuit);
      toast.success('Informe técnico pericial en PDF generado');
    } catch (e) {
      console.error('Error generando PDF de Rack:', e);
      toast.error('No se pudo generar el documento');
    }
  };

  const handleDownloadLockoutTag = (insp: RackInspectionReport) => {
    const rack = racks.find(r => r.id === insp.rackId);
    const companyName = activeCompany?.name || 'Establecimiento Logístico S.A.';
    try {
      generateRackLockoutTagPdf(insp, rack, companyName);
      toast.success('Cartel A4 de Bloqueo/Habilitación generado');
    } catch (e) {
      console.error('Error generando Cartel de Rack:', e);
      toast.error('No se pudo generar el cartel');
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (racks.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Código', 'Sector', 'Tipo', 'Fabricante', 'Año', 'Vanos', 'Niveles', 'Carga Nivel (Kg)', 'Carga Vano (Kg)', 'Estado'];
    const rows = racks.map(r => [
      r.rackCode,
      `"${r.warehouseSector}"`,
      r.rackTypeLabel,
      r.manufacturer,
      r.installationYear,
      r.totalBays,
      r.totalLevels,
      r.maxLevelLoadKg,
      r.maxBayLoadKg,
      r.currentStatus
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventario_Racks_IRAM38500_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Inventario de estanterías descargado en CSV');
  };

  // Cálculo en vivo de la calculadora IRAM
  const calcResult = useMemo(() => {
    if (calcComponent === 'puntal_trans') {
      const tol = IRAM_38500_LIMITS.puntalLongitudinal.amberThresholdMm; // 3mm
      const red = IRAM_38500_LIMITS.puntalLongitudinal.redThresholdMm; // 6mm
      if (calcMeasuredMm >= red) {
        return { level: 'rojo', label: 'NIVEL ROJO (Peligro Crítico)', tol, text: 'Deformación crítica. Descarga inmediata obligatoria del vano.' };
      } else if (calcMeasuredMm > tol) {
        return { level: 'ambar', label: 'NIVEL ÁMBAR (Reparar < 4 sem)', tol, text: 'Supera tolerancia admisible. Prohibido volver a cargar al retirar pallet.' };
      }
      return { level: 'verde', label: 'NIVEL VERDE (Vigilancia)', tol, text: 'Dentro de la tolerancia admisible de 3.0 mm según IRAM 38500.' };
    } else if (calcComponent === 'puntal_long') {
      const tol = IRAM_38500_LIMITS.puntalTransversal.amberThresholdMm; // 5mm
      const red = IRAM_38500_LIMITS.puntalTransversal.redThresholdMm; // 10mm
      if (calcMeasuredMm >= red) {
        return { level: 'rojo', label: 'NIVEL ROJO (Peligro Crítico)', tol, text: 'Deformación crítica en plano del pasillo. Descarga inmediata.' };
      } else if (calcMeasuredMm > tol) {
        return { level: 'ambar', label: 'NIVEL ÁMBAR (Reparar < 4 sem)', tol, text: 'Supera tolerancia admisible de 5.0 mm. Reparación obligatoria.' };
      }
      return { level: 'verde', label: 'NIVEL VERDE (Vigilancia)', tol, text: 'Dentro de la tolerancia admisible de 5.0 mm según IRAM 38500.' };
    } else {
      // Larguero: L / 200
      const tol = (calcBeamLengthM * 1000) / 200;
      if (calcMeasuredMm > tol * 1.5) {
        return { level: 'rojo', label: 'NIVEL ROJO (Flecha Excesiva)', tol: Number(tol.toFixed(1)), text: 'Flecha supera ampliamente L/200. Riesgo de flexión irreversible o desenganche.' };
      } else if (calcMeasuredMm > tol) {
        return { level: 'ambar', label: 'NIVEL ÁMBAR (Flecha Superior)', tol: Number(tol.toFixed(1)), text: `Supera la flecha elástica admisible de ${tol.toFixed(1)} mm (L/200). Reducir carga.` };
      }
      return { level: 'verde', label: 'NIVEL VERDE (Conforme)', tol: Number(tol.toFixed(1)), text: `Flecha dentro del límite elástico admisible L/200 (${tol.toFixed(1)} mm).` };
    }
  }, [calcComponent, calcMeasuredMm, calcBeamLengthM]);

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Encabezado Premium */}
        <PremiumHeader
          title="Inspección de Racks y Estanterías Metálicas"
          subtitle="Auditoría pericial y evaluación de deformaciones estructurales bajo Norma IRAM 38500 y UNE-EN 15635: clasificación de daños (Verde/Ámbar/Rojo), anclajes y cartelería oficial."
          badge="IRAM 38500 / EN 15635"
          icon={<Boxes className="w-7 h-7 text-amber-400" />}
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleOpenCreateInspectionModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Inspección
            </button>
            <button
              onClick={handleOpenCreateRackModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Rack
            </button>
          </div>
        </PremiumHeader>

        {/* Tarjetas KPI de Semáforo IRAM 38500 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Estanterías</p>
              <p className="text-2xl font-bold text-white mt-1">{totalRacks}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Racks y naves inventariados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Semáforo Verde</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{greenRacks}</p>
              <p className="text-[11px] text-emerald-500/80 mt-0.5">Operativos y Conformes</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Semáforo Ámbar</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{amberRacks}</p>
              <p className="text-[11px] text-amber-500/80 mt-0.5">Reparación requerida &lt; 4 sem</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Semáforo Rojo (Peligro)</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{redRacks}</p>
              <p className="text-[11px] text-rose-500/80 mt-0.5">Descarga Inmediata Obligatoria</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('racks')}
            className={`pb-3 transition-colors relative flex items-center gap-2 ${
              activeTab === 'racks' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Inventario de Racks ({racks.length})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`pb-3 transition-colors relative flex items-center gap-2 ${
              activeTab === 'inspections' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Protocolos de Inspección IRAM ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`pb-3 transition-colors relative flex items-center gap-2 ${
              activeTab === 'criteria' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Calculadora de Deformaciones IRAM 38500
          </button>
        </div>

        {/* PESTAÑA 1: INVENTARIO DE RACKS */}
        {activeTab === 'racks' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar rack por código, pasillo o fabricante..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  aria-label="Filtrar por estado del semáforo"
                  className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos los Semáforos</option>
                  <option value="conforme">Verde (Conforme)</option>
                  <option value="riesgo_ambar">Ámbar (Reparación)</option>
                  <option value="peligro_rojo">Rojo (Descarga)</option>
                </select>
              </div>
            </div>

            {filteredRacks.length === 0 ? (
              <EmptyStateIllustrated
                title="No se encontraron estanterías"
                description="Incorpore su primer rack para iniciar el seguimiento estructural IRAM 38500."
                actionLabel="Registrar Rack"
                onAction={handleOpenCreateRackModal}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRacks.map(rack => {
                  const isRed = rack.currentStatus === 'peligro_rojo';
                  const isAmber = rack.currentStatus === 'riesgo_ambar';

                  return (
                    <div
                      key={rack.id}
                      className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                    >
                      <div>
                        {/* Header tarjeta */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-sm font-black px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {rack.rackCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isRed
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                : isAmber
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {isRed ? 'Semáforo Rojo' : isAmber ? 'Semáforo Ámbar' : 'Conforme'}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base mb-1">
                          {rack.warehouseSector}
                        </h3>

                        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rack.rackTypeLabel} | {rack.manufacturer} ({rack.installationYear})</span>
                        </p>

                        {/* Ficha técnica de carga */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Carga Máx / Nivel</span>
                            <span className="font-bold text-slate-200">
                              {rack.maxLevelLoadKg.toLocaleString('es-AR')} Kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Carga Máx / Vano</span>
                            <span className="font-bold text-slate-200">
                              {rack.maxBayLoadKg.toLocaleString('es-AR')} Kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Módulos (Vanos)</span>
                            <span className="font-bold text-slate-200">{rack.totalBays} vanos</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Niveles de Altura</span>
                            <span className="font-bold text-slate-200">{rack.totalLevels} niveles</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between mb-4 px-1">
                          <span>Última Insp: {rack.lastInspectionDate}</span>
                          <span className={new Date(rack.nextInspectionDate) < new Date() ? 'text-rose-400 font-semibold' : ''}>
                            Vence: {rack.nextInspectionDate}
                          </span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenCreateInspectionModal(rack)}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Inspeccionar
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditRack(rack)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Editar Datos del Rack"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId({ type: 'rack', id: rack.id })}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Eliminar Rack"
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

        {/* PESTAÑA 2: PROTOCOLOS DE INSPECCIÓN */}
        {activeTab === 'inspections' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar acta por rack o inspector..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => handleOpenCreateInspectionModal()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Registrar Nueva Inspección
              </button>
            </div>

            {filteredInspections.length === 0 ? (
              <EmptyStateIllustrated
                title="Sin protocolos de inspección"
                description="No hay inspecciones que coincidan con la búsqueda. Realice la primera auditoría IRAM 38500."
                actionLabel="Nueva Inspección"
                onAction={() => handleOpenCreateInspectionModal()}
              />
            ) : (
              <div className="space-y-3">
                {filteredInspections.map(insp => {
                  const isRed = insp.overallResult === 'peligro_rojo_descarga_inmediata';
                  const isAmber = insp.overallResult === 'riesgo_ambar';

                  return (
                    <div
                      key={insp.id}
                      className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {insp.rackCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isRed
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : isAmber
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {isRed ? 'Peligro Rojo (Descarga)' : isAmber ? 'Riesgo Ámbar' : 'Conforme'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {insp.inspectionDate}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm">
                          {insp.warehouseSector}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          Inspector: <strong className="text-slate-300">{insp.inspectorName}</strong> ({insp.inspectorRegistration})
                          {insp.damages.length > 0 && ` — ${insp.damages.length} daño(s) clasificado(s)`}
                        </p>
                      </div>

                      {/* Botones de acción del protocolo */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedInspectionForDetail(insp);
                            setShowInspectionDetailModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalle
                        </button>
                        <button
                          onClick={() => handleDownloadTechnicalReport(insp)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Informe PDF
                        </button>
                        <button
                          onClick={() => handleDownloadLockoutTag(insp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                            isRed
                              ? 'bg-rose-600 text-white hover:bg-rose-500'
                              : isAmber
                              ? 'bg-amber-600 text-slate-950 hover:bg-amber-500'
                              : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
                          }`}
                          title="Descargar Cartel A4 para colgar en el rack"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cartel A4
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId({ type: 'inspection', id: insp.id })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: CALCULADORA Y CRITERIOS TÉCNICOS IRAM 38500 */}
        {activeTab === 'criteria' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calculadora en vivo */}
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Calculador de Tolerancias</h3>
              </div>
              <p className="text-xs text-slate-400">
                Ingrese la deformación medida con regla de 1 metro para clasificar el semáforo normativo automáticamente.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Componente Estructural</label>
                <select
                  value={calcComponent}
                  onChange={e => setCalcComponent(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="puntal_trans">Puntal: Plano del Bastidor (Transversal / Fondo)</option>
                  <option value="puntal_long">Puntal: Plano del Pasillo (Longitudinal / Frente)</option>
                  <option value="larguero">Larguero: Flecha Vertical bajo Carga (L/200)</option>
                </select>
              </div>

              {calcComponent === 'larguero' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Luz del Larguero: <strong className="text-amber-400">{calcBeamLengthM} metros</strong>
                  </label>
                  <input
                    type="range"
                    min="1.5"
                    max="4.0"
                    step="0.1"
                    value={calcBeamLengthM}
                    onChange={e => setCalcBeamLengthM(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1.5m</span>
                    <span>2.7m (Típico 3 pallets)</span>
                    <span>4.0m</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Flecha / Deformación Medida: <strong className="text-amber-400">{calcMeasuredMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={calcMeasuredMm}
                  onChange={e => setCalcMeasuredMm(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 mm</span>
                  <span>10 mm</span>
                  <span>25 mm</span>
                </div>
              </div>

              {/* Dictamen Resultante */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  calcResult.level === 'rojo'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : calcResult.level === 'ambar'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider">{calcResult.label}</span>
                  <span className="text-[11px] font-semibold">Tolerancia: {calcResult.tol} mm</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{calcResult.text}</p>
              </div>
            </div>

            {/* Cuadro de Normas y Criterios Oficiales IRAM 38500 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Criterios de Tolerancia y Desplome IRAM 38500 / EN 15635
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-amber-400">Puntal en Plano del Bastidor (Fondo)</h4>
                    <p className="text-slate-300">
                      Con una regla de acero de 1.000 mm apoyada en el puntal, la flecha máxima admisible en el plano de la celosía es de <strong>3,0 mm</strong>.
                    </p>
                    <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      • <strong>&gt; 3,0 mm y &lt; 6,0 mm:</strong> Semáforo Ámbar.<br />
                      • <strong>&gt; 6,0 mm:</strong> Semáforo Rojo (descarga inmediata).
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-amber-400">Puntal en Plano del Pasillo (Frente)</h4>
                    <p className="text-slate-300">
                      Con una regla de 1.000 mm en la cara frontal expuesta a las uñas del autoelevador, la flecha máxima admisible es de <strong>5,0 mm</strong>.
                    </p>
                    <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      • <strong>&gt; 5,0 mm y &lt; 10,0 mm:</strong> Semáforo Ámbar.<br />
                      • <strong>&gt; 10,0 mm:</strong> Semáforo Rojo (descarga inmediata).
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-emerald-400">Largueros (Flecha Vertical)</h4>
                    <p className="text-slate-300">
                      Bajo carga máxima nominal, la flecha elástica no debe superar <strong>L / 200</strong>.
                    </p>
                    <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      Ejemplo: Para un vano estándar de 2.700 mm (2,7 m), la flecha vertical no debe exceder los <strong>13,5 mm</strong>.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-indigo-400">Verticalidad y Desplome</h4>
                    <p className="text-slate-300">
                      El desaplomo de los bastidores no debe superar <strong>H / 200</strong> medido desde la solera hasta la coronación.
                    </p>
                    <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      Ejemplo: Para un rack de 8 metros de altura, la desviación máxima de la vertical es de <strong>40 mm</strong>.
                    </div>
                  </div>
                </div>

                {/* Explicación de las 3 fases del semáforo */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Significado Oficial de los Niveles de Daño
                  </h4>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <strong className="text-emerald-400 block mb-0.5">{RACK_RISK_INFO.verde.title}</strong>
                      <span className="text-slate-300">{RACK_RISK_INFO.verde.actionDescription}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <strong className="text-amber-400 block mb-0.5">{RACK_RISK_INFO.ambar.title}</strong>
                      <span className="text-slate-300">{RACK_RISK_INFO.ambar.actionDescription}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                      <strong className="text-rose-400 block mb-0.5">{RACK_RISK_INFO.rojo.title}</strong>
                      <span className="text-slate-300">{RACK_RISK_INFO.rojo.actionDescription}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: NUEVO / EDITAR RACK */}
        {showRackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {editingRack ? 'Editar Estantería / Rack' : 'Nueva Estantería Industrial'}
                    </h3>
                    <p className="text-xs text-slate-400">Registro técnico para control IRAM 38500</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRackModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRack} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Código Identificatorio *</label>
                    <input
                      type="text"
                      required
                      value={rackForm.rackCode || ''}
                      onChange={e => setRackForm({ ...rackForm, rackCode: e.target.value })}
                      placeholder="Ej: RACK-A01"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Estantería</label>
                    <select
                      value={rackForm.rackType || 'selectivo'}
                      onChange={e => setRackForm({ ...rackForm, rackType: e.target.value as RackType })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {Object.entries(RACK_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sector y Pasillo de Almacén *</label>
                  <input
                    type="text"
                    required
                    value={rackForm.warehouseSector || ''}
                    onChange={e => setRackForm({ ...rackForm, warehouseSector: e.target.value })}
                    placeholder="Ej: Nave Central - Pasillo 03 (Cabecera Logística)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fabricante del Sistema</label>
                    <input
                      type="text"
                      value={rackForm.manufacturer || ''}
                      onChange={e => setRackForm({ ...rackForm, manufacturer: e.target.value })}
                      placeholder="Ej: Mecalux / Sotic / AR Racking"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Año de Montaje</label>
                    <input
                      type="number"
                      value={rackForm.installationYear || new Date().getFullYear()}
                      onChange={e => setRackForm({ ...rackForm, installationYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cantidad Vanos</label>
                    <input
                      type="number"
                      value={rackForm.totalBays || 6}
                      onChange={e => setRackForm({ ...rackForm, totalBays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Niveles Altura</label>
                    <input
                      type="number"
                      value={rackForm.totalLevels || 4}
                      onChange={e => setRackForm({ ...rackForm, totalLevels: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Carga Nivel (Kg)</label>
                    <input
                      type="number"
                      value={rackForm.maxLevelLoadKg || 2000}
                      onChange={e => setRackForm({ ...rackForm, maxLevelLoadKg: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Carga Vano (Kg)</label>
                    <input
                      type="number"
                      value={rackForm.maxBayLoadKg || 12000}
                      onChange={e => setRackForm({ ...rackForm, maxBayLoadKg: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRackModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-600/30"
                  >
                    {editingRack ? 'Guardar Cambios' : 'Registrar Estantería'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: NUEVA INSPECCIÓN IRAM 38500 */}
        {showInspectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Protocolo de Inspección IRAM 38500 / EN 15635</h3>
                    <p className="text-xs text-slate-400">Relevamiento pericial y categorización de semáforo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveInspection} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Rack e Inspector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Estantería a Inspeccionar *</label>
                    <select
                      value={inspectionForm.rackId || ''}
                      onChange={e => {
                        const target = racks.find(r => r.id === e.target.value);
                        if (target) {
                          setInspectionForm({
                            ...inspectionForm,
                            rackId: target.id,
                            rackCode: target.rackCode,
                            warehouseSector: target.warehouseSector
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {racks.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.rackCode} — {r.warehouseSector}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Inspección</label>
                    <input
                      type="date"
                      value={inspectionForm.inspectionDate || ''}
                      onChange={e => setInspectionForm({ ...inspectionForm, inspectionDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Inspector / Profesional *</label>
                    <input
                      type="text"
                      required
                      value={inspectionForm.inspectorName || ''}
                      onChange={e => setInspectionForm({ ...inspectionForm, inspectorName: e.target.value })}
                      placeholder="Lic. / Ing. Especialista"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 1. Checklist de 7 puntos */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    1. Verificación de Dispositivos y Condiciones Generales
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { key: 'loadPlatesPresent', label: 'Placas de carga admisible visibles en cabeceras' },
                      { key: 'safetyPinsPresent', label: '100% de pasadores/clavijas de seguridad colocados' },
                      { key: 'groundAnchorsSecured', label: 'Anclajes a solera firmes y sin roturas' },
                      { key: 'columnProtectorsPresent', label: 'Protectores de puntal en esquinas y túneles' },
                      { key: 'verticalityCompliant', label: 'Verticalidad y plomo dentro de tolerancia (H/200)' },
                      { key: 'clearAisles', label: 'Pasillos libres de obstáculos y acopios en suelo' },
                      { key: 'palletConditionGood', label: 'Pallets utilizados en buen estado (sin roturas)' }
                    ].map(item => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={!!(inspectionForm.generalChecks as any)?.[item.key]}
                          onChange={e =>
                            setInspectionForm({
                              ...inspectionForm,
                              generalChecks: {
                                ...inspectionForm.generalChecks!,
                                [item.key]: e.target.checked
                              }
                            })
                          }
                          className="rounded text-amber-500 focus:ring-0 bg-slate-800 border-slate-700"
                        />
                        <span className="text-slate-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Matriz de Daños y Clasificación de Semáforo */}
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      2. Registro de Deformaciones y Clasificación por Semáforo
                    </h4>
                    <span className="text-xs text-slate-400">
                      {inspectionForm.damages?.length || 0} daño(s) cargado(s)
                    </span>
                  </div>

                  {/* Formulario para añadir daño */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Vano #</label>
                        <input
                          type="number"
                          value={newDamage.bayNumber}
                          onChange={e => setNewDamage({ ...newDamage, bayNumber: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Nivel #</label>
                        <input
                          type="number"
                          value={newDamage.levelNumber}
                          onChange={e => setNewDamage({ ...newDamage, levelNumber: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Elemento</label>
                        <select
                          value={newDamage.component}
                          onChange={e => {
                            const val = e.target.value as any;
                            const label =
                              val === 'puntal'
                                ? 'Puntal de Bastidor'
                                : val === 'larguero'
                                ? 'Larguero'
                                : val === 'diagonal_arriostramiento'
                                ? 'Diagonal de Bastidor'
                                : val === 'placa_base'
                                ? 'Placa Base / Anclaje'
                                : 'Clavija de Seguridad';
                            setNewDamage({ ...newDamage, component: val, componentLabel: label });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="puntal">Puntal</option>
                          <option value="larguero">Larguero</option>
                          <option value="diagonal_arriostramiento">Diagonal Bastidor</option>
                          <option value="placa_base">Placa Base</option>
                          <option value="clavija_seguridad">Clavija Conector</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Semáforo</label>
                        <select
                          value={newDamage.damageLevel}
                          onChange={e => setNewDamage({ ...newDamage, damageLevel: e.target.value as RackRiskLevel })}
                          className={`w-full px-2.5 py-1.5 border rounded-lg font-bold ${
                            newDamage.damageLevel === 'rojo'
                              ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                              : newDamage.damageLevel === 'ambar'
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          }`}
                        >
                          <option value="verde">Verde (Vigilancia)</option>
                          <option value="ambar">Ámbar (Reparar)</option>
                          <option value="rojo">Rojo (Descarga Inmediata)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Flecha / Deformación Medida (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newDamage.measuredDeformationMm}
                          onChange={e => setNewDamage({ ...newDamage, measuredDeformationMm: Number(e.target.value) })}
                          placeholder="Ej: 5.5"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Descripción del Impacto / Daño</label>
                        <input
                          type="text"
                          value={newDamage.description}
                          onChange={e => setNewDamage({ ...newDamage, description: e.target.value })}
                          placeholder="Ej: Abolladura a 50cm de solera por impacto de uña"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <input
                        type="text"
                        value={newDamage.correctiveAction}
                        onChange={e => setNewDamage({ ...newDamage, correctiveAction: e.target.value })}
                        placeholder="Acción correctiva obligatoria..."
                        className="flex-1 mr-3 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddDamageToInspection}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all shrink-0"
                      >
                        + Añadir Daño
                      </button>
                    </div>
                  </div>

                  {/* Lista de daños cargados */}
                  {inspectionForm.damages && inspectionForm.damages.length > 0 && (
                    <div className="space-y-2">
                      {inspectionForm.damages.map(dmg => (
                        <div
                          key={dmg.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                dmg.damageLevel === 'rojo'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : dmg.damageLevel === 'ambar'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {dmg.damageLevel}
                            </span>
                            <span className="font-bold text-white">
                              Vano {dmg.bayNumber} / Niv {dmg.levelNumber} — {dmg.componentLabel}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({dmg.measuredDeformationMm} mm): {dmg.description}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDamageFromInspection(dmg.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Dictamen Global y Conclusiones */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      3. Dictamen Pericial Global
                    </h4>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl ${
                        inspectionForm.overallResult === 'peligro_rojo_descarga_inmediata'
                          ? 'bg-rose-600 text-white'
                          : inspectionForm.overallResult === 'riesgo_ambar'
                          ? 'bg-amber-600 text-slate-950'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {inspectionForm.overallResult === 'peligro_rojo_descarga_inmediata'
                        ? 'PELIGRO ROJO (DESCARGA INMEDIATA)'
                        : inspectionForm.overallResult === 'riesgo_ambar'
                        ? 'RIESGO ÁMBAR (REPARAR < 4 SEM)'
                        : 'CONFORME (OPERATIVO)'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Conclusiones del Inspector</label>
                    <textarea
                      rows={2}
                      value={inspectionForm.conclusions || ''}
                      onChange={e => setInspectionForm({ ...inspectionForm, conclusions: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Plan de Acción / Medidas Exigidas</label>
                    <textarea
                      rows={2}
                      value={inspectionForm.actionPlan || ''}
                      onChange={e => setInspectionForm({ ...inspectionForm, actionPlan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInspectionModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-600/30"
                  >
                    Guardar Protocolo IRAM 38500
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: DETALLE DE INSPECCIÓN */}
        {showInspectionDetailModal && selectedInspectionForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Acta IRAM 38500: {selectedInspectionForDetail.rackCode}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Fecha: {selectedInspectionForDetail.inspectionDate} | Inspector: {selectedInspectionForDetail.inspectorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadTechnicalReport(selectedInspectionForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={() => setShowInspectionDetailModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
                <div>
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider mb-2">Conclusiones Periciales</h5>
                  <p className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedInspectionForDetail.conclusions}
                  </p>
                </div>

                {selectedInspectionForDetail.actionPlan && (
                  <div>
                    <h5 className="font-bold text-amber-400 uppercase tracking-wider mb-2">Plan de Acción Exigido</h5>
                    <p className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line">
                      {selectedInspectionForDetail.actionPlan}
                    </p>
                  </div>
                )}

                <div>
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider mb-2">
                    Daños Estructurales Registrados ({selectedInspectionForDetail.damages.length})
                  </h5>
                  {selectedInspectionForDetail.damages.length === 0 ? (
                    <p className="text-emerald-400 italic">No se hallaron deformaciones mecánicas. Estantería conforme.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedInspectionForDetail.damages.map(d => (
                        <div key={d.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between font-bold text-white">
                            <span>Vano {d.bayNumber} / Nivel {d.levelNumber} — {d.componentLabel}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md uppercase ${
                                d.damageLevel === 'rojo'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : d.damageLevel === 'ambar'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              Semáforo {d.damageLevel}
                            </span>
                          </div>
                          <p className="text-slate-400">
                            <strong>Deformación:</strong> {d.measuredDeformationMm} mm (Tolerancia: {d.allowableToleranceMm} mm)
                          </p>
                          <p className="text-slate-300"><strong>Observación:</strong> {d.description}</p>
                          <p className="text-amber-400"><strong>Medida:</strong> {d.correctiveAction}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!confirmDeleteId}
          title={confirmDeleteId?.type === 'rack' ? '¿Eliminar Estantería?' : '¿Eliminar Protocolo?'}
          message="Esta acción no se puede deshacer. Los registros físicos y PDF emitidos conservarán su validez."
          confirmText="Eliminar Definitivamente"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDeleteId(null)}
          type="danger"
        />
      </div>
    </AnimatedPage>
  );
}
