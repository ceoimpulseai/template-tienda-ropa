// Fetch wrapper para el catálogo público (/tienda/:slug): a diferencia de
// apiFetch.ts, deliberadamente NO manda cookies ni dispara ningún side effect
// de sesión/401 — esta página no está autenticada y no debería depender de
// (ni disparar) el manejo de sesión del resto de la app.
export async function publicApiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'omit',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
