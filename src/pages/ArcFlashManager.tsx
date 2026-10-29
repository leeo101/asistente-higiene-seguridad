import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Plus, Search, Calendar, FileText,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Download
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ArcFlashPdfGenerator from '../components/ArcFlashPdfGenerator';
import { printElementAsDocument, generatePdfBlob } from '../utils/pdfHelper';
import { ArcFlashPermitData, PPE_CATEGORY_DESCRIPTIONS } from '../data/arcFlashData';
import toast from 'react-hot-toast';

export default function ArcFlashManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [permits, setPermits] = useState<ArcFlashPermitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPermit, setViewPermit] = useState<ArcFlashPermitData | null>(null);
  const [targetPrintPermit, setTargetPrintPermit] = useState<ArcFlashPermitData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('arc_flash_permits_db');
    if (raw) {
      try {
        setPermits(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading arc flash permits', e);
      }
    }
  }, []);

  // KPIs Metrics idénticos a Aptitudes Médicas
  const metrics = useMemo(() => {
    const scoped = activeCompany
      ? permits.filter(p => !p.companyId || p.companyId === activeCompany.id)
      : permits;

    const total = scoped.length;
    const cat1 = scoped.filter(p => String(p.ppeCategory) === '1').length;
    const cat2 = scoped.filter(p => String(p.ppeCategory) === '2').length;
    const cat3 = scoped.filter(p => String(p.ppeCategory) === '3').length;
    const cat4 = scoped.filter(p => String(p.ppeCategory) === '4').length;
    const prohibited = scoped.filter(p => String(p.ppeCategory) === 'prohibited').length;
    const lowRisk = cat1 + cat2;
    const highRisk = cat3 + cat4;

    return { total, cat1, cat2, cat3, cat4, prohibited, lowRisk, highRisk };
  }, [permits, activeCompany]);

  const filtered = useMemo(() => {
    return permits.filter(p => {
      if (activeCompany && p.companyId && p.companyId !== activeCompany.id) return false;

      // Filtro de categorías
      if (filterCategory === 'low') {
        if (p.ppeCategory !== 1 && p.ppeCategory !== 2) return false;
      } else if (filterCategory === 'high') {
        if (p.ppeCategory !== 3 && p.ppeCategory !== 4) return false;
      } else if (filterCategory !== 'all') {
        if (String(p.ppeCategory) !== filterCategory) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.permitNumber?.toLowerCase().includes(q) ||
          p.panelOrEquipmentTag?.toLowerCase().includes(q) ||
          p.substationOrLocation?.toLowerCase().includes(q) ||
          p.leadElectrician?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permits, activeCompany, filterCategory, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = permits.filter(p => p.id !== deleteId);
    setPermits(updated);
    localStorage.setItem('arc_flash_permits_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Permiso de riesgo eléctrico eliminado');
  };

  const exportToCsv = () => {
    if (permits.length === 0) {
      toast.error('No hay permisos registrados para exportar.');
      return;
    }

    const headers = [
      'Nro Permiso',
      'Fecha',
      'Horario',
      'Tablero/Equipo',
      'Subestacion/Sector',
      'Tension (V)',
      'Cortocircuito (kA)',
      'Tiempo Apertura (s)',
      'Distancia Trabajo (cm)',
      'Energia Incidente (cal/cm2)',
      'Frontera Arco (m)',
      'Categoria EPP',
      'Clase Guantes',
      'Electricista Habilitado',
      'Supervisor HyS',
      'Estado'
    ];

    const rows = permits.map(p => [
      `"${p.permitNumber || ''}"`,
      `"${p.date || ''}"`,
      `"${p.startTime || ''} a ${p.endTime || ''}"`,
      `"${(p.panelOrEquipmentTag || '').replace(/"/g, '""')}"`,
      `"${(p.substationOrLocation || '').replace(/"/g, '""')}"`,
      p.nominalVoltageV || '',
      p.shortCircuitKa || '',
      p.clearingTimeSeconds || '',
      p.workingDistanceCm || '',
      p.calculatedIncidentEnergyCalCm2 || '',
      p.arcFlashBoundaryMeters || '',
      `"${p.ppeCategory === 'prohibited' ? 'PROHIBIDO' : `CAT ${p.ppeCategory}`}"`,
      `"Clase ${p.gloveClass || ''}"`,
      `"${(p.leadElectrician || '').replace(/"/g, '""')}"`,
      `"${(p.safetySupervisor || '').replace(/"/g, '""')}"`,
      `"${p.status || 'active'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Permisos_Arco_Electrico_NFPA70E_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón de permisos de arco eléctrico exportado a CSV.');
  };

  const exportPDF = (permit: ArcFlashPermitData, downloadOnly: boolean = false) => {
    setTargetPrintPermit(permit);
    setTimeout(async () => {
      const sanitizedTag = (permit.panelOrEquipmentTag || 'Tablero').replace(/\s+/g, '_');
      const fileName = `Permiso_Arco_Electrico_${permit.permitNumber}_${sanitizedTag}.pdf`;
      const targetId = viewPermit?.id === permit.id && !downloadOnly
        ? 'pdf-content-arc-flash-modal'
        : 'pdf-content-arc-flash-manager';

      if (downloadOnly) {
        const loadingToast = toast.loading('Generando documento PDF oficial...');
        try {
          const blob = await generatePdfBlob('pdf-content-arc-flash-manager', false);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          toast.success('Permiso eléctrico descargado en PDF con firmas oficiales', { id: loadingToast });
        } catch (e) {
          console.error(e);
          toast.error('Error al generar PDF', { id: loadingToast });
        }
      } else {
        await printElementAsDocument(targetId, `Permiso de Trabajo con Tensión ${permit.permitNumber}`, false);
      }
    }, 150);
  };

  const getCategoryColor = (cat: any) => {
    switch (String(cat)) {
      case '1': return { border: '#059669', bg: 'rgba(5, 150, 105, 0.1)', text: '#059669', label: 'CAT 1 (≤ 4 cal/cm²)' };
      case '2': return { border: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', text: '#d97706', label: 'CAT 2 (≤ 8 cal/cm²)' };
      case '3': return { border: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c', label: 'CAT 3 (≤ 25 cal/cm²)' };
      case '4': return { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', text: '#dc2626', label: 'CAT 4 (≤ 40 cal/cm²)' };
      case 'prohibited': return { border: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.15)', text: '#7f1d1d', label: 'PELIGRO PROHIBIDO (> 40 cal)' };
      default: return { border: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', label: 'EVALUADO' };
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Header idéntico a Aptitudes Médicas */}
        <PremiumHeader
          title="Riesgo Eléctrico y Arco Eléctrico (Arc Flash)"
          subtitle="Cálculo de energía incidente (cal/cm²), categorías de EPP y permisos con tensión bajo NFPA 70E y Res. SRT 3068/14"
          icon={<Zap size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          badge="NFPA 70E & Res. SRT 3068/14"
        />

        {/* Top Summary Cards (KPIs) idénticos a Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterCategory('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Registrados</span>
              <Zap size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Permisos documentados</span>
          </div>

          <div
            onClick={() => setFilterCategory('low')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'low'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Bajo Riesgo (Cat 1-2)</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.lowRisk}</div>
            <span className="text-[11px] text-slate-500">≤ 8 cal/cm² (EPP Básico)</span>
          </div>

          <div
            onClick={() => setFilterCategory('high')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'high'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Alto Riesgo (Cat 3-4)</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.highRisk}</div>
            <span className="text-[11px] text-slate-500">≤ 40 cal/cm² (Traje y Escafandra)</span>
          </div>

          <div
            onClick={() => setFilterCategory('prohibited')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'prohibited'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Peligro Prohibido</span>
              <ShieldAlert size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.prohibited}</div>
            <span className="text-[11px] text-slate-500">&gt; 40 cal/cm² (Desenergizar)</span>
          </div>
        </div>

        {/* Toolbar & Search Bar Section idéntico a Aptitudes Médicas */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
            {/* Input de Búsqueda */}
            <div className="relative flex-1 max-w-xs h-[38px]">
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
                placeholder="Buscar N°, tablero, electricista..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV Res. SRT 3068/14 */}
              <button
                type="button"
                onClick={exportToCsv}
                title="Exportar base oficial a formato CSV compatible con Excel"
                style={{
                  backgroundColor: '#0284c7',
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
                  minHeight: 'unset',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Nuevo Permiso Eléctrico SUPER COMPACTO INLINE idéntico a Aptitudes Médicas */}
              <button
                type="button"
                onClick={() => navigate('/arc-flash/new')}
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
                  minHeight: 'unset',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Plus size={14} />
                <span>Nuevo Permiso Eléctrico</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs idénticos a Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              style={{
                backgroundColor: filterCategory === 'all' ? '#2563eb' : '#ffffff',
                color: filterCategory === 'all' ? '#ffffff' : '#334155',
                border: filterCategory === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('1')}
              style={{
                backgroundColor: filterCategory === '1' ? '#059669' : '#ffffff',
                color: filterCategory === '1' ? '#ffffff' : '#334155',
                border: filterCategory === '1' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Cat 1 (≤ 4 cal) ({metrics.cat1})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('2')}
              style={{
                backgroundColor: filterCategory === '2' ? '#d97706' : '#ffffff',
                color: filterCategory === '2' ? '#ffffff' : '#334155',
                border: filterCategory === '2' ? '1px solid #d97706' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Cat 2 (≤ 8 cal) ({metrics.cat2})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('3')}
              style={{
                backgroundColor: filterCategory === '3' ? '#ea580c' : '#ffffff',
                color: filterCategory === '3' ? '#ffffff' : '#334155',
                border: filterCategory === '3' ? '1px solid #ea580c' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Cat 3 (≤ 25 cal) ({metrics.cat3})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('4')}
              style={{
                backgroundColor: filterCategory === '4' ? '#dc2626' : '#ffffff',
                color: filterCategory === '4' ? '#ffffff' : '#334155',
                border: filterCategory === '4' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Cat 4 (≤ 40 cal) ({metrics.cat4})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('prohibited')}
              style={{
                backgroundColor: filterCategory === 'prohibited' ? '#7f1d1d' : '#ffffff',
                color: filterCategory === 'prohibited' ? '#ffffff' : '#334155',
                border: filterCategory === 'prohibited' ? '1px solid #7f1d1d' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                minHeight: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              Peligro Prohibido ({metrics.prohibited})
            </button>
          </div>
        </div>

        {/* Content Section: Cards or EmptyState */}
        {filtered.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <EmptyStateIllustrated
              title="No hay permisos de arco eléctrico registrados"
              description="Calculá la energía incidente de tableros o celdas, determiná la categoría de ropa ignífuga requerida y emití permisos según NFPA 70E y Res. SRT 3068/14."
              color="#d97706"
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map(p => {
              const catConfig = getCategoryColor(p.ppeCategory);
              const ppeDesc = (PPE_CATEGORY_DESCRIPTIONS as any)[p.ppeCategory]?.desc || '';

              return (
                <div
                  key={p.id}
                  className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                  style={{ borderLeft: `5px solid ${catConfig.border}` }}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
                    <div
                      style={{ background: catConfig.bg, border: `2px solid ${catConfig.border}` }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400"
                    >
                      <Zap size={26} color={catConfig.border} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="m-0 text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {p.panelOrEquipmentTag}
                        </h3>
                        <span
                          style={{ backgroundColor: catConfig.bg, color: catConfig.text }}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-current"
                        >
                          {catConfig.label}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {p.permitNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          ⚡ Energía: <strong className="text-amber-600 dark:text-amber-400">{p.calculatedIncidentEnergyCalCm2} cal/cm²</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          🛡️ Frontera Arco: <strong>{p.arcFlashBoundaryMeters} m</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          🔌 Tensión: <strong>{p.nominalVoltageV} V</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} /> {p.date} ({p.startTime} - {p.endTime})
                        </span>
                        <span className="flex items-center gap-1">
                          👷 {p.leadElectrician}
                        </span>
                      </div>

                      {ppeDesc && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                          EPP requerido: {ppeDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons con colores idénticos a Aptitudes Médicas */}
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                    {/* Botón PDF Certificado */}
                    <button
                      type="button"
                      onClick={() => exportPDF(p)}
                      title="Ver / Exportar Permiso Oficial en PDF"
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      <FileText size={12} /> PDF
                    </button>

                    {/* Botón Ver / Detalles */}
                    <button
                      type="button"
                      onClick={() => setViewPermit(p)}
                      title="Ver Detalles y Protocolo SRT 3068/14"
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      <Eye size={12} /> Ver
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
                      title="Eliminar registro de permiso"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                      }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTENEDOR A4 OFFSCREEN PARA IMPRESIÓN Y DESCARGA PDF DIRECTA */}
        {targetPrintPermit && (
          <div
            className="ats-pdf-offscreen"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '210mm',
              backgroundColor: '#ffffff',
              zIndex: -1
            }}
            ref={printRef}
          >
            <ArcFlashPdfGenerator
              permit={targetPrintPermit}
              companyName={activeCompany?.name}
              pdfElementId="pdf-content-arc-flash-manager"
            />
          </div>
        )}

        {/* Modal Vista Previa Oficial A4 del Permiso */}
        {viewPermit && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={18} color="#fbbf24" />
                <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                  Permiso de Trabajo con Tensión N° {viewPermit.permitNumber} — {viewPermit.panelOrEquipmentTag}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => exportPDF(viewPermit, false)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => exportPDF(viewPermit, true)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewPermit(null)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
                borderRadius: '0 0 12px 12px',
                overflow: 'hidden'
              }}
            >
              <ArcFlashPdfGenerator
                permit={viewPermit}
                companyName={activeCompany?.name}
                pdfElementId="pdf-content-arc-flash-modal"
              />
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Eliminar Permiso de Riesgo Eléctrico"
          message="¿Estás seguro de que deseas eliminar este permiso? Esta acción no se puede deshacer y el registro no aparecerá en las auditorías."
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
