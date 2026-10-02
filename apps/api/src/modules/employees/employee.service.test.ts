import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { Employee, Schedule } from './employee.model.js';
import { employeeRepository, scheduleRepository } from './employee.repository.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('employeeRepository', () => {
  let businessId: string;

  beforeEach(async () => {
    await Employee.destroy({ where: {}, truncate: true, cascade: true });
    await Business.destroy({ where: {}, truncate: true, cascade: true });

    businessId = randomUUID();
    await Business.create({ id: businessId, name: 'Test Business' });
  });

  it('creates an employee without account', async () => {
    const employee = await employeeRepository.create(businessId, {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '123456789',
      address: 'Calle 123',
      position: 'Cajero',
      salary: 500000,
      hasAccount: false,
      status: 'active',
      notes: 'Empleado de prueba',
    });

    expect(employee).toBeDefined();
    expect(employee.name).toBe('Juan Pérez');
    expect(employee.hasAccount).toBe(false);
    expect(employee.userId).toBeUndefined();
    expect(employee.role).toBeUndefined();
  });

  it('lists employees of a business', async () => {
    await employeeRepository.create(businessId, { name: 'Juan', hasAccount: false });
    await employeeRepository.create(businessId, { name: 'María', hasAccount: false });

    const employees = await employeeRepository.findAll(businessId);
    expect(employees).toHaveLength(2);
  });

  it('creates employee with schedules', async () => {
    const employee = await employeeRepository.create(businessId, {
      name: 'Con Horarios',
      hasAccount: false,
    });

    await scheduleRepository.create(businessId, { employeeId: employee.id, dayOfWeek: 1, startTime: '09:00', endTime: '13:00' });
    await scheduleRepository.create(businessId, { employeeId: employee.id, dayOfWeek: 2, startTime: '14:00', endTime: '18:00' });

    const schedules = await Schedule.findAll({ where: { employeeId: employee.id } });
    expect(schedules).toHaveLength(2);
    expect(schedules[0].dayOfWeek).toBe(1);
  });

  it('updates employee schedules', async () => {
    const created = await employeeRepository.create(businessId, { name: 'Test', hasAccount: false });

    await Schedule.destroy({ where: { employeeId: created.id } });
    await scheduleRepository.create(businessId, { employeeId: created.id, dayOfWeek: 1, startTime: '09:00', endTime: '13:00' });
    await scheduleRepository.create(businessId, { employeeId: created.id, dayOfWeek: 3, startTime: '10:00', endTime: '14:00' });

    const schedules = await Schedule.findAll({ where: { employeeId: created.id } });
    expect(schedules).toHaveLength(2);
  });
});