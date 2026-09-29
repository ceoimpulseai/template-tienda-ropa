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
  declare taxId: CreationOptional<string | null>;
  declare issuerCondition: CreationOptional<string | null>;
  declare arcaEnvironment: CreationOptional<string>;
  declare arcaCertPem: CreationOptional<string | null>;
  declare arcaPrivateKeyPem: CreationOptional<string | null>;
}

Business.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    currencySymbol: { type: DataTypes.STRING, allowNull: false, defaultValue: '$' },
    taxPercent: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    catalogWhatsapp: { type: DataTypes.STRING, allowNull: true },
    taxId: { type: DataTypes.STRING(11), allowNull: true, unique: true, field: 'taxId' },
    issuerCondition: { type: DataTypes.STRING, allowNull: true, field: 'issuerCondition' },
    arcaEnvironment: { type: DataTypes.STRING, allowNull: false, defaultValue: 'homologation', field: 'arcaEnvironment' },
    arcaCertPem: { type: DataTypes.TEXT, allowNull: true, field: 'arcaCertPem' },
    arcaPrivateKeyPem: { type: DataTypes.TEXT, allowNull: true, field: 'arcaPrivateKeyPem' },
  },
  { sequelize, modelName: 'business', tableName: 'businesses' },
);
