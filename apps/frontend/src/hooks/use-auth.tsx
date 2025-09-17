'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { email: string; id: string; role: string } | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<{ email: string; id: string; role: string } | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    // Attempt to load user from stored token (e.g., localStorage for now)
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        // In a real app, you'd verify the token with the backend
        // For now, we'll just decode it (client-side, not secure for production)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.email, id: payload.sub, role: payload.role });
      } catch (e) {
        console.error('Failed to decode token', e);
        localStorage.removeItem('access_token');
      }
    }
  }, []);

  const login = React.useCallback((token: string) => {
    localStorage.setItem('access_token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ email: payload.email, id: payload.sub, role: payload.role });
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem('access_token');
    // Clear session presence cookie used by middleware auth guard
    document.cookie = 'session=; Path=/; Max-Age=0; SameSite=Lax';
    setUser(null);
    router.push('/login'); // Redirect to login page on logout
  }, [router]);

  const isAuthenticated = !!user;

  const value = React.useMemo(
    () => ({ user, login, logout, isAuthenticated }),
    [user, login, logout, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
