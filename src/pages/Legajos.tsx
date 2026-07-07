import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Trash2, Edit, AlertCircle, Building2, Search, Filter, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
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
      if (typeof v === 'string') {total++;if (v.trim()) filled++;} else
      if (typeof v === 'boolean') {total++;if (v) filled++;}
    });
  };
  checkObj(legajo.empresa);
  checkObj(legajo.riesgos);
  checkObj(legajo.incendio);
  checkObj(legajo.epp);
  checkObj(legajo.ambiente);
  checkObj(legajo.firmas);
  return total === 0 ? 0 : Math.round(filled / total * 100);
};

const getStatusBadge = (percent: number, legajo: Legajo) => {
  // Check for expired measurements
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
  const [showQRModal, setShowQRModal] = useState(false);

  const handleGeneratePDF = (e: React.MouseEvent, legajo: Legajo) => {
    e.stopPropagation();
    if (!hasAccess) {
      alert("La exportación a PDF requiere una suscripción PRO");
      navigate('/subscribe');
      return;
    }
    setPrintingLegajo(legajo);
    // Give it a moment to render the hidden DOM before calling print
    setTimeout(() => {
      const cleanup = () => {
        setPrintingLegajo(null);
        window.removeEventListener('afterprint', cleanup);
        window.removeEventListener('focus', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', cleanup);

      // Small fallback timeout
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
    <div className="container max-w-[1200px] mx-auto px-4 pb-12">
      
      {/* Hidden PDF Container */}
      {printingLegajo &&
        <div className="print-only fixed left-0 top-0 opacity-0 pointer-events-none">
              <div id="pdf-content">
                  <LegajoPdf data={{ ...printingLegajo, professionalName: currentUser?.displayName || 'Profesional H&S' }} />
              </div>
          </div>
        }

      <PremiumHeader
          title="Legajos Técnicos"
          subtitle="Decreto 351/79 — Ley 19.587 · ISO 45001"
          icon={<Building2 size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

      <div className="flex gap-4 my-6">
          <></>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 justify-start">
        {hasAccess &&
          <>
          <button
              onClick={() => navigate('/legajos/nuevo')}
              className="text-white py-3 px-6 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm border-none shadow-[0_4px_15px_rgba(16,185,129,0.4)]"
              style={{ backgroundColor: '#10b981' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#10b981';
              }}>
            <Plus size={18} /> Nuevo Legajo
          </button>
          <button
              onClick={() => setShowQRModal(true)}
              className="text-white py-3 px-6 rounded-xl font-extrabold cursor-pointer flex items-center gap-2 transition-all text-sm border-none shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
              style={{ backgroundColor: '#3b82f6' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}>
            Portal Trabajador (QR)
          </button>
          </>
          }
      </div>

      {showQRModal &&
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[400px] text-center">
                <h3 className="m-0 mb-4 font-extrabold text-slate-900 dark:text-slate-100">Acceso al Portal</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Los trabajadores pueden escanear este código para acceder a su portal de aptitudes médicas y capacitaciones.</p>
                <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-xl inline-block mb-6">
                    <QRCodeSVG value={`${window.location.origin}/worker-portal`} size={200} />
                </div>
                <button onClick={() => setShowQRModal(false)} className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg font-bold cursor-pointer transition-colors">
                    Cerrar
                </button>
            </div>
        </div>
        }

      {!hasAccess &&
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4 items-start mb-8">
          <AlertCircle size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="m-0 mb-2 font-extrabold text-amber-800 dark:text-amber-400">Función Exclusiva PRO</h3>
            <p className="m-0 mb-4 text-sm text-amber-900 dark:text-amber-300">
              El módulo de Legajos Técnicos es una herramienta avanzada para profesionales. 
              Actualizá tu cuenta para crear, gestionar y exportar legajos en PDF.
            </p>
            <button
              onClick={() => navigate('/subscribe')}
              className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer text-sm transition-colors">
              
              Mejorar a PRO
            </button>
          </div>
        </div>
        }

      {/* Search & Filter Bar */}
      {legajos.length > 0 &&
        <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-[1_1_300px] relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
              type="text"
              placeholder="Buscar por empresa o CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pr-4 pl-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500" />
            
              </div>
              <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none text-slate-800 dark:text-slate-200 flex-[0_1_220px] focus:ring-2 focus:ring-blue-500">
            
                  <option value="">Todos los estados</option>
                  <option value="Completo">✅ Completo</option>
                  <option value="En Progreso">🔶 En Progreso</option>
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="Vencido">🔴 Vencido</option>
              </select>
          </div>
        }

      {/* Stats */}
      {legajos.length > 0 &&
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
          { label: 'Total', value: legajos.length, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Completos', value: legajos.filter((l) => getCompletionPercent(l) === 100).length, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
          { label: 'En Progreso', value: legajos.filter((l) => {const p = getCompletionPercent(l);return p > 0 && p < 100;}).length, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
          { label: 'Pendientes', value: legajos.filter((l) => getCompletionPercent(l) === 0).length, color: '#64748b', bg: 'rgba(100,116,139,0.08)' }].
          map((s) =>
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20` }} className="rounded-[14px] p-[1rem] text-center">
                      <div style={{ color: s.color }} className="text-[1.8rem] font-[900]">{s.value}</div>
                      <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase letter-spacing-[0.05em]">{s.label}</div>
                  </div>
          )}
          </div>
        }

      {loading ?
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        </div> :
        filteredLegajos.length === 0 ?
        <div className="text-center py-16 px-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <FileText size={56} className="text-slate-400 opacity-50 mx-auto mb-4" />
          <h3 className="font-extrabold mb-2">{searchTerm || statusFilter ? 'Sin resultados' : 'No hay legajos técnicos'}</h3>
          <p className="text-slate-500 dark:text-slate-400 m-0 mb-6 text-sm">
            {searchTerm || statusFilter ? 'Probá con otros filtros de búsqueda.' : 'Creá tu primer legajo para empezar a gestionar a tus clientes.'}
          </p>

        </div> :

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

                onClick={() => navigate(`/legajos/editar/${legajo.id}`)}>
                
              {/* Top gradient bar */}
              <div style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}88)` }} className="absolute top-[0] left-[0] right-[0] h-[4px]" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="m-0 font-extrabold text-lg truncate">
                    {legajo.companyName || 'Empresa Sin Nombre'}
                  </h3>
                  <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                    CUIT: {legajo.cuit || 'Sin CUIT'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-extrabold shrink-0" style={{ background: status.bg, color: status.color }}>
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
                      <div style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${status.color}, ${status.color}cc)` }} className="h-[100%] rounded-[3px] transition-[width_0.5s_ease]" />
                  </div>
              </div>

              {/* Info row */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Actualizado: {new Date(legajo.updatedAt).toLocaleDateString('es-AR')}
                  {legajo.empresa?.actividad &&
                  <span className="ml-auto text-[0.7rem] py-1 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg font-semibold">
                          {legajo.empresa.actividad}
                      </span>
                  }
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 border-t border-slate-200 dark:border-slate-700 pt-4" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-500/20 transition-colors">
                    
                  <Edit size={15} /> Editar
                </button>
                <button
                    onClick={(e) => handleGeneratePDF(e, legajo)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-500/20 transition-colors">
                    
                  <Download size={15} /> PDF
                </button>
                <button
                    onClick={() => handleDelete(legajo.id)}
                    className="px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/20 transition-colors"
                    title="Eliminar">
                    
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>);

          })}
        </div>
        }

      <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar Legajo?"
          message="Esta acción no se puede deshacer."
          iconEmoji="🗑️" />
        
    </div>
    </AnimatedPage>);

}