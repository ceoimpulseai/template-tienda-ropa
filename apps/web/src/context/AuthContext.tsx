import { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from 'react';
import { authClient } from '../lib/auth-client';
import { apiFetch } from '../lib/apiFetch';
import type { Permission } from '@template/shared';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
}

export interface AppSession {
  user: AppUser;
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

interface AuthContextValue {
  data: AppSession | null;
  isPending: boolean;
  error: unknown;
  signOut: () => Promise<void>;
  signInDemo: (email?: string, name?: string) => void;
  permissions: Permission[] | null;
  setPermissions: (perms: Permission[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

const LOGGED_OUT_STORAGE_KEY = 'template_auth_logged_out';
const DEMO_EMAIL_STORAGE_KEY = 'template_demo_user_email';
const DEMO_ROLE_STORAGE_KEY = 'template_demo_user_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const betterAuthSession = authClient.useSession();
  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    return localStorage.getItem(LOGGED_OUT_STORAGE_KEY) === 'true';
  });
  const [customEmail, setCustomEmail] = useState(() => {
    return localStorage.getItem(DEMO_EMAIL_STORAGE_KEY) || 'ceo.impulseai@gmail.com';
  });
  const [customRole, setCustomRole] = useState(() => {
    return localStorage.getItem(DEMO_ROLE_STORAGE_KEY) || 'admin';
  });
  const [permissions, setPermissions] = useState<Permission[] | null>(null);

  const demoSession = useMemo<AppSession | null>(() => {
    if (isLoggedOut) return null;
    return {
      user: {
        id: 'usr_impulse',
        name: 'Impulse AI',
        email: customEmail,
        role: customRole,
      },
      session: {
        id: 'sess_default',
        userId: 'usr_impulse',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    };
  }, [isLoggedOut, customEmail, customRole]);

  const activeData: AppSession | null = useMemo(() => {
    if (isLoggedOut) return null;
    if (betterAuthSession.data?.user) {
      return {
        user: {
          id: betterAuthSession.data.user.id,
          name: betterAuthSession.data.user.name || 'Impulse AI',
          email: betterAuthSession.data.user.email || customEmail,
          image: betterAuthSession.data.user.image,
        },
        session: betterAuthSession.data.session,
      };
    }
    return demoSession;
  }, [betterAuthSession.data, demoSession, isLoggedOut, customEmail, customRole]);

  // Fetch permissions when business data is available
  useEffect(() => {
    if (!activeData?.user) {
      setPermissions(null);
      return;
    }

    let cancelled = false;

    async function fetchPermissions() {
      try {
        const response = await apiFetch('/business');
        if (cancelled) return;
        if (response?.permissions && Array.isArray(response.permissions)) {
          setPermissions(response.permissions);
        }
      } catch {
        // Ignore errors, permissions stay null
      }
    }

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, [activeData?.user?.id]);

  const signOut = async () => {
    setIsLoggedOut(true);
    setPermissions(null);
    localStorage.setItem(LOGGED_OUT_STORAGE_KEY, 'true');
    try {
      await authClient.signOut();
    } catch {
      // Backend offline
    }
  };

  const signInDemo = (email?: string, name?: string, role?: string) => {
    const nextEmail = email || 'ceo.impulseai@gmail.com';
    const nextRole = role || 'admin';
    setCustomEmail(nextEmail);
    setCustomRole(nextRole);
    localStorage.setItem(DEMO_EMAIL_STORAGE_KEY, nextEmail);
    localStorage.setItem(DEMO_ROLE_STORAGE_KEY, nextRole);
    if (name) {
      localStorage.setItem('template_demo_user_name', name);
    }
    setIsLoggedOut(false);
    localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        data: activeData,
        isPending: false,
        error: betterAuthSession.error,
        signOut,
        signInDemo,
        permissions,
        setPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

