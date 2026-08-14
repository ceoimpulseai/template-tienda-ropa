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
      className={`h-4 w-4 rounded border-border text-primary focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...props}
    />
  );

  if (!label) return checkbox;

  return (
    <label htmlFor={inputId} className="flex items-center gap-2 text-sm text-text">
      {checkbox}
      {label}
    </label>
  );
}
