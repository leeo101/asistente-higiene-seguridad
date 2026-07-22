import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import {
  X, User, House, GearSix, ClockCounterClockwise, SignOut, CalendarBlank,
  ChatText, ShieldCheck, ChartPieSlice, DeviceMobile,
  Users, Crown, Image as ImageIconPh, ChartBar,
  CloudSlash, CloudArrowUp, CloudCheck, Plant, Moon, Sun } from
'@phosphor-icons/react';
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
{ to: '/worker-portal', icon: <User weight="duotone" size={20} color="#3b82f6" />, label: 'Portal del Trabajador', auth: true }];


export default function Sidebar({ isOpen, onClose }: SidebarProps): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { isPro, daysRemaining } = usePaywall();
  const { isOnline, syncing, pendingCount } = useSync();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

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

    setUserInfo((prev) => ({ ...prev, name: currentUser?.displayName || currentUser?.email || 'Usuario' }));
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUserInfo((prev) => ({ ...prev, photo: parsed.photo, profession: parsed.profession || '' }));
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

  const visibleItems = navItems.filter((item) =>
  item.always || item.auth && currentUser
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen &&
      <div
        onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.55)] backdrop-filter-[blur(4px)] z-[999] animation-[fadeIn_0.2s_ease]" />








      }

      <div
        style={{




          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: isOpen ? 'visible' : 'hidden',

          pointerEvents: isOpen ? 'all' : 'none',




          boxShadow: isOpen ? '20px 0 60px rgba(0,0,0,0.15)' : 'none'


        }} className="fixed top-[0] left-[0] w-[285px] h-[100%] z-[1000] transition-[transform_0.3s_cubic-bezier(0.4,0,0.2,1),_visibility_0.3s] flex flex-col bg-[var(--color-surface)] border-right-[1px_solid_var(--color-border)] max-height-[100vh] overflow-[hidden] backdrop-filter-[blur(20px)] webkit-backdrop-filter-[blur(20px)]">
        
        {/* ── HEADER ── */}
        <div className="p-[1.5rem_1.2rem] relative overflow-[hidden] flex-shrink-[0] border-bottom-[1px_solid_var(--color-border)]">




          
          {/* Top row: Logo + close */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-[0.6rem]">
              <div className="w-[36px] h-[36px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[12px] p-[6px] flex-shrink-[0] box-shadow-[var(--shadow-sm)]">
                <img src="/logo.png" alt="Logo" className="w-[100%] h-[100%] object-fit-[contain]" />
              </div>
              <span className="text-[0.95rem] font-[900] text-[var(--color-text)] letter-spacing-[-0.3px] font-family-[var(--font-heading)]">Asistente HYS</span>
            </div>
            
            <div className="flex items-center gap-[0.5rem]">
              <button onClick={toggleTheme}
                onMouseOver={(e) => {e.currentTarget.style.background = 'var(--color-border)';e.currentTarget.style.color = 'var(--color-text)';}}
                onMouseOut={(e) => {e.currentTarget.style.background = 'var(--color-background)';e.currentTarget.style.color = 'var(--color-text-muted)';}} 
                className="p-[0] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] w-[42px] h-[42px] rounded-[10px] flex items-center justify-center cursor-pointer text-[var(--color-text-muted)] transition-[all_0.2s_ease]">
                  {theme === 'dark' ? <Moon weight="duotone" size={24} /> : <Sun weight="duotone" size={24} />}
              </button>
              <button onClick={onClose}
                onMouseOver={(e) => {e.currentTarget.style.background = 'var(--color-border)';e.currentTarget.style.color = 'var(--color-text)';}}
                onMouseOut={(e) => {e.currentTarget.style.background = 'var(--color-background)';e.currentTarget.style.color = 'var(--color-text-muted)';}} 
                className="p-[0] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] w-[42px] h-[42px] rounded-[10px] flex items-center justify-center cursor-pointer text-[var(--color-text-muted)] transition-[all_0.2s_ease]">
                <X weight="bold" size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* ── SYNC INDICATOR ── */}
        {currentUser &&
        <div style={{
          background: !isOnline ? 'rgba(239,68,68,0.1)' : syncing ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.08)',



          color: !isOnline ? '#ef4444' : syncing ? '#3b82f6' : '#10b981'

        }} className="border-bottom-[1px_solid_var(--color-border)] p-[0.6rem_1rem] flex items-center gap-[0.7rem] text-[0.75rem] font-[700] transition-[all_0.3s_ease]">
            {!isOnline ?
          <>
                <CloudSlash size={16} weight="bold" />
                <span>Modo Offline ({pendingCount} pendientes)</span>
              </> :
          syncing ?
          <>
                <CloudArrowUp size={16} weight="bold" className="animate-pulse" />
                <span>Sincronizando {pendingCount > 0 ? `(${pendingCount} pendientes)` : ''}...</span>
              </> :

          <>
                <CloudCheck size={16} weight="bold" />
                <span>Nube al día {pendingCount > 0 ? `(${pendingCount} listos)` : ''}</span>
              </>
          }
          </div>
        }

        {/* ── NAVIGATION ── */}
        <nav 
          className="flex-[1] overflow-y-auto touch-pan-y p-[1rem_0.8rem] flex flex-col gap-[0.25rem] scrollbar-width-[thin] pb-[2rem]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >




          
              {visibleItems.map((item, i) => {
            const active = isActive(item.to);
            return (
              <Link key={i} className="stagger-item text-decoration-[none]" to={item.to} onClick={onClose} style={{ animationDelay: `${0.05 + i * 0.03}s` }}>
                    <div style={{


                  color: active ? 'var(--color-primary)' : 'var(--color-text)',
                  background: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  fontWeight: active ? 700 : 500




                }}
                onMouseOver={(e) => {if (!active) {e.currentTarget.style.background = 'var(--color-surface-hover)';}}}
                onMouseOut={(e) => {if (!active) {e.currentTarget.style.background = 'transparent';}}} className="flex items-center gap-[0.9rem] p-[0.75rem_1rem] rounded-[12px] text-[0.9rem] transition-[all_0.2s_ease] border-[1px_solid_transparent] relative">
                  
                      {active &&
                  <div className="absolute left-[-0.8rem] top-[15%] h-[70%] w-[4px] bg-[var(--color-primary)] rounded-[0_4px_4px_0] box-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  }
                      <span style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} className="flex-shrink-[0]">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </Link>);

          })}

          <div className="h-[1px] bg-[var(--color-border)] m-[1rem_0.5rem]" />

          <a href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia - Asistente HYS" onClick={onClose} className="text-decoration-[none] p-[0_0.5rem]">
            <div
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }} 
              className="flex items-center gap-[0.9rem] p-[0.9rem_1rem] rounded-[12px] text-[var(--color-primary)] text-[0.88rem] font-[700] bg-[rgba(59,130,246,0.08)] border-[1px_solid_rgba(59,130,246,0.2)] transition-[all_0.2s_ease]"
            >
              <div className="w-[32px] h-[32px] rounded-[10px] bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-[0]">
                <ChatText size={18} weight="fill" />
              </div>
              <span>Soporte y Sugerencias</span>
            </div>
          </a>

          {/* PRO banner */}
          {!isPro &&
          <Link to="/subscribe" onClick={onClose} className="text-decoration-[none] mb-[0.5rem] mt-[1rem]">
              <div









              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }} className="flex items-center gap-[0.9rem] p-[1rem] rounded-[16px] bg-[linear-gradient(135deg,_rgba(59,_130,_246,_0.1),_rgba(139,_92,_246,_0.1))] border-[1px_solid_rgba(59,_130,_246,_0.2)] cursor-pointer transition-[all_0.3s_ease] relative overflow-[hidden]">
              
                <div className="w-[32px] h-[32px] rounded-[10px] bg-[linear-gradient(135deg,_#f59e0b,_#fbbf24)] flex items-center justify-center box-shadow-[0_4px_12px_rgba(245,_158,_11,_0.3)] flex-shrink-[0]">





                
                  <Crown weight="fill" size={20} color="#ffffff" />
                </div>
                <div className="flex flex-col">
                  <span className="font-[800] text-[0.85rem] text-[var(--color-primary)] letter-spacing-[-0.3px]">Activar Versión Pro</span>
                  <span className="text-[0.7rem] text-[var(--color-text-muted)]">Desbloquea todas las funciones</span>
                </div>
              </div>
            </Link>
          }

          <button
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('show-pwa-install'));
            }}
            className="w-full mb-3 p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <DeviceMobile weight="bold" size={18} />
            <span>Instalar App (PWA)</span>
          </button>

          <AdBanner placement="sidebar" />

          {currentUser &&
          <div className="mt-[auto] pt-[2rem]">
            <button
              onClick={handleLogout}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.color = '#ef4444';
              }} 
              className="flex items-center justify-center gap-[0.7rem] p-[0.85rem_1rem] rounded-[12px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] cursor-pointer w-[100%] font-[700] text-[0.95rem] transition-[all_0.25s_ease]"
            >
              <SignOut weight="bold" size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
          }
        </nav>
      </div>
    </>);

}