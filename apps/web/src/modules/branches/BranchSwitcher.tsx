import { useApi } from '../../lib/useApi';
import { useActiveBranch } from './useActiveBranch';
import type { Branch } from '@template/shared';

export function BranchSwitcher() {
  const { data: branches } = useApi<Branch[]>('/branches');
  const { branchId, setBranchId } = useActiveBranch();

  if (!branches || branches.length <= 1) return null;

  return (
    <select
      value={branchId ?? branches.find((b) => b.isDefault)?.id ?? ''}
      onChange={(e) => setBranchId(e.target.value)}
      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text"
    >
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>
  );
}
