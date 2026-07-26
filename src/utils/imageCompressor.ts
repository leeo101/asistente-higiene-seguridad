/**
 * imageCompressor.ts
 * Utilidad cliente para comprimir y redimensionar imágenes mediante HTML5 Canvas.
 * Reduce fotos pesadas de cámaras móviles (5-12 MB) a ~40-90 KB en Base64 sin perder calidad visible.
 */

export interface CompressOptions {
  maxDimension?: number; // Máximo ancho o alto (px)
  quality?: number;      // Calidad de compresión JPEG (0.1 a 1.0)
  mimeType?: string;     // Formato de salida ('image/jpeg', 'image/webp')
}

/**
 * Comprime un objeto File, Blob o un string Base64 existente y devuelve un nuevo Base64 liviano.
 */
export async function compressImage(
  input: File | Blob | string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxDimension = 1000,
    quality = 0.78,
    mimeType = 'image/jpeg'
  } = options;

  if (!input) return '';

  // Si ya es un dataURL pequeño (ej. menor a 120 KB), retornarlo directamente
  if (typeof input === 'string' && input.startsWith('data:') && input.length < 160000) {
    return input;
  }

  return new Promise((resolve) => {
    const img = new Image();

    const processCanvas = () => {
      let { width, height } = img;

      // Mantener proporción espectro
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(typeof input === 'string' ? input : '');
        return;
      }

      // Fondo blanco para imágenes transparentes que se convierten a JPEG
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        // Si por alguna razón la compresión no fue menor (muy raro), devolver el original si era string
        if (typeof input === 'string' && input.length < compressedBase64.length) {
          resolve(input);
        } else {
          resolve(compressedBase64);
        }
      } catch (e) {
        console.warn('[imageCompressor] Canvas export fallback:', e);
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onload = () => {
      processCanvas();
    };

    img.onerror = () => {
      console.warn('[imageCompressor] No se pudo cargar la imagen para compresión.');
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}
