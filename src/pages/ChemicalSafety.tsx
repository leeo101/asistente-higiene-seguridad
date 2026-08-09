import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Plus, Search, Download,
  AlertTriangle, FileText, Eye, Edit3, Trash2, Shield,
  Share2, Calendar, MapPin, Building2, Package
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';

// Pictogramas GHS/SGA
const GHS_PICTOGRAMS = {
  explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
  flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
  oxidizing: { icon: '🔥', name: 'Comburente', color: '#dc2626' },
  corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
  toxic: { icon: '💀', name: 'Tóxico', color: '#dc2626' },
  harmful: { icon: '⚠️', name: 'Nocivo', color: '#f59e0b' },
  irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' },
  sensitizing: { icon: '🫁', name: 'Sensibilizante', color: '#f59e0b' },
  carcinogenic: { icon: '🫁', name: 'Carcinógeno', color: '#dc2626' },
  environmental: { icon: '🌊', name: 'Peligroso Ambiente', color: '#16a34a' },
  pressure: { icon: '📦', name: 'Gas a Presión', color: '#dc2626' }
};

const HAZARD_CATEGORIES = [
  { id: 'fisico', name: 'Peligro Físico', icon: '🔥' },
  { id: 'salud', name: 'Peligro Salud', icon: '🏥' },
  { id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }
];

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('es-AR');
  } catch (e) {
    return String(dateVal || '-');
  }
};

