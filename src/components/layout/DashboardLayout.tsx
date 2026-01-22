'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const handleLogout = () => {
    // Implementar lógica de logout
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header userName="Investidor" onLogout={handleLogout} />

      <main className="ml-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
