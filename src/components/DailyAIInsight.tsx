import React, { useMemo } from 'react';
import { Sparkle, WarningCircle, CheckCircle, Lightbulb } from '@phosphor-icons/react';

interface DailyAIInsightProps {
  healthScore: number;
  alertsCount: number;
  criticalRisksCount: number;
}

export default function DailyAIInsight({ healthScore, alertsCount, criticalRisksCount }: DailyAIInsightProps) {
  const insight = useMemo(() => {
    if (healthScore >= 90 && alertsCount === 0 && criticalRisksCount === 0) {
      return {
        message: '¡Excelente estado! Tu sistema de gestión no presenta anomalías. Es un buen momento para planificar capacitaciones preventivas.',
        type: 'success',
        icon: CheckCircle
      };
    }
    
    if (criticalRisksCount > 0) {
      return {
        message: `Atención: Detectamos ${criticalRisksCount} riesgos en nivel crítico. Te sugerimos revisarlos y mitigarlos urgentemente para prevenir accidentes.`,
        type: 'danger',
        icon: WarningCircle
      };
    }

    if (alertsCount > 0) {
      return {
        message: `Tenés ${alertsCount} alertas pendientes (vencimientos cercanos o capacitaciones). Resolvelas para subir tu Score arriba del 90%.`,
        type: 'warning',
        icon: Lightbulb
      };
    }

    if (healthScore < 70) {
      return {
        message: 'Tu índice de salud general está por debajo del promedio ideal. Verificá los cumplimientos de EPP y las métricas de accidentabilidad.',
        type: 'warning',
        icon: Lightbulb
      };
    }

    return {
      message: 'Todo marcha dentro de los parámetros normales. Mantené actualizadas tus matrices de riesgo y registros de EPP.',
      type: 'info',
      icon: Sparkle
    };
  }, [healthScore, alertsCount, criticalRisksCount]);

  const IconComponent = insight.icon;

  const bgColors: Record<string, string> = {
    success: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
    danger: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
    warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
    info: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)'
  };

  const borderColors: Record<string, string> = {
    success: 'rgba(16, 185, 129, 0.3)',
    danger: 'rgba(239, 68, 68, 0.3)',
    warning: 'rgba(245, 158, 11, 0.3)',
    info: 'rgba(56, 189, 248, 0.3)'
  };

  const textColors: Record<string, string> = {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#38bdf8'
  };

  return (
    <div style={{
      background: bgColors[insight.type],
      border: `1px solid ${borderColors[insight.type]}`,
      borderRadius: '16px',
      padding: '1.2rem 1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        opacity: 0.1,
        transform: 'rotate(-15deg)',
        color: textColors[insight.type]
      }}>
        <Sparkle size={120} weight="fill" />
      </div>

      <div style={{
        background: `rgba(255,255,255,0.1)`,
        padding: '0.6rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: textColors[insight.type],
        backdropFilter: 'blur(10px)',
        zIndex: 1
      }}>
        <IconComponent size={26} weight="duotone" />
      </div>

      <div style={{ flex: 1, zIndex: 1 }}>
        <h4 style={{ 
          margin: '0 0 0.4rem', 
          fontSize: '0.95rem', 
          fontWeight: 800, 
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          Asistente IA <Sparkle size={14} color="#a855f7" weight="fill" />
        </h4>
        <p style={{ 
          margin: 0, 
          fontSize: '0.85rem', 
          color: 'var(--color-text-muted)', 
          lineHeight: 1.5,
          fontWeight: 500
        }}>
          {insight.message}
        </p>
      </div>
    </div>
  );
}
