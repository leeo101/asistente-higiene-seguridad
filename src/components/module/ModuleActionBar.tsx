import type { ModuleAction } from './types';

interface ModuleActionBarProps {
  actions: ModuleAction[];
  className?: string;
}

export function ModuleActionBar({ actions, className = '' }: ModuleActionBarProps) {
  if (!actions.length) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-4 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 no-print ${className}`.trim()}>
      {actions.map((action) => {
        let variantClasses = 'bg-blue-600 hover:bg-blue-700 text-white'; // default primary
        if (action.variant === 'secondary') variantClasses = 'bg-slate-500 hover:bg-slate-600 text-white';
        if (action.variant === 'danger') variantClasses = 'bg-red-500 hover:bg-red-600 text-white';
        if (action.variant === 'warning') variantClasses = 'bg-amber-500 hover:bg-amber-600 text-white';
        if (action.variant === 'info') variantClasses = 'bg-sky-500 hover:bg-sky-600 text-white';
        if (action.variant === 'primary') variantClasses = 'bg-emerald-500 hover:bg-emerald-600 text-white';

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variantClasses} ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
          >
            {action.icon && <span className="flex items-center">{action.icon}</span>}
            <span className={action.hideOnMobile ? 'hidden sm:inline' : ''}>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
