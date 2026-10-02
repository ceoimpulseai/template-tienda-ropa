import { z } from 'zod';

export const EmployeeStatusEnum = z.enum(['active', 'inactive', 'on_leave', 'vacation', 'suspended']);
export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;

export const employeeSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  salary: z.number().nonnegative().optional().nullable(),
  hasAccount: z.boolean().default(false),
  userId: z.string().optional().nullable(),
  role: z.enum(['manager', 'operator', 'viewer']).optional().nullable(),
  status: EmployeeStatusEnum.default('active'),
  notes: z.string().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Employee = z.infer<typeof employeeSchema>;

export const scheduleSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Schedule = z.infer<typeof scheduleSchema>;

export const createEmployeeSchema = employeeSchema.omit({
  id: true,
  businessId: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const createScheduleSchema = scheduleSchema.omit({
  id: true,
  employeeId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = createScheduleSchema.partial();

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const employeeWithSchedulesSchema = employeeSchema.extend({
  schedules: z.array(scheduleSchema),
});

export type EmployeeWithSchedules = z.infer<typeof employeeWithSchedulesSchema>;