import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { pullAllFromCloud, pushAllToCloud, saveCollection, saveDocument, SYNC_COLLECTIONS, SYNC_DOCUMENTS } from '../services/cloudSync';

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
            } catch (e) {
                console.warn('[SyncContext] sync error:', e.message);
            } finally {
                setSyncing(false);
                setSyncReady(true);
            }
        };

        syncOnLogin();
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
        <SyncContext.Provider value={{ syncing, lastSync, syncReady, syncCollection, syncDocument, deleteFromCollection }}>
            {children}
        </SyncContext.Provider>
    );
};
