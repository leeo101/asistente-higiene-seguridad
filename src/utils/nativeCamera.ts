import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { compressImage } from './imageCompressor';

/**
 * Detecta si la aplicación se está ejecutando en un dispositivo móvil (Capacitor nativo o navegador móvil).
 */
export const isMobileDevice = (): boolean => {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.innerWidth <= 820;
  return isMobileUa || isSmallScreen;
};

export interface CaptureOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Abre inmediatamente la cámara nativa del teléfono móvil en máxima resolución óptica y calidad.
 * Solicita los permisos necesarios de hardware si aún no fueron concedidos.
 * 
 * Flujo:
 * 1. En Capacitor (APK Android / iOS): Llama a @capacitor/camera con CameraSource.Camera.
 * 2. En Navegador Móvil (Chrome Android / Safari iOS): Dispara un input file con capture="environment"
 *    que invoca de forma directa la aplicación de cámara de alta resolución del sistema operativo.
 * 3. En PC / Desktop: Devuelve null o activa el selector de archivo de cámara si está disponible.
 */
export const captureFromNativeCamera = async (
  options: CaptureOptions = {}
): Promise<string | null> => {
  const { maxDimension = 1400, quality = 0.82 } = options;

  // 1. Entorno Capacitor Nativo (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      // Verificar y pedir permisos
      const currentPerms = await Camera.checkPermissions();
      if (currentPerms.camera !== 'granted') {
        const reqResult = await Camera.requestPermissions({ permissions: ['camera'] });
        if (reqResult.camera !== 'granted') {
          console.warn('[NativeCamera] Permiso de cámara no concedido por el usuario');
          return null;
        }
      }

      // Invocar la cámara nativa directamente
      const photo = await Camera.getPhoto({
        quality: 92,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera, // Fuerza abrir la cámara física del teléfono
        saveToGallery: false,
        promptLabelHeader: 'Cámara',
        promptLabelPhoto: 'Galería',
        promptLabelPicture: 'Tomar Foto'
      });

      if (!photo || !photo.base64String) {
        return null;
      }

      const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
      const rawDataUrl = `data:${mime};base64,${photo.base64String}`;

      // Comprimir a un tamaño balanceado (~200KB-400KB) manteniendo máxima nitidez
      try {
        return await compressImage(rawDataUrl, { maxDimension, quality, mimeType: 'image/jpeg' });
      } catch (_) {
        return rawDataUrl;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('User cancelled') || msg.includes('cancelled') || msg.includes('No image')) {
        return null; // El usuario simplemente cerró la cámara
      }
      console.warn('[NativeCamera] Error en Capacitor Camera, pasando a fallback:', err);
    }
  }

  // 2. Navegador Web / PWA en Celular o Desktop
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // capture="environment" indica al teléfono abrir la cámara trasera nativa
    input.setAttribute('capture', 'environment');
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';

    let isDone = false;

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = async (event: any) => {
      if (isDone) return;
      isDone = true;
      const file = event.target?.files?.[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }

      try {
        const compressed = await compressImage(file, { maxDimension, quality });
        cleanup();
        resolve(compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          cleanup();
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          cleanup();
          resolve(null);
        };
        reader.readAsDataURL(file);
      }
    };

    // Si el usuario cancela la cámara en el navegador móvil
    const handleFocusBack = () => {
      setTimeout(() => {
        if (!isDone) {
          isDone = true;
          cleanup();
          resolve(null);
        }
      }, 1000);
    };

    window.addEventListener('focus', handleFocusBack, { once: true });
    document.body.appendChild(input);
    input.click();
  });
};
