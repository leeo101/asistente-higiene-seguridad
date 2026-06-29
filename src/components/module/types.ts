import type { MouseEvent, ReactNode } from 'react';

export type ModuleActionVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'info';

export interface ModuleAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: ModuleActionVariant;
  disabled?: boolean;
  hideOnMobile?: boolean;
}

export interface ModuleFormProgress {
  percent: number;
  label: string;
  color?: string;
}
