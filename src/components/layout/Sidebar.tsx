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
  HelpCircle
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/',
    color: '#6B7280'
  },
  {
    id: 'vendas-b2c',
    label: 'Vendas B2C',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/vendas-b2c',
    color: '#10B981'
  },
  {
    id: 'vendas-b2b',
    label: 'Vendas B2B',
    icon: <Building2 className="w-5 h-5" />,
    href: '/vendas-b2b',
    color: '#3B82F6'
  },
  {
    id: 'customer-care',
    label: 'Customer Care',
    icon: <HeadphonesIcon className="w-5 h-5" />,
    href: '/customer-care',
    color: '#8B5CF6'
  },
  {
    id: 'cancelamentos',
    label: 'Cancelamentos',
    icon: <UserX className="w-5 h-5" />,
    href: '/cancelamentos',
    color: '#EF4444'
  },
  {
    id: 'cobranca',
    label: 'Cobrança',
    icon: <Receipt className="w-5 h-5" />,
    href: '/cobranca',
    color: '#F59E0B'
  },
  {
    id: 'alunos-ativos',
    label: 'Alunos Ativos',
    icon: <Users className="w-5 h-5" />,
    href: '/alunos-ativos',
    color: '#06B6D4'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Megaphone className="w-5 h-5" />,
    href: '/marketing',
    color: '#EC4899'
  }
];

export function Sidebar() {
  const pathname = usePathname();

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

      {/* Navegação */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <ul className="space-y-1">
          <li>
            <Link
              href="/configuracoes"
              className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Configurações</span>
            </Link>
          </li>
          <li>
            <Link
              href="/ajuda"
              className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium text-sm">Ajuda</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
