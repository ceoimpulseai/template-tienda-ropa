import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

// Fiscal condition enum values — single source of truth
const FISCAL_CONDITIONS = [
  'IVA Responsable Inscripto',
  'IVA Responsable No Inscripto',
  'IVA No Responsable',
  'IVA Sujeto Exento',
  'Consumidor Final',
  'Responsable Monotributo',
  'Sujeto No Categorizado',
  'Proveedor del Exterior',
  'Cliente del Exterior',
  'Liberado - Ley 19.640',
  'IVA Responsable Inscripto - Agente de Percepción',
  'Pequeño Contribuyente Eventual',
  'Monotributista Social',
  'Pequeño Contribuyente Eventual Social',
] as const;

const ARCA_ENVIRONMENTS = ['production', 'homologation'] as const;
const ARCA_STATUS_VALUES = ['authorized', 'rejected', 'indeterminate', 'conflict'] as const;

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // 1. Business columns (5)
  await queryInterface.addColumn('businesses', 'taxId', {
    type: DataTypes.STRING(11),
    allowNull: true,
    unique: true,
  });

  await queryInterface.addColumn('businesses', 'issuerCondition', {
    type: DataTypes.ENUM(...FISCAL_CONDITIONS),
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'arcaEnvironment', {
    type: DataTypes.ENUM(...ARCA_ENVIRONMENTS),
    allowNull: false,
    defaultValue: 'homologation',
  });

  await queryInterface.addColumn('businesses', 'arcaCertPem', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'arcaPrivateKeyPem', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 2. Branch column
  await queryInterface.addColumn('branches', 'salesPoint', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  // 3. Customer columns (3)
  await queryInterface.addColumn('customers', 'cuit', {
    type: DataTypes.STRING(11),
    allowNull: true,
  });

  await queryInterface.addColumn('customers', 'dni', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('customers', 'vatCondition', {
    type: DataTypes.ENUM(...FISCAL_CONDITIONS),
    allowNull: true,
    defaultValue: 'Consumidor Final',
  });

  // 4. Sale column
  await queryInterface.addColumn('sales', 'arcaStatus', {
    type: DataTypes.ENUM(...ARCA_STATUS_VALUES.slice(0, 3)), // authorized, rejected, indeterminate
    allowNull: true,
  });

  // 5. Create arca_vouchers table
  await queryInterface.createTable('arca_vouchers', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'businesses', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    saleId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'sales', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    result: {
      type: DataTypes.ENUM(...ARCA_STATUS_VALUES),
      allowNull: false,
    },
    arcaVoucherId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    arcaVoucherNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    emissionCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emissionMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rawResponse: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // 6. Create arca_store table (SDK requirement)
  await queryInterface.createTable('arca_store', {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // Reverse order: drop tables first, then remove columns

  // 6. Drop arca_store table
  await queryInterface.dropTable('arca_store');

  // 5. Drop arca_vouchers table
  await queryInterface.dropTable('arca_vouchers');

  // 4. Remove arcaStatus from sales
  await queryInterface.removeColumn('sales', 'arcaStatus');

  // 3. Remove customer columns
  await queryInterface.removeColumn('customers', 'vatCondition');
  await queryInterface.removeColumn('customers', 'dni');
  await queryInterface.removeColumn('customers', 'cuit');

  // 2. Remove branch column
  await queryInterface.removeColumn('branches', 'salesPoint');

  // 1. Remove business columns
  await queryInterface.removeColumn('businesses', 'arcaPrivateKeyPem');
  await queryInterface.removeColumn('businesses', 'arcaCertPem');
  await queryInterface.removeColumn('businesses', 'arcaEnvironment');
  await queryInterface.removeColumn('businesses', 'issuerCondition');
  await queryInterface.removeColumn('businesses', 'taxId');
};