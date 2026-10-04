// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';
import { PurchaseLineItem } from './purchase-line-item.model.js';

export class PurchaseOrder extends Model<InferAttributes<PurchaseOrder>, InferCreationAttributes<PurchaseOrder>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare branchId: string;
  declare supplierId: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare totalCost: CreationOptional<number>;
  declare status: 'draft' | 'completed' | 'cancelled';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare lines?: PurchaseLineItem[];
  declare supplier?: any;
  declare branch?: any;
}

PurchaseOrder.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    totalCost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'completed', 'cancelled'), allowNull: false, defaultValue: 'completed' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'purchaseOrder', tableName: 'purchase_orders' },
);