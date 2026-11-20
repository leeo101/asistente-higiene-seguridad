import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Plus,
  Search,
  MapPin,
  QrCode,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Calendar,
  Edit3,
  Trash2,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Share2,
  Pencil,
  Download,
  FileSpreadsheet,
  CalendarDays,
  History,
  UploadCloud,
  DownloadCloud,
  Info,
  Save,
  Settings,
  ChevronDown,
  Sparkles,
  XCircle
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';
import { getErrorMessage } from '../utils/errorUtils';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import { compressImage } from '../utils/imageCompressor';
import SignatureCanvas from '../components/SignatureCanvas';
import { DataTable } from '../components/DataTable';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import ExcelJS from 'exceljs';
import { BulkImportModal } from '../components/BulkImportModal';
import { ExtinguisherImportRow } from '../utils/dataImporterExporter';
import { printElementAsDocument } from '../utils/pdfHelper';
import { analyzeExtinguisherLocally } from '../utils/localVisionAnalyzer';
import { publishPublicVerification } from '../services/cloudSync';

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

  const [extintores, setExtintores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vencidos' | 'porVencer' | 'operativos'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);
  const [printItem, setPrintItem] = useState<any | null>(null);
  const [viewingPdf, setViewingPdf] = useState<any | null>(null);

  const [globalShowSignatures, setGlobalShowSignatures] = useState({
    operator: false,
    professional: true,
    supervisor: false
  });
  const [globalSignaturesData, setGlobalSignaturesData] = useState({
    operatorSignature: '',
    supervisorSignature: ''
  });
  const [showGlobalSignatureModal, setShowGlobalSignatureModal] = useState(false);

  const [formData, setFormData] = useState<any>({
    numero: '',
    numeroSerie: '',
    tipo: 'ABC (PQS)',
    ubicacion: '',
    empresa: '',
    marca: '',
    fechaFabricacion: '',
    vencimientoRecarga: '',
    vencimientoPH: '',
    selloIRAM: '',
    estadoFisico: 'Operativo',
    foto: null,
    showSignatures: { professional: true, supervisor: false, operator: false },
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    professionalName: '',
    professionalLicense: ''
  });
  const [professionalData, setProfessionalData] = useState({
    name: '',
    license: '',
    signature: null as string | null,
    stamp: null as string | null
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<any | null>(null);

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
              ...(token ? { Authorization: `Bearer ${token}` } : {})
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

        setFormData((prev: any) => ({
          ...prev,
          tipo: mappedAgent,
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
      setFormData((prev: any) => ({
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
      const compressed = await compressImage(file, {
        maxDimension: 800,
        quality: 0.72,
        mimeType: 'image/jpeg'
      });
      if (compressed) {
        setFormData((prev: any) => ({ ...prev, foto: compressed }));
        toast.success('Foto cargada y optimizada con éxito', { id: toastId });
      } else {
        toast.error('No se pudo procesar la imagen seleccionada', { id: toastId });
      }
    } catch (err) {
      console.warn('[ExtintoresManager] Error compressing photo:', err);
      toast.error('Error al procesar la imagen', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
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
      { header: 'Ubicación', key: 'ubicacion', width: 25 },
      { header: 'Fecha Fabricación (YYYY-MM-DD)', key: 'fechaFabricacion', width: 30 },
      { header: 'Venc. Recarga (YYYY-MM-DD)', key: 'vencimientoRecarga', width: 30 },
      { header: 'Venc. PH (YYYY-MM-DD)', key: 'vencimientoPH', width: 30 },
      { header: 'Sello IRAM', key: 'selloIRAM', width: 15 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Nº Serie', key: 'numeroSerie', width: 15 }
    ];
    sheet.addRow({
      numero: 'EXT-001',
      empresa: 'Mi Empresa',
      tipo: 'ABC (PQS)',
      ubicacion: 'Pasillo Principal',
      fechaFabricacion: '2023-01-01',
      vencimientoRecarga: '2023-01-01',
      vencimientoPH: '2023-01-01',
      selloIRAM: '12345',
      marca: 'Georgia',
      numeroSerie: '987654'
    });
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Extintores.xlsx';
      a.click();
    });
  };

  const handleBulkImportConfirm = (items: ExtinguisherImportRow[]) => {
    const nuevos = items.map((item, idx) => ({
      id: Date.now().toString() + '_' + idx,
      numero: item.code,
      tipo: item.type,
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
      let combined: any[] = [];

      if (oldDataStr) {
        try {
          combined = [...combined, ...JSON.parse(oldDataStr)];
        } catch (e) {}
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

      const migrated = combined.map((ext: any) => ({
        ...ext,
        numero: ext.numero || ext.chapa || '',
        vencimientoRecarga: ext.vencimientoRecarga || ext.ultimaCarga || '',
        vencimientoPH: ext.vencimientoPH || ext.ultimaPH || ''
      }));
      setExtintores(migrated);
    };
    loadData();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit') || searchParams.get('id') || (location.state as any)?.editId;
    if (editId && extintores.length > 0) {
      const extToEdit = extintores.find(
        (e: any) => String(e.id) === String(editId) || String(e.numero) === String(editId)
      );
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
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2146828281) {
        try {
          const sanitizedData = data.map((item, idx) => {
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
      setExtintores(data);
      toast.error(
        'Atención: El almacenamiento local del navegador está lleno. Los datos están en memoria pero podrían no persistir si recarga sin sincronizar.'
      );
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
      updated = extintores.map((ext) => (ext.id === editingId ? newEntry : ext));
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
      ubicacion: '',
      marca: '',
      fechaFabricacion: '',
      vencimientoRecarga: '',
      vencimientoPH: '',
      selloIRAM: '',
      estadoFisico: 'Operativo',
      foto: null,
      empresa: '',
      showSignatures: { professional: true, supervisor: false, operator: false },
      operatorSignature: '',
      supervisorSignature: '',
      professionalSignature: professionalData?.signature || '',
      professionalName: professionalData?.name || '',
      professionalLicense: professionalData?.license || ''
    });
  };

  const handleEdit = (ext: any) => {
    setFormData(ext);
    setEditingId(ext.id);
    setShowForm(true);
  };

  const handleDelete = async (id: any) => {
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

  const generateQR = async (ext: any) => {
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const link = `${window.location.origin}/v/${uid}/extintor/${ext.id}`;
      const url = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrData({ ext, url, link });
      setShowQrModal(true);
      publishPublicVerification(uid, 'extintor', ext.id, ext).catch(() => {});
    } catch (err) {
      toast.error('Error al generar QR');
      console.error(err);
    }
  };

  // Calculate Recarga expiration status (add 1 year to the performed date)
  const getRecargaExpirationStatus = (dateStr: any) => {
    if (!dateStr)
      return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'Sin Datos', icon: <AlertTriangle size={13} />, expirationDate: null };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime()))
      return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'Sin Datos', icon: <AlertTriangle size={13} />, expirationDate: null };
    d.setFullYear(d.getFullYear() + 1);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = d.toLocaleDateString('es-AR');
    if (diffDays < 0)
      return {
        color: '#dc2626',
        label: 'Vencido',
        bg: '#fef2f2',
        border: '#fecdd3',
        icon: <AlertTriangle size={13} />,
        expirationDate: expDate
      };
    if (diffDays <= 30)
      return {
        color: '#d97706',
        label: 'Por vencer',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <AlertTriangle size={13} />,
        expirationDate: expDate
      };
    return {
      color: '#059669',
      label: 'Vigente',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <CheckCircle2 size={13} />,
      expirationDate: expDate
    };
  };

  // Calculate PH expiration status (add 5 years to the performed date)
  const getPHExpirationStatus = (dateStr: any) => {
    if (!dateStr)
      return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'Sin Datos', icon: <AlertTriangle size={13} />, expirationDate: null };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime()))
      return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'Sin Datos', icon: <AlertTriangle size={13} />, expirationDate: null };
    d.setFullYear(d.getFullYear() + 5);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = d.toLocaleDateString('es-AR');
    if (diffDays < 0)
      return {
        color: '#dc2626',
        label: 'Vencido',
        bg: '#fef2f2',
        border: '#fecdd3',
        icon: <AlertTriangle size={13} />,
        expirationDate: expDate
      };
    if (diffDays <= 30)
      return {
        color: '#d97706',
        label: 'Por vencer',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <AlertTriangle size={13} />,
        expirationDate: expDate
      };
    return {
      color: '#059669',
      label: 'Vigente',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <CheckCircle2 size={13} />,
      expirationDate: expDate
    };
  };

  // Calculate 20 year lifespan status
  const getLifespanStatus = (fechaFab: any) => {
    if (!fechaFab) return null;
    const d = new Date(fechaFab);
    const limitDate = new Date(d);
    limitDate.setFullYear(limitDate.getFullYear() + 20);

    const today = new Date();
    const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        color: '#dc2626',
        label: 'DAR DE BAJA (Vida útil cumplida)',
        bg: '#fef2f2',
        border: '#fecdd3',
        icon: <AlertTriangle size={13} />
      };
    if (diffDays <= 180)
      return {
        color: '#d97706',
        label: 'Por vencer vida útil (20 años)',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <AlertTriangle size={13} />
      };
    return {
      color: '#059669',
      label: 'Vigente',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <CheckCircle2 size={13} />
    };
  };

  const getExtStatusCategory = (ext: any): 'vencidos' | 'porVencer' | 'operativos' => {
    const stCarga = getRecargaExpirationStatus(ext.vencimientoRecarga);
    const stPH = getPHExpirationStatus(ext.vencimientoPH);
    const stVida = getLifespanStatus(ext.fechaFabricacion);
    if (
      stVida?.label?.includes('BAJA') ||
      stCarga.label === 'Vencido' ||
      stPH.label === 'Vencido'
    ) {
      return 'vencidos';
    }
    if (
      stVida?.label?.includes('Por vencer') ||
      stCarga.label === 'Por vencer' ||
      stPH.label === 'Por vencer'
    ) {
      return 'porVencer';
    }
    return 'operativos';
  };

  const baseFiltered = extintores.filter((e) => {
    const matchesSearch =
      (e.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const normalizeEmpresa = (emp: any) => (emp || '').trim().toUpperCase();
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
      await new Promise((r) => setTimeout(r, 250));

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

  const handleOpenInspectionFromForm = async () => {
    const targetId = editingId || formData.id || Date.now().toString();
    const cleanNumero = (formData.numero || '').trim() || `EXT-${String(targetId).slice(-4)}`;
    const cleanUbicacion = (formData.ubicacion || '').trim() || 'Planta Principal';

    const entryToSave = {
      ...formData,
      id: targetId,
      numero: cleanNumero,
      ubicacion: cleanUbicacion,
      updatedAt: new Date().toISOString()
    };

    const exists = extintores.some((ext: any) => String(ext.id) === String(targetId));
    const updated = exists
      ? extintores.map((ext: any) => (String(ext.id) === String(targetId) ? entryToSave : ext))
      : [entryToSave, ...extintores];

    await saveToStorage(updated);
    navigate(`/extintores/inspect/${targetId}`);
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
        logoData =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACH0lEQVR4nO3WMWrbQBgH8P+R2o1Qj9AruHQQOoTuwUN48BDWc4TQRUIP4MVD2A6hB3ClQyDqEBrcI1joECpdgr5D2+KqK510Z8l+H/iQEJKQ8/sO2ZLtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKB1iQj3Gfcb9xQvGM96q9Q2iQhPGT9L2k14t0rdQ8ZdxiuF/I8Zb3qr3AR6Uci/xR/GfM6Vf0h4X8j/hLHEfM4Jjwr53zF+6a1yA2hHIf9Txl/GW0bTW+VqwS81v2P8YpS9Va4arNT8XhifFwzXq2wA/xnjE+Ntb5WrAj8y/ioY7A3jTW+VCwV7hj/B8GvGG8Yy1/w1hT9J2E1421vlQsH8uS/I06N1rOqT1mGf/u/a1Z+PzO11e+1bT6Xms1c2B8xnmZ/9+QkAcJ/Zz5vO95p922X2s7mJ/9QcMZ/T+fl2Pj7LPN+Y7zD7OdtxT822+Zy27/9g1rBv9/Z9t23M51R/PqfzmQv23/58p3H2VqnS4H739+0m/tPYrVKlz3B3v2UcxuHnU++VKinIfdntDq1hN1y/3120XqlSQdbzYtF6pUoFnfM9zS/M4bM2L6rVqxXyZq+98z2V95yL1T8o5H3M+/E91fdcStU/KP7R2uNzqtUvlX/9nWr1S1Vfv2davVLlX79nWr1S+EAAACwJf4Bntp6h83445oAAAAASUVORK5CYII=';
      }

      try {
        if (logoData.startsWith('data:image/')) {
          const extension = logoData.split(';')[0].split('/')[1] || 'png';
          const base64Part = logoData.split(',')[1] || logoData;
          const logoId = workbook.addImage({ base64: base64Part, extension: extension as any });
          worksheet.addImage(logoId, {
            tl: { col: 5.5, row: 0.2 },
            ext: { width: 50, height: 50 },
            editAs: 'absolute'
          });
        }
      } catch (e) {}

      const headers = [
        'Nº / Chapa',
        'Tipo',
        'Ubicación',
        'Empresa',
        'Venc. Recarga',
        'Venc. PH',
        'Vida Útil'
      ];

      worksheet.mergeCells(1, 1, 1, 7);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Inventario de Extintores';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      worksheet.mergeCells(2, 1, 2, 7);
      const subCell = worksheet.getCell('A2');
      subCell.value = `Generado el: ${new Date().toLocaleDateString('es-AR')} - ${
        filterEmpresa || 'Todas las empresas'
      }`;
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
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 25;

      worksheet.columns = [
        { key: 'chapa', width: 15 },
        { key: 'tipo', width: 20 },
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
          ubicacion: ext.ubicacion,
          empresa: ext.empresa || '',
          recarga: ext.vencimientoRecarga
            ? new Date(ext.vencimientoRecarga + 'T12:00:00Z').toLocaleDateString('es-AR')
            : '',
          ph: ext.vencimientoPH ? new Date(ext.vencimientoPH + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
          vidaUtil: ext.fechaFabricacion
            ? new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')
            : ''
        });

        row.eachCell((cell, colIndex) => {
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colIndex === 1 || colIndex === 3 || colIndex === 4 ? 'left' : 'center',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };
        });
        row.height = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inventario_Extintores_${filterEmpresa || 'Completo'}_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar Excel');
    }
  };

  const uniqueEmpresas = [
    ...new Set(extintores.map((e) => (e.empresa || '').trim().toUpperCase()).filter(Boolean))
  ].sort();

  const types = ['ABC(HFCF)', 'BC(CO2)', 'ABC (PQS)', 'AB', 'K', 'Agua', 'Espuma', 'D'];

  const expiredLifespans = extintores.filter((ext) => {
    const st = getLifespanStatus(ext.fechaFabricacion);
    return st && (st.label.includes('DAR DE BAJA') || st.label.includes('Por vencer vida útil'));
  });

  const stats = { total: baseFiltered.length, vencidos: 0, porVencer: 0, operativos: 0 };
  baseFiltered.forEach((ext) => {
    const cat = getExtStatusCategory(ext);
    stats[cat]++;
  });
  const complRate = stats.total > 0 ? Math.round(((stats.total - stats.vencidos) / stats.total) * 100) : 100;

  const columns = [
    {
      header: 'Nº',
      accessor: 'index',
      width: '56px',
      render: (_: any, idx: number) => (
        <div className="font-black text-white text-xs text-center bg-slate-800 dark:bg-slate-600 py-1.5 px-2.5 rounded-lg shadow-xs min-w-[34px] inline-block">
          {idx + 1}
        </div>
      )
    },
    {
      header: 'Chapa',
      accessor: 'numero',
      sortable: true,
      render: (item: any) => {
        const cat = getExtStatusCategory(item);
        const isExpired = cat === 'vencidos';
        const lastInspection =
          item.inspections && item.inspections.length > 0
            ? item.inspections[item.inspections.length - 1]
            : null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                style={{
                  background: isExpired
                    ? 'rgba(239,68,68,0.12)'
                    : cat === 'porVencer'
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(16,185,129,0.12)',
                  color: isExpired ? '#ef4444' : cat === 'porVencer' ? '#d97706' : '#10b981'
                }}
                className="p-1.5 rounded-lg shrink-0"
              >
                <Flame size={15} />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white block leading-tight">
                  #{item.numero}
                </span>
                {(item.marca || item.numeroSerie) && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                    {item.marca || ''}{item.marca && item.numeroSerie ? ' · ' : ''}{item.numeroSerie ? `S/N: ${item.numeroSerie}` : ''}
                  </span>
                )}
              </div>
            </div>
            {lastInspection && (
              <div
                style={{
                  backgroundColor: lastInspection.resultado === 'C' ? '#ecfdf5' : '#fef2f2',
                  color: lastInspection.resultado === 'C' ? '#059669' : '#dc2626',
                  border: `1px solid ${lastInspection.resultado === 'C' ? '#a7f3d0' : '#fecdd3'}`
                }}
                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md w-fit"
              >
                INSP: {lastInspection.resultado === 'C' ? 'CONFORME' : 'NO CONFORME'}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      sortable: true,
      render: (item: any) => (
        <div className="flex flex-col gap-1">
          <span className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-extrabold w-fit border border-slate-200 dark:border-slate-600">
            {formatType(item.tipo)}
          </span>
          {item.selloIRAM && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              IRAM: {item.selloIRAM}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Empresa',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
          {item.empresa ? `🏢 ${item.empresa}` : '-'}
        </span>
      )
    },
    {
      header: 'Ubicación',
      accessor: 'ubicacion',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
          <MapPin size={14} className="text-rose-500 shrink-0" /> {item.ubicacion}
        </span>
      )
    },
    {
      header: 'Carga',
      accessor: 'vencimientoRecarga',
      sortable: true,
      render: (item: any) => {
        const st = getRecargaExpirationStatus(item.vencimientoRecarga);
        return (
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                backgroundColor: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[11px] w-fit"
            >
              {st.icon} {st.label}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {st.expirationDate || '-'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'P.H.',
      accessor: 'vencimientoPH',
      sortable: true,
      render: (item: any) => {
        const st = getPHExpirationStatus(item.vencimientoPH);
        return (
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                backgroundColor: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[11px] w-fit"
            >
              {st.icon} {st.label}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {st.expirationDate || '-'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Vida Útil',
      accessor: 'fechaFabricacion',
      sortable: true,
      render: (item: any) => {
        const st = getLifespanStatus(item.fechaFabricacion);
        if (!st) return <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold italic">Sin dato</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                backgroundColor: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[11px] w-fit"
            >
              {st.icon} {st.label}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Fab: {new Date(item.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
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
        const lastInspection =
          item.inspections && item.inspections.length > 0
            ? item.inspections[item.inspections.length - 1]
            : null;
        if (!lastInspection)
          return (
            <button
              type="button"
              onClick={() => setShowHistoryModal(item)}
              className="text-slate-400 hover:text-blue-500 text-xs font-semibold italic bg-transparent border-none cursor-pointer p-0"
            >
              Sin inspección
            </button>
          );
        const isOk = lastInspection.resultado === 'C' || lastInspection.resultado === 'APROBADO';
        return (
          <button
            type="button"
            onClick={() => setShowHistoryModal(item)}
            title="Ver Historial de Inspecciones"
            style={{ color: isOk ? '#059669' : '#dc2626' }}
            className="inline-flex items-center gap-1 font-extrabold text-xs bg-transparent border-none cursor-pointer p-0 hover:underline"
          >
            <ShieldCheck size={14} />
            {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
          </button>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => navigate(`/extintores/inspect/${item.id}`)}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Inspeccionar Extintor"
          >
            <ShieldCheck size={13} /> Insp
          </button>

          <button
            onClick={() => setShowHistoryModal(item)}
            title="Ver Historial de Inspecciones"
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <History size={13} /> Historial
          </button>

          <button
            onClick={() => handleEdit(item)}
            title="Editar Extintor"
            style={{
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit3 size={13} /> Editar
          </button>

          <button
            onClick={() => requirePro(() => generateQR(item))}
            title="Ver Código QR"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <QrCode size={13} /> QR
          </button>

          <button
            onClick={() => requirePro(() => setShareItem(item))}
            title="Compartir Ficha"
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Share2 size={13} /> Compartir
          </button>

          <button
            onClick={() => handleDelete(item.id)}
            title="Eliminar Extintor"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="container max-w-[1250px] mx-auto px-4 pb-32 pt-4">
      <PremiumHeader
        onBack={
          showForm
            ? () => {
                setShowForm(false);
                setEditingId(null);
              }
            : undefined
        }
        title="Control de Matafuegos"
        subtitle="Inventario, trazabilidad NFPA 10 y Códigos QR"
        icon={<Flame size={34} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
      />

      {!showForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-fade-in">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Equipos</span>
              <Flame size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <span className="text-[11px] text-slate-500 font-medium">Equipos registrados</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{complRate}%</div>
            <span className="text-[11px] text-slate-500 font-medium">{stats.operativos} operativos vigentes</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Próx. a Vencer</span>
              <Calendar size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.porVencer}</div>
            <span className="text-[11px] text-slate-500 font-medium">Vencen en ≤ 30 días</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Vencidos</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.vencidos}</div>
            <span className="text-[11px] text-slate-500 font-medium">Requieren recarga o P.H.</span>
          </div>
        </div>
      )}

      {showGlobalSignatureModal &&
        createPortal(
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
                <div
                  className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                    globalShowSignatures.operator
                      ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 opacity-100'
                      : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <input
                      type="checkbox"
                      checked={globalShowSignatures.operator}
                      onChange={(e) =>
                        setGlobalShowSignatures((prev) => ({ ...prev, operator: e.target.checked }))
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    Responsable del Relevamiento
                  </label>
                  <div
                    className={`bg-white dark:bg-slate-800 rounded-lg flex flex-col ${
                      globalShowSignatures.operator ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                  >
                    <SignatureCanvas
                      title=""
                      height={100}
                      onSave={(sig) => setGlobalSignaturesData((prev) => ({ ...prev, operatorSignature: sig }))}
                      initialImage={globalSignaturesData.operatorSignature}
                    />
                  </div>
                </div>

                {/* Profesional Actuante */}
                <div
                  className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                    globalShowSignatures.professional
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 opacity-100'
                      : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer text-emerald-800 dark:text-emerald-300 font-bold text-sm border-b border-emerald-200 dark:border-emerald-800 pb-2">
                    <input
                      type="checkbox"
                      checked={globalShowSignatures.professional}
                      onChange={(e) =>
                        setGlobalShowSignatures((prev) => ({ ...prev, professional: e.target.checked }))
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    Profesional de Higiene y Seguridad
                  </label>
                  <div className="flex flex-col items-center justify-center flex-1 min-h-[150px] bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center mt-1">
                    {professionalData?.signature ? (
                      <img
                        src={professionalData.signature}
                        alt="Firma Profesional"
                        className="max-h-[65px] object-contain mb-3"
                      />
                    ) : (
                      <span className="text-slate-400 italic mb-3 text-sm">Sin firma</span>
                    )}
                    <p className="m-0 font-extrabold text-slate-800 dark:text-slate-200 text-base">
                      {professionalData?.name || 'No configurado'}
                    </p>
                    <p className="m-0 font-bold text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {professionalData?.license ? `Mat. ${professionalData.license}` : 'Sin matrícula'}
                    </p>
                  </div>
                </div>

                {/* Supervisor / Responsable del Establecimiento */}
                <div
                  className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                    globalShowSignatures.supervisor
                      ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 opacity-100'
                      : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <input
                      type="checkbox"
                      checked={globalShowSignatures.supervisor}
                      onChange={(e) =>
                        setGlobalShowSignatures((prev) => ({ ...prev, supervisor: e.target.checked }))
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    Responsable del Establecimiento / Supervisión
                  </label>
                  <div
                    style={{ pointerEvents: globalShowSignatures.supervisor ? 'auto' : 'none' }}
                    className="bg-white dark:bg-slate-800 rounded-lg border-none flex flex-col"
                  >
                    <SignatureCanvas
                      title=""
                      height={100}
                      onSave={(sig) =>
                        setGlobalSignaturesData((prev) => ({ ...prev, supervisorSignature: sig }))
                      }
                      initialImage={globalSignaturesData.supervisorSignature}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowGlobalSignatureModal(false)}
                  style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none' }}
                  className="py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowGlobalSignatureModal(false)}
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}
                  className="py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
                >
                  <CheckCircle2 size={18} /> Guardar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => {
          setShareItem(null);
          setPrintItem(null);
        }}
        title={
          Array.isArray(shareItem)
            ? 'Inventario de Extintores'
            : `Ficha Técnica - Extintor #${shareItem?.numero}`
        }
        text={
          shareItem
            ? Array.isArray(shareItem)
              ? `🧯 Inventario de Extintores\n📊 Total: ${shareItem.length}`
              : `📋 Ficha de Extintor\n🔥 Chapa: ${shareItem.numero}\n📍 Ubicación: ${shareItem.ubicacion}`
            : ''
        }
        rawMessage={''}
        elementIdToPrint="pdf-portal-container"
        isLandscape={Array.isArray(shareItem) && shareItem.length > 15}
        fileName={
          Array.isArray(shareItem)
            ? `Inventario_Extintores_${filterEmpresa || 'Completo'}.pdf`
            : `Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`
        }
      />

      {/* PDF offscreen para compartir */}
      <div
        id="pdf-portal-container"
        className="ats-pdf-offscreen"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: Array.isArray(shareItem) && shareItem.length > 15 ? '297mm' : '210mm',
          height: 'auto',
          overflow: 'visible',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          background: '#ffffff'
        }}
      >
        {shareItem && !Array.isArray(shareItem) ? (
          <ExtinguisherProfilePdf data={shareItem} isHeadless={true} />
        ) : shareItem && Array.isArray(shareItem) ? (
          <ExtinguisherPdfGenerator
            extinguishers={shareItem}
            showSignatures={globalShowSignatures}
            globalSignatures={globalSignaturesData}
          />
        ) : null}
      </div>

      {/* Print portal */}
      <div
        id="pdf-content-print"
        className="ats-pdf-offscreen"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: Array.isArray(printItem) && printItem.length > 15 ? '297mm' : '210mm',
          height: 'auto',
          overflow: 'visible',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          background: '#ffffff'
        }}
      >
        {printItem && !Array.isArray(printItem) ? (
          <ExtinguisherProfilePdf data={printItem} isHeadless={true} />
        ) : printItem && Array.isArray(printItem) ? (
          <ExtinguisherPdfGenerator
            extinguishers={printItem}
            showSignatures={globalShowSignatures}
            globalSignatures={globalSignaturesData}
          />
        ) : null}
      </div>

      {/* Modal Modernizado de Calendario de Vencimientos Próximos */}
      {showCalendar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] min-h-[50vh] overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <CalendarDays size={26} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0">
                    Vencimientos Próximos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold m-0 mt-0.5">
                    Cronograma de Recargas Anuales y Pruebas Hidráulicas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 border-none cursor-pointer transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 min-h-0 custom-scrollbar">
              {(() => {
                const now = new Date();
                const grouped = filtered.reduce((acc, ext) => {
                  const cDate = ext.vencimientoRecarga
                    ? new Date(ext.vencimientoRecarga + 'T12:00:00Z')
                    : null;
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
                const upcomingKeys = sortedKeys
                  .filter((k) => {
                    const parts = k.split('-');
                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                    return d >= new Date(now.getFullYear(), now.getMonth(), 1);
                  })
                  .slice(0, 6);

                if (upcomingKeys.length === 0)
                  return (
                    <div className="text-center p-10 text-slate-500 dark:text-slate-400 font-bold">
                      No hay vencimientos programados en los próximos meses.
                    </div>
                  );

                return upcomingKeys.map((key) => {
                  const [y, m] = key.split('-');
                  const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  });
                  return (
                    <div key={key} className="mb-6">
                      <h3 className="uppercase tracking-wider font-extrabold text-xs text-slate-600 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                        <span>{monthName}</span>
                        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-xs">
                          {grouped[key].length} equipo(s)
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grouped[key].map((item: any, i: number) => (
                          <div
                            key={i}
                            className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-xs"
                          >
                            <div>
                              <p className="font-black text-slate-900 dark:text-white m-0 text-sm">
                                #{item.numero} — {formatType(item.tipo)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1 flex items-center gap-1 font-semibold">
                                <MapPin size={12} className="text-rose-500" /> {item.ubicacion}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-lg uppercase block">
                                {item.reason}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                                {item.date.toLocaleDateString('es-AR')}
                              </span>
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

      {/* Modal Modernizado de Historial de Inspecciones */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white m-0">
                    Historial de Inspecciones
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold m-0 mt-0.5">
                    Matafuego #{showHistoryModal.numero || showHistoryModal.chapa || ''} ·{' '}
                    {formatType(showHistoryModal.tipo)} ({showHistoryModal.ubicacion || 'Sin ubicación'})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintIndividualForm(showHistoryModal)}
                  style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
                  className="px-3.5 py-2 hover:opacity-90 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform hover:-translate-y-0.5"
                  title="Imprimir Ficha Técnica de Extintor"
                >
                  <Printer size={15} /> Imprimir Ficha
                </button>
                <button
                  onClick={() => setShareItem(showHistoryModal)}
                  style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none' }}
                  className="px-3.5 py-2 hover:opacity-90 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform hover:-translate-y-0.5"
                  title="Compartir Ficha en PDF"
                >
                  <Share2 size={15} /> Compartir
                </button>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-colors border-none cursor-pointer font-bold"
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
                  pastInspections = historyRaw.filter(
                    (h: any) =>
                      String(h.extintorId) === String(showHistoryModal.id) ||
                      String(h.extintorNum) === String(showHistoryModal.numero || showHistoryModal.chapa)
                  );
                  pastInspections.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                }
                if (pastInspections.length === 0)
                  return (
                    <div className="text-center p-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <ShieldCheck size={36} className="mx-auto mb-2 text-slate-400" />
                      <p className="m-0 text-slate-600 dark:text-slate-300 font-extrabold text-sm">
                        No hay inspecciones registradas para este matafuego.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = showHistoryModal.id;
                          setShowHistoryModal(null);
                          navigate(`/extintores/inspect/${targetId}`);
                        }}
                        style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck size={15} /> Realizar Primera Inspección
                      </button>
                    </div>
                  );
                return pastInspections.map((insp: any, i: number) => {
                  const isApproved =
                    insp.resultado === 'Aprobado' || insp.resultado === 'APROBADO' || insp.resultado === 'C';
                  const nonConformItems = insp.items
                    ? insp.items.filter((it: any) => it.status === 'NC' || it.status === 'RECHAZADO')
                    : [];
                  const conformItemsCount = insp.items
                    ? insp.items.filter((it: any) => it.status === 'C' || it.status === 'APROBADO').length
                    : 0;

                  return (
                    <div
                      key={i}
                      className={`mb-3.5 p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                        isApproved
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                      }`}
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <span className="font-black text-sm text-slate-900 dark:text-white block">
                              {new Date(insp.fecha).toLocaleDateString('es-AR')}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              Inspector: <strong className="text-slate-700 dark:text-slate-200">{insp.inspector || 'Sin registrar'}</strong>
                              {insp.items ? ` · ${conformItemsCount}/${insp.items.length} puntos OK` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              backgroundColor: isApproved ? '#059669' : '#dc2626',
                              color: '#ffffff'
                            }}
                            className="text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wide"
                          >
                            {isApproved ? '✓ APROBADO' : '✕ RECHAZADO'}
                          </span>
                          <button
                            onClick={() =>
                              handlePrintIndividualForm({ ...showHistoryModal, selectedInspection: insp })
                            }
                            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: 'none' }}
                            className="px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-transform hover:-translate-y-0.5"
                            title="Imprimir PDF de esta inspección"
                          >
                            <Printer size={13} /> Imprimir PDF
                          </button>
                          <button
                            onClick={() => setShareItem({ ...showHistoryModal, selectedInspection: insp })}
                            style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none' }}
                            className="px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-transform hover:-translate-y-0.5"
                            title="Compartir PDF de esta inspección"
                          >
                            <Share2 size={13} /> Compartir
                          </button>
                        </div>
                      </div>

                      {nonConformItems.length > 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800 rounded-xl">
                          <span className="text-xs font-extrabold text-red-700 dark:text-red-300 block mb-1">
                            ⚠️ Ítems No Conformes ({nonConformItems.length}):
                          </span>
                          <ul className="m-0 pl-4 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                            {nonConformItems.map((nc: any, ncIdx: number) => (
                              <li key={ncIdx}>
                                <strong>{nc.text}</strong> {nc.notes ? `(${nc.notes})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insp.observaciones && (
                        <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl m-0 font-semibold border border-amber-200 dark:border-amber-800/60">
                          <strong>Observaciones:</strong> {insp.observaciones}
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

      {!showForm && expiredLifespans.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 p-4 sm:p-5 rounded-2xl flex items-start gap-4 mt-5">
          <AlertTriangle color="#ef4444" size={24} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="m-0 text-red-800 dark:text-red-400 font-extrabold text-sm sm:text-base mb-0.5">
              Alerta de Vida Útil (20 años)
            </h4>
            <p className="m-0 text-red-700 dark:text-red-300 text-xs sm:text-sm leading-relaxed">
              Tienes {expiredLifespans.length} extintor(es) que han superado o están a punto de superar los 20
              años desde su fabricación. Según la normativa vigente, deben ser dados de baja definitivamente.
            </p>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="glass-card p-6 sm:p-8 mt-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 animate-fade-in">
          {(() => {
            const recargaSt = formData.vencimientoRecarga
              ? getRecargaExpirationStatus(formData.vencimientoRecarga)
              : null;
            const phSt = formData.vencimientoPH ? getPHExpirationStatus(formData.vencimientoPH) : null;
            const vidaSt = formData.fechaFabricacion ? getLifespanStatus(formData.fechaFabricacion) : null;

            return (
              <>
                {/* Header Moderno del Formulario */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border-none"
                      title="Volver al listado"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Flame size={22} />
                    </div>
                    <div>
                      <h2 className="m-0 text-xl font-extrabold text-slate-900 dark:text-white">
                        {editingId ? `Editar Extintor #${formData.numero || ''}` : 'Registrar Nuevo Extintor'}
                      </h2>
                      <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Ficha Técnica del Extintor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => requirePro(handleOpenInspectionFromForm)}
                      style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
                      className="px-4 py-2.5 hover:opacity-90 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                      title="Abrir checklist de inspección NFPA 10 de este matafuego"
                    >
                      <ShieldCheck size={15} /> Inspeccionar (NFPA 10)
                    </button>

                    <label className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2">
                      <Sparkles size={15} /> {isScanningMarbete ? 'Analizando...' : 'Escanear Etiqueta con IA'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={marbeteCameraRef}
                        onChange={handleMarbeteScan}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Sección 1: Datos Generales (Sin Capacidad ni campos extra) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm uppercase tracking-wider">
                    <Info size={18} className="text-amber-500" /> Datos Generales
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Nº Chapa / ID *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: EXT-01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Cliente / Empresa
                      </label>
                      <input
                        type="text"
                        value={formData.empresa || ''}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: Empresa S.A."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Ubicación Física *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: Pasillo principal 1er piso"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Tipo de Agente
                      </label>
                      <select
                        value={formatType(formData.tipo)}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer"
                      >
                        {types.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: Georgia, Melisam..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Nº de Serie (Fabricante)
                      </label>
                      <input
                        type="text"
                        value={formData.numeroSerie}
                        onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: 12345678"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Foto del Equipo (Opcional)
                      </label>
                      <div className="flex items-center gap-4">
                        <label
                          className={`px-5 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-dashed border-blue-500/40 rounded-xl cursor-pointer flex items-center gap-2 font-extrabold text-xs transition-opacity ${
                            isUploadingPhoto
                              ? 'opacity-50 pointer-events-none'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          <Camera size={18} /> {isUploadingPhoto ? 'Optimizando...' : 'Subir Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingPhoto}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {formData.foto && (
                          <div className="relative w-[64px] h-[64px] rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-sm">
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
                </div>

                {/* Sección 2: Control y Mantenimiento */}
                <div className="pt-5 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm uppercase tracking-wider">
                    <Calendar size={18} className="text-blue-500" /> Control y Mantenimiento
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Fecha de Fabricación
                      </label>
                      <input
                        type="date"
                        value={formData.fechaFabricacion}
                        onChange={(e) => setFormData({ ...formData, fechaFabricacion: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                      />
                      {vidaSt && (
                        <span
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md"
                          style={{ backgroundColor: vidaSt.bg, color: vidaSt.color }}
                        >
                          {vidaSt.icon} {vidaSt.label}
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Última Carga *
                      </label>
                      <input
                        required
                        type="date"
                        value={formData.vencimientoRecarga}
                        onChange={(e) => setFormData({ ...formData, vencimientoRecarga: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                      />
                      {recargaSt?.expirationDate && (
                        <span
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md"
                          style={{ backgroundColor: recargaSt.bg, color: recargaSt.color }}
                        >
                          {recargaSt.icon} {recargaSt.label} (Vto: {recargaSt.expirationDate})
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Última Prueba Hidráulica
                      </label>
                      <input
                        type="date"
                        value={formData.vencimientoPH}
                        onChange={(e) => setFormData({ ...formData, vencimientoPH: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                      />
                      {phSt?.expirationDate && (
                        <span
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md"
                          style={{ backgroundColor: phSt.bg, color: phSt.color }}
                        >
                          {phSt.icon} {phSt.label} (Vto: {phSt.expirationDate})
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-extrabold mb-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Sello IRAM / OPDS
                      </label>
                      <input
                        type="text"
                        value={formData.selloIRAM}
                        onChange={(e) => setFormData({ ...formData, selloIRAM: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none font-semibold text-sm text-slate-900 dark:text-white"
                        placeholder="Ej: 12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de Acción del Formulario */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '11px 20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <ArrowLeft size={18} /> Cancelar
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={() => setShowHistoryModal(formData)}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '11px 20px',
                          fontSize: '13px',
                          fontWeight: '800',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <History size={18} /> Historial
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => requirePro(handleOpenInspectionFromForm)}
                      style={{
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <ShieldCheck size={18} /> Inspeccionar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handlePrintIndividualForm({
                          ...formData,
                          id: (formData as any).id || editingId || 'ext-' + Date.now()
                        })
                      }
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Printer size={18} /> Generar PDF
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setShareItem({
                          ...formData,
                          id: (formData as any).id || editingId || 'ext-' + Date.now()
                        })
                      }
                      style={{
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Share2 size={18} /> Compartir
                    </button>

                    <button
                      type="button"
                      onClick={(e) => requirePro(() => handleSave(e))}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 24px',
                        fontSize: '13px',
                        fontWeight: '900',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Save size={18} /> Guardar Extintor
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Buscador + Filtro Empresa + Botón Registrar Matafuego */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="relative flex-[2_1_300px] min-w-0">
              <Search
                size={20}
                className="text-slate-400 pointer-events-none z-10"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'block'
                }}
              />
              <input
                type="text"
                placeholder="Buscar por Nº de chapa, tipo o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  height: '50px',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: '15px',
                  outline: 'none'
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-[1_1_auto]">
              <select
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                style={{ height: '50px', padding: '0 16px', fontSize: '14px', outline: 'none' }}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer focus:border-blue-500"
              >
                <option value="">🏢 Todas las Empresas</option>
                {uniqueEmpresas.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  requirePro(() => {
                    setEditingId(null);
                    setShowForm(true);
                  })
                }
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 22px',
                  fontSize: '14px',
                  fontWeight: '900',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  height: '50px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Plus size={19} strokeWidth={2.5} />
                <span>Registrar Matafuego</span>
              </button>
            </div>
          </div>

          {/* Panel Desplegable Moderno de Herramientas de Gestión y Exportación */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTools(!showTools)}
              className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                showTools ? 'border-b border-slate-200 dark:border-slate-700' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="m-0 text-slate-800 dark:text-slate-100 text-base sm:text-lg font-black">
                    Herramientas de Gestión y Exportación
                  </h3>
                  <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Plantilla Excel, importación masiva, calendario de vencimientos, firmas y exportación A4
                  </p>
                </div>
              </div>
              <ChevronDown
                size={24}
                className={`text-slate-500 shrink-0 transition-transform duration-300 ${
                  showTools ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showTools && (
              <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
                      className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                    >
                      <DownloadCloud size={15} /> Plantilla
                    </button>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      Excel en blanco
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBulkImportModal(true)}
                      style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }}
                      className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                    >
                      <UploadCloud size={15} /> Importar
                    </button>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      Carga masiva
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(true)}
                      style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none' }}
                      className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                    >
                      <CalendarDays size={15} /> Calendario
                    </button>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      Ver vencimientos
                    </span>
                  </div>

                  {filtered.length > 0 ? (
                    <>
                      <div className="flex flex-col items-center text-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => requirePro(() => setShowGlobalSignatureModal(true))}
                          style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none' }}
                          className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                        >
                          <Pencil size={15} /> Firmas
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                          Firmas del reporte
                        </span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => requirePro(handleExportExcel)}
                          style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none' }}
                          className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                        >
                          <FileSpreadsheet size={15} /> Exportar
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                          Bajar a Excel
                        </span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => requirePro(() => setShareItem(filtered))}
                          style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
                          className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                        >
                          <Share2 size={15} /> Compartir
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                          Enviar listado
                        </span>
                      </div>

                      <div className="flex flex-col items-center text-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => requirePro(handlePrintPdf)}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
                          className="w-full h-10 px-3 rounded-xl cursor-pointer font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all whitespace-nowrap"
                        >
                          <Printer size={15} /> Imprimir
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                          Reporte A4
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4 flex items-center justify-center border-l border-slate-200 dark:border-slate-700 pl-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">
                        ⚠️ Registrá o importá equipos para habilitar firmas y exportación de PDFs
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pestañas de Filtro Rápido */}
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
              Vigentes ({stats.operativos})
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
              Próximos a Vencer ({stats.porVencer})
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
              Vencidos ({stats.vencidos})
            </button>
          </div>

          {/* Tabla de Datos en Tarjeta Moderna */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <DataTable
              data={filtered}
              columns={columns}
              searchPlaceholder=""
              emptyMessage="No hay extintores registrados."
              emptyIcon={<Flame size={48} />}
              hideHeader={true}
            />
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
        iconEmoji="🗑️"
      />

      {/* QR Modal with Printable A6 Label (Sin Capacidad) */}
      {showQrModal &&
        qrData &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '1rem'
            }}
          >
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #printable-qr-label, #printable-qr-label * { visibility: visible; }
                #printable-qr-label {
                  position: fixed;
                  left: 0; top: 0;
                  width: 105mm; height: 148mm;
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
            <div
              className="animate-fade-in w-full max-w-[400px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-0 overflow-hidden relative shadow-2xl flex flex-col"
              style={{ maxHeight: '95vh' }}
            >
              {/* The Printable A6 Template Area */}
              <div
                id="printable-qr-label"
                className="p-6 flex flex-col items-center bg-white border-b-2 border-dashed border-slate-200 overflow-y-auto relative"
              >
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
                  <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1 m-0">
                    CONTROL DE EXTINTOR
                  </h2>
                  <h1 className="m-0 text-slate-900 font-black text-3xl">{qrData.ext.numero}</h1>
                </div>

                <div className="w-full flex flex-col gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Agente</span>
                    <span className="block text-base font-black text-slate-800">
                      {formatType(qrData.ext.tipo)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Ubicación Asignada
                    </span>
                    <span className="block text-base font-black text-slate-800">{qrData.ext.ubicacion}</span>
                  </div>
                  {qrData.ext.vencimientoRecarga && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Próximo Venc. Recarga
                      </span>
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
                  <img src={qrData.url} alt="QR Extintor" className="w-full h-full block" />
                </div>

                <p className="mt-6 mb-0 text-xs text-slate-400 font-bold tracking-wider uppercase text-center w-full">
                  ESCANEE PARA INSPECCIÓN Y TRAZABILIDAD
                </p>
              </div>

              {/* Modal Controls (Not Printable) */}
              <div className="no-print p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                  className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  <Printer size={18} /> IMPRIMIR ETIQUETA A6
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = qrData.url;
                    a.download = `QR_${qrData.ext.numero}.png`;
                    a.click();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                  className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  <QrCode size={18} /> DESCARGAR IMAGEN QR
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportConfirmed={handleBulkImportConfirm}
      />
    </div>
  );
}
