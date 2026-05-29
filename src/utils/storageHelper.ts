export const safeSetLocalStorage = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Posible QuotaExceededError debido a imágenes en Base64
        console.warn('LocalStorage lleno. Limpiando reportes viejos...', e);
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('ai_report_full_')) {
                keysToRemove.push(k);
            }
        }
        
        // Mantener al menos la sesión actual limpia, remover todos los históricos completos
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        try {
            localStorage.setItem(key, value);
        } catch (e2) {
            console.error('Storage full even after cleanup', e2);
        }
    }
};
