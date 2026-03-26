import React from 'react';

// ─── Base Skeleton ────────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '8px', style, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
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

// ─── Composed Skeletons (used across history modules) ────────────────────────
interface SkeletonCardProps {
  lines?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

export function SkeletonCard({ lines = 2, hasAvatar = false, hasActions = false }: SkeletonCardProps) {
  return (
    <div className="card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
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

// ─── Legacy exports (used in Dashboard and other modules) ────────────────────
export const HistoryCardSkeleton = () => (
  <div className="glass-card" style={{
    padding: '1.5rem', marginBottom: '1rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-surface)'
  }}>
    <div style={{ flex: 1 }}>
      <Skeleton width="60%" height="24px" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="40%" height="16px" />
    </div>
    <Skeleton width="40px" height="40px" borderRadius="50%" />
  </div>
);

export const DashboardCardSkeleton = () => (
  <div className="glass-card" style={{
    padding: '1.5rem', minHeight: '120px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem',
    borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-surface)'
  }}>
    <Skeleton width="40px" height="40px" borderRadius="50%" />
    <Skeleton width="80%" height="16px" />
  </div>
);

export const KPICardSkeleton = () => (
  <div style={{
    padding: '1.25rem', borderRadius: '16px',
    border: '1px solid var(--color-border)', background: 'var(--color-surface)', minHeight: '140px'
  }}>
    <Skeleton width="60%" height="16px" style={{ marginBottom: '0.5rem' }} />
    <Skeleton width="80%" height="32px" style={{ marginBottom: '0.5rem' }} />
    <Skeleton width="100%" height="6px" />
  </div>
);

export const ChecklistItemSkeleton = () => (
  <div style={{
    padding: '1rem', borderRadius: '12px',
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem'
  }}>
    <Skeleton width="24px" height="24px" borderRadius="6px" />
    <Skeleton width="70%" height="16px" />
    <Skeleton width="80px" height="32px" borderRadius="8px" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div style={{ borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
      <Skeleton width="30%" height="16px" />
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} style={{ padding: '1rem', borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none' }}>
        <Skeleton width="100%" height="16px" />
      </div>
    ))}
  </div>
);

export default Skeleton;
