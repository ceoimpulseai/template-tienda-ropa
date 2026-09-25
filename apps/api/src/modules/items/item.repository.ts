import { TenantRepository } from '../../lib/repository/base.js';
import { Item } from './item.model.js';

export const itemRepository = new TenantRepository(Item);