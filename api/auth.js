import forgotPassword from './_forgot-password.js';
import sendPasswordChangedEmail from './_send-password-changed-email.js';
import welcomeEmail from './_welcome-email.js';
import adminUsers from './_admin-users.js';
import { setCorsHeaders, verifyToken } from './_verifyToken.js';
import admin from 'firebase-admin';

const ADMIN_EMAILS = ['enzorodriguez31@gmail.com', 'admin@asistentehs.com'];

function ensureFirebaseAdmin() {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
      const sa = JSON.parse(rawKey);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } catch (e) {
      console.error('Firebase Admin init error in auth.js:', e.message);
    }
  }
}

async function handleDeleteAccount(req, res) {
  const corsOk = setCorsHeaders(req, res);
  if (!corsOk) return;
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });

  const user = await verifyToken(req, res);
  if (!user || !user.uid) return;

  ensureFirebaseAdmin();
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Servidor de administración no disponible.' });
  }

  const uid = user.uid;
  try {
    try {
      const db = admin.firestore();
      await db.recursiveDelete(db.collection('users').doc(uid));
    } catch (fsErr) {
      console.warn(`[DELETE ACCOUNT] Firestore warning for ${uid}:`, fsErr.message);
    }
    try {
      const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
      await bucket.deleteFiles({ prefix: `users/${uid}/` });
    } catch (stErr) {
      console.warn(`[DELETE ACCOUNT] Storage warning for ${uid}:`, stErr.message);
    }
    await admin.auth().deleteUser(uid);
    return res.status(200).json({ success: true, message: 'Cuenta eliminada completamente.' });
  } catch (err) {
    console.error(`[DELETE ACCOUNT] Error for ${uid}:`, err.message);
    return res.status(500).json({ error: 'Error al eliminar la cuenta.' });
  }
}

async function handleRegisterRequest(req, res) {
  const corsOk = setCorsHeaders(req, res);
  if (!corsOk) return;
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  ensureFirebaseAdmin();
  if (!admin.apps.length) return res.status(500).json({ error: 'Firestore no inicializado' });

  const { name, email, profession, phone } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Formato de correo electrónico no válido.' });
  }

  try {
    const clean = (val, max) => (typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim().slice(0, max) : '');
    const docRef = await admin.firestore().collection('registration_requests').add({
      name: clean(name, 100),
      email: String(email).toLowerCase().trim(),
      profession: clean(profession, 150),
      phone: clean(phone, 30),
      status: 'pending',
      date: new Date().toISOString()
    });
    return res.status(201).json({ message: 'Solicitud enviada correctamente', id: docRef.id });
  } catch (err) {
    console.error('Error saving registration request:', err.message);
    return res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
}

async function handleAdminRequests(req, res, url) {
  const corsOk = setCorsHeaders(req, res);
  if (!corsOk) return;
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await verifyToken(req, res);
  if (!user) return;
  const userEmail = (user.email || '').toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores.' });
  }

  ensureFirebaseAdmin();
  if (!admin.apps.length) return res.status(500).json({ error: 'Firestore no inicializado' });
  const db = admin.firestore();

  if (req.method === 'GET') {
    const snapshot = await db.collection('registration_requests').orderBy('date', 'desc').get();
    return res.status(200).json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  if (req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[parts.length - 1] || req.query?.id;
    if (!id || id === 'requests') return res.status(400).json({ error: 'ID requerido' });
    await db.collection('registration_requests').doc(id).delete();
    return res.status(200).json({ message: 'Solicitud eliminada' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

export default async function handler(req, res) {
  // Extraer el path limpio sin query strings
  const url = (req.url || '').split('?')[0].replace(/\/$/, '');

  // Usar comparación exacta para evitar falsos positivos con url.includes()
  if (url === '/api/send-password-changed-email') return sendPasswordChangedEmail(req, res);
  if (url === '/api/welcome-email') return welcomeEmail(req, res);
  if (url === '/api/forgot-password') return forgotPassword(req, res);
  if (url === '/api/admin/users') return adminUsers(req, res);
  if (url === '/api/delete-account') return handleDeleteAccount(req, res);
  if (url === '/api/register-request') return handleRegisterRequest(req, res);
  if (url === '/api/admin/requests' || url.startsWith('/api/admin/requests/')) return handleAdminRequests(req, res, url);

  // Fallback: ruta no reconocida
  return res.status(404).json({ error: 'Endpoint no encontrado.' });
}
