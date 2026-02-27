import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * usePaywall – call this in any page that has premium actions.
 *
 * Subscription lifecycle:
 *   • On payment: Subscription.jsx stores subscriptionStatus='active' + subscriptionExpiry (ms timestamp, 30 days ahead)
 *   • On every requirePro check: expiry is verified
 *   • If expired: clears status and redirects to /subscribe
 */
export function usePaywall() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    /** Returns true if the subscription exists AND has not expired yet */
    const isActive = () => {
        if (localStorage.getItem('subscriptionStatus') !== 'active') return false;
        const expiry = parseInt(localStorage.getItem('subscriptionExpiry') || '0', 10);
        if (!expiry) return true; // legacy: no expiry stored → migration grace period
        if (Date.now() > expiry) {
            // Subscription expired – clean up
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
