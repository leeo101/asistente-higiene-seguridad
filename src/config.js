export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : ''; // En producción usamos la misma URL del frontend (Vercel)

export const ADMIN_EMAILS = [
    'leo101@gmail.com', // Puedes agregar tu email aquí para bypass
];
