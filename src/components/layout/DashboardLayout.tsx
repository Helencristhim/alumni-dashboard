'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/auth/AuthProvider';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

function DashboardLayoutInner({ children, title, description }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Pega nome do usuario ou usa fallback
  const userName = user?.name || 'Usuario';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header userName={userName} onLogout={handleLogout} />

      <main className="ml-64 pt-16">
        <div className="p-6">
          {/* Page Header */}
          {(title || description) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <DashboardLayoutInner {...props} />
    </AuthProvider>
  );
}
