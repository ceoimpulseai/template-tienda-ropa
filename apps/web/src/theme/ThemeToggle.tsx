import { useTheme } from './ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg-subtle"
    >
      {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}
