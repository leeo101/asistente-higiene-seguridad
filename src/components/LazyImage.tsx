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
      className={`lazy-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: radius,
        ...style
      }}
    >
      {/* Skeleton Placeholder */}
      {isLoading && (
        <div 
          className="skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, ${placeholderColor} 0%, var(--color-surface-hover) 50%, ${placeholderColor} 100%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: radius
          }}
        />
      )}
      
      {/* Imagen real */}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.4s ease',
          ...props.style
        }}
        loading="lazy"
        {...props}
      />
      
      {/* Fallback para error */}
      {error && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background)',
            color: 'var(--color-text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          Imagen no disponible
        </div>
      )}
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
    </div>
  );
}
