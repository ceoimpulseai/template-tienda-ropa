// Entidad genérica: catálogo de items de un negocio. Se mantiene entre forks del
// template (a diferencia de los módulos de ejemplo en `_example/`) porque
// purchases, sales y el catálogo público dependen de ella.
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
  declare visibleInCatalog: CreationOptional<boolean>;
}

Item.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    visibleInCatalog: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: 'item', tableName: 'items' },
);
