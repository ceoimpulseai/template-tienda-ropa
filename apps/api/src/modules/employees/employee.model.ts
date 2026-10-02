import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'vacation' | 'suspended';
export type EmployeeRole = 'manager' | 'operator' | 'viewer';

export class Employee extends Model<
  InferAttributes<Employee>,
  InferCreationAttributes<Employee>
> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare name: string;
  declare email: string | null;
  declare phone: string | null;
  declare address: string | null;
  declare position: string | null;
  declare salary: number | null;
  declare hasAccount: boolean;
  declare userId: string | null;
  declare role: EmployeeRole | null;
  declare status: EmployeeStatus;
  declare notes: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Employee.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    position: { type: DataTypes.STRING, allowNull: true },
    salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    hasAccount: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    userId: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('manager', 'operator', 'viewer'), allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'vacation', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'employee', tableName: 'employees' },
);

export class Schedule extends Model<
  InferAttributes<Schedule>,
  InferCreationAttributes<Schedule>
> {
  declare id: CreationOptional<string>;
  declare employeeId: string;
  declare dayOfWeek: number;
  declare startTime: string;
  declare endTime: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Schedule.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    employeeId: { type: DataTypes.UUID, allowNull: false },
    dayOfWeek: { type: DataTypes.SMALLINT, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'schedule', tableName: 'schedules' },
);