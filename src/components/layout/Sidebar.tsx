'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  HeadphonesIcon,
  UserX,
  Receipt,
  Users,
  Megaphone,
  Settings,
  HelpCircle,
  Activity,
  UserCog
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  moduleId?: string; // ID do modulo para verificar permissao
  permission?: string; // Permissao especifica necessaria
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Visao Geral',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/',
    color: '#6B7280'
    // Sem moduleId = sempre visivel para usuarios autenticados
  },
  {
    id: 'vendas-b2c',
    label: 'Vendas B2C',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/vendas-b2c',
    color: '#10B981',
    moduleId: 'vendas-b2c'
  },
  {
    id: 'vendas-b2b',
    label: 'Vendas B2B',
    icon: <Building2 className="w-5 h-5" />,
    href: '/vendas-b2b',
    color: '#3B82F6',
    moduleId: 'vendas-b2b'
  },
  {
    id: 'customer-care',
    label: 'Customer Care',
    icon: <HeadphonesIcon className="w-5 h-5" />,
    href: '/customer-care',
    color: '#8B5CF6',
    moduleId: 'customer-care'
  },
  {
    id: 'cancelamentos',
    label: 'Cancelamentos',
    icon: <UserX className="w-5 h-5" />,
    href: '/cancelamentos',
    color: '#EF4444',
    moduleId: 'cancelamentos'
  },
  {
    id: 'cobranca',
    label: 'Cobranca',
    icon: <Receipt className="w-5 h-5" />,
    href: '/cobranca',
    color: '#F59E0B',
    moduleId: 'cobranca'
  },
  {
    id: 'alunos-ativos',
    label: 'Alunos Ativos',
    icon: <Users className="w-5 h-5" />,
    href: '/alunos-ativos',
    color: '#06B6D4',
    moduleId: 'alunos-ativos'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Megaphone className="w-5 h-5" />,
    href: '/marketing',
    color: '#EC4899',
    moduleId: 'marketing'
  }
];

// Itens administrativos
const adminItems: NavItem[] = [
  {
    id: 'atividades',
    label: 'Atividades',
    icon: <Activity className="w-5 h-5" />,
    href: '/atividades',
    color: '#14B8A6',
    permission: 'activity:view:own' // Qualquer usuario com permissao de ver atividades
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: <UserCog className="w-5 h-5" />,
    href: '/admin/usuarios',
    color: '#F97316',
    permission: 'admin:users:manage'
  }
];

// Itens de footer
const footerItems: NavItem[] = [
  {
    id: 'configuracoes',
    label: 'Configuracoes',
    icon: <Settings className="w-5 h-5" />,
    href: '/configuracoes',
    color: '#6B7280',
    permission: 'admin:config:view'
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    icon: <HelpCircle className="w-5 h-5" />,
    href: '/ajuda',
    color: '#6B7280'
    // Sem permission = sempre visivel
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { canAccessModule, hasPermission } = usePermissions();

  // Filtra itens de navegacao por permissao
  const filteredNavItems = navItems.filter(item => {
    if (!item.moduleId) return true; // Itens sem moduleId sempre visiveis
    return canAccessModule(item.moduleId);
  });

  // Filtra itens administrativos por permissao
  const filteredAdminItems = adminItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // Filtra itens do footer por permissao
  const filteredFooterItems = footerItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span
            className="flex items-center justify-center"
            style={{ color: isActive ? item.color : undefined }}
          >
            {item.icon}
          </span>
          <span className="font-medium text-sm">{item.label}</span>
          {isActive && (
            <span
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 text-white fixed left-0 top-0 h-screen flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Alumni</h1>
            <p className="text-xs text-gray-400">Dashboard Executivo</p>
          </div>
        </div>
      </div>

      {/* Navegacao Principal */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map(renderNavItem)}
        </ul>

        {/* Separador e Itens Administrativos */}
        {filteredAdminItems.length > 0 && (
          <>
            <div className="my-4 border-t border-gray-800" />
            <p className="px-3 text-xs text-gray-500 uppercase tracking-wider mb-2">
              Administracao
            </p>
            <ul className="space-y-1">
              {filteredAdminItems.map(renderNavItem)}
            </ul>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <ul className="space-y-1">
          {filteredFooterItems.map(renderNavItem)}
        </ul>
      </div>
    </aside>
  );
}
