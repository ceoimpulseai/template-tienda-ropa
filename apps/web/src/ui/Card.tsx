import type { HTMLAttributes } from 'react';

/**
 * Card — border 1px solid var(--color-border), radius 8px, generous padding.
 * No shadow by default; consumers can opt-in with shadow classes.
 */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-6 ${className}`}
      {...props}
    />
  );
}
