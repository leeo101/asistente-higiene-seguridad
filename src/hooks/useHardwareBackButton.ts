import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export function useHardwareBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Escuchar el botón físico de Atrás en Android
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const isRoot = window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/dashboard';
      
      if (isRoot) {
        // Si estamos en inicio, salir de la app
        CapacitorApp.exitApp();
      } else {
        // Sino, volvemos a la pantalla anterior
        navigate(-1);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}
