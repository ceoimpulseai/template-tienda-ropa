import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const baseClasses =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted transition outline-none focus:border-primary focus:ring-1 focus:ring-primary-ring disabled:cursor-not-allowed disabled:opacity-50';

const errorClasses = 'border-danger focus:border-danger focus:ring-danger';

export function Input({ className = '', label, hint, error, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <input
      id={inputId}
      className={`${baseClasses} ${error ? errorClasses : ''} ${className}`}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={hint || error ? `${inputId}-desc` : undefined}
      {...props}
    />
  );

  if (!label && !hint && !error) return input;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      {input}
      {(hint || error) && (
        <p
          id={`${inputId}-desc`}
          className={`text-xs ${error ? 'text-danger' : 'text-text-muted'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
