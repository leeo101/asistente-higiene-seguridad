import { ArrowLeft } from 'lucide-react';
import type { ModuleAction } from './types';

interface ModuleWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  finalActions?: ModuleAction[];
}

const FINAL_VARIANT_CLASS: Record<NonNullable<ModuleAction['variant']>, string> = {
  primary: 'module-wizard-footer__final-btn--primary',
  secondary: 'module-wizard-footer__final-btn--secondary',
  danger: 'module-wizard-footer__final-btn--danger',
  warning: 'module-wizard-footer__final-btn--warning',
  info: 'module-wizard-footer__final-btn--info',
};

export function ModuleWizardFooter({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  finalActions = [],
}: ModuleWizardFooterProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep >= totalSteps;

  return (
    <div className="module-wizard-footer no-print">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className="module-wizard-footer__back"
      >
        <ArrowLeft size={18} /> Atrás
      </button>

      {!isLast ? (
        <button type="button" onClick={onNext} className="module-wizard-footer__next">
          Siguiente Paso
        </button>
      ) : (
        <div className="module-wizard-footer__final">
          {finalActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={`module-wizard-footer__final-btn ${
                FINAL_VARIANT_CLASS[action.variant ?? 'secondary']
              }`}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
