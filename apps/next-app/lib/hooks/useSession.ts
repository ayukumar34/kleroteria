"use client"

import { useState, useEffect } from 'react';

// Utilities
import { api } from '../api-handler';

// Drizzle ORM
import type { User } from "@repo/database"

interface Session {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Custom hook to manage user authentication state
export function useSession(): Session & {
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [session, setSession] = useState<Session>({
    user: null,
    loading: true,
    error: null
  });

  const fetchSession = async () => {
    try {
      setSession(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await api.get<User>('/api/users/me');

      if (error || !data) {
        setSession({
          user: null,
          loading: false,
          error: error?.message || 'An unexpected error occurred'
        });
      } else {
        setSession({
          user: data,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      setSession({
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      });
    }
  };

  // Function to sign out the user
  const signOut = async () => {
    try {
      await api.post('/api/users/sign-out');
      setSession({
        user: null,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Sign out error:', err);
      setSession({
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Sign out failed'
      });
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    ...session,
    refetch: fetchSession,
    signOut,
  };
}