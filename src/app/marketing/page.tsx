'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent } from '@/components/ui/Charts';
import {
  Megaphone, DollarSign, Users, Target, TrendingUp,
  Mail, Globe, Handshake, RefreshCw, AlertCircle, Calendar, X,
} from 'lucide-react';
import type { ChannelData, ChannelMetric, MarketingChannelsResponse } from '@/types';

// Cores por canal
const CHANNEL_COLORS: Record<string, string> = {
  'Meta Ads': '#1877F2',
  'Google Ads': '#4285F4',
  'Emails B2C': '#EA4335',
  'Instagram Orgânico': '#E4405F',
  'TikTok Orgânico': '#000000',
  'Site Orgânico': '#10B981',
  'Parcerias Corporativas (B2B2C)': '#8B5CF6',
};

// Ícones por canal
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  'Meta Ads': <Megaphone className="w-4 h-4" />,
  'Google Ads': <Target className="w-4 h-4" />,
  'Emails B2C': <Mail className="w-4 h-4" />,
  'Instagram Orgânico': <Users className="w-4 h-4" />,
  'TikTok Orgânico': <TrendingUp className="w-4 h-4" />,
  'Site Orgânico': <Globe className="w-4 h-4" />,
  'Parcerias Corporativas (B2B2C)': <Handshake className="w-4 h-4" />,
};

const ALL_MONTHS = [
  { key: 'setembro' as const, label: 'Set' },
  { key: 'outubro' as const, label: 'Out' },
  { key: 'novembro' as const, label: 'Nov' },
  { key: 'dezembro' as const, label: 'Dez' },
  { key: 'janeiro' as const, label: 'Jan' },
  { key: 'fevereiro' as const, label: 'Fev' },
];

type MonthKey = typeof ALL_MONTHS[number]['key'];

