import { BusinessMember } from '../modules/team/team.model.js';

const DEMO_MEMBER = {
  id: 'e5f6a7b8-c9d0-1234-ef01-234567890123',
  businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  role: 'admin' as const,
};

export async function seedMembers() {
  const existing = await BusinessMember.findOne({
    where: { businessId: DEMO_MEMBER.businessId, userId: DEMO_MEMBER.userId },
  });

  if (!existing) {
    await BusinessMember.create(DEMO_MEMBER);
    console.log(`BusinessMember created: ${DEMO_MEMBER.userId} -> ${DEMO_MEMBER.businessId} (${DEMO_MEMBER.role})`);
  } else {
    console.log(`BusinessMember already exists: ${existing.userId} -> ${existing.businessId}`);
  }

  return DEMO_MEMBER;
}