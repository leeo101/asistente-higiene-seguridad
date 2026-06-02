/**
 * cloudSync.ts
 * Funciones para sincronizar datos entre localStorage y Firestore.
 * Estructura: users/{uid}/{collectionKey} -> document con campo "items"
 */

import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';

// Tipos
export interface SyncItem {
  id: string | number;
  [key: string]: unknown;
}

export interface SyncDocument {
  updatedAt?: number;
  [key: string]: unknown;
}

export type SyncCallback<T> = (data: T) => void;

// Helpers
const userDocRef = (uid: string, key: string) => doc(db, 'users', uid, 'data', key);

/**
 * Dirty Queue Management (Offline Sync)
 */
const DIRTY_KEYS_STORAGE = 'ehs_dirty_keys';

export function getDirtyKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DIRTY_KEYS_STORAGE) || '[]');
  } catch {
    return [];
  }
}

export function markAsDirty(key: string) {
  const dirty = new Set(getDirtyKeys());
  dirty.add(key);
  localStorage.setItem(DIRTY_KEYS_STORAGE, JSON.stringify(Array.from(dirty)));
}

export function removeFromDirty(key: string) {
  const dirty = new Set(getDirtyKeys());
  dirty.delete(key);
  localStorage.setItem(DIRTY_KEYS_STORAGE, JSON.stringify(Array.from(dirty)));
}

/**
 * Process the Dirty Queue (uploads everything that failed while offline)
 */
export async function processSyncQueue(uid: string): Promise<void> {
  if (!uid) return;
  const dirtyKeys = getDirtyKeys();
  if (dirtyKeys.length === 0) return;

  for (const key of dirtyKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) {
        removeFromDirty(key);
        continue;
    }
    
    try {
      if (SYNC_COLLECTIONS.includes(key)) {
        await saveCollection(uid, key, JSON.parse(raw));
      } else if (SYNC_DOCUMENTS.includes(key)) {
        await saveDocument(uid, key, JSON.parse(raw));
      }
      removeFromDirty(key);
    } catch (e) {
      console.warn(`[SyncQueue] Fallo al sincronizar pendiente ${key}`, e);
    }
  }
}

/**
 * Escucha cambios en tiempo real en un documento de usuario.
 */
export function listenToCollection<T = SyncItem>(
  uid: string,
  key: string,
  callback: SyncCallback<T[]>
): Unsubscribe {
  if (!uid) return () => {};
  
  return onSnapshot(userDocRef(uid, key), (snap: DocumentSnapshot) => {
    if (snap.exists()) {
      const data = snap.data() as { items?: T[] };
      callback(data.items || []);
    } else {
      callback([]);
    }
  });
}

/**
 * Escucha cambios en tiempo real en un documento simple.
 */
export function listenToDocument<T = SyncDocument>(
  uid: string,
  key: string,
  callback: SyncCallback<T | null>
): Unsubscribe {
  if (!uid) return () => {};
  
  return onSnapshot(userDocRef(uid, key), (snap: DocumentSnapshot) => {
    if (snap.exists()) {
      const data = snap.data() as T & { updatedAt?: number };
      const { updatedAt, ...rest } = data;
      callback(rest as T);
    } else {
      callback(null);
    }
  });
}

/**
 * Guarda un array de items a Firestore para el usuario.
 */
export async function saveCollection<T = SyncItem>(
  uid: string,
  key: string,
  items: T[]
): Promise<void> {
  if (!uid) return;
  await setDoc(
    userDocRef(uid, key),
    { items, updatedAt: Date.now() },
    { merge: true }
  );
}

/**
 * Carga un array de items desde Firestore.
 * Retorna array vacío si no existe.
 */
export async function loadCollection<T = SyncItem>(
  uid: string,
  key: string
): Promise<T[]> {
  if (!uid) return [];
  
  try {
    const snap = await getDoc(userDocRef(uid, key));
    if (snap.exists()) {
      const data = snap.data() as { items?: T[] };
      return data.items || [];
    }
  } catch (error) {
    console.warn(`[Sync] Error loading ${key}:`, (error as Error).message);
  }
  
  return [];
}

