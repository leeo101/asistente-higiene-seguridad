import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  pullAllFromCloud,
  processSyncQueue,
  markAsDirty,
  getDirtyKeys,
  saveCollection,
  saveDocument,
  SYNC_COLLECTIONS,
  SYNC_DOCUMENTS,
  listenToCollection,
  listenToDocument
} from '../services/cloudSync';

interface SyncContextType {
  syncing: boolean;
  lastSync: Date | null;
  syncReady: boolean;
  syncPulse: number;
  isOnline: boolean;
  pendingCount: number;
  syncCollection: (key: string, items: unknown[]) => Promise<void>;
  syncDocument: (key: string, data: Record<string, unknown>) => Promise<void>;
  deleteFromCollection: (key: string, id: string | number) => Promise<unknown[]>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync debe ser usado dentro de un SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncPulse, setSyncPulse] = useState(0); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // Monitoreo de conexión a internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actualizar el contador de pendientes al cambiar syncPulse o isOnline
  useEffect(() => {
    setPendingCount(getDirtyKeys().length);
  }, [syncPulse, isOnline]);

  // Si recuperamos conexión, procesar cola
  useEffect(() => {
    if (isOnline && currentUser && syncReady) {
      const syncNow = async () => {
        setSyncing(true);
        try {
          await processSyncQueue(currentUser.uid);
          setSyncPulse(p => p + 1);
        } finally {
          setSyncing(false);
        }
      };
      syncNow();
    }
  }, [isOnline, currentUser, syncReady]);

  // Sincronización inicial al loguear
  useEffect(() => {
    if (!currentUser) {
      setSyncReady(true);
      return;
    }

    const syncOnLogin = async () => {
      setSyncing(true);
      try {
        if (navigator.onLine) {
          // 1. Subir pendientes de sesiones previas offline
          await processSyncQueue(currentUser.uid);
          // 2. Traer lo último del servidor
          await pullAllFromCloud(currentUser.uid);
          setLastSync(new Date());
          setSyncPulse(p => p + 1);
        }
      } catch (e) {
        console.warn('[SyncContext] sync error:', (e as Error).message);
      } finally {
        setSyncing(false);
        setSyncReady(true);
      }
    };

    syncOnLogin();
  }, [currentUser?.uid]);

  // Escucha cambios en tiempo real desde otros dispositivos
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];

    SYNC_COLLECTIONS.forEach(key => {
      const unsub = listenToCollection(currentUser.uid, key, (items: unknown[]) => {
        // Ignorar snapshots si tenemos datos sucios locales pendientes de subir
        if (getDirtyKeys().includes(key)) return;

        const local = JSON.parse(localStorage.getItem(key) || '[]');
        if (JSON.stringify(local) !== JSON.stringify(items)) {
          localStorage.setItem(key, JSON.stringify(items));
          setSyncPulse(p => p + 1);
        }
      });
      unsubscribes.push(unsub);
    });

    SYNC_DOCUMENTS.forEach(key => {
      const unsub = listenToDocument(currentUser.uid, key, (data: any) => {
        if (getDirtyKeys().includes(key)) return;

        const local = JSON.parse(localStorage.getItem(key) || 'null');
        if (JSON.stringify(local) !== JSON.stringify(data)) {
          if (data) localStorage.setItem(key, JSON.stringify(data));
          else localStorage.removeItem(key);
          setSyncPulse(p => p + 1);
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(u => u());
  }, [currentUser?.uid]);

  const syncCollection = async (key: string, items: unknown[]): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(items));
    if (currentUser) {
      if (!navigator.onLine) {
        markAsDirty(key);
        setSyncPulse(p => p + 1);
      } else {
        try {
          await saveCollection(currentUser.uid, key, items);
        } catch (e) {
          markAsDirty(key);
          setSyncPulse(p => p + 1);
        }
      }
    }
  };

  const syncDocument = async (key: string, data: Record<string, unknown>): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(data));
    if (currentUser) {
      if (!navigator.onLine) {
        markAsDirty(key);
        setSyncPulse(p => p + 1);
      } else {
        try {
          await saveDocument(currentUser.uid, key, data);
        } catch (e) {
          markAsDirty(key);
          setSyncPulse(p => p + 1);
        }
      }
    }
  };

  const deleteFromCollection = async (key: string, id: string | number): Promise<unknown[]> => {
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((item: { id: string | number }) => String(item.id) !== String(id));
    await syncCollection(key, updated);
    return updated;
  };

  return (
    <SyncContext.Provider value={{ syncing, lastSync, syncReady, syncPulse, isOnline, pendingCount, syncCollection, syncDocument, deleteFromCollection }}>
      {children}
    </SyncContext.Provider>
  );
};
