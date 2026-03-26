import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '8px', style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-background) 0%, var(--color-surface-hover, rgba(255,255,255,0.05)) 50%, var(--color-background) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

export function SkeletonCard({ lines = 2, hasAvatar = false, hasActions = false }: SkeletonCardProps) {
  return (
    <div
      className="card"
      style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}
    >
      {hasAvatar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
          <Skeleton width="44px" height="44px" borderRadius="12px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton width="60%" height="0.9rem" />
            <Skeleton width="40%" height="0.7rem" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height="0.8rem" />
      ))}
      {hasActions && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.7rem', borderTop: '1px solid var(--color-border)' }}>
          <Skeleton width="45%" height="2.2rem" borderRadius="10px" />
          <Skeleton width="25%" height="2.2rem" borderRadius="10px" />
          <Skeleton width="25%" height="2.2rem" borderRadius="10px" />
        </div>
      )}
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  cardProps?: SkeletonCardProps;
}

export function SkeletonList({ count = 3, cardProps }: SkeletonListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...cardProps} />
      ))}
    </div>
  );
}

export default Skeleton;
