import { Capacitor } from '@capacitor/core';

// Tipos de configuración
export interface Config {
  API_BASE_URL: string;
}

/**
 * URL base de la API.
 * - En Capacitor (App Android/iOS): Se debe apuntar a la URL de producción (https://asistentehs.com)
 *   porque la WebView corre en http://localhost / capacitor://localhost y un POST relativo causa error 501 (Not Implemented).
 * - En Firebase Hosting alternativo (*.web.app / *.firebaseapp.com): Los endpoints serverless de IA están en Vercel (https://asistentehs.com).
 * - En desarrollo web (localhost:5173 / localhost:4173): Vite proxy reenvía /api a Express :3001 (cadena vacía).
 * - En producción web oficial (asistentehs.com): Las rutas relativas resuelven al mismo dominio (cadena vacía).
 * - Si se define VITE_API_URL en el entorno, tiene máxima prioridad.
 */
export const API_BASE_URL: string = (() => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (Capacitor.isNativePlatform()) {
      return 'https://asistentehs.com';
    }
    const origin = window.location.origin || '';
    const host = window.location.host || '';
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://') || host === 'localhost') {
      return 'https://asistentehs.com';
    }
    if (host.includes('web.app') || host.includes('firebaseapp.com')) {
      return 'https://asistentehs.com';
    }
  }
  return '';
})();
