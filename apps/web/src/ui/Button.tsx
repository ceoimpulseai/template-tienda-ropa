import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  // primary = solid ink (#111111 / charcoal), no shadow, radius 4-6px
  primary:
    'bg-primary text-primary-text border border-primary hover:bg-primary-hover hover:border-primary-hover focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  secondary:
    'bg-surface text-text border border-border hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ghost:
    'bg-transparent text-text-muted border border-transparent hover:bg-bg-subtle hover:text-text focus-visible:ring-2 focus-visible:ring-primary-ring',
  danger:
    'bg-danger text-text-inverse border border-danger hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 outline-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
