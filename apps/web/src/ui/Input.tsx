import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className = '', label, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <input
      id={inputId}
      className={`w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      {input}
    </div>
  );
}
