import React, { useState, useEffect } from 'react';

const TIPS = [
  "💡 Inspeccioná tu EPP antes de cada uso.",
  "💡 Mantené las rutas de evacuación libres de obstáculos.",
  "💡 Verificá la fecha de vencimiento de los extintores.",
  "💡 En espacios confinados, siempre medí los gases antes de entrar.",
  "💡 Reportá cualquier incidente por más mínimo que sea.",
  "💡 Una postura correcta previene lesiones a largo plazo.",
  "💡 Usá tres puntos de apoyo al subir o bajar escaleras.",
  "💡 Si el trabajo es peligroso, usá tu tarjeta STOP.",
  "💡 Cuidar el medio ambiente es parte de la seguridad."
];

export default function LoadingScreen() {
  const [currentTip, setCurrentTip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-glow"></div>
      <img
        src="/logo.png"
        alt="Cargando Asistente HYS..."
        className="loading-logo"
      />
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando Módulos...</p>
      </div>
      <div className="loading-tip" key={currentTip}>
        {currentTip}
      </div>

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
            z-index: 9999;
            overflow: hidden;
            padding: 2rem;
            text-align: center;
          }
          .loading-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            background: var(--color-primary, #3b82f6);
            filter: blur(120px);
            opacity: 0.3;
            border-radius: 50%;
            z-index: -1;
            animation: glowPulse 3s infinite ease-in-out;
          }
          .loading-logo {
            width: 90px;
            height: 90px;
            margin-bottom: 2rem;
            filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.4));
            animation: logoFloat 3s infinite ease-in-out;
          }
          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .loading-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            opacity: 0.8;
            margin: 0;
          }
          .loading-tip {
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            font-size: 1rem;
            color: #93c5fd;
            max-width: 400px;
            animation: fadeInOut 3.5s infinite;
            padding: 1rem 1.5rem;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.05); }
          }
          @keyframes glowPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(10px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}
