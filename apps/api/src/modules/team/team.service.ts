import { randomUUID } from 'node:crypto';
import { auth } from '../../config/auth.js';
import { NotFoundError } from '../../lib/errors.js';
import { BusinessMember } from './team.model.js';
import type { InviteMemberInput } from '@template/shared';

export const teamService = {
  async list(businessId: string) {
    return BusinessMember.findAll({ where: { businessId } });
  },

  // Suma un usuario nuevo a un negocio EXISTENTE (a diferencia de auth.service.ts,
  // que crea negocio + admin en el registro self-service).
  async invite(businessId: string, input: InviteMemberInput) {
    const created = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });
    return BusinessMember.create({
      id: randomUUID(),
      businessId,
      userId: created.user.id,
      role: input.role,
    });
  },

  async remove(businessId: string, memberId: string) {
    const member = await BusinessMember.findOne({ where: { id: memberId, businessId } });
    if (!member) throw new NotFoundError('MEMBER_NOT_FOUND');
    await member.destroy();
  },
};
