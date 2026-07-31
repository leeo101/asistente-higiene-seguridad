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
    <div className={`module-form-layout w-full mx-auto px-4 sm:px-8 pt-24 sm:pt-28 pb-16 ${className}`.trim()} style={{ maxWidth: width }}>
      {children}
    </div>
  );
}
