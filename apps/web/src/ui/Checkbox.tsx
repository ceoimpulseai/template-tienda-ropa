import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ className = '', label, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const checkbox = (
    <input
      type="checkbox"
      id={inputId}
      className={`h-4 w-4 rounded border-border text-primary transition outline-none focus:ring-1 focus:ring-primary-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );

  if (!label) return checkbox;

  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm text-text select-none">
      {checkbox}
      {label}
    </label>
  );
}
