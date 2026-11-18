/**
 * cloudSync.ts
 * Funciones para sincronizar datos entre localStorage y Firestore.
 * Estructura: users/{uid}/{collectionKey} -> document con campo "items"
 */

import { db } from '../firebase';
import { safeJsonParse } from '../utils/storageHelper';
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
  try {
    const dirty = new Set(getDirtyKeys());
    dirty.add(key);
    localStorage.setItem(DIRTY_KEYS_STORAGE, JSON.stringify(Array.from(dirty)));
  } catch (e) {
    console.warn('[SyncQueue] No se pudo guardar dirty key:', e);
  }
}

export function removeFromDirty(key: string) {
  try {
    const dirty = new Set(getDirtyKeys());
    dirty.delete(key);
    localStorage.setItem(DIRTY_KEYS_STORAGE, JSON.stringify(Array.from(dirty)));
  } catch (e) {
    console.warn('[SyncQueue] No se pudo remover dirty key:', e);
  }
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
        const items = safeJsonParse<SyncItem[]>(raw, []);
        await saveCollection(uid, key, items);
      } else if (SYNC_DOCUMENTS.includes(key)) {
        const docData = safeJsonParse<SyncDocument>(raw, {});
        await saveDocument(uid, key, docData);
      } else if (SYNC_VALUES.includes(key)) {
        await saveValue(uid, key, raw);
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
    try {
      if (snap.exists()) {
        const data = snap.data() as { items?: T[] };
        callback(data.items || []);
      } else {
        callback([]);
      }
    } catch (err) {
      console.warn(`[cloudSync] Error en callback de listenToCollection(${key}):`, err);
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
    try {
      if (snap.exists()) {
        const data = snap.data() as T & { updatedAt?: number };
        const { updatedAt, ...rest } = data;
        callback(rest as T);
      } else {
        callback(null);
      }
    } catch (err) {
      console.warn(`[cloudSync] Error en callback de listenToDocument(${key}):`, err);
    }
  });
}

/**
 * Escucha cambios en tiempo real en un valor simple guardado con saveValue.
 */
export function listenToValue<T = string | boolean>(
  uid: string,
  key: string,
  callback: SyncCallback<T | null>
): Unsubscribe {
  if (!uid) return () => {};
  
  return onSnapshot(userDocRef(uid, key), (snap: DocumentSnapshot) => {
    try {
      if (snap.exists()) {
        const data = snap.data() as { value?: T };
        callback(data.value ?? null);
      } else {
        callback(null);
      }
    } catch (err) {
      console.warn(`[cloudSync] Error en callback de listenToValue(${key}):`, err);
    }
  });
}

/**
 * Guarda un valor simple (string o bool) envuelto en un objeto.
 */
export async function saveValue<T = string | boolean>(
  uid: string,
  key: string,
  value: T
): Promise<void> {
  if (!uid) return;
  
  try {
    await setDoc(
      userDocRef(uid, key),
      { value, updatedAt: Date.now() },
      { merge: true }
    );
  } catch (error) {
    console.warn(`[Sync] Error saving value ${key}:`, (error as Error).message);
  }
}

/**
 * Carga un valor simple desde Firestore (complemento de saveValue).
 */
