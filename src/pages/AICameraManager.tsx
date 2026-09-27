import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Search, Download, FileSpreadsheet,
  FileText, Share2, QrCode, Trash2, Calendar, Building2,
  AlertTriangle, CheckCircle2, BarChart2, Eye, ShieldCheck,
  Plus, Layers, ShieldAlert, Sparkles, TriangleAlert
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

export default function AICameraManager(): React.ReactElement | null {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'fail'>('all');
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
        if (item.type !== 'ppe_check' && item.ppeComplete === undefined) return false;
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
    const eppOk = history.filter((i: any) => i.ppeComplete).length;
    const eppFail = history.filter((i: any) => i.ppeComplete === false).length;
    const compliance = total > 0 ? Math.round((eppOk / Math.max(eppOk + eppFail, 1)) * 100) : 0;

    return { total, eppOk, eppFail, compliance };
  }, [history]);

  const getWeeklyStats = () => {
    const stats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7 + 6));
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);

      const weekItems = history.filter((item: any) => {
        const d = new Date(item.date);
        return d >= start && d <= end;
      });

      const wTotal = weekItems.length;
      const wOk = weekItems.filter((item: any) => item.ppeComplete).length;
      const wFail = weekItems.filter((item: any) => item.ppeComplete === false).length;
      const wComp = wTotal > 0 ? Math.round((wOk / Math.max(wOk + wFail, 1)) * 100) : 0;

      stats.push({ label: i === 0 ? 'Esta sem.' : `Hace ${i} sem.`, value: wComp, count: wTotal });
    }
    return stats;
  };
  const weeklyStats = getWeeklyStats();

  const filtered = useMemo(() => {
    return history.filter((item: any) => {
      if (filterStatus === 'ok' && !item.ppeComplete) return false;
      if (filterStatus === 'fail' && item.ppeComplete) return false;

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
    toast.success("Inspección de EPP eliminada");
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No hay inspecciones para exportar.');
      return;
    }
    downloadCSV(filtered.map((i: any) => ({
      empresa: i.company,
      ubicacion: i.location,
      fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
      resultado: i.ppeComplete ? 'EPP OK' : 'Falta EPP'
    })), 'camara_epp_historial', {
      empresa: 'Empresa',
      ubicacion: 'Ubicación',
      fecha: 'Fecha',
      resultado: 'Resultado'
    });
    toast.success('CSV de Inspecciones EPP exportado');
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
          title={`Inspección EPP IA - ${shareItem?.company || ''}`}
          text={shareItem ? `📸 Inspección de EPP con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n🛡️ Resultado: ${shareItem.ppeComplete ? '✅ EPP OK' : '⚠️ Falta EPP'}` : ''}
          rawMessage={shareItem ? `📸 Inspección de EPP con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n🛡️ Resultado: ${shareItem.ppeComplete ? '✅ EPP OK' : '⚠️ Falta EPP'}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Inspeccion_EPP_${shareItem?.company || 'Sin_Nombre'}.pdf`}
        />

        {typeof document !== 'undefined' && createPortal(
          <div className="ats-pdf-offscreen">
            {shareItem && <AiReportPdfGenerator item={shareItem} />}
          </div>,
          document.body
        )}

        {/* Encabezado Premium Sobrio y Profesional */}
        <PremiumHeader
          title="Cámara IA — Detección de EPP"
          subtitle="Verificación automatizada en tiempo real de cascos y elementos de protección personal"
          badge="ISO 45001 & Dec. 351/79"
          icon={<Camera size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)"
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
              <span className="text-xs font-bold uppercase tracking-wider">Total Escaneos</span>
              <Layers size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Inspecciones EPP</span>
          </div>

          <div
            onClick={() => setFilterStatus('ok')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">EPP Conforme</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.eppOk}</div>
            <span className="text-[11px] text-slate-500">Con casco verificado</span>
          </div>

          <div
            onClick={() => setFilterStatus('fail')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'fail'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sin EPP / Desvíos</span>
              <TriangleAlert size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.eppFail}</div>
            <span className="text-[11px] text-slate-500">Alertas de protección</span>
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
            <span className="text-[11px] text-slate-500">Tasa de uso EPP</span>
          </div>
        </div>

        {/* Gráfico Semanal Limpio y Sobrio */}
        {metrics.total > 0 && (
          <div className="mt-6 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="m-0 text-xs font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <BarChart2 size={16} className="text-blue-500" />
                Tendencia de Cumplimiento EPP (últimas 6 semanas)
              </h3>
            </div>
            <div className="flex items-end justify-between h-24 gap-3 px-2 pt-2">
              {weeklyStats.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full h-16 flex items-end">
                    <div className="absolute w-full h-full bg-slate-100 dark:bg-slate-700/40 rounded-lg" />
                    <div
                      style={{
                        height: `${Math.max(s.value, 8)}%`,
                        backgroundColor: s.value >= 80 ? '#059669' : s.value >= 50 ? '#d97706' : '#dc2626'
                      }}
                      title={`${s.value}% cumplimiento (${s.count} inspecciones)`}
                      className="w-full rounded-lg z-10 transition-all duration-500 shadow-sm"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                title="Exportar historial de inspecciones a CSV"
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
                onClick={() => navigate('/ai-camera')}
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
                <span>Nueva Detección EPP</span>
              </button>
            </div>
          </div>

          {/* Pastillas de filtro estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#0284c7' : '#ffffff',
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
              onClick={() => setFilterStatus('ok')}
              style={{
                backgroundColor: filterStatus === 'ok' ? '#059669' : '#ffffff',
                color: filterStatus === 'ok' ? '#ffffff' : '#334155',
                border: filterStatus === 'ok' ? 'none' : '1px solid #cbd5e1',
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
              <span>EPP Conforme ({metrics.eppOk})</span>
            </button>

            <button
              onClick={() => setFilterStatus('fail')}
              style={{
                backgroundColor: filterStatus === 'fail' ? '#dc2626' : '#ffffff',
                color: filterStatus === 'fail' ? '#ffffff' : '#334155',
                border: filterStatus === 'fail' ? 'none' : '1px solid #cbd5e1',
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
              <span>Falta EPP ({metrics.eppFail})</span>
            </button>
          </div>
        </div>

        {/* Listado de Tarjetas */}
        {filtered.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <EmptyStateIllustrated
              title="No hay inspecciones EPP registradas"
              description="Apunta la cámara hacia los operarios para auditar el uso reglamentario de casco y elementos de protección personal con visión artificial."
              actionLabel="Nueva Detección EPP"
              onAction={() => navigate('/ai-camera')}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item: any) => {
              const isOk = !!item.ppeComplete;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          <Camera size={20} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[180px]">
                            {item.company || 'Empresa Local'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {item.location || 'Planta Principal'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOk
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {isOk ? 'EPP OK' : 'FALTA EPP'}
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
                      <div className="flex items-center gap-2">
                        {isOk ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <TriangleAlert size={14} className="text-rose-600 shrink-0" />
                        )}
                        <span>Resultado: <strong>{isOk ? 'Casco y protección conformes' : 'Desvío en protección personal'}</strong></span>
                      </div>
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
                        setQrTarget({ text: url, title: `Inspección EPP — ${item.company || 'IA'}` });
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
          title="Eliminar Inspección EPP"
          message="¿Estás seguro de que deseas eliminar este registro de inspección EPP? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </AnimatedPage>
  );
}
