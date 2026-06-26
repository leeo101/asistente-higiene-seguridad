import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, ChartPieSlice, ChartBar, List } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps): React.ReactElement | null {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Lógica para ocultar/mostrar al hacer scroll down/up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show on scroll up or top of page, hide on scroll down
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

  // Ocultar en vistas donde no queremos BottomNav
  const hideOnPaths = ['/login', '/subscribe', '/ai-camera'];
  if (hideOnPaths.includes(location.pathname)) return null;

  // Solo mostrar a usuarios autenticados para que la estructura tenga sentido
  if (!currentUser) return null;

  const navItems = [
  { to: '/', icon: <House size={24} weight={location.pathname === '/' ? 'fill' : 'regular'} />, label: 'Inicio' },
  { to: '/dashboard', icon: <ChartPieSlice size={24} weight={location.pathname === '/dashboard' ? 'fill' : 'regular'} />, label: 'Dashboard' },
  { to: '/management-report', icon: <ChartBar size={24} weight={location.pathname === '/management-report' ? 'fill' : 'regular'} />, label: 'Reportes' }];


  return (
    <div
      className="bottom-nav hide-on-desktop fixed bottom-[0] left-[0] right-[0] h-[65px] bg-[var(--color-surface)] border-top-[1px_solid_var(--color-border)] flex items-center justify-space-around pb-[env(safe-area-inset-bottom)] z-[900] transition-[transform_0.3s_cubic-bezier(0.4,_0,_0.2,_1)] backdrop-filter-[blur(20px)] webkit-backdrop-filter-[blur(20px)] box-shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{












        transform: isVisible ? 'translateY(0)' : 'translateY(100%)'




      }}>
      
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{





              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)'





            }} className="flex flex-col items-center justify-center text-decoration-[none] w-[25%] h-[100%] gap-[2px] transition-[color_0.2s] relative">
            
            {active &&
            <span className="absolute top-[0] w-[40%] h-[3px] bg-[var(--color-primary)] border-bottom-left-radius-[3px] border-bottom-right-radius-[3px]" />



            }
            <div style={{ transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1)' }} className="transition-[transform_0.2s_cubic-bezier(0.34,_1.56,_0.64,_1)]">
                {item.icon}
            </div>
            <span style={{ fontWeight: active ? 700 : 500 }} className="text-[10px]">{item.label}</span>
          </Link>);

      })}

      {/* Botón de Menú (Abre el Sidebar) */}
      <button
        onClick={onMenuClick} className="flex flex-col items-center justify-center bg-[transparent] border-none text-[var(--color-text-muted)] w-[25%] h-[100%] gap-[2px] p-[0] cursor-pointer">














        
        <List size={24} weight="regular" />
        <span className="text-[10px] font-[500]">Más</span>
      </button>
    </div>);

}