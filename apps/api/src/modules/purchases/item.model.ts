// EJEMPLO: entidad genérica de referencia para los módulos purchases/sales.
// Reemplazar por las entidades reales del rubro adaptado (ej. "Producto", "Corte", "Repuesto").
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Item extends Model<InferAttributes<Item>, InferCreationAttributes<Item>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare name: string;
  declare price: number;
  declare stock: CreationOptional<number>;
}

Item.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: 'item', tableName: 'items' },
);
