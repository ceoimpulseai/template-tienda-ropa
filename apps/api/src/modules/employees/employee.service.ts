import { auth } from '../../config/auth.js';
import { employeeRepository, scheduleRepository, findSchedulesByEmployeeIds } from './employee.repository.js';
import { tenantCache, makeMemberCacheKey } from '../../lib/tenantCache.js';
import type { CreateEmployeeInput, UpdateEmployeeInput, CreateScheduleInput, UpdateScheduleInput, Employee, Schedule } from '@template/shared';
import { Op } from 'sequelize';
import { Employee as EmployeeModel, Schedule as ScheduleModel } from './employee.model.js';

export const employeeService = {
  async list(businessId: string) {
    return employeeRepository.findAll(businessId);
  },

  async listWithSchedules(businessId: string) {
    const employees = await employeeRepository.findAll(businessId);
    const employeeIds = employees.map(e => e.id);
    const schedules = await findSchedulesByEmployeeIds(employeeIds);

    const schedulesByEmployee = schedules.reduce((acc, s) => {
      if (!acc[s.employeeId]) acc[s.employeeId] = [];
      acc[s.employeeId].push(s);
      return acc;
    }, {} as Record<string, Schedule[]>);

    return employees.map(e => ({ ...e.toJSON(), schedules: schedulesByEmployee[e.id] ?? [] }));
  },

  async getById(businessId: string, id: string) {
    return employeeRepository.findOne(businessId, { where: { id } });
  },

  async create(businessId: string, input: CreateEmployeeInput) {
    const { schedules: _schedules, hasAccount, role, ...employeeData } = input;

    const employee = await employeeRepository.create(businessId, employeeData);

    if (input.schedules && input.schedules.length > 0) {
      await Promise.all(
        input.schedules.map(s => scheduleRepository.create(businessId, { ...s, employeeId: employee.id }))
      );
    }

    if (hasAccount && input.email && input.password) {
      const created = await auth.api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password },
      });
      tenantCache.delete(makeMemberCacheKey(created.user.id));

      await employee.update({ userId: created.user.id, role: role ?? 'operator', hasAccount: true });
    }

    return this.getById(businessId, employee.id);
  },

  async update(businessId: string, id: string, input: UpdateEmployeeInput) {
    const employee = await employeeRepository.findOne(businessId, { where: { id } });
    if (!employee) throw new Error('Employee not found');

    const { schedules: _schedules, hasAccount, role, password, ...employeeData } = input;

    await employee.update(employeeData);

    if (input.schedules !== undefined) {
      await ScheduleModel.destroy({ where: { employeeId: employee.id } });
      if (input.schedules.length > 0) {
        await Promise.all(
          input.schedules.map(s => scheduleRepository.create(businessId, { ...s, employeeId: employee.id }))
        );
      }
    }

    if (hasAccount !== undefined && hasAccount !== employee.hasAccount) {
      if (hasAccount) {
        if (!employee.email || !password) {
          throw new Error('Email and password required when enabling account');
        }
        const created = await auth.api.signUpEmail({
          body: { name: employee.name, email: employee.email, password },
        });
        tenantCache.delete(makeMemberCacheKey(created.user.id));
        await employee.update({ userId: created.user.id, role: role ?? 'operator', hasAccount: true });
      } else {
        if (employee.userId) {
          await auth.api.deleteUser({ body: { userId: employee.userId } });
        }
        await employee.update({ userId: null, role: null, hasAccount: false });
      }
    } else if (hasAccount && employee.hasAccount) {
      if (role && role !== employee.role) {
        await employee.update({ role });
      }
      if (password) {
        await auth.api.changePassword({ body: { currentPassword: '', newPassword: password, revokeOtherSessions: true } });
      }
    }

    return this.getById(businessId, employee.id);
  },

  async remove(businessId: string, id: string) {
    const employee = await employeeRepository.findOne(businessId, { where: { id } });
    if (!employee) throw new Error('Employee not found');

    if (employee.userId) {
      await auth.api.deleteUser({ body: { userId: employee.userId } });
    }

    await ScheduleModel.destroy({ where: { employeeId: employee.id } });
    await employeeRepository.remove(businessId, id);
  },

  async getSchedulesByDateRange(businessId: string, fromDate: string, toDate: string) {
    const employees = await employeeRepository.findAll(businessId);
    const employeeIds = employees.map(e => e.id);
    if (employeeIds.length === 0) return { employees: [], schedules: [] };

    const daysOfWeek = [];
    let current = new Date(fromDate);
    const end = new Date(toDate);
    while (current <= end) {
      daysOfWeek.push((current.getDay() + 6) % 7);
      current.setDate(current.getDate() + 1);
    }

    const schedules = await ScheduleModel.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        dayOfWeek: { [Op.in]: daysOfWeek },
      },
    });

    return { employees, schedules };
  },
};