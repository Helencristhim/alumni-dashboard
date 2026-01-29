'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  cargo?: string;
  role: string;
  roleDisplayName?: string;
  permissions: string[];
  isDemoUser?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Buscar sessao do servidor
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setState({
          user: data.user,
          loading: false,
          error: null,
        });
      } else {
        // Tentar fallback para localStorage (modo demo)
        const localToken = localStorage.getItem('auth_token');
        if (localToken) {
          try {
            const decoded = JSON.parse(atob(localToken));
            if (decoded.exp > Date.now()) {
              setState({
                user: {
                  id: `local-${decoded.email}`,
                  email: decoded.email,
                  name: decoded.name,
                  cargo: decoded.cargo,
                  role: decoded.role,
                  permissions: [],
                  isDemoUser: true,
                },
                loading: false,
                error: null,
              });
              return;
            }
          } catch {
            localStorage.removeItem('auth_token');
          }
        }

        setState({
          user: null,
          loading: false,
          error: data.error || null,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar sessao:', err);

      // Fallback para localStorage
      const localToken = localStorage.getItem('auth_token');
      if (localToken) {
        try {
          const decoded = JSON.parse(atob(localToken));
          if (decoded.exp > Date.now()) {
            setState({
              user: {
                id: `local-${decoded.email}`,
                email: decoded.email,
                name: decoded.name,
                cargo: decoded.cargo,
                role: decoded.role,
                permissions: [],
                isDemoUser: true,
              },
              loading: false,
              error: null,
            });
            return;
          }
        } catch {
          localStorage.removeItem('auth_token');
        }
      }

      setState({
        user: null,
        loading: false,
        error: 'Erro ao verificar autenticacao',
      });
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignora erro
    }

    // Limpa localStorage
    localStorage.removeItem('auth_token');

    setState({
      user: null,
      loading: false,
      error: null,
    });

    router.push('/login');
  }, [router]);

  // Recarregar sessao
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    fetchSession();
  }, [fetchSession]);

  // Verificar autenticacao no mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    logout,
    refresh,
  };
}
