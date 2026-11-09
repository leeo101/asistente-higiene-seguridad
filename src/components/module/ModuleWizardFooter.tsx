import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleAction } from './types';

interface ModuleWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  finalActions?: ModuleAction[];
}

const FINAL_VARIANT_STYLES: Record<NonNullable<ModuleAction['variant']>, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.32)'
  },
  secondary: {
    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    color: '#ffffff',
    border: 'none'
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.28)'
  },
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.28)'
  },
  info: {
    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
  }
};

export function ModuleWizardFooter({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  finalActions = []
}: ModuleWizardFooterProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep >= totalSteps;

  return (
    <div className="module-wizard-footer no-print">
      <button
        type="button"
        onClick={() => {
          if (isFirst) {
            window.history.back();
          } else {
            onPrev();
          }
        }}
        className="module-wizard-footer__back btn-wizard-back"
        style={{
          marginBottom: 0,
          padding: '0.8rem 1.5rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontWeight: 900,
          fontSize: '0.88rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          opacity: 1,
          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)'
        }}
      >
        <ArrowLeft size={18} style={{ flexShrink: 0, color: '#ffffff' }} />{' '}
        <span style={{ color: '#ffffff' }}>{isFirst ? 'Volver Atrás' : 'Paso Anterior'}</span>
      </button>

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="module-wizard-footer__next"
          style={{
            marginBottom: 0,
            padding: '0.8rem 1.85rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 900,
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
          }}
        >
          Siguiente Paso <ArrowRight size={18} style={{ flexShrink: 0 }} />
        </button>
      ) : (
        <div className="module-wizard-footer__final">
          {finalActions.map((action) => {
            const variantStyle = FINAL_VARIANT_STYLES[action.variant ?? 'secondary'];
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className="module-wizard-footer__final-btn"
                style={{
                  marginBottom: 0,
                  padding: '0.78rem 1.25rem',
                  borderRadius: '13px',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  ...variantStyle
                }}
              >
                {action.icon} {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
