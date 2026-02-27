import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * usePaywall – call this in any page that has premium actions.
 *
 * Returns:  requirePro(action)
 *   • If user is NOT logged in → redirects to /login
 *   • If user IS logged in but NOT subscribed → redirects to /subscribe
 *   • Otherwise → runs action()
 *
 * Usage:
 *   const { requirePro } = usePaywall();
 *   <button onClick={() => requirePro(() => window.print())}>Imprimir</button>
 */
export function usePaywall() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const requirePro = (action) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') {
            navigate('/subscribe');
            return;
        }
        if (typeof action === 'function') action();
    };

    const isPro = () => {
        return !!currentUser && localStorage.getItem('subscriptionStatus') === 'active';
    };

    return { requirePro, isPro };
}
