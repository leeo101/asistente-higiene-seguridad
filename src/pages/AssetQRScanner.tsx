import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  X,
  MagnifyingGlass,
  Wrench,
  ShieldCheck,
  Building2,
  Tag
} from '@phosphor-icons/react';
import AnimatedPage from '../components/AnimatedPage';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Asset {
  id: string;
  name: string;
  category: 'Extintor' | 'Tablero Eléctrico' | 'Maquinaria' | 'EPP / Arnés' | 'Vehículo';
  location: string;
  serialNumber: string;
  lastInspection: string;
  status: 'Operativo' | 'Requiere Mantenimiento' | 'Fuera de Servicio';
}

export default function AssetQRScanner() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('ehs_assets');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'AST-1001',
              name: 'Extintor PQS 10kg - Sector A',
              category: 'Extintor',
              location: 'Planta Baja - Pasillo Principal',
              serialNumber: 'EQ-88392',
              lastInspection: new Date().toISOString().slice(0, 10),
              status: 'Operativo',
            },
            {
              id: 'AST-1002',
              name: 'Tablero Principal de Fuerza',
              category: 'Tablero Eléctrico',
              location: 'Sala de Máquinas',
              serialNumber: 'TBL-409',
              lastInspection: new Date().toISOString().slice(0, 10),
              status: 'Operativo',
            },
          ];
    } catch (e) {
      return [];
    }
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    category: 'Extintor',
    status: 'Operativo',
  });

  useEffect(() => {
    localStorage.setItem('ehs_assets', JSON.stringify(assets));
  }, [assets]);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.location) {
      toast.error('Complete el nombre y ubicación del activo');
      return;
    }
    const created: Asset = {
      id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newAsset.name,
      category: newAsset.category || 'Extintor',
      location: newAsset.location,
      serialNumber: newAsset.serialNumber || `SN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      lastInspection: new Date().toISOString().slice(0, 10),
      status: newAsset.status || 'Operativo',
    };
    setAssets([created, ...assets]);
    setSelectedAsset(created);
    setIsCreating(false);
    setNewAsset({ category: 'Extintor', status: 'Operativo' });
    toast.success('¡Activo registrado con código QR generado!');
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (window.confirm(`¿Desea eliminar el activo "${name}" del inventario QR?`)) {
      const updated = assets.filter((a) => a.id !== id);
      setAssets(updated);
      if (selectedAsset?.id === id) setSelectedAsset(updated[0] || null);
      toast.success('Activo eliminado del inventario');
    }
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

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

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
              padding: 20px;
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
              padding: 24px;
              max-width: 320px;
              width: 100%;
              box-sizing: border-box;
            }
            .badge {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #059669;
              background: #d1fae5;
              padding: 4px 12px;
              border-radius: 9999px;
              display: inline-block;
              margin-bottom: 12px;
            }
            .qr-box {
              background: #ffffff;
              padding: 12px;
              border-radius: 16px;
              border: 2px solid #cbd5e1;
              display: inline-block;
              margin: 12px 0;
            }
            .qr-box img {
              width: 180px;
              height: 180px;
              display: block;
            }
            .title {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              margin: 8px 0 4px 0;
            }
            .meta {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              margin-bottom: 4px;
            }
            .location {
              font-size: 12px;
              font-weight: 800;
              color: #059669;
              margin-top: 4px;
            }
            .status {
              display: inline-block;
              margin-top: 14px;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              background: #0f172a;
              color: #ffffff;
            }
            .footer {
              font-size: 10px;
              font-weight: 700;
              color: #94a3b8;
              margin-top: 16px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">🛡️ ASISTENTE H&S — ETIQUETA DE ACTIVO</div>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="title">${selectedAsset.name}</div>
            <div class="meta">ID: ${selectedAsset.id} • Serie: ${selectedAsset.serialNumber}</div>
            <div class="location">📍 ${selectedAsset.location}</div>
            <div class="status">ESTADO: ${selectedAsset.status}</div>
            <div class="footer">Escaneá este código QR en terreno para auditar la inspección</div>
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
    toast.success(`Iniciando ventana de impresión para ${selectedAsset.name}`);
  };

  // Función para Descargar la Imagen PNG del QR directamente
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
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
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

  // Filtrar activos por búsqueda
  const filteredAssets = assets.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q)
    );
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Extintor': return <Fire size={20} className="text-amber-500" />;
      case 'Tablero Eléctrico': return <Lightning size={20} className="text-blue-500" />;
      case 'Maquinaria': return <Wrench size={20} className="text-emerald-500" />;
      case 'EPP / Arnés': return <HardHat size={20} className="text-purple-500" />;
      case 'Vehículo': return <Truck size={20} className="text-indigo-500" />;
      default: return <Tag size={20} className="text-emerald-500" />;
    }
  };

  return (
    <AnimatedPage>
      {/* Margen Superior Adecuado para librar la Navbar (pt-24 sm:pt-28) */}
      <div className="min-h-screen bg-slate-950 pt-24 sm:pt-28 pb-12 px-3 sm:px-6 text-slate-100">
        <div className="max-w-[1280px] mx-auto space-y-6">
          
          {/* Header del Módulo estilo Aptitudes Médicas */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={() => navigate('/')}
                className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 cursor-pointer shadow-md transition-all shrink-0"
                title="Volver al Inicio"
              >
                <ArrowLeft size={22} className="text-white" />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/30">
                  <Scan size={16} className="text-emerald-400" />
                  Asset Tagging & QR Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight m-0">
                  Escáner e Inventario QR/NFC de Activos
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 m-0">
                  Generación e inspección instantánea de etiquetas QR en terreno para extintores, tableros, vehículos y equipos.
                </p>
              </div>
            </div>

            {/* Botón "+ Registrar Nuevo Activo" con Gradiente y Alto Contraste */}
            <button
              onClick={() => setIsCreating(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl border-none cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 relative z-10"
            >
              <Plus size={20} className="text-white" /> + Registrar Nuevo Activo
            </button>
          </div>

          {/* Modal Crear Activo */}
          {isCreating && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
              <form
                onSubmit={handleCreateAsset}
                className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <QrCode size={22} className="text-emerald-400" />
                    <h3 className="font-black text-base text-white m-0">Registrar Activo para QR</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                      Nombre o Descripción del Activo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Extintor CO2 5kg - Laboratorio 2"
                      value={newAsset.name || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">Categoría *</label>
                      <select
                        value={newAsset.category}
                        onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      >
                        <option value="Extintor">Extintor / Matafuego</option>
                        <option value="Tablero Eléctrico">Tablero Eléctrico</option>
                        <option value="Maquinaria">Maquinaria / Autoelevador</option>
                        <option value="EPP / Arnés">EPP / Arnés de Altura</option>
                        <option value="Vehículo">Vehículo / Flota</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">Estado *</label>
                      <select
                        value={newAsset.status}
                        onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      >
                        <option value="Operativo">🟢 Operativo</option>
                        <option value="Requiere Mantenimiento">🟡 Mantenimiento</option>
                        <option value="Fuera de Servicio">🔴 Fuera de Servicio</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                      Ubicación Física / Sector *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Nave 3 - Columna D4"
                      value={newAsset.location || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                      Nº de Serie / Código Interno
                    </label>
                    <input
                      type="text"
                      placeholder="Opcional (Ej. EQ-9921)"
                      value={newAsset.serialNumber || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md border-none cursor-pointer"
                  >
                    Guardar y Generar QR
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Layout Principal Responsivo (Lista + Previsualizador QR) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 📋 COLUMNA IZQUIERDA: Inventario de Activos (7 Col en Desktop) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Buscador + Contador */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <h3 className="font-black text-xs sm:text-sm text-slate-300 uppercase tracking-wider m-0 flex items-center gap-2">
                  <Tag size={16} className="text-emerald-400" />
                  Inventario de Activos ({filteredAssets.length})
                </h3>

                <div className="relative flex-1 max-w-sm">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por activo, código o sector..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Activos */}
              <div className="space-y-3">
                {filteredAssets.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 font-bold text-xs">
                    No se encontraron activos registrados con ese nombre o código.
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-3 bg-slate-800 rounded-2xl shrink-0 shadow-sm border border-slate-700">
                            {getCategoryIcon(asset.category)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-white truncate">{asset.name}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {asset.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-semibold mt-1 m-0 truncate">
                              {asset.category} • {asset.location}
                            </p>
                          </div>
                        </div>

                        {/* Estado Pill + Botón Eliminar con Estilo Aptitudes Médicas */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${
                              asset.status === 'Operativo'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : asset.status === 'Requiere Mantenimiento'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {asset.status}
                          </span>

                          {/* Botón Eliminar Destacado con Color (Rosa / Rojo Auditable) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAsset(asset.id, asset.name);
                            }}
                            className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center"
                            title="Eliminar activo"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 🔲 COLUMNA DERECHA: Previsualización e Impresión Real de Etiqueta QR */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col items-center justify-center text-center shadow-2xl sticky top-28">
                {selectedAsset ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase border border-emerald-500/30">
                      <QrCode size={16} /> Etiqueta QR Oficial de Inspección
                    </div>

                    <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-slate-800 my-2">
                      <QRCodeSVG
                        id="asset-qr-svg"
                        value={`${window.location.origin}/v/guest/asset/${selectedAsset.id}`}
                        size={170}
                        level="H"
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-base text-white m-0">{selectedAsset.name}</h4>
                      <p className="text-xs text-slate-400 font-bold m-0">
                        ID: {selectedAsset.id} • Serie: {selectedAsset.serialNumber}
                      </p>
                      <p className="text-xs text-emerald-400 font-bold m-0 mt-1">
                        📍 {selectedAsset.location}
                      </p>
                    </div>

                    {/* Botones de Acción Funcionales (Imprimir Tag QR & Descargar PNG) */}
                    <div className="w-full pt-3 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={handlePrintQR}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl border-none cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <Printer size={18} /> Imprimir Tag QR
                      </button>

                      <button
                        onClick={handleDownloadQR}
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
                        title="Descargar imagen PNG del QR"
                      >
                        <DownloadSimple size={18} /> PNG
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-slate-400 text-xs font-bold space-y-3">
                    <QrCode size={48} className="mx-auto text-slate-600" />
                    <p className="m-0">Seleccioná un activo de la lista para previsualizar e imprimir su etiqueta QR oficial.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </AnimatedPage>
  );
}
