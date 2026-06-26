import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, Crosshair } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

interface LocationCoords {
  latitude: string | number;
  longitude: string | number;
  accuracy?: number | null;
  address?: string | null;
  timestamp?: string;
  manual?: boolean;
}

interface LocationPickerProps {
  onLocationSelect: (coords: LocationCoords) => void;
  initialLocation?: {latitude: string;longitude: string;};
}

/**
 * Componente para capturar y mostrar ubicación en inspecciones
 * @param {Object} props
 * @param {Function} props.onLocationSelect - Callback cuando se selecciona ubicación
 * @param {Object} props.initialLocation - Ubicación inicial {latitude, longitude, address}
 */
export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const { latitude, longitude, accuracy, address, loading, error, getLocation } = useGeolocation();
  const [manualLocation, setManualLocation] = useState(initialLocation || { latitude: '', longitude: '' });

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
      toast.error(getErrorMessage(err) || 'No se pudo obtener la ubicación');
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
    <div className="border-[2px_solid_var(--color-border,_#e2e8f0)] rounded-[12px] p-[1.2rem] bg-[var(--color-surface,_#f8fafc)] mb-[1.5rem]">





      
            <div className="flex items-center gap-[0.8rem] mb-[1rem]">




        
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)] flex items-center justify-center flex-shrink-[0]">








          
                    <MapPin size={20} color="#ffffff" />
                </div>
                <div className="flex-[1]">
                    <h4 className="m-[0] text-[0.95rem] font-[800] text-[var(--color-text,_#1e293b)]">
                        Ubicación de la Inspección
                    </h4>
                    <p className="m-[0.2rem_0_0] text-[0.8rem] text-[var(--color-text-muted,_#64748b)]">
                        Capturá las coordenadas GPS automáticamente
                    </p>
                </div>
            </div>

            {/* Botón para obtener ubicación */}
            <button
        onClick={handleGetLocation}
        disabled={loading}
        style={{


          background: loading ? 'var(--color-border, #e2e8f0)' : 'var(--color-primary, #3b82f6)',





          cursor: loading ? 'not-allowed' : 'pointer'






        }}
        onMouseOver={(e) => {
          if (!loading) e.currentTarget.style.background = '#2563eb';
        }}
        onMouseOut={(e) => {
          if (!loading) e.currentTarget.style.background = 'var(--color-primary, #3b82f6)';
        }} className="w-[100%] p-[0.9rem] text-[#ffffff] border-none rounded-[10px] font-[700] text-[0.9rem] flex items-center justify-center gap-[0.6rem] mb-[1rem] transition-[background_0.2s]">
        
                {loading ?
        <>
                        <Loader2 size={18} className="animate-spin" />
                        Obteniendo ubicación...
                    </> :

        <>
                        <Crosshair size={18} />
                        Obtener Ubicación GPS
                    </>
        }
            </button>

            {/* Mostrar ubicación obtenida */}
            {(latitude || manualLocation.latitude) &&
      <div className="bg-[#f0fdf4] border-[1px_solid_#86efac] rounded-[10px] p-[1rem] mb-[1rem]">





        
                    <div className="flex items-start gap-[0.6rem]">
                        <div className="w-[32px] h-[32px] rounded-[50%] bg-[#16a34a] flex items-center justify-center flex-shrink-[0]">








            
                            <Navigation size={16} color="#ffffff" />
                        </div>
                        <div className="flex-[1]">
                            <p className="m-[0] text-[0.85rem] font-[700] text-[#166534]">




              
                                📍 Ubicación registrada
                            </p>
                            <div className="mt-[0.5rem] text-[0.8rem] text-[#166534] line-height-[1.6]">




              
                                <div><strong>Latitud:</strong> {latitude || manualLocation.latitude}</div>
                                <div><strong>Longitud:</strong> {longitude || manualLocation.longitude}</div>
                                {accuracy && <div><strong>Precisión:</strong> ±{Math.round(accuracy)}m</div>}
                                {address &&
              <div className="mt-[0.3rem] font-style-[italic]">
                                        <strong>Dirección:</strong> {address}
                                    </div>
              }
                            </div>
                            <button
              onClick={openInMaps} className="mt-[0.6rem] p-[0.5rem_1rem] bg-[#16a34a] text-[#ffffff] border-none rounded-[6px] font-[700] text-[0.75rem] cursor-pointer flex items-center gap-[0.4rem]">














              
                                <MapPin size={14} />
                                Ver en Google Maps
                            </button>
                        </div>
                    </div>
                </div>
      }

            {/* Entrada manual de coordenadas */}
            <div className="border-top-[1px_solid_var(--color-border,_#e2e8f0)] pt-[1rem] mt-[1rem]">



        
                <p className="m-[0_0_0.8rem_0] text-[0.8rem] font-[700] text-[var(--color-text-muted,_#64748b)] uppercase letter-spacing-[0.5px]">






          
                    O ingresá manualmente:
                </p>
                <div className="grid grid-template-columns-[1fr_1fr_auto] gap-[0.6rem] mb-[0.8rem]">




          
                    <input
            type="number"
            step="any"
            placeholder="Latitud"
            value={manualLocation.latitude}
            onChange={(e) => setManualLocation({ ...manualLocation, latitude: e.target.value })} className="p-[0.6rem] rounded-[8px] border-[1px_solid_var(--color-border,_#e2e8f0)] text-[0.85rem]" />






          
                    <input
            type="number"
            step="any"
            placeholder="Longitud"
            value={manualLocation.longitude}
            onChange={(e) => setManualLocation({ ...manualLocation, longitude: e.target.value })} className="p-[0.6rem] rounded-[8px] border-[1px_solid_var(--color-border,_#e2e8f0)] text-[0.85rem]" />






          
                    <button
            onClick={handleManualEntry} className="p-[0.6rem_1rem] bg-[var(--color-surface-hover,_#f1f5f9)] text-[var(--color-text,_#1e293b)] border-[1px_solid_var(--color-border,_#e2e8f0)] rounded-[8px] font-[700] text-[0.85rem] cursor-pointer">










            
                        Guardar
                    </button>
                </div>
            </div>

            {/* Mensaje de error */}
            {error &&
      <div className="mt-[1rem] p-[0.8rem] bg-[#fef2f2] border-[1px_solid_#fecaca] rounded-[8px] flex items-center gap-[0.6rem] text-[#dc2626] text-[0.85rem]">










        
                    <AlertCircle size={18} />
                    {error}
                </div>
      }

            {/* Información de privacidad */}
            <p className="mt-[1rem] text-[0.7rem] text-[var(--color-text-muted,_#94a3b8)] text-center line-height-[1.5]">





        
                🔒 Tu ubicación se usa solo para esta inspección y no se comparte con terceros
            </p>
        </div>);

}