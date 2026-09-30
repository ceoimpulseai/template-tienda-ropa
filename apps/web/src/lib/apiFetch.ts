import { activeBranchStore } from './activeBranch';

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

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
    // New envelope: { success: false, error: { code, message, details? } }
    if (body?.success === false && body?.error) {
      throw new ApiError(body.error.code, body.error.message, body.error.details);
    }
    // Legacy fallback: { error: 'CODE' }
    if (body?.error && typeof body.error === 'string') {
      throw new ApiError(body.error, body.error);
    }
    throw new ApiError('UNKNOWN_ERROR', `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
