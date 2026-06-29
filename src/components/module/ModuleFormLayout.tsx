import type { ReactNode } from 'react';

interface ModuleFormLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: number | string;
}

export function ModuleFormLayout({
  children,
  className = '',
  maxWidth = 950,
}: ModuleFormLayoutProps) {
  const width = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <div className={`w-full mx-auto px-4 sm:px-8 py-4 ${className}`.trim()} style={{ maxWidth: width }}>
      {children}
    </div>
  );
}
