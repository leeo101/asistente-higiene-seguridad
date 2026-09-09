import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  House, Robot, ChartPieSlice, List, ChatText, Plus, X, 
  Camera, ShieldCheck, Key, Warning, QrCode, ClipboardText 
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  onMenuClick: () => void;
}

interface QuickActionItem {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactElement;
  color: string;
  bg: string;
}

const quickFieldActions: QuickActionItem[] = [
  {
    to: '/ai-general-camera-manager',
    label: 'Detección IA',
    desc: 'Detectar riesgos o EPP en foto',
    icon: <Camera size={22} weight="duotone" />,
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)'
  },
  {
    to: '/stop-cards/new',
    label: 'Tarjeta STOP',
    desc: 'Reportar acto o condición insegura',
    icon: <Warning size={22} weight="duotone" />,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)'
  },
  {
    to: '/work-permit',
    label: 'Permiso de Trabajo',
    desc: 'Apertura de tareas de alto riesgo',
    icon: <Key size={22} weight="duotone" />,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)'
  },
  {
    to: '/ats',
    label: 'Nuevo ATS',
    desc: 'Análisis de Trabajo Seguro (IPERC)',
    icon: <ShieldCheck size={22} weight="duotone" />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)'
  },
  {
    to: '/asset-scanner',
    label: 'Escanear QR Activo',
    desc: 'Chequeo rápido en campo',
    icon: <QrCode size={22} weight="duotone" />,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)'
  },
  {
    to: '/toolbox-talk',
    label: 'Charla 5 Min',
    desc: 'Firma digital de cuadrilla',
    icon: <ClipboardText size={22} weight="duotone" />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)'
  }
];

