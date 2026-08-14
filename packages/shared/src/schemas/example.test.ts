import { describe, expect, it } from 'vitest';
import { createCostSchema } from './example.js';

describe('createCostSchema', () => {
  it('accepts a fixed cost', () => {
    const result = createCostSchema.safeParse({ type: 'fixed', label: 'Alquiler', amount: 1000 });
    expect(result.success).toBe(true);
  });
});
