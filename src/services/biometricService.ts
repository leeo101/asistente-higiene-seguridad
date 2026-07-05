// ─── biometricService ─────────────────────────────────────────────────────────
// Autenticación biométrica usando WebAuthn (huella dactilar / FaceID).

export type BiometricResult =
  | { success: true; credentialId: string }
  | { success: false; reason: 'unavailable' | 'denied' | 'error'; message: string };

/**
 * Verifica si el dispositivo/navegador soporta WebAuthn y autenticadores de plataforma.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Registra al usuario actual para autenticación biométrica.
 * Debe llamarse UNA sola vez por dispositivo.
 */
export async function registerBiometric(userId: string, userName: string): Promise<BiometricResult> {
  if (!(await isBiometricAvailable())) {
    return { success: false, reason: 'unavailable', message: 'Este dispositivo no soporta biometría' };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Asistente HYS', id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: userName,
          displayName: userName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    }) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, reason: 'denied', message: 'No se completó el registro biométrico' };
    }

    // Guardar credentialId en localStorage (solo el ID, no la clave privada)
    const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    localStorage.setItem(`hys_bio_cred_${userId}`, credId);

    return { success: true, credentialId: credId };
  } catch (e: any) {
    if (e?.name === 'NotAllowedError') {
      return { success: false, reason: 'denied', message: 'Biometría cancelada por el usuario' };
    }
    return { success: false, reason: 'error', message: e?.message || 'Error desconocido' };
  }
}

/**
 * Autentica al usuario con biometría.
 * @param label Texto descriptivo para el prompt (ej: "Firmar ATS")
 */
export async function authenticateWithBiometric(label: string): Promise<BiometricResult> {
  if (!(await isBiometricAvailable())) {
    return { success: false, reason: 'unavailable', message: 'Biometría no disponible en este dispositivo' };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials: [] // permite cualquier credencial registrada en el dispositivo
      }
    }) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, reason: 'denied', message: 'Autenticación cancelada' };
    }

    const credId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
    return { success: true, credentialId: credId };
  } catch (e: any) {
    if (e?.name === 'NotAllowedError') {
      return { success: false, reason: 'denied', message: `"${label}" requiere autenticación biométrica` };
    }
    return { success: false, reason: 'error', message: e?.message || 'Error de autenticación biométrica' };
  }
}

/**
 * Verifica si el usuario ya tiene una credencial biométrica registrada.
 */
export function hasBiometricRegistered(userId: string): boolean {
  return !!localStorage.getItem(`hys_bio_cred_${userId}`);
}
