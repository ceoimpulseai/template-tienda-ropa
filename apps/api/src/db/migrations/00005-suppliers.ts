import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.createTable('suppliers', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addColumn('purchases', 'supplierId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('purchases', 'supplierId');
  await queryInterface.dropTable('suppliers');
};