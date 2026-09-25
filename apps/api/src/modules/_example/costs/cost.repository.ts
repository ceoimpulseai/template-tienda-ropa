import { TenantRepository } from '../../../lib/repository/base.js';
import { Cost } from './cost.model.js';

export const costRepository = new TenantRepository(Cost);