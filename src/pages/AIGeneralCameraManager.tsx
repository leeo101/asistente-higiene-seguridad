import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Camera, Search, Download, FileSpreadsheet,
  FileText, Share2, QrCode, Trash2, Calendar, Building2,
  AlertTriangle, CheckCircle2, BarChart2, Eye, ShieldCheck,
  Plus, Layers, Info
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { usePaywall } from '../hooks/usePaywall';

export default function AIGeneralCameraManager(): React.ReactElement | null {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'risks' | 'clean'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<{ text: string; title: string } | null>(null);
  const [shareItem, setShareItem] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  useEffect(() => {
    if (loading || !isPro) return;
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('ai_camera_history');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const valid = parsed.filter((item: any) => {
        if (!item || !item.id) return false;
        if (!item.date) return false;
        if (item.type !== 'general_risks') return false;
        return true;
      });
      setHistory(valid);
    } catch {
      setHistory([]);
    }
  }, [syncPulse, loading, isPro]);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = history.length;
    const hasRisks = history.filter((i: any) => (i.findingsCount || 0) > 0).length;
    const clean = total - hasRisks;
    const compliance = total > 0 ? Math.round((clean / total) * 100) : 100;

    return { total, clean, hasRisks, compliance };
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((item: any) => {
      if (filterStatus === 'risks' && (item.findingsCount || 0) === 0) return false;
      if (filterStatus === 'clean' && (item.findingsCount || 0) > 0) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.company?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, filterStatus, searchTerm]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const raw = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
    const updated = raw.filter((item: any) => item.id !== deleteTarget);

    localStorage.setItem('ai_camera_history', JSON.stringify(updated));
    localStorage.removeItem(`ai_report_full_${deleteTarget}`);
    syncCollection('ai_camera_history', updated);

    setHistory(history.filter((item: any) => item.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success("Análisis de riesgos eliminado");
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No hay registros de riesgos para exportar.');
      return;
    }
    downloadCSV(filtered.map((i: any) => ({
      empresa: i.company,
      ubicacion: i.location,
      fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
      hallazgos: i.findingsCount || 0,
      nivelRiesgo: i.riskLevel || 'N/A'
    })), 'camara_riesgos_historial', {
      empresa: 'Empresa',
      ubicacion: 'Ubicación',
      fecha: 'Fecha',
      hallazgos: 'Hallazgos IA',
      nivelRiesgo: 'Nivel de Riesgo'
    });
    toast.success('CSV de Riesgos IA exportado');
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-bold">Cargando permisos...</div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Modales de soporte */}
        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

        <ShareModal
          isOpen={!!shareItem && !document.body.classList.contains('printing-isolated')}
          open={!!shareItem && !document.body.classList.contains('printing-isolated')}
          onClose={() => setShareItem(null)}
          title={`Análisis de Riesgos IA - ${shareItem?.company || ''}`}
          text={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
          rawMessage={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Riesgos_IA_${shareItem?.company || 'Sin_Nombre'}.pdf`}
        />

        {typeof document !== 'undefined' && createPortal(
          <div className="ats-pdf-offscreen">
            {shareItem && <AiReportPdfGenerator item={shareItem} />}
          </div>,
          document.body
        )}

        {/* Encabezado Premium Sobrio y Profesional */}
        <PremiumHeader
          title="Riesgos IA — Análisis de Entorno"
          subtitle="Detección computacional de condiciones inseguras, orden y limpieza y riesgos locativos"
          badge="ISO 31000 & Dec. 351/79"
          icon={<ShieldAlert size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Análisis</span>
              <Layers size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Escaneos de entorno</span>
          </div>

          <div
            onClick={() => setFilterStatus('clean')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'clean'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sin Riesgos</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.clean}</div>
            <span className="text-[11px] text-slate-500">Condiciones conformes</span>
          </div>

          <div
            onClick={() => setFilterStatus('risks')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'risks'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Con Hallazgos</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.hasRisks}</div>
            <span className="text-[11px] text-slate-500">Peligros detectados</span>
          </div>

          <div
            onClick={() => setFilterStatus('all')}
            className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-400"
          >
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento</span>
              <BarChart2 size={20} />
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.compliance}%</div>
            <span className="text-[11px] text-slate-500">Índice seguro global</span>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Botones estilo Aptitudes Médicas */}
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
                placeholder="Buscar por empresa o ubicación..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                title="Exportar historial de análisis a CSV"
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
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Nueva Detección */}
              <button
                type="button"
                onClick={() => navigate('/ai-general-camera')}
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
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <Camera size={14} />
                <span>Nueva Detección</span>
              </button>
            </div>
          </div>

          {/* Pastillas de filtro estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#0f172a' : '#ffffff',
                color: filterStatus === 'all' ? '#ffffff' : '#334155',
                border: filterStatus === 'all' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Todos ({metrics.total})</span>
            </button>

            <button
              onClick={() => setFilterStatus('clean')}
              style={{
                backgroundColor: filterStatus === 'clean' ? '#059669' : '#ffffff',
                color: filterStatus === 'clean' ? '#ffffff' : '#334155',
                border: filterStatus === 'clean' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Sin Riesgos ({metrics.clean})</span>
            </button>

            <button
              onClick={() => setFilterStatus('risks')}
              style={{
                backgroundColor: filterStatus === 'risks' ? '#d97706' : '#ffffff',
                color: filterStatus === 'risks' ? '#ffffff' : '#334155',
                border: filterStatus === 'risks' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Con Hallazgos ({metrics.hasRisks})</span>
            </button>
          </div>
        </div>

        {/* Listado de Tarjetas */}
        {filtered.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <EmptyStateIllustrated
              title="No hay análisis de riesgos en entorno"
              description="Apunta la cámara a tu área de trabajo para detectar en tiempo real cables sueltos, obstrucciones, falta de orden y condiciones peligrosas."
              actionLabel="Nueva Detección IA"
              onAction={() => navigate('/ai-general-camera')}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item: any) => {
              const hasFindings = (item.findingsCount || 0) > 0;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          <ShieldAlert size={20} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[180px]">
                            {item.company || 'Empresa Local'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {item.location || 'Área General'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        hasFindings
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {hasFindings ? `${item.findingsCount} HALLAZGOS` : 'SEGURO'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span>Fecha: {new Date(item.date).toLocaleDateString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">Sector: {item.location || 'Planta Principal'}</span>
                      </div>
                      {item.riskLevel && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                          <span>Nivel de Riesgo: <strong>{item.riskLevel.toUpperCase()}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1.5">
                    {/* Botón Ver Reporte */}
                    <button
                      type="button"
                      onClick={() => {
                        const fullReportKey = `ai_report_full_${item.id}`;
                        const savedFull = localStorage.getItem(fullReportKey);
                        const reportToLoad = { ...item, ...(savedFull ? JSON.parse(savedFull) : {}) };
                        localStorage.setItem('current_ai_inspection', JSON.stringify(reportToLoad));
                        navigate('/ai-report');
                      }}
                      title="Ver Reporte Completo"
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset'
                      }}
                    >
                      <Eye size={12} />
                      <span>Ver</span>
                    </button>

                    {/* Botón Compartir */}
                    <button
                      type="button"
                      onClick={() => {
                        const fullReportKey = `ai_report_full_${item.id}`;
                        const savedFull = localStorage.getItem(fullReportKey);
                        const reportToLoad = { ...item, ...(savedFull ? JSON.parse(savedFull) : {}) };
                        setShareItem(reportToLoad);
                      }}
                      title="Compartir Informe"
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset'
                      }}
                    >
                      <Share2 size={12} />
                      <span>Compartir</span>
                    </button>

                    {/* Botón QR */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                        setQrTarget({ text: url, title: `Análisis de Entorno — ${item.company || 'IA'}` });
                      }}
                      title="Código QR"
                      style={{
                        backgroundColor: '#475569',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset'
                      }}
                    >
                      <QrCode size={12} />
                      <span>QR</span>
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item.id)}
                      title="Eliminar Registro"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Eliminar Análisis de Riesgo"
          message="¿Estás seguro de que deseas eliminar este análisis de riesgo de entorno? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </AnimatedPage>
  );
}
