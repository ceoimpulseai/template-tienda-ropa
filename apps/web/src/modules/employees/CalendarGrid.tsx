import { useRef, useState } from 'react';
import type { Employee, Schedule } from '@template/shared';

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface CalendarGridProps {
  year: number;
  month: number;
  employees: Employee[];
  schedules: Schedule[];
  onSelectDay: (date: string) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay();
  return (jsDay + 6) % 7;
}

interface CellData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  employeeNames: string[];
}

export function CalendarGrid({ year, month, employees, schedules, onSelectDay }: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const cells: CellData[] = [];

  const schedulesByEmployeeAndDay = schedules.reduce((acc, s) => {
    if (!acc[s.employeeId]) acc[s.employeeId] = new Set();
    acc[s.employeeId]!.add(s.dayOfWeek);
    return acc;
  }, {} as Record<string, Set<number>>);

  for (let i = firstDow - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${prevMonthYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
    const employeeNames = employees
      .filter(e => schedulesByEmployeeAndDay[e.id]?.has(dayOfWeek))
      .map(e => e.name);
    cells.push({ date: dateStr, day, isCurrentMonth: false, employeeNames });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
    const employeeNames = employees
      .filter(e => schedulesByEmployeeAndDay[e.id]?.has(dayOfWeek))
      .map(e => e.name);
    cells.push({ date: dateStr, day: d, isCurrentMonth: true, employeeNames });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      const dateStr = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
      const employeeNames = employees
        .filter(e => schedulesByEmployeeAndDay[e.id]?.has(dayOfWeek))
        .map(e => e.name);
      cells.push({ date: dateStr, day: d, isCurrentMonth: false, employeeNames });
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    e.preventDefault();
    const focusedBtn = document.activeElement as HTMLButtonElement;
    const focusedIndex = focusedBtn?.getAttribute('data-date')
      ? cells.findIndex(c => c.date === focusedBtn.getAttribute('data-date'))
      : -1;

    if (focusedIndex === -1) {
      const firstBtn = gridRef.current?.querySelector('button[data-date]') as HTMLButtonElement;
      firstBtn?.focus();
      return;
    }

    let nextIndex = focusedIndex;
    if (e.key === 'ArrowLeft') nextIndex = Math.max(0, focusedIndex - 1);
    else if (e.key === 'ArrowRight') nextIndex = Math.min(cells.length - 1, focusedIndex + 1);
    else if (e.key === 'ArrowUp') nextIndex = Math.max(0, focusedIndex - 7);
    else if (e.key === 'ArrowDown') nextIndex = Math.min(cells.length - 1, focusedIndex + 7);

    const nextCell = cells[nextIndex];
    if (!nextCell) return;
    const nextBtn = gridRef.current?.querySelector(`button[data-date="${nextCell.date}"]`) as HTMLButtonElement;
    nextBtn?.focus();
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    onSelectDay(date);
  };

  return (
    <div ref={gridRef} role="grid" aria-label="Calendario mensual" className="flex flex-col" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-7 gap-px border border-border">
        {WEEKDAY_HEADERS.map(h => (
          <div key={h} role="columnheader" className="text-center text-xs font-medium text-text-muted py-2 bg-bg">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px border-t border-border">
        {cells.map(({ date, day, isCurrentMonth, employeeNames }) => (
          <div
            key={date}
            className={[
              'relative flex flex-col items-center justify-start min-h-[80px] h-full bg-surface',
              isCurrentMonth ? 'text-text' : 'text-text-muted',
            ].join(' ')}
          >
            <button
              type="button"
              data-date={date}
              data-testid={`day-cell-${date}`}
              aria-label={`${day}${employeeNames.length > 0 ? `, ${employeeNames.length} empleado${employeeNames.length > 1 ? 's' : ''}` : ''}`}
              onClick={() => handleSelectDay(date)}
              className="flex flex-col items-center w-full h-full justify-start p-1 hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <span className="text-sm font-medium">{day}</span>
              {employeeNames.length > 0 && (
                <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden max-h-[60px]">
                  {employeeNames.slice(0, 3).map((name, i) => (
                    <span key={i} className="text-[10px] truncate px-1 py-0.5 bg-primary/10 text-primary rounded text-center">
                      {name}
                    </span>
                  ))}
                  {employeeNames.length > 3 && (
                    <span className="text-[10px] text-text-muted text-center">+{employeeNames.length - 3} más</span>
                  )}
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}