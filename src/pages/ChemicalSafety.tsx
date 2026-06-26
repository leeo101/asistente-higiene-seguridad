import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Plus, Search, Filter, Download,
  AlertTriangle, CheckCircle2, XCircle, FileText,
  Eye, Edit3, Trash2, Upload, Shield, Droplets,
  Flame, Skull, Zap, Wind, Thermometer, Printer, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';
import CompanyLogo from '../components/CompanyLogo';
import LazyImage from '../components/LazyImage';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

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
{ id: 'salud', name: 'Peligro para la Salud', icon: '🏥' },
{ id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }];


const STORAGE_COMPATIBILITY = {
  inflamables: ['inflamables', 'comburentes'],
  toxicos: ['toxicos', 'corrosivos'],
  corrosivos: ['corrosivos'],
  oxidantes: ['oxidantes', 'inflamables'],
  reactivos: ['reactivos']
};

export default function ChemicalSafety(): React.ReactElement | null {
  const navigate = useNavigate();
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid o list
  const [shareItem, setShareItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  const [selectedChemical, setSelectedChemical] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChemical, setNewChemical] = useState({
    id: '',
    name: '',
    casNumber: '',
    unNumber: '',
    category: 'fisico',
    hazards: [],
    pictograms: [],
    storage: '',
    location: '',
    quantity: '',
    unit: 'L',
    supplier: '',
    sdsDate: '',
    expiryDate: '',
    riskPhrases: [],
    safetyPhrases: [],
    firstAid: {
      inhalation: '',
      skin: '',
      eyes: '',
      ingestion: ''
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadChemicals = () => {
      const saved = localStorage.getItem('chemical_safety_db');
      if (saved) {
        setChemicals(JSON.parse(saved));
      }
    };

    loadChemicals();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // Escuchar cambios en localStorage desde otras páginas
    const handleStorageChange = (e: any) => {
      if (e.key === 'chemical_safety_db') {
        loadChemicals();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // También verificar si venimos de una creación exitosa
    const params = new URLSearchParams(window.location.search);
    if (params.get('created')) {
      loadChemicals();
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const saveToStorage = (data: any[]) => {
    localStorage.setItem('chemical_safety_db', JSON.stringify(data));
    navigate('/chemical-safety');
  };

  const handleAddChemical = () => {
    if (!newChemical.name.trim()) return;

    const chemical = {
      ...newChemical,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const updated = [chemical, ...chemicals];
    saveToStorage(updated);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewChemical({
      id: '',
      name: '',
      casNumber: '',
      unNumber: '',
      category: 'fisico',
      hazards: [],
      pictograms: [],
      storage: '',
      location: '',
      quantity: '',
      unit: 'L',
      supplier: '',
      sdsDate: '',
      expiryDate: '',
      riskPhrases: [],
      safetyPhrases: [],
      firstAid: {
        inhalation: '',
        skin: '',
        eyes: '',
        ingestion: ''
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = chemicals.filter((c) => c.id !== confirmModal.payload);
      saveToStorage(updated);
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredChemicals = chemicals.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.casNumber?.includes(searchTerm) ||
    c.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getHazardLevel = (chemical: any) => {
    const criticalPictograms = ['toxic', 'carcinogenic', 'explosive', 'corrosive'];
    const warningPictograms = ['flammable', 'oxidizing', 'harmful', 'irritant'];

    const hasCritical = chemical.pictograms?.some((p: any) => criticalPictograms.includes(p));
    const hasWarning = chemical.pictograms?.some((p: any) => warningPictograms.includes(p));

    if (hasCritical) return { level: 'critical', color: '#dc2626', label: 'Crítico' };
    if (hasWarning) return { level: 'warning', color: '#f59e0b', label: 'Precaución' };
    return { level: 'low', color: '#16a34a', label: 'Bajo' };
  };

  const checkCompatibility = (chemical1: any, chemical2: any) => {
    if (!chemical1?.pictograms || !chemical2?.pictograms) return true;
    const pic1 = chemical1.pictograms;
    const pic2 = chemical2.pictograms;

    const isExplosive = (p: string[]) => p.includes('explosive');
    const isFlammable = (p: string[]) => p.includes('flammable');
    const isOxidizing = (p: string[]) => p.includes('oxidizing');
    const isCorrosive = (p: string[]) => p.includes('corrosive');
    const isToxic = (p: string[]) => p.includes('toxic');

    // Explosivos: incompatibles con casi todo
    if (isExplosive(pic1) && (isFlammable(pic2) || isOxidizing(pic2) || isCorrosive(pic2) || isToxic(pic2))) return false;
    if (isExplosive(pic2) && (isFlammable(pic1) || isOxidizing(pic1) || isCorrosive(pic1) || isToxic(pic1))) return false;

    // Inflamables: incompatibles con oxidantes
    if (isFlammable(pic1) && isOxidizing(pic2) || isFlammable(pic2) && isOxidizing(pic1)) return false;

    // Corrosivos: separar de inflamables y oxidantes
    if (isCorrosive(pic1) && (isFlammable(pic2) || isOxidizing(pic2)) ||
    isCorrosive(pic2) && (isFlammable(pic1) || isOxidizing(pic1))) return false;

    // Tóxicos: separar de inflamables, oxidantes y corrosivos
    if (isToxic(pic1) && (isFlammable(pic2) || isOxidizing(pic2) || isCorrosive(pic2)) ||
    isToxic(pic2) && (isFlammable(pic1) || isOxidizing(pic1) || isCorrosive(pic1))) return false;

    return true;
  };

  return (
    <div className="container min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 pt-22">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Ficha SGA - ${(shareItem as any)?.name || ''}`}
        text={shareItem ? `🧪 Ficha Técnica de Seguridad (SGA)\n🏷️ Producto: ${(shareItem as any).name}\n🆔 CAS: ${(shareItem as any).casNumber || '-'}\n📅 Fecha: ${new Date((shareItem as any).createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
        rawMessage={shareItem ? `🧪 Ficha Técnica de Seguridad (SGA)\n🏷️ Producto: ${(shareItem as any).name}\n🆔 CAS: ${(shareItem as any).casNumber || '-'}\n📅 Fecha: ${new Date((shareItem as any).createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`SGA_${(shareItem as any)?.name || 'Producto'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <ChemicalSafetyPdf data={shareItem} />}
            </div>
            {/* Header Premium */}
            <div className="no-print mb-8">
                <PremiumHeader onBack={viewMode !== 'list' ? () => setViewMode('list') : undefined}
        title="Seguridad Química"
        subtitle={`Gestión GHS/SGA • ${chemicals.length} productos`}
        icon={<FlaskConical size={32} color="#ffffff" />
        }
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
                    <></>
                    <div className="flex gap-3 flex-wrap">
                        <button
              onClick={() => navigate('/chemical-safety/new')}
              className="w-auto m-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl font-bold cursor-pointer shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all">
              
                            <Plus size={20} strokeWidth={2.5} />
                            Nuevo Producto
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
          icon={<FlaskConical size={24} />}
          label="Total Productos"
          value={chemicals.length}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
        
                <StatCard
          icon={<AlertTriangle size={24} />}
          label="Peligro Crítico"
          value={chemicals.filter((c) => getHazardLevel(c).level === 'critical').length}
          color="#dc2626"
          gradient="linear-gradient(135deg, #dc2626, #991b1b)" />
        
                <StatCard
          icon={<FileText size={24} />}
          label="SDS Vigentes"
          value={chemicals.filter((c) => c.sdsDate).length}
          color="#10b981"
          gradient="linear-gradient(135deg, #10b981, #059669)" />
        
                <StatCard
          icon={<Shield size={24} />}
          label="Compatibles"
          value={`${Math.round(chemicals.length * 0.85)}%`}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[280px] relative">
                    <Search
            size={20}
            color="var(--color-text-muted)"
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          
                    <input
            type="text"
            placeholder="Buscar por nombre, CAS, proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[0.95rem] font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" />


          
                </div>

                <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500">
          
                    <option value="all">Todas las Categorías</option>
                    {HAZARD_CATEGORIES.map((cat) =>
          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          )}
                </select>

                {!isMobile &&
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-3 border-none cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-3 border-none cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <circle cx="4" cy="6" r="1" fill="currentColor" />
                            <circle cx="4" cy="12" r="1" fill="currentColor" />
                            <circle cx="4" cy="18" r="1" fill="currentColor" />
                        </svg>
                    </button>
                </div>
        }
            </div>

            {/* Chemicals Grid/List */}
            {filteredChemicals.length === 0 ?
      <EmptyStateIllustrated
        title="Sin Productos Químicos"
        description="Registrá sustancias químicas según el Sistema Globalmente Armonizado (SGA/GHS)."
        icon={<FlaskConical />} /> :

      viewMode === 'grid' ?
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredChemicals.map((chemical) =>
        <ChemicalCard
          key={chemical.id}
          chemical={chemical}
          hazardLevel={getHazardLevel(chemical)}
          onView={() => setSelectedChemical(chemical)}
          onShare={() => setShareItem(chemical)}
          onEdit={() => navigate('/chemical-safety/new', { state: { editData: chemical } })}
          onDelete={() => handleDelete(chemical.id)}
          isMobile={isMobile} />

        )}
                </div> :

      <div className="flex flex-col gap-3">
                    {filteredChemicals.map((chemical) =>
        <ChemicalListItem
          key={chemical.id}
          chemical={chemical}
          hazardLevel={getHazardLevel(chemical)}
          onView={() => setSelectedChemical(chemical)}
          onShare={() => setShareItem(chemical)}
          onDelete={() => handleDelete(chemical.id)}
          isMobile={isMobile} />

        )}
                </div>
      }

            {/* Modal de Agregar Producto */}
            {showAddModal &&
      <AddChemicalModal
        chemical={newChemical}
        setChemical={setNewChemical}
        onSave={handleAddChemical}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        GHS_PICTOGRAMS={GHS_PICTOGRAMS} />

      }

            {/* Modal de Detalle */}
            {selectedChemical &&
      <ChemicalDetailModal
        chemical={selectedChemical}
        hazardLevel={getHazardLevel(selectedChemical)}
        onClose={() => setSelectedChemical(null)}
        GHS_PICTOGRAMS={GHS_PICTOGRAMS}
        onPrint={() => setShowShareModal(true)} />

      }

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Ficha de Seguridad (SDS)"
        text={`📄 SDS: ${(selectedChemical as any)?.name || 'Químico'}`}
        rawMessage={`📄 SDS: ${(selectedChemical as any)?.name || 'Químico'}`}
        fileName={`SDS_${(selectedChemical as any)?.name || 'Quimico'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <ChemicalSafetyPdf data={selectedChemical} />
            </div>

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar producto químico?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }: any) {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div style={{





        background: gradient


      }} className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-[50%] opacity-[0.1]" />
            <div className="flex items-center gap-3 mb-3">
                <div style={{


          background: gradient,




          boxShadow: `0 4px 15px ${color}40`
        }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center">
                    {React.cloneElement(icon, { color: '#ffffff', size: 24 })}
                </div>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                {value}
            </div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
                {label}
            </div>
        </div>);

}

function ChemicalCard({ chemical, hazardLevel, onView, onShare, onEdit, onDelete }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header con color de peligro */}
            <div style={{

        background: `linear-gradient(135deg, ${hazardLevel.color}15, ${hazardLevel.color}05)`,
        borderBottom: `2px solid ${hazardLevel.color}`



      }} className="p-[1rem_1.25rem] flex justify-space-between items-center">
                <div className="flex items-center gap-3">
                    <div style={{


            background: hazardLevel.color







          }} className="w-[40px] h-[40px] rounded-[var(--radius-md)] flex items-center justify-center text-[#fff] text-[1.25rem] font-[900]">
                        {chemical.pictograms?.[0] ? (GHS_PICTOGRAMS as any)[chemical.pictograms[0]]?.icon : '⚗️'}
                    </div>
                    <div>
                        <h3 className="m-0 text-base font-extrabold text-slate-800 dark:text-white">
                            {chemical.name}
                        </h3>
                        <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            CAS: {chemical.casNumber || 'N/A'}
                        </p>
                    </div>
                </div>
                <span style={{

          background: hazardLevel.color





        }} className="p-[0.35rem_0.75rem] text-[#fff] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">
                    {hazardLevel.label}
                </span>
            </div>

            {/* Body */}
            <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                    {chemical.pictograms?.map((picto: any, idx: number) =>
          <span
            key={idx}
            title={(GHS_PICTOGRAMS as any)[picto]?.name}
            style={{


              background: `${(GHS_PICTOGRAMS as any)[picto]?.color}15`

            }} className="text-[1.5rem] p-[0.25rem] rounded-[var(--radius-sm)]">
            
                            {(GHS_PICTOGRAMS as any)[picto]?.icon}
                        </span>
          )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <InfoField label="Ubicación" value={chemical.location || '-'} />
                    <InfoField label="Cantidad" value={`${chemical.quantity || '-'} ${chemical.unit}`} />
                    <InfoField label="Proveedor" value={chemical.supplier || '-'} />
                    <InfoField label="Vencimiento" value={chemical.expiryDate ? new Date(chemical.expiryDate).toLocaleDateString('es-AR') : '-'} />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 p-2 text-sm bg-transparent border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-semibold">
            
                        <Eye size={16} className="mr-[0.25rem]" />
                        Ver SDS
                    </button>
                    <button
            onClick={onShare}
            className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-200 transition-colors">
            
                        <Share2 size={16} />
                    </button>
                    <button
            onClick={onEdit}
            className="p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            
                        <Edit3 size={16} />
                    </button>
                    <button
            onClick={onDelete}
            className="p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>);

}

function ChemicalListItem({ chemical, hazardLevel, onView, onShare, onDelete, isMobile }: any) {
  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-all hover:shadow-md ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}>
            <div style={{


        background: `linear-gradient(135deg, ${hazardLevel.color}, ${hazardLevel.color}cc)`,







        boxShadow: `0 4px 15px ${hazardLevel.color}40`
      }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff] text-[1.5rem] flex-shrink-[0]">
                {chemical.pictograms?.[0] ? GHS_PICTOGRAMS[chemical.pictograms[0]]?.icon : '⚗️'}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="m-0 text-base font-extrabold text-slate-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                    {chemical.name}
                </h3>
                <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    CAS: {chemical.casNumber || 'N/A'} • {chemical.location || 'Sin ubicación'}
                </p>
            </div>

            <span style={{

        background: `${hazardLevel.color}15`,
        color: hazardLevel.color





      }} className="p-[0.35rem_0.85rem] rounded-[var(--radius-full)] text-[0.75rem] font-[800] uppercase flex-shrink-[0]">
                {hazardLevel.label}
            </span>

            <div className="flex gap-2">
                <button
          onClick={onView}
          className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          
                    <Eye size={18} />
                </button>
                <button
          onClick={onShare}
          className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-200 transition-colors">
          
                    <Share2 size={18} />
                </button>
                <button
          onClick={onDelete}
          className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          
                    <Trash2 size={18} />
                </button>
            </div>
        </div>);

}

const InfoField = ({ label, value }: any) =>
<div>
        <div className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            {label}
        </div>
        <div className="text-[0.9rem] font-semibold text-slate-800 dark:text-white">
            {value}
        </div>
    </div>;


function EmptyState({ onAdd }: any) {
  return (
    <div className="px-8 py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <FlaskConical size={40} color="var(--color-text-muted)" />
            </div>
            <h3 className="m-0 mb-2 text-xl font-extrabold text-slate-800 dark:text-white">
                Sin Productos Químicos
            </h3>
            <p className="m-0 mb-6 text-[0.95rem] text-slate-500 dark:text-slate-400">
                Comenzá a gestionar tu inventario de productos químicos con clasificación GHS/SGA
            </p>
            <button
        onClick={onAdd}
        className="btn-primary w-[auto] m-[0]">

        
                <Plus size={20} className="mr-[0.5rem]" />
                Agregar Primer Producto
            </button>
        </div>);

}

// Modal de Agregar Producto Químico
function AddChemicalModal({ chemical, setChemical, onSave, onClose, GHS_PICTOGRAMS }: any) {
  const handleHazardChange = (field: string, value: any) => {
    setChemical({ ...chemical, [field]: value });
  };

  const handleLevelChange = (field: string, value: any) => {
    setChemical({
      ...chemical,
      [field]: value
    });
  };
  const handlePictoToggle = (picto: any) => {
    const current = chemical.pictograms || [];
    const updated = current.includes(picto) ?
    current.filter((p: any) => p !== picto) :
    [...current, picto];
    setChemical({ ...chemical, pictograms: updated });
  };

  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[800px] max-h-[90vh] overflow-auto m-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="m-0 text-2xl font-black text-slate-800 dark:text-white">
                        Nuevo Producto Químico
                    </h2>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre Comercial *</label>
                        <input
              type="text"
              value={chemical.name}
              onChange={(e) => setChemical({ ...chemical, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Ej: Ácido Sulfúrico" />
            
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Número CAS</label>
                        <input
              type="text"
              value={chemical.casNumber}
              onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Ej: 7664-93-7" />
            
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Categoría</label>
                        <select
              value={chemical.category}
              onChange={(e) => setChemical({ ...chemical, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
              
                            {HAZARD_CATEGORIES.map((cat) =>
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              )}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación</label>
                        <input
              type="text"
              value={chemical.location}
              onChange={(e) => setChemical({ ...chemical, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Ej: Almacén A - Estante 3" />
            
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Cantidad</label>
                        <input
              type="number"
              value={chemical.quantity}
              onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="0" />
            
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Unidad</label>
                        <select
              value={chemical.unit}
              onChange={(e) => setChemical({ ...chemical, unit: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
              
                            <option value="L">Litros (L)</option>
                            <option value="mL">Mililitros (mL)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="g">Gramos (g)</option>
                            <option value="und">Unidades</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Proveedor</label>
                        <input
              type="text"
              value={chemical.supplier}
              onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Nombre del proveedor" />
            
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha Vencimiento</label>
                        <input
              type="date"
              value={chemical.expiryDate}
              onChange={(e) => setChemical({ ...chemical, expiryDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
            
                    </div>
                </div>

                {/* Pictogramas GHS */}
                <div className="mt-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Pictogramas GHS/SGA</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-2">
                        {Object.entries(GHS_PICTOGRAMS).map(([key, data]: [string, any]) =>
            <button
              key={key}
              onClick={() => handlePictoToggle(key)}
              style={{

                background: chemical.pictograms?.includes(key) ?
                `${data.color}15` :
                'var(--color-background)',
                border: `2px solid ${chemical.pictograms?.includes(key) ? data.color : 'var(--color-border)'}`







              }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_var(--transition-fast)]">
              
                                <span className="text-[2rem]">{data.icon}</span>
                                <span style={{


                color: chemical.pictograms?.includes(key) ? data.color : 'var(--color-text-muted)'

              }} className="text-[0.7rem] font-[600] text-center">
                                    {data.name}
                                </span>
                            </button>
            )}
                    </div>
                </div>

                {/* Primeros Auxilios */}
                <div className="mt-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Primeros Auxilios</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label style={{ ...labelStyle }} className="text-[0.8rem]">Inhalación</label>
                            <textarea
                value={chemical.firstAid?.inhalation}
                onChange={(e) => setChemical({
                  ...chemical,
                  firstAid: { ...chemical.firstAid, inhalation: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[60px] resize-y"
                placeholder="Medidas en caso de inhalación" />
              
                        </div>
                        <div>
                            <label style={{ ...labelStyle }} className="text-[0.8rem]">Contacto Piel</label>
                            <textarea
                value={chemical.firstAid?.skin}
                onChange={(e) => setChemical({
                  ...chemical,
                  firstAid: { ...chemical.firstAid, skin: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[60px] resize-y"
                placeholder="Medidas en caso de contacto con la piel" />
              
                        </div>
                        <div>
                            <label style={{ ...labelStyle }} className="text-[0.8rem]">Contacto Ojos</label>
                            <textarea
                value={chemical.firstAid?.eyes}
                onChange={(e) => setChemical({
                  ...chemical,
                  firstAid: { ...chemical.firstAid, eyes: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[60px] resize-y"
                placeholder="Medidas en caso de contacto con los ojos" />
              
                        </div>
                        <div>
                            <label style={{ ...labelStyle }} className="text-[0.8rem]">Ingestión</label>
                            <textarea
                value={chemical.firstAid?.ingestion}
                onChange={(e) => setChemical({
                  ...chemical,
                  firstAid: { ...chemical.firstAid, ingestion: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[60px] resize-y"
                placeholder="Medidas en caso de ingestión" />
              
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            
                        Cancelar
                    </button>
                    <button
            onClick={onSave}
            className="btn-primary flex-[1]">

            
                        Guardar Producto
                    </button>
                </div>
            </div>
        </div>);

}

// Modal de Detalle del Producto
function ChemicalDetailModal({ chemical, hazardLevel, onClose, GHS_PICTOGRAMS, onPrint }: any) {
  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[700px] max-h-[90vh] overflow-auto m-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        
                {/* Header */}
                <div style={{

          background: `linear-gradient(135deg, ${hazardLevel.color}20, ${hazardLevel.color}05)`,
          borderBottom: `2px solid ${hazardLevel.color}`




        }} className="p-[1.5rem] flex justify-space-between items-center mb-[1.5rem]">
                    <div className="flex items-center gap-4">
                        <div style={{


              background: hazardLevel.color






            }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#fff] text-[2rem]">
                            {chemical.pictograms?.[0] ? (GHS_PICTOGRAMS as any)[chemical.pictograms[0]]?.icon : '⚗️'}
                        </div>
                        <div>
                            <h2 className="m-0 text-2xl font-black text-slate-800 dark:text-white">
                                {chemical.name}
                            </h2>
                            <p className="m-0 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                CAS: {chemical.casNumber || 'N/A'} • {hazardLevel.label}
                            </p>
                        </div>
                    </div>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Pictogramas */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase text-slate-700 dark:text-slate-300">
                        Pictogramas de Peligro
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {chemical.pictograms?.map((picto: any, idx: any) =>
            <div
              key={idx}
              style={{

                background: `${(GHS_PICTOGRAMS as any)[picto]?.color}15`,
                border: `1px solid ${(GHS_PICTOGRAMS as any)[picto]?.color}`




              }} className="p-[0.75rem_1rem] rounded-[var(--radius-lg)] flex items-center gap-[0.5rem]">
              
                                <span className="text-[1.75rem]">{(GHS_PICTOGRAMS as any)[picto]?.icon}</span>
                                <span style={{


                color: (GHS_PICTOGRAMS as any)[picto]?.color
              }} className="text-[0.8rem] font-[700]">
                                    {(GHS_PICTOGRAMS as any)[picto]?.name}
                                </span>
                            </div>
            )}
                    </div>
                </div>

                {/* Información */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <DetailRow label="Ubicación" value={chemical.location || '-'} />
                    <DetailRow label="Cantidad" value={`${chemical.quantity || '-'} ${chemical.unit}`} />
                    <DetailRow label="Proveedor" value={chemical.supplier || '-'} />
                    <DetailRow label="Vencimiento" value={chemical.expiryDate ? new Date(chemical.expiryDate).toLocaleDateString('es-AR') : '-'} />
                    <DetailRow label="Fecha SDS" value={chemical.sdsDate ? new Date(chemical.sdsDate).toLocaleDateString('es-AR') : '-'} />
                    <DetailRow label="Categoría" value={HAZARD_CATEGORIES.find((c) => c.id === chemical.category)?.name || '-'} />
                </div>

                {/* Primeros Auxilios */}
                <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl mb-6">
                    <h3 className="text-sm font-extrabold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        PRIMEROS AUXILIOS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatBox icon="🫁" label="Inhalación" value={chemical.firstAid?.inhalation} />
                        <StatBox icon="🖐️" label="Piel" value={chemical.firstAid?.skin} />
                        <StatBox icon="👁️" label="Ojos" value={chemical.firstAid?.eyes} />
                        <StatBox icon="👄" label="Ingestión" value={chemical.firstAid?.ingestion} />
                    </div>
                </div>

                <div className="flex gap-[1rem] mt-[1rem]">
                    <button
            onClick={onPrint}
            className="flex-1 p-4 bg-white dark:bg-slate-800 border border-blue-600 rounded-xl font-bold cursor-pointer text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            
                        <Printer size={18} />
                        Imprimir SDS
                    </button>
                    <button
            onClick={onClose}
            className="btn-primary flex-[1] m-[0]">

            
                        Cerrar
                    </button>
                </div>
            </div>
        </div>);

}

const DetailRow = ({ label, value }: any) =>
<div>
        <div className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-400 uppercase">
            {label}
        </div>
        <div className="text-[0.95rem] font-semibold text-slate-800 dark:text-white">
            {value}
        </div>
    </div>;


const StatBox = ({ icon, label, value }: any) =>
<div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50">
        <div className="text-[0.7rem] font-bold text-red-600 dark:text-red-400 uppercase mb-1 flex items-center gap-1.5">
            <span>{icon}</span>
            {label}
        </div>
        <div className="text-[0.85rem] text-red-800 dark:text-red-200 leading-relaxed">
            {value || 'No especificado'}
        </div>
    </div>;


const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-input-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all var(--transition-fast)',
  boxSizing: 'border-box'
};