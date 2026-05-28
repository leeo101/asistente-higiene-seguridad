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
        // uploadString can handle base64 URL directly if we specify data_url
        await uploadString(storageRef, base64Data, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        throw error;
    }
};
