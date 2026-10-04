import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // 1. Create variants table
  await queryInterface.createTable('variants', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'businesses', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'items', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    size: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(100), allowNull: false },
    colorHex: { type: DataTypes.STRING(7), allowNull: true },
    sku: { type: DataTypes.STRING(100), allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    imagePublicId: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // 2. Add indexes for variants
  await queryInterface.addIndex('variants', ['itemId'], { name: 'idx_variants_item' });
  await queryInterface.addIndex('variants', ['businessId'], { name: 'idx_variants_business' });
  await queryInterface.addIndex('variants', ['businessId', 'sku'], {
    name: 'idx_variants_sku',
    unique: true,
  });

  // 3. Add columns to items (clothing-specific fields)
  await queryInterface.addColumn('items', 'category', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'gender', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'season', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'material', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'careInstructions', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'brand', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('items', 'description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 4. Add columns to suppliers (clothing-specific fields)
  await queryInterface.addColumn('suppliers', 'garmentTypes', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('suppliers', 'minOrderQuantity', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await queryInterface.addColumn('suppliers', 'leadTimeDays', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  // 5. Add columns to customers (clothing-specific fields)
  await queryInterface.addColumn('customers', 'preferredSizes', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('customers', 'preferredCategories', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('customers', 'fitNotes', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 6. Add columns to businesses (branding / public storefront)
  await queryInterface.addColumn('businesses', 'displayName', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'logoPublicId', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'coverPublicId', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'themeConfig', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'shippingPolicy', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'returnPolicy', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('businesses', 'socialLinks', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // 6. Remove business columns (reverse order)
  await queryInterface.removeColumn('businesses', 'socialLinks');
  await queryInterface.removeColumn('businesses', 'returnPolicy');
  await queryInterface.removeColumn('businesses', 'shippingPolicy');
  await queryInterface.removeColumn('businesses', 'themeConfig');
  await queryInterface.removeColumn('businesses', 'coverPublicId');
  await queryInterface.removeColumn('businesses', 'logoPublicId');
  await queryInterface.removeColumn('businesses', 'description');
  await queryInterface.removeColumn('businesses', 'displayName');

  // 5. Remove customer columns
  await queryInterface.removeColumn('customers', 'fitNotes');
  await queryInterface.removeColumn('customers', 'preferredCategories');
  await queryInterface.removeColumn('customers', 'preferredSizes');

  // 4. Remove supplier columns
  await queryInterface.removeColumn('suppliers', 'leadTimeDays');
  await queryInterface.removeColumn('suppliers', 'minOrderQuantity');
  await queryInterface.removeColumn('suppliers', 'garmentTypes');

  // 3. Remove item columns
  await queryInterface.removeColumn('items', 'description');
  await queryInterface.removeColumn('items', 'brand');
  await queryInterface.removeColumn('items', 'careInstructions');
  await queryInterface.removeColumn('items', 'material');
  await queryInterface.removeColumn('items', 'season');
  await queryInterface.removeColumn('items', 'gender');
  await queryInterface.removeColumn('items', 'category');

  // 2. Remove indexes from variants
  await queryInterface.removeIndex('variants', 'idx_variants_sku');
  await queryInterface.removeIndex('variants', 'idx_variants_business');
  await queryInterface.removeIndex('variants', 'idx_variants_item');

  // 1. Drop variants table
  await queryInterface.dropTable('variants');
};