'use client';

import * as React from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { email: string; id: string; role: string } | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * @deprecated This hook is a compatibility wrapper for Clerk.
 * The login method is no longer used - use Clerk's SignIn component instead.
 */
export function useAuth(): AuthContextType {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const router = useRouter();

  const user = React.useMemo(() => {
    if (!clerkUser || !userLoaded) return null;
    
    // Get role from public metadata or default to 'user'
    const role = (clerkUser.publicMetadata?.role as string) || 'user';
    
    return {
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      id: clerkUser.id,
      role,
    };
  }, [clerkUser, userLoaded]);

  const logout = React.useCallback(async () => {
    await signOut();
    router.push('/');
  }, [signOut, router]);

  // Deprecated - no longer used with Clerk
  const login = React.useCallback((_token: string) => {
    console.warn('login() is deprecated. Use Clerk SignIn component instead.');
  }, []);

  const isAuthenticated = !!user && userLoaded;

  return {
    user,
    login,
    logout,
    isAuthenticated,
  };
}
