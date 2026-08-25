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
  Trash
} from '@phosphor-icons/react';
import AnimatedPage from '../components/AnimatedPage';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

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

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
    setIsCreating(false);
    setNewAsset({ category: 'Extintor', status: 'Operativo' });
    toast.success('Activo registrado con código QR generado');
  };

  const handleDeleteAsset = (id: string) => {
    if (window.confirm('¿Desea eliminar este activo del inventario QR?')) {
      setAssets(assets.filter((a) => a.id !== id));
      if (selectedAsset?.id === id) setSelectedAsset(null);
      toast.success('Activo eliminado');
    }
  };

  return (
    <AnimatedPage>
      <div className="max-w-6xl mx-auto px-4 py-8 text-slate-100 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Scan size={16} /> Asset Identification & QR Management
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Escáner e Inventario QR/NFC de Activos
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Generación de etiquetas QR inteligentes para inspecciones instantáneas en terreno.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={18} /> Registrar Nuevo Activo
          </button>
        </div>

        {/* Modal Crear Activo */}
        {isCreating && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleCreateAsset}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <h3 className="font-bold text-lg text-white">Registrar Activo para Tagging QR</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre o Descripción del Activo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Extintor CO2 5kg - Laboratorio 2"
                    value={newAsset.name || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Extintor">Extintor / Matafuego</option>
                    <option value="Tablero Eléctrico">Tablero Eléctrico</option>
                    <option value="Maquinaria">Maquinaria / Autoelevador</option>
                    <option value="EPP / Arnés">EPP / Arnés de Altura</option>
                    <option value="Vehículo">Vehículo / Flota</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ubicación Física / Sector</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Nave 3 - Columna D4"
                    value={newAsset.location || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Número de Serie / Código Interno</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={newAsset.serialNumber || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Guardar y Generar QR
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Layout Lista + QR Detail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">
              Inventario de Activos con Tagging QR ({assets.length})
            </h3>
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedAsset?.id === asset.id
                    ? 'bg-blue-950/60 border-blue-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl text-blue-400">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{asset.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {asset.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {asset.category} • {asset.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      asset.status === 'Operativo'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {asset.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(asset.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* QR Preview Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col items-center justify-center text-center">
            {selectedAsset ? (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-slate-800">
                  <QRCodeSVG
                    value={`https://higiene-seguridad.app/inspect?asset_id=${selectedAsset.id}`}
                    size={160}
                    level="H"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white">{selectedAsset.name}</h4>
                  <p className="text-xs text-slate-400">{selectedAsset.id} • {selectedAsset.serialNumber}</p>
                </div>
                <div className="w-full pt-2 flex gap-2">
                  <button
                    onClick={() => toast.success('Etiqueta QR lista para impresión')}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Printer size={16} /> Imprimir Tag QR
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-slate-500 text-xs space-y-2">
                <QrCode size={40} className="mx-auto text-slate-600" />
                <p>Seleccione un activo para previsualizar su etiqueta QR oficial de inspección.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