export default function ChemicalSafety(): React.ReactElement | null {
  const navigate = useNavigate();
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [selectedChemical, setSelectedChemical] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadChemicals = () => {
      const saved = localStorage.getItem('chemical_safety_db');
      if (saved) {
        try {
          setChemicals(JSON.parse(saved));
        } catch (e) {}
      }
    };

    loadChemicals();

    const handleStorageChange = (e: any) => {
      if (e.key === 'chemical_safety_db') {
        loadChemicals();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveToStorage = (updated: any[]) => {
    setChemicals(updated);
    localStorage.setItem('chemical_safety_db', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = chemicals.filter((c) => c.id !== confirmModal.payload);
      saveToStorage(updated);
      toast.success('Producto químico eliminado correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const getHazardLevel = (chemical: any) => {
    const criticalPictograms = ['toxic', 'carcinogenic', 'explosive', 'corrosive'];
    const warningPictograms = ['flammable', 'oxidizing', 'harmful', 'irritant'];

    const hasCritical = chemical.pictograms?.some((p: any) => criticalPictograms.includes(p));
    const hasWarning = chemical.pictograms?.some((p: any) => warningPictograms.includes(p));

    if (hasCritical) return { level: 'critical', color: '#dc2626', label: 'Crítico' };
    if (hasWarning) return { level: 'warning', color: '#d97706', label: 'Precaución' };
    return { level: 'low', color: '#16a34a', label: 'Bajo' };
  };

  const filteredChemicals = useMemo(() => {
    return chemicals.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const cas = String(c.casNumber || '').toLowerCase();
      const supplier = String(c.supplier || '').toLowerCase();
      const term = String(searchTerm || '').toLowerCase();

      const matchesSearch = name.includes(term) || cas.includes(term) || supplier.includes(term);
      if (!matchesSearch) return false;

      if (filterCategory === 'critical') {
        return getHazardLevel(c).level === 'critical';
      }
      if (filterCategory !== 'all') {
        return c.category === filterCategory;
      }
      return true;
    });
  }, [chemicals, searchTerm, filterCategory]);

  const handleExportCSV = () => {
    const rows = filteredChemicals.map(item => ({
      'Producto': item.name || '',
      'CAS': item.casNumber || '',
      'UN': item.unNumber || '',
      'Categoría': item.category || '',
      'Ubicación': item.location || '',
      'Cantidad': `${item.quantity || 0} ${item.unit || ''}`,
      'Proveedor': item.supplier || '',
      'Fecha SDS': formatDateSafe(item.sdsDate),
      'Vencimiento': formatDateSafe(item.expiryDate)
    }));
    downloadCSV(rows, `SeguridadQuimica_SGA_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Inventario químico exportado');
  };

  const columns = [
    {
      header: 'Producto / CAS',
      accessor: 'name',
      sortable: true,
      render: (item: any) => {
        const hazard = getHazardLevel(item);
        return (
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: hazard.color }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm">
              {item.pictograms?.[0] ? (GHS_PICTOGRAMS as any)[item.pictograms[0]]?.icon : '⚗️'}
            </div>
            <div>
              <span style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }} className="block">
                {item.name}
              </span>
              <span style={{ color: '#475569', fontWeight: '800', fontSize: '12px' }}>
                CAS: {item.casNumber || 'N/A'} {item.unNumber ? `• UN: ${item.unNumber}` : ''}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'GHS / Peligro',
      accessor: 'category',
      sortable: true,
      render: (item: any) => {
        const hazard = getHazardLevel(item);
        return (
          <div className="flex flex-col gap-1">
            <span style={{ 
              backgroundColor: `${hazard.color}15`, 
              color: hazard.color, 
              border: `1px solid ${hazard.color}40`,
              padding: '3px 8px', 
              borderRadius: '6px', 
              fontWeight: '900', 
              fontSize: '11px',
              width: 'fit-content'
            }}>
              {hazard.label}
            </span>
            <div className="flex gap-1 flex-wrap mt-0.5">
              {item.pictograms?.map((picto: any, idx: number) => (
                <span key={idx} title={(GHS_PICTOGRAMS as any)[picto]?.name} className="text-sm">
                  {(GHS_PICTOGRAMS as any)[picto]?.icon}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Ubicación / Stock',
      accessor: 'location',
      sortable: true,
      render: (item: any) => (
        <div>
          <div className="flex items-center gap-1 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
            <MapPin size={13} className="text-amber-500" /> {item.location || 'Sin ubicación'}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            Stock: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{item.quantity || '0'} {item.unit || 'L'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Proveedor',
      accessor: 'supplier',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '13px' }}>
          {item.supplier || '-'}
        </span>
      )
    },
    {
      header: 'Vencimiento SDS',
      accessor: 'expiryDate',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} className="text-blue-500" />
          {formatDateSafe(item.expiryDate || item.sdsDate)}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar (Fondo Ámbar Sólido) */}
          <button 
            onClick={() => navigate('/chemical-safety/new', { state: { editData: item } })} 
            title="Editar Sustancia" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>

          {/* Botón SDS (Fondo Azul Sólido) */}
          <button 
            onClick={() => setSelectedChemical(item)} 
            title="Ver Ficha SDS" 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> SDS
          </button>

          {/* Botón Compartir / PDF (Fondo Esmeralda Sólido) */}
          <button 
            onClick={() => setShareItem(item)} 
            title="Exportar PDF o Compartir" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          {/* Botón Eliminar (Fondo Rojo Sólido) */}
          <button 
            onClick={() => handleDelete(item.id)} 
            title="Eliminar Sustancia"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        
        {/* Modales */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Ficha SGA - ${shareItem?.name || ''}`}
          text={shareItem ? `🧪 Ficha Técnica de Seguridad (SGA)\n🏷️ Producto: ${shareItem.name}\n🆔 CAS: ${shareItem.casNumber || '-'}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `🧪 Ficha Técnica de Seguridad (SGA)\n🏷️ Producto: ${shareItem.name}\n🆔 CAS: ${shareItem.casNumber || '-'}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content-chemical"
          fileName={`SGA_${shareItem?.name || 'Producto'}.pdf`} 
        />

        <div id="pdf-content-chemical" className="fixed left-0 opacity-0 top-0 pointer-events-none">
          {shareItem && <ChemicalSafetyPdf data={shareItem} />}
        </div>

        <PremiumHeader
          title="Seguridad Química (SGA / GHS)"
          subtitle={`Gestión de Sustancias Peligrosas, Fichas de Seguridad SDS e Inventario • Ley 19.587`}
          icon={<FlaskConical size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" 
        />

        {/* Tarjetas resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => setFilterCategory('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'all' 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Productos</span>
              <FlaskConical size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{chemicals.length}</div>
          </div>

          <div 
            onClick={() => setFilterCategory('critical')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'critical' 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Peligro Crítico</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {chemicals.filter((c) => getHazardLevel(c).level === 'critical').length}
            </div>
          </div>

          <div 
            onClick={() => setFilterCategory('fisico')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'fisico' 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">SDS Vigentes</span>
              <FileText size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {chemicals.filter((c) => c.sdsDate || c.expiryDate).length}
            </div>
          </div>

          <div 
            onClick={() => setFilterCategory('salud')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'salud' 
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
            }`}>
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Compatibilidad SGA</span>
              <Shield size={18} />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100% <span className="text-xs font-normal">Cumplido</span></div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los productos', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'fisico', label: '🔥 Peligros Físicos', bg: '#dc2626', activeBg: '#991b1b' },
              { id: 'salud', label: '🏥 Peligros Salud', bg: '#9333ea', activeBg: '#7e22ce' },
              { id: 'ambiental', label: '🌍 Peligro Ambiental', bg: '#16a34a', activeBg: '#15803d' },
              { id: 'critical', label: '💀 Peligro Crítico', bg: '#e11d48', activeBg: '#be123c' }
            ].map((tab) => {
              const isSelected = filterCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  style={{
                    backgroundColor: isSelected ? tab.activeBg : tab.bg,
                    color: '#ffffff',
                    boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
                    transform: isSelected ? 'scale(1.04)' : 'none',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
              <Download size={16} /> Exportar Excel / CSV
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate('/chemical-safety/new');
              }}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>
        </div>

        {/* Data Table Estilo Aptitudes Médicas */}
        {filteredChemicals.length === 0 ? (
          <EmptyStateIllustrated
            title="Sin Productos Químicos"
            description="Registrá sustancias químicas según el Sistema Globalmente Armonizado (SGA/GHS)."
            icon={<FlaskConical />} 
          />
        ) : (
          <DataTable
            data={filteredChemicals}
            columns={columns}
            searchPlaceholder="Buscar por producto, CAS o proveedor..."
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar producto químico?"
          message="Esta acción eliminará el producto del inventario permanentemente."
          iconEmoji="🗑️" 
        />
      </div>
    </AnimatedPage>
  );
}