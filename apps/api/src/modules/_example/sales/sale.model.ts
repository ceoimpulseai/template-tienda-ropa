// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';

export class Sale extends Model<InferAttributes<Sale>, InferCreationAttributes<Sale>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare branchId: string;
  declare itemId: string;
  declare customerId: CreationOptional<string | null>;
  declare quantity: number;
  declare unitPrice: number;
  declare isInternal: CreationOptional<boolean>;
  declare amountReceived: number;
  declare arcaStatus: CreationOptional<string | null>;
}

Sale.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    customerId: { type: DataTypes.UUID, allowNull: true },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    isInternal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    amountReceived: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    arcaStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  },
  { sequelize, modelName: 'sale', tableName: 'sales' },
);
