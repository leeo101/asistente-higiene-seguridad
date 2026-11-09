import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  QrCode,
  Scan,
  Plus,
  Fire,
  HardHat,
  Lightning,
  Truck,
  CheckCircle,
  DownloadSimple,
  Printer,
  Trash,
  X,
  MagnifyingGlass,
  Wrench,
  ShieldCheck,
  Tag,
  Camera,
  PencilSimple,
  ClipboardText,
  FileCsv,
  ArrowSquareOut,
  Warning,
  XCircle,
  UploadSimple,
  MapPin,
  Barcode,
  CalendarBlank
} from '@phosphor-icons/react';
import { HeartPulse } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usePaywall } from '../hooks/usePaywall';

export type AssetCategory = 'Extintor' | 'Tablero Eléctrico' | 'Maquinaria' | 'EPP / Arnés' | 'Vehículo';
export type AssetStatus = 'Operativo' | 'Requiere Mantenimiento' | 'Fuera de Servicio';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  location: string;
  serialNumber: string;
  lastInspection: string;
  status: AssetStatus;
  notes?: string;
  inspector?: string;
}

const DEFAULT_ASSETS: Asset[] = [
  {
    id: 'AST-1001',
    name: 'Extintor PQS 10kg - Sector A',
    category: 'Extintor',
    location: 'Planta Baja - Pasillo Principal',
    serialNumber: 'EQ-88392',
    lastInspection: new Date().toISOString().slice(0, 10),
    status: 'Operativo',
    notes: 'Presión en rango verde, precinto y marbete vigentes.',
    inspector: 'Servicio H&S'
  },
  {
    id: 'AST-1002',
    name: 'Tablero Principal de Fuerza TGBT',
    category: 'Tablero Eléctrico',
    location: 'Sala de Máquinas - Sector Norte',
    serialNumber: 'TBL-409',
    lastInspection: new Date().toISOString().slice(0, 10),
    status: 'Operativo',
    notes: 'Disyuntores diferenciales operativos, contratapa colocada y puesta a tierra verificada.',
    inspector: 'Servicio H&S'
  },
  {
    id: 'AST-1003',
    name: 'Autoelevador Eléctrico Toyota 2.5T',
    category: 'Maquinaria',
    location: 'Depósito Logístico - Nave 2',
    serialNumber: 'CLARK-204',
    lastInspection: new Date().toISOString().slice(0, 10),
    status: 'Requiere Mantenimiento',
    notes: 'Revisar alarma acústica de retroceso y desgaste de cadenas de izaje.',
    inspector: 'Servicio H&S'
  }
];

const CATEGORIES: AssetCategory[] = [
  'Extintor',
  'Tablero Eléctrico',
  'Maquinaria',
  'EPP / Arnés',
  'Vehículo'
];

