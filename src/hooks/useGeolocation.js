import React, { useEffect, useState, useCallback } from 'react';

/**
 * Hook para obtener geolocalización del usuario
 * @param {Object} options - Opciones de geolocalización
 * @returns {Object} { latitude, longitude, accuracy, loading, error, getLocation }
 */
export function useGeolocation(options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
}) {
    const [position, setPosition] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        address: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada por este navegador');
            return;
        }

        setLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const coords = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        altitude: pos.coords.altitude,
                        heading: pos.coords.heading,
                        speed: pos.coords.speed,
                        timestamp: pos.timestamp
                    };

                    // Intentar obtener dirección inversa (reverse geocoding)
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
                        );
                        if (response.ok) {
                            const data = await response.json();
                            coords.address = data.display_name || null;
                        }
                    } catch (err) {
                        console.warn('No se pudo obtener la dirección:', err);
                    }

                    setPosition(coords);
                    setLoading(false);
                    resolve(coords);
                },
                (err) => {
                    let errorMessage = 'Error al obtener ubicación';
                    
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = 'Permiso de ubicación denegado';
                            break;
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = 'Ubicación no disponible';
                            break;
                        case err.TIMEOUT:
                            errorMessage = 'Tiempo de espera agotado';
                            break;
                        default:
                            errorMessage = err.message || 'Error desconocido';
                    }

                    setError(errorMessage);
                    setLoading(false);
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }, [options]);

    // Obtener ubicación al montar (opcional)
    useEffect(() => {
        // No obtener automáticamente para no molestar al usuario
        // Llamar getLocation() manualmente cuando se necesite
    }, []);

    return {
        ...position,
        loading,
        error,
        getLocation,
        hasPermission: navigator.geolocation !== undefined
    };
}

/**
 * Hook para watch position (seguimiento continuo)
 * @param {Function} onPositionUpdate - Callback cuando se actualiza la posición
 * @returns {Object} { isWatching, startWatching, stopWatching }
 */
export function useGeolocationWatch(onPositionUpdate) {
    const [watchId, setWatchId] = useState(null);
    const [isWatching, setIsWatching] = useState(false);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp
                };
                if (onPositionUpdate) onPositionUpdate(coords);
            },
            (err) => console.error('Error en watchPosition:', err),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        setWatchId(id);
        setIsWatching(true);
    }, [onPositionUpdate]);

    const stopWatching = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
            setIsWatching(false);
        }
    }, [watchId]);

    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

    return {
        isWatching,
        startWatching,
        stopWatching
    };
}

export default useGeolocation;
