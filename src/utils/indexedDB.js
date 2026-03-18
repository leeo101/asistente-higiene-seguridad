/**
 * IndexedDB Utility - Almacenamiento local estructurado para modo offline
 * Permite guardar y recuperar datos complejos cuando no hay conexión
 */

const DB_NAME = 'asistente-hys-db';
const DB_VERSION = 1;

// Stores disponibles
const STORES = {
    ATS: 'ats',
    FIRE_LOAD: 'fireLoad',
    INSPECTIONS: 'inspections',
    REPORTS: 'reports',
    MATRICES: 'matrices',
    CHECKLISTS: 'checklists',
    SYNC_QUEUE: 'syncQueue' // Cola para sincronizar cuando vuelva la conexión
};

let dbInstance = null;

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[IndexedDB] Error opening database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Crear stores si no existen
            if (!db.objectStoreNames.contains(STORES.ATS)) {
                db.createObjectStore(STORES.ATS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.FIRE_LOAD)) {
                db.createObjectStore(STORES.FIRE_LOAD, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.INSPECTIONS)) {
                db.createObjectStore(STORES.INSPECTIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.REPORTS)) {
                db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.MATRICES)) {
                db.createObjectStore(STORES.MATRICES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.CHECKLISTS)) {
                db.createObjectStore(STORES.CHECKLISTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
}

/**
 * Guarda un item en IndexedDB
 * @param {string} storeName - Nombre del store
 * @param {Object} data - Datos a guardar
 * @returns {Promise<void>}
 */
export async function saveToDB(storeName, data) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[IndexedDB] Error saving to DB:', error);
        throw error;
    }
}

/**
 * Obtiene un item de IndexedDB
 * @param {string} storeName - Nombre del store
 * @param {string} id - ID del item
 * @returns {Promise<Object|null>}
 */
export async function getFromDB(storeName, id) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[IndexedDB] Error getting from DB:', error);
        throw error;
    }
}

/**
 * Obtiene todos los items de un store
 * @param {string} storeName - Nombre del store
 * @returns {Promise<Array>}
 */
export async function getAllFromDB(storeName) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[IndexedDB] Error getting all from DB:', error);
        throw error;
    }
}

/**
 * Elimina un item de IndexedDB
 * @param {string} storeName - Nombre del store
 * @param {string} id - ID del item
 * @returns {Promise<void>}
 */
export async function deleteFromDB(storeName, id) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[IndexedDB] Error deleting from DB:', error);
        throw error;
    }
}

/**
 * Agrega un item a la cola de sincronización
 * @param {Object} item - Item para sincronizar
 * @returns {Promise<void>}
 */
export async function addToSyncQueue(item) {
    return saveToDB(STORES.SYNC_QUEUE, {
        ...item,
        timestamp: Date.now()
    });
}

/**
 * Obtiene todos los items pendientes de sincronización
 * @returns {Promise<Array>}
 */
export async function getSyncQueue() {
    return getAllFromDB(STORES.SYNC_QUEUE);
}

/**
 * Limpia la cola de sincronización después de sincronizar
 * @returns {Promise<void>}
 */
export async function clearSyncQueue() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Exporta todos los datos para backup
 * @returns {Promise<Object>}
 */
export async function exportAllData() {
    const data = {};
    for (const [key, value] of Object.entries(STORES)) {
        if (key !== 'SYNC_QUEUE') {
            data[value] = await getAllFromDB(value);
        }
    }
    return data;
}

/**
 * Importa datos desde un backup
 * @param {Object} data - Datos a importar
 * @returns {Promise<void>}
 */
export async function importAllData(data) {
    for (const [storeName, items] of Object.entries(data)) {
        for (const item of items) {
            await saveToDB(storeName, item);
        }
    }
}

// Exportar STORES para uso externo
export { STORES };
