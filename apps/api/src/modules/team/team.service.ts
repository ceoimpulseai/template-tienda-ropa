import { auth } from '../../config/auth.js';
import { teamRepository } from './team.repository.js';
import { tenantCache, makeMemberCacheKey } from '../../lib/tenantCache.js';
import type { InviteMemberInput } from '@template/shared';

export const teamService = {
  async list(businessId: string) {
    return teamRepository.findAll(businessId);
  },

  // Suma un usuario nuevo a un negocio EXISTENTE (a diferencia de auth.service.ts,
  // que crea negocio + admin en el registro self-service).
  async invite(businessId: string, input: InviteMemberInput) {
    const created = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });
    tenantCache.delete(makeMemberCacheKey(created.user.id));
    return teamRepository.create(businessId, {
      userId: created.user.id,
      role: input.role,
    });
  },

  async remove(businessId: string, memberId: string) {
    await teamRepository.remove(businessId, memberId);
  },
};
