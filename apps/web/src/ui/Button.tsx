import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-text hover:opacity-90',
  secondary: 'bg-surface text-text border border-border hover:bg-bg-subtle',
  danger: 'bg-danger text-white hover:opacity-90',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
