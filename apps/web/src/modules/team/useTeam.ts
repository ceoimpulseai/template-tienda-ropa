import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { BusinessMember, InviteMemberInput } from '@template/shared';

export function useTeam() {
  const { data, loading, error, refetch } = useApi<BusinessMember[]>('/team');

  async function invite(input: InviteMemberInput) {
    await apiFetch('/team', { method: 'POST', body: JSON.stringify(input) });
    refetch();
  }

  async function remove(memberId: string) {
    await apiFetch(`/team/${memberId}`, { method: 'DELETE' });
    refetch();
  }

  return { members: data ?? [], loading, error, invite, remove };
}
