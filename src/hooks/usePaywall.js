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

        try {
            const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
            if (subData.status !== 'active') return false;

            const expiry = parseInt(subData.expiry || '0', 10);
            if (!expiry) return true; // Infinite if not set? Better to return false or handle as legacy
            if (Date.now() > expiry) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
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
        
        // Master Bypass for Owner/Admin
        if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
            return Infinity;
        }

        try {
            const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
            const expiry = parseInt(subData.expiry || '0', 10);
            if (!expiry) return 0;
            return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
        } catch (e) {
            return 0;
        }
    };

    /** Returns 'active', 'expired', or 'none' */
    const getStatus = () => {
        if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
            return 'active';
        }
        try {
            const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
            if (!subData.status) return 'none';
            if (subData.status !== 'active') return 'none'; // Could be 'inactive'
            
            const expiry = parseInt(subData.expiry || '0', 10);
            if (!expiry) return 'active'; // Assume active if status is active but no expiry set
            if (Date.now() > expiry) return 'expired';
            return 'active';
        } catch (e) {
            return 'none';
        }
    };

    const status = getStatus();

    return { 
        requirePro, 
        isPro, 
        daysRemaining, 
        status, // 'active', 'expired', 'none'
        isActive: status === 'active'
    };
}
