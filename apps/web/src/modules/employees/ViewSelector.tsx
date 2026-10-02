export type CalendarViewMode = 'day' | 'week' | 'month';

interface ViewSelectorProps {
  value: CalendarViewMode;
  onChange: (view: CalendarViewMode) => void;
}

const OPTIONS: { mode: CalendarViewMode; label: string }[] = [
  { mode: 'day', label: 'Día' },
  { mode: 'week', label: 'Semana' },
  { mode: 'month', label: 'Mes' },
];

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Vista del calendario" className="w-fit flex rounded-md border border-border overflow-hidden">
      {OPTIONS.map(({ mode, label }) => {
        const checked = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(mode)}
            className={[
              'px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
              checked ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text hover:bg-bg-subtle',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}