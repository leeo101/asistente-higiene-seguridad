import React, { useState, useEffect } from 'react';

/**
 * Componente LazyImage con blur placeholder
 * Muestra un skeleton mientras carga la imagen con efecto fade-in
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  style = {},
  placeholderColor = 'var(--color-background)',
  radius = 'var(--radius-lg)',
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setImageSrc(src);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div
      className={`lazy-image-container  relative overflow-[hidden] ${className}`}
      style={{


        borderRadius: radius,
        ...style
      }}>
      
      {/* Skeleton Placeholder */}
      {isLoading &&
      <div
        className="skeleton absolute inset-[0] w-[100%] h-[100%] background-size-[200%_100%] animation-[shimmer_1.5s_infinite]"
        style={{




          background: `linear-gradient(90deg, ${placeholderColor} 0%, var(--color-surface-hover) 50%, ${placeholderColor} 100%)`,


          borderRadius: radius
        }} />

      }
      
      {/* Imagen real */}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{




          opacity: isLoading ? 0 : 1,

          ...props.style
        }}
        loading="lazy"
        {...props} className="block w-[100%] h-[100%] object-fit-[cover] transition-[opacity_0.4s_ease]" />
      
      
      {/* Fallback para error */}
      {error &&
      <div className="absolute inset-[0] flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-muted)] text-[0.75rem] font-[600]">











        
          Imagen no disponible
        </div>
      }
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
    </div>);

}