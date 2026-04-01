'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setAuthToken, auth } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Generate a dev JWT for local testing.
 * In production, replace with Supabase Auth session token.
 */
async function getDevToken(): Promise<string> {
  // Simple JWT encoder for dev (HS256 with the dev secret)
  // Header: { alg: "HS256", typ: "JWT" }
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const payload = btoa(
    JSON.stringify({
      sub: 'test-user-001',
      email: 'abdul@onyxlegal.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // For dev, we need a proper HMAC signature. Use the crypto API.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('super_secret_jwt_key_change_in_production'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${header}.${payload}.${sig}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // In dev mode, generate a JWT and authenticate
        const token = await getDevToken();
        setAuthToken(token);

        const { user: profile } = await auth.me();
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          tenant: profile.tenant,
        });
      } catch (err) {
        console.warn('Auth init failed (backend may not be running):', err);
        // Fallback to mock user for pure frontend dev
        setUser({
          id: 'dev-user',
          email: 'abdul@onyxlegal.com',
          name: 'Abdul Kadir',
          role: 'OWNER',
          tenant: {
            id: 'dev-tenant',
            name: 'OnyxLegal HQ',
            plan: 'FREE',
            aiTokensUsed: 0,
            aiTokenLimit: 5000,
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
