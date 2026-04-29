'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { auth, getTokenFromCookie, clearTokenCookie } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    plan: string;
    aiTokensUsed: number;
    aiTokenLimit: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getTokenFromCookie();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user: profile } = await auth.me();
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        tenantId: profile.tenantId,
        tenant: profile.tenant,
      });
    } catch {
      // Token is invalid or backend is down — clear it and require re-login
      clearTokenCookie();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
