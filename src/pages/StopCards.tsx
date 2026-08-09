import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, AlertTriangle, CheckCircle2, XCircle, QrCode, FileText, 
  Trash2, Plus, MapPin, Filter, ShieldCheck, Download, Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ConfirmModal from '../components/ConfirmModal';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️"
    />
  );
}

const typeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'Condición Insegura': { label: 'Condición Insegura', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Acto Inseguro': { label: 'Acto Inseguro', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3' },
  'Casi Accidente': { label: 'Casi Accidente', color: '#b91c1c', bg: '#fff1f2', border: '#fecdd3' },
  'Acto Seguro': { label: 'Acto Seguro', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
};

export default function StopCards(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Historial Tarjetas STOP');
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();

  const [cards, setCards] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareCard, setShareCard] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const history = JSON.parse(localStorage.getItem('stop_cards_history') || '[]');
    setCards(history);
  }, [syncPulse]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = cards.filter((c) => c.id !== deleteTarget);
    localStorage.setItem('stop_cards_history', JSON.stringify(updated));
    syncCollection('stop_cards_history', updated);
    setCards(updated);
    setDeleteTarget(null);
    toast.success('Tarjeta STOP eliminada');
  };

  // Resumen Estadístico (KPIs)
  const stats = useMemo(() => {
    let total = cards.length;
    let condicionInsegura = 0;
    let actoInseguro = 0;
    let casiAccidente = 0;
    let actoSeguro = 0;

    cards.forEach(c => {
      if (c.type === 'Condición Insegura') condicionInsegura++;
      else if (c.type === 'Acto Inseguro') actoInseguro++;
      else if (c.type === 'Casi Accidente') casiAccidente++;
      else if (c.type === 'Acto Seguro') actoSeguro++;
    });

    return { total, condicionInsegura, actoInseguro, casiAccidente, actoSeguro };
  }, [cards]);

  const getTypeBadge = (type: string) => {
    const cfg = typeConfig[type] || { label: type, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    return (
      <span style={{ 
        backgroundColor: cfg.bg, 
        color: cfg.color, 
        border: `1px solid ${cfg.border}`, 
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontWeight: '900', 
        fontSize: '11px', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px' 
      }}>
        {type === 'Acto Seguro' ? <CheckCircle2 size={13} /> : type === 'Condición Insegura' ? <AlertTriangle size={13} /> : <XCircle size={13} />}
        {type}
      </span>
    );
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'date',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={14} className="text-slate-500" />
          {item.date ? new Date(item.date).toLocaleDateString('es-AR') : '-'} {item.time ? `• ${item.time}` : ''}
        </span>
      )
    },
    {
      header: 'Tipo Observación',
      accessor: 'type',
      sortable: true,
      render: (item: any) => getTypeBadge(item.type)
    },
    {
      header: 'Descripción / Hallazgo',
      accessor: 'description',
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '800', fontSize: '13px', display: 'block', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.description || 'Sin descripción'}
        </span>
      )
    },
    {
      header: 'Ubicación / Sector',
      accessor: 'location',
      render: (item: any) => (
        <span style={{ color: '#1e293b', fontWeight: '750', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} className="text-slate-400" />
          {item.location || 'N/D'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar estilo Aptitudes Médicas (Fondo Ámbar Sólido) */}
          <button 
            onClick={() => navigate('/stop-cards/new', { state: { editData: item } })} 
            title="Editar registro"
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>
          
          {/* Botón QR estilo Aptitudes Médicas (Fondo Azul Sólido) */}
          <button 
            onClick={() => requirePro(() => {
              const url = `${window.location.origin}/v/${currentUser?.uid}/stopcard/${item.id}?print=true`;
              setQrTarget({ text: url, title: `Tarjeta — ${item.type}` });
            })} 
            title="Ver Código QR"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          {/* Botón PDF / Compartir estilo Aptitudes Médicas (Fondo Esmeralda Sólido) */}
          <button 
            onClick={() => requirePro(() => setShareCard(item))} 
            title="Exportar PDF o Compartir"
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} /> PDF
          </button>

          {/* Botón Eliminar estilo Aptitudes Médicas (Fondo Rojo Sólido) */}
          <button 
            onClick={() => setDeleteTarget(item.id)} 
            title="Eliminar registro"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  const filteredCards = cards.filter((c) => {
    const desc = String(c?.description || '').toLowerCase();
    const loc = String(c?.location || '').toLowerCase();
    const typeStr = String(c?.type || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase();

    const matchesSearch = desc.includes(term) || loc.includes(term) || typeStr.includes(term);
    if (!matchesSearch) return false;

    if (typeFilter !== 'all' && c.type !== typeFilter) return false;

    return true;
  });

  const handleExportCSV = () => {
    const rows = filteredCards.map(c => ({
      'Fecha': c.date || '',
      'Hora': c.time || '',
      'Tipo Observación': c.type || '',
      'Ubicación': c.location || '',
      'Descripción / Hallazgo': c.description || '',
      'Acción Tomada': c.action || '',
      'Reportado Por': c.reportedBy || ''
    }));
    downloadCSV(rows, `Tarjetas_STOP_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Tarjetas STOP exportadas');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
        
        <ShareModal 
          open={!!shareCard} 
          onClose={() => setShareCard(null)} 
          title={`Tarjeta STOP - ${shareCard?.type || ''}`} 
          text={shareCard ? `🚨 Tarjeta STOP\n🛑 Tipo: ${shareCard.type}\n📍 Ubicación: ${shareCard.location}\n📅 Fecha: ${new Date(shareCard.date).toLocaleDateString('es-AR')} ${shareCard.time || ''}\n\n📝 Hallazgo:\n${shareCard.description}` : ''} 
          elementIdToPrint="stop-card-pdf-content" 
        />
        
        <div id="stop-card-pdf-container" style={{ zIndex: -9999 }} className="fixed left-0 top-0 opacity-0 pointer-events-none">
          {shareCard && <StopCardPdfGenerator card={shareCard} />}
        </div>

        <PremiumHeader
          title="Tarjetas STOP"
          subtitle="Observaciones de seguridad, condición insegura y actos subestándar"
          icon={<AlertTriangle size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        />

        {/* Tarjetas de Resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div 
            onClick={() => setTypeFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'all' 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Registros</span>
              <ShieldCheck size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          </div>

          <div 
            onClick={() => setTypeFilter('Condición Insegura')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'Condición Insegura' 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Condición Insegura</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.condicionInsegura}</div>
          </div>

          <div 
            onClick={() => setTypeFilter('Acto Inseguro')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'Acto Inseguro' 
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-red-400'
            }`}>
            <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Acto Inseguro</span>
              <XCircle size={18} />
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.actoInseguro}</div>
          </div>

          <div 
            onClick={() => setTypeFilter('Casi Accidente')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'Casi Accidente' 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Casi Accidente</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.casiAccidente}</div>
          </div>

          <div 
            onClick={() => setTypeFilter('Acto Seguro')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              typeFilter === 'Acto Seguro' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Acto Seguro</span>
              <CheckCircle2 size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.actoSeguro}</div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los registros', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'Condición Insegura', label: 'Condición Insegura', bg: '#d97706', activeBg: '#b45309' },
              { id: 'Acto Inseguro', label: 'Acto Inseguro', bg: '#dc2626', activeBg: '#991b1b' },
              { id: 'Casi Accidente', label: 'Casi Accidente', bg: '#e11d48', activeBg: '#be123c' },
              { id: 'Acto Seguro', label: 'Acto Seguro', bg: '#16a34a', activeBg: '#15803d' }
            ].map((tab) => {
              const isSelected = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
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
              onClick={handleExportCSV}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
              <Download size={16} /> Exportar Excel / CSV
            </button>

            <button
              onClick={() => navigate('/stop-cards/new')}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nueva Tarjeta STOP
            </button>
          </div>
        </div>

        {/* Tabla de Registros Estilo Aptitudes Médicas */}
        <DataTable
          data={filteredCards}
          columns={columns}
          searchPlaceholder="Buscar por descripción, ubicación o tipo..."
          emptyMessage="No hay tarjetas STOP registradas en esta vista."
          emptyIcon={<AlertTriangle size={48} className="text-amber-500" />}
        />

        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
      </div>
    </AnimatedPage>
  );
}