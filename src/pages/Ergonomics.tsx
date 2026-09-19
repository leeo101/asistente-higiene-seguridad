import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

import {
  Plus, FileText, ArrowLeft,
  Accessibility, Clock, Trash2, Search, Calendar, Building2, AlertTriangle,
  Download, Printer, Eye, ShieldCheck, Activity
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar estudio de ergonomía?"
      message="Esta acción no se puede deshacer y eliminará el registro local."
      iconEmoji="🗑️"
    />
  );
}

export default function Ergonomics(): React.ReactElement | null {
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('ergonomics_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing ergonomics_history', e);
      }
    }
  }, [syncPulse]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('ergonomics_history', JSON.stringify(updated));
    syncCollection('ergonomics_history', updated);
    setDeleteTarget(null);
    toast.success('Estudio eliminado correctamente.');
  };

  const exportCSV = () => {
    if (history.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = [
      'ID',
      'Fecha',
      'Empresa',
      'CUIT',
      'Sector',
      'Puesto',
      'Nivel de Riesgo Global',
      'Factores Activos',
      'Peso Real (kg)',
      'LPR (kg)',
      'Índice Levantamiento (IL)'
    ];

    const rows = history.map((item) => {
      const p1 = item.planilla1 || {};
      const activeCount = Object.values(p1).filter(Boolean).length;
      const niosh = item.calculoLevantamiento || {};
      const fecha = item.fechaEvaluacion || (item.id && !isNaN(Number(item.id)) ? new Date(Number(item.id)).toLocaleDateString('es-AR') : '');

      return [
        `"${item.id}"`,
        `"${fecha}"`,
        `"${(item.empresa || '').replace(/"/g, '""')}"`,
        `"${item.cuit || ''}"`,
        `"${(item.sector || '').replace(/"/g, '""')}"`,
        `"${(item.puesto || '').replace(/"/g, '""')}"`,
        `"${item.nivelRiesgoGlobal || item.riesgo || 'Nivel 1 (Aceptable)'}"`,
        activeCount,
        niosh.pesoCargaKg ?? niosh.peso ?? '',
        niosh.lprKg ?? '',
        niosh.indiceLevantamiento ?? ''
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Protocolos_Ergonomia_Res_SRT_886_15_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado con éxito');
  };

  const filteredHistory = history
    .slice()
    .sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    })
    .filter((item) =>
      (item.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.puesto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cuit || '').includes(searchTerm)
    );

  return (
    <div className="container max-w-[1200px] mx-auto pb-32">
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

      <PremiumHeader
        title="Protocolo de Ergonomía Laboral"
        subtitle="Resolución S.R.T. N° 886/15 • Planillas 1, 2 y 3 (Identificación, Evaluación Biomecánica y Matriz de Acciones)"
        icon={<Accessibility size={36} color="#ffffff" />}
      />

      {/* Barra de Acciones Superior */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap relative z-10">
        <div className="flex gap-2 items-center">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} /> Exportar CSV Oficial
          </button>
        </div>

        <button
          onClick={() => navigate('/ergonomics-form')}
          style={{ backgroundColor: '#10b981', color: 'white' }}
          className="flex-none px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer border-none"
        >
          <Plus size={20} /> Nuevo Estudio Ergonómico
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-8 h-[52px]">
        <Search
          size={20}
          className="text-slate-400 pointer-events-none z-10 absolute left-4 top-0 bottom-0 my-auto"
        />
        <input
          type="text"
          placeholder="Buscar por empresa, CUIT, sector o puesto de trabajo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: '52px',
            paddingLeft: '3.5rem',
            paddingRight: '1rem',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
            boxSizing: 'border-box',
            outline: 'none'
          }}
          className="rounded-2xl border-2 text-base shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-medium"
        />
      </div>

      {/* Grilla de Estudios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => {
            const p1 = item.planilla1 || {};
            const activeFactorsCount = Object.values(p1).filter(Boolean).length;
            const niosh = item.calculoLevantamiento || {};
            const risk = item.nivelRiesgoGlobal || item.riesgo || 'Nivel 1 (Aceptable)';
            const isHigh = risk.includes('Nivel 3') || risk === 'Alto';
            const isMod = risk.includes('Nivel 2') || risk === 'Moderado';

            const badgeBg = isHigh ? '#fee2e2' : isMod ? '#fef3c7' : '#dcfce7';
            const badgeColor = isHigh ? '#dc2626' : isMod ? '#d97706' : '#15803d';

            const formattedDate = item.fechaEvaluacion
              ? new Date(item.fechaEvaluacion + 'T00:00:00').toLocaleDateString('es-AR')
              : item.id && !isNaN(Number(item.id))
              ? new Date(Number(item.id)).toLocaleDateString('es-AR')
              : 'Fecha no registrada';

            return (
              <div
                key={item.id}
                className="hover:shadow-lg transition-all p-6 border flex flex-col gap-4 rounded-2xl relative"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Accessibility size={24} />
                    </div>
                    <div>
                      <h3 className="m-0 text-lg font-black leading-tight" style={{ color: 'var(--color-text)' }}>
                        {item.empresa || 'Empresa sin nombre'}
                      </h3>
                      <p className="m-0 text-xs font-bold mt-1 text-[var(--color-text-muted)] font-mono">
                        CUIT: {item.cuit || 'Sin CUIT'}
                      </p>
                      <p className="m-0 text-xs font-semibold mt-0.5 text-[var(--color-text-muted)]">
                        {item.puesto || 'Puesto no esp.'} · {item.sector || 'Sector no esp.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[var(--color-background)]">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] font-semibold">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {activeFactorsCount} {activeFactorsCount === 1 ? 'factor' : 'factores'} P1
                  </span>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Carga NIOSH</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {niosh.pesoCargaKg ?? niosh.peso ? `${niosh.pesoCargaKg ?? niosh.peso} kg` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Índice IL</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {niosh.indiceLevantamiento ? `IL ${niosh.indiceLevantamiento}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed border-[var(--color-border)]">
                  <span className="font-black text-[var(--color-text-muted)] uppercase">Nivel de Riesgo</span>
                  <span
                    style={{ background: badgeBg, color: badgeColor }}
                    className="font-black px-2.5 py-0.5 rounded-full text-xs"
                  >
                    {risk}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => navigate(`/ergonomics-report?id=${item.id}`)}
                    className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200 dark:border-slate-700"
                    title="Ver Protocolo Imprimible"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => navigate('/ergonomics-form', { state: { editData: item } })}
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                    className="hover:opacity-80 flex-1 py-2 px-3 rounded-lg font-bold text-xs cursor-pointer flex justify-center items-center gap-1.5 transition-opacity"
                  >
                    <FileText size={15} /> VER / EDITAR
                  </button>

                  <button
                    onClick={() => setDeleteTarget(item.id)}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'none' }}
                    title="Eliminar"
                    className="p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex justify-center items-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="col-span-full p-12 text-center rounded-2xl border-2 border-dashed border-[var(--color-border)]"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <Accessibility size={48} className="mx-auto mb-4 text-slate-400 opacity-50" />
            <h3 className="m-0 text-base font-extrabold text-[var(--color-text)]">No hay estudios ergonómicos registrados</h3>
            <p className="text-[var(--color-text-muted)] text-sm max-w-sm mx-auto mt-1 mb-4">
              Comenzá realizando el relevamiento inicial de factores de riesgo según la Res. SRT 886/15.
            </p>
            <button
              onClick={() => navigate('/ergonomics-form')}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-colors"
            >
              Nuevo Estudio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}