/**
 * Sistema de Permissoes do Alumni Dashboard
 *
 * Formato das permissoes: categoria:recurso:acao
 * Exemplos:
 * - module:vendas-b2c:view = Ver modulo Vendas B2C
 * - admin:users:manage = Gerenciar usuarios
 * - activity:view:all = Ver todas atividades
 */

// Todas as permissoes do sistema
export const PERMISSIONS = {
  // Modulos de dashboard
  'module:vendas-b2c:view': 'Ver Vendas B2C',
  'module:vendas-b2b:view': 'Ver Vendas B2B',
  'module:customer-care:view': 'Ver Customer Care',
  'module:cancelamentos:view': 'Ver Cancelamentos',
  'module:cobranca:view': 'Ver Cobranca',
  'module:alunos-ativos:view': 'Ver Alunos Ativos',
  'module:marketing:view': 'Ver Marketing',

  // Administracao
  'admin:users:manage': 'Gerenciar Usuarios',
  'admin:config:view': 'Ver Configuracoes',
  'admin:config:edit': 'Editar Configuracoes',

  // Atividades
  'activity:view:all': 'Ver Todas Atividades',
  'activity:view:own': 'Ver Atividades Proprias',
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

// Categorias de permissoes
export const PERMISSION_CATEGORIES = {
  module: 'Modulos',
  admin: 'Administracao',
  activity: 'Atividades',
} as const;

// Agrupa permissoes por categoria
export function getPermissionsByCategory(): Record<string, { code: string; label: string }[]> {
  const grouped: Record<string, { code: string; label: string }[]> = {};

  Object.entries(PERMISSIONS).forEach(([code, label]) => {
    const category = code.split(':')[0];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ code, label });
  });

  return grouped;
}

// Mapeamento de modulos para suas rotas
export const MODULE_ROUTES: Record<string, string> = {
  'vendas-b2c': '/vendas-b2c',
  'vendas-b2b': '/vendas-b2b',
  'customer-care': '/customer-care',
  cancelamentos: '/cancelamentos',
  cobranca: '/cobranca',
  'alunos-ativos': '/alunos-ativos',
  marketing: '/marketing',
};

// Lista de todos os modulos
export const MODULES = [
  { id: 'vendas-b2c', name: 'Vendas B2C', route: '/vendas-b2c' },
  { id: 'vendas-b2b', name: 'Vendas B2B', route: '/vendas-b2b' },
  { id: 'customer-care', name: 'Customer Care', route: '/customer-care' },
  { id: 'cancelamentos', name: 'Cancelamentos', route: '/cancelamentos' },
  { id: 'cobranca', name: 'Cobranca', route: '/cobranca' },
  { id: 'alunos-ativos', name: 'Alunos Ativos', route: '/alunos-ativos' },
  { id: 'marketing', name: 'Marketing', route: '/marketing' },
] as const;
