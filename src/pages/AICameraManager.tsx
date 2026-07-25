import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, ShieldCheck, TriangleAlert, Share2, FileText, QrCode, Download, BarChart2, Sparkles } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción eliminará el informe de inspección EPP permanentemente."
      iconEmoji="🗑️" 
    />
  );
}

export default function AICameraManager(): React.ReactElement | null {
  const { isPro, loading } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);

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
  }, [syncPulse]);

  const confirmDelete = () => {
    const raw = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
    const updated = raw.filter((item: any) => item.id !== deleteTarget);

    localStorage.setItem('ai_camera_history', JSON.stringify(updated));
    localStorage.removeItem(`ai_report_full_${deleteTarget}`);
    syncCollection('ai_camera_history', updated);

    setHistory(history.filter((item) => item.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success("Inspección eliminada correctamente");
  };

  const filtered = history.filter((item) =>
    item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = history.length;
  const eppOk = history.filter((i) => i.ppeComplete).length;
  const eppFail = history.filter((i) => i.ppeComplete === false).length;
  const compliance = total > 0 ? Math.round(eppOk / Math.max(eppOk + eppFail, 1) * 100) : 0;

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

      const weekItems = history.filter((item) => {
        const d = new Date(item.date);
        return d >= start && d <= end;
      });

      const wTotal = weekItems.length;
      const wOk = weekItems.filter((item) => item.ppeComplete).length;
      const wFail = weekItems.filter((item) => item.ppeComplete === false).length;
      const wComp = wTotal > 0 ? Math.round(wOk / Math.max(wOk + wFail, 1) * 100) : 0;

      stats.push({ label: i === 0 ? 'Esta sem.' : `Hace ${i} sem.`, value: wComp, count: wTotal });
    }
    return stats;
  };
  const weeklyStats = getWeeklyStats();

  const handleExportCSV = () => {
    downloadCSV(filtered.map((i) => ({
      empresa: i.company, 
      ubicacion: i.location,
      fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
      resultado: i.ppeComplete ? 'EPP OK' : 'Falta EPP'
    })), 'camara_epp_historial', {
      empresa: 'Empresa', ubicacion: 'Ubicación', fecha: 'Fecha', resultado: 'Resultado'
    });
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
    <div className="container max-w-5xl mx-auto pt-8 md:pt-12 pb-24 px-4">
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
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

      {/* Header Premium - Color Dorado Solicitado */}
      <div className="no-print mb-8">
        <PremiumHeader
          title="Cámara IA (EPP)"
          subtitle="Detección y cumplimiento de EPP en tiempo real"
          icon={<Camera size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        />
        
        <div className="flex justify-between items-center flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            <Sparkles size={20} style={{ color: '#f59e0b' }} />
            <span>Red Neuronal de Visión Artificial EHS</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              to="/ai-camera"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 8px 25px -5px rgba(16, 185, 129, 0.5)'
              }}
              className="flex items-center gap-2.5 py-3.5 px-6 rounded-2xl font-black cursor-pointer transition-all hover:scale-105 active:scale-95 text-sm no-underline"
            >
              <Camera size={20} className="text-white" />
              NUEVA DETECCIÓN EPP
            </Link>

            {history.length > 0 && (
              <button 
                type="button" 
                onClick={handleExportCSV} 
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 8px 20px -5px rgba(99, 102, 241, 0.4)'
                }}
                className="flex items-center gap-2 py-3.5 px-5 rounded-2xl font-black text-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Download size={18} /> EXPORTAR CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {total > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div 
              style={{ 
                background: 'rgba(245, 158, 11, 0.08)', 
                border: '1px solid rgba(245, 158, 11, 0.25)' 
              }} 
              className="p-5 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div 
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }} 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              >
                <Camera size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Escaneos EPP</span>
                <span className="text-2xl font-black" style={{ color: '#f59e0b' }}>{total} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>inspecciones</span></span>
              </div>
            </div>

            <div 
              style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.25)' 
              }} 
              className="p-5 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div 
                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              >
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Conformidad</span>
                <span className="text-2xl font-black" style={{ color: '#10b981' }}>{compliance}% <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>cumplido</span></span>
              </div>
            </div>

            <div 
              style={{ 
                background: eppFail > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                border: `1px solid ${eppFail > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}` 
              }} 
              className="p-5 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div 
                style={{ 
                  background: eppFail > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                  color: eppFail > 0 ? '#ef4444' : '#10b981' 
                }} 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              >
                <TriangleAlert size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Sin EPP / Desvíos</span>
                <span className="text-2xl font-black" style={{ color: eppFail > 0 ? '#ef4444' : '#10b981' }}>{eppFail} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>alertas</span></span>
              </div>
            </div>
          </div>

          {/* Weekly Trend Chart Card */}
          <div 
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} 
            className="p-6 rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <BarChart2 size={18} style={{ color: '#f59e0b' }} />
                Tendencia de Cumplimiento EPP (últimas 6 semanas)
              </h3>
            </div>
            <div className="flex items-end justify-between h-28 gap-2 px-2 pt-2">
              {weeklyStats.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-20 flex items-end">
                    <div className="absolute w-full h-full bg-slate-200 dark:bg-slate-700/50 rounded-lg opacity-60" />
                    <div 
                      style={{
                        height: `${Math.max(s.value, 10)}%`,
                        background: s.value >= 80 ? 'linear-gradient(to top, #10b981, #34d399)' : s.value >= 50 ? 'linear-gradient(to top, #f59e0b, #fbbf24)' : 'linear-gradient(to top, #ef4444, #f87171)'
                      }} 
                      title={`${s.value}% compliance (${s.count} insp)`} 
                      className="w-full rounded-lg z-10 transition-all duration-700 shadow-sm" 
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input de Búsqueda Centrado Matemáticamente */}
      <div 
        style={{ position: 'relative', width: '100%' }}
        className="mb-6 flex items-center"
      >
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: 0, 
              bottom: 0, 
              marginTop: 'auto', 
              marginBottom: 'auto', 
              color: '#f59e0b', 
              display: 'block' 
            }} 
            className="pointer-events-none z-10" 
          />
        <input
          type="text"
          placeholder="Buscar inspecciones por empresa o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: '50px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            paddingLeft: '3.2rem',
            paddingRight: '1rem',
            borderRadius: '16px',
            fontSize: '0.9rem',
            fontWeight: 700,
            outline: 'none',
            boxSizing: 'border-box'
          }}
          className="focus:ring-2 focus:ring-amber-500 shadow-xs"
        />
      </div>

      {/* History Items List */}
      <div className="flex flex-col gap-4">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div 
              key={item.id} 
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div 
                    style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Camera size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="m-0 text-base font-extrabold truncate" style={{ color: 'var(--color-text)' }}>
                      {item.company || 'Empresa sin nombre'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs mt-1 font-medium flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} style={{ color: '#f59e0b' }} /> 
                        {new Date(item.date).toLocaleDateString('es-AR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 size={14} style={{ color: '#6366f1' }} /> 
                        {item.location || 'Planta Principal'}
                      </span>
                    </div>
                  </div>
                </div>

                <div 
                  style={{
                    background: item.ppeComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: item.ppeComplete ? '#10b981' : '#ef4444',
                    border: `1px solid ${item.ppeComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shrink-0"
                >
                  {item.ppeComplete ? <ShieldCheck size={16} /> : <TriangleAlert size={16} />}
                  <span>{item.ppeComplete ? 'EPP OK' : 'FALTA EPP'}</span>
                </div>
              </div>

              {/* Botones de Acción con Colores Forzados */}
              <div 
                style={{ borderTop: '1px solid var(--color-border)' }}
                className="flex items-center gap-2.5 pt-4 flex-wrap"
              >
                <button
                  onClick={() => {
                    const fullReportKey = `ai_report_full_${item.id}`;
                    const savedFull = localStorage.getItem(fullReportKey);
                    const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                    localStorage.setItem('current_ai_inspection', JSON.stringify(reportToLoad));
                    navigate('/ai-report');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)'
                  }}
                  className="flex-2 py-3 px-4 rounded-xl text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Ver Reporte Completo
                </button>

                <button
                  onClick={() => {
                    const fullReportKey = `ai_report_full_${item.id}`;
                    const savedFull = localStorage.getItem(fullReportKey);
                    const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                    setShareItem(reportToLoad);
                  }}
                  title="Compartir Reporte"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                  }}
                  className="flex-1 py-3 px-3 rounded-xl text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Share2 size={15} /> Compartir
                </button>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                    setQrTarget({ text: url, title: `Inspección EPP — ${item.company || 'IA'}` });
                  }}
                  title="Generar Código QR"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)'
                  }}
                  className="py-3 px-3.5 rounded-xl text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  <QrCode size={16} />
                </button>

                <button
                  onClick={() => setDeleteTarget(item.id)}
                  title="Eliminar Inspección"
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                  className="py-3 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div 
            style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}
            className="text-center py-16 px-4 rounded-3xl shadow-sm"
          >
            <Camera size={56} style={{ color: '#f59e0b', opacity: 0.4 }} className="mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-black mb-1" style={{ color: 'var(--color-text)' }}>No hay inspecciones EPP registradas</h3>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Haz clic en 'NUEVA DETECCIÓN EPP' para activar la Cámara IA.</p>
          </div>
        )}
      </div>
    </div>
  );
}