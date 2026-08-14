import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-bg-subtle text-text-muted',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>{children}</span>;
}
