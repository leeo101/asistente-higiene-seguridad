import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck, Activity, CheckCircle,
  Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera, Share2, Pencil, Download, FileSpreadsheet, CalendarDays, History, UploadCloud, DownloadCloud, Info, Save, Settings, ChevronDown, Sparkles, XCircle, AlertOctagon, Eye } from
'lucide-react';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';
import { getErrorMessage } from '../utils/errorUtils';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import { compressImage } from '../utils/imageCompressor';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import CompanyLogo from '../components/CompanyLogo';
import { DataTable } from '../components/DataTable';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import ExcelJS from 'exceljs';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { BulkImportModal } from '../components/BulkImportModal';
import { ExtinguisherImportRow } from '../utils/dataImporterExporter';
import { printElementAsDocument } from '../utils/pdfHelper';
import { analyzeExtinguisherLocally } from '../utils/localVisionAnalyzer';

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  return tipo;
};


export default function ExtintoresManager() {
  const { requirePro } = usePaywall();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { syncCollection } = useSync();

  const [extintores, setExtintores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vencidos' | 'porVencer' | 'operativos'>('all');
  const [activeFormStep, setActiveFormStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);
  const [printItem, setPrintItem] = useState<any | null>(null);
  const [viewingPdf, setViewingPdf] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const [globalShowSignatures, setGlobalShowSignatures] = useState({ operator: false, professional: true, supervisor: false });
  const [globalSignaturesData, setGlobalSignaturesData] = useState({ operatorSignature: '', supervisorSignature: '' });
  const [showGlobalSignatureModal, setShowGlobalSignatureModal] = useState(false);
  const [customCapacityMode, setCustomCapacityMode] = useState(false);
  const CAPACITY_PRESETS = ['1 kg', '2.5 kg', '3.5 kg', '5 kg', '10 kg', '25 kg', '50 kg', '10 lts'];

  const [formData, setFormData] = useState<any>({
    numero: '',
    numeroSerie: '',
    tipo: 'ABC (PQS)',
    capacidad: '5 kg',
    potencialExtintor: '3A 10B C',
    ubicacion: '',
    empresa: '',
    marca: '',
    recargadora: '',
    tipoMontaje: 'Soporte mural (1.20m - 1.50m)',
    fechaFabricacion: '',
    vencimientoRecarga: '',
    vencimientoPH: '',
    selloIRAM: '',
    estadoFisico: 'Operativo',
    observaciones: '',
    checkManometro: true,
    checkPrecinto: true,
    checkSenalizacion: true,
    checkAcceso: true,
    foto: null,
    showSignatures: { professional: true, supervisor: true, operator: true },
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    professionalName: '',
    professionalLicense: ''
  });
  const [professionalData, setProfessionalData] = useState({ name: '', license: '', signature: null, stamp: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanningMarbete, setIsScanningMarbete] = useState(false);
  const marbeteCameraRef = useRef<HTMLInputElement>(null);

  const handleMarbeteScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    requirePro(async () => {
      setIsScanningMarbete(true);
      const loadingToast = toast.loading('Procesando marbete con IA...');

      try {
        const base64 = await compressImage(file, { maxDimension: 1200, quality: 0.78 });
        let data: any = null;

        try {
          const token = await auth.currentUser?.getIdToken(true);
          const response = await fetch(`${API_BASE_URL}/api/analyze-extinguisher`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ image: base64 })
          });

          if (response.ok) {
            data = await response.json();
          }
        } catch (cloudErr) {
          console.warn('[ExtintoresManager] Fallback local para escaneo de marbete:', cloudErr);
        }

        if (!data || data.extinguisherDetected === false) {
          data = await analyzeExtinguisherLocally(base64);
        }

        let mappedAgent = formData.tipo;
        if (data.type === 'ABC') mappedAgent = 'ABC (PQS)';
        else if (data.type === 'CO2') mappedAgent = 'BC(CO2)';
        else if (data.type) mappedAgent = data.type;

        setFormData((prev) => ({
          ...prev,
          tipo: mappedAgent,
          capacidad: data.capacity ? (data.capacity.includes('kg') || data.capacity.includes('lts') ? data.capacity : `${data.capacity} kg`) : prev.capacidad,
          vencimientoRecarga: data.lastCheck || prev.vencimientoRecarga,
          vencimientoPH: data.phDate || prev.vencimientoPH,
          estadoFisico: data.status === 'vigente' ? 'Operativo' : 'Revisión',
          foto: base64
        }));

        toast.success('Ficha del extintor autocompletada con IA ✨', { id: loadingToast });
      } catch (error) {
        console.error('OCR error:', error);
        toast.error(`Error al analizar: ${getErrorMessage(error)}`, { id: loadingToast });
      } finally {
        setIsScanningMarbete(false);
      }
    });

    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');

      let sig = null;
      let stamp = null;
      let name = 'Profesional HSE';
      let license = '';

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        sig = parsed.signature;
        stamp = parsed.stamp;
      } else if (legacySig) {
        sig = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        name = pd.name || name;
        license = pd.license || license;
      }

      setProfessionalData({ name, license, signature: sig, stamp });
      setFormData((prev) => ({
        ...prev,
        professionalSignature: sig,
        professionalName: name,
        professionalLicense: license
      }));
    } catch (e) {}
  }, []);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files[0];
    const toastId = toast.loading('Procesando y optimizando imagen del equipo...');
    setIsUploadingPhoto(true);

    try {
      // Comprimir foto con balance ideal para legibilidad de marbete/chapa y almacenamiento liviano
      const compressed = await compressImage(file, {
        maxDimension: 800,
        quality: 0.72,
        mimeType: 'image/jpeg'
      });
      if (compressed) {
        setFormData(prev => ({ ...prev, foto: compressed }));
        toast.success('Foto cargada y optimizada con éxito', { id: toastId });
      } else {
        toast.error('No se pudo procesar la imagen seleccionada', { id: toastId });
      }
    } catch (err) {
      console.warn('[ExtintoresManager] Error compressing photo:', err);
      toast.error('Error al procesar la imagen', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      // Resetear el input para permitir volver a seleccionar la misma foto si se desea
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  useEffect(() => {
    if (showGlobalSignatureModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showGlobalSignatureModal]);

  const downloadTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Extintores');
    sheet.columns = [
      { header: 'Nº Chapa (ID)', key: 'numero', width: 20 },
      { header: 'Empresa', key: 'empresa', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Capacidad', key: 'capacidad', width: 15 },
      { header: 'Ubicación', key: 'ubicacion', width: 20 },
      { header: 'Fecha Fabricación (YYYY-MM-DD)', key: 'fechaFabricacion', width: 30 },
      { header: 'Venc. Recarga (YYYY-MM-DD)', key: 'vencimientoRecarga', width: 30 },
      { header: 'Venc. PH (YYYY-MM-DD)', key: 'vencimientoPH', width: 30 },
      { header: 'Sello IRAM', key: 'selloIRAM', width: 15 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Nº Serie', key: 'numeroSerie', width: 15 }
    ];
    sheet.addRow({
      numero: 'EXT-001', empresa: 'Mi Empresa', tipo: 'ABC (PQS)', capacidad: '5 kg',
      ubicacion: 'Pasillo Principal', fechaFabricacion: '2023-01-01', vencimientoRecarga: '2023-01-01', vencimientoPH: '2023-01-01', selloIRAM: '12345', marca: 'Georgia', numeroSerie: '987654'
    });
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Extintores.xlsx';
      a.click();
    });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as ArrayBuffer);
        const sheet = workbook.worksheets[0];
        const nuevos: any[] = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header
          const values = row.values as any[];
          if (!values[1]) return; // empty row
          nuevos.push({
            id: Date.now().toString() + Math.random().toString(36).substring(7) + rowNumber,
            numero: values[1]?.toString() || '',
            empresa: values[2]?.toString() || '',
            tipo: values[3]?.toString() || 'ABC (PQS)',
            capacidad: values[4]?.toString() || '5 kg',
            ubicacion: values[5]?.toString() || '',
            fechaFabricacion: values[6] ? new Date(values[6]).toISOString().split('T')[0] : '',
            vencimientoRecarga: values[7] ? new Date(values[7]).toISOString().split('T')[0] : '',
            vencimientoPH: values[8] ? new Date(values[8]).toISOString().split('T')[0] : '',
            selloIRAM: values[9]?.toString() || '',
            marca: values[10]?.toString() || '',
            numeroSerie: values[11]?.toString() || '',
            estadoFisico: 'Operativo',
            syncStatus: 'pending'
          });
        });
        if (nuevos.length === 0) { toast.error('El Excel está vacío o mal formateado'); return; }
        const updated = [...extintores, ...nuevos];
        setExtintores(updated as any);
        localStorage.setItem('extinguishers_inventory', JSON.stringify(updated));
        if (syncCollection) syncCollection('extinguishers_inventory', updated);
        toast.success(nuevos.length + ' extintores importados exitosamente');
      } catch (err) {
        console.error(err);
        toast.error('Error al leer el archivo Excel');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImportConfirm = (items: ExtinguisherImportRow[]) => {
    const nuevos = items.map((item, idx) => ({
      id: Date.now().toString() + '_' + idx,
      numero: item.code,
      tipo: item.type,
      capacidad: item.capacity,
      ubicacion: item.location,
      vencimientoRecarga: item.expirationDate,
      estadoFisico: item.status,
      empresa: filterEmpresa || 'Planta Principal',
      syncStatus: 'pending'
    }));

    const updated = [...extintores, ...nuevos];
    setExtintores(updated as any);
    localStorage.setItem('extinguishers_inventory', JSON.stringify(updated));
    if (syncCollection) syncCollection('extinguishers_inventory', updated);
  };

  useEffect(() => {
    const loadData = async () => {
      const oldDataStr = localStorage.getItem('extinguishers_inventory');
      const newDataStr = localStorage.getItem('extintores_inventory');
      let combined = [];

      if (oldDataStr) {
        try {combined = [...combined, ...JSON.parse(oldDataStr)];} catch (e) {}
      }

      if (newDataStr) {
        try {
          const newData = JSON.parse(newDataStr);
          const existingIds = new Set(combined.map((e: any) => e.id));
          const uniqueNew = newData.filter((e: any) => !existingIds.has(e.id));
          combined = [...combined, ...uniqueNew];
          localStorage.setItem('extinguishers_inventory', JSON.stringify(combined));
          localStorage.removeItem('extintores_inventory');
        } catch (e) {}
      }

      const migrated = combined.map((ext: any) => {
        return {
          ...ext,
          numero: ext.numero || ext.chapa || '',
          vencimientoRecarga: ext.vencimientoRecarga || ext.ultimaCarga || '',
          vencimientoPH: ext.vencimientoPH || ext.ultimaPH || ''
        };
      });
      setExtintores(migrated as any);
    };
    loadData();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit') || searchParams.get('id') || (location.state as any)?.editId;
    if (editId && extintores.length > 0) {
      const extToEdit = extintores.find((e: any) => String(e.id) === String(editId) || String(e.numero) === String(editId));
      if (extToEdit && (!showForm || editingId !== extToEdit.id)) {
        setFormData({ ...extToEdit });
        setEditingId(extToEdit.id);
        setShowForm(true);
      }
    }
  }, [searchParams, location.state, extintores, showForm, editingId]);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const saveToStorage = async (data: any[]) => {
    try {
      localStorage.setItem('extinguishers_inventory', JSON.stringify(data));
      setExtintores(data);
      await syncCollection('extinguishers_inventory', data);
    } catch (err: any) {
      console.warn('[ExtintoresManager] Storage quota exceeded or write failed:', err);
      // Si el error es de cuota de localStorage (típico cuando hay múltiples fotos base64)
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2146828281) {
        try {
          // Estrategia de recuperación: conservar los registros y optimizar fotos antiguas
          const sanitizedData = data.map((item, idx) => {
            // Dejar intactos los últimos 5 registros; para los más antiguos aligerar la foto si es muy grande
            if (idx > 5 && item.foto && item.foto.length > 50000) {
              return { ...item, foto: null };
            }
            return item;
          });
          localStorage.setItem('extinguishers_inventory', JSON.stringify(sanitizedData));
          setExtintores(sanitizedData);
          await syncCollection('extinguishers_inventory', sanitizedData);
          toast.success('Guardado completado (almacenamiento local optimizado)', { duration: 4000 });
          return;
        } catch (subErr) {
          console.error('[ExtintoresManager] Fallback sanitize storage failed:', subErr);
        }
      }
      // Actualizar de todos modos el estado reactivo en memoria
      setExtintores(data);
      toast.error('Atención: El almacenamiento local del navegador está lleno. Los datos están en memoria pero podrían no persistir si recarga sin sincronizar.');
    }
  };

  const handleSave = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();

    const cleanNumero = (formData.numero || '').trim();
    if (!cleanNumero) {
      toast.error('Debe ingresar el Número de Chapa / Identificador del extintor');
      return;
    }

    const cleanUbicacion = (formData.ubicacion || '').trim();
    if (!cleanUbicacion) {
      toast.error('Debe especificar la ubicación física del extintor');
      return;
    }

    const newEntry = {
      ...formData,
      numero: cleanNumero,
      ubicacion: cleanUbicacion,
      id: editingId || Date.now().toString(),
      updatedAt: new Date().toISOString()
    };

    let updated: any[];
    if (editingId) {
      updated = extintores.map((ext) => ext.id === editingId ? newEntry : ext);
      toast.success('Extintor actualizado con éxito');
    } else {
      updated = [newEntry, ...extintores];
      toast.success('Extintor registrado con éxito');
    }

    await saveToStorage(updated);
    setShowForm(false);
    setEditingId(null);
    setFormData({
      numero: '',
      numeroSerie: '',
      tipo: 'ABC (PQS)',
      capacidad: '5 kg',
      potencialExtintor: '3A 10B C',
      ubicacion: '',
      marca: '',
      recargadora: '',
      tipoMontaje: 'Soporte mural (1.20m - 1.50m)',
      fechaFabricacion: '',
      vencimientoRecarga: '',
      vencimientoPH: '',
      selloIRAM: '',
      estadoFisico: 'Operativo',
      observaciones: '',
      checkManometro: true,
      checkPrecinto: true,
      checkSenalizacion: true,
      checkAcceso: true,
      foto: null,
      empresa: '',
      showSignatures: { professional: true, supervisor: true, operator: true },
      operatorSignature: '',
      supervisorSignature: '',
      professionalSignature: professionalData?.signature || '',
      professionalName: professionalData?.name || '',
      professionalLicense: professionalData?.license || ''
    });
  };

  const handleEdit = (ext) => {
    setFormData({
      ...ext,
      potencialExtintor: ext.potencialExtintor || '3A 10B C',
      recargadora: ext.recargadora || '',
      tipoMontaje: ext.tipoMontaje || 'Soporte mural (1.20m - 1.50m)',
      observaciones: ext.observaciones || '',
      checkManometro: ext.checkManometro !== undefined ? ext.checkManometro : true,
      checkPrecinto: ext.checkPrecinto !== undefined ? ext.checkPrecinto : true,
      checkSenalizacion: ext.checkSenalizacion !== undefined ? ext.checkSenalizacion : true,
      checkAcceso: ext.checkAcceso !== undefined ? ext.checkAcceso : true,
      showSignatures: ext.showSignatures || { professional: true, supervisor: true, operator: true },
      operatorSignature: ext.operatorSignature || '',
      supervisorSignature: ext.supervisorSignature || '',
      professionalSignature: ext.professionalSignature || professionalData?.signature || '',
      professionalName: ext.professionalName || professionalData?.name || '',
      professionalLicense: ext.professionalLicense || professionalData?.license || ''
    });
    setEditingId(ext.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = async () => {
    if (confirmModal.payload) {
      const updated = extintores.filter((ext) => ext.id !== confirmModal.payload);
      await saveToStorage(updated);
      toast.success('Extintor eliminado');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const generateQR = async (ext) => {
    try {
      const link = `${window.location.origin}/extintores/inspect/${ext.id}`;
      const url = await QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      setQrData({ ext, url, link });
      setShowQrModal(true);
    } catch (err) {
      toast.error('Error al generar QR');
      console.error(err);
    }
  };

  // Calculate Recarga expiration status (add 1 year to the performed date)
  const getRecargaExpirationStatus = (dateStr) => {
    if (!dateStr) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
    d.setFullYear(d.getFullYear() + 1);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = d.toLocaleDateString('es-AR');
    if (diffDays < 0) return { color: '#ef4444', label: 'Vencido', bg: '#fee2e2', icon: <AlertTriangle size={14} />, expirationDate: expDate };
    if (diffDays <= 30) return { color: '#f59e0b', label: 'Por vencer', bg: '#fef3c7', icon: <AlertTriangle size={14} />, expirationDate: expDate };
    return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} />, expirationDate: expDate };
  };

  // Calculate PH expiration status (add 5 years to the performed date)
  const getPHExpirationStatus = (dateStr) => {
    if (!dateStr) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { color: 'gray', label: 'Sin Datos', icon: <AlertTriangle size={14} />, expirationDate: null };
    d.setFullYear(d.getFullYear() + 5);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = d.toLocaleDateString('es-AR');
    if (diffDays < 0) return { color: '#ef4444', label: 'Vencido', bg: '#fee2e2', icon: <AlertTriangle size={14} />, expirationDate: expDate };
    if (diffDays <= 30) return { color: '#f59e0b', label: 'Por vencer', bg: '#fef3c7', icon: <AlertTriangle size={14} />, expirationDate: expDate };
    return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} />, expirationDate: expDate };
  };

  // Calculate 20 year lifespan status
  const getLifespanStatus = (fechaFab) => {
    if (!fechaFab) return null;
    const d = new Date(fechaFab);
    const limitDate = new Date(d);
    limitDate.setFullYear(limitDate.getFullYear() + 20);

    const today = new Date();
    const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: '#ffffff', label: 'DAR DE BAJA (Vida útil cumplida)', bg: '#dc2626', icon: <AlertTriangle size={14} /> };
    if (diffDays <= 180) return { color: '#f59e0b', label: 'Por vencer vida útil (20 años)', bg: '#fef3c7', icon: <AlertTriangle size={14} /> };
    return { color: '#10b981', label: 'Vigente', bg: '#d1fae5', icon: <CheckCircle2 size={14} /> };
  };

  const getExtStatusCategory = (ext: any): 'vencidos' | 'porVencer' | 'operativos' => {
    const stCarga = getRecargaExpirationStatus(ext.vencimientoRecarga);
    const stPH = getPHExpirationStatus(ext.vencimientoPH);
    const stVida = getLifespanStatus(ext.fechaFabricacion);
    if (stVida?.label?.includes('BAJA') || stCarga.color === '#ef4444' || stPH.color === '#ef4444' || ext.estadoFisico === 'Fuera de Servicio' || ext.estadoFisico === 'Dado de Baja') {
      return 'vencidos';
    }
    if (stVida?.label?.includes('Por vencer') || stCarga.color === '#f59e0b' || stPH.color === '#f59e0b' || ext.estadoFisico === 'Revisión' || ext.estadoFisico === 'En Recarga') {
      return 'porVencer';
    }
    return 'operativos';
  };

  const baseFiltered = extintores.filter((e) => {
    const matchesSearch = (e.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const normalizeEmpresa = (emp) => (emp || '').trim().toUpperCase();
    const matchesEmpresa = filterEmpresa === '' || normalizeEmpresa(e.empresa) === filterEmpresa;
    return matchesSearch && matchesEmpresa;
  });

  const filtered = baseFiltered.filter((e) => {
    if (statusFilter === 'all') return true;
    return getExtStatusCategory(e) === statusFilter;
  });

  // Vista de previsualización PDF a pantalla completa (individual)
  if (viewingPdf) {
    return <ExtinguisherProfilePdf data={viewingPdf} onBack={() => setViewingPdf(null)} />;
  }

  const handlePrintPdf = async () => {
    const isLandscape = (filtered || []).length > 15;
    const title = `Inventario de Extintores - ${filterEmpresa || 'General'}`;
    const toastId = toast.loading('Preparando impresión...');

    try {
      setPrintItem(filtered);
      // Permitir que React monte el componente en el DOM y resuelva firmas/estilos
      await new Promise((r) => setTimeout(r, 350));

      const element = document.getElementById('pdf-content-print');
      if (!element) {
        throw new Error('Elemento de impresión no encontrado');
      }

      await printElementAsDocument('pdf-content-print', title, isLandscape);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ExtintoresManager] Error al imprimir listado:', err);
      toast.dismiss(toastId);
      // Fallback a window.print() aislado
      const element = document.getElementById('pdf-content-print');
      if (element) {
        document.body.classList.add('printing-isolated');
        element.classList.add('isolated-print-target');
      }
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-isolated');
        if (element) element.classList.remove('isolated-print-target');
      }, 1000);
    } finally {
      setTimeout(() => {
        setPrintItem(null);
      }, 1500);
    }
  };

  const handlePrintIndividualForm = async (itemData: any) => {
    const title = `Ficha Técnica - Extintor #${itemData?.numero || 'S-N'}`;
    const toastId = toast.loading('Preparando ficha para impresión...');

    try {
      setPrintItem(itemData);
      await new Promise((r) => setTimeout(r, 350));

      const element = document.getElementById('pdf-content-print');
      if (!element) {
        throw new Error('Elemento de ficha no encontrado');
      }

      await printElementAsDocument('pdf-content-print', title, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ExtintoresManager] Error al imprimir ficha:', err);
      toast.dismiss(toastId);
      const element = document.getElementById('pdf-content-print');
      if (element) {
        document.body.classList.add('printing-isolated');
        element.classList.add('isolated-print-target');
      }
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-isolated');
        if (element) element.classList.remove('isolated-print-target');
      }, 1000);
    } finally {
      setTimeout(() => {
        setPrintItem(null);
      }, 1500);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extintores', { views: [{ showGridLines: false }] });

      let logoData = '';
      try {
        const raw = localStorage.getItem('companyLogo');
        if (raw && (raw.startsWith('data:') || raw.startsWith('http'))) logoData = raw;
        else if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.value) logoData = parsed.value;
          else if (parsed?.logo) logoData = parsed.logo;
        }
      } catch (e) {}

      if (!logoData) {
        logoData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACH0lEQVR4nO3WMWrbQBgH8P+R2o1Qj9AruHQQOoTuwUN48BDWc4TQRUIP4MVD2A6hB3ClQyDqEBrcI1joECpdgr5D2+KqK510Z8l+H/iQEJKQ8/sO2ZLtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKB1iQj3Gfcb9xQvGM96q9Q2iQhPGT9L2k14t0rdQ8ZdxiuF/I8Zb3qr3AR6Uci/xR/GfM6Vf0h4X8j/hLHEfM4Jjwr53zF+6a1yA2hHIf9Txl/GW0bTW+VqwS81v2P8YpS9Va4arNT8XhifFwzXq2wA/xnjE+Ntb5WrAj8y/ioY7A3jTW+VCwV7hj/B8GvGG8Yy1/w1hT9J2E1421vlQsH8uS/I06N1rOqT1mGf/u/a1Z+PzO11e+1bT6Xms1c2B8xnmZ/9+QkAcJ/Zz5vO95p922X2s7mJ/9QcMZ/T+fl2Pj7LPN+Y7zD7OdtxT822+Zy27/9g1rBv9/Z9t23M51R/PqfzmQv23/58p3H2VqnS4H739+0m/tPYrVKlz3B3v2UcxuHnU++VKinIfdntDq1hN1y/3120XqlSQdbzYtF6pUoFnfM9zS/M4bM2L6rVqxXyZq+98z2V95yL1T8o5H3M+/E91fdcStU/KP7R2uNzqtUvlX/9nWr1S1Vfv2davVLlX79nWr1S+EAAACwJf4Bntp6h83445oAAAAASUVORK5CYII=";
      }

      try {
        if (logoData.startsWith('data:image/')) {
            const extension = logoData.split(';')[0].split('/')[1] || 'png';
            const base64Part = logoData.split(',')[1] || logoData;
            const logoId = workbook.addImage({ base64: base64Part, extension: extension as any });
            worksheet.addImage(logoId, { tl: { col: 6.5, row: 0.2 }, ext: { width: 50, height: 50 }, editAs: 'absolute' });
        }
      } catch (e) {}

      const headers = ['Nº / Chapa', 'Tipo', 'Capacidad', 'Ubicación', 'Empresa', 'Venc. Recarga', 'Venc. PH', 'Vida Útil'];

      worksheet.mergeCells(1, 1, 1, 8);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Inventario de Extintores';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      worksheet.mergeCells(2, 1, 2, 8);
      const subCell = worksheet.getCell('A2');
      subCell.value = `Generado el: ${new Date().toLocaleDateString('es-AR')} - ${filterEmpresa || 'Todas las empresas'}`;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      worksheet.getRow(1).height = 30;
      worksheet.getRow(2).height = 20;
      worksheet.getRow(3).height = 10;

      const headerRow = worksheet.getRow(4);
      headers.forEach((h, i) => {
        const c = headerRow.getCell(i + 1);
        c.value = h;
        c.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Azul profesional
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      headerRow.height = 25;

      worksheet.columns = [
        { key: 'chapa', width: 15 },
        { key: 'tipo', width: 20 },
        { key: 'capacidad', width: 15 },
        { key: 'ubicacion', width: 30 },
        { key: 'empresa', width: 25 },
        { key: 'recarga', width: 18 },
        { key: 'ph', width: 18 },
        { key: 'vidaUtil', width: 18 }
      ];

      filtered.forEach((ext) => {
        const row = worksheet.addRow({
          chapa: ext.numero,
          tipo: formatType(ext.tipo),
          capacidad: ext.capacidad,
          ubicacion: ext.ubicacion,
          empresa: ext.empresa || '',
          recarga: ext.vencimientoRecarga ? new Date(ext.vencimientoRecarga + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
          ph: ext.vencimientoPH ? new Date(ext.vencimientoPH + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
          vidaUtil: ext.fechaFabricacion ? new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR') : ''
        });
        
        row.eachCell((cell, colIndex) => {
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
          cell.alignment = { vertical: 'middle', horizontal: colIndex === 1 || colIndex === 4 || colIndex === 5 ? 'left' : 'center', wrapText: true };
          cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1'} }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1'} }, left: { style: 'thin', color: { argb: 'FFCBD5E1'} }, right: { style: 'thin', color: { argb: 'FFCBD5E1'} } };
        });
        row.height = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inventario_Extintores_${filterEmpresa || 'Completo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar Excel');
    }
  };

  const uniqueEmpresas = [...new Set(extintores.map((e) => (e.empresa || '').trim().toUpperCase()).filter(Boolean))].sort();

  const types = ['ABC(HFCF)', 'BC(CO2)', 'ABC (PQS)', 'AB', 'K', 'Agua', 'Espuma', 'D'];

  const expiredLifespans = extintores.filter((ext) => {
    const st = getLifespanStatus(ext.fechaFabricacion);
    return st && (st.label.includes('DAR DE BAJA') || st.label.includes('Por vencer vida útil'));
  });

  const columns = [
    {
      header: 'Equipo / Chapa',
      accessor: 'numero',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>
            🔥 Chapa #{item.numero}
          </div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px' }}>
            {item.marca ? `${item.marca} ` : ''}{item.numeroSerie ? `• Serie: ${item.numeroSerie}` : ''}
          </div>
          {item.selloIRAM && (
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', marginTop: '1px' }}>
              Sello IRAM/OPDS: {item.selloIRAM}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Agente y Potencial',
      accessor: 'tipo',
      sortable: true,
      render: (item: any) => (
        <div>
          <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '13px', display: 'block' }}>
            {formatType(item.tipo)} — {item.capacidad}
          </span>
          <span style={{ color: '#475569', fontWeight: '700', fontSize: '11px', display: 'block', marginTop: '2px' }}>
            Potencial: {item.potencialExtintor || '3A 10B C'}
          </span>
          {item.fechaFabricacion && (
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '600' }}>
              Fab: {new Date(item.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Ubicación y Empresa',
      accessor: 'ubicacion',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} className="text-rose-500 shrink-0" /> {item.ubicacion || '-'}
          </div>
          {item.empresa && (
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
              🏢 {item.empresa}
            </div>
          )}
          {item.tipoMontaje && (
            <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '600', marginTop: '1px' }}>
              {item.tipoMontaje}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Dictamen y Vigencia',
      accessor: 'vencimientoRecarga',
      sortable: true,
      render: (item: any) => {
        const cat = getExtStatusCategory(item);
        const stCarga = getRecargaExpirationStatus(item.vencimientoRecarga);
        const stPH = getPHExpirationStatus(item.vencimientoPH);
        return (
          <div>
            {cat === 'operativos' ? (
              <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Operativo Vigente
              </span>
            ) : cat === 'porVencer' ? (
              <span style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Próx. Vencer / Revisión
              </span>
            ) : (
              <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={14} /> Vencido / Baja
              </span>
            )}
            <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', marginTop: '4px' }}>
              Carga: {stCarga.expirationDate || '-'} • PH: {stPH.expirationDate || '-'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Controles Físicos',
      accessor: 'estadoFisico',
      render: (item: any) => {
        const mOk = item.checkManometro !== false;
        const pOk = item.checkPrecinto !== false;
        const sOk = item.checkSenalizacion !== false;
        const aOk = item.checkAcceso !== false;
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '210px' }}>
            <span style={{ backgroundColor: mOk ? '#f0fdf4' : '#fef2f2', color: mOk ? '#15803d' : '#dc2626', border: `1px solid ${mOk ? '#bbf7d0' : '#fecdd3'}`, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
              {mOk ? '✓' : '✕'} Manómetro
            </span>
            <span style={{ backgroundColor: pOk ? '#eff6ff' : '#fef2f2', color: pOk ? '#1d4ed8' : '#dc2626', border: `1px solid ${pOk ? '#bfdbfe' : '#fecdd3'}`, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
              {pOk ? '✓' : '✕'} Precinto
            </span>
            <span style={{ backgroundColor: sOk ? '#fff7ed' : '#fef2f2', color: sOk ? '#c2410c' : '#dc2626', border: `1px solid ${sOk ? '#fed7aa' : '#fecdd3'}`, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
              {sOk ? '✓' : '✕'} Baliza
            </span>
            <span style={{ backgroundColor: aOk ? '#fdf4ff' : '#fef2f2', color: aOk ? '#86198f' : '#dc2626', border: `1px solid ${aOk ? '#f5d0fe' : '#fecdd3'}`, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
              {aOk ? '✓' : '✕'} Acceso
            </span>
          </div>
        );
      }
    },
    {
      header: 'Última Inspec.',
      accessor: 'id',
      sortable: false,
      render: (item: any) => {
        const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
        if (!lastInspection) return <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Sin inspección</span>;
        const isOk = lastInspection.resultado === 'C' || lastInspection.resultado === 'APROBADO';
        return (
          <span style={{ color: isOk ? '#16a34a' : '#dc2626', fontWeight: '900', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} />
            {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPreviewItem(item)}
            title="Vista Previa e Impresión A4"
            style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> Previa
          </button>

          <button
            onClick={() => navigate(`/extintores/inspect/${item.id}`)}
            title="Inspeccionar Extintor NFPA 10"
            style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Insp
          </button>

          <button
            onClick={() => handleEdit(item)}
            title="Editar Extintor"
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>

          <button
            onClick={() => requirePro(() => generateQR(item))}
            title="Ver Código QR"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          <button
            onClick={() => requirePro(() => setShareItem(item))}
            title="Compartir / Exportar PDF"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          <button
            onClick={() => handleDelete(item.id)}
            title="Eliminar Extintor"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  const stats = { total: baseFiltered.length, vencidos: 0, porVencer: 0, operativos: 0 };
  baseFiltered.forEach((ext) => {
    const cat = getExtStatusCategory(ext);
    stats[cat]++;
  });
  const complRate = stats.total > 0 ? Math.round(((stats.total - stats.vencidos) / stats.total) * 100) : 100;

  return (
    <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
      <PremiumHeader
        onBack={showForm ? () => { setShowForm(false); setEditingId(null); } : undefined}
        title="Control de Matafuegos"
        subtitle="Gestión de extintores, vencimientos de carga y prueba hidráulica (IRAM 3517-2 / Dec. 351/79)"
        icon={<Flame size={36} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
      />

      {!showForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Registrados</span>
              <Flame size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <span className="text-[11px] text-slate-500">Equipos en padrón</span>
          </div>

          <div
            onClick={() => setStatusFilter('operativos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'operativos'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Operativos Vigentes</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.operativos}</div>
            <span className="text-[11px] text-slate-500">Equipos habilitados ({complRate}%)</span>
          </div>

          <div
            onClick={() => setStatusFilter('porVencer')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'porVencer'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Próximos a Vencer</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.porVencer}</div>
            <span className="text-[11px] text-slate-500">Vencen en ≤ 30 días / En revisión</span>
          </div>

          <div
            onClick={() => setStatusFilter('vencidos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'vencidos'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vencidos / Baja</span>
              <XCircle size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.vencidos}</div>
            <span className="text-[11px] text-slate-500">Requieren recarga o P.H.</span>
          </div>
        </div>
      )}

            {showGlobalSignatureModal && createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-[850px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in relative">
                        <h3 className="mt-0 font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2 text-lg">
                            <Pencil size={20} className="text-blue-500" /> Firmas del Reporte Global
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Seleccioná qué firmas aparecerán en el reporte final y dibujalas a continuación.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Operador / Relevador */}
                            <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${globalShowSignatures.operator ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 opacity-100' : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <input type="checkbox" checked={globalShowSignatures.operator} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, operator: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
                                    Responsable del Relevamiento
                                </label>
                                <div className={`bg-white dark:bg-slate-800 rounded-lg flex flex-col ${globalShowSignatures.operator ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                                    <SignatureCanvas
                  title=""
                  height={100}
                  onSave={(sig) => setGlobalSignaturesData((prev) => ({ ...prev, operatorSignature: sig }))}
                  initialImage={globalSignaturesData.operatorSignature} />
                
                                </div>
                            </div>

                            {/* Profesional Actuante */}
                            <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${globalShowSignatures.professional ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 opacity-100' : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                                <label className="flex items-center gap-2 cursor-pointer text-emerald-800 dark:text-emerald-300 font-bold text-sm border-b border-emerald-200 dark:border-emerald-800 pb-2">
                                    <input type="checkbox" checked={globalShowSignatures.professional} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, professional: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
                                    Profesional de Higiene y Seguridad
                                </label>
                                <div className="flex flex-col items-center justify-center flex-1 min-h-[150px] bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center mt-1">
                                    {professionalData?.signature ?
                                    <img src={professionalData.signature} alt="Firma Profesional" className="max-h-[65px] object-contain mb-3" /> :
                                    <span className="text-slate-400 italic mb-3 text-sm">Sin firma</span>
                                    }
                                    <p className="m-0 font-extrabold text-slate-800 dark:text-slate-200 text-base">{professionalData?.name || 'No configurado'}</p>
                                    <p className="m-0 font-bold text-slate-500 dark:text-slate-400 text-sm mt-1">{professionalData?.license ? `Mat. ${professionalData.license}` : 'Sin matrícula'}</p>
                                </div>
                            </div>

                            {/* Supervisor / Responsable del Establecimiento */}
                            <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${globalShowSignatures.supervisor ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 opacity-100' : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <input type="checkbox" checked={globalShowSignatures.supervisor} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, supervisor: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
                                    Responsable del Establecimiento / Supervisión
                                </label>
                                <div style={{ pointerEvents: globalShowSignatures.supervisor ? 'auto' : 'none' }} className="bg-white dark:bg-slate-800 rounded-[8px] border-none flex flex-col">
                                    <SignatureCanvas
                  title=""
                  height={100}
                  onSave={(sig) => setGlobalSignaturesData((prev) => ({ ...prev, supervisorSignature: sig }))}
                  initialImage={globalSignaturesData.supervisorSignature} />
                
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowGlobalSignatureModal(false)} style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none' }} className="py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm hover-scale">
                                Cancelar
                            </button>
                            <button onClick={() => setShowGlobalSignatureModal(false)} style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }} className="py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover-scale">
                                <CheckCircle2 size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>, document.body)
      }

            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => { setShareItem(null); setPrintItem(null); }}
        title={Array.isArray(shareItem) ? "Inventario de Extintores" : `Ficha Técnica - Extintor #${shareItem?.numero}`}
        text={shareItem ? Array.isArray(shareItem) ? `🧯 Inventario de Extintores\n📊 Total: ${shareItem.length}` : `📋 Ficha de Extintor\n🔥 Chapa: ${shareItem.numero}\n📍 Ubicación: ${shareItem.ubicacion}` : ''}
        rawMessage={''}
        elementIdToPrint="pdf-portal-container"
        isLandscape={Array.isArray(shareItem) && shareItem.length > 15}
        fileName={Array.isArray(shareItem) ? `Inventario_Extintores_${filterEmpresa || 'Completo'}.pdf` : `Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`} />

            {/* PDF offscreen para compartir — siempre en DOM, contenido condicional */}
            <div
              id="pdf-portal-container"
              className="ats-pdf-offscreen"
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: (Array.isArray(shareItem) && shareItem.length > 15) ? '297mm' : '210mm',
                height: 'auto',
                overflow: 'visible',
                opacity: 1,
                pointerEvents: 'none',
                zIndex: -9999,
                background: '#ffffff'
              }}>
              {shareItem && !Array.isArray(shareItem)
                ? <ExtinguisherProfilePdf data={shareItem} isHeadless={true} />
                : shareItem && Array.isArray(shareItem)
                  ? <ExtinguisherPdfGenerator
                      extinguishers={shareItem}
                      showSignatures={globalShowSignatures}
                      globalSignatures={globalSignaturesData} />
                  : null
              }
            </div>

            {/* Print portal — siempre en DOM, contenido condicional */}
            <div
              id="pdf-content-print"
              className="ats-pdf-offscreen"
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: (Array.isArray(printItem) && printItem.length > 15) ? '297mm' : '210mm',
                height: 'auto',
                overflow: 'visible',
                opacity: 1,
                pointerEvents: 'none',
                zIndex: -9999,
                background: '#ffffff'
              }}>
              {printItem && !Array.isArray(printItem)
                ? <ExtinguisherProfilePdf data={printItem} isHeadless={true} />
                : printItem && Array.isArray(printItem)
                  ? <ExtinguisherPdfGenerator
                      extinguishers={printItem}
                      showSignatures={globalShowSignatures}
                      globalSignatures={globalSignaturesData} />
                  : null
              }
            </div>

            {showCalendar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] min-h-[50vh] overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 style={{ color: 'var(--color-text)' }} className="text-2xl font-black flex items-center gap-2"><CalendarDays size={28} className="text-amber-500" /> Vencimientos Próximos</h2>
                            <button onClick={() => setShowCalendar(false)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}>✕</button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2 min-h-0 custom-scrollbar">
                            {(() => {
                                const now = new Date();
                                const grouped = filtered.reduce((acc, ext) => {
                                    const cDate = ext.vencimientoRecarga ? new Date(ext.vencimientoRecarga + 'T12:00:00Z') : null;
                                    if (cDate) {
                                        cDate.setFullYear(cDate.getFullYear() + 1);
                                        const k = cDate.getFullYear() + '-' + String(cDate.getMonth() + 1).padStart(2, '0');
                                        if (!acc[k]) acc[k] = [];
                                        acc[k].push({ ...ext, reason: 'Recarga Anual', date: cDate });
                                    }
                                    const phDate = ext.vencimientoPH ? new Date(ext.vencimientoPH + 'T12:00:00Z') : null;
                                    if (phDate) {
                                        phDate.setFullYear(phDate.getFullYear() + 5);
                                        const k = phDate.getFullYear() + '-' + String(phDate.getMonth() + 1).padStart(2, '0');
                                        if (!acc[k]) acc[k] = [];
                                        acc[k].push({ ...ext, reason: 'Prueba Hidráulica', date: phDate });
                                    }
                                    return acc;
                                }, {} as Record<string, any[]>);
                                
                                const sortedKeys = Object.keys(grouped).sort();
                                const upcomingKeys = sortedKeys.filter(k => {
                                    const parts = k.split('-');
                                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                                    return d >= new Date(now.getFullYear(), now.getMonth(), 1);
                                }).slice(0, 6);

                                if (upcomingKeys.length === 0) return <div className="text-center p-8 text-slate-500 dark:text-slate-400 font-bold">No hay vencimientos en los próximos meses.</div>;

                                return upcomingKeys.map(key => {
                                    const [y, m] = key.split('-');
                                    const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                                    return (
                                        <div key={key} className="mb-6">
                                            <h3 style={{ color: 'var(--color-text)' }} className="uppercase tracking-wider font-bold text-sm mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 opacity-80">{monthName} <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-2 py-0.5 rounded-full text-xs ml-2">{grouped[key].length}</span></h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {grouped[key].map((item: any, i: number) => (
                                                    <div key={i} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <p style={{ color: 'var(--color-text)' }} className="font-bold m-0 text-[15px]">{item.numero} - {item.tipo}</p>
                                                            <p style={{ color: 'var(--color-text)' }} className="text-xs m-0 mt-1 flex items-center gap-1 opacity-70"><MapPin size={12} className="text-red-500" /> {item.ubicacion}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[0.65rem] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-lg uppercase">{item.reason}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
            {showHistoryModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0">
                                    <History size={24} className="text-blue-500" /> Historial de Inspecciones
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold m-0 mt-1">
                                    Matafuego #{showHistoryModal.numero || showHistoryModal.chapa || ''} — {showHistoryModal.tipo || ''} ({showHistoryModal.ubicacion || ''})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handlePrintIndividualForm(showHistoryModal)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer border-none transition-transform hover:-translate-y-0.5"
                                    title="Imprimir Ficha Técnica de Extintor"
                                >
                                    <Printer size={16} /> Imprimir Ficha
                                </button>
                                <button 
                                    onClick={() => setShareItem(showHistoryModal)}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer border-none transition-transform hover:-translate-y-0.5"
                                    title="Compartir Ficha en PDF"
                                >
                                    <Share2 size={16} /> Compartir
                                </button>
                                <button 
                                    onClick={() => setShowHistoryModal(null)} 
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {(() => {
                                const historyRaw = safeGetLocalStorage<any[]>('extintores_history', []);
                                let pastInspections: any[] = [];
                                if (Array.isArray(historyRaw)) {
                                    pastInspections = historyRaw.filter((h: any) => 
                                        String(h.extintorId) === String(showHistoryModal.id) ||
                                        String(h.extintorNum) === String(showHistoryModal.numero || showHistoryModal.chapa)
                                    );
                                    pastInspections.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                                }
                                if (pastInspections.length === 0) return <div className="text-center p-8 text-slate-500 font-bold">No hay inspecciones registradas para este matafuego.</div>;
                                return pastInspections.map((insp: any, i: number) => {
                                    const isApproved = insp.resultado === 'Aprobado' || insp.resultado === 'APROBADO' || insp.resultado === 'C';
                                    const nonConformItems = insp.items ? insp.items.filter((it: any) => it.status === 'NC' || it.status === 'RECHAZADO') : [];

                                    return (
                                        <div key={i} className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-blue-500" />
                                                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                                        {new Date(insp.fecha).toLocaleDateString('es-AR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                                        {isApproved ? 'APROBADO' : 'RECHAZADO'}
                                                    </span>
                                                    <button 
                                                        onClick={() => handlePrintIndividualForm({ ...showHistoryModal, selectedInspection: insp })}
                                                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer border-none transition-transform hover:-translate-y-0.5"
                                                        title="Imprimir PDF de esta inspección"
                                                    >
                                                        <Printer size={13} /> Imprimir PDF
                                                    </button>
                                                    <button 
                                                        onClick={() => setShareItem({ ...showHistoryModal, selectedInspection: insp })}
                                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer border-none transition-transform hover:-translate-y-0.5"
                                                        title="Compartir PDF de esta inspección"
                                                    >
                                                        <Share2 size={13} /> Compartir
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-400 m-0">
                                                <span className="font-bold">Inspector:</span> {insp.inspector || 'Sin registrar'}
                                            </p>

                                            {nonConformItems.length > 0 && (
                                                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                                    <span className="text-xs font-bold text-red-700 dark:text-red-300 block mb-1">
                                                        ⚠️ Ítems No Conformes ({nonConformItems.length}):
                                                    </span>
                                                    <ul className="m-0 pl-4 text-xs text-red-600 dark:text-red-400">
                                                        {nonConformItems.map((nc: any, ncIdx: number) => (
                                                            <li key={ncIdx}>
                                                                <strong>{nc.text}</strong> {nc.notes ? `(${nc.notes})` : ''}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {insp.observaciones && (
                                                <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl m-0 font-medium border border-amber-200 dark:border-amber-800">
                                                    <strong>Obs:</strong> {insp.observaciones}
                                                </p>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
            {!showForm && expiredLifespans.length > 0 &&
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 p-4 sm:p-6 rounded-2xl flex items-start gap-4 mb-6">
                    <AlertTriangle color="#ef4444" size={24} className="shrink-0 mt-1" />
                    <div>
                        <h4 className="m-0 text-red-800 dark:text-red-400 font-extrabold text-base mb-1">Alerta de Vida Útil (20 años)</h4>
                        <p className="m-0 text-red-700 dark:text-red-300 text-sm leading-relaxed">
                            Tienes {expiredLifespans.length} extintor(es) que han superado o están a punto de superar los 20 años desde su fabricación. Según la normativa vigente, deben ser dados de baja definitivamente.
                        </p>
                    </div>
                </div>
      }


            {showForm ? (
              <div className="glass-card p-6 sm:p-8 mt-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 animate-fade-in">
                {(() => {
                  const recargaSt = formData.vencimientoRecarga ? getRecargaExpirationStatus(formData.vencimientoRecarga) : null;
                  const phSt = formData.vencimientoPH ? getPHExpirationStatus(formData.vencimientoPH) : null;
                  const vidaSt = formData.fechaFabricacion ? getLifespanStatus(formData.fechaFabricacion) : null;
                  const isInoperante = formData.estadoFisico === 'Fuera de Servicio' || formData.estadoFisico === 'Dado de Baja';

                  const regAlerts = [];
                  if (vidaSt && vidaSt.label.includes('BAJA')) {
                    regAlerts.push('Cilindro con vida útil cumplida (> 20 años desde fabricación). Según Norma IRAM 3517-2 debe ser retirado de servicio e inutilizado.');
                  }
                  if (recargaSt && recargaSt.label === 'Vencido') {
                    regAlerts.push(`Carga anual vencida (${recargaSt.expirationDate}). Debe enviarse a taller habilitado y colocarse extintor sustituto de igual potencial.`);
                  }
                  if (phSt && phSt.label === 'Vencido') {
                    regAlerts.push(`Prueba Hidráulica quinquenal (5 años) vencida (${phSt.expirationDate}). Prohibido recargar sin ensayo hidrostático previo.`);
                  }
                  if (isInoperante) {
                    regAlerts.push(`Equipo calificado como "${formData.estadoFisico}". No computa para cubrir el potencial extintor del sector (Dec. 351/79 Anexo VII).`);
                  }
                  if (formData.checkManometro === false || formData.checkPrecinto === false || formData.checkSenalizacion === false || formData.checkAcceso === false) {
                    regAlerts.push('Desvío físico en campo detectado (manómetro, precinto, baliza o acceso obstruido). Requiere acción correctiva inmediata.');
                  }

                  return (
                    <>
                      {/* Header del Formulario estilo Aptitudes Médicas */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditingId(null); }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer mr-1"
                            title="Volver al Padrón"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Flame size={22} />
                          </div>
                          <div>
                            <h2 className="m-0 text-xl font-extrabold text-slate-900 dark:text-white">
                              {editingId ? `Editar Matafuego #${formData.numero || ''}` : 'Nuevo Registro de Matafuego'}
                            </h2>
                            <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Complete los datos técnicos, fechas reglamentarias y controles IRAM 3517-2 / Dec. 351/79
                            </p>
                          </div>
                        </div>

                        <label className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2">
                          <Sparkles size={15} /> {isScanningMarbete ? 'Analizando marbete...' : 'Escanear Marbete con IA'}
                          <input type="file" accept="image/*" capture="environment" ref={marbeteCameraRef} onChange={handleMarbeteScan} className="hidden" />
                        </label>
                      </div>

                      {/* Banner de Auditoría Regulatoria en Vivo (Estilo Aptitudes Médicas) */}
                      {regAlerts.length > 0 ? (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                            <AlertOctagon size={16} /> Auditoría Regulatoria Dec. 351/79 Anexo VII &amp; Norma IRAM 3517-2
                          </div>
                          <ul className="m-0 pl-4 space-y-1 text-xs text-amber-900 dark:text-amber-200 font-semibold list-disc">
                            {regAlerts.map((alert, idx) => (
                              <li key={idx}>{alert}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span>Vigencia de carga anual, prueba hidráulica, vida útil y controles físicos conformes al Dec. 351/79 Anexo VII y Norma IRAM 3517-2.</span>
                        </div>
                      )}

                      {/* Grilla Principal de Campos Técnicos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nº Chapa / Identificador *</label>
                          <input
                            required
                            type="text"
                            value={formData.numero}
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. EXT-001 o Nº Marbete"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Razón Social / Establecimiento</label>
                          <input
                            type="text"
                            value={formData.empresa || ''}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. Planta Industrial S.A."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ubicación Física / Sector *</label>
                          <input
                            required
                            type="text"
                            value={formData.ubicacion}
                            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. Pasillo Principal / Sala de Tableros"
                          />
                        </div>

                        {/* Guía Oficial Dec. 351/79 Anexo VII & IRAM 3517-2 */}
                        <div className="col-span-full p-4 rounded-2xl bg-gradient-to-r from-amber-900/10 to-orange-900/10 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2 font-black text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            <Sparkles size={16} /> Guía Oficial Dec. 351/79 Anexo VII &amp; IRAM 3517-2 — Clases de Fuego y Agentes Extintores
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[
                              { id: 'a', label: '🔥 Clase A (Sólidos: Madera/Papel)', tip: 'Agentes: Agua, Espuma AFFF, Polvo ABC. Distancia máx: 20 metros.' },
                              { id: 'b', label: '🛢️ Clase B (Líquidos e Inflamables)', tip: 'Agentes: Polvo ABC, Espuma AFFF, CO2. Distancia máx: 15 metros.' },
                              { id: 'c', label: '⚡ Clase C (Riesgo Eléctrico)', tip: 'Agentes no conductores: CO2, Polvo ABC, Haloclean HCFC. Prohibido Agua/Espuma.' },
                              { id: 'd', label: '⚙️ Clase D (Metales Combustibles)', tip: 'Agentes especiales: Polvo específico para Magnesio, Sodio, Aluminio o Litio.' },
                              { id: 'k', label: '🍳 Clase K (Aceites y Cocinas)', tip: 'Agente específico: Acetato de Potasio (saponificación y enfriamiento).' }
                            ].map((item) => (
                              <div
                                key={item.id}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-sm cursor-default"
                                title={item.tip}
                              >
                                {item.label}
                              </div>
                            ))}
                          </div>
                          <p className="m-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            💡 Criterio reglamentario: Altura de montaje de 1,20 m a 1,50 m sobre el nivel del solado. Recarga obligatoria anual (1 año) y Prueba Hidráulica cada 5 años (IRAM 3517-2).
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tipo de Agente Extintor</label>
                          <select
                            value={formatType(formData.tipo)}
                            onChange={(e) => {
                              const nextTipo = e.target.value;
                              const defaultPot = nextTipo.includes('CO2') ? '5B C' : nextTipo === 'K' ? '2A K' : '3A 10B C';
                              setFormData({ ...formData, tipo: nextTipo, potencialExtintor: formData.potencialExtintor || defaultPot });
                            }}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer"
                          >
                            {types.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Capacidad Nominal</label>
                          {!(customCapacityMode || (Boolean(formData.capacidad) && !CAPACITY_PRESETS.includes(formData.capacidad))) ? (
                            <select
                              value={CAPACITY_PRESETS.includes(formData.capacidad) ? formData.capacidad : '5 kg'}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setCustomCapacityMode(true);
                                } else {
                                  setCustomCapacityMode(false);
                                  setFormData({ ...formData, capacidad: e.target.value });
                                }
                              }}
                              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer"
                            >
                              {CAPACITY_PRESETS.map((cap) => (
                                <option key={cap} value={cap}>{cap}</option>
                              ))}
                              <option value="__custom__">✏️ Personalizar / Editar...</option>
                            </select>
                          ) : (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={formData.capacidad}
                                onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                                className="w-full p-3 rounded-xl border border-amber-500 bg-white dark:bg-slate-900 font-semibold text-sm text-slate-900 dark:text-white outline-none"
                                placeholder="Ej: 7 kg"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomCapacityMode(false);
                                  if (!CAPACITY_PRESETS.includes(formData.capacidad)) {
                                    setFormData({ ...formData, capacidad: '5 kg' });
                                  }
                                }}
                                className="px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 shrink-0 cursor-pointer"
                              >
                                Lista
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Potencial Extintor (Dec. 351/79)</label>
                          <select
                            value={formData.potencialExtintor || '3A 10B C'}
                            onChange={(e) => setFormData({ ...formData, potencialExtintor: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="1A 2B C">1A 2B C (1 kg / 2.5 kg)</option>
                            <option value="3A 10B C">3A 10B C (5 kg Estándar)</option>
                            <option value="6A 40B C">6A 40B C (5 kg / 10 kg Alta Eficiencia)</option>
                            <option value="10A 60B C">10A 60B C (10 kg / 25 kg Industrial)</option>
                            <option value="20A 80B C">20A 80B C (Carro 25 kg / 50 kg)</option>
                            <option value="5B C">5B C (CO₂ 3.5 kg / 5 kg)</option>
                            <option value="10B C">10B C (CO₂ 10 kg)</option>
                            <option value="2A">2A (Agua 10 lts)</option>
                            <option value="2A 10B">2A 10B (Espuma AFFF 10 lts)</option>
                            <option value="2A K">2A K (Acetato de Potasio 6 lts / 10 lts)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Marca / Fabricante</label>
                          <input
                            type="text"
                            value={formData.marca}
                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. Melisam, Georgia, Yukon, Drago..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nº de Serie del Cilindro</label>
                          <input
                            type="text"
                            value={formData.numeroSerie}
                            onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Acuñado en ojiva del cilindro"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sello IRAM / Marbete OPDS-GCBA</label>
                          <input
                            type="text"
                            value={formData.selloIRAM}
                            onChange={(e) => setFormData({ ...formData, selloIRAM: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. DPS-123456 / IRAM 3517"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Taller Recargador Habilitado</label>
                          <input
                            type="text"
                            value={formData.recargadora || ''}
                            onChange={(e) => setFormData({ ...formData, recargadora: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Nombre o Nº de Registro del Taller"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Soporte y Altura de Montaje</label>
                          <select
                            value={formData.tipoMontaje || 'Soporte mural (1.20m - 1.50m)'}
                            onChange={(e) => setFormData({ ...formData, tipoMontaje: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="Soporte mural (1.20m - 1.50m)">Soporte mural con chapa baliza (1,20m - 1,50m)</option>
                            <option value="Gabinete / Nicho vidriado">Gabinete / Nicho metálico señalizado</option>
                            <option value="Pedestal / Columna baliza">Pedestal / Columna de piso demarcada</option>
                            <option value="Carro rodante">Carro rodante de intervención</option>
                            <option value="Soporte vehicular">Soporte vehicular con abrazadera rápida</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dictamen / Estado Operativo</label>
                          <select
                            value={formData.estadoFisico || 'Operativo'}
                            onChange={(e) => {
                              const nextEst = e.target.value;
                              const isBaja = nextEst === 'Fuera de Servicio' || nextEst === 'Dado de Baja';
                              setFormData((prev: any) => ({
                                ...prev,
                                estadoFisico: nextEst,
                                checkManometro: isBaja ? false : prev.checkManometro,
                                checkPrecinto: isBaja ? false : prev.checkPrecinto
                              }));
                            }}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-extrabold text-sm cursor-pointer"
                            style={{
                              color: formData.estadoFisico === 'Operativo' ? '#10b981' :
                                     formData.estadoFisico === 'Fuera de Servicio' || formData.estadoFisico === 'Dado de Baja' ? '#ef4444' : '#f59e0b'
                            }}
                          >
                            <option value="Operativo">🟢 OPERATIVO Y HABILITADO</option>
                            <option value="Revisión">🟡 EN REVISIÓN / CON OBSERVACIONES</option>
                            <option value="En Recarga">🔄 EN RECARGA (TALLER / CON SUSTITUTO)</option>
                            <option value="Fuera de Servicio">🔴 FUERA DE SERVICIO (DESPRESURIZADO / DAÑADO)</option>
                            <option value="Dado de Baja">⚫ DADO DE BAJA (VIDA ÚTIL CUMPLIDA &gt;20 AÑOS)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha de Fabricación (20 Años máx)</label>
                          <input
                            type="date"
                            value={formData.fechaFabricacion}
                            onChange={(e) => setFormData({ ...formData, fechaFabricacion: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                          />
                          {vidaSt && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: vidaSt.bg, color: vidaSt.color }}>
                              {vidaSt.icon} {vidaSt.label}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha Última Recarga (Anual) *</label>
                          <input
                            required
                            type="date"
                            value={formData.vencimientoRecarga}
                            onChange={(e) => setFormData({ ...formData, vencimientoRecarga: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                          />
                          {recargaSt?.expirationDate && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: recargaSt.bg, color: recargaSt.color }}>
                              {recargaSt.icon} {recargaSt.label} (Vto: {recargaSt.expirationDate})
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha Última Prueba Hidráulica (5 Años)</label>
                          <input
                            type="date"
                            value={formData.vencimientoPH}
                            onChange={(e) => setFormData({ ...formData, vencimientoPH: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                          />
                          {phSt?.expirationDate && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: phSt.bg, color: phSt.color }}>
                              {phSt.icon} {phSt.label} (Vto: {phSt.expirationDate})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tarjetas Interactivas de Verificación Física en Campo (Estilo Aptitudes Médicas) */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Verificación Física Rápida en Campo (IRAM 3517-2 / NFPA 10)
                          </span>
                          {isInoperante && (
                            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                              ⛔ Equipo Fuera de Servicio / Dado de Baja
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'checkManometro', label: 'Manómetro en Zona Verde', icon: <Activity size={18} /> },
                            { key: 'checkPrecinto', label: 'Precinto y Chaveta Intactos', icon: <ShieldCheck size={18} /> },
                            { key: 'checkSenalizacion', label: 'Chapa Baliza y Señalización', icon: <Flame size={18} /> },
                            { key: 'checkAcceso', label: 'Acceso Libre (Sin Obstrucción)', icon: <MapPin size={18} /> }
                          ].map((chk) => {
                            const isOk = formData[chk.key] !== false;
                            return (
                              <div
                                key={chk.key}
                                onClick={() => setFormData((prev: any) => ({ ...prev, [chk.key]: !isOk }))}
                                style={{
                                  backgroundColor: isOk ? '#dcfce7' : '#fff5f5',
                                  border: isOk ? '2px solid #16a34a' : '1px solid #fca5a5',
                                  color: isOk ? '#15803d' : '#991b1b',
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  userSelect: 'none'
                                }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span style={{ color: isOk ? '#16a34a' : '#dc2626' }}>{chk.icon}</span>
                                  <span style={{ fontSize: '12px', fontWeight: '800' }}>{chk.label}</span>
                                </div>
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    backgroundColor: isOk ? '#16a34a' : '#ef4444',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: '900'
                                  }}
                                >
                                  {isOk ? '✓' : '✕'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Observaciones y Evidencia Fotográfica */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Observaciones Técnicas y Recomendaciones de Mantenimiento
                          </label>
                          <textarea
                            value={formData.observaciones || ''}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                            placeholder="Ej. Verificar estado de manguera y tobera mensualmente. Mantener despejado a 1,50 m de radio..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Fotografía del Equipo (Opcional)
                          </label>
                          <div className="flex items-center gap-3">
                            <label className={`flex-1 py-3 px-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-dashed border-blue-500/40 rounded-xl cursor-pointer flex items-center justify-center gap-2 font-extrabold text-xs transition-opacity ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}>
                              <Camera size={18} /> {isUploadingPhoto ? 'Optimizando...' : 'Subir / Tomar Foto'}
                              <input type="file" accept="image/*" disabled={isUploadingPhoto} onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            {formData.foto && (
                              <div className="relative w-[64px] h-[64px] rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-sm shrink-0">
                                <img src={formData.foto} alt="Extintor" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, foto: null })}
                                  className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white border-none w-[20px] h-[20px] text-[10px] flex items-center justify-center cursor-pointer"
                                  title="Eliminar foto"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ─── SECCIÓN 4: FIRMAS DIGITALIZADAS Y VALIDACIÓN DOCUMENTAL (ESTILO APTITUDES MÉDICAS) ─── */}
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              <Pencil size={20} />
                            </div>
                            <div>
                              <h4 className="m-0 font-black text-sm uppercase text-slate-900 dark:text-white tracking-tight">
                                4. Firmas Digitalizadas y Validación Documental
                              </h4>
                              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Si el responsable del sector no está presente ahora, su recuadro queda en blanco para firmar en campo. El Profesional H&amp;S queda firmado digitalmente.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Selector de Firmas a Incluir en la Ficha */}
                        <div className="p-5 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col gap-3 items-center justify-center">
                          <div className="text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider">
                            INCLUIR FIRMAS EN LA FICHA IMPRESA / PDF:
                          </div>
                          <div className="flex gap-3 flex-wrap justify-center">
                            {[
                              { id: 'operator', label: 'Responsable / Operador (Opcional en planta)' },
                              { id: 'supervisor', label: 'Supervisor / Cliente' },
                              { id: 'professional', label: 'Profesional H&S (Digitalizada)' }
                            ].map((sig) => {
                              const isChecked = !!formData.showSignatures?.[sig.id];
                              return (
                                <label
                                  key={sig.id}
                                  className="flex items-center gap-2 cursor-pointer select-none px-3.5 py-2 rounded-full font-extrabold text-xs transition-all text-center"
                                  style={{
                                    border: isChecked ? '1.5px solid #059669' : '1px solid #cbd5e1',
                                    background: isChecked ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
                                    color: isChecked ? '#059669' : '#64748b'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) =>
                                      setFormData((prev: any) => ({
                                        ...prev,
                                        showSignatures: {
                                          ...prev.showSignatures,
                                          [sig.id]: e.target.checked
                                        }
                                      }))
                                    }
                                    className="hidden"
                                  />
                                  <div
                                    style={{
                                      border: isChecked ? '2px solid #059669' : '2px solid #94a3b8',
                                      background: isChecked ? '#059669' : 'transparent'
                                    }}
                                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                                  >
                                    {isChecked && <CheckCircle2 size={12} color="white" />}
                                  </div>
                                  {sig.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Vista Previa Visual en Vivo de los Recuadros de Firma */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center mb-1">
                            VISTA PREVIA DE FIRMAS EN EL DOCUMENTO
                          </div>
                          <PdfSignatures
                            data={{
                              ...formData,
                              professionalSignature: formData.professionalSignature || professionalData?.signature,
                              professionalStamp: professionalData?.stamp,
                              professionalName: formData.professionalName || professionalData?.name,
                              professionalLicense: formData.professionalLicense || professionalData?.license
                            }}
                            box1={
                              formData.showSignatures?.operator
                                ? {
                                    title: 'RESPONSABLE / OPERADOR',
                                    subtitle: 'FIRMA EN PLANTA / ACLARACIÓN',
                                    signatureUrl: formData.operatorSignature || null,
                                    isProfessional: false
                                  }
                                : null
                            }
                            box2={
                              formData.showSignatures?.supervisor
                                ? {
                                    title: 'SUPERVISOR / CLIENTE',
                                    subtitle: (formData.empresa || 'FIRMA Y SELLO SUPERVISOR').toUpperCase(),
                                    signatureUrl: formData.supervisorSignature || null,
                                    isProfessional: false
                                  }
                                : null
                            }
                            box3={
                              formData.showSignatures?.professional
                                ? {
                                    title: 'PROFESIONAL HIGIENE Y SEGURIDAD',
                                    subtitle: (formData.professionalName || professionalData?.name || 'FIRMA Y SELLO PROFESIONAL').toUpperCase(),
                                    signatureUrl: formData.professionalSignature || professionalData?.signature || null,
                                    stampUrl: professionalData?.stamp || null,
                                    isProfessional: true,
                                    license: formData.professionalLicense || professionalData?.license || null
                                  }
                                : null
                            }
                          />
                        </div>

                        {/* Paneles Interactivos de Firma Digital en Pantalla */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                          {formData.showSignatures?.operator && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                              <SignatureCanvas
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                initialImage={formData.operatorSignature}
                                label="Firma del Responsable / Operador (Opcional)"
                              />
                            </div>
                          )}

                          {formData.showSignatures?.supervisor && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                              <SignatureCanvas
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                                initialImage={formData.supervisorSignature}
                                label="Firma del Supervisor / Cliente (Opcional)"
                              />
                            </div>
                          )}

                          {formData.showSignatures?.professional && (
                            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl shadow-xs">
                              <SignatureCanvas
                                onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                initialImage={formData.professionalSignature || professionalData?.signature || ''}
                                label={`Firma Profesional H&S (${formData.professionalName || professionalData?.name || 'Actuante'})`}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción Inferiores Estilo Aptitudes Médicas */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => { setShowForm(false); setEditingId(null); }}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '12px 24px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}
                        >
                          <ArrowLeft size={18} /> Cancelar / Volver
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewItem({ ...formData, id: formData.id || editingId || 'ext-' + Date.now() })}
                          style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '12px 24px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                        >
                          <Printer size={18} /> Vista Previa / Imprimir A4
                        </button>
                        <button
                          type="button"
                          onClick={() => requirePro(() => handleSave({ preventDefault: () => {} } as any))}
                          style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '12px 28px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
                        >
                          <CheckCircle2 size={18} />
                          <span>{editingId ? 'Actualizar Matafuego' : 'Guardar Matafuego'}</span>
                        </button>
                      </div>

                      <ModuleActionBar
                        className="bottom-20 md:bottom-6"
                        actions={[
                          {
                            id: 'cancel',
                            label: 'Cancelar',
                            icon: <ArrowLeft size={16} />,
                            variant: 'secondary',
                            onClick: () => { setShowForm(false); setEditingId(null); }
                          },
                          ...(editingId ? [{
                            id: 'history',
                            label: 'Historial',
                            icon: <History size={16} />,
                            variant: 'info' as const,
                            onClick: () => setShowHistoryModal(formData)
                          }] : []),
                          {
                            id: 'preview',
                            label: 'Vista Previa A4',
                            icon: <Eye size={16} />,
                            variant: 'primary',
                            hideOnMobile: true,
                            onClick: () => setPreviewItem({ ...formData, id: formData.id || editingId || 'ext-' + Date.now() })
                          },
                          {
                            id: 'share',
                            label: 'Compartir',
                            icon: <Share2 size={16} />,
                            variant: 'warning',
                            onClick: () => setShareItem({ ...formData, id: formData.id || editingId || 'ext-' + Date.now() })
                          },
                          {
                            id: 'save',
                            label: editingId ? 'Actualizar' : 'Guardar Matafuego',
                            icon: <Save size={16} />,
                            variant: 'primary',
                            onClick: () => requirePro(() => handleSave({ preventDefault: () => {} } as any))
                          }
                        ]}
                      />
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Vista de Padrón e Historial Estilo Aptitudes Médicas */
              <div className="mt-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Buscador + Filtro Empresa Compactos */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full md:w-auto">
                    <div className="relative flex-1 sm:max-w-xs h-[38px]">
                      <Search
                        size={16}
                        className="text-slate-400 pointer-events-none z-10"
                        style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: 0,
                          bottom: 0,
                          marginTop: 'auto',
                          marginBottom: 'auto',
                          display: 'block'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Buscar chapa, tipo o ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <select
                      value={filterEmpresa}
                      onChange={(e) => setFilterEmpresa(e.target.value)}
                      style={{ height: '38px', padding: '0 12px', outline: 'none' }}
                      className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer focus:border-blue-500"
                    >
                      <option value="">🏢 Todas las Empresas</option>
                      {uniqueEmpresas.map((emp) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Botones de Acción Compactos Estilo Aptitudes Médicas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={downloadTemplate}
                      title="Descargar plantilla Excel en blanco"
                      style={{
                        backgroundColor: '#475569',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        height: '34px'
                      }}
                    >
                      <DownloadCloud size={14} />
                      <span>Plantilla</span>
                    </button>

                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      title="Importar matafuegos masivamente desde Excel/CSV"
                      style={{
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        height: '34px'
                      }}
                    >
                      <UploadCloud size={14} />
                      <span>Importar</span>
                    </button>

                    <button
                      onClick={() => setShowCalendar(true)}
                      title="Calendario de próximos vencimientos"
                      style={{
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        height: '34px'
                      }}
                    >
                      <CalendarDays size={14} />
                      <span>Vencimientos</span>
                    </button>

                    <button
                      onClick={() => requirePro(handleExportExcel)}
                      title="Exportar padrón de extintores en Excel"
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <FileSpreadsheet size={14} />
                      <span>Exportar Excel</span>
                    </button>

                    {filtered.length > 0 && (
                      <button
                        onClick={() => requirePro(handlePrintPdf)}
                        title="Imprimir padrón completo en A4"
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                          height: '34px'
                        }}
                      >
                        <Printer size={14} />
                        <span>Imprimir A4</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate('/extinguisher-ai')}
                      title="Escanear manómetro y extintor con Visión IA"
                      style={{
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Matafuegos IA</span>
                    </button>

                    <button
                      onClick={() => requirePro(() => { setEditingId(null); setShowForm(true); })}
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      <Plus size={14} />
                      <span>Nuevo Matafuego</span>
                    </button>
                  </div>
                </div>

                {/* Pestañas de Filtro (Filter Tabs) Estilo Aptitudes Médicas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    style={{
                      backgroundColor: statusFilter === 'all' ? '#2563eb' : '#ffffff',
                      color: statusFilter === 'all' ? '#ffffff' : '#334155',
                      border: statusFilter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Todos ({stats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('operativos')}
                    style={{
                      backgroundColor: statusFilter === 'operativos' ? '#059669' : '#ffffff',
                      color: statusFilter === 'operativos' ? '#ffffff' : '#334155',
                      border: statusFilter === 'operativos' ? '1px solid #059669' : '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Operativos Vigentes ({stats.operativos})
                  </button>
                  <button
                    onClick={() => setStatusFilter('porVencer')}
                    style={{
                      backgroundColor: statusFilter === 'porVencer' ? '#d97706' : '#ffffff',
                      color: statusFilter === 'porVencer' ? '#ffffff' : '#334155',
                      border: statusFilter === 'porVencer' ? '1px solid #d97706' : '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Próximos a Vencer / Revisión ({stats.porVencer})
                  </button>
                  <button
                    onClick={() => setStatusFilter('vencidos')}
                    style={{
                      backgroundColor: statusFilter === 'vencidos' ? '#dc2626' : '#ffffff',
                      color: statusFilter === 'vencidos' ? '#ffffff' : '#334155',
                      border: statusFilter === 'vencidos' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Vencidos / Baja ({stats.vencidos})
                  </button>
                </div>

                {/* Tabla de Datos en Tarjeta Limpia */}
                <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <DataTable
                    data={filtered}
                    columns={columns}
                    searchPlaceholder=""
                    emptyMessage="No hay matafuegos registrados."
                    emptyIcon={<Flame size={48} />}
                    hideHeader={true}
                  />
                </div>

                {!showGlobalSignatureModal && !showCalendar && !showHistoryModal && !showQrModal && !shareItem && !showBulkImportModal && !previewItem && (
                  <ModuleActionBar
                    className="bottom-20 md:bottom-6"
                    actions={[
                      {
                        id: 'new-ext',
                        label: 'Nuevo Matafuego',
                        icon: <Plus size={16} />,
                        variant: 'primary',
                        onClick: () => requirePro(() => { setEditingId(null); setShowForm(true); })
                      },
                      {
                        id: 'ai-ext',
                        label: 'Matafuegos IA',
                        icon: <Sparkles size={16} />,
                        variant: 'info',
                        onClick: () => navigate('/extinguisher-ai')
                      },
                      {
                        id: 'cal-ext',
                        label: 'Vencimientos',
                        icon: <CalendarDays size={16} />,
                        variant: 'warning',
                        hideOnMobile: true,
                        onClick: () => setShowCalendar(true)
                      }
                    ]}
                  />
                )}
              </div>
            )}

            {/* Modal de Vista Previa A4 e Impresión Directa (Estilo Aptitudes Médicas) */}
            {previewItem && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
                <div className="relative w-full max-w-[920px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700/80 bg-slate-800/90 select-none flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-white leading-tight m-0">
                          Vista Previa de Impresión A4 (1 Hoja)
                        </h2>
                        <p className="text-xs text-slate-400 m-0">
                          Ficha Técnica de Extintor • Chapa #{previewItem.numero || '-'} ({previewItem.tipo || 'ABC'} - {previewItem.capacidad || '5 kg'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => printElementAsDocument('pdf-modal-preview-extinguisher', `Ficha_Extintor_${previewItem.numero || 'Equipo'}`)}
                        style={{ backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: '900', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Printer size={16} /> Imprimir / PDF
                      </button>
                      <button
                        onClick={() => setPreviewItem(null)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer bg-transparent border-none"
                        title="Cerrar vista previa"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
                    <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                      <ExtinguisherProfilePdf
                        data={previewItem}
                        isHeadless={true}
                        pdfElementId="pdf-modal-preview-extinguisher"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar extintor?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      

            {/* QR Modal with Printable A6 Label */}
            {showQrModal && qrData && createPortal(
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-qr-label, #printable-qr-label * { visibility: visible; }
                        #printable-qr-label {
                            position: fixed;
                            left: 0; top: 0;
                            width: 105mm; height: 148mm; /* A6 size */
                            padding: 10mm;
                            margin: 0;
                            background: white !important;
                            border: none !important;
                            box-shadow: none !important;
                            transform: scale(1) !important;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: space-between;
                        }
                    }
                `}</style>
                <div className="animate-fade-in w-[100%] max-w-[400px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-0 overflow-hidden relative shadow-2xl flex flex-col" style={{ maxHeight: '95vh' }}>
                    
                    {/* The Printable A6 Template Area */}
                    <div id="printable-qr-label" className="p-6 flex flex-col items-center bg-white border-b-2 border-dashed border-slate-200 overflow-y-auto relative">
                        <button
                          onClick={() => setShowQrModal(false)}
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            zIndex: 50
                          }}
                          className="no-print hover:scale-110 active:scale-95 transition-all"
                          title="Cerrar ventana"
                        >
                          ✕
                        </button>
                        
                        <div className="w-full text-center border-b-2 border-slate-800 pb-4 mb-4 mt-2">
                            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1 m-0">CONTROL DE EXTINTOR</h2>
                            <h1 className="m-0 text-slate-900 font-black text-3xl">{qrData.ext.numero}</h1>
                        </div>
                        
                        <div className="w-full flex flex-col gap-3 mb-6">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo y Capacidad</span>
                                <span className="block text-base font-black text-slate-800">{qrData.ext.tipo} - {qrData.ext.capacidad}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación Asignada</span>
                                <span className="block text-base font-black text-slate-800">{qrData.ext.ubicacion}</span>
                            </div>
                            {qrData.ext.vencimientoRecarga && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <span className="block text-xs font-bold text-blue-600 uppercase mb-1">Próximo Venc. Recarga</span>
                                    <span className="block text-base font-black text-blue-900">
                                        {(() => {
                                            const d = new Date(qrData.ext.vencimientoRecarga + 'T12:00:00Z');
                                            d.setFullYear(d.getFullYear() + 1);
                                            return d.toLocaleDateString('es-AR');
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100 relative group w-40 h-40 flex items-center justify-center mx-auto">
                            <img src={qrData.url} alt="QR Extintor" className="w-[100%] h-[100%] block" />
                        </div>
                        
                        <p className="mt-6 mb-0 text-xs text-slate-400 font-bold tracking-wider uppercase text-center w-full">
                            ESCANEE PARA INSPECCIÓN Y TRAZABILIDAD
                        </p>
                    </div>
                    
                    {/* Modal Controls (Not Printable) */}
                    <div className="no-print p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2 shrink-0">
                        <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff', border: 'none' }} className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95">
                            <Printer size={18} /> IMPRIMIR ETIQUETA A6
                        </button>
                        <button onClick={() => {
                            const a = document.createElement('a');
                            a.href = qrData.url;
                            a.download = `QR_${qrData.ext.numero}.png`;
                            a.click();
                        }} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none' }} className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95">
                            <QrCode size={18} /> DESCARGAR IMAGEN QR
                        </button>
                    </div>
                    </div>
                </div>, document.body)
      }
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportConfirmed={handleBulkImportConfirm}
      />
    </div>
  );
}