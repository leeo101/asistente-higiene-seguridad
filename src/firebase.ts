import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

// ─── Validación de variables de entorno ──────────────────────────────────────
// Todas las claves deben venir desde .env (VITE_*), NUNCA hardcodeadas.
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    console.error(`[Firebase] Variable de entorno faltante: ${key}`);
  }
}

// ─── Configuración de Firebase (desde .env) ───────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // opcional
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// ─── Firebase App Check ──────────────────────────────────────────────────────
// Protege la API contra accesos no autorizados con reCAPTCHA v3.
// Solo activa en producción (no en localhost).
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('[App Check] Inicializado con reCAPTCHA v3');
    } catch (error) {
      console.warn('[App Check] Error al inicializar:', (error as Error).message);
    }
  } else {
    console.warn('[App Check] VITE_RECAPTCHA_SITE_KEY no definida — App Check desactivado');
  }
} else {
  console.log('[App Check] Skip en localhost');
}

// ─── Exportar instancias ──────────────────────────────────────────────────────
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// ─── Firebase Cloud Messaging (opcional) ─────────────────────────────────────
let messagingInstance: Messaging | null = null;
export const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (supported) {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  }
  return null;
};

// ─── Persistencia offline ────────────────────────────────────────────────────
// Permite que Firestore encole escrituras y permita lecturas sin internet.
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firestore] Múltiples pestañas abiertas — persistencia desactivada en esta pestaña.');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore] El navegador no soporta persistencia IndexedDB.');
  }
});
