/**
 * Definicao dos roles (perfis de acesso) do sistema
 */

// Mapeamento de roles para permissoes padrao
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADM: ['*'], // Acesso total

  Investidor: [
    'module:*:view', // Todos os modulos
    'activity:view:all', // Todas atividades
    'admin:config:view', // Ver configuracoes
  ],

  'Customer Care': [
    'module:customer-care:view',
    'module:cancelamentos:view',
    'module:cobranca:view',
    'activity:view:own',
  ],

  Marketing: [
    'module:marketing:view',
    'activity:view:own',
  ],
};

// Informacoes dos roles
export const ROLES = [
  {
    name: 'ADM',
    displayName: 'Administrador',
    description: 'Acesso total ao sistema, incluindo gestao de usuarios',
    color: 'red',
  },
  {
    name: 'Investidor',
    displayName: 'Investidor',
    description: 'Visualizacao de todos os dashboards e atividades',
    color: 'purple',
  },
  {
    name: 'Customer Care',
    displayName: 'Customer Care',
    description: 'Acesso aos modulos de atendimento: CS, Cancelamentos, Cobranca',
    color: 'blue',
  },
  {
    name: 'Marketing',
    displayName: 'Marketing',
    description: 'Acesso ao modulo de Marketing',
    color: 'green',
  },
] as const;

export type RoleName = (typeof ROLES)[number]['name'];

// Obter cor do badge por role
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    ADM: 'bg-red-100 text-red-800',
    Investidor: 'bg-purple-100 text-purple-800',
    'Customer Care': 'bg-blue-100 text-blue-800',
    Marketing: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Verificar se um role existe
export function isValidRole(role: string): boolean {
  return ROLES.some(r => r.name === role);
}

// Obter informacoes do role
export function getRoleInfo(roleName: string) {
  return ROLES.find(r => r.name === roleName);
}
