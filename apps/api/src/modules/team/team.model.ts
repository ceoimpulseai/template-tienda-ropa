import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../config/database.js';

export type MemberRole = 'admin' | 'staff';

export class BusinessMember extends Model<
  InferAttributes<BusinessMember>,
  InferCreationAttributes<BusinessMember>
> {
  declare id: CreationOptional<string>;
  declare businessId: string;
  declare userId: string;
  declare role: MemberRole;
}

BusinessMember.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'staff'), allowNull: false, defaultValue: 'staff' },
  },
  { sequelize, modelName: 'businessMember', tableName: 'business_members' },
);
