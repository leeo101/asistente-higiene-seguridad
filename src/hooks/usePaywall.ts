import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

/**
 * SEGURIDAD: El acceso Pro/Admin se verifica EXCLUSIVAMENTE mediante
 * Firebase Custom Claims (JWT del lado servidor).
 * NO se usan emails hardcodeados ni localStorage para determinar acceso.
 *
 * Para otorgar acceso Pro a un usuario, el backend (Cloud Function / Admin SDK)
 * debe ejecutar:
 *   admin.auth().setCustomUserClaims(uid, { isPro: true })
 *
 * Para otorgar acceso Admin:
 *   admin.auth().setCustomUserClaims(uid, { isPro: true, isAdmin: true })
 */
export function usePaywall() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncPulse } = useSync();
  const [internalPulse, setInternalPulse] = useState(0);

  const [isProClaim, setIsProClaim] = useState<boolean>(false);
  const [isAdminClaim, setIsAdminClaim] = useState<boolean>(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // Verificar isPro e isAdmin via server-side JWT claims (fuente de verdad segura)
  useEffect(() => {
    if (currentUser) {
      // force: true refresca el token desde el servidor, ignorando caché local
      currentUser.getIdTokenResult(true)
        .then((idTokenResult) => {
          setIsProClaim(!!idTokenResult.claims.isPro);
          setIsAdminClaim(!!idTokenResult.claims.isAdmin);
        })
        .catch((err) => {
          console.error('[Paywall] Error al verificar claims del token:', err);
          setIsProClaim(false);
          setIsAdminClaim(false);
        })
        .finally(() => setLoadingClaims(false));
    } else {
      setIsProClaim(false);
      setIsAdminClaim(false);
      setLoadingClaims(false);
    }
  }, [currentUser]);

  // Escuchar cambios en subscriptionData solo para calcular daysRemaining
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionData' || e.key === 'personalData') {
        setInternalPulse(p => p + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // isPro e isAdmin vienen únicamente del JWT verificado por Firebase
  const isAdmin = isAdminClaim;
  const isPro = isAdminClaim || isProClaim;

  const daysRemaining = useMemo(() => {
    if (!isPro) return 0;
    if (isAdmin) return Infinity;
    try {
      const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
      const expiry = parseInt(subData.expiry || '0', 10);
      if (!expiry) return 0;
      return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, [isAdmin, isPro, syncPulse, internalPulse]);

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
    status,
    isActive,
    loading: loadingClaims
  };
}
