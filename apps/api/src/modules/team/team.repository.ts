import { TenantRepository } from '../../lib/repository/base.js';
import { BusinessMember } from './team.model.js';

export const teamRepository = new TenantRepository(BusinessMember);

// Cross-tenant query: find membership by userId without businessId scope.
// Used by requireBusiness middleware to resolve the tenant context.
export async function findMemberByUserId(userId: string) {
  return BusinessMember.findOne({ where: { userId } });
}