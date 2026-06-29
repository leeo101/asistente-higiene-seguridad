import type { ReactNode } from 'react';

interface ModuleFormSectionProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  printTitle?: string;
}

export function ModuleFormSection({
  title,
  icon,
  children,
  className = '',
  printTitle,
}: ModuleFormSectionProps) {
  return (
    <section className={`mb-8 ${className}`.trim()}>
      {title && (
        <h3 className="no-print flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-500 font-black text-lg uppercase tracking-wide">
          {icon && <span className="flex items-center text-xl">{icon}</span>}
          {title}
        </h3>
      )}
      {printTitle && (
        <h3 className="print-only flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-500 font-black text-lg uppercase tracking-wide">
          {icon && <span className="flex items-center text-xl">{icon}</span>}
          {printTitle}
        </h3>
      )}
      <div className="w-full">{children}</div>
    </section>
  );
}
