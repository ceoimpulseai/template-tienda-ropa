import { describe, expect, it } from 'vitest';
import { createItemSchema } from './items.js';

describe('createItemSchema', () => {
  it('accepts a valid item', () => {
    const result = createItemSchema.safeParse({ name: 'Producto A', price: 10, stock: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects a negative price', () => {
    const result = createItemSchema.safeParse({ name: 'Producto A', price: -1, stock: 5 });
    expect(result.success).toBe(false);
  });
});
