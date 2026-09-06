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
            <button onClick={onBack} className="p-2 mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors" title="Volver">
              <ArrowLeft size={24} />
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
                  >
                    <span className="module-form-toolbar__step-badge">
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
