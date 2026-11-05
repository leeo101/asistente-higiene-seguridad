import { setCorsHeaders, verifyToken } from './_verifyToken.js';
import { getGoogleAccessToken, setFirebaseCustomClaims } from './_googleAuth.js';
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
            console.error('Firebase Admin init error in admin-users:', e.message);
        }
    }
}

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Verificar autenticación
    const user = await verifyToken(req, res);
    if (!user) return;

    // 2. Solo los administradores pueden consultar o modificar
    const userEmail = (user.email || '').toLowerCase().trim();
    if (!ADMIN_EMAILS.includes(userEmail)) {
        console.warn(`[SECURITY] Intento de acceso no autorizado al panel admin desde: ${userEmail}`);
        return res.status(403).json({ error: 'Acceso denegado: solo disponible para administradores autorizados.' });
    }

    ensureFirebaseAdmin();

    // ── GET: Listar todos los usuarios con estado PRO, días restantes y actividad ──
    if (req.method === 'GET') {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            const projectId = serviceAccount.project_id;
            const accessToken = await getGoogleAccessToken();

            // 1. Obtener todos los usuarios de Auth vía Identity Toolkit REST
            let allAuthUsers = [];
            let nextPageToken = undefined;

            do {
                const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?maxResults=100${nextPageToken ? `&nextPageToken=${encodeURIComponent(nextPageToken)}` : ''}`;
                const resp = await fetch(url, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!resp.ok) {
                    throw new Error(`Identity Toolkit error: ${await resp.text()}`);
                }
                const data = await resp.json();
                if (data.users && data.users.length > 0) {
                    allAuthUsers = allAuthUsers.concat(data.users);
                }
                nextPageToken = data.nextPageToken;
            } while (nextPageToken);

            // 2. Obtener datos de suscripciones guardadas en Firestore
            const subMap = new Map();
            if (admin.apps.length) {
                try {
                    const snap = await admin.firestore().collectionGroup('data').get();
                    snap.docs.forEach(doc => {
                        if (doc.id === 'subscriptionData') {
                            const uid = doc.ref.parent.parent?.id;
                            if (uid) subMap.set(uid, doc.data());
                        }
                    });
                } catch (dbErr) {
                    console.warn('Error reading Firestore subData:', dbErr.message);
                }
            }

            const now = Date.now();

            const users = allAuthUsers.map(u => {
                const uid = u.localId;
                const email = (u.email || '').toLowerCase();
                const displayName = u.displayName || email.split('@')[0];

                let customAttributes = {};
                try {
                    if (u.customAttributes) {
                        customAttributes = JSON.parse(u.customAttributes);
                    }
                } catch {}

                const isClaimPro = Boolean(customAttributes.isPro === true || customAttributes.isAdmin === true);
                const sub = subMap.get(uid);

                const expiryMs = sub?.expiry ? parseInt(sub.expiry, 10) : (
                    (email === 'enzorodriguez31@gmail.com' || email === 'arielalaniz9@gmail.com') ? 2099578549742 : 0
                );

                const isSubActive = Boolean(sub?.status === 'active' && expiryMs > now);
                const isPro = isClaimPro || isSubActive || email === 'enzorodriguez31@gmail.com' || email === 'arielalaniz9@gmail.com';

                const daysRemaining = (isPro && expiryMs > now)
                    ? Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24))
                    : (isPro && expiryMs >= 2000000000000 ? 9999 : 0);

                const lastSignInTimestamp = u.lastLoginAt ? parseInt(u.lastLoginAt, 10) : null;
                const createdTimestamp = u.createdAt ? parseInt(u.createdAt, 10) : null;

                return {
                    uid,
                    email,
                    displayName,
                    isPro,
                    isAdminUser: ADMIN_EMAILS.includes(email),
                    daysRemaining,
                    expiryDate: expiryMs ? new Date(expiryMs).toISOString() : null,
                    provider: sub?.provider || (isClaimPro ? 'custom_claim' : 'free'),
                    lastSignIn: lastSignInTimestamp ? new Date(lastSignInTimestamp).toISOString() : null,
                    createdAt: createdTimestamp ? new Date(createdTimestamp).toISOString() : null
                };
            });

            // Ordenar: primero los PRO, luego por última actividad reciente
            users.sort((a, b) => {
                if (a.isPro && !b.isPro) return -1;
                if (!a.isPro && b.isPro) return 1;
                const timeA = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
                const timeB = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
                return timeB - timeA;
            });

            const stats = {
                total: users.length,
                proCount: users.filter(u => u.isPro).length,
                freeCount: users.filter(u => !u.isPro).length,
                activeThisWeek: users.filter(u => u.lastSignIn && (now - new Date(u.lastSignIn).getTime() <= 7 * 24 * 60 * 60 * 1000)).length
            };

            return res.status(200).json({ stats, users });
        } catch (err) {
            console.error('Error fetching admin users list:', err);
            return res.status(500).json({ error: 'Error al obtener la lista de usuarios', details: err.message });
        }
    }

    // ── POST: Modificar suscripción PRO (Dar 30 días, Quitar PRO, etc.) ──
    if (req.method === 'POST') {
        try {
            const { targetUid, action, days = 30 } = req.body || {};
            if (!targetUid || !action) {
                return res.status(400).json({ error: 'Faltan targetUid o action' });
            }

            if (action === 'grant_pro') {
                const newExpiry = Date.now() + days * 24 * 60 * 60 * 1000;
                await setFirebaseCustomClaims(targetUid, { isPro: true });

                if (admin.apps.length) {
                    await admin.firestore().collection('users').doc(targetUid).collection('data').doc('subscriptionData').set({
                        status: 'active',
                        expiry: String(newExpiry),
                        updatedAt: Date.now(),
                        provider: 'manual_activation',
                        manualActivation: true
                    }, { merge: true });
                }

                return res.status(200).json({ success: true, message: `Acceso PRO activado por ${days} días`, expiry: newExpiry });
            }

            if (action === 'revoke_pro') {
                await setFirebaseCustomClaims(targetUid, { isPro: false });

                if (admin.apps.length) {
                    await admin.firestore().collection('users').doc(targetUid).collection('data').doc('subscriptionData').set({
                        status: 'inactive',
                        expiry: '0',
                        updatedAt: Date.now(),
                        provider: 'manual_revoked'
                    }, { merge: true });
                }

                return res.status(200).json({ success: true, message: 'Acceso PRO revocado exitosamente' });
            }

            return res.status(400).json({ error: 'Acción no reconocida' });
        } catch (err) {
            console.error('Error modifying user subscription:', err);
            return res.status(500).json({ error: 'Error al modificar suscripción', details: err.message });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
