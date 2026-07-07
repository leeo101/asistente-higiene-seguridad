import type { ModuleAction } from './types';

interface ModuleActionBarProps {
  actions: ModuleAction[];
  className?: string;
}

export function ModuleActionBar({ actions, className = '' }: ModuleActionBarProps) {
  if (!actions.length) return null;

  return (
    <div style={{ pointerEvents: 'none' }} className={`fixed bottom-4 left-0 right-0 p-4 flex flex-wrap justify-center gap-3 md:gap-4 z-[100] no-print ${className}`.trim()}>
      {actions.map((action) => {
        let bgColor = '#3b82f6';
        let hoverColor = '#2563eb';
        if (action.variant === 'secondary') { bgColor = '#8b5cf6'; hoverColor = '#7c3aed'; } // Morado para secundario
        if (action.variant === 'danger') { bgColor = '#ef4444'; hoverColor = '#dc2626'; }
        if (action.variant === 'warning') { bgColor = '#f59e0b'; hoverColor = '#d97706'; }
        if (action.variant === 'info') { bgColor = '#0ea5e9'; hoverColor = '#0284c7'; }
        if (action.variant === 'primary') { bgColor = '#10b981'; hoverColor = '#059669'; } // Verde vibrante

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            style={{ backgroundColor: bgColor, color: '#ffffff', border: 'none', pointerEvents: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; e.currentTarget.style.transform = 'none'; }}
            className={`flex flex-none items-center justify-center gap-1.5 px-4 py-2 rounded-[20px] font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
          >
            {action.icon && <span className="flex items-center scale-90">{action.icon}</span>}
            <span className={action.hideOnMobile ? 'hidden sm:inline' : 'text-xs md:text-sm whitespace-nowrap'}>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
