import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Trash2, Edit, AlertCircle, Building2, Search, Filter, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';

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
            if (typeof v === 'string') { total++; if (v.trim()) filled++; }
            else if (typeof v === 'boolean') { total++; if (v) filled++; }
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

  useEffect(() => {
    fetchLegajos();
  }, [currentUser]);

  const fetchLegajos = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'users', currentUser.uid, 'legajos'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
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

  const handleDelete = async (id: string) => {
    if (!currentUser || !window.confirm('¿Estás seguro de eliminar este Legajo Técnico? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'legajos', id));
      setLegajos(legajos.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting legajo:", error);
      alert("Hubo un error al eliminar el legajo.");
    }
  };

  const filteredLegajos = legajos.filter(l => {
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
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Premium Header */}
      <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.06) 100%)',
          border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#fff" />
            </div>
            Legajos Técnicos
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Decreto 351/79 — Ley 19.587 · ISO 45001
          </p>
        </div>
        <button
          onClick={() => {
            if (!hasAccess) { navigate('/subscription'); return; }
            navigate('/legajos/nuevo');
          }}
          className="btn-primary"
          style={{ padding: '0.8rem 1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '14px', fontSize: '0.95rem' }}
        >
          <Plus size={20} /> Nuevo Legajo
        </button>
      </div>

      {!hasAccess && (
        <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,88,12,0.06) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            marginBottom: '2rem'
        }}>
          <AlertCircle size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#92400e' }}>Función Exclusiva PRO</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#78350f' }}>
              El módulo de Legajos Técnicos es una herramienta avanzada para profesionales. 
              Actualizá tu cuenta para crear, gestionar y exportar legajos en PDF.
            </p>
            <button 
              onClick={() => navigate('/subscription')}
              style={{ padding: '0.6rem 1.2rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Mejorar a PRO
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      {legajos.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                      type="text"
                      placeholder="Buscar por empresa o CUIT..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.9rem', outline: 'none', color: 'var(--color-text)' }}
                  />
              </div>
              <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '0.8rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.9rem', outline: 'none', color: 'var(--color-text)', flex: '0 1 220px' }}
              >
                  <option value="">Todos los estados</option>
                  <option value="Completo">✅ Completo</option>
                  <option value="En Progreso">🔶 En Progreso</option>
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="Vencido">🔴 Vencido</option>
              </select>
          </div>
      )}

      {/* Stats */}
      {legajos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                  { label: 'Total', value: legajos.length, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
                  { label: 'Completos', value: legajos.filter(l => getCompletionPercent(l) === 100).length, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
                  { label: 'En Progreso', value: legajos.filter(l => { const p = getCompletionPercent(l); return p > 0 && p < 100; }).length, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
                  { label: 'Pendientes', value: legajos.filter(l => getCompletionPercent(l) === 0).length, color: '#64748b', bg: 'rgba(100,116,139,0.08)' }
              ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
              ))}
          </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredLegajos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <FileText size={56} style={{ color: 'var(--color-text-muted)', opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{searchTerm || statusFilter ? 'Sin resultados' : 'No hay legajos técnicos'}</h3>
          <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
            {searchTerm || statusFilter ? 'Probá con otros filtros de búsqueda.' : 'Creá tu primer legajo para empezar a gestionar a tus clientes.'}
          </p>
          {!searchTerm && !statusFilter && (
            <button onClick={() => navigate('/legajos/nuevo')} className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
                <Plus size={18} /> Crear Primer Legajo
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
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
              style={{
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
            >
              {/* Top gradient bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${status.color}, ${status.color}88)` }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {legajo.companyName || 'Empresa Sin Nombre'}
                  </h3>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                    CUIT: {legajo.cuit || 'Sin CUIT'}
                  </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.75rem', borderRadius: '20px',
                    background: status.bg, color: status.color,
                    fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                }}>
                    <StatusIcon size={14} /> {status.text}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Completitud</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: status.color }}>{percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', borderRadius: '3px', background: `linear-gradient(90deg, ${status.color}, ${status.color}cc)`, transition: 'width 0.5s ease' }} />
                  </div>
              </div>

              {/* Info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                  Actualizado: {new Date(legajo.updatedAt).toLocaleDateString('es-AR')}
                  {legajo.empresa?.actividad && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(37,99,235,0.06)', borderRadius: '8px', color: '#2563eb', fontWeight: 600 }}>
                          {legajo.empresa.actividad}
                      </span>
                  )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: 'rgba(37,99,235,0.06)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <Edit size={15} /> Editar
                </button>
                <button 
                  onClick={() => navigate(`/legajos/pdf/${legajo.id}`)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: 'rgba(22,163,74,0.06)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <Download size={15} /> PDF
                </button>
                <button 
                  onClick={() => handleDelete(legajo.id)}
                  style={{ padding: '0.6rem 0.8rem', background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', cursor: 'pointer' }}
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </AnimatedPage>
  );
}
