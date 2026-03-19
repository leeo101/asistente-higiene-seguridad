/**
 * cloudSync.js
 * Funciones para sincronizar datos entre localStorage y Firestore.
 * Estructura: users/{uid}/{collectionKey} -> document con campo "items"
 */
import { db } from '../firebase';
import {
    doc, getDoc, setDoc, updateDoc, onSnapshot
} from 'firebase/firestore';

// ─── Helpers ───────────────────────────────────────────────────────

const userDocRef = (uid, key) => doc(db, 'users', uid, 'data', key);

/**
 * Escucha cambios en tiempo real en un documento de usuario.
 */
export function listenToCollection(uid, key, callback) {
    if (!uid) return () => { };
    return onSnapshot(userDocRef(uid, key), (snap) => {
        if (snap.exists()) {
            callback(snap.data().items || []);
        } else {
            callback([]);
        }
    });
}

/**
 * Escucha cambios en tiempo real en un documento simple.
 */
export function listenToDocument(uid, key, callback) {
    if (!uid) return () => { };
    return onSnapshot(userDocRef(uid, key), (snap) => {
        if (snap.exists()) {
            const { updatedAt, ...rest } = snap.data();
            callback(rest);
        } else {
            callback(null);
        }
    });
}

/**
 * Guarda un array de items a Firestore para el usuario.
 */
export async function saveCollection(uid, key, items) {
    if (!uid) return;
    try {
        await setDoc(userDocRef(uid, key), { items, updatedAt: Date.now() }, { merge: true });
    } catch {

        console.warn(`[Sync] Error saving ${key}:`, e.message);
    }
}
 
 /**
  * Guarda un valor simple (string o bool) envuelto en un objeto.
  */
 export async function saveValue(uid, key, value) {
     if (!uid) return;
     try {
         await setDoc(userDocRef(uid, key), { value, updatedAt: Date.now() }, { merge: true });
     } catch {

         console.warn(`[Sync] Error saving value ${key}:`, e.message);
     }
 }

/**
 * Carga un array de items desde Firestore.
 * Retorna array vacío si no existe.
 */
export async function loadCollection(uid, key) {
    if (!uid) return [];
    try {
        const snap = await getDoc(userDocRef(uid, key));
        if (snap.exists()) return snap.data().items || [];
    } catch {

        console.warn(`[Sync] Error loading ${key}:`, e.message);
    }
    return [];
}

/**
 * Guarda un objeto simple (no array) en Firestore.
 */
export async function saveDocument(uid, key, data) {
    if (!uid) return;
    try {
        await setDoc(userDocRef(uid, key), { ...data, updatedAt: Date.now() }, { merge: true });
    } catch {

        console.warn(`[Sync] Error saving doc ${key}:`, e.message);
    }
}

/**
 * Carga un objeto simple desde Firestore.
 */
export async function loadDocument(uid, key) {
    if (!uid) return null;
    try {
        const snap = await getDoc(userDocRef(uid, key));
        if (snap.exists()) {
            const { updatedAt, ...rest } = snap.data();
            return rest;
        }
    } catch {

        console.warn(`[Sync] Error loading doc ${key}:`, e.message);
    }
    return null;
}

/**
 * Busca un documento específico dentro de una colección en Firestore.
 * Utilizado por el visor público de QR.
 */
export async function fetchPublicDoc(uid, category, docId) {
    if (!uid || !category || !docId) return null;
    
    // Mapeo de categorías amigables a keys de Firestore
    const categoryMap = {
        'ats': 'ats_history',
        'camera': 'ai_camera_history',
        'permit': 'work_permits_history',
        'checklist': 'checklists_history',
        'fireload': 'fireload_history',
        'matrix': 'risk_matrix_history',
        'lighting': 'lighting_history',
    };

    const firestoreKey = categoryMap[category] || category;
    
    try {
        const snap = await getDoc(userDocRef(uid, firestoreKey));
        if (snap.exists()) {
            const items = snap.data().items || [];
            return items.find(i => String(i.id) === String(docId));
        }
    } catch {

        console.error(`[Sync] Error fetching public doc ${category}/${docId}:`, e.message);
    }
    return null;
}
 
 /**
  * Obtiene el logo de un usuario para el visor público.
  */
 export async function fetchPublicLogo(uid) {
     if (!uid) return null;
     try {
         const logoSnap = await getDoc(userDocRef(uid, 'companyLogo'));
         const showSnap = await getDoc(userDocRef(uid, 'showCompanyLogo'));
         
         return {
             logo: logoSnap.exists() ? logoSnap.data().value : null,
             show: showSnap.exists() ? showSnap.data().value : true
         };
     } catch {

         console.error(`[Sync] Error fetching public logo for ${uid}:`, e.message);
     }
     return null;
 }

