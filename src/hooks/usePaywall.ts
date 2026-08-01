import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { evaluateProAccess } from '../config/proAccountsRegistry';

/**
 * Hook de gestión de acceso PRO y Administración.
 * Combina verificación de Claims del servidor con el registro central de cuentas autorizadas
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

  // 2. Comprobar email actual en el registro central blindado
  const registryEval = useMemo(() => {
    return evaluateProAccess(currentUser?.email);
  }, [currentUser]);

  // 3. Comprobar suscripción local activa
  const localSubData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('subscriptionData') || '{}');
    } catch {
      return {};
    }
  }, [syncPulse, internalPulse]);

  const hasLocalActiveSub = useMemo(() => {
    // SEGURIDAD: localStorage solo es un caché auxiliar, NUNCA fuente de verdad primaria.
    // Se usa solo para determinar días restantes cuando el JWT ya confirmó acceso Pro.
    if (localSubData.status === 'active') return true;
    const expiry = parseInt(localSubData.expiry || '0', 10);
    return expiry > Date.now();
  }, [localSubData]);

  // Roles consolidados (Servidor JWT + Registro Blindado solamente)
  // hasLocalActiveSub NO otorga isPro por sí solo — previene manipulación del localStorage
  const isAdmin = isAdminClaim || registryEval.isAdmin;
  const isPro = isAdmin || isProClaim || registryEval.isPro;

  // Auto-reparación de localStorage para cuentas validadas
  useEffect(() => {
    if (currentUser && registryEval.isPro) {
      try {
        const expiryToSave = registryEval.expiry || (Date.now() + 365 * 24 * 60 * 60 * 1000);
        localStorage.setItem('subscriptionData', JSON.stringify({
          status: 'active',
          expiry: expiryToSave.toString(),
          provider: registryEval.isAdmin ? 'admin' : 'authorized_pro'
        }));
      } catch (e) {
        console.error('Error al guardar datos de suscripción autorizada:', e);
      }
    }
  }, [currentUser, registryEval]);

  const daysRemaining = useMemo(() => {
    if (!isPro) return 0;
    if (isAdmin || (registryEval.isPro && !registryEval.expiry)) return Infinity;

    const expiryMs = registryEval.expiry || parseInt(localSubData.expiry || '0', 10);
    if (!expiryMs) return 30;
    return Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [isAdmin, isPro, registryEval, localSubData, syncPulse, internalPulse]);

  const expiryDate = useMemo(() => {
    if (isAdmin || (registryEval.isPro && !registryEval.expiry)) return null;
    const expiryMs = registryEval.expiry || parseInt(localSubData.expiry || '0', 10);
    return expiryMs ? new Date(expiryMs) : null;
  }, [isAdmin, registryEval, localSubData, syncPulse, internalPulse]);

  const isExpiringSoon = useMemo(() => {
    if (isAdmin || !isPro || (registryEval.isPro && !registryEval.expiry)) return false;
    return daysRemaining > 0 && daysRemaining <= 7;
  }, [isAdmin, isPro, registryEval, daysRemaining]);

  const isExpired = useMemo(() => {
    if (isAdmin || (registryEval.isPro && !registryEval.expiry)) return false;
    return !isPro || (daysRemaining === 0 && expiryDate !== null);
  }, [isAdmin, isPro, registryEval, daysRemaining, expiryDate]);

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
