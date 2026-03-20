import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check";

// Configuración de Firebase
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyBzm6eZVk6WdfTJ8--4s6JWH47ytA9i0Mk",
  authDomain: "asistentehs-b594e.firebaseapp.com",
  projectId: "asistentehs-b594e",
  storageBucket: "asistentehs-b594e.firebasestorage.app",
  messagingSenderId: "598244038733",
  appId: "1:598244038733:web:76e8d22d2432afbefea404",
  measurementId: "G-FJMEVTXGW7"
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// ==========================================
// FIREBASE APP CHECK - Protección de API Key
// ==========================================
// Inicializar App Check con reCAPTCHA v3 para verificar que las peticiones
// vienen realmente de tu app y no de scripts maliciosos
// NOTA: App Check es opcional en desarrollo - la app funciona sin él
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LfoT4ssAAAAAB2E7DDBo7FVr8mPVhrjWreWHCSY'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[App Check] Inicializado correctamente con reCAPTCHA v3');
  } catch (error) {
    console.warn(
      '[App Check] Error al inicializar (la app continuará sin App Check):',
      (error as Error).message
    );
  }
} else {
  console.log('[App Check] Skip en localhost - usando Firebase sin App Check');
}

// Exportar instancias de Firebase
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Habilitar persistencia offline para que Firestore encole escrituras
// y permita lecturas al no tener internet
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiples pestañas abiertas, la persistencia solo funciona en una.
    console.warn(
      "Firebase persistence: Multiple tabs open, persistence disabled in this tab."
    );
  } else if (err.code === 'unimplemented') {
    // El navegador actual no soporta todas las funciones requeridas
    console.warn(
      "Firebase persistence: Browser doesn't support indexedDB persistence."
    );
  }
});