export default function AssetQRScanner() {
  const navigate = useNavigate();
  const { isPro, loading } = usePaywall();

  // Bloqueo PRO — solo usuarios con suscripción activa pueden usar el Escáner QR
  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('ehs_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ASSETS;
    } catch (e) {
      return DEFAULT_ASSETS;
    }
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) || assets[0] || null,
    [assets, selectedAssetId]
  );

  // Filtros de búsqueda, estado y categoría
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');

  // Modal Crear / Editar Activo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    category: 'Extintor',
    location: '',
    serialNumber: '',
    lastInspection: new Date().toISOString().slice(0, 10),
    status: 'Operativo',
    notes: '',
    inspector: ''
  });

  // Modal Inspección Rápida en Terreno
  const [inspectingAsset, setInspectingAsset] = useState<Asset | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<AssetStatus>('Operativo');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionInspector, setInspectionInspector] = useState('');

  // Modal Escáner QR en Vivo (Cámara / Imagen)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const qrPreviewCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('ehs_assets', JSON.stringify(assets));
  }, [assets]);

  // Limpiar cámara al cerrar el modal de escaneo
  useEffect(() => {
    if (!isScannerOpen && qrScannerRef.current) {
      qrScannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          qrScannerRef.current?.clear();
          qrScannerRef.current = null;
          setIsCameraRunning(false);
        });
    }
  }, [isScannerOpen]);

  // Métricas KPI
  const metrics = useMemo(() => {
    const total = assets.length;
    const operativos = assets.filter((a) => a.status === 'Operativo').length;
    const mantenimiento = assets.filter((a) => a.status === 'Requiere Mantenimiento').length;
    const fueraServicio = assets.filter((a) => a.status === 'Fuera de Servicio').length;
    return { total, operativos, mantenimiento, fueraServicio };
  }, [assets]);

  // Construir URL pública con parámetros para que funcione incluso escaneando desde otro dispositivo
  const buildAssetPublicUrl = (asset: Asset) => {
    const params = new URLSearchParams({
      name: asset.name,
      category: asset.category,
      location: asset.location,
      serial: asset.serialNumber,
      status: asset.status,
      lastInspection: asset.lastInspection,
      ...(asset.notes ? { notes: asset.notes } : {})
    });
    return `${window.location.origin}/v/guest/asset/${encodeURIComponent(asset.id)}?${params.toString()}`;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Extintor',
      location: '',
      serialNumber: '',
      lastInspection: new Date().toISOString().slice(0, 10),
      status: 'Operativo',
      notes: '',
      inspector: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingId(asset.id);
    setFormData({
      name: asset.name,
      category: asset.category,
      location: asset.location,
      serialNumber: asset.serialNumber,
      lastInspection: asset.lastInspection,
      status: asset.status,
      notes: asset.notes || '',
      inspector: asset.inspector || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.location?.trim()) {
      toast.error('Complete el nombre y la ubicación física del activo');
      return;
    }

    if (editingId) {
      const updated = assets.map((a) =>
        a.id === editingId
          ? {
              ...a,
              name: formData.name!.trim(),
              category: (formData.category as AssetCategory) || 'Extintor',
              location: formData.location!.trim(),
              serialNumber: formData.serialNumber?.trim() || a.serialNumber,
              lastInspection: formData.lastInspection || a.lastInspection,
              status: (formData.status as AssetStatus) || 'Operativo',
              notes: formData.notes?.trim() || '',
              inspector: formData.inspector?.trim() || a.inspector
            }
          : a
      );
      setAssets(updated);
      setSelectedAssetId(editingId);
      toast.success('¡Datos del activo actualizados correctamente!');
    } else {
      const created: Asset = {
        id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name.trim(),
        category: (formData.category as AssetCategory) || 'Extintor',
        location: formData.location.trim(),
        serialNumber:
          formData.serialNumber?.trim() ||
          `SN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        lastInspection: formData.lastInspection || new Date().toISOString().slice(0, 10),
        status: (formData.status as AssetStatus) || 'Operativo',
        notes: formData.notes?.trim() || '',
        inspector: formData.inspector?.trim() || 'Servicio H&S'
      };
      setAssets([created, ...assets]);
      setSelectedAssetId(created.id);
      toast.success('¡Activo registrado con etiqueta QR oficial generada!');
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (window.confirm(`¿Desea eliminar el activo "${name}" (${id}) del inventario QR?`)) {
      const updated = assets.filter((a) => a.id !== id);
      setAssets(updated);
      if (selectedAsset?.id === id) {
        setSelectedAssetId(updated[0]?.id || '');
      }
      toast.success('Activo eliminado del inventario');
    }
  };

  const openInspectionModal = (asset: Asset) => {
    setInspectingAsset(asset);
    setInspectionStatus(asset.status);
    setInspectionNotes(asset.notes || '');
    setInspectionInspector(asset.inspector || 'Servicio H&S');
  };

  const handleConfirmInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingAsset) return;
    const today = new Date().toISOString().slice(0, 10);
    const updated = assets.map((a) =>
      a.id === inspectingAsset.id
        ? {
            ...a,
            status: inspectionStatus,
            lastInspection: today,
            notes: inspectionNotes.trim(),
            inspector: inspectionInspector.trim() || 'Servicio H&S'
          }
        : a
    );
    setAssets(updated);
    setSelectedAssetId(inspectingAsset.id);
    setInspectingAsset(null);
    toast.success(`Inspección registrada para ${inspectingAsset.name}`);
  };

  // Procesar resultado de escaneo QR (desde cámara, imagen o código manual)
  const handleDecodedQR = (decodedText: string) => {
    const raw = decodedText.trim();
    if (!raw) return;

    // 1. Buscar coincidencia por ID de activo en ehs_assets (ej. AST-1001 dentro de URL o directo)
    const foundAsset = assets.find(
      (a) =>
        raw.toUpperCase() === a.id.toUpperCase() ||
        raw.toUpperCase() === a.serialNumber.toUpperCase() ||
        raw.includes(`/asset/${a.id}`) ||
        raw.includes(encodeURIComponent(a.id))
    );

    if (foundAsset) {
      setSelectedAssetId(foundAsset.id);
      setIsScannerOpen(false);
      toast.success(`¡Activo detectado: ${foundAsset.name} (${foundAsset.id})!`);
      openInspectionModal(foundAsset);
      return;
    }

    // 2. Si es un QR de extintor específico
    if (raw.startsWith('app://asset/extinguisher/')) {
      const extId = raw.split('/').pop();
      setIsScannerOpen(false);
      navigate('/extintores?edit=' + extId);
      return;
    }

    // 3. Si es una URL de verificación de este sistema
    if (raw.startsWith(window.location.origin)) {
      setIsScannerOpen(false);
      const path = raw.replace(window.location.origin, '');
      navigate(path);
      return;
    }

    toast.error(`Código escaneado no encontrado en inventario local: ${raw}`);
  };

  const startLiveScanner = async () => {
    try {
      setIsCameraRunning(true);
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('asset-live-qr-reader');
          qrScannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 230, height: 230 } },
            (decodedText) => {
              html5QrCode
                .stop()
                .catch(() => {})
                .finally(() => {
                  html5QrCode.clear();
                  qrScannerRef.current = null;
                  setIsCameraRunning(false);
                  handleDecodedQR(decodedText);
                });
            },
            () => {}
          );
        } catch (err) {
          console.error('Error iniciando cámara QR:', err);
          setIsCameraRunning(false);
          toast.error('No se pudo acceder a la cámara. Podés subir una foto del QR o ingresar el código.');
        }
      }, 150);
    } catch (e) {
      setIsCameraRunning(false);
    }
  };

  const stopLiveScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {}
      qrScannerRef.current = null;
    }
    setIsCameraRunning(false);
  };

  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Leyendo código QR de la imagen...');
    try {
      const html5QrCode = new Html5Qrcode('asset-file-qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      toast.dismiss(toastId);
      html5QrCode.clear();
      handleDecodedQR(decodedText);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('No se detectó un código QR válido en la imagen seleccionada.');
    }
    e.target.value = '';
  };

  // Exportar inventario a CSV
  const handleExportCSV = () => {
    if (!assets.length) {
      toast.error('No hay activos registrados para exportar.');
      return;
    }
    const headers = [
      'ID Activo',
      'Nombre / Descripción',
      'Categoría',
      'Ubicación Física / Sector',
      'Nº de Serie',
      'Estado Actual',
      'Última Inspección',
      'Inspector',
      'Observaciones',
      'Enlace QR Verificación'
    ];
    const rows = assets.map((a) =>
      [
        `"${a.id}"`,
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${a.category}"`,
        `"${(a.location || '').replace(/"/g, '""')}"`,
        `"${(a.serialNumber || '').replace(/"/g, '""')}"`,
        `"${a.status}"`,
        `"${a.lastInspection}"`,
        `"${(a.inspector || 'Servicio H&S').replace(/"/g, '""')}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
        `"${buildAssetPublicUrl(a)}"`
      ].join(';')
    );
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventario_QR_Activos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventario de activos QR exportado en CSV');
  };

  // Función real de Impresión del Tag QR en Ventana o Hoja A6 de Inspección
  const handlePrintQR = () => {
    if (!selectedAsset) return;
    const svg = document.getElementById('asset-qr-svg');
    let qrDataUrl = '';

    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      qrDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }

    const printWindow = window.open('', '_blank', 'width=620,height=760');
    if (!printWindow) {
      window.print();
      return;
    }

    const statusBg =
      selectedAsset.status === 'Operativo'
        ? '#059669'
        : selectedAsset.status === 'Requiere Mantenimiento'
        ? '#d97706'
        : '#dc2626';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta QR — ${selectedAsset.name}</title>
          <style>
            @page { size: A6 portrait; margin: 5mm; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: #ffffff;
              color: #0f172a;
            }
            .card {
              border: 4px solid #0f172a;
              border-radius: 20px;
              padding: 20px;
              max-width: 330px;
              width: 100%;
              box-sizing: border-box;
            }
            .badge {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #065f46;
              background: #d1fae5;
              border: 1px solid #6ee7b7;
              padding: 5px 12px;
              border-radius: 9999px;
              display: inline-block;
              margin-bottom: 10px;
            }
            .qr-box {
              background: #ffffff;
              padding: 12px;
              border-radius: 16px;
              border: 2px solid #cbd5e1;
              display: inline-block;
              margin: 8px 0;
            }
            .qr-box img {
              width: 185px;
              height: 185px;
              display: block;
            }
            .title {
              font-size: 17px;
              font-weight: 900;
              color: #0f172a;
              margin: 8px 0 4px 0;
              line-height: 1.25;
            }
            .meta {
              font-size: 12px;
              font-weight: 800;
              color: #334155;
              margin-bottom: 4px;
            }
            .location {
              font-size: 12px;
              font-weight: 800;
              color: #047857;
              margin-top: 4px;
            }
            .insp {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              margin-top: 4px;
            }
            .status {
              display: inline-block;
              margin-top: 12px;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              background: ${statusBg};
              color: #ffffff;
            }
            .footer {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              margin-top: 14px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">🛡️ ASISTENTE H&S — CONTROL DE ACTIVO</div>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="title">${selectedAsset.name}</div>
            <div class="meta">ID: ${selectedAsset.id} • Serie: ${selectedAsset.serialNumber}</div>
            <div class="meta">Categoría: ${selectedAsset.category}</div>
            <div class="location">📍 ${selectedAsset.location}</div>
            <div class="insp">📅 Últ. Inspección: ${selectedAsset.lastInspection}</div>
            <div class="status">ESTADO: ${selectedAsset.status}</div>
            <div class="footer">Escaneá este código QR en terreno para auditar e inspeccionar el activo</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 350);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`Iniciando impresión de etiqueta para ${selectedAsset.name}`);
  };

  // Función para Descargar la Imagen PNG del QR con etiqueta integrada
  const handleDownloadQR = () => {
    if (!selectedAsset) return;
    const svg = document.getElementById('asset-qr-svg');
    if (!svg) {
      toast.error('No se pudo generar la imagen del código QR');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 420;
      canvas.height = 520;
      if (ctx) {
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Borde industrial
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

        // Encabezado
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 13px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ASISTENTE H&S — ETIQUETA QR DE ACTIVO', canvas.width / 2, 48);

        // Dibujar QR centrado
        const qrSize = 240;
        ctx.drawImage(img, (canvas.width - qrSize) / 2, 68, qrSize, qrSize);

        // Textos del activo
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px Segoe UI, sans-serif';
        ctx.fillText(selectedAsset.name.slice(0, 34), canvas.width / 2, 345);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 13px Segoe UI, sans-serif';
        ctx.fillText(
          `ID: ${selectedAsset.id}  •  Serie: ${selectedAsset.serialNumber}`,
          canvas.width / 2,
          372
        );

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 13px Segoe UI, sans-serif';
        ctx.fillText(`Ubicación: ${selectedAsset.location.slice(0, 38)}`, canvas.width / 2, 398);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px Segoe UI, sans-serif';
        ctx.fillText(`Últ. Inspección: ${selectedAsset.lastInspection}`, canvas.width / 2, 422);

        // Píldora de estado
        ctx.fillStyle =
          selectedAsset.status === 'Operativo'
            ? '#059669'
            : selectedAsset.status === 'Requiere Mantenimiento'
            ? '#d97706'
            : '#dc2626';
        ctx.fillRect(90, 442, canvas.width - 180, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Segoe UI, sans-serif';
        ctx.fillText(`ESTADO: ${selectedAsset.status.toUpperCase()}`, canvas.width / 2, 464);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Etiqueta_QR_${selectedAsset.id}_${selectedAsset.name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('¡Etiqueta QR descargada en formato PNG!');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Filtrar activos por búsqueda, estado y categoría
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        (a.notes || '').toLowerCase().includes(q)
      );
    });
  }, [assets, statusFilter, categoryFilter, searchQuery]);

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'Extintor':
        return {
          icon: <Fire size={22} weight="duotone" style={{ color: '#f59e0b' }} />,
          bg: 'rgba(245, 158, 11, 0.14)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#fbbf24'
        };
      case 'Tablero Eléctrico':
        return {
          icon: <Lightning size={22} weight="duotone" style={{ color: '#3b82f6' }} />,
          bg: 'rgba(59, 130, 246, 0.14)',
          border: 'rgba(59, 130, 246, 0.35)',
          color: '#60a5fa'
        };
      case 'Maquinaria':
        return {
          icon: <Wrench size={22} weight="duotone" style={{ color: '#10b981' }} />,
          bg: 'rgba(16, 185, 129, 0.14)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#34d399'
        };
      case 'EPP / Arnés':
        return {
          icon: <HardHat size={22} weight="duotone" style={{ color: '#a855f7' }} />,
          bg: 'rgba(168, 85, 247, 0.14)',
          border: 'rgba(168, 85, 247, 0.35)',
          color: '#c084fc'
        };
      case 'Vehículo':
        return {
          icon: <Truck size={22} weight="duotone" style={{ color: '#6366f1' }} />,
          bg: 'rgba(99, 102, 241, 0.14)',
          border: 'rgba(99, 102, 241, 0.35)',
          color: '#818cf8'
        };
      default:
        return {
          icon: <Tag size={22} weight="duotone" style={{ color: '#10b981' }} />,
          bg: 'rgba(16, 185, 129, 0.14)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#34d399'
        };
    }
  };

  const getStatusBadgeStyle = (status: AssetStatus) => {
    if (status === 'Operativo') {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.16)',
        color: '#059669',
        border: '1.5px solid rgba(16, 185, 129, 0.45)',
        dot: '#10b981',
        label: 'Operativo'
      };
    }
    if (status === 'Requiere Mantenimiento') {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.16)',
        color: '#d97706',
        border: '1.5px solid rgba(245, 158, 11, 0.45)',
        dot: '#f59e0b',
        label: 'En Mantenimiento'
      };
    }
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.16)',
      color: '#dc2626',
      border: '1.5px solid rgba(239, 68, 68, 0.45)',
      dot: '#ef4444',
      label: 'Fuera de Servicio'
    };
  };

  return (
    <AnimatedPage>
      <div
        className="container min-h-[100vh] flex flex-col px-3 sm:px-4"
        style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
      >
        {/* Encabezado Oficial con Alto Contraste garantizado en Modo Claro y Oscuro */}
        <PremiumHeader
          title="Escáner e Inventario QR de Activos"
          subtitle="Etiquetado inteligente QR/NFC, auditoría rápida en terreno y trazabilidad de inspecciones para equipos críticos"
          badge="ISO 55001 · Ley 19.587 · Control de Activos"
          icon={<QrCode size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #047857 0%, #0d9488 50%, #0284c7 100%)"
        />

        {/* Barra Principal de Botones de Acción (Visibilidad 100% blindada y Responsiva en Celular) */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            borderRadius: '18px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(2,132,199,0.18))',
                border: '1px solid rgba(16,185,129,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0
              }}
            >
              <Scan size={22} weight="bold" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.2
                }}
              >
                Centro de Identificación y Escaneo en Terreno
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginTop: '2px'
                }}
              >
                Escaneá una etiqueta con tu cámara o seleccioná un equipo para imprimir su código QR oficial
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Botón Escanear QR en Vivo */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              <Camera size={18} weight="bold" color="#ffffff" />
              <span>Escanear Código QR</span>
            </button>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  whiteSpace: 'nowrap'
                }}
                title="Exportar inventario QR completo a Excel / CSV"
              >
                <FileCsv size={18} weight="bold" color="#ffffff" />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Registrar Nuevo Activo */}
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={18} weight="bold" color="#ffffff" />
                <span>Nuevo Activo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen KPI (Filtros Interactivos por Estado) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-4">
          <div
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '1rem 1.15rem',
              borderRadius: '18px',
              cursor: 'pointer',
              background:
                statusFilter === 'all' ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-surface)',
              border:
                statusFilter === 'all'
                  ? '2px solid #3b82f6'
                  : '1px solid var(--color-border)',
              boxShadow: statusFilter === 'all' ? '0 8px 20px rgba(37,99,235,0.15)' : 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#3b82f6',
                marginBottom: '6px'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Activos
              </span>
              <QrCode size={20} weight="duotone" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {metrics.total}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Etiquetas QR generadas
            </span>
          </div>

          <div
            onClick={() => setStatusFilter('Operativo')}
            style={{
              padding: '1rem 1.15rem',
              borderRadius: '18px',
              cursor: 'pointer',
              background:
                statusFilter === 'Operativo' ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface)',
              border:
                statusFilter === 'Operativo'
                  ? '2px solid #10b981'
                  : '1px solid var(--color-border)',
              boxShadow: statusFilter === 'Operativo' ? '0 8px 20px rgba(16,185,129,0.15)' : 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#10b981',
                marginBottom: '6px'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Operativos
              </span>
              <CheckCircle size={20} weight="duotone" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
              {metrics.operativos}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Habilitados para uso
            </span>
          </div>

          <div
            onClick={() => setStatusFilter('Requiere Mantenimiento')}
            style={{
              padding: '1rem 1.15rem',
              borderRadius: '18px',
              cursor: 'pointer',
              background:
                statusFilter === 'Requiere Mantenimiento'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'var(--color-surface)',
              border:
                statusFilter === 'Requiere Mantenimiento'
                  ? '2px solid #f59e0b'
                  : '1px solid var(--color-border)',
              boxShadow:
                statusFilter === 'Requiere Mantenimiento'
                  ? '0 8px 20px rgba(245,158,11,0.15)'
                  : 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#f59e0b',
                marginBottom: '6px'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mantenimiento
              </span>
              <Warning size={20} weight="duotone" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
              {metrics.mantenimiento}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Requieren revisión técnica
            </span>
          </div>

          <div
            onClick={() => setStatusFilter('Fuera de Servicio')}
            style={{
              padding: '1rem 1.15rem',
              borderRadius: '18px',
              cursor: 'pointer',
              background:
                statusFilter === 'Fuera de Servicio'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'var(--color-surface)',
              border:
                statusFilter === 'Fuera de Servicio'
                  ? '2px solid #ef4444'
                  : '1px solid var(--color-border)',
              boxShadow:
                statusFilter === 'Fuera de Servicio'
                  ? '0 8px 20px rgba(239,68,68,0.15)'
                  : 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ef4444',
                marginBottom: '6px'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fuera de Servicio
              </span>
              <XCircle size={20} weight="duotone" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ef4444', lineHeight: 1.1 }}>
              {metrics.fueraServicio}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Bloqueados / Baja
            </span>
          </div>
        </div>

        {/* Layout Principal Responsivo: Inventario (7 cols) + Previsualizador Etiqueta QR (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* 📋 COLUMNA IZQUIERDA: Inventario de Activos */}
          <div className="lg:col-span-7 space-y-4">
            {/* Buscador + Filtros de Categoría */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                padding: '1rem 1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} weight="duotone" style={{ color: '#10b981' }} />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.88rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'var(--color-text)'
                    }}
                  >
                    Padrón de Activos ({filteredAssets.length})
                  </h3>
                </div>

                {/* Buscador con alineación blindada */}
                <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
                  <MagnifyingGlass
                    size={16}
                    weight="bold"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, ID, serie o sector..."
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: searchQuery ? '32px' : '12px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      marginBottom: 0,
                      height: '38px',
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        minHeight: 'unset',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none'
                      }}
                      title="Limpiar búsqueda"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* Píldoras de Filtro por Categoría */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '2px'
                }}
              >
                {(['all', ...CATEGORIES] as const).map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #059669, #0d9488)'
                          : 'var(--color-background)',
                        color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                        border: isActive
                          ? '1px solid #059669'
                          : '1px solid var(--color-border)',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minHeight: 'unset',
                        boxShadow: isActive ? '0 3px 10px rgba(5, 150, 105, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat === 'all' ? 'Todos los Equipos' : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de Tarjetas de Activos */}
            <div className="space-y-3">
              {filteredAssets.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'var(--color-surface)',
                    borderRadius: '20px',
                    border: '1px dashed var(--color-border)'
                  }}
                >
                  <QrCode size={42} weight="duotone" style={{ color: '#64748b', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                    No se encontraron activos con los filtros aplicados
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '14px' }}>
                    Probá cambiar la categoría seleccionada o registrá un nuevo activo en el padrón.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const catMeta = getCategoryMeta(asset.category);
                  const statusStyle = getStatusBadgeStyle(asset.status);

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      style={{
                        padding: '1.1rem 1.25rem',
                        borderRadius: '20px',
                        background: 'var(--color-surface)',
                        border: isSelected
                          ? '2px solid #10b981'
                          : '1px solid var(--color-border)',
                        boxShadow: isSelected
                          ? '0 10px 28px -6px rgba(16, 185, 129, 0.25)'
                          : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Fila Superior: Icono + Datos Principales + Badge Estado */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '14px',
                              background: catMeta.bg,
                              border: `1px solid ${catMeta.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {catMeta.icon}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontWeight: 900,
                                  fontSize: '0.96rem',
                                  color: 'var(--color-text)',
                                  lineHeight: 1.25
                                }}
                              >
                                {asset.name}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 900,
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#059669',
                                  border: '1px solid rgba(16, 185, 129, 0.35)'
                                }}
                              >
                                {asset.id}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Tag size={13} weight="bold" style={{ color: '#0ea5e9' }} />
                                {asset.category}
                              </span>
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Barcode size={14} weight="bold" style={{ color: '#8b5cf6' }} />
                                Serie: {asset.serialNumber}
                              </span>
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
                                <MapPin size={13} weight="fill" />
                                {asset.location}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CalendarBlank size={13} weight="bold" />
                                Últ. Inspección: <strong>{asset.lastInspection}</strong>
                              </span>
                              {asset.notes && (
                                <span
                                  style={{
                                    maxWidth: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontStyle: 'italic'
                                  }}
                                  title={asset.notes}
                                >
                                  — "{asset.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Píldora de Estado */}
                        <span
                          style={{
                            backgroundColor: statusStyle.backgroundColor,
                            color: statusStyle.color,
                            border: statusStyle.border,
                            padding: '5px 12px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: statusStyle.dot
                            }}
                          />
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Fila Inferior: Botonera de Acciones 100% Visibles (Grilla 2x2 en celular, fila en escritorio) */}
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--color-border)'
                        }}
                        className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-end gap-2"
                      >
                        {/* Botón Ver Etiqueta QR */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssetId(asset.id);
                            qrPreviewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          style={{
                            backgroundColor: isSelected ? '#0f172a' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            minHeight: '34px'
                          }}
                          title="Previsualizar etiqueta QR oficial"
                        >
                          <QrCode size={15} weight="bold" color="#ffffff" />
                          <span>{isSelected ? 'QR Activo' : 'Ver QR'}</span>
                        </button>

                        {/* Botón Inspeccionar en Terreno */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspectionModal(asset);
                          }}
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            minHeight: '34px'
                          }}
                          title="Registrar inspección o cambiar estado operativo"
                        >
                          <ClipboardText size={15} weight="bold" color="#ffffff" />
                          <span>Inspeccionar</span>
                        </button>

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(asset);
                          }}
                          style={{
                            backgroundColor: '#d97706',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            minHeight: '34px'
                          }}
                          title="Editar datos del activo"
                        >
                          <PencilSimple size={15} weight="bold" color="#ffffff" />
                          <span>Editar</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id, asset.name);
                          }}
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            minHeight: '34px'
                          }}
                          title="Eliminar activo del padrón"
                        >
                          <Trash size={15} weight="bold" color="#ffffff" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 🔲 COLUMNA DERECHA: Previsualización e Impresión Real de Etiqueta QR */}
          <div className="lg:col-span-5" ref={qrPreviewCardRef}>
            <div
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: '24px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-lg)',
                position: 'sticky',
                top: '6.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {selectedAsset ? (
                <>
                  {/* Cabecera de la Etiqueta */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 14px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '12px'
                    }}
                  >
                    <ShieldCheck size={16} weight="fill" />
                    <span>Etiqueta QR Oficial de Inspección</span>
                  </div>

                  {/* Tarjeta Física Industrial Simulada (Siempre fondo blanco para lectura óptica perfecta) */}
                  <div
                    style={{
                      background: '#ffffff',
                      color: '#0f172a',
                      borderRadius: '22px',
                      border: '3px solid #0f172a',
                      padding: '1.25rem',
                      width: '100%',
                      maxWidth: '320px',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                      marginBottom: '1rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        color: '#047857',
                        backgroundColor: '#d1fae5',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        display: 'inline-block',
                        marginBottom: '10px'
                      }}
                    >
                      🛡️ ASISTENTE H&S — TAG DE ACTIVO
                    </div>

                    <div
                      style={{
                        padding: '12px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '2px solid #e2e8f0',
                        display: 'inline-block'
                      }}
                    >
                      <QRCodeSVG
                        id="asset-qr-svg"
                        value={buildAssetPublicUrl(selectedAsset)}
                        size={175}
                        level="H"
                      />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: '#0f172a',
                          lineHeight: 1.25
                        }}
                      >
                        {selectedAsset.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#475569',
                          marginTop: '4px'
                        }}
                      >
                        ID: {selectedAsset.id} • Serie: {selectedAsset.serialNumber}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#047857',
                          marginTop: '3px'
                        }}
                      >
                        📍 {selectedAsset.location}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#64748b',
                          marginTop: '3px'
                        }}
                      >
                        📅 Últ. Inspección: {selectedAsset.lastInspection}
                      </div>

                      <div
                        style={{
                          display: 'inline-block',
                          marginTop: '10px',
                          padding: '4px 14px',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          backgroundColor:
                            selectedAsset.status === 'Operativo'
                              ? '#059669'
                              : selectedAsset.status === 'Requiere Mantenimiento'
                              ? '#d97706'
                              : '#dc2626',
                          color: '#ffffff'
                        }}
                      >
                        ESTADO: {selectedAsset.status}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción del QR (Visibilidad 100% garantizada con estilos explícitos) */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        onClick={handlePrintQR}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          fontSize: '0.84rem',
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
                        }}
                      >
                        <Printer size={18} weight="bold" color="#ffffff" />
                        <span>Imprimir Tag QR (A6)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadQR}
                        style={{
                          background: 'linear-gradient(135deg, #059669, #0d9488)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          fontSize: '0.84rem',
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                          flexShrink: 0
                        }}
                        title="Descargar imagen PNG lista para imprimir"
                      >
                        <DownloadSimple size={18} weight="bold" color="#ffffff" />
                        <span>PNG</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => openInspectionModal(selectedAsset)}
                        style={{
                          flex: 1,
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <ClipboardText size={16} weight="bold" color="#ffffff" />
                        <span>Auditar / Inspeccionar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const url = buildAssetPublicUrl(selectedAsset).replace(window.location.origin, '');
                          navigate(url);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#475569',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        title="Ver ficha pública como la ve quien escanea el QR"
                      >
                        <ArrowSquareOut size={16} weight="bold" color="#ffffff" />
                        <span>Vista Escaneo</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  <QrCode size={52} weight="duotone" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                    Seleccioná un activo de la lista para visualizar, descargar o imprimir su etiqueta QR oficial.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── MODAL 1: CREAR / EDITAR ACTIVO ─── */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.82)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <form
              onSubmit={handleSaveAsset}
              style={{
                background: 'var(--color-surface-solid, #0f172a)',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '500px',
                padding: '1.5rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}
                  >
                    <QrCode size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      {editingId ? `Editar Activo (${editingId})` : 'Registrar Nuevo Activo QR'}
                    </h3>
                    <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      Generación automática de etiqueta QR verificable
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Nombre o Descripción del Activo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Extintor CO2 5kg - Laboratorio 2"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Categoría *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="Extintor">Extintor / Matafuego</option>
                      <option value="Tablero Eléctrico">Tablero Eléctrico</option>
                      <option value="Maquinaria">Maquinaria / Autoelevador</option>
                      <option value="EPP / Arnés">EPP / Arnés de Altura</option>
                      <option value="Vehículo">Vehículo / Flota</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Estado Operativo *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="Operativo">🟢 Operativo</option>
                      <option value="Requiere Mantenimiento">🟡 Requiere Mantenimiento</option>
                      <option value="Fuera de Servicio">🔴 Fuera de Servicio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Ubicación Física / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Nave 3 - Columna D4"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Nº de Serie / Código Interno
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. EQ-9921"
                      value={formData.serialNumber || ''}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Última Inspección
                    </label>
                    <input
                      type="date"
                      value={formData.lastInspection || ''}
                      onChange={(e) => setFormData({ ...formData, lastInspection: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Observaciones Técnicas / Notas de Inspección
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Presión normal, precinto intacto, próximo control mensual..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL 2: AUDITORÍA / INSPECCIÓN RÁPIDA EN TERRENO ─── */}
        {inspectingAsset && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.82)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <form
              onSubmit={handleConfirmInspection}
              style={{
                background: 'var(--color-surface-solid, #0f172a)',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '460px',
                padding: '1.5rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  marginBottom: '14px',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(2, 132, 199, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7'
                    }}
                  >
                    <ClipboardText size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      Inspección en Terreno — {inspectingAsset.id}
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                      {inspectingAsset.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingAsset(null)}
                  style={{
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    width: '34px',
                    height: '34px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '6px'
                    }}
                  >
                    Resultado de la Inspección Visual *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(
                      [
                        { value: 'Operativo', label: '🟢 Operativo — Apto para uso inmediato', color: '#059669' },
                        {
                          value: 'Requiere Mantenimiento',
                          label: '🟡 Requiere Mantenimiento — Con observación',
                          color: '#d97706'
                        },
                        {
                          value: 'Fuera de Servicio',
                          label: '🔴 Fuera de Servicio — Bloqueado / No usar',
                          color: '#dc2626'
                        }
                      ] as const
                    ).map((opt) => {
                      const active = inspectionStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setInspectionStatus(opt.value)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: active ? opt.color : 'var(--color-background)',
                            color: active ? '#ffffff' : 'var(--color-text)',
                            border: active ? `2px solid ${opt.color}` : '1px solid var(--color-border)',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Inspector / Responsable H&S
                  </label>
                  <input
                    type="text"
                    value={inspectionInspector}
                    onChange={(e) => setInspectionInspector(e.target.value)}
                    placeholder="Ej. Lic. Higiene y Seguridad"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Observaciones de Auditoría
                  </label>
                  <textarea
                    rows={3}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="Detalle el estado físico, hallazgos o acciones correctivas..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setInspectingAsset(null)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  Confirmar Inspección Hoy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL 3: ESCÁNER DE CÓDIGO QR EN VIVO (CÁMARA + FOTO + MANUAL) ─── */}
        {isScannerOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.86)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <div
              style={{
                background: 'var(--color-surface-solid, #0f172a)',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '480px',
                padding: '1.5rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  marginBottom: '14px',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <Scan size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      Escáner Óptico QR de Activos
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      Apuntá al código QR del equipo o subí una captura
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopLiveScanner();
                    setIsScannerOpen(false);
                  }}
                  style={{
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Contenedor oculto para escaneo por archivo */}
              <div id="asset-file-qr-reader" style={{ display: 'none' }} />

              {/* Visor de Cámara en Vivo */}
              {isCameraRunning ? (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <div
                    id="asset-live-qr-reader"
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '2px solid #0284c7',
                      background: '#000000',
                      minHeight: '260px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={stopLiveScanner}
                    style={{
                      marginTop: '10px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Detener Cámara
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={startLiveScanner}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      fontSize: '0.84rem',
                      fontWeight: 900,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    <Camera size={26} weight="bold" color="#ffffff" />
                    <span>Abrir Cámara QR</span>
                  </button>

                  <label
                    style={{
                      background: 'linear-gradient(135deg, #059669, #0d9488)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      fontSize: '0.84rem',
                      fontWeight: 900,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                      margin: 0,
                      textAlign: 'center'
                    }}
                  >
                    <UploadSimple size={26} weight="bold" color="#ffffff" />
                    <span>Subir Foto de QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanImageFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}

              {/* Búsqueda rápida por Código de Activo o Serie */}
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: '6px'
                  }}
                >
                  O ingresá el Código ID / Nº de Serie manualmente:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Ej. AST-1001 o EQ-88392"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDecodedQR(manualCodeInput)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
