import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('items', 'sizes', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('items', 'sizes');
};