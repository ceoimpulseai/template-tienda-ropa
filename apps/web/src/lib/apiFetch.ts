import { activeBranchStore } from './activeBranch';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const branchId = activeBranchStore.getSnapshot();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (branchId) headers.set('X-Branch-Id', branchId);

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
