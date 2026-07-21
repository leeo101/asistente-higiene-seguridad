import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck, Activity, CheckCircle,
  Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera, Share2, Pencil, Download, FileSpreadsheet, CalendarDays, History, UploadCloud, DownloadCloud, Info, Save, Settings, ChevronDown, Sparkles } from
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
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ShareModal from '../components/ShareModal';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import { DataTable } from '../components/DataTable';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import ExcelJS from 'exceljs';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  return tipo;
};


export default function ExtintoresManager() {
  const { requirePro } = usePaywall();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncCollection } = useSync();

  const [extintores, setExtintores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);
  const [printItem, setPrintItem] = useState<any | null>(null);

  const [globalShowSignatures, setGlobalShowSignatures] = useState({ operator: false, professional: true, supervisor: false });
  const [globalSignaturesData, setGlobalSignaturesData] = useState({ operatorSignature: '', supervisorSignature: '' });
  const [showGlobalSignatureModal, setShowGlobalSignatureModal] = useState(false);

  const [formData, setFormData] = useState({
    numero: '',
    numeroSerie: '',
    tipo: 'ABC (PQS)',
    capacidad: '5 kg',
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
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = reader.result as string;
          const token = await auth.currentUser?.getIdToken(true);
          const response = await fetch(`${API_BASE_URL}/api/analyze-extinguisher`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64 })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al analizar la imagen');
          }

          const data = await response.json();
          if (!data.extinguisherDetected) {
            throw new Error('No se detectó un extintor en la imagen.');
          }

          let mappedAgent = formData.tipo;
          if (data.type === 'ABC') mappedAgent = 'ABC (PQS)';
          else if (data.type === 'CO2') mappedAgent = 'BC(CO2)';
          else if (data.type) mappedAgent = data.type;

          setFormData((prev) => ({
            ...prev,
            tipo: mappedAgent,
            capacidad: data.capacity ? (data.capacity.includes('kg') ? data.capacity : `${data.capacity} kg`) : prev.capacidad,
            vencimientoRecarga: data.lastCheck || prev.vencimientoRecarga,
            vencimientoPH: data.phDate || prev.vencimientoPH,
            estadoFisico: data.status === 'vigente' ? 'Operativo' : 'Revisión',
            foto: base64
          }));

          toast.success('Ficha del extintor autocompletada con IA ✨', { id: loadingToast });
        };
        reader.onerror = () => {
          throw new Error('Error al leer el archivo');
        };
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

  const handlePhotoUpload = (files) => {
    if (!files.length) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, foto: reader.result });
    };
    reader.readAsDataURL(files[0]);
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
    const editId = searchParams.get('edit');
    if (editId && extintores.length > 0 && !showForm && !editingId) {
      const extToEdit = extintores.find((e) => e.id === editId);
      if (extToEdit) {
        setFormData(extToEdit);
        setEditingId(editId);
        setShowForm(true);
      }
    }
  }, [searchParams, extintores, showForm, editingId]);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const saveToStorage = async (data) => {
    localStorage.setItem('extinguishers_inventory', JSON.stringify(data));
    setExtintores(data);
    await syncCollection('extinguishers_inventory', data);
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const newEntry = { ...formData, id: editingId || Date.now().toString(), updatedAt: new Date().toISOString() };
    let updated;
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
    setFormData({ numero: '', numeroSerie: '', tipo: 'ABC (PQS)', capacidad: '5 kg', ubicacion: '', marca: '', fechaFabricacion: '', vencimientoRecarga: '', vencimientoPH: '', selloIRAM: '', estadoFisico: 'Operativo', foto: null, empresa: '', showSignatures: { professional: true, supervisor: false, operator: false }, operatorSignature: '', supervisorSignature: '', professionalSignature: '', professionalName: '', professionalLicense: '' });
  };

  const handleEdit = (ext) => {
    setFormData(ext);
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

  const filtered = extintores.filter((e) => {
    const matchesSearch = e.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizeEmpresa = (emp) => (emp || '').trim().toUpperCase();
    const matchesEmpresa = filterEmpresa === '' || normalizeEmpresa(e.empresa) === filterEmpresa;
    return matchesSearch && matchesEmpresa;
  });

  const handlePrintPdf = () => {
    setPrintItem(filtered);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintItem(null);
      }, 10000);
    }, 500);
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
    header: 'Nº',
    accessor: 'index',
    width: '60px',
    render: (_: any, idx: number) =>
    <div className="font-black text-white text-sm text-center bg-slate-800 dark:bg-slate-600 py-1.5 px-2 rounded-lg shadow-sm">
                    {idx + 1}
                </div>

  },
  {
    header: 'Chapa',
    accessor: 'numero',
    sortable: true,
    render: (item: any) => {
      const stCarga = getRecargaExpirationStatus(item.vencimientoRecarga);
      const isExpired = stCarga.color === '#ef4444' || getPHExpirationStatus(item.vencimientoPH).color === '#ef4444';
      const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
      return (
        <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isExpired ? '#ef4444' : '#10b981' }} className="p-[0.3rem] rounded-[6px]">
                                <Flame size={14} />
                            </div>
                            <span className="font-extrabold">#{item.numero}</span>
                        </div>
                        {lastInspection &&
          <div style={{
            background: lastInspection.resultado === 'C' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444'

          }} className="display-[inline-flex] items-center gap-[0.1rem] text-[0.6rem] font-[900] p-[0.05rem_0.2rem] rounded-[4px] w-[fit-content]">
                                INSP: {lastInspection.resultado}
                            </div>
          }
                    </div>);

    }
  },
  {
    header: 'Tipo',
    accessor: 'tipo',
    sortable: true,
    render: (item: any) =>
    <div className="flex flex-col gap-0.5">
                    <span className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-bold w-fit">
                        {formatType(item.tipo)} — {item.capacidad}
                    </span>
                    {item.fechaFabricacion &&
      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-semibold">
                            Fab: {new Date(item.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
                        </span>
      }
                </div>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <span className="font-bold text-sm">
                    {item.empresa || '-'}
                </span>

  },
  {
    header: 'Ubicación',
    accessor: 'ubicacion',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <MapPin size={14} /> {item.ubicacion}
                </span>

  },
  {
    header: 'Carga',
    accessor: 'vencimientoRecarga',
    sortable: true,
    render: (item: any) => {
      const st = getRecargaExpirationStatus(item.vencimientoRecarga);
      return (
        <span style={{ color: st.color }} className="font-[800] text-[0.85rem] flex items-center gap-[0.3rem]">
                        {st.icon && st.icon} {st.label} <br/>({st.expirationDate || '-'})
                    </span>);

    }
  },
  {
    header: 'P.H.',
    accessor: 'vencimientoPH',
    sortable: true,
    render: (item: any) => {
      const st = getPHExpirationStatus(item.vencimientoPH);
      return (
        <span style={{ color: st.color }} className="font-[800] text-[0.85rem] flex items-center gap-[0.3rem]">
                        {st.icon && st.icon} {st.label} <br/>({st.expirationDate || '-'})
                    </span>);

    }
  },
  {
    header: 'Vida Útil',
    accessor: 'fechaFabricacion',
    sortable: true,
    render: (item: any) => {
      const st = getLifespanStatus(item.fechaFabricacion);
      if (!st) return <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">Sin Dato</span>;
      return (
        <span style={{ color: st.color }} className="font-[800] text-[0.85rem] flex items-center gap-[0.3rem]">
                        {st.icon && st.icon} {st.label}
                    </span>);

    }
  },
  {
    header: 'Última Inspec.',
    accessor: 'id',
    sortable: false,
    render: (item: any) => {
      const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
      if (!lastInspection) return <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">-</span>;
      return (
        <span style={{ color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444' }} className="display-[inline-flex] items-center gap-[0.3rem] font-[700] text-[0.8rem]">
                        <ShieldCheck size={14} /> 
                        {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
                    </span>);

    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) => {
      const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
      let isInspectedRecently = false;
      if (lastInspection) {
        const d = new Date(lastInspection.fechaVisita + 'T12:00:00Z');
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 35) {// 35 days to allow a bit of overlap for monthly inspections
          isInspectedRecently = true;
        }
      }

      const inspColor = isInspectedRecently ? '#10b981' : '#ef4444';
      const inspBg = isInspectedRecently ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
      const inspBorder = isInspectedRecently ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';

      return (
        <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/extintores/inspect/${item.id}`)} style={{ background: inspBg, border: `1px solid ${inspBorder}`, color: inspColor }} title="Inspeccionar" className="p-[0.5rem] rounded-[8px] cursor-pointer flex items-center gap-[0.3rem] font-[800] text-[0.75rem] shadow-sm hover:-translate-y-0.5 transition-transform">
                            <ShieldCheck size={16} /> INSP
                        </button>
                        <button onClick={() => handleEdit(item)} title="Editar" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Edit3 size={16} /></button>
                        <button onClick={() => requirePro(() => generateQR(item))} title="QR" style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><QrCode size={16} /></button>
                        <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Share2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} title="Eliminar" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Trash2 size={16} /></button>
                    </div>);

    }
  }];


  return (
    <div className="container max-w-[1200px] mx-auto px-4 pb-32">
            {!showForm &&
      <>
                    <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
        title="Control de Matafuegos"
        subtitle="Inventario, trazabilidad NFPA 10 y Códigos QR"
        icon={<Flame size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

                    <div className="flex justify-end mb-4 mt-2">
                        <button
            onClick={() => requirePro(() => setShowForm(true))}
            onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
            onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}} className="flex-[0_1_auto] min-h-[3.5rem] p-[0_1.8rem] rounded-[16px] bg-[linear-gradient(135deg,_#10b981_0%,_#059669_100%)] text-[#fff] border-none font-[800] text-[1rem] cursor-pointer flex items-center justify-center gap-[0.6rem] box-shadow-[0_8px_20px_rgba(16,185,129,0.3)] white-space-[nowrap] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
                            <Plus size={22} strokeWidth={2.5} /> Registrar Matafuego
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
                        {(() => {
                            const stats = { total: filtered.length, vencidos: 0, porVencer: 0, operativos: 0 };
                            filtered.forEach(ext => {
                                const stCarga = getRecargaExpirationStatus(ext.vencimientoRecarga);
                                const stPH = getPHExpirationStatus(ext.vencimientoPH);
                                const stVida = getLifespanStatus(ext.fechaFabricacion);
                                if (stVida?.label?.includes('BAJA') || stCarga.color === '#ef4444' || stPH.color === '#ef4444') {
                                    stats.vencidos++;
                                } else if (stVida?.label?.includes('Por vencer') || stCarga.color === '#f59e0b' || stPH.color === '#f59e0b') {
                                    stats.porVencer++;
                                } else {
                                    stats.operativos++;
                                }
                            });
                            const complRate = stats.total > 0 ? Math.round(((stats.total - stats.vencidos) / stats.total) * 100) : 100;
                            return (
                                <>
                                    <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                                        <div className="p-2 sm:p-3 bg-blue-100 text-blue-600 rounded-xl"><Flame size={20} className="sm:w-6 sm:h-6" /></div>
                                        <div className="overflow-hidden w-full"><p style={{ color: 'var(--color-text)' }} className="text-[0.65rem] sm:text-sm font-bold mb-0 sm:mb-1 uppercase opacity-60 truncate">Total Equipos</p><h3 style={{ color: 'var(--color-text)' }} className="text-xl sm:text-2xl font-black m-0">{stats.total}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                                        <div className="p-2 sm:p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={20} className="sm:w-6 sm:h-6" /></div>
                                        <div className="overflow-hidden w-full"><p className="text-[0.65rem] sm:text-sm text-slate-500 font-bold mb-0 sm:mb-1 uppercase truncate">Vencidos</p><h3 className="text-xl sm:text-2xl font-black text-red-600 m-0">{stats.vencidos}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                                        <div className="p-2 sm:p-3 bg-amber-100 text-amber-600 rounded-xl"><Calendar size={20} className="sm:w-6 sm:h-6" /></div>
                                        <div className="overflow-hidden w-full"><p className="text-[0.65rem] sm:text-sm text-slate-500 font-bold mb-0 sm:mb-1 uppercase truncate" title="Próximos a Vencer">Próx. a Vencer</p><h3 className="text-xl sm:text-2xl font-black text-amber-600 m-0">{stats.porVencer}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                                        <div className="p-2 sm:p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Activity size={20} className="sm:w-6 sm:h-6" /></div>
                                        <div className="overflow-hidden w-full"><p className="text-[0.65rem] sm:text-sm text-slate-500 font-bold mb-0 sm:mb-1 uppercase truncate" title="Cumplimiento">Cumplimiento</p><h3 className="text-xl sm:text-2xl font-black text-emerald-600 m-0">{complRate}%</h3></div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </>
      }

            {showGlobalSignatureModal && createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', margin: '0 1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="animate-fade-in relative dark:bg-slate-800">
                        <h3 style={{ color: '#1e293b' }} className="mt-0 font-extrabold border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2 text-lg">
                            <Pencil size={20} color="#3b82f6" /> Firmas del Reporte Global
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Seleccioná qué firmas aparecerán en el reporte final y dibujalas a continuación.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Operador */}
                            <div style={{ background: globalShowSignatures.operator ? '#f8fafc' : '#f1f5f9', border: globalShowSignatures.operator ? '2px solid #cbd5e1' : '1px solid #e2e8f0', opacity: globalShowSignatures.operator ? 1 : 0.6 }} className="flex flex-col gap-[0.5rem] p-[1rem] rounded-[10px] transition-[all_0.2s]">
                                <label className="flex items-center gap-[0.4rem] cursor-pointer text-slate-700 dark:text-slate-300 font-[700] text-[0.9rem] border-bottom-[1px_solid_#e2e8f0] pb-[0.4rem]">
                                    <input type="checkbox" checked={globalShowSignatures.operator} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, operator: e.target.checked }))} className="w-[16px] h-[16px] cursor-pointer" />
                                    Operador / Responsable
                                </label>
                                <div style={{ pointerEvents: globalShowSignatures.operator ? 'auto' : 'none' }} className="bg-white dark:bg-slate-800 rounded-[8px] border-none flex flex-col">
                                    <SignatureCanvas
                  title=""
                  height={100}
                  onSave={(sig) => setGlobalSignaturesData((prev) => ({ ...prev, operatorSignature: sig }))}
                  initialImage={globalSignaturesData.operatorSignature} />
                
                                </div>
                            </div>

                            {/* Profesional Actuante */}
                            <div style={{ background: globalShowSignatures.professional ? '#f0fdf4' : '#f1f5f9', border: globalShowSignatures.professional ? '2px solid #86efac' : '1px solid #e2e8f0', opacity: globalShowSignatures.professional ? 1 : 0.6 }} className="flex flex-col gap-[0.5rem] p-[1rem] rounded-[10px] transition-[all_0.2s]">
                                <label className="flex items-center gap-[0.4rem] cursor-pointer text-[#166534] font-[700] text-[0.9rem] border-bottom-[1px_solid_#bbf7d0] pb-[0.4rem]">
                                    <input type="checkbox" checked={globalShowSignatures.professional} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, professional: e.target.checked }))} className="w-[16px] h-[16px] cursor-pointer" />
                                    Profesional Actuante
                                    <div className="flex flex-col items-center justify-center flex-1 min-h-[150px] bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center mt-2">
                                        {professionalData?.signature ?
                    <img src={professionalData.signature} alt="Firma Profesional" className="max-h-[65px] object-contain mb-3" /> :

                    <span className="text-slate-400 italic mb-3 text-sm">Sin firma</span>
                    }
                                        <p className="m-0 font-extrabold text-slate-800 dark:text-slate-200 text-base">{professionalData?.name || 'No configurado'}</p>
                                        <p className="m-0 font-bold text-slate-500 text-sm mt-1">{professionalData?.license ? `Mat. ${professionalData.license}` : 'Sin matrícula'}</p>
                                    </div>
                                </label>
                            </div>

                            {/* Supervisor */}
                            <div style={{ background: globalShowSignatures.supervisor ? '#f8fafc' : '#f1f5f9', border: globalShowSignatures.supervisor ? '2px solid #cbd5e1' : '1px solid #e2e8f0', opacity: globalShowSignatures.supervisor ? 1 : 0.6 }} className="flex flex-col gap-[0.5rem] p-[1rem] rounded-[10px] transition-[all_0.2s]">
                                <label className="flex items-center gap-[0.4rem] cursor-pointer text-slate-700 dark:text-slate-300 font-[700] text-[0.9rem] border-bottom-[1px_solid_#e2e8f0] pb-[0.4rem]">
                                    <input type="checkbox" checked={globalShowSignatures.supervisor} onChange={(e) => setGlobalShowSignatures((prev) => ({ ...prev, supervisor: e.target.checked }))} className="w-[16px] h-[16px] cursor-pointer" />
                                    Supervisión / Cierre
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
        elementIdToPrint="pdf-content"
        isLandscape={Array.isArray(shareItem) && shareItem.length > 15}
        fileName={Array.isArray(shareItem) ? `Inventario_Extintores_${filterEmpresa || 'Completo'}.pdf` : `Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`} />

            {/* PDF Portal: siempre montado cuando shareItem está activo para que html2canvas lo encuentre */}
            {shareItem && createPortal(
        <div
          id="pdf-content"
          className="ats-pdf-offscreen active-portal-print"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-99999px',
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
            : <ExtinguisherPdfGenerator
                extinguishers={Array.isArray(shareItem) ? shareItem : []}
                showSignatures={globalShowSignatures}
                globalSignatures={globalSignaturesData} />
          }
        </div>,
        document.body
      )}

            {/* Print portal separado: solo para window.print() */}
            {printItem && createPortal(
        <div
          id="pdf-content-print"
          className="ats-pdf-offscreen active-portal-print"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-99999px',
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
            : <ExtinguisherPdfGenerator
                extinguishers={Array.isArray(printItem) ? printItem : []}
                showSignatures={globalShowSignatures}
                globalSignatures={globalSignaturesData} />
          }
        </div>,
        document.body
      )}

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
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><History size={24} className="text-blue-500" /> Historial de Inspecciones</h2>
                            <button onClick={() => setShowHistoryModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer">✕</button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {(() => {
                                const historyRaw = localStorage.getItem('extintores_history');
                                let pastInspections = [];
                                if (historyRaw) {
                                    pastInspections = JSON.parse(historyRaw).filter((h: any) => String(h.extintorId) === String(showHistoryModal.id));
                                    pastInspections.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                                }
                                if (pastInspections.length === 0) return <div className="text-center p-8 text-slate-500 font-bold">No hay inspecciones registradas.</div>;
                                return pastInspections.map((insp: any, i: number) => (
                                    <div key={i} className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{new Date(insp.fecha).toLocaleDateString('es-AR')}</span>
                                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${insp.resultado === 'Aprobado' || insp.resultado === 'C' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{insp.resultado?.toUpperCase() || 'COMPLETADO'}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 m-0"><span className="font-bold">Inspector:</span> {insp.inspector || 'N/A'}</p>
                                        {insp.observaciones && <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 font-medium">Obs: {insp.observaciones}</p>}
                                    </div>
                                ));
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


            {showForm ?
      <div className="animate-fade-in ats-editor-panel">
                    <ModuleFormLayout>
                        <ModuleFormToolbar
                            title={editingId ? 'Editar Extintor' : 'Registrar Nuevo Extintor'}
                            subtitle="Ficha Técnica del Extintor"
                            icon={<Flame size={28} className="text-amber-500" />}
                        />
                    
                    <ModuleFormDocument id="extinguisher-form">
                        <div className="no-print mb-6 p-4 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 rounded-2xl border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl">
                                    <Sparkles size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="m-0 font-extrabold text-slate-800 dark:text-slate-200">Autocompletado Rápido con IA</h4>
                                    <p className="m-0 text-xs text-slate-500">Subí una foto del marbete/etiqueta para completar automáticamente tipo, capacidad y vencimientos.</p>
                                </div>
                            </div>
                            <label className="shrink-0 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-[0_4px_12px_rgba(2,132,199,0.3)] transition-transform hover:-translate-y-0.5 flex items-center gap-2">
                                <Camera size={18} /> Escanear Etiqueta
                                <input type="file" accept="image/*" capture="environment" ref={marbeteCameraRef} onChange={handleMarbeteScan} className="hidden" />
                            </label>
                        </div>
                        <ModuleFormSection title="Datos Generales" icon={<Info size={20} />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">Nº CHAPA / ID</label>
                                <input required type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: EXT-01" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">CLIENTE / EMPRESA</label>
                                <input type="text" value={formData.empresa || ''} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Empresa S.A." />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">Nº DE SERIE (FABRICANTE)</label>
                                <input type="text" value={formData.numeroSerie} onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 12345678" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">MARCA</label>
                                <input type="text" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Georgia, Melisam..." />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">TIPO DE AGENTE</label>
                                <select value={formatType(formData.tipo)} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                                    {types.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">CAPACIDAD</label>
                                <input type="text" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 5 kg" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">UBICACIÓN FÍSICA</label>
                                <input required type="text" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Pasillo principal 1er piso" />
                            </div>
                            <div className="grid-column-[1_/_-1]">
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">FOTO DEL EQUIPO (OPCIONAL)</label>
                                <div className="flex items-center gap-4">
                                    <label className="p-[0.8rem_1.5rem] bg-[rgba(37,99,235,0.1)] text-blue-600 dark:text-blue-400 border-[1px_dashed_rgba(37,99,235,0.3)] rounded-[12px] cursor-pointer flex items-center gap-[0.5rem] font-[800]">
                                        <Camera size={20} /> Subir Foto
                                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files)} className="hidden" />
                                    </label>
                                    {formData.foto &&
                <div className="relative w-[60px] h-[60px] rounded-[8px] overflow-[hidden] border-[2px_solid_var(--color-border)]">
                                            <img src={formData.foto} alt="Extintor" className="w-[100%] h-[100%] object-fit-[cover]" />
                                            <button type="button" onClick={() => setFormData({ ...formData, foto: null })} className="absolute top-[0] right-[0] bg-red-500 hover:bg-red-600 text-[#fff] border-none w-[20px] h-[20px] text-[10px] flex items-center justify-center cursor-pointer">✕</button>
                                        </div>
                }
                                </div>
                            </div>
                        </div>
                        </ModuleFormSection>

                        <ModuleFormSection title="Control y Mantenimiento" icon={<Calendar size={20} />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">FECHA DE FABRICACIÓN</label>
                                <input type="date" value={formData.fechaFabricacion} onChange={(e) => setFormData({ ...formData, fechaFabricacion: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">ÚLTIMA CARGA</label>
                                <input required type="date" value={formData.vencimientoRecarga} onChange={(e) => setFormData({ ...formData, vencimientoRecarga: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">ÚLTIMA PRUEBA HIDRÁULICA</label>
                                <input type="date" value={formData.vencimientoPH} onChange={(e) => setFormData({ ...formData, vencimientoPH: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">SELLO IRAM / OPDS</label>
                                <input type="text" value={formData.selloIRAM} onChange={(e) => setFormData({ ...formData, selloIRAM: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 12345" />
                            </div>
                        </div>
                        </ModuleFormSection>

                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 sm:flex-none p-[0.8rem_1.5rem] rounded-xl font-[800] cursor-pointer flex justify-center items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-sm" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                                    <ArrowLeft size={18} /> Cancelar
                                </button>
                                {editingId && (
                                    <button type="button" onClick={() => setShowHistoryModal(formData)} className="flex-1 sm:flex-none p-[0.8rem_1.5rem] rounded-xl font-[800] cursor-pointer flex justify-center items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-md" style={{ backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none' }}>
                                        <History size={18} /> Historial
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
                                <button type="button" onClick={() => {
                                  setPrintItem(formData);
                                  setTimeout(() => {
                                    window.print();
                                    setTimeout(() => setPrintItem(null), 10000);
                                  }, 600);
                                }} className="flex-1 sm:flex-none p-[0.8rem_1.5rem] rounded-xl font-[800] cursor-pointer flex justify-center items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-md" style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}>
                                    <Printer size={18} /> Generar PDF
                                </button>
                                <button type="button" onClick={() => {setShareItem(formData);}} className="flex-1 sm:flex-none p-[0.8rem_1.5rem] rounded-xl font-[800] cursor-pointer flex justify-center items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-md" style={{ backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none' }}>
                                    <Share2 size={18} /> Compartir
                                </button>
                                <button type="button" onClick={(e) => requirePro(() => handleSave(e))} className="w-full sm:w-auto p-[0.8rem_1.5rem] rounded-xl font-black cursor-pointer flex justify-center items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', border: 'none' }}>
                                    <Save size={18} /> Guardar Extintor
                                </button>
                            </div>
                        </div>
                    </ModuleFormDocument>
                    </ModuleFormLayout>
                </div> :

      <>
                    <div className="mb-[2rem] flex gap-[1rem] flex-wrap items-stretch bg-[var(--color-surface,_#fff)] p-[1.5rem] rounded-[24px] box-shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-[1px_solid_rgba(0,0,0,0.05)]">
                        <div className="flex-[1_1_250px] relative">
                            <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
              type="text"
              placeholder="Buscar por Nº, tipo o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
              onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}} 
              style={{ width: '100%', height: '100%', minHeight: '3.5rem', padding: '0.75rem 1rem 0.75rem 3.5rem', borderRadius: '1rem', border: '2px solid transparent', backgroundColor: 'rgba(241, 245, 249, 0.5)', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', fontWeight: 500, color: '#334155' }} />
            
                        </div>
                        <div className="flex-[1_1_250px] relative">
                            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              style={{ color: filterEmpresa ? '#334155' : '#94a3b8' }}
              onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
              onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}} className="w-full h-full min-h-[3.5rem] py-3 pr-10 pl-4 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800/50 text-base outline-none appearance-none cursor-pointer transition-all font-medium">
              
                                <option value="">🏢 Todas las Empresas</option>
                                {uniqueEmpresas.map((emp) =>
              <option key={emp} value={emp}>{emp}</option>
              )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    </div>
                    {/* Panel unificado de Herramientas de Gestión */}
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-[2rem] overflow-hidden"
                        style={{ transform: 'translateZ(0)' }}
                    >
                        <button 
                            onClick={() => setShowTools(!showTools)}
                            className={`w-full flex items-center justify-between p-[1.5rem] bg-transparent border-none cursor-pointer outline-none focus:outline-none focus:ring-0 active:bg-slate-50 dark:active:bg-slate-700 md:hover:bg-slate-50 md:dark:hover:bg-slate-700 transition-colors ${showTools ? 'rounded-t-[24px]' : 'rounded-[24px]'}`}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <h3 className="m-0 flex items-center gap-2 text-slate-800 dark:text-slate-100 text-lg font-black">
                                <Settings size={22} className="text-blue-500" /> Herramientas de Gestión y Exportación
                            </h3>
                            <ChevronDown size={24} className={`text-slate-400 transition-transform duration-300 ${showTools ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`transition-all duration-300 ease-in-out ${showTools ? 'max-h-[1000px] opacity-100 px-[1.5rem] pb-[1.5rem]' : 'max-h-0 opacity-0 px-[1.5rem] pb-0 overflow-hidden'}`}>
                            <style>
                            {`
                                .action-btn-premium {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 0.4rem;
                                    padding: 0 0.5rem;
                                    height: 2.5rem;
                                    font-size: 0.7rem;
                                    font-weight: 800;
                                    border-radius: 50px;
                                    border: none;
                                    cursor: pointer;
                                    color: white;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    letter-spacing: 0.5px;
                                    width: 100%;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                }
                                .btn-pdf { background: linear-gradient(135deg, #f87171, #ef4444); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); }
                                .btn-pdf:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4); }
                                .btn-excel { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
                                .btn-excel:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); }
                                .btn-share { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
                                .btn-share:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4); }
                                .btn-signatures { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
                                .btn-signatures:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4); }
                                .btn-calendar { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
                                .btn-calendar:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4); }
                                
                                .tool-item {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    text-align: center;
                                    gap: 0.5rem;
                                }
                                .tool-desc {
                                    font-size: 0.65rem;
                                    color: #64748b;
                                    line-height: 1.2;
                                    font-weight: 500;
                                }
                            `}
                        </style>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {/* Herramientas Base */}
                            <div className="tool-item">
                                <button onClick={downloadTemplate} className="action-btn-premium btn-excel">
                                    <DownloadCloud size={16} /> PLANTILLA
                                </button>
                                <span className="tool-desc">Excel en blanco<br/>para llenar</span>
                            </div>
                            
                            <div className="tool-item">
                                <label className="action-btn-premium btn-share m-0 w-full cursor-pointer">
                                    <UploadCloud size={16} /> IMPORTAR
                                    <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleExcelImport} />
                                </label>
                                <span className="tool-desc">Cargar datos<br/>masivamente</span>
                            </div>
                            
                            <div className="tool-item">
                                <button onClick={() => setShowCalendar(true)} className="action-btn-premium btn-calendar">
                                    <CalendarDays size={16} /> CALENDARIO
                                </button>
                                <span className="tool-desc">Ver próximos<br/>vencimientos</span>
                            </div>

                            {/* Herramientas que requieren datos (Globales) */}
                            {filtered.length > 0 ? (
                                <>
                                    <div className="tool-item">
                                        <button onClick={() => requirePro(() => setShowGlobalSignatureModal(true))} className="action-btn-premium btn-signatures">
                                            <Pencil size={16} /> FIRMAS
                                        </button>
                                        <span className="tool-desc">Configurar firma<br/>del reporte</span>
                                    </div>
                                    
                                    <div className="tool-item">
                                        <button onClick={() => requirePro(handleExportExcel)} className="action-btn-premium btn-excel">
                                            <Download size={16} /> EXPORTAR
                                        </button>
                                        <span className="tool-desc">Bajar listado<br/>actual a Excel</span>
                                    </div>
                                    
                                    <div className="tool-item">
                                        <button onClick={() => requirePro(() => setShareItem(filtered))} className="action-btn-premium btn-share">
                                            <Share2 size={16} /> COMPARTIR
                                        </button>
                                        <span className="tool-desc">Enviar link<br/>de la lista</span>
                                    </div>

                                    <div className="tool-item">
                                        <button onClick={() => requirePro(handlePrintPdf)} className="action-btn-premium btn-pdf">
                                            <Printer size={16} /> IMPRIMIR
                                        </button>
                                        <span className="tool-desc">Generar reporte<br/>completo (A4)</span>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-4 flex items-center justify-center border-l border-slate-100 dark:border-slate-700 pl-4">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">
                                        ⚠️ Registrá o importá equipos para habilitar firmas y exportación de PDFs
                                    </span>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>

                    <DataTable
                        data={filtered}
                        columns={columns}
                        searchPlaceholder=""
                        emptyMessage="No hay extintores registrados."
                        emptyIcon={<Flame size={48} />}
                        hideHeader={true} />
        

                </>
      }

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
                        <button onClick={() => setShowQrModal(false)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }} className="no-print absolute top-[0.5rem] right-[0.5rem] w-[32px] h-[32px] rounded-[50%] cursor-pointer flex items-center justify-center transition-colors z-10 shadow-sm font-bold">✕</button>
                        
                        <div className="w-full text-center border-b-2 border-slate-800 pb-4 mb-4">
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
                    <div className="no-print p-4 bg-slate-50 flex flex-col gap-2 shrink-0">
                        <button onClick={() => window.print()} style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }} className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md">
                            <Printer size={18} /> IMPRIMIR ETIQUETA A6
                        </button>
                        <button onClick={() => {
                            const a = document.createElement('a');
                            a.href = qrData.url;
                            a.download = `QR_${qrData.ext.numero}.png`;
                            a.click();
                        }} style={{ backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' }} className="w-full p-3 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-sm">
                            <QrCode size={18} /> DESCARGAR SOLO IMAGEN QR
                        </button>
                    </div>
                </div>
            </div>, document.body)
      }
        </div>);

}