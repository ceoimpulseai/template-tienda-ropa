import { ConflictError } from '../../lib/errors.js';
import { branchRepository } from './branch.repository.js';
import { branchCache, makeBranchCacheKey } from '../../lib/tenantCache.js';
import type { CreateBranchInput, UpdateBranchInput } from '@template/shared';

export const branchService = {
  async list(businessId: string) {
    return branchRepository.findAll(businessId);
  },

  async create(businessId: string, input: CreateBranchInput) {
    branchCache.delete(makeBranchCacheKey(businessId, 'default'));
    return branchRepository.create(businessId, { name: input.name, isDefault: false });
  },

  async update(businessId: string, branchId: string, input: UpdateBranchInput) {
    const branch = await branchRepository.findById(businessId, branchId);
    if (!branch) return null;
    branchCache.delete(makeBranchCacheKey(businessId, branchId));
    branchCache.delete(makeBranchCacheKey(businessId, 'default'));
    await branch.update(input);
    return branch;
  },

  async remove(businessId: string, branchId: string) {
    const branch = await branchRepository.findById(businessId, branchId);
    if (branch.isDefault) throw new ConflictError('CANNOT_DELETE_DEFAULT_BRANCH');
    branchCache.delete(makeBranchCacheKey(businessId, branchId));
    branchCache.delete(makeBranchCacheKey(businessId, 'default'));
    await branch.destroy();
  },
};
