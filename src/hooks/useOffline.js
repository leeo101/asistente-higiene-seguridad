import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar estado de conexión offline/online
 * @returns {boolean} true si está offline, false si está online
 */
export function useOffline() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        // Funciones para manejar eventos de conexión
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        // Escuchar eventos de conexión
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOffline;
}

/**
 * Hook para obtener el estado detallado de conexión
 * @returns {Object} { isOffline, isOnline, wasOffline }
 */
export function useConnectionStatus() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            if (wasOffline) {
                setWasOffline(false);
            }
        };
        const handleOffline = () => {
            setIsOffline(true);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    return {
        isOffline,
        isOnline: !isOffline,
        wasOffline
    };
}

export default useOffline;
