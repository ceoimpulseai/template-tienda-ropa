import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Business extends Model<InferAttributes<Business>, InferCreationAttributes<Business>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare currencySymbol: CreationOptional<string>;
  declare taxPercent: CreationOptional<number>;
  declare catalogWhatsapp: CreationOptional<string | null>;
}

Business.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    currencySymbol: { type: DataTypes.STRING, allowNull: false, defaultValue: '$' },
    taxPercent: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    catalogWhatsapp: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'business', tableName: 'businesses' },
);
