import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../config';

// Tipos
interface SubscriptionData {
  status?: string;
  expiry?: string;
  [key: string]: unknown;
}

interface UsePaywallReturn {
  requirePro: (action: () => void) => void;
  isPro: () => boolean;
  daysRemaining: () => number | typeof Infinity;
  status: 'active' | 'expired' | 'none';
  isActive: boolean;
}

/**
 * usePaywall – call this in any page that has premium actions.
 */
export function usePaywall(): UsePaywallReturn {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  /** Returns true if the subscription exists AND has not expired yet OR if user is admin */
  const isActive = (): boolean => {
    // Master Bypass for Owner/Admin
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return true;
    }

    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}') as SubscriptionData;
      if (subData.status !== 'active') return false;

      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return true;
      if (Date.now() > expiry) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const requirePro = (action: () => void): void => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isActive()) {
      navigate('/subscribe');
      return;
    }
    if (typeof action === 'function') action();
  };

  const isPro = (): boolean => !!currentUser && isActive();

  /** Days remaining in current subscription period (0 if expired/none) */
  const daysRemaining = (): number | typeof Infinity => {
    if (!isPro()) return 0;

    // Master Bypass for Owner/Admin
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return Infinity;
    }

    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}') as SubscriptionData;
      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 0;
      return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  /** Returns 'active', 'expired', or 'none' */
  const getStatus = (): 'active' | 'expired' | 'none' => {
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return 'active';
    }
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}') as SubscriptionData;
      if (!subData.status) return 'none';
      if (subData.status !== 'active') return 'none';

      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 'active';
      if (Date.now() > expiry) return 'expired';
      return 'active';
    } catch {
      return 'none';
    }
  };

  const status = getStatus();

  return {
    requirePro,
    isPro,
    daysRemaining,
    status,
    isActive: status === 'active'
  };
}
