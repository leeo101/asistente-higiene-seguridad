import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Plus, Search, Download,
  AlertTriangle, FileText, Eye, Edit3, Trash2, Shield,
  Share2, Calendar, MapPin, Building2, Package, Activity, CheckCircle2, ShieldAlert
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
import { evaluateChemicalAgentExposure } from '../utils/srtProtocols';

// Pictogramas GHS/SGA
const GHS_CONFIG: Record<string, { icon: string; name: string; color: string }> = {
  explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
  flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
  oxidizing: { icon: '⭕', name: 'Comburente', color: '#dc2626' },
  pressure: { icon: '🍾', name: 'Gas a Presión', color: '#dc2626' },
  corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
  toxic: { icon: '☠️', name: 'Toxicidad Aguda', color: '#dc2626' },
  harmful: { icon: '⚠️', name: 'Nocivo / Irritante', color: '#f59e0b' },
  irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' },
  sensitizing: { icon: '🗣️', name: 'Sensibilizante', color: '#f59e0b' },
  carcinogenic: { icon: '🗣️', name: 'Carcinógeno / Peligro Salud', color: '#dc2626' },
  environmental: { icon: '🐟', name: 'Peligro Ambiente', color: '#16a34a' }
};

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
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [selectedChemical, setSelectedChemical] = useState<any>(null);

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
      toast.success('Sustancia química eliminada correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const getHazardLevel = (chemical: any) => {
    const criticalPictograms = ['toxic', 'carcinogenic', 'explosive', 'corrosive'];
    const warningPictograms = ['flammable', 'oxidizing', 'harmful', 'irritant'];

    const hasCritical = chemical.pictograms?.some((p: any) => criticalPictograms.includes(p));
    const hasWarning = chemical.pictograms?.some((p: any) => warningPictograms.includes(p));

    if (hasCritical || (chemical.signalWord || '').toUpperCase() === 'PELIGRO') {
      return { level: 'critical', color: '#dc2626', label: 'Crítico / Peligro' };
    }
    if (hasWarning || (chemical.signalWord || '').toUpperCase() === 'ATENCIÓN') {
      return { level: 'warning', color: '#d97706', label: 'Atención' };
    }
    return { level: 'low', color: '#16a34a', label: 'Bajo' };
  };

  const filteredChemicals = useMemo(() => {
    return chemicals.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const cas = String(c.casNumber || '').toLowerCase();
      const supplier = String(c.supplier || '').toLowerCase();
      const empresa = String(c.empresa || '').toLowerCase();
      const cuit = String(c.cuit || '').toLowerCase();
      const puesto = String(c.puesto || '').toLowerCase();
      const sector = String(c.sector || '').toLowerCase();
      const term = String(searchTerm || '').toLowerCase();

      const matchesSearch =
        name.includes(term) ||
        cas.includes(term) ||
        supplier.includes(term) ||
        empresa.includes(term) ||
        cuit.includes(term) ||
        puesto.includes(term) ||
        sector.includes(term);

      if (!matchesSearch) return false;

      if (filterCategory === 'critical') {
        return getHazardLevel(c).level === 'critical';
      }
      if (filterCategory === 'salud') {
        return c.pictograms?.includes('carcinogenic') || c.pictograms?.includes('toxic') || c.viaDermica;
      }
      if (filterCategory === 'fisico') {
        return c.pictograms?.includes('flammable') || c.pictograms?.includes('explosive') || c.pictograms?.includes('oxidizing');
      }
      if (filterCategory === 'ambiental') {
        return c.pictograms?.includes('environmental');
      }
      return true;
    });
  }, [chemicals, searchTerm, filterCategory]);

  const handleExportCSV = () => {
    if (filteredChemicals.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const rows = filteredChemicals.map(item => {
      const exp = evaluateChemicalAgentExposure({
        cmp: Number(item.cmp || 0),
        concentracionMedida: Number(item.concentracionMedida || 0),
        unidadMedicion: item.unidadMedicion,
        viaDermica: item.viaDermica,
        carcinogenicidad: item.carcinogenicidad
      });

      return {
        'Sustancia': item.name || '',
        'CAS': item.casNumber || '',
        'UN': item.unNumber || '',
        'Empresa': item.empresa || '',
        'CUIT': item.cuit || '',
        'Sector': item.sector || item.location || '',
        'Puesto': item.puesto || '',
        'Unidad': item.unidadMedicion || 'ppm',
        'CMP (8 hs)': item.cmp || '',
        'Concentración Medida': item.concentracionMedida || '',
        'Índice Exposición (IE)': exp.indiceExposicion,
        'Dictamen Higiénico': exp.dictamenExposicion,
        'Vía Dérmica': item.viaDermica ? 'SÍ' : 'NO',
        'Carcinogenicidad': item.carcinogenicidad || 'No clasificado',
        'Palabra Advertencia SGA': item.signalWord || '',
        'Fecha Muestreo': formatDateSafe(item.fechaMuestreo || item.sdsDate)
      };
    });

    downloadCSV(rows, `Contaminantes_Quimicos_Res_295_03_SGA_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Inventario y protocolo químico exportado');
  };

  const columns = [
    {
      header: 'Sustancia / CAS / Empresa',
      accessor: 'name',
      sortable: true,
      render: (item: any) => {
        const hazard = getHazardLevel(item);
        return (
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: hazard.color }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm"
            >
              {item.pictograms?.[0] ? (GHS_CONFIG as any)[item.pictograms[0]]?.icon : '⚗️'}
            </div>
            <div>
              <span className="block font-black text-sm text-slate-900 dark:text-white leading-tight">
                {item.name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                CAS: {item.casNumber || 'N/A'} {item.unNumber ? `• UN: ${item.unNumber}` : ''}
              </span>
              {item.empresa && (
                <span className="block text-[11px] text-slate-500 font-semibold mt-0.5">
                  {item.empresa} {item.cuit ? `(CUIT: ${item.cuit})` : ''}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'SGA / GHS',
      accessor: 'signalWord',
      sortable: true,
      render: (item: any) => {
        const word = (item.signalWord || 'ATENCIÓN').toUpperCase();
        const isDanger = word === 'PELIGRO';
        return (
          <div className="flex flex-col gap-1">
            <span
              style={{
                backgroundColor: isDanger ? '#fee2e2' : '#fef3c7',
                color: isDanger ? '#dc2626' : '#d97706',
                border: `1px solid ${isDanger ? '#fca5a5' : '#fde68a'}`
              }}
              className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit"
            >
              {word}
            </span>
            <div className="flex gap-1 flex-wrap mt-0.5">
              {item.pictograms?.map((picto: any, idx: number) => (
                <span key={idx} title={(GHS_CONFIG as any)[picto]?.name} className="text-sm">
                  {(GHS_CONFIG as any)[picto]?.icon}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Monitoreo Res. 295/03',
      accessor: 'concentracionMedida',
      sortable: true,
      render: (item: any) => {
        const exp = evaluateChemicalAgentExposure({
          cmp: Number(item.cmp || 0),
          concentracionMedida: Number(item.concentracionMedida || 0),
          unidadMedicion: item.unidadMedicion,
          viaDermica: item.viaDermica
        });

        const bg = exp.superaCMP ? '#fee2e2' : exp.alcanzaNivelAccion ? '#fef3c7' : '#dcfce7';
        const color = exp.superaCMP ? '#dc2626' : exp.alcanzaNivelAccion ? '#d97706' : '#15803d';

        return (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span>{item.concentracionMedida ?? '-'} / CMP {item.cmp ?? '-'} {item.unidadMedicion || 'ppm'}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              <span
                style={{ background: bg, color }}
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
              >
                IE {exp.indiceExposicion} ({exp.dictamenExposicion.split(' ')[0]})
              </span>
              {item.viaDermica && (
                <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                  Skin
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Puesto / Sector',
      accessor: 'puesto',
      sortable: true,
      render: (item: any) => (
        <div>
          <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 text-xs">
            <MapPin size={13} className="text-amber-500" /> {item.puesto || item.location || 'Sin puesto'}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {item.sector || 'Sector general'}
          </div>
        </div>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/chemical-safety/new', { state: { editData: item } })}
            title="Editar Sustancia"
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none' }}
            className="p-1.5 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Edit3 size={13} /> Editar
          </button>

          <button
            onClick={() => setSelectedChemical(item)}
            title="Ver / Imprimir PDF Oficial"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }}
            className="p-1.5 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Eye size={13} /> PDF
          </button>

          <button
            onClick={() => handleDelete(item.id)}
            title="Eliminar Sustancia"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'none' }}
            className="p-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex items-center"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container pb-32 min-h-screen flex flex-col pt-4 max-w-[1200px] mx-auto">
        {/* Modal de visualización rápida PDF */}
        {selectedChemical && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 no-print">
                <h3 className="text-base font-black text-slate-800 m-0">
                  Protocolo Oficial — {selectedChemical.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const element = document.getElementById('pdf-modal-content');
                      if (element) {
                        window.print();
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <FileText size={14} /> Imprimir / Guardar PDF
                  </button>
                  <button
                    onClick={() => setSelectedChemical(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              <div id="pdf-modal-content">
                <ChemicalSafetyPdf data={selectedChemical} />
              </div>
            </div>
          </div>
        )}

        <PremiumHeader
          title="Seguridad Química & Contaminantes"
          subtitle="Res. MTEySS N° 295/03 Anexo IV (CMP, CMP-CPT, Vía Dérmica) & Res. SRT N° 801/15 (SGA / GHS)"
          icon={<FlaskConical size={36} color="#ffffff" />}
        />

        {/* Tarjetas Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterCategory('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sustancias</span>
              <FlaskConical size={18} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{chemicals.length}</div>
          </div>

          <div
            onClick={() => setFilterCategory('critical')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Peligro Crítico</span>
              <ShieldAlert size={18} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {chemicals.filter((c) => getHazardLevel(c).level === 'critical').length}
            </div>
          </div>

          <div
            onClick={() => setFilterCategory('salud')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'salud'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Riesgo Salud / Skin</span>
              <Activity size={18} />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {chemicals.filter((c) => c.viaDermica || c.pictograms?.includes('carcinogenic') || c.pictograms?.includes('toxic')).length}
            </div>
          </div>

          <div
            onClick={() => setFilterCategory('fisico')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'fisico'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Inflamables / Físico</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {chemicals.filter((c) => c.pictograms?.includes('flammable') || c.pictograms?.includes('explosive')).length}
            </div>
          </div>
        </div>

        {/* Toolbar de Filtros y Botones */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los productos', bg: '#2563eb' },
              { id: 'fisico', label: '🔥 Inflamables', bg: '#dc2626' },
              { id: 'salud', label: '🏥 Salud / Skin', bg: '#9333ea' },
              { id: 'ambiental', label: '🐟 Ambiental', bg: '#16a34a' },
              { id: 'critical', label: '☠️ Crítico SGA', bg: '#e11d48' }
            ].map((tab) => {
              const isSelected = filterCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  style={{
                    backgroundColor: isSelected ? tab.bg : 'var(--color-surface)',
                    color: isSelected ? '#ffffff' : 'var(--color-text)',
                    borderColor: isSelected ? tab.bg : 'var(--color-border)'
                  }}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer whitespace-nowrap shadow-xs"
                >
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
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Download size={16} /> Exportar CSV Oficial
            </button>

            <button
              type="button"
              onClick={() => navigate('/chemical-safety/new')}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus size={16} /> Nueva Sustancia
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-6 h-[50px]">
          <Search
            size={18}
            className="text-slate-400 pointer-events-none z-10 absolute left-4 top-0 bottom-0 my-auto"
          />
          <input
            type="text"
            placeholder="Buscar por producto, CAS, CUIT, empresa, puesto o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '50px',
              paddingLeft: '3.2rem',
              paddingRight: '1rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            className="rounded-2xl border-2 text-sm shadow-sm focus:border-emerald-500 transition-colors font-medium"
          />
        </div>

        {/* Tabla de Sustancias */}
        {filteredChemicals.length === 0 ? (
          <EmptyStateIllustrated
            title="Sin Productos Químicos"
            description="Registrá sustancias químicas según el SGA (Res. SRT 801/15) y evaluá contaminantes en aire (Res. MTEySS 295/03)."
            icon={<FlaskConical />}
          />
        ) : (
          <DataTable
            data={filteredChemicals}
            columns={columns}
            searchPlaceholder="Filtrar tabla..."
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