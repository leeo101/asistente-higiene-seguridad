import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Sube una imagen base64 a Firebase Storage y retorna la URL de descarga.
 * @param base64Data La imagen en formato base64 (data:image/jpeg;base64,...)
 * @param path La ruta dentro de Storage (ej: camera_inspections/user123/123456789.jpg)
 * @returns Promesa que resuelve a la URL pública de la imagen
 */
export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        
        // Promesa de subida
        const uploadPromise = async () => {
            await uploadString(storageRef, base64Data, 'data_url');
            return await getDownloadURL(storageRef);
        };

        // Timeout de 8 segundos para evitar bloqueos infinitos si Firebase se cuelga sin red
        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("Timeout: La subida de imagen tardó demasiado (problema de red)")), 8000);
        });

        const downloadURL = await Promise.race([uploadPromise(), timeoutPromise]);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        throw error;
    }
};
