import React from 'react';

const Skeleton = ({ width, height, borderRadius = '8px', className = '' }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
            }}
        />
    );
};

export const HistoryCardSkeleton = () => (
    <div className="glass-card" style={{ 
        padding: '1.5rem', 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)'
    }}>
        <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="24px" className="mb-2" />
            <Skeleton width="40%" height="16px" />
        </div>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
    </div>
);

export const DashboardCardSkeleton = () => (
    <div className="glass-card" style={{ 
        padding: '1.5rem', 
        minHeight: '120px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '1rem',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)'
    }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="80%" height="16px" />
    </div>
);

export const KPICardSkeleton = () => (
    <div style={{
        padding: '1.25rem',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        minHeight: '140px'
    }}>
        <Skeleton width="60%" height="16px" className="mb-2" />
        <Skeleton width="80%" height="32px" className="mb-2" />
        <Skeleton width="100%" height="6px" />
    </div>
);

export const ChecklistItemSkeleton = () => (
    <div style={{
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    }}>
        <Skeleton width="24px" height="24px" borderRadius="6px" />
        <Skeleton width="70%" height="16px" />
        <Skeleton width="80px" height="32px" borderRadius="8px" />
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div style={{
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        overflow: 'hidden'
    }}>
        <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-background)'
        }}>
            <Skeleton width="30%" height="16px" />
        </div>
        {[...Array(rows)].map((_, i) => (
            <div key={i} style={{
                padding: '1rem',
                borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none'
            }}>
                <Skeleton width="100%" height="16px" />
            </div>
        ))}
    </div>
);

export default Skeleton;
