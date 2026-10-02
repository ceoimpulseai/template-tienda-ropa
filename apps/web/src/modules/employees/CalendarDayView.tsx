import type { Employee, Schedule } from '@template/shared';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

interface CalendarDayViewProps {
  anchorDate: string;
  employees: Employee[];
  schedules: Schedule[];
}

export function CalendarDayView({ anchorDate, employees, schedules }: CalendarDayViewProps) {
  const dayOfWeek = (new Date(anchorDate).getDay() + 6) % 7;
  const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

  const schedulesByEmployee = daySchedules.reduce((acc, s) => {
    if (!acc[s.employeeId]) acc[s.employeeId] = [];
    acc[s.employeeId]!.push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const employeesWithSchedules = employees.filter(e => schedulesByEmployee[e.id]?.length);

  const dateObj = new Date(anchorDate + 'T00:00:00');
  const headerDate = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{headerDate}</h2>
        <span className="text-sm text-text-muted">
          {employeesWithSchedules.length} empleado{employeesWithSchedules.length !== 1 ? 's' : ''} agendado{employeesWithSchedules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {employeesWithSchedules.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          No hay empleados agendados para este día
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">Empleados del día</h3>
{employeesWithSchedules.map(emp => {
                const empSchedules = schedulesByEmployee[emp.id]!;
                return (
                <div key={emp.id} className="p-3 bg-surface border border-border rounded-lg">
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-sm text-text-muted">{emp.position || 'Sin cargo'}</div>
                  <div className="mt-2 flex flex-col gap-1">
                    {empSchedules.map(sched => (
                      <span key={sched.id} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {sched.startTime} - {sched.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-px border border-border">
            <div className="grid grid-cols-[60px_1fr] gap-px border-b border-border bg-bg">
              <div className="text-center text-xs font-medium text-text-muted py-1 px-1">Hora</div>
              <div className="text-center text-xs font-medium text-text-muted py-1 px-1">Empleados</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {HOURS.map(hour => {
                const hourStr = formatTime(hour);
                const employeesAtHour = employeesWithSchedules.filter(emp => {
                  return schedulesByEmployee[emp.id]?.some(s => {
                    const start = parseInt(s.startTime?.split(':')[0] ?? '0');
                    const end = parseInt(s.endTime?.split(':')[0] ?? '0');
                    return hour >= start && hour < end;
                  });
                });

                return (
                  <div key={hour} className="grid grid-cols-[60px_1fr] gap-px border-b border-border/50 bg-surface/50">
                    <div className="text-[10px] text-text-muted py-1 px-1 text-right pr-2">{hourStr}</div>
                    <div className="py-1 px-1 min-h-8">
                      {employeesAtHour.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {employeesAtHour.map(emp => (
                            <span key={emp.id} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                              {emp.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}