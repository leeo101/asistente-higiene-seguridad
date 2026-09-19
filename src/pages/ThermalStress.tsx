import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calculator, Info, RefreshCw, Printer, Search, Settings2, CheckCircle2, 
  TriangleAlert, Share2, Save, ArrowLeft, ThermometerSun, Pencil, MapPin, 
  Trash2, QrCode, Plus, Download, Building2, Wrench, Shirt, Wind, Droplets,
  ShieldAlert, Clock, AlertCircle
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import ShareModal from '../components/ShareModal';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { DataTable } from '../components/DataTable';
import QRModal from '../components/QRModal';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import ThermalStressRegimenCalculator from '../components/ThermalStressRegimenCalculator';
import { 
  CLOTHING_CAV_OPTIONS, 
  evaluateFullThermalStressProtocol, 
  evaluateColdStressWindChill 
} from '../utils/srtProtocols';
import type { 
  MetabolicWorkload, 
  WorkRestCycle, 
  ThermalAssessmentProtocol,
  ThermalEvaluationMetrics
} from '../types/thermal';

const METABOLIC_PREFS: { id: MetabolicWorkload; label: string; watts: number; kcal: number }[] = [
  { id: 'liviano', label: 'Liviano (≤ 200 W / ≤ 172 kcal/h) — Sentado, trabajo fino en banco', watts: 175, kcal: 150 },
  { id: 'moderado', label: 'Moderado (200–350 W / 172–300 kcal/h) — De pie, caminar con carga ligera', watts: 275, kcal: 235 },
  { id: 'pesado', label: 'Pesado (350–500 W / 300–430 kcal/h) — Trabajo intenso, pico y pala', watts: 400, kcal: 345 },
  { id: 'muy_pesado', label: 'Muy Pesado (> 500 W / > 430 kcal/h) — Actividad física extrema', watts: 550, kcal: 470 }
];

