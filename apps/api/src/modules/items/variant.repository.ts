import { TenantRepository } from '../../lib/repository/base.js';
import { Variant } from './variant.model.js';

export const variantRepository = new TenantRepository(Variant);