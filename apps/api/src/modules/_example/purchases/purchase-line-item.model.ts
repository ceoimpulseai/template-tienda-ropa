// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';
import { Item } from '../../items/item.model.js';
import { PurchaseItemVariantDist } from './purchase-item-variant-dist.model.js';
import { PurchaseOrder } from './purchase-order.model.js';

export class PurchaseLineItem extends Model<InferAttributes<PurchaseLineItem>, InferCreationAttributes<PurchaseLineItem>> {
  declare id: CreationOptional<string>;
  declare purchaseOrderId: string;
  declare businessId: string;
  declare itemId: string;
  declare quantity: number;
  declare unitCost: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare item?: Item;
  declare variantDists?: PurchaseItemVariantDist[];
  declare purchaseOrder?: PurchaseOrder;
}

PurchaseLineItem.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    purchaseOrderId: { type: DataTypes.UUID, allowNull: false },
    businessId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'purchaseLineItem', tableName: 'purchase_line_items' },
);