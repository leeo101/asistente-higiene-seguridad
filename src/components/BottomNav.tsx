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

  // Ocultar en vistas donde no queremos BottomNav
  const hideOnPaths = ['/login', '/subscribe', '/ai-camera'];
  if (hideOnPaths.includes(location.pathname)) return null;

  // Solo mostrar a usuarios autenticados para que la estructura tenga sentido
  if (!currentUser) return null;

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

  const navItems = [
    { to: '/', icon: <House size={24} weight={location.pathname === '/' ? 'fill' : 'regular'} />, label: 'Inicio' },
    { to: '/dashboard', icon: <ChartPieSlice size={24} weight={location.pathname === '/dashboard' ? 'fill' : 'regular'} />, label: 'Dashboard' },
    { to: '/management-report', icon: <ChartBar size={24} weight={location.pathname === '/management-report' ? 'fill' : 'regular'} />, label: 'Reportes' },
  ];

  return (
    <div
      className="bottom-nav hide-on-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)', // Soporte para notch/barras de sistema en iOS/Android
        zIndex: 900,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              width: '25%',
              height: '100%',
              gap: '2px',
              transition: 'color 0.2s',
              position: 'relative'
            }}
          >
            {active && (
              <span style={{ 
                position: 'absolute', top: 0, width: '40%', height: '3px', 
                background: 'var(--color-primary)', borderBottomLeftRadius: '3px', borderBottomRightRadius: '3px' 
              }} />
            )}
            <div style={{ transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1)' }}>
                {item.icon}
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </Link>
        );
      })}

      {/* Botón de Menú (Abre el Sidebar) */}
      <button
        onClick={onMenuClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          width: '25%',
          height: '100%',
          gap: '2px',
          padding: 0,
          cursor: 'pointer'
        }}
      >
        <List size={24} weight="regular" />
        <span style={{ fontSize: '10px', fontWeight: 500 }}>Más</span>
      </button>
    </div>
  );
}
