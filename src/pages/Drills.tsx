import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Siren, Calendar, Timer, AlertTriangle, Trash2, Share2, 
  Edit3, QrCode, Plus, CheckCircle2, Users, ShieldCheck, Download, Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';

export default function DrillsHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();
  const [history, setHistory] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [hipotesisFilter, setHipotesisFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = JSON.parse(localStorage.getItem('drills_history') || '[]');
    setHistory(h.sort((a: any, b: any) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)));
  }, [syncing]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('drills_history', JSON.stringify(updated));
    syncCollection('drills_history', updated);
    setDeleteTarget(null);
    toast.success('Acta de simulacro eliminada');
  };

  if (selectedReport) {
    return <DrillPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  // Resumen Estadístico (KPIs)
  const stats = useMemo(() => {
    const totalDrills = history.length;
    const totalEvacuated = history.reduce((acc, curr) => acc + (parseInt(curr.evacuados, 10) || 0), 0);
    
    let totalSecs = 0;
    if (totalDrills > 0) {
      totalSecs = history.reduce((acc, curr) => {
        const parts = (curr.tiempoVisual || '00:00').split(':');
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        return acc + (mins * 60 + secs);
      }, 0);
    }
    const avgSeconds = totalDrills > 0 ? Math.round(totalSecs / totalDrills) : 0;
    const avgMinsFormatted = `${Math.floor(avgSeconds / 60).toString().padStart(2, '0')}:${(avgSeconds % 60).toString().padStart(2, '0')}`;

    return { totalDrills, totalEvacuated, avgMinsFormatted };
  }, [history]);

  const getHipotesisBadge = (hipotesis: string) => {
    const h = (hipotesis || '').toLowerCase();
    let bg = '#fffbeb';
    let color = '#d97706';
    let border = '#fde68a';
    let icon = '🚨';

    if (h.includes('incendio')) {
      icon = '🔥'; bg = '#fef2f2'; color = '#dc2626'; border = '#fecdd3';
    } else if (h.includes('sismo') || h.includes('terremoto')) {
      icon = '🌋'; bg = '#faf5ff'; color = '#9333ea'; border = '#e9d5ff';
    } else if (h.includes('gas') || h.includes('fuga')) {
      icon = '💨'; bg = '#f0f9ff'; color = '#0284c7'; border = '#bae6fd';
    } else if (h.includes('bomba') || h.includes('amenaza')) {
      icon = '💣'; bg = '#fff1f2'; color = '#e11d48'; border = '#fecdd3';
    } else if (h.includes('derrame') || h.includes('quimico')) {
      icon = '⚠️'; bg = '#fffbeb'; color = '#d97706'; border = '#fde68a';
    }

    return (
      <span style={{ 
        backgroundColor: bg, 
        color, 
        border: `1px solid ${border}`, 
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontWeight: '900', 
        fontSize: '11px', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px' 
      }}>
        <span>{icon}</span>
        <span style={{ textTransform: 'capitalize' }}>{hipotesis || 'General'}</span>
      </span>
    );
  };

  const getTimeBadge = (tiempoStr: string) => {
    const parts = (tiempoStr || '00:00').split(':');
    const mins = parseInt(parts[0], 10) || 0;
    if (mins < 3) return { label: 'Rápido', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    if (mins <= 5) return { label: 'Normal', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    return { label: 'Revisar', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3' };
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={14} className="text-amber-500" />
          {item.fecha ? new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
        </span>
      )
    },
    {
      header: 'Empresa / Instalación',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>{item.empresa || 'Empresa N/D'}</div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px' }}>Hora: {item.hora || '10:00 hs'} {item.sector ? `• ${item.sector}` : ''}</div>
        </div>
      )
    },
    {
      header: 'Hipótesis de Evento',
      accessor: 'hipotesis',
      sortable: true,
      render: (item: any) => getHipotesisBadge(item.hipotesis)
    },
    {
      header: 'Evacuados',
      accessor: 'evacuados',
      render: (item: any) => (
        <span style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Users size={14} className="text-blue-500" /> {item.evacuados || 0} pers.
        </span>
      )
    },
    {
      header: 'Tiempo Total',
      accessor: 'tiempoVisual',
      render: (item: any) => {
        const tb = getTimeBadge(item.tiempoVisual);
        return (
          <span style={{ backgroundColor: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Timer size={14} /> {item.tiempoVisual || '00:00'} ({tb.label})
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar estilo Aptitudes Médicas (Fondo Ámbar Sólido) */}
          <button 
            onClick={() => navigate('/drills/new', { state: { editData: item } })} 
            title="Editar Simulacro" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>

          {/* Botón QR estilo Aptitudes Médicas (Fondo Azul Sólido) */}
          <button 
            onClick={() => requirePro(() => {
              const url = `${window.location.origin}/v/${currentUser?.uid}/drill/${item.id}?print=true`;
              setQrTarget({ text: url, title: `Simulacro — ${item.empresa}` });
            })} 
            title="Ver Código QR" 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          {/* Botón Compartir / PDF estilo Aptitudes Médicas (Fondo Esmeralda Sólido) */}
          <button 
            onClick={() => requirePro(() => setShareItem(item))} 
            title="Exportar PDF o Compartir" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          {/* Botón Eliminar estilo Aptitudes Médicas (Fondo Rojo Sólido) */}
          <button 
            onClick={() => setDeleteTarget(item.id)} 
            title="Eliminar Simulacro"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  const filteredHistory = history.filter((item) => {
    const emp = String(item?.empresa || '').toLowerCase();
    const hip = String(item?.hipotesis || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase();

    const matchesSearch = emp.includes(term) || hip.includes(term);
    if (!matchesSearch) return false;

    if (hipotesisFilter !== 'all' && !hip.includes(hipotesisFilter.toLowerCase())) return false;

    return true;
  });

  const handleExportCSV = () => {
    const rows = filteredHistory.map(item => ({
      'Fecha': item.fecha || '',
      'Hora': item.hora || '',
      'Empresa': item.empresa || '',
      'Hipótesis': item.hipotesis || '',
      'Evacuados': item.evacuados || 0,
      'Tiempo Total': item.tiempoVisual || ''
    }));
    downloadCSV(rows, `Simulacros_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Actas de simulacro exportadas');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full text-center p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">¿Eliminar acta de simulacro?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Esta acción eliminará el registro permanentemente del sistema.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteTarget(null)} 
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-none cursor-pointer hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold border-none cursor-pointer shadow-lg shadow-rose-500/30 hover:scale-105 transition-all">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        <ShareModal 
          isOpen={!!shareItem} 
          open={!!shareItem} 
          onClose={() => setShareItem(null)} 
          title={`Simulacro - ${shareItem?.empresa || ''}`} 
          text={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} 
          rawMessage={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} 
          elementIdToPrint="pdf-content-drills" 
          fileName={`Simulacro_${shareItem?.empresa || 'acta'}.pdf`} 
        />

        <div id="pdf-content-drills" className="absolute left-0 opacity-0 top-[-9999px] pointer-events-none">
          {shareItem && <DrillPdfGenerator report={shareItem} isHeadless={true} />}
        </div>

        <PremiumHeader
          title="Actas de Simulacros"
          subtitle="Gestión y registros de prácticas de evacuación (Cumplimiento Ley 19.587 / Res. 343/11)"
          icon={<Siren size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" 
        />

        {/* Tarjetas resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => setHipotesisFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              hipotesisFilter === 'all' 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Simulacros Totales</span>
              <Siren size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalDrills}</div>
          </div>

          <div 
            onClick={() => setHipotesisFilter('Incendio')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              hipotesisFilter === 'Incendio' 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tiempo Promedio</span>
              <Timer size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.avgMinsFormatted} <span className="text-xs font-normal">min</span></div>
          </div>

          <div 
            onClick={() => setHipotesisFilter('Gas')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              hipotesisFilter === 'Gas' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Evacuados Totales</span>
              <Users size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalEvacuated}</div>
          </div>

          <div 
            onClick={() => setHipotesisFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              hipotesisFilter === 'all' 
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
            }`}>
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Conformidad Legal</span>
              <ShieldCheck size={18} />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100% <span className="text-xs font-normal">Cumplido</span></div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los simulacros', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'Incendio', label: '🔥 Incendio', bg: '#dc2626', activeBg: '#991b1b' },
              { id: 'Gas', label: '💨 Gas / Fuga', bg: '#0284c7', activeBg: '#0369a1' },
              { id: 'Sismo', label: '🌋 Sismo / Terremoto', bg: '#9333ea', activeBg: '#7e22ce' },
              { id: 'Bomba', label: '💣 Amenaza de Bomba', bg: '#e11d48', activeBg: '#be123c' }
            ].map((tab) => {
              const isSelected = hipotesisFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setHipotesisFilter(tab.id)}
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
                e.stopPropagation();
                try {
                  navigate('/drills/new');
                } catch (err) {
                  window.location.href = '/drills/new';
                }
              }}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo Simulacro
            </button>
          </div>
        </div>

        {/* Data Table Estilo Aptitudes Médicas */}
        <DataTable
          data={filteredHistory}
          columns={columns}
          searchPlaceholder="Buscar por empresa, fecha o hipótesis..."
          emptyMessage="No hay actas de simulacro registradas. Haz clic en 'Nuevo Simulacro' para comenzar."
          emptyIcon={<Siren size={48} className="text-amber-500 animate-bounce" />}
        />

        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
      </div>
    </AnimatedPage>
  );
}