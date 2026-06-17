import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import {
  X, User, House, GearSix, ClockCounterClockwise, SignOut, CalendarBlank,
  ChatText, ShieldCheck, ChartPieSlice,
  Users, Crown, Image as ImageIconPh, ChartBar,
  CloudSlash, CloudArrowUp, CloudCheck
} from '@phosphor-icons/react';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';

import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from './AdBanner';
import SidebarUserProfile from './sidebar/SidebarUserProfile';

// Tipos
interface NavItem {
  to: string;
  icon: React.ReactElement;
  label: string;
  always?: boolean;
  auth?: boolean;
}

interface UserInfo {
  name: string;
  photo: string | null;
  profession: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { to: '/', icon: <House weight="duotone" size={20} />, label: 'Inicio', always: true },
  { to: '/calendar', icon: <CalendarBlank weight="duotone" size={20} />, label: 'Calendario', always: true },
  { to: '/settings', icon: <GearSix weight="duotone" size={20} />, label: 'Configuración', auth: true },
  { to: '/dashboard', icon: <ChartPieSlice weight="duotone" size={20} color="#10b981" />, label: 'Dashboard', auth: true },
  { to: '/contractors', icon: <Users weight="duotone" size={20} color="#3b82f6" />, label: 'Contratistas', auth: true },
  { to: '/logo-settings', icon: <ImageIconPh weight="duotone" size={20} />, label: 'Logo de Empresa', auth: true },
  { to: '/profile', icon: <User weight="duotone" size={20} />, label: 'Mi Perfil', auth: true },
  { to: '/privacy', icon: <ShieldCheck weight="duotone" size={20} />, label: 'Privacidad', always: true },
  { to: '/management-report', icon: <ChartBar weight="duotone" size={20} color="#8b5cf6" />, label: 'Reporte Mensual', auth: true },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { isPro, daysRemaining } = usePaywall();
  const { isOnline, syncing, pendingCount } = useSync();

