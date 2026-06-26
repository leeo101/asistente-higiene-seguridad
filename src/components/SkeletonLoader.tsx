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
      className={`skeleton  bg-[linear-gradient(90deg,_var(--color-background)_0%,_var(--color-surface-hover,_rgba(255,255,255,0.05))_50%,_var(--color-background)_100%)] background-size-[200%_100%] animation-[shimmer_1.5s_infinite] ${className}`}
      style={{
        width,
        height,
        borderRadius,



        ...style
      }} />);


}

// ─── Composed Skeletons (used across history modules) ────────────────────────
interface SkeletonCardProps {
  lines?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

export function SkeletonCard({ lines = 2, hasAvatar = false, hasActions = false }: SkeletonCardProps) {
  return (
    <div className="card p-[1.2rem] flex flex-col gap-[0.7rem]">
      {hasAvatar &&
      <div className="flex items-center gap-[0.8rem] mb-[0.3rem]">
          <Skeleton width="44px" height="44px" borderRadius="12px" />
          <div className="flex-[1] flex flex-col gap-[0.4rem]">
            <Skeleton width="60%" height="0.9rem" />
            <Skeleton width="40%" height="0.7rem" />
          </div>
        </div>
      }
      {Array.from({ length: lines }).map((_, i) =>
      <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height="0.8rem" />
      )}
      {hasActions &&
      <div className="flex gap-[0.5rem] mt-[0.5rem] pt-[0.7rem] border-top-[1px_solid_var(--color-border)]">
          <Skeleton width="45%" height="2.2rem" borderRadius="10px" />
          <Skeleton width="25%" height="2.2rem" borderRadius="10px" />
          <Skeleton width="25%" height="2.2rem" borderRadius="10px" />
        </div>
      }
    </div>);

}

interface SkeletonListProps {
  count?: number;
  cardProps?: SkeletonCardProps;
}

export function SkeletonList({ count = 3, cardProps }: SkeletonListProps) {
  return (
    <div className="flex flex-col gap-[1rem]">
      {Array.from({ length: count }).map((_, i) =>
      <SkeletonCard key={i} {...cardProps} />
      )}
    </div>);

}

// ─── Legacy exports (used in Dashboard and other modules) ────────────────────
export const HistoryCardSkeleton = () =>
<div className="glass-card p-[1.5rem] mb-[1rem] flex justify-space-between items-center rounded-[16px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)]">



  
    <div className="flex-[1]">
      <Skeleton width="60%" height="24px" className="mb-[0.5rem]" />
      <Skeleton width="40%" height="16px" />
    </div>
    <Skeleton width="40px" height="40px" borderRadius="50%" />
  </div>;


export const DashboardCardSkeleton = () =>
<div className="glass-card p-[1.5rem] min-h-[120px] flex flex-col justify-center items-center gap-[1rem] rounded-[16px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)]">



  
    <Skeleton width="40px" height="40px" borderRadius="50%" />
    <Skeleton width="80%" height="16px" />
  </div>;


export const KPICardSkeleton = () =>
<div className="p-[1.25rem] rounded-[16px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] min-h-[140px]">


  
    <Skeleton width="60%" height="16px" className="mb-[0.5rem]" />
    <Skeleton width="80%" height="32px" className="mb-[0.5rem]" />
    <Skeleton width="100%" height="6px" />
  </div>;


export const ChecklistItemSkeleton = () =>
<div className="p-[1rem] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] mb-[0.5rem] flex items-center gap-[1rem]">



  
    <Skeleton width="24px" height="24px" borderRadius="6px" />
    <Skeleton width="70%" height="16px" />
    <Skeleton width="80px" height="32px" borderRadius="8px" />
  </div>;


export const TableSkeleton = ({ rows = 5 }: {rows?: number;}) =>
<div className="rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] overflow-[hidden]">
    <div className="p-[1rem] border-bottom-[1px_solid_var(--color-border)] bg-[var(--color-background)]">
      <Skeleton width="30%" height="16px" />
    </div>
    {[...Array(rows)].map((_, i) =>
  <div key={i} style={{ borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none' }} className="p-[1rem]">
        <Skeleton width="100%" height="16px" />
      </div>
  )}
  </div>;


export default Skeleton;