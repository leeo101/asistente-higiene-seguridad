import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export function useHardwareBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.pathname;
      const isRoot = path === '/' || path === '/login' || path === '/dashboard';
      
      if (isRoot) {
        CapacitorApp.exitApp();
        return;
      }

      // Si estamos en un formulario "nuevo" o detalle, intentar volver a la lista del módulo
      if (path.endsWith('/nuevo') || path.endsWith('/new')) {
        const parentPath = path.replace(/\/nuevo$/, '').replace(/\/new$/, '');
        navigate(parentPath, { replace: true });
      } else if (path.includes('/inspect/')) {
        const parentPath = path.split('/inspect/')[0];
        navigate(parentPath, { replace: true });
      } else if (path.includes('/editar/')) {
        const parentPath = path.split('/editar/')[0];
        navigate(parentPath, { replace: true });
      } else {
        const pathParts = path.split('/').filter(Boolean);
        if (pathParts.length === 1) {
          navigate('/', { state: { scrollTo: pathParts[0] } });
        } else {
          // En cualquier otro caso, ir a la pantalla anterior en el historial
          navigate(-1);
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}
