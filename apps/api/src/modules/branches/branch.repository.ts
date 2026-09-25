import { TenantRepository } from '../../lib/repository/base.js';
import { Branch } from './branch.model.js';

export const branchRepository = new TenantRepository(Branch);