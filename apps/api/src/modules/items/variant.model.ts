// Variante de producto: combinación talle/color con stock propio.
// Cada Item puede tener múltiples variantes (ej: remera M rojo, remera L azul).
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Variant extends Model<InferAttributes<Variant>, InferCreationAttributes<Variant>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare itemId: string;
  declare size: string;
  declare color: string;
  declare colorHex: CreationOptional<string | null>;
  declare sku: string;
  declare price: CreationOptional<number | null>;
  declare stock: CreationOptional<number>;
  declare imagePublicId: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
}

Variant.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    size: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(100), allowNull: false },
    colorHex: { type: DataTypes.STRING(7), allowNull: true },
    sku: { type: DataTypes.STRING(100), allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    imagePublicId: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'variant', tableName: 'variants' },
);