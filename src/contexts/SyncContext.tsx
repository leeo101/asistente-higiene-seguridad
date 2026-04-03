import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  pullAllFromCloud,
  mergeLocalToCloud,
  saveCollection,
  saveDocument,
  SYNC_COLLECTIONS,
  SYNC_DOCUMENTS,
  listenToCollection,
  listenToDocument
} from '../services/cloudSync';

// Tipos
interface SyncContextType {
  syncing: boolean;
  lastSync: Date | null;
  syncReady: boolean;
  syncPulse: number;
  syncCollection: (key: string, items: unknown[]) => Promise<void>;
  syncDocument: (key: string, data: Record<string, unknown>) => Promise<void>;
  deleteFromCollection: (key: string, id: string | number) => Promise<unknown[]>;
  pendingCount: number;
}

interface CloudData {
  _timestamp?: number;
  [key: string]: unknown;
}

// Crear contexto con tipo
const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Hook personalizado con tipo
export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync debe ser usado dentro de un SyncProvider');
  }
  return context;
};

// Props del Provider
interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncPulse, setSyncPulse] = useState(0); // Trigger para re-render de componentes

  useEffect(() => {
    if (!currentUser) {
      setSyncReady(true);
      return;
    }

    const syncOnLogin = async () => {
      setSyncing(true);
      try {
        // 1. PRIMERO: Descargar desde el cloud (fuente de verdad)
        await pullAllFromCloud(currentUser.uid);
        setSyncPulse(p => p + 1);
        // 2. DESPUÉS: Subir solo items locales que el cloud NO tiene (merge sin sobreescribir)
        await mergeLocalToCloud(currentUser.uid);
        setLastSync(new Date());
        setSyncPulse(p => p + 1);
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

    // Colecciones (Arrays)
    SYNC_COLLECTIONS.forEach(key => {
      const unsub = listenToCollection(currentUser.uid, key, (items: unknown[]) => {
        const local = JSON.parse(localStorage.getItem(key) || '[]');
        // Solo actualizar si es diferente (evitar loops si nosotros mismos escribimos)
        if (JSON.stringify(local) !== JSON.stringify(items)) {
          localStorage.setItem(key, JSON.stringify(items));
          setSyncPulse(p => p + 1);
        }
      });
      unsubscribes.push(unsub);
    });

    // Documentos (Objetos)
    SYNC_DOCUMENTS.forEach(key => {
      const unsub = listenToDocument(currentUser.uid, key, (data: CloudData | null) => {
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

  /**
   * Guarda/actualiza una colección (array) en localStorage + Firestore.
   * Uso: syncCollection('risk_matrix_history', updatedArray)
   */
  const syncCollection = async (key: string, items: unknown[]): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(items));
    if (currentUser) {
      try {
        await saveCollection(currentUser.uid, key, items);
      } catch (e) {
        console.warn(`[Sync] Error syncing ${key}:`, (e as Error).message);
      }
    }
  };

  /**
   * Guarda un documento simple (objeto) en localStorage + Firestore.
   * Uso: syncDocument('personalData', profileObj)
   */
  const syncDocument = async (key: string, data: Record<string, unknown>): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(data));
    if (currentUser) {
      try {
        await saveDocument(currentUser.uid, key, data);
      } catch (e) {
        console.warn(`[Sync] Error syncing doc ${key}:`, (e as Error).message);
      }
    }
  };

  /**
   * Elimina un item de una colección y sincroniza.
   * Uso: deleteFromCollection('risk_matrix_history', itemId)
   */
  const deleteFromCollection = async (key: string, id: string | number): Promise<unknown[]> => {
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((item: { id: string | number }) => String(item.id) !== String(id));
    await syncCollection(key, updated);
    return updated;
  };

  // Cálculo de documentos pendientes (Simulación basada en marcas de tiempo o cambios no confirmados)
  // Para esta versión, consideramos "pendientes" si no hay lastSync o si hubo actividad reciente
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = () => {
      if (!currentUser) {
        setPendingCount(0);
        return;
      }
      // En una implementación real, compararíamos hashes o marcas de tiempo locales vs cloud
      // Por ahora, simulamos "1" si hay pulso reciente y no hay lastSync reciente (< 10s)
      const isRecentlyActive = lastSync && (new Date().getTime() - lastSync.getTime() < 10000);
      setPendingCount(syncing ? 1 : 0);
    };
    checkPending();
  }, [syncing, lastSync, currentUser]);

  return (
    <SyncContext.Provider value={{ syncing, lastSync, syncReady, syncPulse, syncCollection, syncDocument, deleteFromCollection, pendingCount }}>
      {children}
    </SyncContext.Provider>
  );
};
