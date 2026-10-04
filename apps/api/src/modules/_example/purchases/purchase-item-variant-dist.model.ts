// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';
import { Variant } from '../../items/variant.model.js';
import { PurchaseLineItem } from './purchase-line-item.model.js';

export class PurchaseItemVariantDist extends Model<InferAttributes<PurchaseItemVariantDist>, InferCreationAttributes<PurchaseItemVariantDist>> {
  declare id: CreationOptional<string>;
  declare purchaseLineItemId: string;
  declare variantId: string;
  declare quantity: number;
  declare unitCost: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare variant?: Variant;
  declare purchaseLineItem?: PurchaseLineItem;
}

PurchaseItemVariantDist.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    purchaseLineItemId: { type: DataTypes.UUID, allowNull: false },
    variantId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'purchaseItemVariantDist', tableName: 'purchase_item_variant_dists' },
);