export async function getValue<T = string | boolean>(
  uid: string,
  key: string
): Promise<T | null> {
  if (!uid) return null;
  try {
    const snap = await getDoc(userDocRef(uid, key));
    if (snap.exists()) {
      const data = snap.data() as { value?: T };
      return data.value ?? null;
    }
  } catch (error) {
    console.warn(`[Sync] Error loading value ${key}:`, (error as Error).message);
  }
  return null;
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

// Mapeo de categorías para QR público (con claves principales y alternativas)
export const CATEGORY_KEYS_MAP: Record<string, string[]> = {
  'ats': ['ats_history'],
  'camera': ['ai_camera_history'],
  'permit': ['work_permits_history'],
  'checklist': ['tool_checklists_history', 'checklists_history'],
  'fireload': ['fireload_history'],
  'matrix': ['risk_matrix_history'],
  'lighting': ['lighting_history'],
  'accident': ['accident_history'],
  'training': ['training_history', 'training_sessions_db'],
  'extinguisher': ['extintores_inventory', 'extinguishers_inventory', 'extinguisher_ai_history', 'extintores_history'],
  'extintor': ['extintores_inventory', 'extinguishers_inventory', 'extintores_history', 'extinguisher_ai_history'],
  'thermal': ['thermal_history'],
  'drill': ['drills_history', 'ehs_drills_db'],
  'stopcard': ['stop_cards_history'],
  'riskassessment': ['risk_assessment_history', 'risk_assessments_history'],
  'worker': ['workers_data'],
  'pasaporte': ['workers_data'],
  'legajo': ['workers_data'],
  'lifting': ['lifting_plans_db'],
  'loto': ['loto_procedures_db', 'loto_active_db'],
  'riskmap': ['risk_map_history'],
  'audit': ['ehs_audits_db'],
  'capa': ['ehs_capa_db'],
  'medical': ['ehs_medical_db'],
  'ergonomics': ['ergonomics_history'],
  'noise': ['noise_assessments_db'],
  'chemical': ['chemical_safety_db'],
  'confined': ['confined_space_permits_db', 'confined_space_permits'],
  'height': ['working_height_permits_db', 'working_at_height_permits'],
};

/**
 * Enriquecer un documento con los datos profesionales y firma locales antes de compartirlo por QR.
 */
function enrichWithLocalProfile(item: Record<string, unknown>, category?: string): Record<string, unknown> {
  const enriched: Record<string, unknown> = { ...item };
  try {
    const lsPersonal = localStorage.getItem('personalData');
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    const lsLogo = localStorage.getItem('companyLogo');

    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      if (!enriched.professionalName && (pd.name || pd.fullName)) {
        enriched.professionalName = pd.name || pd.fullName;
      }
      if (!enriched.professionalLicense && (pd.license || pd.matricula)) {
        enriched.professionalLicense = pd.license || pd.matricula;
      }
      enriched._sharedPersonalData = pd;
    }
    if (lsStamp) {
      const sd = JSON.parse(lsStamp);
      if (!enriched.professionalSignature && sd.signature) {
        enriched.professionalSignature = sd.signature;
      }
      if (!enriched.professionalStamp && sd.stamp) {
        enriched.professionalStamp = sd.stamp;
      }
      enriched._sharedSignatureStampData = sd;
    } else if (legacySig && !enriched.professionalSignature) {
      enriched.professionalSignature = legacySig;
    }
    if (lsLogo && !enriched._sharedCompanyLogo) {
      enriched._sharedCompanyLogo = lsLogo;
    }

    // Si es un matafuego, adjuntar la última inspección registrada en extintores_history si aún no la tiene
    if (category === 'extintor' || category === 'extinguisher') {
      const histRaw = localStorage.getItem('extintores_history');
      if (histRaw) {
        const hist = JSON.parse(histRaw);
        if (Array.isArray(hist)) {
          const matching = hist.filter(
            (h: any) => String(h.extintorId) === String(item.id) || String(h.id) === String(item.id)
          );
          if (matching.length > 0 && !enriched.lastInspectionData) {
            enriched.lastInspectionData = matching[matching.length - 1];
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
  return enriched;
}

/**
 * Publica un documento específico en la colección pública `public_verifications`
 * para que cualquier persona que escanee el código QR pueda verlo sin iniciar sesión.
 */
export async function publishPublicVerification(
  uid: string,
  category: string,
  docId: string | number,
  explicitData?: Record<string, unknown>
): Promise<boolean> {
  if (!category || !docId) return false;

  let foundItem: Record<string, unknown> | null = explicitData ? { ...explicitData } : null;

  if (!foundItem && typeof window !== 'undefined') {
    const candidateKeys = CATEGORY_KEYS_MAP[category] || [category];
    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find(
            (i: any) =>
              String(i.id) === String(docId) ||
              String(i.numero) === String(docId) ||
              String(i.dni) === String(docId)
          );
          if (match) {
            foundItem = { ...match };
            // Intentar también sincronizar la colección del usuario en segundo plano
            if (uid && uid !== 'guest' && uid !== 'pub') {
              saveCollection(uid, key, parsed).catch(() => {});
            }
            break;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (!foundItem) return false;

  const payload = {
    ...enrichWithLocalProfile(foundItem, category),
    _publicUid: uid || 'guest',
    _publicCategory: category,
    _publicDocId: String(docId),
    updatedAt: Date.now()
  };

  try {
    const safeUid = uid || 'guest';
    const primaryDocId = `${safeUid}_${category}_${docId}`.replace(/[\/\\?#]/g, '_');
    const fallbackDocId = `${category}_${docId}`.replace(/[\/\\?#]/g, '_');

    await setDoc(doc(db, 'public_verifications', primaryDocId), payload, { merge: true });
    await setDoc(doc(db, 'public_verifications', fallbackDocId), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[cloudSync] No se pudo publicar en public_verifications:', (err as Error).message);
    return false;
  }
}

/**
 * Publica un snapshot visual HTML de cualquier documento (#pdf-content) para compartir por QR desde ShareModal.
 */
export async function publishPublicHtmlSnapshot(
  uid: string,
  snapshotId: string,
  title: string,
  htmlContent: string,
  isLandscape = false
): Promise<boolean> {
  if (!snapshotId || !htmlContent) return false;
  try {
    const safeUid = uid || 'guest';
    const docKey = `${safeUid}_snapshot_${snapshotId}`.replace(/[\/\\?#]/g, '_');
    const payload = enrichWithLocalProfile({
      id: snapshotId,
      title,
      htmlSnapshot: htmlContent,
      isLandscape,
      _publicUid: safeUid,
      _publicCategory: 'snapshot',
      _publicDocId: snapshotId,
      updatedAt: Date.now()
    });
    await setDoc(doc(db, 'public_verifications', docKey), payload, { merge: true });
    await setDoc(doc(db, 'public_verifications', `snapshot_${snapshotId}`.replace(/[\/\\?#]/g, '_')), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[cloudSync] Error al guardar snapshot HTML público:', (err as Error).message);
    return false;
  }
}

/**
 * Busca un documento específico en `public_verifications` o dentro de las colecciones del usuario en Firestore.
 * Utilizado por el visor público de QR (sin necesidad de login).
 */
export async function fetchPublicDoc(
  uid: string,
  category: string,
  docId: string | number
): Promise<SyncItem | null> {
  if (!category || !docId) return null;

  const safeUid = uid || 'guest';

  // 1. Intentar leer desde public_verifications (funciona siempre sin login y contiene datos enriquecidos)
  const verificationKeys = [
    `${safeUid}_${category}_${docId}`.replace(/[\/\\?#]/g, '_'),
    `${category}_${docId}`.replace(/[\/\\?#]/g, '_'),
    String(docId).replace(/[\/\\?#]/g, '_')
  ];

  for (const vKey of verificationKeys) {
    try {
      const vSnap = await getDoc(doc(db, 'public_verifications', vKey));
      if (vSnap.exists()) {
        const vData = vSnap.data() as SyncItem;
        return vData;
      }
    } catch {
      /* continue to next candidate */
    }
  }

  // 2. Si el usuario que escanea está en el mismo navegador (o tiene caché local), verificar localStorage
  if (typeof window !== 'undefined') {
    const localKeys = CATEGORY_KEYS_MAP[category] || [category];
    for (const lKey of localKeys) {
      try {
        const raw = localStorage.getItem(lKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const match = parsed.find(
              (i: any) =>
                String(i.id) === String(docId) ||
                String(i.numero) === String(docId) ||
                String(i.dni) === String(docId)
            );
            if (match) return enrichWithLocalProfile(match, category) as SyncItem;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  // 3. Buscar en las colecciones sincronizadas del usuario en Firestore (users/{uid}/data/{key})
  if (uid && uid !== 'guest' && uid !== 'pub') {
    const candidateKeys = CATEGORY_KEYS_MAP[category] || [category];
    for (const firestoreKey of candidateKeys) {
      try {
        const snap = await getDoc(userDocRef(uid, firestoreKey));
        if (snap.exists()) {
          const data = snap.data() as { items?: SyncItem[] };
          const items = data.items || [];
          const found = items.find(
            (i: any) =>
              String(i.id) === String(docId) ||
              String(i.numero) === String(docId) ||
              String(i.dni) === String(docId)
          );
          if (found) {
            // Adjuntar también personalData y signatureStampData del autor desde Firestore
            try {
              const [personalSnap, stampSnap] = await Promise.all([
                getDoc(userDocRef(uid, 'personalData')),
                getDoc(userDocRef(uid, 'signatureStampData'))
              ]);
              const enriched: Record<string, unknown> = { ...found };
              if (personalSnap.exists()) {
                const pd = personalSnap.data();
                enriched._sharedPersonalData = pd;
                if (!enriched.professionalName && (pd.name || pd.fullName)) {
                  enriched.professionalName = pd.name || pd.fullName;
                }
                if (!enriched.professionalLicense && (pd.license || pd.matricula)) {
                  enriched.professionalLicense = pd.license || pd.matricula;
                }
              }
              if (stampSnap.exists()) {
                const sd = stampSnap.data();
                enriched._sharedSignatureStampData = sd;
                if (!enriched.professionalSignature && sd.signature) {
                  enriched.professionalSignature = sd.signature;
                }
                if (!enriched.professionalStamp && sd.stamp) {
                  enriched.professionalStamp = sd.stamp;
                }
              }
              // Si es un extintor, buscar también su última inspección en extintores_history
              if ((category === 'extintor' || category === 'extinguisher') && !enriched.lastInspectionData) {
                try {
                  const histSnap = await getDoc(userDocRef(uid, 'extintores_history'));
                  if (histSnap.exists()) {
                    const histItems = (histSnap.data() as { items?: any[] }).items || [];
                    const matching = histItems.filter(
                      (h: any) => String(h.extintorId) === String(found.id) || String(h.id) === String(found.id)
                    );
                    if (matching.length > 0) {
                      enriched.lastInspectionData = matching[matching.length - 1];
                    }
                  }
                } catch {
                  /* ignore */
                }
              }
              return enriched as SyncItem;
            } catch {
              return found;
            }
          }
        }
      } catch (error) {
        console.warn(
          `[Sync] Error fetching public doc ${category}/${docId} in ${firestoreKey}:`,
          (error as Error).message
        );
      }
    }
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
  'risk_assessment_history',
  'checklists_history',
  'ppe_items',
  'chemical_safety_db',
  'noise_assessments_db',
  'loto_procedures_db',
  'loto_active_db',
  'confined_space_permits',
  'confined_space_permits_db',
  'confined_space_active_db',
  'working_at_height_permits',
  'working_height_permits_db',
  'working_height_active_db',
  'ehs_audits_db',
  'ehs_medical_db',
  'ehs_toolbox_talks',
  'ehs_capa_db',
  'environmental_measurements_db',
  'environmental_stations_db',
  'environmental_incidents_db',
  'risk_map_history',
  'contractors_data',
  'workers_data',
  'extinguishers_inventory',
  'extintores_inventory',
  'extintores_history',
  'accident_history',
  'drills_history',
  'ehs_audit_findings_db',
  'ehs_drills_db',
  'evacuation_simulator_db',
  'fleet_inspections_db',
  'lifting_plans_db',
  'noise_workers_db',
  'safety_calendar_events',
  'stop_cards_history',
  'training_history',
  'training_sessions_db',
  'thermal_history',
  'legislation_favorites',
  'legislation_notes',
  'extinguisher_checks',
  'extinguisher_ai_history'
];


export const SYNC_DOCUMENTS: string[] = [
  'personalData',
  'signatureStampData',
  'subscriptionData',
];

export const SYNC_VALUES: string[] = [
  'companyLogo',
  'showCompanyLogo',
  'primaryColor',
  'secondaryColor',
];

/**
 * Al iniciar sesión: descarga todo desde Firestore → localStorage.
 */
export async function pullAllFromCloud(uid: string): Promise<void> {
  if (!uid) return;
  
  for (const key of SYNC_COLLECTIONS) {
    const items = await loadCollection(uid, key);
    if (items.length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch (e) {
        console.warn(`[cloudSync] Fallo pull setItem en ${key}:`, e);
      }
    }
  }
  
  for (const key of SYNC_DOCUMENTS) {
    const data = await loadDocument(uid, key);
    if (data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`[cloudSync] Fallo pull setItem en ${key}:`, e);
      }
    }
  }

  for (const key of SYNC_VALUES) {
    const val = await getValue(uid, key);
    if (val !== null && val !== undefined) {
      let strVal = String(val);
      // Si por versiones previas vino envuelto en { value: "..." }, desenvolverlo
      if (typeof val === 'object' && val !== null && 'value' in (val as Record<string, unknown>)) {
        strVal = String((val as Record<string, unknown>).value);
      }
      try {
        localStorage.setItem(key, strVal);
      } catch (e) {
        console.warn(`[cloudSync] Fallo pull setItem en ${key}:`, e);
      }
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
        const items = safeJsonParse<SyncItem[]>(raw, []);
        if (items.length > 0) {
          await saveCollection(uid, key, items);
        }
      } catch {
        // ignore
      }
    }
  }
  
  for (const key of SYNC_DOCUMENTS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const docData = safeJsonParse<SyncDocument>(raw, {});
        if (Object.keys(docData).length > 0) {
          await saveDocument(uid, key, docData);
        }
      } catch {
        // ignore
      }
    }
  }

  for (const key of SYNC_VALUES) {
    const raw = localStorage.getItem(key);
    if (raw !== null && raw !== undefined) {
      try {
        await saveValue(uid, key, raw);
      } catch {
        // ignore
      }
    }
  }
}
