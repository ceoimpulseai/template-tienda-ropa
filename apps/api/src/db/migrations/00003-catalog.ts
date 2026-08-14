import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('items', 'visibleInCatalog', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('businesses', 'catalogWhatsapp', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('businesses', 'catalogWhatsapp');
  await queryInterface.removeColumn('items', 'visibleInCatalog');
};
