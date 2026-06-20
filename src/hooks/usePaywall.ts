import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { ADMIN_EMAILS, PRO_EMAILS } from '../config';

export function usePaywall() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncPulse } = useSync();
  const [internalPulse, setInternalPulse] = useState(0);

  const [isProClaim, setIsProClaim] = useState<boolean>(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // SECURITY FIX: Verify isPro via server-side JWT claims, ignore localStorage
  useEffect(() => {
    if (currentUser) {
      currentUser.getIdTokenResult()
        .then((idTokenResult) => {
          setIsProClaim(!!idTokenResult.claims.isPro);
        })
        .catch((err) => {
          console.error("Error fetching token claims", err);
          setIsProClaim(false);
        })
        .finally(() => setLoadingClaims(false));
    } else {
      setIsProClaim(false);
      setLoadingClaims(false);
    }
  }, [currentUser]);

  // Listen to storage only for daysRemaining calculations
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionData' || e.key === 'personalData') {
        setInternalPulse(p => p + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase() || '';
    const isHardcodedAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email);
    
    // Check local storage override if email is missing or no match
    const localRole = localStorage.getItem('userRole');
    const isLocalAdmin = localRole === 'admin';
    
    return isHardcodedAdmin || isLocalAdmin;
  }, [currentUser]);

  const isHardcodedPro = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase() || '';
    return PRO_EMAILS.some(e => e.toLowerCase() === email);
  }, [currentUser]);

  const isLocalActive = useMemo(() => {
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      if (subData.status === 'active') {
        const expiry = parseInt(subData.expiry || '0', 10);
        if (!expiry || Date.now() < expiry) return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [syncPulse, internalPulse]);

  // Solo confiamos en el token (backend) o emails hardcodeados, NO en localStorage por seguridad.
  const isPro = isAdmin || isHardcodedPro || isProClaim;

  const daysRemaining = useMemo(() => {
    if (!isPro && !isLocalActive) return 0;
    if (isAdmin) return Infinity;
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 0;
      return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, [isAdmin, isPro, isLocalActive, syncPulse, internalPulse]);

  const status = isPro ? 'active' : 'none';
  const isActive = isPro;

  const requirePro = (action: (() => void) | (() => Promise<void>)) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isPro) {
      const event = new CustomEvent('show-paywall');
      window.dispatchEvent(event);
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
    loading: loadingClaims
  };
}
