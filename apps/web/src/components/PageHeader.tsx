import type { ReactNode } from 'react';
import { BranchSwitcher } from '../modules/branches/BranchSwitcher';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  showBranchSwitcher?: boolean;
}

export function PageHeader({
  title,
  description,
  action,
  showBranchSwitcher = true,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {showBranchSwitcher && <BranchSwitcher />}
        {action}
      </div>
    </div>
  );
}
