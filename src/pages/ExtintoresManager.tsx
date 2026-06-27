import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Flame, Plus, Search, MapPin, QrCode, ArrowLeft, ShieldCheck, Activity, CheckCircle,
  Calendar, Edit3, Trash2, Printer, AlertTriangle, CheckCircle2, Camera, Share2, Pencil, Download, FileSpreadsheet, CalendarDays, History, UploadCloud, DownloadCloud } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
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

  const saveToStorage = async (data) => {
    localStorage.setItem('extinguishers_inventory', JSON.stringify(data));
    setExtintores(data);
    await syncCollection('extinguishers_inventory', data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
      // Ya no ocultamos el root, porque si el body queda vacío (sin altura), 
      // Android Chrome centra verticalmente los elementos con position: absolute.
      // Al dejar el root invisible (por CSS) pero ocupando espacio, y el PDF en position: absolute top 0,
      // garantizamos que quede pegado arriba.

      window.print();

      // Wait 10 seconds before clearing to allow Android's print spooler to capture the DOM
      setTimeout(() => {
        setPrintItem(null);
      }, 10000);
    }, 500);
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extintores');

      worksheet.columns = [
      { header: 'Chapa', key: 'chapa', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Capacidad', key: 'capacidad', width: 15 },
      { header: 'Ubicación', key: 'ubicacion', width: 30 },
      { header: 'Empresa', key: 'empresa', width: 25 },
      { header: 'Venc. Recarga', key: 'recarga', width: 20 },
      { header: 'Venc. PH', key: 'ph', width: 20 },
      { header: 'Vida Útil', key: 'vidaUtil', width: 20 }];


      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      filtered.forEach((ext) => {
        worksheet.addRow({
          chapa: ext.numero,
          tipo: formatType(ext.tipo),
          capacidad: ext.capacidad,
          ubicacion: ext.ubicacion,
          empresa: ext.empresa || '',
          recarga: ext.vencimientoRecarga ? new Date(ext.vencimientoRecarga + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
          ph: ext.vencimientoPH ? new Date(ext.vencimientoPH + 'T12:00:00Z').toLocaleDateString('es-AR') : '',
          vidaUtil: ext.fechaFabricacion ? new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR') : ''
        });
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
    <div className="font-black text-slate-700 dark:text-slate-200 text-base text-center bg-slate-100 dark:bg-slate-700 py-1 px-2 rounded-lg">
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
        <span style={{ backgroundColor: st.bg || 'transparent', color: st.color }} className="p-[0.2rem_0.6rem] rounded-[12px] font-[800] text-[0.75rem] display-[inline-flex] items-center gap-[0.3rem]">
                        {st.icon && st.icon} {st.label} ({st.expirationDate || '-'})
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
        <span style={{ backgroundColor: st.bg || 'transparent', color: st.color }} className="p-[0.2rem_0.6rem] rounded-[12px] font-[800] text-[0.75rem] display-[inline-flex] items-center gap-[0.3rem]">
                        {st.icon && st.icon} {st.label} ({st.expirationDate || '-'})
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
        <span style={{ backgroundColor: st.bg || 'transparent', color: st.color }} className="p-[0.2rem_0.6rem] rounded-[12px] font-[800] text-[0.75rem] display-[inline-flex] items-center gap-[0.3rem]">
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
                        <button onClick={() => navigate(`/extintores/inspect/${item.id}`)} style={{ background: inspBg, border: `1px solid ${inspBorder}`, color: inspColor }} title="Inspeccionar" className="p-[0.4rem] rounded-[8px] cursor-pointer flex items-center gap-[0.3rem] font-[800] text-[0.75rem]">
                            <ShieldCheck size={15} /> INSP
                        </button>
                        <button onClick={() => handleEdit(item)} title="Editar" className="p-[0.4rem] bg-[rgba(37,99,235,0.08)] border-[1px_solid_rgba(37,99,235,0.2)] rounded-[8px] text-blue-600 dark:text-blue-400 cursor-pointer"><Edit3 size={15} /></button>
                        <button onClick={() => requirePro(() => generateQR(item))} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                        <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-green-600 dark:text-green-400 cursor-pointer"><Share2 size={15} /></button>
                        <button onClick={() => handleDelete(item.id)} title="Eliminar" className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
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
        

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 animate-fade-in">
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
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Flame size={24} /></div>
                                        <div><p className="text-sm text-slate-500 font-bold mb-1 uppercase">Total Equipos</p><h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 m-0">{stats.total}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
                                        <div><p className="text-sm text-slate-500 font-bold mb-1 uppercase">Vencidos</p><h3 className="text-2xl font-black text-red-600 m-0">{stats.vencidos}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Calendar size={24} /></div>
                                        <div><p className="text-sm text-slate-500 font-bold mb-1 uppercase">Próximos a Vencer</p><h3 className="text-2xl font-black text-amber-600 m-0">{stats.porVencer}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Activity size={24} /></div>
                                        <div><p className="text-sm text-slate-500 font-bold mb-1 uppercase">Cumplimiento</p><h3 className="text-2xl font-black text-emerald-600 m-0">{complRate}%</h3></div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </>
      }

            {showGlobalSignatureModal &&
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-start justify-center overflow-y-auto px-4 pt-24 pb-8">
                    <div className="animate-fade-in w-full max-w-[850px] bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl mx-auto">
                        <h3 className="mt-0 text-slate-800 dark:text-slate-100 font-extrabold border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2 text-lg">
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
                                </label>
                                <div className="flex flex-col items-center justify-center flex-[1] min-h-[150px] bg-white dark:bg-slate-800 border-[2px_dashed_var(--color-border)] rounded-[12px] p-[0.5rem] text-center">
                                    {professionalData?.signature ?
                <img src={professionalData.signature} alt="Firma Profesional" className="max-height-[65px] object-fit-[contain] mb-[0.4rem]" /> :

                <span className="text-[#94a3b8] font-style-[italic] mb-[0.4rem] text-[0.8rem]">Sin firma</span>
                }
                                    <p className="m-[0] font-[800] text-slate-700 dark:text-slate-300 text-[0.85rem]">{professionalData?.name || 'No configurado'}</p>
                                    <p className="m-[0] font-[600] text-[#64748b] text-[0.75rem]">{professionalData?.license ? `Mat. ${professionalData.license}` : 'Sin matrícula'}</p>
                                </div>
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
                            <button onClick={() => setShowGlobalSignatureModal(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm hover-scale">
                                Cancelar
                            </button>
                            <button onClick={() => setShowGlobalSignatureModal(false)} className="bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-5 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover-scale">
                                <CheckCircle2 size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
      }

            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={Array.isArray(shareItem) ? "Inventario de Extintores" : `Ficha Técnica - Extintor #${shareItem?.numero}`}
        text={shareItem ? Array.isArray(shareItem) ? `🧯 Inventario de Extintores\n📊 Total: ${shareItem.length}` : `📋 Ficha de Extintor\n🔥 Chapa: ${shareItem.numero}\n📍 Ubicación: ${shareItem.ubicacion}` : ''}
        rawMessage={''}
        elementIdToPrint="pdf-content"
        fileName={Array.isArray(shareItem) ? `Inventario_Extintores_${filterEmpresa || 'Completo'}.pdf` : `Ficha_Extintor_${shareItem?.numero || 'Reporte'}.pdf`} />
      
            {(printItem || shareItem) && createPortal(
        <div
          className="ats-pdf-offscreen active-portal-print"
          aria-hidden="true">
          
                    {printItem && !Array.isArray(printItem) || shareItem && !Array.isArray(shareItem) ?
          <ExtinguisherProfilePdf data={printItem || shareItem || formData} isHeadless={true} /> :

          <ExtinguisherPdfGenerator extinguishers={Array.isArray(printItem) ? printItem : Array.isArray(shareItem) ? shareItem : []} showSignatures={globalShowSignatures} globalSignatures={globalSignaturesData} />
          }
                </div>,
        document.body
      )}

            {showCalendar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><CalendarDays size={24} className="text-amber-500" /> Vencimientos Próximos</h2>
                            <button onClick={() => setShowCalendar(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer">✕</button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
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

                                if (upcomingKeys.length === 0) return <div className="text-center p-8 text-slate-500 font-bold">No hay vencimientos en los próximos meses.</div>;

                                return upcomingKeys.map(key => {
                                    const [y, m] = key.split('-');
                                    const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                                    return (
                                        <div key={key} className="mb-6">
                                            <h3 className="uppercase tracking-wider font-bold text-sm text-slate-500 mb-3 border-b border-slate-200 pb-2">{monthName} <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs ml-2">{grouped[key].length}</span></h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {grouped[key].map((item: any, i: number) => (
                                                    <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-200 m-0 text-sm">{item.numero} - {item.tipo}</p>
                                                            <p className="text-xs text-slate-500 m-0">{item.ubicacion}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[0.65rem] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg uppercase">{item.reason}</span>
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
                    <div className="card w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
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
                    <div className="no-print flex flex-col gap-6 mb-8">
                        <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
          title={editingId ? 'Editar Extintor' : 'Registrar Nuevo Extintor'}
          subtitle="Ficha Técnica del Extintor"
          icon={<Flame size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          

                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <></>
                        </div>
                    </div>
                    <form onSubmit={(e) => {e.preventDefault();requirePro(() => handleSave(e));}} className="flex flex-col gap-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border-2 border-blue-500">
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
                            <div className="grid-column-[1_/_-1]">
                                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">FOTO DEL EQUIPO (OPCIONAL)</label>
                                <div className="flex items-center gap-4">
                                    <label className="p-[0.8rem_1.5rem] bg-[rgba(37,99,235,0.1)] text-blue-600 dark:text-blue-400 border-[1px_dashed_rgba(37,99,235,0.3)] rounded-[12px] cursor-pointer flex items-center gap-[0.5rem] font-[800]">
                                        <Camera size={20} /> Subir Foto
                                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files)} className="none" />
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
                        
                        <div className="flex gap-[1rem] justify-end mt-[2rem] flex-wrap">
                            {editingId && (
                                <button type="button" onClick={() => setShowHistoryModal(formData)} className="p-[0.8rem_1.5rem] rounded-[12px] border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-[800] cursor-pointer flex items-center gap-[0.5rem] mr-auto transition-colors">
                                    <History size={18} /> Ver Historial
                                </button>
                            )}
                            <button type="button" onClick={() => {setShowForm(false);setEditingId(null);}} className="p-[0.8rem_1.5rem] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] font-[800] cursor-pointer text-[var(--color-text)]">Cancelar</button>
                            <button type="button" onClick={() => {
              setPrintItem(formData);
              setTimeout(() => {
                window.print();
                setTimeout(() => setPrintItem(null), 10000);
              }, 600);
            }} className="p-[0.8rem_1.5rem] rounded-[12px] border-[2px_solid_#10b981] text-[#10b981] bg-[rgba(16,_185,_129,_0.05)] font-[800] cursor-pointer flex items-center gap-[0.5rem]">
                                <Printer size={18} /> Generar PDF
                            </button>
                            <button type="button" onClick={() => {setShareItem(formData);}} className="p-[0.8rem_1.5rem] rounded-[12px] border-[2px_solid_#3b82f6] text-[#3b82f6] bg-[rgba(59,_130,_246,_0.05)] font-[800] cursor-pointer flex items-center gap-[0.5rem]">
                                <Share2 size={18} /> Compartir
                            </button>
                            <button type="submit" className="p-[0.8rem_1.5rem] rounded-[12px] border-none bg-[var(--color-primary)] text-[#fff] font-[900] cursor-pointer box-shadow-[0_4px_12px_rgba(var(--color-primary-rgb),_0.3)]">Guardar Equipo</button>
                        </div>

                        <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                            <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                                <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas en Ficha Técnica
                            </h3>

                            <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                                <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                                <div className="flex gap-[1rem] flex-wrap justify-center">
                                    {[
                { id: 'professional', label: 'Profesional (Tú)' },
                { id: 'supervisor', label: 'Supervisor / Responsable' },
                { id: 'operator', label: 'Operador / Sector' }].
                map((sig) => {
                  const isChecked = formData.showSignatures?.[sig.id];
                  return (
                    <label
                      key={sig.id}
                      style={{
                        background: isChecked ? 'var(--color-primary)' : 'rgba(var(--color-text-rgb), 0.05)',
                        color: isChecked ? '#fff' : 'var(--color-text-muted)',
                        border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        boxShadow: isChecked ? '0 4px 12px rgba(var(--color-primary-rgb), 0.3)' : 'none'
                      }} className="flex items-center gap-[0.5rem] p-[0.6rem_1.25rem] rounded-[2rem] cursor-pointer font-[700] text-[0.85rem] transition-[all_0.2s_ease]">
                      
                                                <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setFormData({ ...formData, showSignatures: { ...formData.showSignatures, [sig.id]: e.target.checked } as any })} className="none" />

                      
                                                <div style={{
                        border: `2px solid ${isChecked ? '#fff' : 'var(--color-text-muted)'}`,
                        background: isChecked ? '#fff' : 'transparent'
                      }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center">
                                                    {isChecked && <div className="w-[8px] h-[8px] bg-[var(--color-primary)] rounded-[2px]" />}
                                                </div>
                                                {sig.label}
                                            </label>);

                })}
                                </div>
                            </div>

                            {/* On-Sheet Visual Preview */}
                            <div className="no-print transform-[scale(0.9)] transform-origin-[top_center] opacity-[0.8] pointer-events-[none]">
                                <PdfSignatures
                data={formData}
                box1={formData.showSignatures?.operator ? {
                  title: 'OPERADOR',
                  subtitle: 'Responsable de sector',
                  signatureUrl: formData.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={formData.showSignatures?.professional !== false ? {
                  title: 'INSPECTOR / PROFESIONAL',
                  subtitle: (professionalData.name || 'Profesional HSE').toUpperCase(),
                  signatureUrl: professionalData.signature || formData.professionalSignature || null,
                  stampUrl: professionalData.stamp || null,
                  isProfessional: true,
                  license: professionalData.license || formData.professionalLicense || null
                } : null}
                box3={formData.showSignatures?.supervisor ? {
                  title: 'SUPERVISOR',
                  subtitle: 'Aprobación HSE',
                  signatureUrl: formData.supervisorSignature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                            </div>

                            <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                                {formData.showSignatures?.operator &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                        <SignatureCanvas
                  onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={formData.operatorSignature}
                  label="Firma del Operador / Sector" />
                
                                    </div>
              }
                                
                                {formData.showSignatures?.supervisor &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                        <SignatureCanvas
                  onSave={(sig) => setFormData((prev) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={formData.supervisorSignature}
                  label="Firma del Supervisor" />
                
                                    </div>
              }
                            </div>
                        </div>
                    </form>
                </div> :

      <>
                    <div className="mb-[2rem] flex gap-[1rem] flex-wrap items-stretch bg-[var(--color-surface,_#fff)] p-[1.5rem] rounded-[24px] box-shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-[1px_solid_rgba(0,0,0,0.05)]">
                        <div className="flex-[1_1_250px] relative">
                            <Search size={22} className="absolute left-[1.2rem] top-[50%] transform-[translateY(-50%)] text-[#94a3b8]" />
                            <input
              type="text"
              placeholder="Buscar por Nº, tipo o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}

              onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
              onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}} className="w-[100%] h-[100%] min-h-[3.5rem] p-[1rem_1rem_1rem_3.5rem] rounded-[16px] border-[2px_solid_transparent] bg-slate-50 dark:bg-slate-800/50 text-[1rem] outline-[none] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)] font-[500] text-slate-700 dark:text-slate-300" />
            
                        </div>
                        <div className="flex-[1_1_250px] relative">
                            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              style={{ color: filterEmpresa ? '#334155' : '#94a3b8' }}
              onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
              onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}} className="w-[100%] h-[100%] min-h-[3.5rem] p-[1rem_2.5rem_1rem_1.2rem] rounded-[16px] border-[2px_solid_transparent] bg-slate-50 dark:bg-slate-800/50 text-[1rem] outline-[none] appearance-[none] cursor-pointer transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)] font-[500]">
              
                                <option value="">🏢 Todas las Empresas</option>
                                {uniqueEmpresas.map((emp) =>
              <option key={emp} value={emp}>{emp}</option>
              )}
                            </select>
                            <div className="absolute right-[1.2rem] top-[50%] transform-[translateY(-50%)] pointer-events-[none] text-[#94a3b8]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                        <button
            onClick={() => requirePro(() => setShowForm(true))}

            onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
            onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}} className="flex-[0_1_auto] min-h-[3.5rem] p-[0_1.8rem] rounded-[16px] bg-[linear-gradient(135deg,_#10b981_0%,_#059669_100%)] text-[#fff] border-none font-[800] text-[1rem] cursor-pointer flex items-center justify-center gap-[0.6rem] box-shadow-[0_8px_20px_rgba(16,185,129,0.3)] white-space-[nowrap] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
            
                            <Plus size={22} strokeWidth={2.5} /> Registrar Matafuego
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer">
                            <DownloadCloud size={18} /> Descargar Plantilla
                        </button>
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors border border-blue-200 cursor-pointer">
                            <UploadCloud size={18} /> Importar Excel
                            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleExcelImport} />
                        </label>
                        <button onClick={() => setShowCalendar(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-colors border border-amber-200 cursor-pointer">
                            <CalendarDays size={18} /> Calendario de Vencimientos
                        </button>
                    </div>

                    <div className="flex gap-[0.8rem] mb-[1.5rem] flex-wrap justify-end">
                        {filtered.length > 0 &&
          <>
                                <style>
                                    {`
                                        .action-btn-premium {
                                            display: flex;
                                            align-items: center;
                                            gap: 0.5rem;
                                            padding: 0.6rem 1.2rem;
                                            font-size: 0.8rem;
                                            font-weight: 800;
                                            border-radius: 50px;
                                            border: none;
                                            cursor: pointer;
                                            color: white;
                                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                            letter-spacing: 0.5px;
                                        }
                                        .btn-pdf {
                                            background: linear-gradient(135deg, #f87171, #ef4444);
                                            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                                        }
                                        .btn-pdf:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
                                        }
                                        .btn-excel {
                                            background: linear-gradient(135deg, #10b981, #059669);
                                            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                                        }
                                        .btn-excel:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                                        }
                                        .btn-share {
                                            background: linear-gradient(135deg, #3b82f6, #2563eb);
                                            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                                        }
                                        .btn-share:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                                        }
                                    `}
                                </style>
                                <button onClick={() => requirePro(() => setShowGlobalSignatureModal(true))} className="action-btn-premium bg-slate-600 dark:bg-slate-500 shadow-md">
                                    <Pencil size={16} /> FIRMAS PDF
                                </button>
                                <button onClick={() => requirePro(handlePrintPdf)} className="action-btn-premium btn-pdf">
                                    <Printer size={16} /> IMPRIMIR PDF
                                </button>
                                <button onClick={() => requirePro(handleExportExcel)} className="action-btn-premium btn-excel">
                                    <Download size={16} /> EXPORTAR EXCEL
                                </button>
                                <button onClick={() => requirePro(() => setShareItem(filtered))} className="action-btn-premium btn-share">
                                    <Share2 size={16} /> COMPARTIR
                                </button>
                            </>
          }
                    </div>

                    <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder=""
          emptyMessage="No hay extintores registrados."
          emptyIcon={<Flame size={48} />} />
        

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
            {showQrModal && qrData &&
            <div className="fixed inset-[0] z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-filter-[blur(4px)] p-4">
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
                <div className="card animate-fade-in w-[100%] max-w-[400px] bg-white rounded-2xl p-0 overflow-hidden relative shadow-2xl flex flex-col">
                    
                    {/* The Printable A6 Template Area */}
                    <div id="printable-qr-label" className="p-8 flex flex-col items-center bg-white border-b-2 border-dashed border-slate-200">
                        <button onClick={() => setShowQrModal(false)} className="no-print absolute top-[1rem] right-[1rem] bg-slate-100 text-slate-600 border-none w-[32px] h-[32px] rounded-[50%] cursor-pointer flex items-center justify-center hover:bg-slate-200 transition-colors z-10">✕</button>
                        
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

                        <div className="p-4 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100 relative group w-48 h-48 flex items-center justify-center">
                            <img src={qrData.url} alt="QR Extintor" className="w-[100%] h-[100%] block" />
                        </div>
                        
                        <p className="mt-6 mb-0 text-xs text-slate-400 font-bold tracking-wider uppercase text-center w-full">
                            ESCANEE PARA INSPECCIÓN Y TRAZABILIDAD
                        </p>
                    </div>
                    
                    {/* Modal Controls (Not Printable) */}
                    <div className="no-print p-6 bg-slate-50 flex flex-col gap-3">
                        <button onClick={() => window.print()} className="w-full p-4 bg-blue-600 text-white border-none rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
                            <Printer size={18} /> IMPRIMIR ETIQUETA A6
                        </button>
                        <button onClick={() => {
                            const a = document.createElement('a');
                            a.href = qrData.url;
                            a.download = `QR_${qrData.ext.numero}.png`;
                            a.click();
                        }} className="w-full p-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                            <QrCode size={18} /> DESCARGAR SOLO IMAGEN QR
                        </button>
                    </div>
                </div>
            </div>
      }
        </div>);

}