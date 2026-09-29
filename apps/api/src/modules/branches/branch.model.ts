import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Branch extends Model<InferAttributes<Branch>, InferCreationAttributes<Branch>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare name: string;
  declare isDefault: CreationOptional<boolean>;
  declare salesPoint: CreationOptional<number | null>;
}

Branch.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    salesPoint: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'branch', tableName: 'branches' },
);
