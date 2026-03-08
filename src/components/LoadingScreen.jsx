import React from 'react';

export default function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-glow"></div>
            <img
                src="/logo.png"
                alt="Cargando Asistente HYS..."
                className="loading-logo"
            />
            <p className="loading-text">Iniciando Herramientas...</p>
            <style>
                {`
                    .loading-screen {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        width: 100vw;
                        background: radial-gradient(circle at center, #1e3a8a 0%, #0f172a 100%);
                        color: white;
                        position: fixed;
                        top: 0;
                        left: 0;
                        zIndex: 9999;
                        overflow: hidden;
                    }
                    .loading-glow {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 300px;
                        height: 300px;
                        background: var(--color-primary);
                        filter: blur(120px);
                        opacity: 0.3;
                        border-radius: 50%;
                        z-index: -1;
                        animation: glowPulse 3s infinite ease-in-out;
                    }
                    .loading-logo {
                        width: 80px;
                        height: 80px;
                        margin-bottom: 2rem;
                        filter: drop-shadow(0 0 20px rgba(255,255,255,0.2));
                        animation: logoFloat 2s infinite ease-in-out;
                    }
                    .loading-text {
                        font-family: 'Outfit', sans-serif;
                        font-weight: 700;
                        font-size: 0.9rem;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        opacity: 0.8;
                        animation: textFade 2s infinite alternate;
                    }
                    @keyframes logoFloat {
                        0%, 100% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-10px) scale(1.05); }
                    }
                    @keyframes glowPulse {
                        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
                        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
                    }
                    @keyframes textFade {
                        from { opacity: 0.4; }
                        to { opacity: 0.9; }
                    }
                `}
            </style>
        </div>
    );
}
