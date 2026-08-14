import { createContext, useContext, type ReactNode } from 'react';
import { authClient } from '../lib/auth-client';

interface AuthContextValue {
  session: ReturnType<typeof authClient.useSession>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context.session;
}
