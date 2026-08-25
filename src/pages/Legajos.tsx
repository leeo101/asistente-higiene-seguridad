import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, FileText, Download, Trash2, Edit, AlertCircle, Building2,
  Search, Filter, CheckCircle2, Clock, AlertTriangle, ArrowLeft, X, QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import LegajoPdf from '../components/LegajoPdf';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import QRModal from '../components/QRModal';

interface Legajo {
  id: string;
  companyName: string;
  cuit: string;
  date: string;
  updatedAt: number;
  empresa?: any;
  riesgos?: any;
  incendio?: any;
  epp?: any;
  ambiente?: any;
  firmas?: any;
}

const getCompletionPercent = (legajo: Legajo): number => {
  let filled = 0;
  let total = 0;
  const checkObj = (obj: any) => {
    if (!obj) return;
    Object.values(obj).forEach((v: any) => {
      if (typeof v === 'string') { total++; if (v.trim()) filled++; } else
      if (typeof v === 'boolean') { total++; if (v) filled++; }
    });
  };
  checkObj(legajo.empresa);
  checkObj(legajo.riesgos);
  checkObj(legajo.incendio);
  checkObj(legajo.epp);
  checkObj(legajo.ambiente);
  checkObj(legajo.firmas);
  return total === 0 ? 0 : Math.round((filled / total) * 100);
};

const getStatusBadge = (percent: number, legajo: Legajo) => {
  const amb = legajo.ambiente;
  let hasExpired = false;
  if (amb) {
    const now = new Date();
    const checkDate = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return diff > 1;
    };
    hasExpired = checkDate(amb.iluminacionFecha) || checkDate(amb.ruidoFecha) || checkDate(amb.puestaTierraFecha);
  }

  if (hasExpired) return { text: 'Vencido', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: AlertTriangle };
  if (percent === 100) return { text: 'Completo', color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 };
  if (percent >= 50) return { text: 'En Progreso', color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: Clock };
  return { text: 'Pendiente', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Clock };
};

