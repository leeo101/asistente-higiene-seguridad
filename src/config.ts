// Tipos de configuración
export interface Config {
  API_BASE_URL: string;
  // NOTA DE SEGURIDAD: Los emails de admin/pro ya NO se gestionan aquí.
  // El control de acceso se realiza ÚNICAMENTE mediante:
  //   1. Firebase Custom Claims (isPro, isAdmin) verificados por el backend.
  //   2. Firestore Security Rules en el servidor.
  // Ninguna lista de emails en el cliente es segura porque puede ser
  // leída desde el bundle JS minificado.
}

/**
 * URL base de la API.
 * - En desarrollo: Vite proxy reenvía /api a Express :3001.
 * - En producción (Firebase Hosting): firebase.json reescribe /api a Cloud Functions.
 */
export const API_BASE_URL: string = '';