export default function BottomNav({ onMenuClick }: BottomNavProps): React.ReactElement | null {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Trigger subtle haptic feedback if supported
  const triggerHaptic = (duration = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(duration); } catch { /* ignore */ }
    }
  };

  // Scroll visibility control
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 70 && !isActionSheetOpen) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isActionSheetOpen]);

  // Cerrar hoja al navegar
  useEffect(() => {
    setIsActionSheetOpen(false);
  }, [location.pathname]);

  const hideOnPaths = ['/login', '/subscribe', '/ai-camera'];
  if (hideOnPaths.includes(location.pathname)) return null;
  if (!currentUser) return null;

  const handleActionClick = (path: string) => {
    triggerHaptic(15);
    setIsActionSheetOpen(false);
    navigate(path);
  };

  const navLeft = [
    { to: '/', icon: <House size={22} weight={location.pathname === '/' ? 'fill' : 'regular'} />, label: 'Inicio' },
    { to: '/mensajes', icon: <ChatText size={22} weight={location.pathname.includes('/mensajes') || location.pathname.includes('/chat') ? 'fill' : 'regular'} />, label: 'Mensajes' },
  ];

  const navRight = [
    { to: '/ai-advisor', icon: <Robot size={22} weight={location.pathname.includes('/ai-advisor') ? 'fill' : 'regular'} />, label: 'Asesor IA' },
    { to: '/dashboard', icon: <ChartPieSlice size={22} weight={location.pathname === '/dashboard' ? 'fill' : 'regular'} />, label: 'KPIs' },
  ];

  return (
    <>
      {/* Backdrop para el Action Sheet */}
      {isActionSheetOpen && (
        <div 
          onClick={() => { triggerHaptic(); setIsActionSheetOpen(false); }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[950] transition-opacity duration-200"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Action Sheet Flotante de Campo */}
      <div 
        className={`fixed left-0 right-0 bottom-0 z-[960] bg-[var(--color-surface,rgba(18,24,38,0.98))] border-t border-[var(--color-border,rgba(255,255,255,0.1))] rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isActionSheetOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.5)'
        }}
      >
        <div className="w-12 h-1.5 bg-gray-500/40 rounded-full mx-auto mb-4" />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">Acciones de Campo</span>
            <h3 className="text-lg font-bold text-white m-0">Acceso Rápido In Situ</h3>
          </div>
          <button 
            onClick={() => setIsActionSheetOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white border-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {quickFieldActions.map((action) => (
            <button
              key={action.to}
              onClick={() => handleActionClick(action.to)}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface-hover,rgba(255,255,255,0.05))] border border-[var(--color-border,rgba(255,255,255,0.08))] text-left cursor-pointer hover:border-emerald-500/40 active:scale-95 transition-all"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: action.bg, color: action.color }}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm block text-white truncate leading-snug">{action.label}</span>
                <span className="text-[11px] text-gray-400 block truncate mt-0.5">{action.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Navegación Inferior */}
      <nav
        className="bottom-nav hide-on-desktop fixed bottom-0 left-0 right-0 h-[68px] bg-[var(--color-surface,rgba(15,23,42,0.95))] border-t border-[var(--color-border,rgba(255,255,255,0.1))] flex items-center justify-between px-2 pb-[env(safe-area-inset-bottom)] z-[900] transition-transform duration-300 backdrop-blur-xl shadow-2xl"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)'
        }}>
        
        {/* Lado Izquierdo */}
        <div className="flex items-center justify-around flex-1">
          {navLeft.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => triggerHaptic()}
                style={{
                  color: active ? 'var(--color-primary, #10b981)' : 'var(--color-text-muted, #94a3b8)'
                }}
                className="flex flex-col items-center justify-center no-underline w-full h-full gap-1 transition-colors relative active:scale-95 duration-150">
                {active && (
                  <span className="absolute top-0 w-8 h-1 bg-[var(--color-primary,#10b981)] rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
                )}
                <div style={{ transform: active ? 'scale(1.12) translateY(-1px)' : 'scale(1)' }} className="transition-transform duration-200">
                  {item.icon}
                </div>
                <span style={{ fontWeight: active ? 700 : 500 }} className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Botón Central FAB - Campo Rápido */}
        <div className="relative -top-3 flex flex-col items-center justify-center px-1">
          <button
            onClick={() => {
              triggerHaptic(20);
              setIsActionSheetOpen(!isActionSheetOpen);
            }}
            aria-label="Acciones rápidas de campo"
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer border-2 ${
              isActionSheetOpen 
                ? 'bg-rose-600 border-rose-400 rotate-45 shadow-[0_0_20px_rgba(244,63,94,0.6)] text-white' 
                : 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-white/20 shadow-[0_4px_18px_rgba(16,185,129,0.45)] text-white hover:scale-105 active:scale-95'
            }`}
            style={{ width: '52px', height: '52px' }}
          >
            <Plus size={26} weight="bold" />
          </button>
          <span className="text-[9px] font-bold text-emerald-400 mt-0.5 uppercase tracking-tighter">Campo</span>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center justify-around flex-1">
          {navRight.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => triggerHaptic()}
                style={{
                  color: active ? 'var(--color-primary, #10b981)' : 'var(--color-text-muted, #94a3b8)'
                }}
                className="flex flex-col items-center justify-center no-underline w-full h-full gap-1 transition-colors relative active:scale-95 duration-150">
                {active && (
                  <span className="absolute top-0 w-8 h-1 bg-[var(--color-primary,#10b981)] rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
                )}
                <div style={{ transform: active ? 'scale(1.12) translateY(-1px)' : 'scale(1)' }} className="transition-transform duration-200">
                  {item.icon}
                </div>
                <span style={{ fontWeight: active ? 700 : 500 }} className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Menú Más Drawer */}
          <button
            onClick={() => { triggerHaptic(); onMenuClick(); }}
            className="flex flex-col items-center justify-center bg-transparent border-none text-[var(--color-text-muted,#94a3b8)] w-full h-full gap-1 p-0 cursor-pointer active:scale-95 transition-transform duration-150">
            <List size={22} weight="regular" />
            <span className="text-[10px] font-[500] tracking-tight">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}