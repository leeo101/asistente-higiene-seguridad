import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

export default function NativePermissionRequester() {
    useEffect(() => {
        const requestPermissions = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    // Solo pedir permiso si no fue otorgado previamente
                    const cameraStatus = await Camera.checkPermissions();
                    if (cameraStatus.camera === 'prompt' || cameraStatus.camera === 'denied') {
                        // Capacitor handles showing the native permission prompt
                        await Camera.requestPermissions();
                    }

                    // Request Push Notification permissions
                    const pushStatus = await PushNotifications.checkPermissions();
                    if (pushStatus.receive === 'prompt') {
                        await PushNotifications.requestPermissions();
                    }
                } catch (error) {
                    console.warn('Error requesting native permissions:', error);
                }
            }
        };

        // Delay slighty so it doesn't block the very first render immediately
        const timer = setTimeout(requestPermissions, 1500);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
