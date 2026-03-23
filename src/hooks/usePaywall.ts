import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function usePaywall() {
  const { currentUser } = useAuth();
  const [isPro, setIsPro] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    try {
      // Mocked logic for now, should be replaced with real subscription check
      // Ensure it always returns a boolean
      const status = localStorage.getItem('subscriptionStatus');
      const isCurrentlyPro = status === 'active';
      
      setIsPro(isCurrentlyPro);
      setDaysRemaining(isCurrentlyPro ? 30 : 0);
    } catch (error) {
      console.error('[usePaywall] Error checking status:', error);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { 
    isPro: Boolean(isPro), 
    daysRemaining: Number(daysRemaining), 
    loading: Boolean(loading) 
  };
}
