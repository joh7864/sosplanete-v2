'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'AS' | 'AM';
}

interface SessionState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  error: any;
}

/**
 * Hook centralisé pour la gestion de la session utilisateur.
 * 
 * Permet d'éviter les appels redondants à /users/me et centralise
 * la logique de déconnexion et de vérification d'authentification.
 */
export function useSession() {
  const [session, setSession] = useState<SessionState>({
    user: null,
    loading: true,
    authenticated: false,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    const token = getAuthData('access_token');
    
    if (!token) {
      setSession({
        user: null,
        loading: false,
        authenticated: false,
        error: null,
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setSession({
          user,
          loading: false,
          authenticated: true,
          error: null,
        });
      } else {
        // Token invalide ou expiré
        if (response.status === 401) {
          logout();
        } else {
          setSession(s => ({ ...s, loading: false, error: 'Failed to fetch user' }));
        }
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      setSession(s => ({ ...s, loading: false, error }));
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setSession({
      user: null,
      loading: false,
      authenticated: false,
      error: null,
    });
    // Forcer la redirection vers login si nécessaire (optionnel, selon l'implémentation du layout)
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...session,
    logout,
    refreshSession: fetchUser,
    isAdmin: session.user?.role === 'AS',
    isManager: session.user?.role === 'AM',
  };
}
