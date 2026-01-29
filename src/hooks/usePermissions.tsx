'use client';

import { useMemo } from 'react';
import { useAuth, AuthUser } from './useAuth';
import {
  hasPermission as checkPermission,
  canAccessModule as checkModule,
  canManageUsers as checkManageUsers,
  canViewConfig as checkViewConfig,
  canEditConfig as checkEditConfig,
  canViewAllActivities as checkViewAllActivities,
  getAccessibleModules as getModules,
} from '@/lib/rbac';

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        hasPermission: () => false,
        canAccessModule: () => false,
        canManageUsers: false,
        canViewConfig: false,
        canEditConfig: false,
        canViewAllActivities: false,
        accessibleModules: [] as string[],
      };
    }

    const userRole = user.role;
    const userPermissions = user.permissions || [];

    return {
      hasPermission: (permission: string) =>
        checkPermission(userRole, userPermissions, permission),

      canAccessModule: (moduleId: string) =>
        checkModule(userRole, userPermissions, moduleId),

      canManageUsers: checkManageUsers(userRole, userPermissions),
      canViewConfig: checkViewConfig(userRole, userPermissions),
      canEditConfig: checkEditConfig(userRole, userPermissions),
      canViewAllActivities: checkViewAllActivities(userRole, userPermissions),
      accessibleModules: getModules(userRole, userPermissions),
    };
  }, [user]);

  return permissions;
}

// Hook para verificar uma permissao especifica
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// Hook para verificar acesso a um modulo
export function useCanAccessModule(moduleId: string): boolean {
  const { canAccessModule } = usePermissions();
  return canAccessModule(moduleId);
}

// Componente wrapper para renderizacao condicional baseada em permissao
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  return function PermissionWrapper(props: P) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(requiredPermission)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Helper para verificar permissoes fora de componentes (server-side ou API)
export function checkUserPermission(
  user: AuthUser | null,
  permission: string
): boolean {
  if (!user) return false;
  return checkPermission(user.role, user.permissions || [], permission);
}
