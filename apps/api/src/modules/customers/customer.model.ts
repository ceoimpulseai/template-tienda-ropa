import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Customer extends Model<InferAttributes<Customer>, InferCreationAttributes<Customer>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare name: string;
  declare email: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare cuit: CreationOptional<string | null>;
  declare dni: CreationOptional<string | null>;
  declare vatCondition: CreationOptional<string | null>;
  // Campos específicos de indumentaria
  declare preferredSizes: CreationOptional<Record<string, string> | null>;
  declare preferredCategories: CreationOptional<string[] | null>;
  declare fitNotes: CreationOptional<string | null>;
}

Customer.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    cuit: { type: DataTypes.STRING(11), allowNull: true, field: 'cuit' },
    dni: { type: DataTypes.STRING, allowNull: true, field: 'dni' },
    vatCondition: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Consumidor Final', field: 'vatCondition' },
    // Campos de indumentaria
    preferredSizes: { type: DataTypes.JSONB, allowNull: true },
    preferredCategories: { type: DataTypes.JSONB, allowNull: true },
    fitNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'customer', tableName: 'customers' },
);