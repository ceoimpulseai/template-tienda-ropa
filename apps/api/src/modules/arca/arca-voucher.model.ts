import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export class ArcaVoucher extends Model<
  InferAttributes<ArcaVoucher>,
  InferCreationAttributes<ArcaVoucher>
> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare saleId: string;
  declare result: string;
  declare arcaVoucherId: CreationOptional<string | null>;
  declare arcaVoucherNumber: CreationOptional<number | null>;
  declare emissionCode: CreationOptional<string | null>;
  declare emissionMessage: CreationOptional<string | null>;
  declare rawResponse: string;
  declare idempotencyKey: string;
  declare emittedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ArcaVoucher.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false, field: 'businessId' },
    saleId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'saleId' },
    result: { type: DataTypes.STRING, allowNull: false },
    arcaVoucherId: { type: DataTypes.STRING, allowNull: true, field: 'arcaVoucherId' },
    arcaVoucherNumber: { type: DataTypes.INTEGER, allowNull: true, field: 'arcaVoucherNumber' },
    emissionCode: { type: DataTypes.STRING, allowNull: true, field: 'emissionCode' },
    emissionMessage: { type: DataTypes.TEXT, allowNull: true, field: 'emissionMessage' },
    rawResponse: { type: DataTypes.TEXT, allowNull: false, field: 'rawResponse' },
    idempotencyKey: { type: DataTypes.STRING, allowNull: false, field: 'idempotencyKey' },
    emittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'emittedAt' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'createdAt' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updatedAt' },
  },
  { sequelize, modelName: 'arca_voucher', tableName: 'arca_vouchers' },
);