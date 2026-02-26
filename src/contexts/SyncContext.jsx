import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { pullAllFromCloud, pushAllToCloud, saveCollection, saveDocument, SYNC_COLLECTIONS, SYNC_DOCUMENTS, listenToCollection, listenToDocument } from '../services/cloudSync';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

/**
 * SyncProvider
 * - Al hacer login: descarga datos de Firestore y los escribe en localStorage.
 * - Sube los datos locales pendientes al cloud cuando hay usuario logueado.
 * - Expone `syncCollection` y `syncDocument` para guardar en tiempo real.
 */
export const SyncProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
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
                // 1. Upload local data (migración inicial offline → cloud)
                await pushAllToCloud(currentUser.uid);
                // 2. Download cloud data into localStorage (sobreescribe con datos del cloud)
                await pullAllFromCloud(currentUser.uid);
                setLastSync(new Date());
                setSyncPulse(p => p + 1);
            } catch (e) {
                console.warn('[SyncContext] sync error:', e.message);
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

        const unsubscribes = [];

        // Colecciones (Arrays)
        SYNC_COLLECTIONS.forEach(key => {
            const unsub = listenToCollection(currentUser.uid, key, (items) => {
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
            const unsub = listenToDocument(currentUser.uid, key, (data) => {
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
    const syncCollection = async (key, items) => {
        localStorage.setItem(key, JSON.stringify(items));
        if (currentUser) {
            try {
                await saveCollection(currentUser.uid, key, items);
            } catch (e) {
                console.warn(`[Sync] Error syncing ${key}:`, e.message);
            }
        }
    };

    /**
     * Guarda un documento simple (objeto) en localStorage + Firestore.
     * Uso: syncDocument('personalData', profileObj)
     */
    const syncDocument = async (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        if (currentUser) {
            try {
                await saveDocument(currentUser.uid, key, data);
            } catch (e) {
                console.warn(`[Sync] Error syncing doc ${key}:`, e.message);
            }
        }
    };

    /**
     * Elimina un item de una colección y sincroniza.
     * Uso: deleteFromCollection('risk_matrix_history', itemId)
     */
    const deleteFromCollection = async (key, id) => {
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = current.filter(item => String(item.id) !== String(id));
        await syncCollection(key, updated);
        return updated;
    };

    return (
        <SyncContext.Provider value={{ syncing, lastSync, syncReady, syncPulse, syncCollection, syncDocument, deleteFromCollection }}>
            {children}
        </SyncContext.Provider>
    );
};
