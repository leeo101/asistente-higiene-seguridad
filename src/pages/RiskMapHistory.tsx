import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon, Plus, Search, Eye, Edit2, Trash2, CheckCircle2, XCircle, Calendar,
  Activity, Target, Share2, QrCode, FileText, Building, Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import { usePaywall } from '../hooks/usePaywall';

export default function RiskMapHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Historial de Mapas de Riesgo');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();

  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'risk' | 'evacuation'>('all');
  const [selectedMap, setSelectedMap] = useState<any>(null);
  const [qrModal, setQrModal] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const saved = localStorage.getItem('risk_map_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.sort((a: any, b: any) => new Date(b.date || b.createdAt || Date.now()).getTime() - new Date(a.date || a.createdAt || Date.now()).getTime()));
        }
      }
    } catch (e) {
      console.error('[RISK MAP HISTORY] Error reading localStorage:', e);
      setHistory([]);
    }
  }, [syncing]);

  const saveHistory = (updated: any[]) => {
    setHistory(updated);
    try {
      localStorage.setItem('risk_map_history', JSON.stringify(updated));
      syncCollection('risk_map_history', updated);
    } catch (e) {
      console.error('[RISK MAP HISTORY] Error saving:', e);
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = history.filter((item) => item.id !== confirmModal.payload);
      saveHistory(updated);
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const metrics = useMemo(() => {
    const total = history.length;
    const sectors = new Set(history.map((h) => h.sector || 'General')).size;
    const elements = history.reduce((acc, h) => acc + (Array.isArray(h.elements) ? h.elements.length : 0), 0);
    const evacuation = history.filter((h) => 
      Array.isArray(h.elements) && h.elements.some((el: any) => el.type === 'arrow' || (el.type === 'icon' && el.iconId === 'YOU_ARE_HERE'))
    ).length;

    return { total, sectors, elements, evacuation };
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (!item) return false;
      const searchStr = `${item.empresa || ''} ${item.sector || ''} ${item.id || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      const isEvac = Array.isArray(item.elements) && item.elements.some((el: any) => el.type === 'arrow' || (el.type === 'icon' && el.iconId === 'YOU_ARE_HERE'));

      let matchesType = true;
      if (filterType === 'risk') matchesType = !isEvac;
      else if (filterType === 'evacuation') matchesType = isEvac;

      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, filterType]);

  if (selectedMap) {
    return <RiskMapPdfGenerator data={selectedMap} onBack={() => setSelectedMap(null)} onShare={() => setShareItem(selectedMap)} />;
  }

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Header idéntico a Aptitudes Médicas */}
        <PremiumHeader
          title="Historial de Mapas de Riesgos"
          subtitle="Croquis, planos de evacuación e identificación de peligros ISO 7010 / ISO 45001"
          icon={<MapIcon size={36} color="#ffffff" />}
        />

        {/* Top Summary Cards (KPIs) idéntico a Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Mapas</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Planos guardados</span>
          </div>

          <div
            onClick={() => setFilterType('risk')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'risk'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sectores Mapeados</span>
              <Building size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.sectors}</div>
            <span className="text-[11px] text-slate-500">Áreas diferenciadas</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Elementos ISO</span>
              <Target size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.elements}</div>
            <span className="text-[11px] text-slate-500">Señaléticas colocadas</span>
          </div>

          <div
            onClick={() => setFilterType('evacuation')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'evacuation'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Evacuación</span>
              <Layers size={20} />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.evacuation}</div>
            <span className="text-[11px] text-slate-500">Planos de emergencia</span>
          </div>
        </div>

        {/* Toolbar & Search Bar Section */}
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
                placeholder="Buscar por empresa o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Botón Nuevo Mapa SUPER COMPACTO INLINE idéntico a Aptitudes Médicas */}
            <button
              onClick={() => requirePro(() => navigate('/risk-maps'))}
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
              <span>Nuevo Mapa</span>
            </button>
          </div>

          {/* Filter Tabs idénticos a Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              style={{
                backgroundColor: filterType === 'all' ? '#2563eb' : '#ffffff',
                color: filterType === 'all' ? '#ffffff' : '#334155',
                border: filterType === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Todos ({metrics.total})
            </button>
            <button
              onClick={() => setFilterType('risk')}
              style={{
                backgroundColor: filterType === 'risk' ? '#059669' : '#ffffff',
                color: filterType === 'risk' ? '#ffffff' : '#334155',
                border: filterType === 'risk' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Mapas de Riesgo ({metrics.total - metrics.evacuation})
            </button>
            <button
              onClick={() => setFilterType('evacuation')}
              style={{
                backgroundColor: filterType === 'evacuation' ? '#8b5cf6' : '#ffffff',
                color: filterType === 'evacuation' ? '#ffffff' : '#334155',
                border: filterType === 'evacuation' ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Planos Evacuación ({metrics.evacuation})
            </button>
          </div>

          {/* List con Tarjetas & Botones Sólidos de Colores */}
          <div className="flex flex-col gap-3">
            {filteredHistory.length === 0 ? (
              <EmptyStateIllustrated
                title="Sin Mapas Registrados"
                description="Creá croquis, planos de evacuación e identificación de riesgos según ISO 7010 / ISO 45001."
                icon={<MapIcon />}
              />
            ) : (
              filteredHistory.map((map) => (
                <RiskMapCard
                  key={map.id || Math.random()}
                  mapItem={map}
                  onView={() => setSelectedMap(map)}
                  onEdit={() => navigate('/risk-maps', { state: { editData: map } })}
                  onQR={() => setQrModal(map)}
                  onShare={() => setShareItem(map)}
                  onDelete={() => handleDelete(map.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal QR de Validación idéntico a Aptitudes Médicas */}
        {qrModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-200 dark:border-slate-800 space-y-4">
              <button
                onClick={() => setQrModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer"
              >
                <XCircle size={24} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <QrCode size={28} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Mapa de Riesgos Verificado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                  {qrModal.empresa || 'Empresa'} ({qrModal.sector || 'Sector General'})
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/v/${currentUser?.uid || 'pub'}/riskmap/${qrModal.id}?print=true`} size={180} />
              </div>

              <p className="text-xs text-slate-400">
                Escaneá este código QR para validar y auditar el mapa de riesgos ISO en tiempo real.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setQrModal(null)}
                  style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flex: 1 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Compartir / Impresión PDF */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Mapa de Riesgo - ${shareItem?.empresa || ''}`}
          text={shareItem ? `🗺️ Mapa de Riesgos ISO 7010\n🏢 Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n📅 Fecha: ${shareItem.fecha || new Date().toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `🗺️ Mapa de Riesgos ISO 7010\n🏢 Empresa: ${shareItem.empresa}\n📍 Sector: ${shareItem.sector}\n📅 Fecha: ${shareItem.fecha || new Date().toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Mapa_Riesgos_${shareItem?.empresa || 'Empresa'}.pdf`}
        />

        <div className="ats-pdf-offscreen">
          {shareItem && <RiskMapPdfGenerator data={shareItem} />}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar mapa de riesgos?"
          message="Esta acción borrará definitivamente el croquis seleccionado."
          iconEmoji="🗑️"
        />
      </div>
    </AnimatedPage>
  );
}

