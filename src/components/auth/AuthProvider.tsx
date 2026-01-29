'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser } from '@/hooks/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Componente para proteger rotas client-side
interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para proteger conteudo baseado em permissao
interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { user } = useAuthContext();

  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar permissao
  const hasPermission = checkUserPermission(user, permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Helper local para verificar permissao
function checkUserPermission(user: AuthUser, permission: string): boolean {
  // ADM tem todas as permissoes
  if (user.role === 'ADM') return true;

  const permissions = user.permissions || [];

  // Verifica permissao exata
  if (permissions.includes(permission)) return true;

  // Verifica wildcard
  if (permissions.includes('*')) return true;

  // Verifica wildcard parcial
  const parts = permission.split(':');
  if (parts.length === 3) {
    const wildcardPerm = `${parts[0]}:*:${parts[2]}`;
    if (permissions.includes(wildcardPerm)) return true;
  }

  return false;
}
