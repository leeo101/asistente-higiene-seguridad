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
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.18)] max-w-fit mx-auto transition-all"
      >
        {actions.map((action) => {
          let bgColor = '#3b82f6';
          let hoverColor = '#2563eb';
          if (action.variant === 'secondary') { bgColor = '#8b5cf6'; hoverColor = '#7c3aed'; }
          if (action.variant === 'danger') { bgColor = '#ef4444'; hoverColor = '#dc2626'; }
          if (action.variant === 'warning') { bgColor = '#f59e0b'; hoverColor = '#d97706'; }
          if (action.variant === 'info') { bgColor = '#0ea5e9'; hoverColor = '#0284c7'; }
          if (action.variant === 'primary') { bgColor = '#10b981'; hoverColor = '#059669'; }

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
              className={`flex flex-none items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-xs sm:text-sm ${
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
