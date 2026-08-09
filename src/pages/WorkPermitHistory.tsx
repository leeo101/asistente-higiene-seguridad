import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Calendar, Building2, Trash2, Share2,
  Eye, QrCode, Plus, Download, Clock, Flame, CheckCircle2, Construction
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { permitTypes } from '../data/workPermits';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

export default function WorkPermitHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('work_permits_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const executeDelete = async () => {
    if (confirmModal.payload) {
      const updated = history.filter((h) => h.id !== confirmModal.payload);
      setHistory(updated);
      localStorage.setItem('work_permits_history', JSON.stringify(updated));
      await syncCollection('work_permits_history', updated);
      toast.success('Permiso de trabajo eliminado correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const handleExportCSV = () => {
    const rows = filteredHistory.map((i) => ({
      'ID Permiso': i.id || '',
      'Fecha': i.fecha || '',
      'Empresa': i.empresa || '',
      'Obra / Sector': i.obra || '',
      'Tipo de Tarea': permitTypes.find((t) => t.id === i.tipoPermiso)?.label || 'Permiso',
      'Hora Inicio': i.validezDesde || '',
      'Hora Fin': i.validezHasta || '',
      'Estado': i.estado || 'Borrador'
    }));
    downloadCSV(rows, `Permisos_de_Trabajo_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Registro de Permisos de Trabajo exportado');
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item: any) => {
      if (filterType === 'all') return true;
      if (filterType === 'aprobado') return item.estado === 'Aprobado';
      if (filterType === 'pendiente') return item.estado !== 'Aprobado';
      if (filterType === 'criticos') return ['altura', 'fuego', 'confinado', 'electrico'].includes(item.tipoPermiso);
      return item.tipoPermiso === filterType;
    });
  }, [history, filterType]);

  const stats = useMemo(() => {
    const total = history.length;
    const aprobados = history.filter((h: any) => h.estado === 'Aprobado').length;
    const pendientes = history.filter((h: any) => h.estado !== 'Aprobado').length;
    const criticos = history.filter((h: any) => ['altura', 'fuego', 'confinado', 'electrico'].includes(h.tipoPermiso)).length;
    return { total, aprobados, pendientes, criticos };
  }, [history]);

  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={14} className="text-amber-500" />
          {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '-'}
        </span>
      )
    },
    {
      header: 'Empresa / Contratista',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>{item.empresa || 'N/A'}</div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} className="text-blue-500" /> {item.obra || 'Obra General'}
          </div>
        </div>
      )
    },
    {
      header: 'Tipo de Tarea',
      accessor: 'tipoPermiso',
      sortable: true,
      render: (item: any) => {
        const permit = permitTypes.find((t) => t.id === item.tipoPermiso);
        return (
          <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} /> {permit?.label || 'Permiso Especial'}
          </span>
        );
      }
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (item: any) => {
        const isApproved = item.estado === 'Aprobado';
        return (
          <span style={{
            backgroundColor: isApproved ? '#f0fdf4' : '#fffbeb',
            color: isApproved ? '#15803d' : '#b45309',
            border: `1px solid ${isApproved ? '#bbf7d0' : '#fde68a'}`,
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: '900',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isApproved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            {isApproved ? 'Aprobado' : 'Borrador / Pendiente'}
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => navigate('/work-permit', { state: { editData: item } })}
            title="Editar Permiso"
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> Editar
          </button>

          <button
            onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`; setQrTarget({ text: url, title: `Permiso — ${item.empresa}` }); })}
            title="Ver Código QR"
            style={{ backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          <button
            onClick={() => requirePro(() => setShareItem(item))}
            title="Exportar PDF / Compartir"
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          <button
            onClick={() => setConfirmModal({ isOpen: true, payload: item.id })}
            title="Eliminar Permiso"
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
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Permiso de Trabajo - ${shareItem?.empresa || ''}`}
          text={shareItem ? `🔐 Permiso de Trabajo\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''}
          rawMessage={``}
          elementIdToPrint="pdf-content"
          fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}.pdf`}
        />

        <div className="fixed left-0 opacity-0 top-0 pointer-events-none">
          {shareItem && <WorkPermitPdfGenerator data={shareItem} />}
        </div>

        <PremiumHeader
          title="Historial de Permisos de Trabajo"
          subtitle="Trazabilidad y Control de Tareas Críticas • Res. 311/03 / Ley 19.587"
          icon={<ShieldCheck size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        />

        {/* Tarjetas resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Permisos</span>
              <ShieldCheck size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          </div>

          <div
            onClick={() => setFilterType('aprobado')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'aprobado'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Permisos Aprobados</span>
              <CheckCircle2 size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.aprobados}</div>
          </div>

          <div
            onClick={() => setFilterType('pendiente')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'pendiente'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pendientes / Borrador</span>
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pendientes}</div>
          </div>

          <div
            onClick={() => setFilterType('criticos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'criticos'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tareas Críticas</span>
              <Flame size={18} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.criticos}</div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los Permisos', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'altura', label: '🧗 Altura', bg: '#dc2626', activeBg: '#b91c1c' },
              { id: 'fuego', label: '🔥 Trabajo en Caliente', bg: '#ea580c', activeBg: '#c2410c' },
              { id: 'electrico', label: '⚡ Eléctrico / LOTO', bg: '#d97706', activeBg: '#b45309' },
              { id: 'confinado', label: '📦 Espacio Confinado', bg: '#9333ea', activeBg: '#7e22ce' },
              { id: 'aprobado', label: '✅ Aprobados', bg: '#059669', activeBg: '#047857' }
            ].map((tab) => {
              const isSelected = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
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
              onClick={() => requirePro(handleExportCSV)}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
              <Download size={16} /> Exportar Excel / CSV
            </button>

            <button
              type="button"
              onClick={() => navigate('/work-permit')}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo Permiso
            </button>
          </div>
        </div>

        <DataTable
          data={filteredHistory}
          columns={columns}
          searchPlaceholder="Buscar por empresa, obra o tipo..."
          searchFields={['empresa', 'obra']}
          emptyMessage="No hay permisos de trabajo registrados."
          emptyIcon={<ShieldCheck size={48} />}
        />

        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar permiso de trabajo?"
          message="Esta acción eliminará el registro permanentemente."
          iconEmoji="🗑️"
        />
      </div>
    </AnimatedPage>
  );
}