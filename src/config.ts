// Tipos de configuración
export interface Config {
  API_BASE_URL: string;
  ADMIN_EMAILS: string[];
}

/**
 * En desarrollo usamos rutas relativas (/api) → el proxy de Vite reenvía a Express :3001.
 * Evita CORS y el error "Origen no autorizado" al abrir la app por IP de red (192.168.x.x).
 * En producción la API vive en el mismo dominio que el frontend.
 */
export const API_BASE_URL: string = import.meta.env.DEV ? '' : '';

export const ADMIN_EMAILS: string[] = [
  'enzorodriguez31@gmail.com',
];
