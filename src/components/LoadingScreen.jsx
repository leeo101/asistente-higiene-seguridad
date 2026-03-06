import React from 'react';

export default function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <img
                src="/logo.png"
                alt="Cargando Asistente HYS..."
                style={{
                    width: '64px',
                    height: '64px',
                    marginBottom: '1rem',
                    animation: 'pulse 1.5s infinite ease-in-out'
                }}
            />
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(0.9); opacity: 0.7; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
}
