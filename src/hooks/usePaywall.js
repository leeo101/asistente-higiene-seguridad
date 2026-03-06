import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../config';

/**
 * usePaywall – call this in any page that has premium actions.
 */
export function usePaywall() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    /** Returns true if the subscription exists AND has not expired yet OR if user is admin */
    const isActive = () => {
        // Master Bypass for Owner/Admin
        if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
            return true;
        }

        if (localStorage.getItem('subscriptionStatus') !== 'active') return false;
        const expiry = parseInt(localStorage.getItem('subscriptionExpiry') || '0', 10);
        if (!expiry) return true;
        if (Date.now() > expiry) {
            localStorage.removeItem('subscriptionStatus');
            localStorage.removeItem('subscriptionExpiry');
            return false;
        }
        return true;
    };

    const requirePro = (action) => {
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

    const isPro = () => !!currentUser && isActive();

    /** Days remaining in current subscription period (0 if expired/none) */
    const daysRemaining = () => {
        if (!isPro()) return 0;
        const expiry = parseInt(localStorage.getItem('subscriptionExpiry') || '0', 10);
        if (!expiry) return 30; // legacy
        return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
    };

    return { requirePro, isPro, daysRemaining };
}