/**
 * Guarda un objeto simple (no array) en Firestore.
 */
export async function saveDocument<T = SyncDocument>(
  uid: string,
  key: string,
  data: T
): Promise<void> {
  if (!uid) return;
  await setDoc(
    userDocRef(uid, key),
    { ...data, updatedAt: Date.now() },
    { merge: true }
  );
}

/**
 * Carga un objeto simple desde Firestore.
 */
export async function loadDocument<T = SyncDocument>(
  uid: string,
  key: string
): Promise<T | null> {
  if (!uid) return null;
  
  try {
    const snap = await getDoc(userDocRef(uid, key));
    if (snap.exists()) {
      const data = snap.data() as T & { updatedAt?: number };
      const { updatedAt, ...rest } = data;
      return rest as T;
    }
  } catch (error) {
    console.warn(`[Sync] Error loading doc ${key}:`, (error as Error).message);
  }
  
  return null;
}

// Mapeo de categorías para QR público
const categoryMap: Record<string, string> = {
  'ats': 'ats_history',
  'camera': 'ai_camera_history',
  'permit': 'work_permits_history',
  'checklist': 'checklists_history',
  'fireload': 'fireload_history',
  'matrix': 'risk_matrix_history',
  'lighting': 'lighting_history',
};

/**
 * Busca un documento específico dentro de una colección en Firestore.
 * Utilizado por el visor público de QR.
 */
export async function fetchPublicDoc(
  uid: string,
  category: string,
  docId: string | number
): Promise<SyncItem | null> {
  if (!uid || !category || !docId) return null;

  const firestoreKey = categoryMap[category] || category;

  try {
    const snap = await getDoc(userDocRef(uid, firestoreKey));
    if (snap.exists()) {
      const data = snap.data() as { items?: SyncItem[] };
      const items = data.items || [];
      return items.find(i => String(i.id) === String(docId)) || null;
    }
  } catch (error) {
    console.error(
      `[Sync] Error fetching public doc ${category}/${docId}:`,
      (error as Error).message
    );
  }
  
  return null;
}

/**
 * Obtiene el logo de un usuario para el visor público.
 */
export async function fetchPublicLogo(
  uid: string
): Promise<{ logo: string | null; show: boolean } | null> {
  if (!uid) return null;
  
  try {
    const logoSnap = await getDoc(userDocRef(uid, 'companyLogo'));
    const showSnap = await getDoc(userDocRef(uid, 'showCompanyLogo'));

    return {
      logo: logoSnap.exists() ? (logoSnap.data().value as string) : null,
      show: showSnap.exists() ? (showSnap.data().value as boolean) : true
    };
  } catch (error) {
    console.error(
      `[Sync] Error fetching public logo for ${uid}:`,
      (error as Error).message
    );
  }
  
  return null;
}

// ─── Colecciones a sincronizar ──────────────────────────────────────
export const SYNC_COLLECTIONS: string[] = [
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
  'risk_map_history',
  'contractors_data',
  'workers_data',
];


export const SYNC_DOCUMENTS: string[] = [
  'personalData',
  'signatureStampData',
  'subscriptionData',
  'companyLogo',
  'showCompanyLogo',
];

/**
 * Al iniciar sesión: descarga todo desde Firestore → localStorage.
 */
export async function pullAllFromCloud(uid: string): Promise<void> {
  if (!uid) return;
  
  for (const key of SYNC_COLLECTIONS) {
    const items = await loadCollection(uid, key);
    if (items.length > 0) {
      localStorage.setItem(key, JSON.stringify(items));
    }
  }
  
  for (const key of SYNC_DOCUMENTS) {
    const data = await loadDocument(uid, key);
    if (data) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
}

/**
 * Sube TODO desde localStorage → Firestore (Force Sync / Backup).
 */
export async function pushAllToCloud(uid: string): Promise<void> {
  if (!uid) return;
  
  for (const key of SYNC_COLLECTIONS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        await saveCollection(uid, key, JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }
  
  for (const key of SYNC_DOCUMENTS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        await saveDocument(uid, key, JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }
}
