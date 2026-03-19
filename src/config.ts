// Tipos de configuración
export interface Config {
  API_BASE_URL: string;
  ADMIN_EMAILS: string[];
}

export const API_BASE_URL: string = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : ''; // En producción usamos la misma URL del frontend (Vercel)

export const ADMIN_EMAILS: string[] = [
  'enzorodriguez31@gmail.com',
];
