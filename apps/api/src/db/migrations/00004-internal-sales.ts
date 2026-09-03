import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // Nuevas columnas en sales
  await queryInterface.addColumn('sales', 'isInternal', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('sales', 'amountReceived', {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  });

  // Agregar 'extraordinary' al ENUM de costs.type
  // PostgreSQL: ALTER TYPE … ADD VALUE (envuelto en try/catch para SQLite)
  try {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_costs_type" ADD VALUE 'extraordinary'`);
  } catch {
    // SQLite o el valor ya existe — no hacer nada
  }
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('sales', 'amountReceived');
  await queryInterface.removeColumn('sales', 'isInternal');
  // Nota: PostgreSQL no permite remover valores de ENUM fácilmente.
  // En la práctica se deja el valor huérfano o se hace una migración más compleja.
};