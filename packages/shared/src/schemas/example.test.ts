import { describe, expect, it } from 'vitest';
import { createCostSchema, createSaleSchema } from './example.js';

describe('createCostSchema', () => {
  it('accepts a fixed cost', () => {
    const result = createCostSchema.safeParse({ type: 'fixed', label: 'Alquiler', amount: 1000 });
    expect(result.success).toBe(true);
  });

  it('accepts an extraordinary cost', () => {
    const result = createCostSchema.safeParse({ type: 'extraordinary', label: 'Incendio', amount: 5000 });
    expect(result.success).toBe(true);
  });
});

describe('createSaleSchema', () => {
  it('defaults isInternal to false and amountReceived to undefined for normal sales', () => {
    const result = createSaleSchema.safeParse({ itemId: 'abc', quantity: 2, unitPrice: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isInternal).toBe(false);
      expect(result.data.amountReceived).toBeUndefined();
    }
  });

  it('accepts an internal sale without amountReceived', () => {
    const result = createSaleSchema.safeParse({ itemId: 'abc', quantity: 1, unitPrice: 10, isInternal: true });
    expect(result.success).toBe(true);
  });

  it('accepts an internal sale with explicit amountReceived', () => {
    const result = createSaleSchema.safeParse({
      itemId: 'abc',
      quantity: 1,
      unitPrice: 10,
      isInternal: true,
      amountReceived: 5,
    });
    expect(result.success).toBe(true);
  });
});
