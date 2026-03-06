import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBzm6eZVk6WdfTJ8--4s6JWH47ytA9i0Mk",
    authDomain: "asistentehs-b594e.firebaseapp.com",
    projectId: "asistentehs-b594e",
    storageBucket: "asistentehs-b594e.firebasestorage.app",
    messagingSenderId: "598244038733",
    appId: "1:598244038733:web:76e8d22d2432afbefea404",
    measurementId: "G-FJMEVTXGW7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilitar persistencia offline para que Firestore encole escrituras y permita lecturas al no tener internet
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Múltiples pestañas abiertas, la persistencia solo funciona en una.
        console.warn("Firebase persistence: Multiple tabs open, persistence disabled in this tab.");
    } else if (err.code == 'unimplemented') {
        // El navegador actual no soporta todas las funciones requeridas para habilitar la persistencia
        console.warn("Firebase persistence: Browser doesn't support indexedDB persistence.");
    }
});
