import { useState, useEffect, useCallback } from 'react';
import { ViewSelector, type CalendarViewMode } from './ViewSelector';
import { CalendarGrid } from './CalendarGrid';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { useEmployees } from './useEmployees';
import type { Employee, Schedule } from '@template/shared';

export function EmployeesCalendarTab() {
  const { employees, loading, getSchedules } = useEmployees();
  const [activeView, setActiveView] = useState<CalendarViewMode>('month');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [anchorDate, setAnchorDate] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  );

  const fetchSchedulesForRange = useCallback(async (from: string, to: string) => {
    setSchedulesLoading(true);
    try {
      const data = await getSchedules(from, to);
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setSchedulesLoading(false);
    }
  }, [getSchedules]);

  const getMondayIndex = (dateStr: string): number => {
    const jsDay = new Date(dateStr + 'T00:00:00Z').getUTCDay();
    return (jsDay + 6) % 7;
  };

  const addDays = (dateStr: string, n: number): string => {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const getWeekRange = (dateStr: string): [string, string] => {
    const mondayOffset = getMondayIndex(dateStr);
    const weekStart = addDays(dateStr, -mondayOffset);
    const weekEnd = addDays(weekStart, 6);
    return [weekStart, weekEnd];
  };

  const getMonthRange = (y: number, m: number): [string, string] => {
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
    return [start, end];
  };

  const handleNavigatePrev = useCallback(() => {
    if (activeView === 'month') {
      if (month === 1) {
        setYear(year - 1);
        setMonth(12);
      } else {
        setMonth(month - 1);
      }
    } else if (activeView === 'week') {
      const newAnchor = addDays(anchorDate, -7);
      setAnchorDate(newAnchor);
    } else {
      setAnchorDate(addDays(anchorDate, -1));
    }
  }, [activeView, year, month, anchorDate]);

  const handleNavigateNext = useCallback(() => {
    if (activeView === 'month') {
      if (month === 12) {
        setYear(year + 1);
        setMonth(1);
      } else {
        setMonth(month + 1);
      }
    } else if (activeView === 'week') {
      const newAnchor = addDays(anchorDate, 7);
      setAnchorDate(newAnchor);
    } else {
      setAnchorDate(addDays(anchorDate, 1));
    }
  }, [activeView, year, month, anchorDate]);

  const handleNavigateToDay = useCallback((date: string) => {
    setAnchorDate(date);
    setActiveView('day');
  }, []);

  useEffect(() => {
    if (activeView === 'month') {
      const [from, to] = getMonthRange(year, month);
      fetchSchedulesForRange(from, to);
    } else if (activeView === 'week') {
      const [from, to] = getWeekRange(anchorDate);
      fetchSchedulesForRange(from, to);
    } else {
      const from = anchorDate;
      const to = anchorDate;
      fetchSchedulesForRange(from, to);
    }
  }, [activeView, year, month, anchorDate, fetchSchedulesForRange]);

  const getHeaderLabel = (): string => {
    if (activeView === 'month') {
      return new Date(year, month - 1).toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric',
      });
    } else if (activeView === 'week') {
      const [weekStart, weekEnd] = getWeekRange(anchorDate);
      const start = new Date(weekStart);
      const end = new Date(weekEnd);
      const startStr = start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      const date = new Date(anchorDate + 'T00:00:00');
      return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };

  const getNavigationAriaLabel = (): [string, string] => {
    if (activeView === 'month') return ['Mes anterior', 'Mes siguiente'];
    if (activeView === 'week') return ['Semana anterior', 'Semana siguiente'];
    return ['Día anterior', 'Día siguiente'];
  };

  const [prevLabel, nextLabel] = getNavigationAriaLabel();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 bg-surface border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNavigatePrev}
            aria-label={prevLabel}
            className="p-2 rounded-full hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-primary"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold capitalize">{getHeaderLabel()}</h1>
          <button
            onClick={handleNavigateNext}
            aria-label={nextLabel}
            className="p-2 rounded-full hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-primary"
          >
            →
          </button>
        </div>
        <ViewSelector value={activeView} onChange={setActiveView} />
      </div>

      <div className="flex-1 overflow-auto">
        {(loading || schedulesLoading) && (
          <div className="flex items-center justify-center p-8 text-text-muted">Cargando…</div>
        )}
        {!loading && !schedulesLoading && activeView === 'month' && (
          <CalendarGrid
            year={year}
            month={month}
            employees={employees}
            schedules={schedules}
            onSelectDay={handleNavigateToDay}
          />
        )}
        {!loading && !schedulesLoading && activeView === 'week' && (
          <CalendarWeekView
            anchorDate={anchorDate}
            employees={employees}
            schedules={schedules}
          />
        )}
        {!loading && !schedulesLoading && activeView === 'day' && (
          <CalendarDayView
            anchorDate={anchorDate}
            employees={employees}
            schedules={schedules}
          />
        )}
      </div>
    </div>
  );
}