import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.createTable('businesses', {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    currencySymbol: { type: DataTypes.STRING, allowNull: false, defaultValue: '$' },
    taxPercent: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('branches', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('business_members', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'staff'), allowNull: false, defaultValue: 'staff' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('items', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('purchases', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('sales', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('costs', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('fixed', 'variable'), allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.dropTable('costs');
  await queryInterface.dropTable('sales');
  await queryInterface.dropTable('purchases');
  await queryInterface.dropTable('items');
  await queryInterface.dropTable('business_members');
  await queryInterface.dropTable('branches');
  await queryInterface.dropTable('businesses');
};
