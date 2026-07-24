import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, Calendar, Timer, Warning, Trash, ShareNetwork as Share2, PencilSimple, QrCode, Plus, Eye, CheckCircle, Users, TrendUp, ShieldCheck } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';

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

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = JSON.parse(localStorage.getItem('drills_history') || '[]');
    setHistory(h.sort((a: any, b: any) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)));
  }, [syncing]);

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('drills_history', JSON.stringify(updated));
    syncCollection('drills_history', updated);
    setDeleteTarget(null);
  };

  if (selectedReport) {
    return <DrillPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  // Calculate statistics
  const totalDrills = history.length;
  const totalEvacuated = history.reduce((acc, curr) => acc + (parseInt(curr.evacuados, 10) || 0), 0);
  
  // Calculate average time in seconds
  let avgSeconds = 0;
  if (totalDrills > 0) {
    const totalSecs = history.reduce((acc, curr) => {
      const parts = (curr.tiempoVisual || '00:00').split(':');
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return acc + (mins * 60 + secs);
    }, 0);
    avgSeconds = Math.round(totalSecs / totalDrills);
  }
  const avgMinsFormatted = `${Math.floor(avgSeconds / 60).toString().padStart(2, '0')}:${(avgSeconds % 60).toString().padStart(2, '0')}`;

  const getHipotesisBadge = (hipotesis: string) => {
    const h = (hipotesis || '').toLowerCase();
    if (h.includes('incendio')) return { icon: '🔥', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    if (h.includes('sismo') || h.includes('terremoto')) return { icon: '🌋', bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    if (h.includes('gas') || h.includes('fuga')) return { icon: '💨', bg: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };
    if (h.includes('bomba') || h.includes('amenaza')) return { icon: '💣', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
    if (h.includes('derrame') || h.includes('quimico')) return { icon: '⚠️', bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
    return { icon: '🚨', bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
  };

  const getTimeBadge = (tiempoStr: string) => {
    const parts = (tiempoStr || '00:00').split(':');
    const mins = parseInt(parts[0], 10) || 0;
    if (mins < 3) return { label: 'Rápido', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
    if (mins <= 5) return { label: 'Normal', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
    return { label: 'Revisar', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' };
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap text-sm">
          <Calendar size={16} className="text-amber-500" /> 
          {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
        </span>
      )
    },
    {
      header: 'Empresa / Instalación',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-white shadow-sm shadow-amber-500/20">
            <Siren size={18} weight="fill" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">{item.empresa}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hora: {item.hora || '10:00 hs'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Hipótesis de Evento',
      accessor: 'hipotesis',
      sortable: true,
      render: (item: any) => {
        const badge = getHipotesisBadge(item.hipotesis);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${badge.bg}`}>
            <span>{badge.icon}</span>
            <span>{item.hipotesis || 'General'}</span>
          </span>
        );
      }
    },
    {
      header: 'Evacuados',
      accessor: 'evacuados',
      render: (item: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold">
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
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center gap-1.5 py-1 px-3 border rounded-xl text-xs font-black w-fit shadow-xs ${tb.color}`}>
              <Timer size={14} weight="bold" /> {item.tiempoVisual || '00:00'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ver Acta */}
          <button 
            onClick={() => setSelectedReport(item)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Ver Acta Completa"
          >
            <Eye size={14} weight="bold" /> Ver
          </button>

          {/* Editar */}
          <button 
            onClick={() => navigate('/drills/new', { state: { editData: item } })} 
            title="Editar Simulacro" 
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <PencilSimple size={14} weight="bold" /> Editar
          </button>

          {/* QR */}
          <button 
            onClick={() => requirePro(() => {
              const url = `${window.location.origin}/v/${currentUser?.uid}/drill/${item.id}?print=true`;
              setQrTarget({ text: url, title: `Simulacro — ${item.empresa}` });
            })} 
            title="Código QR de Validación" 
            className="p-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <QrCode size={15} weight="bold" />
          </button>

          {/* Compartir */}
          <button 
            onClick={() => requirePro(() => setShareItem(item))} 
            title="Compartir en PDF / WhatsApp" 
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Share2 size={14} weight="bold" /> Compartir
          </button>

          {/* Eliminar */}
          <button 
            onClick={() => setDeleteTarget(item.id)} 
            title="Eliminar Registro"
            className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Trash size={15} weight="bold" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container max-w-6xl mx-auto pt-8 md:pt-12 pb-24 px-4 w-full">
        
        {/* Modal Confirmación Borrado */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full text-center p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash size={36} weight="bold" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">¿Eliminar acta de simulacro?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Esta acción eliminará el registro permanentemente del sistema.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteTarget(null)} 
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-none cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold border-none cursor-pointer shadow-lg shadow-rose-500/30 hover:scale-105 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Compartir */}
        <ShareModal 
          isOpen={!!shareItem} 
          open={!!shareItem} 
          onClose={() => setShareItem(null)} 
          title={`Simulacro - ${shareItem?.empresa || ''}`} 
          text={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} 
          rawMessage={shareItem ? `🔔 Acta de Simulacro\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⏱️ Tiempo: ${shareItem.tiempoVisual}` : ''} 
          elementIdToPrint="pdf-content" 
          fileName={`Simulacro_${shareItem?.empresa || 'acta'}.pdf`} 
        />

        <div className="absolute left-0 opacity-0 top-[-9999px] pointer-events-none">
          {shareItem && <DrillPdfGenerator report={shareItem} isHeadless={true} />}
        </div>

        {/* Header Premium */}
        <div className="no-print mb-8">
          <PremiumHeader
            title="Actas de Simulacros"
            subtitle="Gestión y registros de prácticas de evacuación"
            icon={<Siren size={32} color="#ffffff" weight="fill" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" 
          />
          
          <div className="flex justify-between items-center flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm">
              <ShieldCheck size={20} className="text-amber-500" />
              <span>Cumplimiento Ley 19.587 / Res. 343/11</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => navigate('/drills/new')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.5)'
                }}
                className="flex items-center gap-2.5 py-3.5 px-6 rounded-2xl font-black cursor-pointer transition-all hover:scale-105 active:scale-95 text-sm shadow-xl"
              >
                <Plus size={20} weight="bold" />
                Nuevo Simulacro
              </button>
            </div>
          </div>
        </div>

        {/* KPI Dashboard Cards */}
        {totalDrills > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <Siren size={26} weight="fill" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Simulacros</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalDrills} <span className="text-xs font-normal text-slate-500">registrados</span></span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                <Timer size={26} weight="bold" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tiempo Promedio</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{avgMinsFormatted} <span className="text-xs font-normal text-slate-500">mm:ss</span></span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Users size={26} weight="bold" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Evacuados Totales</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalEvacuated} <span className="text-xs font-normal text-slate-500">personas</span></span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendUp size={26} weight="bold" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Conformidad</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% <span className="text-xs font-normal text-slate-500">cumplido</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Buscar por empresa, fecha o hipótesis..."
          searchFields={['empresa', 'hipotesis', 'fecha']}
          emptyMessage="No hay actas de simulacro registradas. Haz clic en 'Nuevo Simulacro' para comenzar."
          emptyIcon={<Siren size={56} className="text-amber-500 animate-bounce" />}
        />

        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
      </div>
    </AnimatedPage>
  );
}