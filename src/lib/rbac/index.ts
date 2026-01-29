// Exporta todas as funcoes e tipos do RBAC
export * from './permissions';
export * from './roles';

import { ROLE_PERMISSIONS } from './roles';

/**
 * Verifica se o usuario tem uma permissao especifica
 */
export function hasPermission(
  userRole: string,
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // ADM tem todas as permissoes
  if (userRole === 'ADM') return true;

  // Verifica permissao exata
  if (userPermissions.includes(requiredPermission)) return true;

  // Verifica wildcard (*)
  if (userPermissions.includes('*')) return true;

  // Verifica permissao com wildcard parcial (ex: module:*:view)
  const parts = requiredPermission.split(':');
  if (parts.length === 3) {
    const wildcardPerm = `${parts[0]}:*:${parts[2]}`;
    if (userPermissions.includes(wildcardPerm)) return true;
  }

  return false;
}

/**
 * Verifica se o usuario pode acessar um modulo especifico
 */
export function canAccessModule(
  userRole: string,
  userPermissions: string[],
  moduleId: string
): boolean {
  return hasPermission(userRole, userPermissions, `module:${moduleId}:view`);
}

/**
 * Verifica se o usuario pode gerenciar usuarios
 */
export function canManageUsers(userRole: string, userPermissions: string[]): boolean {
  return hasPermission(userRole, userPermissions, 'admin:users:manage');
}

/**
 * Verifica se o usuario pode ver configuracoes
 */
export function canViewConfig(userRole: string, userPermissions: string[]): boolean {
  return hasPermission(userRole, userPermissions, 'admin:config:view');
}

/**
 * Verifica se o usuario pode editar configuracoes
 */
export function canEditConfig(userRole: string, userPermissions: string[]): boolean {
  return hasPermission(userRole, userPermissions, 'admin:config:edit');
}

/**
 * Verifica se o usuario pode ver todas as atividades
 */
export function canViewAllActivities(userRole: string, userPermissions: string[]): boolean {
  return hasPermission(userRole, userPermissions, 'activity:view:all');
}

/**
 * Retorna os modulos que o usuario pode acessar
 */
export function getAccessibleModules(userRole: string, userPermissions: string[]): string[] {
  const modules = [
    'vendas-b2c',
    'vendas-b2b',
    'customer-care',
    'cancelamentos',
    'cobranca',
    'alunos-ativos',
    'marketing',
  ];

  return modules.filter(moduleId =>
    canAccessModule(userRole, userPermissions, moduleId)
  );
}

/**
 * Expande permissoes com wildcards para permissoes reais
 * Ex: 'module:*:view' -> ['module:vendas-b2c:view', 'module:vendas-b2b:view', ...]
 */
export function expandPermissions(permissions: string[]): string[] {
  const expanded = new Set<string>();

  permissions.forEach(perm => {
    if (perm === '*') {
      // Adiciona todas as permissoes
      Object.keys(ROLE_PERMISSIONS).forEach(role => {
        ROLE_PERMISSIONS[role].forEach(p => {
          if (p !== '*') expanded.add(p);
        });
      });
    } else if (perm.includes(':*:')) {
      // Expande wildcards parciais
      const [category, , action] = perm.split(':');

      const modules = [
        'vendas-b2c',
        'vendas-b2b',
        'customer-care',
        'cancelamentos',
        'cobranca',
        'alunos-ativos',
        'marketing',
      ];

      if (category === 'module') {
        modules.forEach(moduleId => {
          expanded.add(`module:${moduleId}:${action}`);
        });
      }
    } else {
      expanded.add(perm);
    }
  });

  return Array.from(expanded);
}
