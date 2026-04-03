import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { ADMIN_EMAILS } from '../config';

export function usePaywall() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncPulse } = useSync();
  const [internalPulse, setInternalPulse] = useState(0);

  // Escuchar eventos de storage para reaccionar a cambios en otras pestañas o procesos
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionData' || e.key === 'personalData') {
        setInternalPulse(p => p + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const status = useMemo(() => {
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return 'active';
    }
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      if (!subData.status) return 'none';
      if (subData.status !== 'active') return 'none';

      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 'active';
      if (Date.now() > expiry) return 'expired';
      return 'active';
    } catch {
      return 'none';
    }
  }, [currentUser?.email, syncPulse, internalPulse]); // Re-calcular si cambia el pulso de sincronización

  const isActive = status === 'active';
  const isPro = !!currentUser && isActive;

  const daysRemaining = useMemo(() => {
    if (!isPro) return 0;
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return Infinity;
    }
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 0;
      return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, [currentUser?.email, isPro, syncPulse, internalPulse]);

  const requirePro = (action: (() => void) | (() => Promise<void>)) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isActive) {
      navigate('/subscribe');
      return;
    }
    if (typeof action === 'function') action();
  };

  return {
    requirePro,
    isPro,
    daysRemaining,
    status,
    isActive,
    loading: false
  };
}
