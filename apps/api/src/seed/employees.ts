import { Employee, Schedule } from '../modules/employees/employee.model.js';

const DEMO_EMPLOYEES = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Carlos Empleado',
    email: 'carlos@empresa.com',
    phone: '+5491133334444',
    position: 'Cajero',
    salary: 85000.00,
    hasAccount: false,
    status: 'active',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Laura Vendedora',
    email: 'laura@empresa.com',
    phone: '+5491155556666',
    position: 'Vendedora',
    salary: 92000.00,
    hasAccount: false,
    status: 'active',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000003',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Miguel Administrativo',
    email: 'miguel@empresa.com',
    phone: '+5491177778888',
    position: 'Administrativo',
    salary: 110000.00,
    hasAccount: true,
    role: 'operator',
    status: 'active',
  },
];

const DEMO_SCHEDULES = [
  // Carlos Empleado (Lunes a Viernes 9:00 - 13:00)
  { employeeId: 'e0000000-0000-4000-8000-000000000001', dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000001', dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000001', dayOfWeek: 3, startTime: '09:00', endTime: '13:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000001', dayOfWeek: 4, startTime: '09:00', endTime: '13:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000001', dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },

  // Laura Vendedora (Martes a Sábado 14:00 - 20:00)
  { employeeId: 'e0000000-0000-4000-8000-000000000002', dayOfWeek: 2, startTime: '14:00', endTime: '20:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000002', dayOfWeek: 3, startTime: '14:00', endTime: '20:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000002', dayOfWeek: 4, startTime: '14:00', endTime: '20:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000002', dayOfWeek: 5, startTime: '14:00', endTime: '20:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000002', dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },

  // Miguel Administrativo (Lunes a Viernes 10:00 - 18:00)
  { employeeId: 'e0000000-0000-4000-8000-000000000003', dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000003', dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000003', dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000003', dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
  { employeeId: 'e0000000-0000-4000-8000-000000000003', dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
];

export async function seedEmployees() {
  for (const employee of DEMO_EMPLOYEES) {
    const existing = await Employee.findOne({
      where: { businessId: employee.businessId, name: employee.name },
    });

    if (!existing) {
      await Employee.create(employee);
      console.log(`Employee created: ${employee.name}`);
    } else {
      console.log(`Employee already exists: ${existing.name}`);
    }
  }

  for (const schedule of DEMO_SCHEDULES) {
    const existing = await Schedule.findOne({
      where: { employeeId: schedule.employeeId, dayOfWeek: schedule.dayOfWeek },
    });

    if (!existing) {
      await Schedule.create(schedule);
      console.log(`Schedule created for employee ${schedule.employeeId} on day ${schedule.dayOfWeek}`);
    }
  }

  return DEMO_EMPLOYEES;
}