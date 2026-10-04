import { DataTypes, type QueryInterface, QueryTypes } from 'sequelize';
import type { Migration } from '../migrate.js';

interface PurchaseRow {
  businessId: string;
  branchId: string;
  supplierId: string | null;
  quantity: number;
  unitCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // 1. Create purchase_orders table
  await queryInterface.createTable('purchase_orders', {
    id: { type: DataTypes.UUID, primaryKey: true },
    businessId: { type: DataTypes.UUID, allowNull: false },
    branchId: { type: DataTypes.UUID, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    totalCost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'completed', 'cancelled'), allowNull: false, defaultValue: 'completed' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // 2. Create purchase_line_items table
  await queryInterface.createTable('purchase_line_items', {
    id: { type: DataTypes.UUID, primaryKey: true },
    purchaseOrderId: { type: DataTypes.UUID, allowNull: false },
    businessId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // 3. Create purchase_item_variant_dists table
  await queryInterface.createTable('purchase_item_variant_dists', {
    id: { type: DataTypes.UUID, primaryKey: true },
    purchaseLineItemId: { type: DataTypes.UUID, allowNull: false },
    variantId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unitCost: { type: DataTypes.FLOAT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // 4. Add foreign key constraints
  await queryInterface.addConstraint('purchase_line_items', {
    fields: ['purchaseOrderId'],
    type: 'foreign key',
    name: 'fk_purchase_line_items_purchase_order_id',
    references: { table: 'purchase_orders', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  await queryInterface.addConstraint('purchase_item_variant_dists', {
    fields: ['purchaseLineItemId'],
    type: 'foreign key',
    name: 'fk_purchase_item_variant_dists_purchase_line_item_id',
    references: { table: 'purchase_line_items', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  await queryInterface.addConstraint('purchase_item_variant_dists', {
    fields: ['variantId'],
    type: 'foreign key',
    name: 'fk_purchase_item_variant_dists_variant_id',
    references: { table: 'variants', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // 5. Migrate existing purchases data
  // First, check if purchases table has data
  const existingPurchases = await queryInterface.sequelize.query<PurchaseRow>(
    'SELECT * FROM "purchases"',
    { type: QueryTypes.SELECT }
  );

  if (existingPurchases && existingPurchases.length > 0) {
    // Insert into purchase_orders (one per existing purchase, status=completed)
    for (const p of existingPurchases) {
      await queryInterface.sequelize.query(`
        INSERT INTO "purchase_orders" (id, "businessId", "branchId", "supplierId", "totalCost", status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), :businessId, :branchId, :supplierId, :totalCost, 'completed', :createdAt, :updatedAt)
        RETURNING id
      `, {
        replacements: {
          businessId: p.businessId,
          branchId: p.branchId,
          supplierId: p.supplierId,
          totalCost: p.quantity * p.unitCost,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
        type: QueryTypes.INSERT,
      });
    }
  }
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.dropTable('purchase_item_variant_dists');
  await queryInterface.dropTable('purchase_line_items');
  await queryInterface.dropTable('purchase_orders');
};