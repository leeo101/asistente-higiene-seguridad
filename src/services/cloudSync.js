/**
 * cloudSync.js
 * Funciones para sincronizar datos entre localStorage y Firestore.
 * Estructura: users/{uid}/{collectionKey} -> document con campo "items"
 */
import { db } from '../firebase';
import {
    doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';

// ─── Helpers ───────────────────────────────────────────────────────

const userDocRef = (uid, key) => doc(db, 'users', uid, 'data', key);

/**
 * Guarda un array de items a Firestore para el usuario.
 */
export async function saveCollection(uid, key, items) {
    if (!uid) return;
    try {
        await setDoc(userDocRef(uid, key), { items, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
        console.warn(`[Sync] Error saving ${key}:`, e.message);
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
        console.warn(`[Sync] Error loading doc ${key}:`, e.message);
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
];

export const SYNC_DOCUMENTS = [
    'personalData',
    'signatureStampData',
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
