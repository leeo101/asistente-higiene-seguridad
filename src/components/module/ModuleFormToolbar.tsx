import type { ReactNode } from 'react';
import type { ModuleFormProgress } from './types';
import { ArrowLeft } from 'lucide-react';

interface ModuleFormToolbarProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  progress?: ModuleFormProgress;
  steps?: string[];
  currentStep?: number;
  onBack?: () => void;
  onStepClick?: (step: number) => void;
}

export function ModuleFormToolbar({
  title,
  subtitle,
  icon,
  progress,
  steps,
  currentStep = 1,
  onBack,
  onStepClick,
}: ModuleFormToolbarProps) {
  const stepProgress = steps?.length
    ? Math.round((currentStep / steps.length) * 100)
    : undefined;

  return (
    <div className="module-form-toolbar no-print">
      <div className="module-form-toolbar__header">
        <div className="module-form-toolbar__title-row">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Volver"
              style={{
                marginBottom: 0,
                marginRight: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)',
                flexShrink: 0
              }}
            >
              <ArrowLeft size={16} style={{ flexShrink: 0 }} /> Atrás
            </button>
          )}
          {icon && <span className="module-form-toolbar__icon">{icon}</span>}
          <div>
            <h1 className="module-form-toolbar__title">{title}</h1>
            {subtitle && <p className="module-form-toolbar__subtitle">{subtitle}</p>}
          </div>
        </div>

        {progress && (
          <div className="module-form-toolbar__progress-meta">
            <span
              className="module-form-toolbar__percent"
              style={{ color: progress.color }}
            >
              {progress.percent}%
            </span>
            <span className="module-form-toolbar__progress-label">{progress.label}</span>
          </div>
        )}
      </div>

      {(steps?.length || progress) && (
        <div className="module-form-toolbar__bar-wrap">
          <div className="module-form-toolbar__bar">
            <div
              className="module-form-toolbar__bar-fill"
              style={{ width: `${stepProgress ?? progress?.percent ?? 0}%` }}
            />
          </div>

          {steps && steps.length > 0 && (
            <div className="module-form-toolbar__steps">
              {steps.map((label, idx) => {
                const stepNum = idx + 1;
                const isCurrent = currentStep === stepNum;
                const isPast = currentStep > stepNum;
                const isClickable = typeof onStepClick === 'function';

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onStepClick(stepNum)}
                    className={`module-form-toolbar__step-btn ${
                      isCurrent
                        ? 'module-form-toolbar__step-btn--current'
                        : isPast
                        ? 'module-form-toolbar__step-btn--completed'
                        : 'module-form-toolbar__step-btn--pending'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      marginBottom: 0,
                      background: isCurrent
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : isPast
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'var(--color-background)',
                      color: isCurrent
                        ? '#ffffff'
                        : isPast
                        ? '#059669'
                        : 'var(--color-text)',
                      borderColor: isCurrent
                        ? '#2563eb'
                        : isPast
                        ? 'rgba(16, 185, 129, 0.4)'
                        : 'var(--color-border)'
                    }}
                  >
                    <span
                      className="module-form-toolbar__step-badge"
                      style={{
                        backgroundColor: isCurrent
                          ? 'rgba(255, 255, 255, 0.22)'
                          : isPast
                          ? '#10b981'
                          : 'var(--color-surface)',
                        color: isCurrent || isPast ? '#ffffff' : 'var(--color-text)'
                      }}
                    >
                      {isPast ? '✓' : stepNum}
                    </span>
                    <span className="module-form-toolbar__step-text">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
