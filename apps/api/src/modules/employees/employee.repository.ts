import { TenantRepository } from '../../lib/repository/base.js';
import { Employee, Schedule } from './employee.model.js';
import { Op } from 'sequelize';

export const employeeRepository = new TenantRepository(Employee);

export const scheduleRepository = new TenantRepository(Schedule);

export async function findSchedulesByEmployeeIds(employeeIds: string[]) {
  if (employeeIds.length === 0) return [];
  return Schedule.findAll({ where: { employeeId: { [Op.in]: employeeIds } } });
}

export async function findSchedulesByDateRange(businessId: string, fromDate: Date, toDate: Date) {
  const employees = await employeeRepository.findAll(businessId);
  const employeeIds = employees.map(e => e.id);
  if (employeeIds.length === 0) return [];

  const schedules = await Schedule.findAll({
    where: { employeeId: { [Op.in]: employeeIds } },
  });

  const dayOfWeekFrom = fromDate.getDay();
  const dayOfWeekTo = toDate.getDay();

  return schedules;
}