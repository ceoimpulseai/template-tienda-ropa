// EJEMPLO: adaptar a la lógica del rubro concreto.
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../../config/database.js';

export type CostType = 'fixed' | 'variable' | 'extraordinary';

export class Cost extends Model<InferAttributes<Cost>, InferCreationAttributes<Cost>> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare type: CostType;
  declare label: string;
  declare amount: number;
}

Cost.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('fixed', 'variable', 'extraordinary'), allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, modelName: 'cost', tableName: 'costs' },
);
