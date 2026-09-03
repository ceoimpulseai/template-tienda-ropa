import type { HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<ContainerProps['size']>, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
};

/**
 * Container — editorial-style content wrapper.
 * Default: max-w-4xl (per minimalist-ui protocol), generous vertical padding.
 * Used at the page level to enforce macro-whitespace and reading width.
 */
export function Container({ size = 'md', className = '', ...props }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-6 py-12 md:py-16 ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
