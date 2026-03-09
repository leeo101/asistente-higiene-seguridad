import React from 'react';

const Skeleton = ({ width, height, borderRadius = '8px', className = '' }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius
            }}
        />
    );
};

export const HistoryCardSkeleton = () => (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="24px" className="mb-2" />
            <Skeleton width="40%" height="16px" />
        </div>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
    </div>
);

export const DashboardCardSkeleton = () => (
    <div className="glass-card" style={{ padding: '1.5rem', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="80%" height="16px" />
    </div>
);

export default Skeleton;
