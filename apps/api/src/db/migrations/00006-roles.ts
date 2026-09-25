import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE "business_members"
    ALTER COLUMN role TYPE ENUM('admin', 'manager', 'operator', 'viewer')
    USING role::text::ENUM('admin', 'manager', 'operator', 'viewer');
  `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE "business_members"
    ALTER COLUMN role TYPE ENUM('admin', 'staff')
    USING role::text::ENUM('admin', 'staff');
  `);
};