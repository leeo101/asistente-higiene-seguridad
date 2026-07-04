import type { ModuleAction } from './types';

interface ModuleActionBarProps {
  actions: ModuleAction[];
  className?: string;
}

export function ModuleActionBar({ actions, className = '' }: ModuleActionBarProps) {
  if (!actions.length) return null;

  return (
    <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }} className={`fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-4 z-[100] no-print ${className}`.trim()}>
      {actions.map((action) => {
        let bgColor = '#3b82f6';
        let hoverColor = '#2563eb';
        if (action.variant === 'secondary') { bgColor = '#64748b'; hoverColor = '#475569'; }
        if (action.variant === 'danger') { bgColor = '#ef4444'; hoverColor = '#dc2626'; }
        if (action.variant === 'warning') { bgColor = '#f59e0b'; hoverColor = '#d97706'; }
        if (action.variant === 'info') { bgColor = '#0ea5e9'; hoverColor = '#0284c7'; }
        if (action.variant === 'primary') { bgColor = '#16a34a'; hoverColor = '#15803d'; }

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            style={{ backgroundColor: bgColor, color: '#ffffff', border: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
          >
            {action.icon && <span className="flex items-center">{action.icon}</span>}
            <span className={action.hideOnMobile ? 'hidden sm:inline' : ''}>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
