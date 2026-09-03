// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';

export class Purchase extends Model<InferAttributes<Purchase>, InferCreationAttributes<Purchase>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare branchId: string;
  declare itemId: string;
  declare supplierId: CreationOptional<string | null>;
  declare quantity: number;
  declare unitCost: number;
}

Purchase.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, modelName: 'purchase', tableName: 'purchases' },
);
