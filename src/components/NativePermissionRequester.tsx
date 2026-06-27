import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { requestAndSaveToken } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Solicita permisos nativos (cámara + push) en Android/iOS al iniciar la app.
 * También inicializa el registro FCM de push para el usuario logueado.
 */
export default function NativePermissionRequester() {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const requestPermissions = async () => {
            try {
                // Camera permission
                const cameraStatus = await Camera.checkPermissions();
                if (cameraStatus.camera === 'prompt' || cameraStatus.camera === 'denied') {
                    await Camera.requestPermissions();
                }
            } catch (error) {
                console.warn('[NativePermissions] Error requesting camera permission:', error);
            }
        };

        const timer = setTimeout(requestPermissions, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Register push notifications when user is logged in
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        if (!currentUser?.uid) return;

        const timer = setTimeout(() => {
            requestAndSaveToken(currentUser.uid);
        }, 2500);

        return () => clearTimeout(timer);
    }, [currentUser]);

    return null;
}