// Componente de Tarjeta con Botones Coloridos e Identidad Visual de Aptitudes Médicas
function RiskMapCard({ mapItem, onView, onEdit, onQR, onShare, onDelete }: any) {
  if (!mapItem) return null;
  const elementCount = Array.isArray(mapItem.elements) ? mapItem.elements.length : 0;
  const isEvac = Array.isArray(mapItem.elements) && mapItem.elements.some((el: any) => el.type === 'arrow' || (el.type === 'icon' && el.iconId === 'YOU_ARE_HERE'));

  const cardBorderColor = isEvac ? '#8b5cf6' : '#2563eb';
  const cardBadgeBg = isEvac ? '#f3e8ff' : '#eff6ff';
  const cardBadgeColor = isEvac ? '#7c3aed' : '#2563eb';

  return (
    <div
      className="card p-[1.25rem] flex flex-col md:flex-row md:items-center justify-between gap-[1rem] transition-all bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
      style={{ borderLeft: `4px solid ${cardBorderColor}` }}
    >
      {/* Icon & Details */}
      <div className="flex items-center gap-[1rem] flex-1 min-w-0">
        <div style={{ background: `${cardBorderColor}15`, border: `2px solid ${cardBorderColor}` }} className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center flex-shrink-0">
          <MapIcon size={24} color={cardBorderColor} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[0.5rem] mb-[0.35rem] flex-wrap">
            <h3 className="m-0 text-[1.1rem] font-[800] text-slate-900 dark:text-white truncate">{mapItem.empresa || 'Empresa Sin Nombre'}</h3>
            <span style={{ background: cardBadgeBg, color: cardBadgeColor }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {isEvac ? 'EVACUACIÓN' : 'MAPA DE RIESGO'}
            </span>
          </div>
          <div className="flex flex-wrap gap-[0.75rem] text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Building size={14} />
              Sector: {mapItem.sector || 'General'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {mapItem.fecha ? new Date(mapItem.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'Sin fecha'}
            </span>
            <span className="flex items-center gap-1">
              <Target size={14} />
              {elementCount} Señalética(s)
            </span>
          </div>
        </div>
      </div>

      {/* Botones Sólidos y Coloridos idénticos a Aptitudes Médicas */}
      <div className="flex items-center gap-[6px] flex-wrap">
        {/* Botón Editar con fondo Ámbar/Amarillo sólido */}
        <button
          onClick={onEdit}
          title="Editar Mapa"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}
        >
          <Edit2 size={12} /> Editar
        </button>

        {/* Botón Ver con fondo Azul sólido */}
        <button
          onClick={onView}
          title="Ver Plano y Generar PDF"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
        >
          <Eye size={12} /> Ver
        </button>

        {/* Botón QR con fondo Púrpura sólido */}
        <button
          onClick={onQR}
          title="Ver Credencial QR de Validación"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}
        >
          <QrCode size={12} /> QR
        </button>

        {/* Botón Compartir / PDF con fondo Verde sólido */}
        <button
          onClick={onShare}
          title="Compartir Informe PDF"
          style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
        >
          <Share2 size={12} /> Compartir
        </button>

        {/* Botón Eliminar con fondo Rojo sólido */}
        <button
          onClick={onDelete}
          title="Eliminar Registro"
          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}
        >
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    </div>
  );
}