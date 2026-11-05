import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  ShieldCheck,
  Users,
  Search,
  RefreshCw,
  Clock,
  Calendar,
  LogIn,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Mail,
  UserCheck,
  UserX,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  isAdminUser: boolean;
  daysRemaining: number;
  expiryDate: string | null;
  provider: string;
  lastSignIn: string | null;
  createdAt: string | null;
}

interface Stats {
  total: number;
  proCount: number;
  freeCount: number;
  activeThisWeek: number;
}

export default function AdminUsers(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isAdmin } = usePaywall();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, proCount: 0, freeCount: 0, activeThisWeek: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirigir si no es administrador
  useEffect(() => {
    if (!currentUser) return;
    const email = (currentUser.email || '').toLowerCase().trim();
    if (email !== 'enzorodriguez31@gmail.com' && email !== 'admin@asistentehs.com' && !isAdmin) {
      toast.error('Acceso exclusivo para administradores');
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, proCount: 0, freeCount: 0, activeThisWeek: 0 });
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      toast.error(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleGrantPro = async (targetUid: string, email: string, days = 30) => {
    setActionLoading(targetUid);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid,
          action: 'grant_pro',
          days
        })
      });

      if (!res.ok) throw new Error('No se pudo activar PRO');
      toast.success(`¡Acceso PRO activado por ${days} días para ${email}!`);
      await fetchUsers(true);
    } catch (e: any) {
      toast.error(e.message || 'Error al otorgar PRO');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePro = async (targetUid: string, email: string) => {
    if (!window.confirm(`¿Quitar suscripción PRO a ${email}?`)) return;

    setActionLoading(targetUid);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid,
          action: 'revoke_pro'
        })
      });

      if (!res.ok) throw new Error('No se pudo revocar PRO');
      toast.success(`Acceso PRO revocado para ${email}`);
      await fetchUsers(true);
    } catch (e: any) {
      toast.error(e.message || 'Error al revocar PRO');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === 'pro') return u.isPro;
      if (filter === 'free') return !u.isPro;
      return true;
    });
  }, [users, searchTerm, filter]);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Nunca';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelative = (isoString: string | null) => {
    if (!isoString) return 'Nunca';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Hace instantes';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] p-3 sm:p-6 pb-24 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
              title="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Crown size={18} />
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text)] m-0">
                  Panel de Suscriptores & Actividad
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                Control exclusivo de usuarios registrados, estado PRO y accesos en vivo
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchUsers(true)}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm font-bold cursor-pointer transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Actualizando...' : 'Refrescar Datos'}</span>
          </button>
        </div>

        {/* Métricas / KPI Cards (Responsive grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Registrados</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Users size={16} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black">{stats.total}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Cuentas en Firebase Auth</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-emerald-500/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Usuarios PRO</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Crown size={16} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.proCount}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
              {stats.total > 0 ? `${Math.round((stats.proCount / stats.total) * 100)}% de conversión` : 'Activos'}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Gratuitos</span>
              <span className="p-1.5 rounded-lg bg-gray-500/10 text-[var(--color-text-muted)]">
                <Users size={16} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black">{stats.freeCount}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Objetivos para ofertas</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-purple-500/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Activos 7 Días</span>
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <TrendingUp size={16} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400">{stats.activeThisWeek}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Ingresaron esta semana</div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por correo o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilter('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                filter === 'pro'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              PRO ({stats.proCount})
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                filter === 'free'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Gratis ({stats.freeCount})
            </button>
          </div>
        </div>

        {/* Vista Móvil: Tarjetas compactas / Vista Desktop: Tabla completa */}
        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <RefreshCw size={32} className="animate-spin mx-auto text-blue-500 mb-3" />
            <div className="font-bold">Cargando base de datos de usuarios...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Users size={36} className="mx-auto text-[var(--color-text-muted)] opacity-50 mb-3" />
            <div className="font-bold">No se encontraron usuarios</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">Probá con otro término de búsqueda.</div>
          </div>
        ) : (
          <>
            {/* CARDS PARA PANTALLAS MÓVILES (sm:hidden) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredUsers.map((u) => {
                const isLoadingThis = actionLoading === u.uid;
                return (
                  <div
                    key={u.uid}
                    className={`p-4 rounded-2xl bg-[var(--color-surface)] border transition-all ${
                      u.isPro
                        ? 'border-emerald-500/40 bg-gradient-to-br from-[var(--color-surface)] to-emerald-500/5'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm truncate">{u.displayName}</div>
                        <div className="text-xs text-[var(--color-text-muted)] truncate flex items-center gap-1 mt-0.5">
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex-shrink-0 flex items-center gap-1 ${
                          u.isPro
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-500/10 text-[var(--color-text-muted)] border border-gray-500/20'
                        }`}
                      >
                        {u.isPro ? <Crown size={12} /> : null}
                        {u.isAdminUser ? 'Admin' : u.isPro ? 'PRO' : 'Gratuito'}
                      </span>
                    </div>

                    {/* Datos de suscripción y tiempo */}
                    <div className="bg-[rgba(255,255,255,0.02)] p-2.5 rounded-xl border border-[var(--color-border)] text-xs flex flex-col gap-1.5 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-text-muted)]">Días Restantes:</span>
                        <span className="font-bold">
                          {u.isPro ? (
                            u.daysRemaining >= 3000 ? (
                              <span className="text-purple-400 font-extrabold">Vitalicio / Ilimitado</span>
                            ) : (
                              <span className={u.daysRemaining <= 5 ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                                {u.daysRemaining} días
                              </span>
                            )
                          ) : (
                            <span className="text-[var(--color-text-muted)]">Sin plan activo</span>
                          )}
                        </span>
                      </div>

                      {u.isPro && u.expiryDate && u.daysRemaining < 3000 && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[var(--color-text-muted)]">Vencimiento:</span>
                          <span>{new Date(u.expiryDate).toLocaleDateString('es-AR')}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[var(--color-text-muted)]">Último ingreso:</span>
                        <span className="font-medium text-blue-400" title={formatDate(u.lastSignIn)}>
                          {formatRelative(u.lastSignIn)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones para el admin */}
                    {!u.isAdminUser && (
                      <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
                        {u.isPro ? (
                          <button
                            onClick={() => handleRevokePro(u.uid, u.email)}
                            disabled={isLoadingThis}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <UserX size={14} />
                            <span>Quitar PRO</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGrantPro(u.uid, u.email, 30)}
                            disabled={isLoadingThis}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Zap size={14} />
                            <span>Dar 30 Días PRO</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleGrantPro(u.uid, u.email, 365)}
                          disabled={isLoadingThis}
                          className="py-1.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all"
                          title="Dar 1 Año Completo"
                        >
                          +1 Año
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TABLA COMPLETA PARA DESKTOP Y TABLET (hidden sm:block) */}
            <div className="hidden sm:block rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                      <th className="py-3.5 px-4 font-bold">Usuario / Correo</th>
                      <th className="py-3.5 px-4 font-bold">Estado PRO</th>
                      <th className="py-3.5 px-4 font-bold">Días Restantes</th>
                      <th className="py-3.5 px-4 font-bold">Último Ingreso</th>
                      <th className="py-3.5 px-4 font-bold">Fecha Registro</th>
                      <th className="py-3.5 px-4 font-bold text-right">Acciones Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredUsers.map((u) => {
                      const isLoadingThis = actionLoading === u.uid;
                      return (
                        <tr
                          key={u.uid}
                          className={`hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                            u.isPro ? 'bg-emerald-500/[0.02]' : ''
                          }`}
                        >
                          {/* Usuario */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                              {u.displayName}
                              {u.isAdminUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
                                  Tú (Admin)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 font-mono">
                              <Mail size={12} />
                              {u.email}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                u.isPro
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-gray-500/10 text-[var(--color-text-muted)] border border-gray-500/20'
                              }`}
                            >
                              {u.isPro ? <Crown size={13} /> : null}
                              {u.isAdminUser ? 'Admin' : u.isPro ? 'PRO Activo' : 'Gratis'}
                            </span>
                          </td>

                          {/* Días restantes */}
                          <td className="py-3.5 px-4">
                            {u.isPro ? (
                              u.daysRemaining >= 3000 ? (
                                <span className="text-purple-400 font-extrabold text-xs">Vitalicio / Admin</span>
                              ) : (
                                <div>
                                  <span
                                    className={`font-black text-sm ${
                                      u.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'
                                    }`}
                                  >
                                    {u.daysRemaining} días
                                  </span>
                                  {u.expiryDate && (
                                    <div className="text-[11px] text-[var(--color-text-muted)]">
                                      Vence: {new Date(u.expiryDate).toLocaleDateString('es-AR')}
                                    </div>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>

                          {/* Último Ingreso */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-xs text-blue-400" title={formatDate(u.lastSignIn)}>
                              {formatRelative(u.lastSignIn)}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)]">{formatDate(u.lastSignIn)}</div>
                          </td>

                          {/* Fecha Registro */}
                          <td className="py-3.5 px-4 text-xs text-[var(--color-text-muted)]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '—'}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right">
                            {u.isAdminUser ? (
                              <span className="text-xs text-[var(--color-text-muted)] italic">Protegido</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {u.isPro ? (
                                  <button
                                    onClick={() => handleRevokePro(u.uid, u.email)}
                                    disabled={isLoadingThis}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    title="Quitar membresía PRO"
                                  >
                                    Quitar PRO
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleGrantPro(u.uid, u.email, 30)}
                                    disabled={isLoadingThis}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                    title="Activar 30 días gratis"
                                  >
                                    <Zap size={12} />
                                    Dar 30 Días
                                  </button>
                                )}

                                <button
                                  onClick={() => handleGrantPro(u.uid, u.email, 365)}
                                  disabled={isLoadingThis}
                                  className="px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                  title="Dar 1 Año PRO"
                                >
                                  +1 Año
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
