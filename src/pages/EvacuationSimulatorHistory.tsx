import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Edit3, Printer, Share2, Timer, Clock, Building2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import ShareModal from '../components/ShareModal';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import { usePaywall } from '../hooks/usePaywall';

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

export default function EvacuationSimulatorHistory(): React.ReactElement | null {
  const navigate = useNavigate();
  const { requirePro } = usePaywall();
  const [searchTerm, setSearchTerm] = useState('');
  const [simulations, setSimulations] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [shareItem, setShareItem] = useState<any | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
      setSimulations(Array.isArray(saved) ? saved : []);
    } catch (e) {
      console.error('Error al cargar historial de evacuación:', e);
      setSimulations([]);
    }
  }, []);

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = simulations.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
      setSimulations(updated);
      toast.success('Simulación eliminada correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const handleEdit = (form: any) => {
    navigate('/evacuation-form', { state: { editData: form } });
  };

  const handleShare = (item: any) => {
    requirePro(() => setShareItem(item));
  };

  const handlePrint = (item: any) => {
    requirePro(() => setShareItem(item));
  };

  // Metrics (KPI Cards)
  const metrics = useMemo(() => {
    const total = simulations.length;
    const totalPeople = simulations.reduce((sum, s) => sum + (Number(s.peopleCount) || 0), 0);
    const avgTime = total > 0 ? (simulations.reduce((sum, s) => sum + (Number(s.calculatedTime) || 0), 0) / total).toFixed(1) : '0';
    const sectorsCount = new Set(simulations.map(s => s.sector).filter(Boolean)).size;

    return { total, totalPeople, avgTime, sectorsCount };
  }, [simulations]);

  const filteredSimulations = simulations.filter((p: any) =>
    (p?.sector && String(p.sector).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p?.evaluator && String(p.evaluator).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // DataTable Columns definition matching Aptitudes Médicas & Extintores
  const columns = [
    {
      header: 'Fecha',
      accessor: 'date',
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'block' }}>
          {formatDateSafe(item.date)}
        </span>
      )
    },
    {
      header: 'Sector / Edificio',
      accessor: 'sector',
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>
            {item.sector || 'Sector General'}
          </div>
          <div style={{ color: '#64748b', fontWeight: '700', fontSize: '11px', marginTop: '2px' }}>
            Evaluador: {item.evaluator || 'No asignado'}
          </div>
        </div>
      )
    },
    {
      header: 'Parámetros',
      accessor: 'peopleCount',
      render: (item: any) => (
        <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px' }}>
          👥 {item.peopleCount || 0} pers. • 🚪 {item.exitWidth || 0}m salida
        </span>
      )
    },
    {
      header: 'Tiempo Total',
      accessor: 'calculatedTime',
      render: (item: any) => (
        <span style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Timer size={14} /> {item.calculatedTime || 0}s
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', whiteSpace: 'nowrap', minWidth: 0 }}>
          <button
            onClick={() => handleEdit(item)}
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '6px 0 0 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
            title="Editar Simulación">
            <Edit3 size={12} /> Editar
          </button>
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.3)', alignSelf: 'stretch', display: 'inline-block' }} />

          <button
            onClick={() => handlePrint(item)}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
            title="Imprimir PDF">
            <Printer size={12} /> PDF
          </button>
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.3)', alignSelf: 'stretch', display: 'inline-block' }} />

          <button
            onClick={() => handleShare(item)}
            style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '4px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
            title="Compartir Ficha">
            <Share2 size={12} /> Compartir
          </button>
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.3)', alignSelf: 'stretch', display: 'inline-block' }} />

          <button
            onClick={() => handleDelete(item.id)}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '0 6px 6px 0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
            title="Eliminar Simulación">
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Modal de Compartir / Exportar PDF */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Simulación - ${shareItem?.sector || 'Evacuación'}`}
          text={shareItem ? `⏱️ Simulación de Evacuación\n📍 Sector: ${shareItem.sector}\n⚡ Tiempo Total: ${shareItem.calculatedTime || 0} segundos` : ''}
          rawMessage={shareItem ? `⏱️ Simulación de Evacuación\n📍 Sector: ${shareItem.sector}\n⚡ Tiempo Total: ${shareItem.calculatedTime || 0} segundos` : ''}
          elementIdToPrint="pdf-portal-container"
          fileName={`Evacuacion_${shareItem?.sector || 'Reporte'}.pdf`}
        />

        {/* Portal Offscreen para Renderizado del PDF Vectorial */}
        <div
          id="pdf-portal-container"
          className="ats-pdf-offscreen"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-99999px',
            width: '210mm',
            height: 'auto',
            overflow: 'visible',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: -9999,
            background: '#ffffff'
          }}
        >
          {shareItem && <EvacuationPdfGenerator data={shareItem} />}
        </div>

        <PremiumHeader
          title="Simulador de Evacuación"
          subtitle="Gestión de simulaciones teóricas de tiempos de escape (NFPA 101)"
          icon={<Timer size={36} color="#ffffff" />}
        />

        {/* Tarjetas KPI Superiores (Idénticas a Aptitudes Médicas) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Simulaciones</span>
              <Timer size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Evaluaciones guardadas</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tiempo Promedio</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.avgTime}s</div>
            <span className="text-[11px] text-slate-500">Segundos de escape</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Población Total</span>
              <Users size={20} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.totalPeople}</div>
            <span className="text-[11px] text-slate-500">Personas amparadas</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sectores Evaluados</span>
              <Building2 size={20} />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.sectorsCount}</div>
            <span className="text-[11px] text-slate-500">Edificios / Plantas</span>
          </div>
        </div>

        {/* Sección de Tabla de Historial con Barra de Búsqueda y Botón Nuevo */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
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
                placeholder="Buscar por sector o evaluador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={() => navigate('/evacuation-form')}
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
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Plus size={14} />
              <span>Nueva Simulación</span>
            </button>
          </div>

          {/* DataTable Component */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <DataTable
              data={filteredSimulations}
              columns={columns}
              emptyMessage="No se encontraron simulaciones registradas."
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar simulación?"
        message="Esta acción eliminará la evaluación del historial."
        iconEmoji="🗑️"
      />
    </AnimatedPage>
  );
}