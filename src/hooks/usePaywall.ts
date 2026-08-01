import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

const ADMIN_EMAILS = ['admin@asistentehs.com', 'enzorodriguez31@gmail.com'];
const PRO_EMAILS = ['arielalaniz9@gmail.com', 'joaquintunut@gmail.com'];

/**
 * Hook de gestión de acceso PRO y Administración.
 * Combina verificación de Claims del servidor con emails autorizados
 * y datos de suscripción local/nube para evitar des-suscripciones accidentales.
 */
export function usePaywall() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncPulse } = useSync();
  const [internalPulse, setInternalPulse] = useState(0);

  const [isProClaim, setIsProClaim] = useState<boolean>(false);
  const [isAdminClaim, setIsAdminClaim] = useState<boolean>(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // 1. Verificar isPro e isAdmin vía JWT Custom Claims
  useEffect(() => {
    if (currentUser) {
      currentUser.getIdTokenResult(true)
        .then((idTokenResult) => {
          setIsProClaim(!!idTokenResult.claims.isPro);
          setIsAdminClaim(!!idTokenResult.claims.isAdmin);
        })
        .catch((err) => {
          console.error('[Paywall] Error al verificar claims del token:', err);
        })
        .finally(() => setLoadingClaims(false));
    } else {
      setIsProClaim(false);
      setIsAdminClaim(false);
      setLoadingClaims(false);
    }
  }, [currentUser]);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionData' || e.key === 'personalData') {
        setInternalPulse(p => p + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 2. Comprobar email actual en listas autorizadas de Admin y Pro
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isEmailAdmin = ADMIN_EMAILS.includes(userEmail);
  const isEmailPro = PRO_EMAILS.includes(userEmail);

  // 3. Comprobar suscripción local activa
  const hasLocalActiveSub = useMemo(() => {
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      if (subData.status === 'active') return true;
      const expiry = parseInt(subData.expiry || '0', 10);
      return expiry > Date.now();
    } catch {
      return false;
    }
  }, [syncPulse, internalPulse]);

  // roles consolidados
  const isAdmin = isAdminClaim || isEmailAdmin;
  const isPro = isAdmin || isProClaim || isEmailPro || hasLocalActiveSub;

  // Garantizar que cuentas autorizadas guarden estado activo en localStorage
  useEffect(() => {
    if (isPro && (isEmailAdmin || isEmailPro)) {
      try {
        const existing = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
        if (existing.status !== 'active') {
          const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
          localStorage.setItem('subscriptionData', JSON.stringify({
            status: 'active',
            expiry: oneYearFromNow.toString(),
            provider: 'authorized_account'
          }));
        }
      } catch (e) {
        console.error('Error al guardar suscripción autorizada:', e);
      }
    }
  }, [isPro, isEmailAdmin, isEmailPro]);

  const daysRemaining = useMemo(() => {
    if (!isPro) return 0;
    if (isAdmin || isEmailPro) return 365;
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 30;
      return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 30;
    }
  }, [isAdmin, isPro, isEmailPro, syncPulse, internalPulse]);

  const expiryDate = useMemo(() => {
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      const expiry = parseInt(subData.expiry || '0', 10);
      return expiry ? new Date(expiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
      return null;
    }
  }, [syncPulse, internalPulse]);

  const isExpiringSoon = useMemo(() => {
    if (isAdmin || !isPro || isEmailPro) return false;
    return daysRemaining > 0 && daysRemaining <= 7;
  }, [isAdmin, isPro, isEmailPro, daysRemaining]);

  const isExpired = useMemo(() => {
    if (isAdmin || isEmailPro) return false;
    return !isPro;
  }, [isAdmin, isPro, isEmailPro]);

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
    isAdmin,
    daysRemaining,
    isExpiringSoon,
    isExpired,
    expiryDate,
    status,
    isActive,
    loading: loadingClaims
  };
}
