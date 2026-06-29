import type { ReactNode } from 'react';

interface ModuleFormDocumentProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function ModuleFormDocument({
  id,
  children,
  className = '',
}: ModuleFormDocumentProps) {
  return (
    <div
      id={id}
      className={`w-full box-border p-4 md:px-8 md:py-6 mx-auto card bg-white dark:bg-slate-800 shadow-sm rounded-2xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}
