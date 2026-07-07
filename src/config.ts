// Tipos de configuración
export interface Config {
  API_BASE_URL: string;
  ADMIN_EMAILS: string[];
}

/**
 * Usamos rutas relativas (/api) en todos los entornos.
 * - En desarrollo: el proxy de Vite reenvía a Express :3001.
 * - En producción (Firebase Hosting): firebase.json reescribe /api a Cloud Functions.
 */
export const API_BASE_URL: string = '';

export const ADMIN_EMAILS: string[] = [
  'enzorodriguez31@gmail.com',
];

export const PRO_EMAILS: string[] = [
  'arielalaniz9@gmail.com',
];

