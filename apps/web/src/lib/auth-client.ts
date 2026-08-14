import { createAuthClient } from 'better-auth/react';

// better-auth exige una URL absoluta (no un path relativo): se arma en runtime
// contra el propio origin para que siga funcionando detrás del proxy de Vite en
// dev y sin importar el dominio en producción.
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
});
