import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, Crosshair } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import toast from 'react-hot-toast';

/**
 * Componente para capturar y mostrar ubicación en inspecciones
 * @param {Object} props
 * @param {Function} props.onLocationSelect - Callback cuando se selecciona ubicación
 * @param {Object} props.initialLocation - Ubicación inicial {latitude, longitude, address}
 */
export default function LocationPicker({ onLocationSelect, initialLocation }) {
    const { latitude, longitude, accuracy, address, loading, error, getLocation } = useGeolocation();
    const [manualLocation, setManualLocation] = useState(initialLocation || { latitude: '', longitude: '' });
    const [showMap, setShowMap] = useState(false);

    const handleGetLocation = async () => {
        try {
            toast.loading('Obteniendo ubicación...', { duration: 1000 });
            const coords = await getLocation();
            
            if (coords) {
                toast.success('Ubicación obtenida ✅');
                onLocationSelect({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    accuracy: coords.accuracy,
                    address: coords.address,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (err) {
            toast.error(err.message || 'No se pudo obtener la ubicación');
        }
    };

    const handleManualEntry = () => {
        const lat = parseFloat(manualLocation.latitude);
        const lng = parseFloat(manualLocation.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            toast.error('Coordenadas inválidas');
            return;
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            toast.error('Coordenadas fuera de rango');
            return;
        }

        onLocationSelect({
            latitude: lat,
            longitude: lng,
            accuracy: null,
            address: null,
            manual: true,
            timestamp: new Date().toISOString()
        });

        toast.success('Ubicación guardada 📍');
    };

    const openInMaps = () => {
        const lat = latitude || manualLocation.latitude;
        const lng = longitude || manualLocation.longitude;
        
        if (lat && lng) {
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        }
    };

    return (
        <div style={{
            border: '2px solid var(--color-border, #e2e8f0)',
            borderRadius: '12px',
            padding: '1.2rem',
            background: 'var(--color-surface, #f8fafc)',
            marginBottom: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '1rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <MapPin size={20} color="#ffffff" />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text, #1e293b)' }}>
                        Ubicación de la Inspección
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                        Capturá las coordenadas GPS automáticamente
                    </p>
                </div>
            </div>

            {/* Botón para obtener ubicación */}
            <button
                onClick={handleGetLocation}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: loading ? 'var(--color-border, #e2e8f0)' : 'var(--color-primary, #3b82f6)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    marginBottom: '1rem',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.background = '#2563eb';
                }}
                onMouseOut={(e) => {
                    if (!loading) e.currentTarget.style.background = 'var(--color-primary, #3b82f6)';
                }}
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Obteniendo ubicación...
                    </>
                ) : (
                    <>
                        <Crosshair size={18} />
                        Obtener Ubicación GPS
                    </>
                )}
            </button>

            {/* Mostrar ubicación obtenida */}
            {(latitude || manualLocation.latitude) && (
                <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Navigation size={16} color="#ffffff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#166534'
                            }}>
                                📍 Ubicación registrada
                            </p>
                            <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.8rem',
                                color: '#166534',
                                lineHeight: 1.6
                            }}>
                                <div><strong>Latitud:</strong> {latitude || manualLocation.latitude}</div>
                                <div><strong>Longitud:</strong> {longitude || manualLocation.longitude}</div>
                                {accuracy && <div><strong>Precisión:</strong> ±{Math.round(accuracy)}m</div>}
                                {address && (
                                    <div style={{ marginTop: '0.3rem', fontStyle: 'italic' }}>
                                        <strong>Dirección:</strong> {address}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={openInMaps}
                                style={{
                                    marginTop: '0.6rem',
                                    padding: '0.5rem 1rem',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                <MapPin size={14} />
                                Ver en Google Maps
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entrada manual de coordenadas */}
            <div style={{
                borderTop: '1px solid var(--color-border, #e2e8f0)',
                paddingTop: '1rem',
                marginTop: '1rem'
            }}>
                <p style={{
                    margin: '0 0 0.8rem 0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted, #64748b)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    O ingresá manualmente:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '0.6rem',
                    marginBottom: '0.8rem'
                }}>
                    <input
                        type="number"
                        step="any"
                        placeholder="Latitud"
                        value={manualLocation.latitude}
                        onChange={(e) => setManualLocation({ ...manualLocation, latitude: e.target.value })}
                        style={{
                            padding: '0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border, #e2e8f0)',
                            fontSize: '0.85rem'
                        }}
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="Longitud"
                        value={manualLocation.longitude}
                        onChange={(e) => setManualLocation({ ...manualLocation, longitude: e.target.value })}
                        style={{
                            padding: '0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border, #e2e8f0)',
                            fontSize: '0.85rem'
                        }}
                    />
                    <button
                        onClick={handleManualEntry}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'var(--color-surface-hover, #f1f5f9)',
                            color: 'var(--color-text, #1e293b)',
                            border: '1px solid var(--color-border, #e2e8f0)',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Guardar
                    </button>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.8rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#dc2626',
                    fontSize: '0.85rem'
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Información de privacidad */}
            <p style={{
                marginTop: '1rem',
                fontSize: '0.7rem',
                color: 'var(--color-text-muted, #94a3b8)',
                textAlign: 'center',
                lineHeight: 1.5
            }}>
                🔒 Tu ubicación se usa solo para esta inspección y no se comparte con terceros
            </p>
        </div>
    );
}
