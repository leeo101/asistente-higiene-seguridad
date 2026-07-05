// ─── useOfflineQueue ─────────────────────────────────────────────────────────
// Cola de escritura offline con sincronización automática al reconectar.
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export interface QueuedAction {
  id: string;
  key: string;           // localStorage key destino
  data: unknown;         // dato a guardar
  timestamp: number;
  label: string;         // descripción legible para el usuario
}

const QUEUE_KEY = 'hys_offline_queue';

function loadQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>(loadQueue);
  const justCameOnline = useRef(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      justCameOnline.current = true;
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('📴 Sin conexión — tus cambios se guardarán automáticamente', {
        duration: 4000,
        icon: '⚡',
        style: { fontWeight: 700, fontSize: '0.85rem' }
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flush queue when coming back online
  useEffect(() => {
    if (isOnline && justCameOnline.current && queue.length > 0) {
      justCameOnline.current = false;
      flushQueue();
    }
  }, [isOnline, queue]);

  const flushQueue = useCallback(() => {
    const current = loadQueue();
    if (current.length === 0) return;

    const toastId = toast.loading(`🔄 Sincronizando ${current.length} elemento${current.length !== 1 ? 's' : ''} guardado${current.length !== 1 ? 's' : ''} offline...`);

    let synced = 0;
    current.forEach(action => {
      try {
        const existing = JSON.parse(localStorage.getItem(action.key) || '[]');
        const updated = Array.isArray(existing) ? [action.data, ...existing] : action.data;
        localStorage.setItem(action.key, JSON.stringify(updated));
        synced++;
      } catch (e) {
        console.error('[OfflineQueue] Error al sincronizar:', e);
      }
    });

    saveQueue([]);
    setQueue([]);

    toast.success(`✅ ${synced} elemento${synced !== 1 ? 's' : ''} sincronizado${synced !== 1 ? 's' : ''} correctamente`, {
      id: toastId,
      duration: 3000
    });

    // Trigger storage event so other components update
    window.dispatchEvent(new Event('storage'));
  }, []);

  /**
   * Encola una acción de guardado.
   * Si hay conexión, la aplica directamente.
   * Si no hay conexión, la guarda en la cola offline.
   */
  const enqueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const full: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now()
    };

    if (navigator.onLine) {
      // Aplicar directamente
      try {
        const existing = JSON.parse(localStorage.getItem(action.key) || '[]');
        const updated = Array.isArray(existing) ? [action.data, ...existing] : action.data;
        localStorage.setItem(action.key, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('[OfflineQueue] Error al guardar:', e);
      }
    } else {
      // Guardar en cola
      const current = loadQueue();
      const updated = [full, ...current];
      saveQueue(updated);
      setQueue(updated);
      toast(`💾 "${action.label}" guardado offline`, {
        duration: 3000,
        icon: '📴',
        style: { fontWeight: 700, fontSize: '0.82rem' }
      });
    }
  }, []);

  const clearQueue = useCallback(() => {
    saveQueue([]);
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    queueCount: queue.length,
    enqueue,
    flushQueue,
    clearQueue
  };
}