  // Dispara notificaciones nativas del sistema una vez al día
  useNotificationScheduler();
  
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: currentUser?.displayName || currentUser?.email || 'Usuario',
    photo: null,
    profession: ''
  });

  useEffect(() => {
    if (!currentUser) {
      setUserInfo({
        name: 'Invitado',
        photo: null,
        profession: ''
      });
      return;
    }

    setUserInfo(prev => ({ ...prev, name: currentUser?.displayName || currentUser?.email || 'Usuario' }));
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUserInfo(prev => ({ ...prev, photo: parsed.photo, profession: parsed.profession || '' }));
    }

    // Lock background scroll when sidebar is open on mobile
    if (isOpen) {
      document.body.classList.add('sidebar-open-lock');
    } else {
      document.body.classList.remove('sidebar-open-lock');
    }

    // Cleanup on unmount or close
    return () => {
      document.body.classList.remove('sidebar-open-lock');
    };
  }, [isOpen, currentUser]);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string): boolean => location.pathname === path;

  const visibleItems = navItems.filter(item =>
    item.always || (item.auth && currentUser)
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '285px', height: '100%',
          zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), visibility 0.3s',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: isOpen ? 'visible' : 'hidden',
          display: 'flex', flexDirection: 'column',
          pointerEvents: isOpen ? 'all' : 'none',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          maxHeight: '100vh',
          overflow: 'hidden',
          boxShadow: isOpen ? '20px 0 60px rgba(0,0,0,0.15)' : 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          background: 'var(--color-hero-bg)',
          padding: '1.5rem 1.2rem 1.8rem',
          position: 'relative', overflow: 'hidden',
          flexShrink: 0,
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

          {/* Top row: Logo + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '8px', flexShrink: 0, backdropFilter: 'blur(10px)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                <img src="/logo.png" alt="Logo de Asistente HYS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-hero-text)', letterSpacing: '-0.8px', fontFamily: 'var(--font-heading)' }}>Asistente HYS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              
              <button onClick={onClose} style={{ padding: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0)'; }}
              >
                <X weight="bold" size={20} />
              </button>
            </div>
          </div>

          <SidebarUserProfile 
            currentUser={currentUser}
            userInfo={userInfo}
            isPro={isPro}
            daysRemaining={daysRemaining}
            onClose={onClose}
          />
        </div>

        {/* ── SYNC INDICATOR ── */}
        {currentUser && (
          <div style={{
            background: !isOnline ? 'rgba(239,68,68,0.1)' : syncing ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.08)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem',
            fontSize: '0.75rem', fontWeight: 700,
            color: !isOnline ? '#ef4444' : syncing ? '#3b82f6' : '#10b981',
            transition: 'all 0.3s ease'
          }}>
            {!isOnline ? (
              <>
                <CloudSlash size={16} weight="bold" />
                <span>Modo Offline ({pendingCount} pendientes)</span>
              </>
            ) : syncing ? (
              <>
                <CloudArrowUp size={16} weight="bold" className="animate-pulse" />
                <span>Sincronizando {pendingCount > 0 ? `(${pendingCount} pendientes)` : ''}...</span>
              </>
            ) : (
              <>
                <CloudCheck size={16} weight="bold" />
                <span>Nube al día {pendingCount > 0 ? `(${pendingCount} listos)` : ''}</span>
              </>
            )}
          </div>
        )}

        {/* ── NAVIGATION ── */}
        <nav style={{
          flex: 1, overflowY: 'auto', padding: '1rem 0.8rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          scrollbarWidth: 'thin',
          paddingBottom: '2rem',
        }}>
              {visibleItems.map((item, i) => {
                const active = isActive(item.to);
                return (
                  <Link key={i} className="stagger-item" to={item.to} onClick={onClose} style={{ textDecoration: 'none', animationDelay: `${0.1 + (i * 0.03)}s` }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.9rem',
                      padding: '0.8rem 1rem', borderRadius: '14px',
                      color: active ? '#ffffff' : 'var(--color-text)',
                      background: active ? 'var(--gradient-premium)' : 'transparent',
                      fontWeight: active ? 800 : 500,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: active ? '0 10px 20px rgba(59, 130, 246, 0.3)' : 'none',
                      border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}
                      onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.transform = 'translateX(4px)'; } }}
                      onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}
                    >
                      <span style={{ color: active ? 'white' : 'var(--color-primary)', flexShrink: 0, transition: 'transform 0.3s ease' }} className={active ? 'scale-110' : ''}>
                        {item.icon}
                      </span>
                      <span style={{ letterSpacing: active ? '0.2px' : '0' }}>{item.label}</span>
                    </div>
                  </Link>
                );
              })}

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.8rem 0.5rem' }} />

          <a href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia - Asistente HYS" onClick={onClose} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.9rem',
              padding: '0.7rem 1rem', borderRadius: '12px',
              color: 'var(--color-text)', fontWeight: 500, fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--color-background)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <ChatText weight="duotone" size={20} color="var(--color-text-muted)" />
              <span>Sugerencias y Mejoras</span>
            </div>
          </a>

          {/* PRO banner */}
          {!isPro && (
            <Link to="/subscribe" onClick={onClose} style={{ textDecoration: 'none', marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                padding: '1rem', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  flexShrink: 0
                }}>
                  <Crown weight="fill" size={20} color="#ffffff" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary)', letterSpacing: '-0.3px' }}>Activar Versión Pro</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Desbloquea todas las funciones</span>
                </div>
              </div>
            </Link>
          )}

          <AdBanner placement="sidebar" />

          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                padding: '0.8rem 1rem', borderRadius: '12px',
                color: '#ef4444', background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'pointer', marginTop: '0.5rem',
                textAlign: 'left', width: '100%',
                fontWeight: 600, fontSize: '0.9rem',
                transition: 'background 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
            >
              <SignOut weight="bold" size={20} />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
