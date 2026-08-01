import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

const ADMIN_EMAILS = ['admin@asistentehs.com', 'enzorodriguez31@gmail.com'];
const PERMANENT_PRO_EMAILS = ['arielalaniz9@gmail.com'];

// Cuentas con pago mensual específico y su fecha de vencimiento exacta (TIMESTAMP ms)
const SPECIFIC_SUBSCRIPTIONS: Record<string, number> = {
  // Pago recibido el 16 de Julio -> Vence el 15 de Agosto de 2026
  'joaquintunut@gmail.com': new Date('2026-08-15T23:59:59Z').getTime()
};

/**
 * Hook de gestión de acceso PRO y Administración.
 * Maneja accesos permanentes (Admin / Ariel) y suscripciones mensuales con fecha exacta de vencimiento.
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

  // 2. Comprobar email actual
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isEmailAdmin = ADMIN_EMAILS.includes(userEmail);
  const isEmailPermanentPro = PERMANENT_PRO_EMAILS.includes(userEmail);

  // 3. Comprobar vencimiento de suscripción por email específico
  const specificExpiry = SPECIFIC_SUBSCRIPTIONS[userEmail] || null;
  const isSpecificSubValid = specificExpiry !== null && Date.now() <= specificExpiry;

  // 4. Comprobar suscripción local activa
  const localSubData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('subscriptionData') || '{}');
    } catch {
      return {};
    }
  }, [syncPulse, internalPulse]);

  const hasLocalActiveSub = useMemo(() => {
    if (localSubData.status === 'active') return true;
    const expiry = parseInt(localSubData.expiry || '0', 10);
    return expiry > Date.now();
  }, [localSubData]);

  // Roles consolidados
  const isAdmin = isAdminClaim || isEmailAdmin;
  const isPro = isAdmin || isProClaim || isEmailPermanentPro || isSpecificSubValid || hasLocalActiveSub;

  // Sincronizar subscriptionData para cuentas con fecha específica
  useEffect(() => {
    if (specificExpiry && isSpecificSubValid) {
      try {
        localStorage.setItem('subscriptionData', JSON.stringify({
          status: 'active',
          expiry: specificExpiry.toString(),
          provider: 'monthly_payment'
        }));
      } catch (e) {
        console.error('Error al guardar suscripción específica:', e);
      }
    }
  }, [userEmail, specificExpiry, isSpecificSubValid]);

  const daysRemaining = useMemo(() => {
    if (!isPro) return 0;
    if (isAdmin || isEmailPermanentPro) return Infinity;

    const expiryMs = specificExpiry || parseInt(localSubData.expiry || '0', 10);
    if (!expiryMs) return 30;
    return Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [isAdmin, isPro, isEmailPermanentPro, specificExpiry, localSubData, syncPulse, internalPulse]);

  const expiryDate = useMemo(() => {
    if (isAdmin || isEmailPermanentPro) return null;
    const expiryMs = specificExpiry || parseInt(localSubData.expiry || '0', 10);
    return expiryMs ? new Date(expiryMs) : null;
  }, [isAdmin, isEmailPermanentPro, specificExpiry, localSubData, syncPulse, internalPulse]);

  const isExpiringSoon = useMemo(() => {
    if (isAdmin || !isPro || isEmailPermanentPro) return false;
    return daysRemaining > 0 && daysRemaining <= 7;
  }, [isAdmin, isPro, isEmailPermanentPro, daysRemaining]);

  const isExpired = useMemo(() => {
    if (isAdmin || isEmailPermanentPro) return false;
    return !isPro || (daysRemaining === 0 && expiryDate !== null);
  }, [isAdmin, isPro, isEmailPermanentPro, daysRemaining, expiryDate]);

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
