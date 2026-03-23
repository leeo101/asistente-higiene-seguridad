import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../config';

export function usePaywall() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
  }, [currentUser?.email]);

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
  }, [currentUser?.email, isPro]);

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
    loading: false // Keep for compatibility if needed
  };
}
