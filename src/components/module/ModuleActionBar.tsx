import type { ModuleAction } from './types';
import { Loader2 } from 'lucide-react';

interface ModuleActionBarProps {
  actions: ModuleAction[];
  className?: string;
}

export function ModuleActionBar({ actions, className = '' }: ModuleActionBarProps) {
  if (!actions.length) return null;

  return (
    <div
      style={{ pointerEvents: 'none' }}
      className={`fixed bottom-4 sm:bottom-6 left-0 right-0 px-3 py-2 flex justify-center z-[100] no-print ${className}`.trim()}
    >
      <div
        style={{ pointerEvents: 'auto' }}
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.18)] max-w-fit mx-auto transition-all"
      >
        {actions.map((action) => {
          let bgColor = '#2563eb';
          let hoverColor = '#1d4ed8';
          if (action.variant === 'secondary') { bgColor = '#475569'; hoverColor = '#334155'; }
          if (action.variant === 'danger') { bgColor = '#dc2626'; hoverColor = '#b91c1c'; }
          if (action.variant === 'warning') { bgColor = '#d97706'; hoverColor = '#b45309'; }
          if (action.variant === 'info') { bgColor = '#0284c7'; hoverColor = '#0369a1'; }
          if (action.variant === 'primary') { bgColor = '#059669'; hoverColor = '#047857'; }

          const isDisabled = action.disabled || action.loading;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={isDisabled}
              style={{
                backgroundColor: bgColor,
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.backgroundColor = hoverColor;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.backgroundColor = bgColor;
                  e.currentTarget.style.transform = 'none';
                }
              }}
              className={`flex flex-none items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-[11px] sm:text-sm ${
                action.hideOnMobile ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {action.loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                action.icon && <span className="flex items-center scale-90">{action.icon}</span>
              )}
              <span className={action.hideOnMobile ? 'hidden sm:inline' : 'whitespace-nowrap'}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
