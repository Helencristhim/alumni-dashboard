'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent } from '@/components/ui/Charts';
import {
  Megaphone, DollarSign, Users, Target, TrendingUp,
  Mail, Globe, Handshake, RefreshCw, AlertCircle,
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

const MONTHS = ['Out', 'Nov', 'Dez', 'Jan', 'Fev'];
const MONTH_KEYS = ['outubro', 'novembro', 'dezembro', 'janeiro', 'fevereiro'] as const;

// Formata valor para exibição
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

// Formata valor completo (sem abreviação)
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

export default function MarketingPage() {
  const [data, setData] = useState<MarketingChannelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState(0);

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

  // KPIs resumo: soma de Meta Ads + Google Ads
  const summaryKPIs = useMemo(() => {
    const meta = channels.find(c => c.channel === 'Meta Ads');
    const google = channels.find(c => c.channel === 'Google Ads');

    const getTotal = (ch: ChannelData | undefined, metricName: string): number => {
      if (!ch) return 0;
      const m = ch.metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
      return m?.total ?? 0;
    };

    return {
      investimentoTotal: getTotal(meta, 'Investimento') + getTotal(google, 'Investimento'),
      receitaTotal: getTotal(meta, 'Receita') + getTotal(google, 'Receita'),
      leadsCRM: getTotal(meta, 'Leads CRM') + getTotal(google, 'Leads CRM'),
      vendasTotal: getTotal(meta, 'Vendas') + getTotal(google, 'Vendas'),
    };
  }, [channels]);

  // Dados para o gráfico de barras mensal
  const chartData = useMemo(() => {
    if (!currentChannel) return [];

    // Pegar as métricas numéricas/currency que têm dados mensais
    const chartMetrics = currentChannel.metrics.filter(
      m => m.format !== 'percent' && m.monthly && Object.values(m.monthly).some(v => v !== null)
    );

    // Se houver muitas métricas, pegar as 3 primeiras
    const metricsToChart = chartMetrics.slice(0, 3);

    return MONTH_KEYS.map((key, i) => {
      const point: Record<string, unknown> = { mes: MONTHS[i] };
      for (const metric of metricsToChart) {
        point[metric.name] = metric.monthly[key] ?? 0;
      }
      return point;
    });
  }, [currentChannel]);

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

        {/* KPIs Resumo - Mídia Paga (Meta + Google) */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Resumo Midia Paga (Meta + Google)
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
                const kpiFormat = metric.format === 'currency' ? 'currency' :
                                  metric.format === 'percent' ? 'text' : 'number';
                const displayValue = metric.format === 'percent'
                  ? formatMetricValue(metric.total, 'percent')
                  : metric.total ?? 0;

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

            {/* Tabela Completa */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  Métricas Detalhadas - {currentChannel.channel}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Métrica
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      {MONTHS.map(m => (
                        <th key={m} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentChannel.metrics.map((metric) => (
                      <tr key={metric.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {metric.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {formatFullValue(metric.total, metric.format)}
                        </td>
                        {MONTH_KEYS.map(key => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatFullValue(metric.monthly[key], metric.format)}
                          </td>
                        ))}
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
