const ALLOWED_ORIGINS = [
  'https://asistentehs.com',
  'https://www.asistentehs.com',
  'https://asistentehs-b594e.web.app',
  'https://asistentehs-b594e.firebaseapp.com',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];

/**
 * Orígenes permitidos para API (dev local, red LAN y producción).
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;

  return (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.github.io') ||
    origin.startsWith('https://asistente-de-higiene-y-seguridad') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://[::1]:') ||
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)
  );
}

export function setCorsHeaders(req, res) {
  const origin = req.headers?.origin;

  if (!origin) {
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  }

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    return true;
  }

  console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
  res.status(403).json({ error: 'Origen no autorizado.' });
  return false;
}