// ─── Colecciones a sincronizar ──────────────────────────────────────
export const SYNC_COLLECTIONS = [
    'inspections_history',
    'ats_history',
    'fireload_history',
    'risk_matrix_history',
    'reports_history',
    'tool_checklists_history',
    'ai_advisor_history',
    'lighting_history',
    'work_permits_history',
    'ai_camera_history',
    'ergonomics_history',
    'risk_assessments_history',
    'checklists_history',
    'ppe_items',
    'chemical_safety_db',
    'noise_assessments_db',
    'loto_procedures_db',
    'confined_space_permits',
    'working_at_height_permits',
    'ehs_audits_db',
    'ehs_capa_db',
    'environmental_measurements_db',
];

export const SYNC_DOCUMENTS = [
    'personalData',
    'signatureStampData',
    'subscriptionData',
    'companyLogo',
    'showCompanyLogo',
];

/**
 * Al iniciar sesión: descarga todo desde Firestore → localStorage.
 */
export async function pullAllFromCloud(uid) {
    if (!uid) return;
    for (const key of SYNC_COLLECTIONS) {
        const items = await loadCollection(uid, key);
        if (items.length > 0) localStorage.setItem(key, JSON.stringify(items));
    }
    for (const key of SYNC_DOCUMENTS) {
        const data = await loadDocument(uid, key);
        if (data) localStorage.setItem(key, JSON.stringify(data));
    }
}

/**
 * Sube TODO desde localStorage → Firestore (por si tenían datos previos offline).
 */
export async function pushAllToCloud(uid) {
    if (!uid) return;
    for (const key of SYNC_COLLECTIONS) {
        const raw = localStorage.getItem(key);
        if (raw) {
            try { await saveCollection(uid, key, JSON.parse(raw)); } catch { /* ignore */ }
        }
    }
    for (const key of SYNC_DOCUMENTS) {
        const raw = localStorage.getItem(key);
        if (raw) {
            try { await saveDocument(uid, key, JSON.parse(raw)); } catch { /* ignore */ }
        }
    }
}

/**
 * Merge inteligente: el cloud es fuente de verdad.
 * Solo sube items locales que el cloud NO tiene (nuevos creados offline).
 * No sobreescribe borrados ni cambios hechos en otro dispositivo.
 */
export async function mergeLocalToCloud(uid) {
    if (!uid) return;
    for (const key of SYNC_COLLECTIONS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
            const localItems = JSON.parse(raw);
            if (!Array.isArray(localItems) || localItems.length === 0) continue;

            // Obtener items actuales del cloud
            const cloudItems = await loadCollection(uid, key);
            const cloudIds = new Set(cloudItems.map(i => String(i.id)));

            // Solo agregar los que NO existen en el cloud (nuevos locales no subidos)
            const onlyLocal = localItems.filter(i => !cloudIds.has(String(i.id)));

            if (onlyLocal.length > 0) {
                // Merge: cloud tiene prioridad, se agregan items nuevos locales
                const merged = [...cloudItems, ...onlyLocal];
                await saveCollection(uid, key, merged);
                localStorage.setItem(key, JSON.stringify(merged));
            } else if (cloudItems.length > 0) {
                // Si hay datos en cloud pero no hay nuevos locales, usar cloud como verdad
                localStorage.setItem(key, JSON.stringify(cloudItems));
            }
        } catch { /* ignore */ }
    }
    // Para documentos simples: solo subir si el cloud está vacío
    for (const key of SYNC_DOCUMENTS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
            const snap = await loadDocument(uid, key);
            if (!snap) {
                await saveDocument(uid, key, JSON.parse(raw));
            }
        } catch { /* ignore */ }
    }
}
