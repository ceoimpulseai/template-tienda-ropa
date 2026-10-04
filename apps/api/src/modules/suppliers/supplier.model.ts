import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Supplier extends Model<InferAttributes<Supplier>, InferCreationAttributes<Supplier>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare name: string;
  declare phone: CreationOptional<string>;
  declare email: CreationOptional<string>;
  declare address: CreationOptional<string>;
  declare notes: CreationOptional<string>;
  // Campos específicos de indumentaria
  declare garmentTypes: CreationOptional<string[] | null>;
  declare minOrderQuantity: CreationOptional<number | null>;
  declare leadTimeDays: CreationOptional<number | null>;
}

Supplier.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    // Campos de indumentaria
    garmentTypes: { type: DataTypes.JSONB, allowNull: true },
    minOrderQuantity: { type: DataTypes.INTEGER, allowNull: true },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'supplier', tableName: 'suppliers' },
);