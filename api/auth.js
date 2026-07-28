import forgotPassword from './_forgot-password.js';
import sendPasswordChangedEmail from './_send-password-changed-email.js';
import welcomeEmail from './_welcome-email.js';

export default async function handler(req, res) {
  // Extraer el path limpio sin query strings
  const url = (req.url || '').split('?')[0].replace(/\/$/, '');

  // Usar comparación exacta para evitar falsos positivos con url.includes()
  if (url === '/api/send-password-changed-email') return sendPasswordChangedEmail(req, res);
  if (url === '/api/welcome-email') return welcomeEmail(req, res);
  if (url === '/api/forgot-password') return forgotPassword(req, res);

  // Fallback: ruta no reconocida
  return res.status(404).json({ error: 'Endpoint no encontrado.' });
}
