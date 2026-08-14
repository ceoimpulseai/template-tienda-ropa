const STORAGE_KEY = 'template_active_branch';

let activeBranchId: string | null = localStorage.getItem(STORAGE_KEY);
const listeners = new Set<() => void>();

export const activeBranchStore = {
  getSnapshot: () => activeBranchId,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set: (branchId: string) => {
    activeBranchId = branchId;
    localStorage.setItem(STORAGE_KEY, branchId);
    listeners.forEach((listener) => listener());
  },
};