export default function Legajos() {
  const [legajos, setLegajos] = useState<Legajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const isAdmin = currentUser?.email?.toLowerCase().trim() === 'enzorodriguez31@gmail.com';
  const hasAccess = isPro || isAdmin;
  const navigate = useNavigate();
  const [printingLegajo, setPrintingLegajo] = useState<Legajo | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const [qrTarget, setQrTarget] = useState<{ text: string; title: string } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleGeneratePDF = (e: React.MouseEvent, legajo: Legajo) => {
    e.stopPropagation();
    if (!hasAccess) {
      alert("La exportación a PDF requiere una suscripción PRO");
      navigate('/subscribe');
      return;
    }
    setPrintingLegajo(legajo);
    setTimeout(() => {
      const cleanup = () => {
        setPrintingLegajo(null);
        window.removeEventListener('afterprint', cleanup);
        window.removeEventListener('focus', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', cleanup);
      setTimeout(cleanup, 2000);
      window.print();
    }, 500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchLegajos();
  }, [currentUser]);

  const fetchLegajos = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'users', currentUser.uid, 'legajos'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Legajo[];
      setLegajos(data);
    } catch (error) {
      console.error("Error fetching legajos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = async () => {
    if (confirmModal.payload && currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'legajos', confirmModal.payload));
        setLegajos(legajos.filter((l) => l.id !== confirmModal.payload));
      } catch (error) {
        console.error("Error deleting legajo:", error);
        alert("Hubo un error al eliminar el legajo.");
      }
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredLegajos = legajos.filter((l) => {
    const matchesSearch = !searchTerm ||
      (l.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.cuit || '').includes(searchTerm);

    if (!matchesSearch) return false;
    if (!statusFilter) return true;

    const percent = getCompletionPercent(l);
    const status = getStatusBadge(percent, l);
    return status.text === statusFilter;
  });

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        
        {/* Hidden PDF Container */}
        {printingLegajo && (
          <div className="print-only fixed left-0 top-0 opacity-0 pointer-events-none">
            <div id="pdf-content">
              <LegajoPdf data={{ ...printingLegajo, professionalName: currentUser?.displayName || 'Profesional H&S' }} />
            </div>
          </div>
        )}

        {/* Header idéntico a Aptitudes Médicas */}
        <PremiumHeader
          title="Legajos Técnicos"
          subtitle="Decreto 351/79 — Ley 19.587 · ISO 45001"
          icon={<Building2 size={36} color="#ffffff" />}
        />

        {/* Top Summary Cards (KPIs) idéntico a Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Legajos</span>
              <Building2 size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{legajos.length}</div>
            <span className="text-[11px] text-slate-500">Registrados en sistema</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completos</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {legajos.filter((l) => getCompletionPercent(l) === 100).length}
            </div>
            <span className="text-[11px] text-slate-500">Auditables 100%</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Progreso</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {legajos.filter((l) => { const p = getCompletionPercent(l); return p > 0 && p < 100; }).length}
            </div>
            <span className="text-[11px] text-slate-500">Con datos parciales</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-slate-600 dark:text-slate-400">
              {legajos.filter((l) => getCompletionPercent(l) === 0).length}
            </div>
            <span className="text-[11px] text-slate-500">Sin comenzar</span>
          </div>
        </div>

        {/* Toolbar & Search Bar Section */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Input de Búsqueda Amplio */}
            <div className="relative flex-1 min-w-[240px] h-[38px]">
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
                placeholder="Buscar por empresa o CUIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Select Filtro de Estado Ajustado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-500 h-[38px] shrink-0 min-w-[160px]"
            >
              <option value="">Todos los estados</option>
              <option value="Completo">✅ Completo</option>
              <option value="En Progreso">🔶 En Progreso</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Vencido">🔴 Vencido</option>
            </select>

            {/* Botones de Acción Inline Compactos */}
            {hasAccess && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/legajos/nuevo')}
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
                  <span>Nuevo Legajo</span>
                </button>

                <button
                  onClick={() => setShowQRModal(true)}
                  style={{
                    backgroundColor: '#4f46e5',
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
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <QrCode size={14} />
                  <span>Portal QR</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Portal Trabajador QR */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-8 max-w-[380px] w-full text-center relative border border-slate-200/60 dark:border-slate-800/60 shadow-2xl space-y-4">
              <button 
                onClick={() => setShowQRModal(false)} 
                className="absolute top-4 right-4 p-2 rounded-full border-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <QrCode size={28} />
              </div>

              <div className="px-6">
                <h3 className="m-0 text-lg font-black text-slate-900 dark:text-white leading-tight break-words">
                  Portal del Trabajador
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                  Escaneá este código QR para acceder al legajo digital de aptitudes y capacitaciones.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-flex items-center justify-center shadow-sm border border-slate-200">
                <QRCodeSVG 
                  value={`${window.location.origin}/worker-portal`} 
                  size={170}
                  fgColor="#0f172a" 
                  bgColor="#ffffff"
                  includeMargin={true}
                />
              </div>

              <button 
                onClick={() => setShowQRModal(false)}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cerrar Portal
              </button>
            </div>
          </div>
        )}

        {!hasAccess && (
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4 items-start my-6">
            <AlertCircle size={24} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="m-0 mb-2 font-extrabold text-amber-800 dark:text-amber-400">Función Exclusiva PRO</h3>
              <p className="m-0 mb-4 text-sm text-amber-900 dark:text-amber-300">
                El módulo de Legajos Técnicos es una herramienta avanzada para profesionales. 
                Actualizá tu cuenta para crear, gestionar y exportar legajos en PDF.
              </p>
              <button
                onClick={() => navigate('/subscribe')}
                className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer text-sm transition-colors"
              >
                Mejorar a PRO
              </button>
            </div>
          </div>
        )}

        {/* Tarjetas de Legajos Guardados (MANTENIDAS EXACTAMENTE IGUAL COMO SE SOLICITÓ) */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredLegajos.length === 0 ? (
            <div className="text-center py-16 px-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
              <FileText size={56} className="text-slate-400 opacity-50 mx-auto mb-4" />
              <h3 className="font-extrabold mb-2">{searchTerm || statusFilter ? 'Sin resultados' : 'No hay legajos técnicos'}</h3>
              <p className="text-slate-500 dark:text-slate-400 m-0 mb-6 text-sm">
                {searchTerm || statusFilter ? 'Probá con otros filtros de búsqueda.' : 'Creá tu primer legajo para empezar a gestionar a tus clientes.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLegajos.map((legajo, idx) => {
                const percent = getCompletionPercent(legajo);
                const status = getStatusBadge(percent, legajo);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={legajo.id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 relative overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
                    onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
                  >
                    {/* Top gradient bar */}
                    <div style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}88)` }} className="absolute top-0 left-0 right-0 h-[4px]" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="m-0 font-extrabold text-lg truncate text-slate-900 dark:text-white">
                          {legajo.companyName || 'Empresa Sin Nombre'}
                        </h3>
                        <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                          CUIT: {legajo.cuit || 'Sin CUIT'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-extrabold shrink-0 ml-2" style={{ background: status.bg, color: status.color }}>
                        <StatusIcon size={14} /> {status.text}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completitud</span>
                        <span className="text-xs font-extrabold" style={{ color: status.color }}>{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${status.color}, ${status.color}cc)` }} className="h-full rounded-full transition-all duration-500" />
                      </div>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Actualizado: {new Date(legajo.updatedAt || Date.now()).toLocaleDateString('es-AR')}
                      {legajo.empresa?.actividad && (
                        <span className="ml-auto text-[0.7rem] py-1 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg font-semibold truncate max-w-[120px]">
                          {legajo.empresa.actividad}
                        </span>
                      )}
                    </div>

                    {/* Action buttons con fondos sólidos de colores */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} className="border-t border-slate-200 dark:border-slate-700 pt-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
                        title="Editar Legajo"
                        style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}
                      >
                        <Edit size={12} /> Editar
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/v/${currentUser?.uid}/pasaporte/${legajo.id}`;
                          setQrTarget({ text: url, title: `Pasaporte Digital H&S — ${legajo.empresa?.razonSocial || legajo.companyName || 'Legajo'}` });
                        }}
                        title="Ver Pasaporte QR"
                        style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}
                      >
                        <QrCode size={12} /> Pasaporte QR
                      </button>
                      <button
                        onClick={(e) => handleGeneratePDF(e, legajo)}
                        title="Exportar PDF"
                        style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
                      >
                        <Download size={12} /> PDF
                      </button>
                      <button
                        onClick={() => handleDelete(legajo.id)}
                        title="Eliminar Legajo"
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar Legajo?"
          message="Esta acción no se puede deshacer."
          iconEmoji="🗑️"
        />

        {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
      </div>
    </AnimatedPage>
  );
}