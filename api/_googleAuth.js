import jwt from 'jsonwebtoken';

let cachedToken = null;
let tokenExpiry = 0;

export async function getGoogleAccessToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: token
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Error obteniendo Google Access Token: ${err}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return cachedToken;
}

export async function setFirebaseCustomClaims(uid, claims) {
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountJson || !uid) return;
        const serviceAccount = JSON.parse(serviceAccountJson);
        const projectId = serviceAccount.project_id;
        const accessToken = await getGoogleAccessToken();

        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                localId: uid,
                customAttributes: JSON.stringify(claims)
            })
        });

        if (!response.ok) {
            console.error('Failed to setFirebaseCustomClaims:', await response.text());
        }
    } catch (e) {
        console.error('Error setting custom claims via Identity Toolkit:', e);
    }
}

export async function getFirebaseUidByEmail(email) {
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountJson || !email) return null;
        const serviceAccount = JSON.parse(serviceAccountJson);
        const projectId = serviceAccount.project_id;
        const accessToken = await getGoogleAccessToken();

        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: [email.toLowerCase().trim()]
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.users && data.users.length > 0) {
                return data.users[0].localId;
            }
        }
    } catch (e) {
        console.error('Error lookup user by email via Identity Toolkit:', e);
    }
    return null;
}

