import type { Employee, Schedule } from '@template/shared';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function getMondayIndex(dateStr: string): number {
  const jsDay = new Date(dateStr + 'T00:00:00Z').getUTCDay();
  return (jsDay + 6) % 7;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatHeaderLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

interface CalendarWeekViewProps {
  anchorDate: string;
  employees: Employee[];
  schedules: Schedule[];
}

export function CalendarWeekView({ anchorDate, employees, schedules }: CalendarWeekViewProps) {
  const mondayOffset = getMondayIndex(anchorDate);
  const weekStart = addDays(anchorDate, -mondayOffset);
  const columnDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const schedulesByEmployeeAndDay = schedules.reduce((acc, s) => {
    const employeeSchedules = acc[s.employeeId] ??= {};
    const daySchedules = employeeSchedules[s.dayOfWeek] ??= [];
    daySchedules.push(s);
    return acc;
  }, {} as Record<string, Record<number, Schedule[]>>);

  const getSchedulesForDay = (employeeId: string, dayOfWeek: number) => {
    return schedulesByEmployeeAndDay[employeeId]?.[dayOfWeek] ?? [];
  };

  return (
    <div className="grid grid-cols-7 gap-px border border-border overflow-x-auto">
      {columnDates.map((colDate, i) => {
        const dayOfWeek = (new Date(colDate).getDay() + 6) % 7;
        const dayEmployees = employees.filter(e => getSchedulesForDay(e.id, dayOfWeek).length > 0);

        return (
          <div key={colDate} className="flex flex-col bg-surface min-w-[140px]">
            <div className="text-center px-2 py-1.5 border-b border-border bg-bg">
              <span className="text-xs font-medium text-text-muted">
                {WEEKDAY_LABELS[i]} {formatHeaderLabel(colDate)}
              </span>
            </div>

            <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
              {dayEmployees.map(emp => {
                const daySchedules = getSchedulesForDay(emp.id, dayOfWeek);
                return daySchedules.map((sched, idx) => (
                  <div
                    key={`${emp.id}-${sched.id}`}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20"
                    title={`${emp.name}: ${sched.startTime} - ${sched.endTime}`}
                  >
                    <div className="font-medium truncate">{emp.name}</div>
                    <div className="text-[10px] opacity-80">{sched.startTime} - {sched.endTime}</div>
                  </div>
                ));
              })}
            </div>

            <div className="flex flex-col gap-px border-t border-border bg-bg/50">
              {HOURS.map(hour => (
                <div key={hour} className="h-6 border-b border-border/50 flex items-center">
                  <span className="text-[10px] text-text-muted px-1 w-16 shrink-0">{formatTime(hour)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}