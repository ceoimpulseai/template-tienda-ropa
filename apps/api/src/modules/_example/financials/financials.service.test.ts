// EJEMPLO: adaptar a la lógica del rubro concreto.
import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { Business } from '../../business/business.model.js';
import { Branch } from '../../branches/branch.model.js';
import { Item } from '../../items/item.model.js';
import { purchaseService } from '../purchases/purchase.service.js';
import { saleService } from '../sales/sale.service.js';
import { costService } from '../costs/cost.service.js';
import { financialsService } from './financials.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('financialsService.incomeStatement', () => {
  it('calculates revenue, cogs, and profit for a business', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item A',
      price: 10,
      stock: 0,
    });

    await purchaseService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 10,
      unitCost: 5,
    });
    await saleService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 4,
      unitPrice: 20,
    });
    await costService.create(business.id, { type: 'fixed', label: 'Alquiler', amount: 1000 });
    await costService.create(business.id, { type: 'variable', label: 'Flete', amount: 200 });
    await costService.create(business.id, {
      type: 'extraordinary',
      label: 'Incendio',
      amount: 500,
    });

    const result = await financialsService.incomeStatement(business.id);

    expect(result.revenue).toBe(80);
    expect(result.cogs).toBe(50);
    expect(result.grossProfit).toBe(30);
    expect(result.grossMarginPercent).toBe(37.5);
    expect(result.fixedCosts).toBe(1000);
    expect(result.variableCosts).toBe(200);
    expect(result.extraordinaryCosts).toBe(500);
    expect(result.netProfit).toBe(-1670);
    expect(result.netMarginPercent).toBe(-2087.5);
  });

  it('returns null percentages when revenue is zero', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Zero Revenue' });

    const result = await financialsService.incomeStatement(business.id);

    expect(result.revenue).toBe(0);
    expect(result.cogs).toBe(0);
    expect(result.grossProfit).toBe(0);
    expect(result.grossMarginPercent).toBeNull();
    expect(result.netMarginPercent).toBeNull();
  });
});

describe('financialsService.breakEven', () => {
  it('calculates break-even point', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test BE' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item A',
      price: 10,
      stock: 0,
    });

    await purchaseService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 10,
      unitCost: 5,
    });
    await saleService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 4,
      unitPrice: 20,
    });
    await costService.create(business.id, { type: 'fixed', label: 'Alquiler', amount: 1000 });
    await costService.create(business.id, { type: 'variable', label: 'Flete', amount: 200 });

    const result = await financialsService.breakEven(business.id);

    expect(result.totalRevenue).toBe(80);
    expect(result.totalFixedCosts).toBe(1000);
    expect(result.totalVariableCosts).toBe(200);
    expect(result.contributionMargin).toBe(-120);
    expect(result.contributionMarginRatio).toBe(-1.5);
    // contributionMarginRatio ≤ 0 → breakEvenRevenue is null
    expect(result.breakEvenRevenue).toBeNull();
    // avgUnitPrice=20, avgUnitCost=5 → 1000 / (20 - 5) = 66.67
    expect(result.breakEvenUnits).toBeCloseTo(66.67, 0);
  });

  it('returns null break-even when no sales', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'No Sales' });

    const result = await financialsService.breakEven(business.id);

    expect(result.totalRevenue).toBe(0);
    expect(result.contributionMarginRatio).toBeNull();
    expect(result.breakEvenRevenue).toBeNull();
    expect(result.breakEvenUnits).toBeNull();
  });
});

describe('financialsService.productMargins', () => {
  it('calculates margin per product', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test PM' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const itemA = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item A',
      price: 10,
      stock: 0,
    });
    const itemB = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item B',
      price: 20,
      stock: 0,
    });

    await purchaseService.create(business.id, branch.id, {
      itemId: itemA.id,
      quantity: 10,
      unitCost: 5,
    });
    await purchaseService.create(business.id, branch.id, {
      itemId: itemB.id,
      quantity: 5,
      unitCost: 15,
    });
    await saleService.create(business.id, branch.id, {
      itemId: itemA.id,
      quantity: 4,
      unitPrice: 10,
    });

    const result = await financialsService.productMargins(business.id);

    expect(result).toHaveLength(2);

    const itemAResult = result.find((r) => r.itemId === itemA.id)!;
    expect(itemAResult.itemName).toBe('Item A');
    expect(itemAResult.unitPrice).toBe(10);
    expect(itemAResult.avgUnitCost).toBe(5);
    expect(itemAResult.marginDollars).toBe(5);
    expect(itemAResult.marginPercent).toBe(50);

    const itemBResult = result.find((r) => r.itemId === itemB.id)!;
    expect(itemBResult.itemName).toBe('Item B');
    expect(itemBResult.unitPrice).toBe(20);
    expect(itemBResult.avgUnitCost).toBe(15);
    expect(itemBResult.marginDollars).toBe(5);
    expect(itemBResult.marginPercent).toBe(25);
  });

  it('handles products with no purchases', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'No Purchases' });
    const item = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item X',
      price: 10,
      stock: 0,
    });

    const result = await financialsService.productMargins(business.id);

    expect(result).toHaveLength(1);
    expect(result[0]!.avgUnitCost).toBeNull();
    expect(result[0]!.marginDollars).toBeNull();
    expect(result[0]!.marginPercent).toBeNull();
  });
});

describe('financialsService.ratios', () => {
  it('calculates all ratios', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test Ratios' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Item A',
      price: 10,
      stock: 0,
    });

    await purchaseService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 10,
      unitCost: 5,
    });
    await saleService.create(business.id, branch.id, {
      itemId: item.id,
      quantity: 4,
      unitPrice: 20,
    });
    await costService.create(business.id, { type: 'fixed', label: 'Alquiler', amount: 1000 });
    await costService.create(business.id, { type: 'variable', label: 'Flete', amount: 200 });
    await costService.create(business.id, {
      type: 'extraordinary',
      label: 'Incendio',
      amount: 500,
    });

    const result = await financialsService.ratios(business.id);

    // revenue=80, cogs=50, fixed=1000, variable=200, extraordinary=500, salesCount=1
    expect(result.grossMarginPercent).toBe(37.5);
    expect(result.netMarginPercent).toBe(-2087.5);
    expect(result.operatingExpenseRatio).toBe(1500);
    expect(result.profitPerSale).toBe(-1670);
    expect(result.costToRevenueRatio).toBe(2187.5);
  });

  it('returns null ratios when revenue is zero', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'No Data' });

    const result = await financialsService.ratios(business.id);

    expect(result.grossMarginPercent).toBeNull();
    expect(result.netMarginPercent).toBeNull();
    expect(result.operatingExpenseRatio).toBeNull();
    expect(result.profitPerSale).toBeNull();
    expect(result.costToRevenueRatio).toBeNull();
  });
});