// Formata valor para exibição compacta (KPI cards)
function formatMetricValue(value: number | null, format: string): string {
  if (value === null || value === undefined) return '-';

  if (format === 'currency') {
    if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}K`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (format === 'percent') {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  return value.toLocaleString('pt-BR');
}

// Formata valor completo (tabela)
function formatFullValue(value: number | null, format: string): string {
  if (value === null || value === undefined) return '-';

  if (format === 'currency') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (format === 'percent') {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  return value.toLocaleString('pt-BR');
}

// Calcula variação percentual entre dois valores
function calcVariation(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Soma valores de meses selecionados
function sumMonths(metric: ChannelMetric, months: { key: MonthKey }[]): number {
  return months.reduce((sum, m) => sum + (metric.monthly[m.key] ?? 0), 0);
}

export default function MarketingPage() {
  const [data, setData] = useState<MarketingChannelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [monthFilter, setMonthFilter] = useState<Set<MonthKey>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/data/marketing-channels');
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const channels = data?.channels || [];
  const currentChannel = channels[selectedChannel] || null;
  const filterActive = monthFilter.size > 0;

  // Meses que têm dados no canal selecionado
  const activeMonths = useMemo(() => {
    if (!currentChannel) return ALL_MONTHS;
    return ALL_MONTHS.filter(m =>
      currentChannel.metrics.some(metric => metric.monthly[m.key] !== null)
    );
  }, [currentChannel]);

  // Meses a exibir (filtrados ou todos)
  const displayMonths = useMemo(() => {
    if (!filterActive) return activeMonths;
    return activeMonths.filter(m => monthFilter.has(m.key));
  }, [activeMonths, monthFilter, filterActive]);

  // Toggle de mês no filtro
  const toggleMonth = (key: MonthKey) => {
    setMonthFilter(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearFilter = () => setMonthFilter(new Set());

  // Calcula valor de uma métrica considerando o filtro
  const getFilteredValue = useCallback((metric: ChannelMetric): number | null => {
    if (!filterActive) return metric.total;
    if (metric.format === 'percent') {
      // Para percentuais, calcular média dos meses selecionados
      const values = displayMonths
        .map(m => metric.monthly[m.key])
        .filter((v): v is number => v !== null);
      if (values.length === 0) return null;
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    return sumMonths(metric, displayMonths);
  }, [filterActive, displayMonths]);

  // KPIs resumo com filtro aplicado
  const summaryKPIs = useMemo(() => {
    const meta = channels.find(c => c.channel === 'Meta Ads');
    const google = channels.find(c => c.channel === 'Google Ads');

    const getValue = (ch: ChannelData | undefined, metricName: string): number => {
      if (!ch) return 0;
      const m = ch.metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
      if (!m) return 0;
      if (!filterActive) return m.total ?? 0;
      return sumMonths(m, displayMonths);
    };

    return {
      investimentoTotal: getValue(meta, 'Investimento') + getValue(google, 'Investimento'),
      receitaTotal: getValue(meta, 'Receita') + getValue(google, 'Receita'),
      leadsCRM: getValue(meta, 'Leads CRM') + getValue(google, 'Leads CRM'),
      vendasTotal: getValue(meta, 'Vendas') + getValue(google, 'Vendas'),
    };
  }, [channels, filterActive, displayMonths]);

  // Dados para o gráfico de barras mensal
  const chartData = useMemo(() => {
    if (!currentChannel) return [];

    const chartMetrics = currentChannel.metrics.filter(
      m => m.format !== 'percent' && m.monthly && Object.values(m.monthly).some(v => v !== null)
    );
    const metricsToChart = chartMetrics.slice(0, 3);

    return displayMonths.map((m) => {
      const point: Record<string, unknown> = { mes: m.label };
      for (const metric of metricsToChart) {
        point[metric.name] = metric.monthly[m.key] ?? 0;
      }
      return point;
    });
  }, [currentChannel, displayMonths]);

  const chartMetricNames = useMemo(() => {
    if (!currentChannel) return [];
    return currentChannel.metrics
      .filter(m => m.format !== 'percent' && m.monthly && Object.values(m.monthly).some(v => v !== null))
      .slice(0, 3)
      .map(m => m.name);
  }, [currentChannel]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-pink-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
              <p className="text-gray-500 mt-1">Performance multi-canal</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filtro de Meses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Período:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ALL_MONTHS.map(m => {
                const isSelected = monthFilter.has(m.key);
                const isAvailable = activeMonths.some(am => am.key === m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleMonth(m.key)}
                    disabled={!isAvailable}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-pink-500 text-white'
                        : isAvailable
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            {filterActive && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
            {!filterActive && (
              <span className="text-xs text-gray-400">Todos os meses</span>
            )}
          </div>
        </div>

        {/* KPIs Resumo - Mídia Paga (Meta + Google) */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Resumo Mídia Paga (Meta + Google)
            {filterActive && <span className="ml-2 text-pink-500">- Período filtrado</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Investimento Total"
              value={summaryKPIs.investimentoTotal}
              format="currency"
              icon={<DollarSign className="w-5 h-5" />}
              color="#EC4899"
              loading={loading}
            />
            <KPICard
              title="Receita Total"
              value={summaryKPIs.receitaTotal}
              format="currency"
              icon={<TrendingUp className="w-5 h-5" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Leads CRM"
              value={summaryKPIs.leadsCRM}
              format="number"
              icon={<Users className="w-5 h-5" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="Vendas"
              value={summaryKPIs.vendasTotal}
              format="number"
              icon={<Target className="w-5 h-5" />}
              color="#F59E0B"
              loading={loading}
            />
          </div>
        </div>

        {/* Channel Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {channels.map((ch, idx) => {
              const isActive = idx === selectedChannel;
              const color = CHANNEL_COLORS[ch.channel] || '#6B7280';
              return (
                <button
                  key={ch.channel}
                  onClick={() => setSelectedChannel(idx)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={isActive ? { borderBottomColor: color, color } : undefined}
                >
                  {CHANNEL_ICONS[ch.channel]}
                  {ch.channel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do Canal Selecionado */}
        {currentChannel && (
          <div className="space-y-6">
            {/* KPI Cards do Canal */}
            <div className={`grid grid-cols-1 gap-4 ${
              currentChannel.metrics.length <= 3 ? 'md:grid-cols-3' :
              currentChannel.metrics.length <= 5 ? 'md:grid-cols-3 lg:grid-cols-5' :
              'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {currentChannel.metrics.map((metric) => {
                const color = CHANNEL_COLORS[currentChannel.channel] || '#6B7280';
                const filteredVal = getFilteredValue(metric);
                const kpiFormat = metric.format === 'currency' ? 'currency' :
                                  metric.format === 'percent' ? 'text' : 'number';
                const displayValue = metric.format === 'percent'
                  ? formatMetricValue(filteredVal, 'percent')
                  : filteredVal ?? 0;

                return (
                  <KPICard
                    key={metric.name}
                    title={metric.name}
                    value={displayValue}
                    format={kpiFormat}
                    color={color}
                    loading={loading}
                  />
                );
              })}
            </div>

            {/* Gráfico Mensal */}
            {chartData.length > 0 && chartMetricNames.length > 0 && (
              <ChartCard
                title={`Evolução Mensal - ${currentChannel.channel}`}
                subtitle="Métricas principais por mês"
              >
                <BarChartComponent
                  data={chartData}
                  xKey="mes"
                  yKey={chartMetricNames[0]}
                  color={CHANNEL_COLORS[currentChannel.channel] || '#6B7280'}
                  formatY={currentChannel.metrics[0]?.format === 'currency' ? 'currency' : 'number'}
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}

            {/* Tabela com Comparativo Mês a Mês */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  Métricas Detalhadas - {currentChannel.channel}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Colunas Δ mostram a variação em relação ao mês anterior</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Métrica
                      </th>
                      {!filterActive && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      )}
                      {displayMonths.map((m, idx) => (
                        <Fragment key={m.key}>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {m.label}
                          </th>
                          {idx > 0 && (
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                              Δ
                            </th>
                          )}
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentChannel.metrics.map((metric) => (
                      <tr key={metric.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                          {metric.name}
                        </td>
                        {!filterActive && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {formatFullValue(metric.total, metric.format)}
                          </td>
                        )}
                        {displayMonths.map((m, idx) => {
                          const currentVal = metric.monthly[m.key];
                          const prevMonth = idx > 0 ? displayMonths[idx - 1] : null;
                          const prevVal = prevMonth ? metric.monthly[prevMonth.key] : null;
                          const variation = idx > 0 ? calcVariation(currentVal, prevVal) : null;

                          return (
                            <Fragment key={m.key}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                {formatFullValue(currentVal, metric.format)}
                              </td>
                              {idx > 0 && (
                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                  {variation !== null ? (
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                      variation > 0
                                        ? 'text-emerald-700 bg-emerald-50'
                                        : variation < 0
                                        ? 'text-red-700 bg-red-50'
                                        : 'text-gray-500 bg-gray-50'
                                    }`}>
                                      {variation > 0 ? '+' : ''}{variation.toFixed(0)}%
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">-</span>
                                  )}
                                </td>
                              )}
                            </Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            {data?.lastUpdated && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">
                  Dados atualizados em {new Date(data.lastUpdated).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && !currentChannel && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Carregando dados de marketing...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