export default function ThermalStress(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection, syncing } = useSync();
  const [currentEditItem, setCurrentEditItem] = useState(location.state?.editData || null);

  useDocumentTitle(currentEditItem ? 'Editar Protocolo de Estrés Térmico' : 'Protocolo Oficial Estrés Térmico — Res. 295/03 & SRT 30/23');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isFormVisible, setIsFormVisible] = useState(!!currentEditItem);
  const [selectedForPrint, setSelectedForPrint] = useState<any>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const h = JSON.parse(localStorage.getItem('thermal_history') || '[]');
        setHistory(h.sort((a: any, b: any) => (new Date(b.fecha || b.date) as any) - (new Date(a.fecha || a.date) as any)));
      } catch (err) {
        console.error('[ThermalStress] Error loading history:', err);
      }
    };
    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, [syncing]);

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('thermal_history', JSON.stringify(updated));
    syncCollection('thermal_history', updated);
    setDeleteTarget(null);
    toast.success('Evaluación eliminada correctamente.');
  };

  // Carga de metadatos de empresa de localStorage
  const getInitialCompanyDefaults = () => {
    try {
      const savedCompany = localStorage.getItem('companyData');
      const savedPersonal = localStorage.getItem('personalData');
      const comp = savedCompany ? JSON.parse(savedCompany) : {};
      const pers = savedPersonal ? JSON.parse(savedPersonal) : {};
      return {
        cuit: comp.cuit || pers.cuit || '',
        razonSocial: comp.name || comp.razonSocial || pers.company || '',
        direccion: comp.address || pers.address || '',
        localidad: comp.city || pers.city || 'Buenos Aires',
        art: comp.art || pers.art || 'Asociart ART',
        establecimiento: comp.branch || 'Planta Principal'
      };
    } catch {
      return { cuit: '', razonSocial: '', direccion: '', localidad: '', art: '', establecimiento: '' };
    }
  };

  const initialDefaults = getInitialCompanyDefaults();

  const [formData, setFormData] = useState<any>(() => {
    if (currentEditItem) {
      return {
        ...currentEditItem,
        cuit: currentEditItem.cuit || currentEditItem.empresaCuit || initialDefaults.cuit,
        razonSocial: currentEditItem.razonSocial || currentEditItem.empresa || initialDefaults.razonSocial,
        direccion: currentEditItem.direccion || initialDefaults.direccion,
        localidad: currentEditItem.localidad || initialDefaults.localidad,
        art: currentEditItem.art || initialDefaults.art,
        establecimiento: currentEditItem.establecimiento || initialDefaults.establecimiento,

        instMarca: currentEditItem.instrumento?.marca || currentEditItem.instMarca || 'Quest Technologies / 3M',
        instModelo: currentEditItem.instrumento?.modelo || currentEditItem.instModelo || 'QUESTemp° 34',
        instSerie: currentEditItem.instrumento?.numeroSerie || currentEditItem.instSerie || 'QT-34-8841',
        fechaCalibracion: currentEditItem.instrumento?.fechaCalibracionLaboratorio || currentEditItem.fechaCalibracion || '2025-06-15',
        verifPre: currentEditItem.instrumento?.verificacionInSituPre ?? currentEditItem.verifPre ?? 25.0,
        verifPost: currentEditItem.instrumento?.verificacionInSituPost ?? currentEditItem.verifPost ?? 25.1,

        cantTrabajadores: currentEditItem.trabajador?.cantTrabajadoresExpuestos || currentEditItem.cantTrabajadores || 1,
        indumentariaId: currentEditItem.trabajador?.indumentariaId || currentEditItem.indumentariaId || 'standard',
        cav: currentEditItem.trabajador?.cav ?? currentEditItem.cav ?? 0,

        evaluarFrio: currentEditItem.frio?.evaluarFrio ?? currentEditItem.evaluarFrio ?? false,
        tempAireSeco: currentEditItem.frio?.temperaturaAireSeco ?? currentEditItem.tempAireSeco ?? '',
        velocidadVientoKmH: currentEditItem.frio?.velocidadVientoKmH ?? currentEditItem.velocidadVientoKmH ?? '',

        operatorSignature: currentEditItem.operatorSignature || '',
        supervisorSignature: currentEditItem.supervisorSignature || currentEditItem.signature || '',
        signature: currentEditItem.signature || currentEditItem.supervisorSignature || '',
        showSignatures: currentEditItem.showSignatures || { operator: true, professional: true, supervisor: true }
      };
    }

    return {
      cuit: initialDefaults.cuit,
      razonSocial: initialDefaults.razonSocial,
      direccion: initialDefaults.direccion,
      localidad: initialDefaults.localidad,
      art: initialDefaults.art,
      establecimiento: initialDefaults.establecimiento,

      puesto: '',
      sector: '',
      tarea: '',
      fecha: new Date().toISOString().split('T')[0],
      cantTrabajadores: 1,

      // Instrumental
      instMarca: 'Quest Technologies / 3M',
      instModelo: 'QUESTemp° 34',
      instSerie: 'QT-34-8841',
      fechaCalibracion: '2025-06-15',
      verifPre: 25.0,
      verifPost: 25.1,

      // Mediciones ambientales
      cargaSolar: false,
      tbh: '24.5',
      tg: '31.0',
      tbs: '30.0',
      viento: '0.3',

      // Condiciones del trabajador
      aptaMedica: true,
      aclimatado: true,
      ritmo: 'moderado' as MetabolicWorkload,
      ciclo: 'continuo' as WorkRestCycle,
      indumentariaId: 'standard',
      cav: 0.0,

      // Estrés por Frío opcional
      evaluarFrio: false,
      tempAireSeco: '',
      velocidadVientoKmH: '',

      // Firmas
      operatorSignature: '',
      supervisorSignature: '',
      signature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    };
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setFormData((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      try {
        const parsed = JSON.parse(savedSigData);
        signature = parsed.signature || signature;
        stamp = parsed.stamp || null;
      } catch (e) {}
    }

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProfessional({
          name: data.name || '',
          license: data.license || '',
          signature: signature,
          stamp: stamp
        });
      } catch (e) {}
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [shareItem, setShareItem] = useState<any>(null);

  const handleInput = (field: string, value: any) => {
    setFormData((p: any) => {
      const updated = { ...p, [field]: value };
      if (field === 'indumentariaId') {
        const cloth = CLOTHING_CAV_OPTIONS.find(c => c.id === value);
        if (cloth) updated.cav = cloth.cav;
      }
      return updated;
    });
  };

  // Motor de cálculo unificado oficial Res. 295/03 y Res. SRT 30/2023
  const [evalResult, setEvalResult] = useState<ThermalEvaluationMetrics>(() => {
    return evaluateFullThermalStressProtocol({
      ambiental: {
        tbh: parseFloat(formData.tbh) || 0,
        tg: parseFloat(formData.tg) || 0,
        tbs: formData.cargaSolar ? (parseFloat(formData.tbs) || 0) : undefined,
        cargaSolar: formData.cargaSolar,
        velocidadViento: parseFloat(formData.viento) || 0
      },
      trabajador: {
        puesto: formData.puesto,
        sector: formData.sector,
        tarea: formData.tarea,
        ritmo: formData.ritmo,
        ciclo: formData.ciclo,
        indumentariaId: formData.indumentariaId,
        cav: parseFloat(formData.cav) || 0,
        aclimatado: formData.aclimatado,
        aptaMedica: formData.aptaMedica
      },
      instrumento: {
        marca: formData.instMarca,
        modelo: formData.instModelo,
        numeroSerie: formData.instSerie,
        fechaCalibracionLaboratorio: formData.fechaCalibracion
      }
    });
  });

  useEffect(() => {
    const res = evaluateFullThermalStressProtocol({
      ambiental: {
        tbh: parseFloat(formData.tbh) || 0,
        tg: parseFloat(formData.tg) || 0,
        tbs: formData.cargaSolar ? (parseFloat(formData.tbs) || 0) : undefined,
        cargaSolar: formData.cargaSolar,
        velocidadViento: parseFloat(formData.viento) || 0
      },
      trabajador: {
        puesto: formData.puesto,
        sector: formData.sector,
        tarea: formData.tarea,
        ritmo: formData.ritmo,
        ciclo: formData.ciclo,
        indumentariaId: formData.indumentariaId,
        cav: parseFloat(formData.cav) || 0,
        aclimatado: formData.aclimatado,
        aptaMedica: formData.aptaMedica
      },
      instrumento: {
        marca: formData.instMarca,
        modelo: formData.instModelo,
        numeroSerie: formData.instSerie,
        fechaCalibracionLaboratorio: formData.fechaCalibracion
      }
    });
    setEvalResult(res);
  }, [
    formData.tbh, formData.tg, formData.tbs, formData.cargaSolar, formData.viento,
    formData.ritmo, formData.ciclo, formData.indumentariaId, formData.cav,
    formData.aclimatado, formData.aptaMedica, formData.fechaCalibracion
  ]);

  const doSave = () => {
    if (!formData.puesto?.trim()) {
      toast.error('Debe indicar el nombre del puesto evaluado.');
      return;
    }
    if (!formData.tbh || !formData.tg) {
      toast.error('Faltan temperaturas ambientales (Tbh y Tg) para el cálculo.');
      return;
    }

    let coldData = undefined;
    if (formData.evaluarFrio && formData.tempAireSeco !== '') {
      coldData = evaluateColdStressWindChill(
        parseFloat(formData.tempAireSeco) || 0,
        parseFloat(formData.velocidadVientoKmH) || 0
      );
    }

    const report: ThermalAssessmentProtocol & Record<string, any> = {
      id: currentEditItem?.id || Date.now(),
      fecha: formData.fecha,
      normativa: 'Res. MTEySS 295/03 & Res. SRT 30/2023',
      cuit: formData.cuit,
      razonSocial: formData.razonSocial,
      direccion: formData.direccion,
      localidad: formData.localidad,
      art: formData.art,
      establecimiento: formData.establecimiento,

      instrumento: {
        marca: formData.instMarca,
        modelo: formData.instModelo,
        numeroSerie: formData.instSerie,
        fechaCalibracionLaboratorio: formData.fechaCalibracion,
        verificacionInSituPre: parseFloat(formData.verifPre) || undefined,
        verificacionInSituPost: parseFloat(formData.verifPost) || undefined,
        derivaCalibracionInSitu: Math.abs((parseFloat(formData.verifPost) || 0) - (parseFloat(formData.verifPre) || 0))
      },

      ambiental: {
        tbh: parseFloat(formData.tbh) || 0,
        tg: parseFloat(formData.tg) || 0,
        tbs: formData.cargaSolar ? (parseFloat(formData.tbs) || 0) : undefined,
        cargaSolar: formData.cargaSolar,
        velocidadViento: parseFloat(formData.viento) || 0
      },

      trabajador: {
        puesto: formData.puesto,
        sector: formData.sector,
        tarea: formData.tarea,
        ritmo: formData.ritmo,
        ciclo: formData.ciclo,
        indumentariaId: formData.indumentariaId,
        cav: parseFloat(formData.cav) || 0,
        aclimatado: formData.aclimatado,
        aptaMedica: formData.aptaMedica,
        cantTrabajadoresExpuestos: parseInt(formData.cantTrabajadores) || 1
      },

      frio: coldData,
      metricas: evalResult,

      // Compatibilidad con registros legados
      puesto: formData.puesto,
      sector: formData.sector,
      tarea: formData.tarea,
      tbh: formData.tbh,
      tg: formData.tg,
      tbs: formData.tbs,
      cargaSolar: formData.cargaSolar,
      viento: formData.viento,
      ritmo: formData.ritmo,
      ciclo: formData.ciclo,
      cav: formData.cav,
      aclimatado: formData.aclimatado,
      aptaMedica: formData.aptaMedica,
      resultados: {
        tgbh: evalResult.tgbhEfectivo,
        vle: evalResult.vlePermisible,
        vla: evalResult.vlaAccion,
        limite: evalResult.vlePermisible,
        admisible: !evalResult.limiteExcedido,
        enVLA: evalResult.nivelAccionAlcanzado
      },

      evaluador: currentUser?.displayName || professional.name || 'Profesional HSE',
      professionalName: professional.name,
      professionalLicense: professional.license,
      professionalSignature: formData.professionalSignature || professional.signature,
      professionalStamp: formData.professionalStamp || professional.stamp,
      operatorSignature: formData.operatorSignature || null,
      supervisorSignature: formData.supervisorSignature || formData.signature || null,
      showSignatures: formData.showSignatures
    };

    let historyList = [];
    try {
      const savedHistory = localStorage.getItem('thermal_history');
      if (savedHistory) historyList = JSON.parse(savedHistory);
    } catch (e) {
      console.error('[ThermalStress] Error reading thermal_history:', e);
    }

    if (currentEditItem) {
      historyList = historyList.map((item: any) => item.id === currentEditItem.id ? report : item);
    } else {
      historyList.unshift(report);
    }

    localStorage.setItem('thermal_history', JSON.stringify(historyList));
    syncCollection('thermal_history', historyList);
    setHistory(historyList);

    toast.success(currentEditItem ? 'Protocolo térmico actualizado.' : 'Medición guardada en el historial oficial.');
    setIsFormVisible(false);
    window.scrollTo(0, 0);
  };

  const handlePrint = (itemToPrint?: any) => {
    const target = itemToPrint || {
      id: Date.now(),
      fecha: formData.fecha,
      ...formData,
      metricas: evalResult,
      resultados: {
        tgbh: evalResult.tgbhEfectivo,
        vle: evalResult.vlePermisible,
        vla: evalResult.vlaAccion,
        limite: evalResult.vlePermisible,
        admisible: !evalResult.limiteExcedido,
        enVLA: evalResult.nivelAccionAlcanzado
      }
    };
    setSelectedForPrint(target);
    requirePro(() => {
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  const exportCsv = () => {
    if (!history.length) {
      toast.error('No hay datos registrados para exportar.');
      return;
    }
    const headers = [
      'Fecha', 'CUIT', 'Razon Social', 'Puesto', 'Sector', 'Tarea',
      'Tbh (°C)', 'Tg (°C)', 'Tbs (°C)', 'Carga Solar', 'Viento (m/s)',
      'TGBH Medido (°C)', 'Indumentaria', 'CAV (°C)', 'TGBH Efectivo (°C)',
      'VLE (°C)', 'VLA (°C)', 'Aclimatado', 'Apto Medico', 'Dictamen',
      'Regimen', 'Hidratacion (ml/h)'
    ];
    const rows = history.map((item) => {
      const amb = item.ambiental || item;
      const wrk = item.trabajador || item;
      const met = item.metricas || item.resultados || {};
      return [
        item.fecha || item.date || '',
        `"${item.cuit || item.empresaCuit || ''}"`,
        `"${item.razonSocial || item.empresa || ''}"`,
        `"${wrk.puesto || item.puesto || ''}"`,
        `"${wrk.sector || item.sector || ''}"`,
        `"${wrk.tarea || item.tarea || ''}"`,
        amb.tbh ?? '',
        amb.tg ?? '',
        amb.tbs ?? '',
        amb.cargaSolar ? 'SI' : 'NO',
        amb.velocidadViento || amb.viento || '',
        met.tgbhMedido ?? amb.tbh ?? '',
        `"${wrk.indumentariaId || ''}"`,
        wrk.cav ?? item.cav ?? 0,
        met.tgbhEfectivo ?? met.tgbh ?? '',
        met.vlePermisible ?? met.vle ?? met.limite ?? '',
        met.vlaAccion ?? met.vla ?? '',
        wrk.aclimatado ? 'SI' : 'NO',
        wrk.aptaMedica ? 'SI' : 'NO',
        `"${met.dictamenGeneral || (met.admisible ? 'CONFORME' : 'SUPERA LMPE')}"`,
        `"${met.regimenRecomendado || wrk.ciclo || ''}"`,
        met.tasaHidratacionMlPorHora || ''
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Protocolo_Estres_Termico_SRT30_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV oficial exportado.');
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span className="text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
          {item.fecha ? new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'S/F'}
        </span>
      )
    },
    {
      header: 'Puesto / Empresa',
      accessor: 'puesto',
      sortable: true,
      render: (item: any) => {
        const puesto = item.trabajador?.puesto || item.puesto || 'Puesto S/N';
        const emp = item.razonSocial || item.empresa || 'Empresa S/N';
        const cuit = item.cuit || item.empresaCuit || '';
        return (
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ThermometerSun size={15} className="text-amber-500" />
              {puesto}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>{emp}</span>
              {cuit && <span className="font-mono text-slate-400">({cuit})</span>}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Sector',
      accessor: 'sector',
      render: (item: any) => (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs">
          <MapPin size={13} className="text-slate-400 shrink-0" />
          {item.trabajador?.sector || item.sector || 'N/A'}
        </span>
      )
    },
    {
      header: 'TGBH Efectivo',
      accessor: 'resultados',
      sortable: true,
      render: (item: any) => {
        const val = item.metricas?.tgbhEfectivo ?? item.resultados?.tgbh ?? '--';
        const cav = item.trabajador?.cav ?? item.cav ?? 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-black text-slate-900 dark:text-white text-xs">
              {val}°C
            </span>
            {cav > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">
                +{cav}°C
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Dictamen Oficial',
      accessor: 'id',
      render: (item: any) => {
        const dictamen = item.metricas?.dictamenGeneral || (
          item.resultados?.admisible ? 'CONFORME' : item.resultados?.enVLA ? 'ZONA DE ACCIÓN' : 'SUPERA LMPE'
        );
        const isOk = dictamen.includes('CONFORME');
        const isVla = dictamen.includes('ACCIÓN') || dictamen.includes('VLA');
        const isCrit = dictamen.includes('CRÍTICO') || dictamen.includes('SUSPENDIDO');

        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${
            isCrit
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : !isOk && !isVla
              ? 'bg-red-50 text-red-700 border-red-300'
              : isVla
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`}>
            {isOk ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}
            {dictamen}
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setCurrentEditItem(item);
              setFormData({
                ...item,
                cuit: item.cuit || item.empresaCuit || '',
                razonSocial: item.razonSocial || item.empresa || '',
                direccion: item.direccion || '',
                localidad: item.localidad || '',
                art: item.art || '',
                establecimiento: item.establecimiento || '',
                instMarca: item.instrumento?.marca || item.instMarca || 'Quest Technologies / 3M',
                instModelo: item.instrumento?.modelo || item.instModelo || 'QUESTemp° 34',
                instSerie: item.instrumento?.numeroSerie || item.instSerie || 'QT-34-8841',
                fechaCalibracion: item.instrumento?.fechaCalibracionLaboratorio || item.fechaCalibracion || '2025-06-15',
                verifPre: item.instrumento?.verificacionInSituPre ?? item.verifPre ?? 25.0,
                verifPost: item.instrumento?.verificacionInSituPost ?? item.verifPost ?? 25.1,
                tbh: item.ambiental?.tbh ?? item.tbh ?? '',
                tg: item.ambiental?.tg ?? item.tg ?? '',
                tbs: item.ambiental?.tbs ?? item.tbs ?? '',
                cargaSolar: item.ambiental?.cargaSolar ?? item.cargaSolar ?? false,
                viento: item.ambiental?.velocidadViento ?? item.viento ?? '',
                puesto: item.trabajador?.puesto || item.puesto || '',
                sector: item.trabajador?.sector || item.sector || '',
                tarea: item.trabajador?.tarea || item.tarea || '',
                ritmo: item.trabajador?.ritmo || item.ritmo || 'moderado',
                ciclo: item.trabajador?.ciclo || item.ciclo || 'continuo',
                indumentariaId: item.trabajador?.indumentariaId || item.indumentariaId || 'standard',
                cav: item.trabajador?.cav ?? item.cav ?? 0,
                aclimatado: item.trabajador?.aclimatado ?? item.aclimatado ?? true,
                aptaMedica: item.trabajador?.aptaMedica ?? item.aptaMedica ?? true,
                cantTrabajadores: item.trabajador?.cantTrabajadoresExpuestos || item.cantTrabajadores || 1,
                evaluarFrio: item.frio?.evaluarFrio ?? item.evaluarFrio ?? false,
                tempAireSeco: item.frio?.temperaturaAireSeco ?? item.tempAireSeco ?? '',
                velocidadVientoKmH: item.frio?.velocidadVientoKmH ?? item.velocidadVientoKmH ?? '',
                operatorSignature: item.operatorSignature || '',
                supervisorSignature: item.supervisorSignature || item.signature || '',
                signature: item.signature || item.supervisorSignature || '',
                showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true }
              });
              setIsFormVisible(true);
              window.scrollTo(0, 0);
            }}
            title="Editar Protocolo"
            className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handlePrint(item)}
            title="Imprimir / PDF Oficial"
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Printer size={15} />
          </button>
          <button
            onClick={() => requirePro(() => {
              const url = `${window.location.origin}/v/${currentUser?.uid}/thermal/${item.id}?print=true`;
              setQrTarget({ text: url, title: `Estrés Térmico — ${item.trabajador?.puesto || item.puesto}` });
            })}
            title="Código QR"
            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <QrCode size={15} />
          </button>
          <button
            onClick={() => requirePro(() => setShareItem(item))}
            title="Compartir Informe"
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Share2 size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item.id)}
            title="Eliminar"
            className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container mx-auto px-3 sm:px-6 py-4">
        {/* Modal de Eliminación */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-sm w-full text-center shadow-2xl">
              <Trash2 size={44} className="text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white m-0 mb-1">
                ¿Eliminar protocolo?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Esta acción no se puede deshacer. Se removerá del historial local.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Compartir */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title="Compartir Protocolo Oficial de Estrés Térmico"
          text={shareItem ? `🌡️ Protocolo Oficial Estrés Térmico (Res. MTEySS 295/03 & Res. SRT 30/2023)\n🏢 Empresa: ${shareItem.razonSocial || shareItem.empresa || 'S/N'}\n📍 Puesto: ${shareItem.trabajador?.puesto || shareItem.puesto}\n📊 TGBH Efectivo: ${shareItem.metricas?.tgbhEfectivo ?? shareItem.resultados?.tgbh}°C | VLE: ${shareItem.metricas?.vlePermisible ?? shareItem.resultados?.vle}°C\n✅ Dictamen: ${shareItem.metricas?.dictamenGeneral || (shareItem.resultados?.admisible ? 'CONFORME' : 'SUPERA LMPE')}\n\nGenerado con Asistente de Higiene y Seguridad` : ''}
          rawMessage={shareItem ? `🌡️ Protocolo Oficial Estrés Térmico (Res. MTEySS 295/03 & Res. SRT 30/2023)\n🏢 Empresa: ${shareItem.razonSocial || shareItem.empresa || 'S/N'}\n📍 Puesto: ${shareItem.trabajador?.puesto || shareItem.puesto}\n📊 TGBH Efectivo: ${shareItem.metricas?.tgbhEfectivo ?? shareItem.resultados?.tgbh}°C | VLE: ${shareItem.metricas?.vlePermisible ?? shareItem.resultados?.vle}°C\n✅ Dictamen: ${shareItem.metricas?.dictamenGeneral || (shareItem.resultados?.admisible ? 'CONFORME' : 'SUPERA LMPE')}\n\nGenerado con Asistente de Higiene y Seguridad` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Protocolo_Termico_${shareItem?.trabajador?.puesto || shareItem?.puesto || 'report'}.pdf`}
        />

        {/* Elemento Oculto para Renderizar ShareModal */}
        <div className="absolute left-0 opacity-[0.001] top-[-9999px] pointer-events-none">
          {shareItem && <ThermalStressPdfGenerator data={shareItem} isHeadless={true} onBack={() => {}} />}
        </div>

        {/* Elemento para Imprimir Seleccionado */}
        {selectedForPrint && (
          <div className="print-only">
            <ThermalStressPdfGenerator data={selectedForPrint} onBack={() => {}} />
          </div>
        )}

        {!isFormVisible ? (
          /* ─── VISTA 1: LISTADO DE HISTORIAL Y BOTÓN NUEVO ─── */
          <div className="animate-fade-in w-full max-w-6xl mx-auto space-y-6">
            <PremiumHeader
              title="Protocolos de Carga Térmica y Frío"
              subtitle={`Res. MTEySS 295/03 Anexo II & Res. SRT 30/2023 • ${history.length} relevamientos`}
              icon={<ThermometerSun size={36} className="text-white" />}
            />

            {/* Barra de Acciones */}
            <div className="flex gap-3 flex-wrap justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estándar Vigente:
                </span>
                <span className="text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  Res. SRT 30/2023 (TGBH + CAV + VLA/VLE)
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download size={16} /> Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentEditItem(null);
                    setFormData({
                      cuit: initialDefaults.cuit,
                      razonSocial: initialDefaults.razonSocial,
                      direccion: initialDefaults.direccion,
                      localidad: initialDefaults.localidad,
                      art: initialDefaults.art,
                      establecimiento: initialDefaults.establecimiento,
                      puesto: '',
                      sector: '',
                      tarea: '',
                      fecha: new Date().toISOString().split('T')[0],
                      cantTrabajadores: 1,
                      instMarca: 'Quest Technologies / 3M',
                      instModelo: 'QUESTemp° 34',
                      instSerie: 'QT-34-8841',
                      fechaCalibracion: '2025-06-15',
                      verifPre: 25.0,
                      verifPost: 25.1,
                      cargaSolar: false,
                      tbh: '24.5',
                      tg: '31.0',
                      tbs: '30.0',
                      viento: '0.3',
                      aptaMedica: true,
                      aclimatado: true,
                      ritmo: 'moderado',
                      ciclo: 'continuo',
                      indumentariaId: 'standard',
                      cav: 0.0,
                      evaluarFrio: false,
                      tempAireSeco: '',
                      velocidadVientoKmH: '',
                      operatorSignature: '',
                      supervisorSignature: '',
                      signature: '',
                      showSignatures: { operator: true, professional: true, supervisor: true }
                    });
                    setIsFormVisible(true);
                    window.scrollTo(0, 0);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={18} strokeWidth={2.5} /> Nuevo Relevamiento
                </button>
              </div>
            </div>

            {/* Tabla de Historial */}
            <DataTable
              data={history}
              columns={columns}
              searchPlaceholder="Buscar por puesto, empresa o sector..."
              searchFields={['puesto', 'sector', 'tarea', 'razonSocial', 'cuit']}
              emptyMessage="No hay evaluaciones térmicas registradas. Inicie una nueva con el botón superior."
              emptyIcon={<ThermometerSun size={48} />}
            />

            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
          </div>
        ) : (
          /* ─── VISTA 2: FORMULARIO OFICIAL EN DOS COLUMNAS ─── */
          <div className="no-print animate-fade-in w-full max-w-6xl mx-auto space-y-6">
            <PremiumHeader
              onBack={() => setIsFormVisible(false)}
              title={currentEditItem ? 'Editar Protocolo de Estrés Térmico' : 'Nuevo Protocolo de Estrés Térmico y Frío'}
              subtitle="Res. MTEySS 295/03 Anexo II & Res. SRT 30/2023 • Carga Térmica y Aclimatación"
              icon={<ThermometerSun size={36} className="text-white" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Formulario (7 columnas) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Datos del Establecimiento */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <Building2 size={18} className="text-blue-500" />
                    1. Identificación de la Empresa y Puesto
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">C.U.I.T. N°</label>
                      <input
                        type="text"
                        value={formData.cuit}
                        onChange={(e) => handleInput('cuit', e.target.value)}
                        placeholder="30-12345678-9"
                        className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Razón Social</label>
                      <input
                        type="text"
                        value={formData.razonSocial}
                        onChange={(e) => handleInput('razonSocial', e.target.value)}
                        placeholder="Ej. Industrias Metalúrgicas S.A."
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Puesto de Trabajo a Evaluar *</label>
                      <input
                        type="text"
                        value={formData.puesto}
                        onChange={(e) => handleInput('puesto', e.target.value)}
                        placeholder="Ej. Operador de Horno de Fundición"
                        className="w-full text-xs font-black p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Sector / Área</label>
                      <input
                        type="text"
                        value={formData.sector}
                        onChange={(e) => handleInput('sector', e.target.value)}
                        placeholder="Ej. Nave 2 - Fundición"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tarea Principal Realizada</label>
                      <input
                        type="text"
                        value={formData.tarea}
                        onChange={(e) => handleInput('tarea', e.target.value)}
                        placeholder="Ej. Carga y colada de lingotes en cubilote con pala y empuje manual"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Fecha del Relevamiento</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => handleInput('fecha', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">N° Trabajadores Expuestos</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.cantTrabajadores}
                        onChange={(e) => handleInput('cantTrabajadores', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Instrumental y Calibración */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <Wrench size={18} className="text-amber-500" />
                    2. Instrumental de Medición y Calibración
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Marca y Modelo</label>
                      <input
                        type="text"
                        value={`${formData.instMarca} ${formData.instModelo}`}
                        onChange={(e) => handleInput('instModelo', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">N° de Serie</label>
                      <input
                        type="text"
                        value={formData.instSerie}
                        onChange={(e) => handleInput('instSerie', e.target.value)}
                        className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Calibración Lab.</label>
                      <input
                        type="date"
                        value={formData.fechaCalibracion}
                        onChange={(e) => handleInput('fechaCalibracion', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  {evalResult.calibracionLaboratorioVencida && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-bold">
                      <AlertCircle size={16} /> Certificado de calibración con más de 24 meses de antigüedad.
                    </div>
                  )}
                </div>

                {/* 3. Variables Ambientales */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0">
                      <ThermometerSun size={18} className="text-orange-500" />
                      3. Variables Ambientales Medidas
                    </h3>
                    <label className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors border ${
                      formData.cargaSolar
                        ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.cargaSolar}
                        onChange={(e) => handleInput('cargaSolar', e.target.checked)}
                        className="sr-only"
                      />
                      <span>☀️ {formData.cargaSolar ? 'Con Carga Solar Directa' : 'Interior / Sombra'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">
                        Bulbo Húmedo (Tbh) °C *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.tbh}
                        onChange={(e) => handleInput('tbh', e.target.value)}
                        placeholder="24.5"
                        className="w-full text-sm font-black p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-orange-700 dark:text-orange-400 mb-1">
                        Globo Térmico (Tg) °C *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.tg}
                        onChange={(e) => handleInput('tg', e.target.value)}
                        placeholder="31.0"
                        className="w-full text-sm font-black p-2.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">
                        Bulbo Seco (Tbs) °C
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!formData.cargaSolar}
                        value={formData.cargaSolar ? formData.tbs : ''}
                        onChange={(e) => handleInput('tbs', e.target.value)}
                        placeholder={formData.cargaSolar ? "30.0" : "N/A"}
                        className={`w-full text-sm font-black p-2.5 rounded-xl border ${
                          formData.cargaSolar 
                            ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 text-red-700' 
                            : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Viento (m/s)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.viento}
                        onChange={(e) => handleInput('viento', e.target.value)}
                        placeholder="0.3"
                        className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Carga Metabólica, Indumentaria (CAV) y Condiciones Médicas */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <Shirt size={18} className="text-purple-500" />
                    4. Exigencia Física, Indumentaria (CAV) y Salud
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Carga Metabólica (Gasto Energético)
                      </label>
                      <select
                        value={formData.ritmo}
                        onChange={(e) => handleInput('ritmo', e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        {METABOLIC_PREFS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Régimen Trabajo / Descanso Declarado
                      </label>
                      <select
                        value={formData.ciclo}
                        onChange={(e) => handleInput('ciclo', e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="continuo">Continuo (100% Trabajo)</option>
                        <option value="75_25">75% Trabajo / 25% Descanso c/hora</option>
                        <option value="50_50">50% Trabajo / 50% Descanso c/hora</option>
                        <option value="25_75">25% Trabajo / 75% Descanso c/hora</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Indumentaria de Trabajo (Factor de Ajuste CAV — Res. SRT 30/23)
                      </label>
                      <select
                        value={formData.indumentariaId}
                        onChange={(e) => handleInput('indumentariaId', e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-900/10 text-indigo-950 dark:text-indigo-200"
                      >
                        {CLOTHING_CAV_OPTIONS.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.label} (CAV: +{c.cav}°C)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Toggles Aclimatado y Apto Médico */}
                    <div>
                      <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer font-bold text-xs transition-colors ${
                        formData.aclimatado
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                          : 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.aclimatado}
                          onChange={(e) => handleInput('aclimatado', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <div>
                          <div>{formData.aclimatado ? '✅ Personal Aclimatado' : '⚠️ No Aclimatado (-2.0°C)'}</div>
                          <div className="text-[10px] opacity-80 font-normal">Plan de 5 a 14 días cumplido</div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer font-bold text-xs transition-colors ${
                        formData.aptaMedica
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                          : 'border-red-400 bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.aptaMedica}
                          onChange={(e) => handleInput('aptaMedica', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <div>
                          <div>{formData.aptaMedica ? '✅ Apto Médico Específico' : '❌ Falta Apto Médico'}</div>
                          <div className="text-[10px] opacity-80 font-normal">Obligatorio por Res. SRT 30/23</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 5. Módulo Opcional: Estrés por Frío (Wind Chill) */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0">
                      <Wind size={18} className="text-sky-500" />
                      5. Estrés por Frío (Sensación Térmica / Wind Chill)
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.evaluarFrio}
                        onChange={(e) => handleInput('evaluarFrio', e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600"
                      />
                      <span>Evaluar Frío</span>
                    </label>
                  </div>

                  {formData.evaluarFrio && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-sky-700 dark:text-sky-300 mb-1">
                          Temperatura de Aire Seco (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.tempAireSeco}
                          onChange={(e) => handleInput('tempAireSeco', e.target.value)}
                          placeholder="Ej. -5.0"
                          className="w-full text-xs font-black p-2.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sky-700 dark:text-sky-300 mb-1">
                          Velocidad del Viento (km/h)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.velocidadVientoKmH}
                          onChange={(e) => handleInput('velocidadVientoKmH', e.target.value)}
                          placeholder="Ej. 25"
                          className="w-full text-xs font-black p-2.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Tarjeta de Dictamen y Previsualización (5 columnas) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Tarjeta de Dictamen Oficial */}
                <div className={`rounded-3xl border-2 overflow-hidden shadow-xl transition-all ${
                  evalResult.trabajoCriticoSuspendido
                    ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
                    : evalResult.limiteExcedido
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                    : evalResult.nivelAccionAlcanzado
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                }`}>
                  <div className={`p-4 text-white font-black text-sm uppercase tracking-wider flex items-center justify-between ${
                    evalResult.trabajoCriticoSuspendido
                      ? 'bg-rose-600'
                      : evalResult.limiteExcedido
                      ? 'bg-red-600'
                      : evalResult.nivelAccionAlcanzado
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                  }`}>
                    <span className="flex items-center gap-2">
                      <Calculator size={18} /> Dictamen Oficial Res. SRT 30/23
                    </span>
                    <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">
                      ACGIH
                    </span>
                  </div>

                  <div className="p-6 text-center space-y-4">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        TGBH EFECTIVO (CON CAV)
                      </div>
                      <div className="text-5xl font-black text-slate-900 dark:text-white my-1">
                        {evalResult.tgbhEfectivo}°C
                      </div>
                      <div className="text-xs text-slate-500">
                        Base: {evalResult.tgbhMedido}°C • CAV: +{evalResult.cavAplicado}°C
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">
                          VLA (Acción)
                        </span>
                        <span className="text-lg font-black text-amber-800 dark:text-amber-300">
                          {evalResult.vlaAccion}°C
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40">
                        <span className="text-[10px] font-bold text-red-700 dark:text-red-400 block uppercase">
                          VLE (Límite)
                        </span>
                        <span className="text-lg font-black text-red-800 dark:text-red-300">
                          {evalResult.vlePermisible}°C
                        </span>
                      </div>
                    </div>

                    {/* Badge Dictamen */}
                    <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 border text-left ${
                      evalResult.trabajoCriticoSuspendido
                        ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 text-rose-950 dark:text-rose-200'
                        : evalResult.limiteExcedido
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-950 dark:text-red-200'
                        : evalResult.nivelAccionAlcanzado
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 text-amber-950 dark:text-amber-200'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 text-emerald-950 dark:text-emerald-200'
                    }`}>
                      {evalResult.dictamenGeneral === 'CONFORME' ? (
                        <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert size={32} className="shrink-0 text-red-600" />
                      )}
                      <div>
                        <div className="text-xs font-black uppercase tracking-tight">
                          {evalResult.dictamenGeneral}
                        </div>
                        <div className="text-[11px] font-medium opacity-90 mt-0.5">
                          {evalResult.regimenRecomendado}
                        </div>
                      </div>
                    </div>

                    {/* Hidratación Requerida */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl text-left flex items-center gap-3">
                      <Droplets size={22} className="text-blue-500 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase">
                          Hidratación Obligatoria
                        </div>
                        <div className="text-xs font-black text-blue-950 dark:text-blue-200">
                          {evalResult.tasaHidratacionMlPorHora} ml/hora (1 vaso cada 15-20 min)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Firmas Digitales */}
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <Pencil size={18} className="text-blue-500" />
                    Firmas y Validación
                  </h3>

                  <div className="space-y-4">
                    {showSignatures.operator && (
                      <SignatureCanvas
                        label="Firma del Trabajador Evaluado"
                        initialImage={formData.operatorSignature}
                        onSave={(sig) => handleInput('operatorSignature', sig || '')}
                      />
                    )}
                    {showSignatures.professional && (
                      <SignatureCanvas
                        label="Firma del Profesional H&S"
                        initialImage={formData.professionalSignature || professional.signature}
                        onSave={(sig) => handleInput('professionalSignature', sig || '')}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra Inferior de Guardar y Generar PDF */}
            <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex justify-between items-center flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={16} /> Volver al Listado
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => requirePro(doSave)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save size={16} /> Guardar Protocolo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Publicitario PRO */}
        <div className="mt-8">
          <AdBanner />
        </div>
      </div>
    </AnimatedPage>
  );
}
