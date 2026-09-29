import { describe, expect, it } from 'vitest';
import { up, down } from '../migrations/00007-arca-vouchers.js';

describe('00007-arca-vouchers migration', () => {
  it('exports up and down functions', () => {
    expect(typeof up).toBe('function');
    expect(typeof down).toBe('function');
  });

  it('up function has correct name property', () => {
    expect(up.name).toBe('up');
  });

  it('down function has correct name property', () => {
    expect(down.name).toBe('down');
  });
});