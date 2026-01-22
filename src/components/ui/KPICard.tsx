'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercentage } from '@/lib/utils/formatters';

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: 'currency' | 'currencyCompact' | 'percentage' | 'number' | 'text';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  trend,
  trendValue,
  icon,
  color = '#10B981',
  subtitle,
  loading = false
}: KPICardProps) {
  // Calcula trend automaticamente se não fornecido
  const calculatedTrend = trend || (
    previousValue !== undefined && typeof value === 'number'
      ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
      : undefined
  );

  const calculatedTrendValue = trendValue ?? (
    previousValue !== undefined && typeof value === 'number' && previousValue !== 0
      ? Math.abs(((value - previousValue) / previousValue) * 100)
      : undefined
  );

  // Formata o valor baseado no tipo
  const formattedValue = () => {
    if (loading) return '...';
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'currencyCompact':
        return formatCurrencyCompact(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      default:
        return String(value);
    }
  };

  const TrendIcon = calculatedTrend === 'up' ? TrendingUp : calculatedTrend === 'down' ? TrendingDown : Minus;

  const trendColor = calculatedTrend === 'up' ? 'text-green-500' : calculatedTrend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>

          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${loading ? 'text-gray-300 animate-pulse' : 'text-gray-900'}`}>
              {formattedValue()}
            </p>

            {calculatedTrend && calculatedTrendValue !== undefined && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {calculatedTrendValue.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <div style={{ color }}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Variante compacta para grids com muitos KPIs
export function KPICardCompact({
  title,
  value,
  format = 'number',
  trend,
  color = '#10B981',
  loading = false
}: Omit<KPICardProps, 'previousValue' | 'trendValue' | 'icon' | 'subtitle'>) {
  const formattedValue = () => {
    if (loading) return '...';
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'currencyCompact':
        return formatCurrencyCompact(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      default:
        return String(value);
    }
  };

  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
        {title}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className={`text-xl font-bold ${loading ? 'text-gray-300 animate-pulse' : 'text-gray-900'}`}>
          {formattedValue()}
        </p>
        {trend && (
          <span className={`text-xs ${trendColor}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
