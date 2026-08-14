import { randomUUID } from 'node:crypto';
import { Branch } from './branch.model.js';
import type { CreateBranchInput } from '@template/shared';

export const branchService = {
  async list(businessId: string) {
    return Branch.findAll({ where: { businessId } });
  },

  async create(businessId: string, input: CreateBranchInput) {
    return Branch.create({ id: randomUUID(), businessId, name: input.name, isDefault: false });
  },

  async remove(businessId: string, branchId: string) {
    const branch = await Branch.findOne({ where: { id: branchId, businessId } });
    if (!branch) throw new Error('BRANCH_NOT_FOUND');
    if (branch.isDefault) throw new Error('CANNOT_DELETE_DEFAULT_BRANCH');
    await branch.destroy();
  },
};
