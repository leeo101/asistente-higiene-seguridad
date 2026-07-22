import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, ShieldCheck, Robot, ChartPieSlice, List } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps): React.ReactElement | null {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Trigger subtle haptic feedback if supported
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
  };

  // Scroll visibility control
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const hideOnPaths = ['/login', '/subscribe', '/ai-camera'];
  if (hideOnPaths.includes(location.pathname)) return null;
  if (!currentUser) return null;

  const navItems = [
    { to: '/', icon: <House size={22} weight={location.pathname === '/' ? 'fill' : 'regular'} />, label: 'Inicio' },
    { to: '/ats', icon: <ShieldCheck size={22} weight={location.pathname.includes('/ats') ? 'fill' : 'regular'} />, label: 'ATS' },
    { to: '/ai-advisor', icon: <Robot size={22} weight={location.pathname.includes('/ai-advisor') ? 'fill' : 'regular'} />, label: 'Asesor IA' },
    { to: '/dashboard', icon: <ChartPieSlice size={22} weight={location.pathname === '/dashboard' ? 'fill' : 'regular'} />, label: 'KPIs' },
  ];

  return (
    <div
      className="bottom-nav hide-on-desktop fixed bottom-0 left-0 right-0 h-[64px] bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around pb-[env(safe-area-inset-bottom)] z-[900] transition-transform duration-300 backdrop-blur-xl shadow-lg"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)'
      }}>
      
      {navItems.map((item) => {
        const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={triggerHaptic}
            style={{
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)'
            }}
            className="flex flex-col items-center justify-center text-none w-[20%] h-full gap-[2px] transition-colors relative active:scale-95 duration-150">
            
            {active && (
              <span className="absolute top-0 w-[36%] h-[3px] bg-[var(--color-primary)] rounded-b-[3px]" />
            )}
            <div
              style={{ transform: active ? 'scale(1.12) translateY(-1px)' : 'scale(1)' }}
              className="transition-transform duration-200">
              {item.icon}
            </div>
            <span style={{ fontWeight: active ? 800 : 500 }} className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Menú Drawer */}
      <button
        onClick={() => { triggerHaptic(); onMenuClick(); }}
        className="flex flex-col items-center justify-center bg-transparent border-none text-[var(--color-text-muted)] w-[20%] h-full gap-[2px] p-0 cursor-pointer active:scale-95 transition-transform duration-150">
        <List size={22} weight="regular" />
        <span className="text-[10px] font-[500] tracking-tight">Más</span>
      </button>
    </div>
  );
}