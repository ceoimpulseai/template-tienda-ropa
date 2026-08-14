import { useSyncExternalStore } from 'react';
import { activeBranchStore } from '../../lib/activeBranch';

export function useActiveBranch() {
  const branchId = useSyncExternalStore(activeBranchStore.subscribe, activeBranchStore.getSnapshot);
  return { branchId, setBranchId: activeBranchStore.set };
}
