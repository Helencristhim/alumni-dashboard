'use client';

import { ReactNode } from 'react';
import { DataSourceLink } from '@/components/ui/DataSourceLink';

interface ModuleContainerProps {
  title: string;
  description?: string;
  sourceUrl: string;
  lastUpdated?: Date;
  onRefresh?: () => void;
  loading?: boolean;
  color?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ModuleContainer({
  title,
  description,
  sourceUrl,
  lastUpdated,
  onRefresh,
  loading = false,
  color = '#10B981',
  actions,
  children
}: ModuleContainerProps) {
  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Link da fonte de dados */}
      <DataSourceLink
        url={sourceUrl}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        loading={loading}
      />

      {/* Conteúdo do módulo */}
      {children}
    </div>
  );
}

// Componente de seção dentro do módulo
interface ModuleSectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ModuleSection({ title, subtitle, action, children }: ModuleSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
