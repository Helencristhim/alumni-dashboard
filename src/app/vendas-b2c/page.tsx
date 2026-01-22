'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard, KPICardCompact } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { DollarSign, Users, ShoppingCart, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface VendaB2C {
  data_venda: Date | string;
  faturamento: number;
  produto: string;
  aluno_id?: string;
  aluno_nome?: string;
  forma_pagamento?: string;
  parcelas?: number;
  status?: string;
  vendedor?: string;
  origem_lead?: string;
  [key: string]: unknown;
}

export default function VendasB2CPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<VendaB2C>('vendas_b2c');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data_venda) return true; // Inclui se não tiver data

      let itemDate: Date;
      if (item.data_venda instanceof Date) {
        itemDate = item.data_venda;
      } else if (typeof item.data_venda === 'string') {
        // Tenta parse DD/MM/YYYY
        const parts = item.data_venda.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data_venda);
        }
      } else {
        return true;
      }

      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // Calcula KPIs
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        faturamentoTotal: 0,
        totalMatriculas: 0,
        ticketMedio: 0,
        taxaConversao: 0,
      };
    }

    const faturamentoTotal = filteredData.reduce((sum, item) => {
      const valor = typeof item.faturamento === 'number' ? item.faturamento : 0;
      return sum + valor;
    }, 0);

    const totalMatriculas = filteredData.length;
    const ticketMedio = totalMatriculas > 0 ? faturamentoTotal / totalMatriculas : 0;

    return {
      faturamentoTotal,
      totalMatriculas,
      ticketMedio,
      taxaConversao: 0, // Precisaria de dados de leads para calcular
    };
  }, [filteredData]);

  // Agrupa por produto
  const dadosPorProduto = useMemo(() => {
    const grupos: Record<string, { matriculas: number; faturamento: number }> = {};

    filteredData.forEach(item => {
      const produto = item.produto || 'Não informado';
      if (!grupos[produto]) {
        grupos[produto] = { matriculas: 0, faturamento: 0 };
      }
      grupos[produto].matriculas += 1;
      grupos[produto].faturamento += typeof item.faturamento === 'number' ? item.faturamento : 0;
    });

    return Object.entries(grupos).map(([produto, dados]) => ({
      produto,
      ...dados
    })).sort((a, b) => b.faturamento - a.faturamento);
  }, [filteredData]);

  // Agrupa por forma de pagamento
  const dadosPorPagamento = useMemo(() => {
    const grupos: Record<string, number> = {};

    filteredData.forEach(item => {
      const pagamento = item.forma_pagamento || 'Não informado';
      grupos[pagamento] = (grupos[pagamento] || 0) + 1;
    });

    const total = Object.values(grupos).reduce((sum, val) => sum + val, 0);

    return Object.entries(grupos).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [filteredData]);

  // Agrupa por vendedor
  const dadosPorVendedor = useMemo(() => {
    const grupos: Record<string, { vendas: number; valor: number }> = {};

    filteredData.forEach(item => {
      const vendedor = item.vendedor || 'Não informado';
      if (!grupos[vendedor]) {
        grupos[vendedor] = { vendas: 0, valor: 0 };
      }
      grupos[vendedor].vendas += 1;
      grupos[vendedor].valor += typeof item.faturamento === 'number' ? item.faturamento : 0;
    });

    return Object.entries(grupos).map(([vendedor, dados]) => ({
      vendedor,
      ...dados
    })).sort((a, b) => b.vendas - a.vendas).slice(0, 10);
  }, [filteredData]);

  // Dados para gráfico de evolução mensal
  const evolucaoMensal = useMemo(() => {
    const grupos: Record<string, { faturamento: number; matriculas: number }> = {};

    filteredData.forEach(item => {
      let mes: string;
      if (item.data_venda instanceof Date) {
        mes = item.data_venda.toLocaleDateString('pt-BR', { month: 'short' });
      } else if (typeof item.data_venda === 'string') {
        const parts = item.data_venda.split('/');
        if (parts.length >= 2) {
          const monthNum = parseInt(parts[1]) - 1;
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          mes = monthNames[monthNum] || 'N/A';
        } else {
          mes = 'N/A';
        }
      } else {
        mes = 'N/A';
      }

      if (!grupos[mes]) {
        grupos[mes] = { faturamento: 0, matriculas: 0 };
      }
      grupos[mes].faturamento += typeof item.faturamento === 'number' ? item.faturamento : 0;
      grupos[mes].matriculas += 1;
    });

    return Object.entries(grupos).map(([mes, dados]) => ({
      mes,
      ...dados
    }));
  }, [filteredData]);

  // Se houver erro de configuração, mostra mensagem amigável
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuração Necessária</h2>
          <p className="text-gray-500 mb-6 max-w-md">{error}</p>
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Ir para Configurações
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Vendas B2C"
        description="Faturamento e matrículas do canal direto ao consumidor"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#10B981"
        actions={
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        }
      >
        <div className="space-y-8">
          {/* Mensagem se não houver dados */}
          {!loading && filteredData.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum dado encontrado para o período selecionado.
                {data.length > 0 && ` (${data.length} registros totais na planilha)`}
              </p>
            </div>
          )}

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Faturamento Total"
              value={kpis.faturamentoTotal}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Novas Matrículas"
              value={kpis.totalMatriculas}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="Ticket Médio"
              value={kpis.ticketMedio}
              format="currency"
              icon={<ShoppingCart className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Total de Registros"
              value={data.length}
              format="number"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Matrículas por Produto */}
          {dadosPorProduto.length > 0 && (
            <ModuleSection
              title="Matrículas por Produto"
              subtitle="Distribuição de vendas por tipo de curso"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dadosPorProduto.slice(0, 8).map((produto) => (
                  <KPICardCompact
                    key={produto.produto}
                    title={produto.produto.substring(0, 25)}
                    value={produto.matriculas}
                    format="number"
                    loading={loading}
                  />
                ))}
              </div>
            </ModuleSection>
          )}

          {/* Gráficos de evolução */}
          {evolucaoMensal.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Faturamento por Período"
                subtitle="Distribuição no período selecionado"
              >
                <AreaChartComponent
                  data={evolucaoMensal}
                  xKey="mes"
                  yKey="faturamento"
                  color="#10B981"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>

              <ChartCard
                title="Matrículas por Período"
                subtitle="Quantidade de vendas"
              >
                <BarChartComponent
                  data={evolucaoMensal}
                  xKey="mes"
                  yKey="matriculas"
                  color="#3B82F6"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            </div>
          )}

          {/* Gráficos detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {dadosPorProduto.length > 0 && (
              <ChartCard
                title="Faturamento por Produto"
                subtitle="Distribuição de receita"
              >
                <BarChartComponent
                  data={dadosPorProduto.slice(0, 7)}
                  xKey="produto"
                  yKey="faturamento"
                  color="#10B981"
                  horizontal
                  formatY="currency"
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}

            {dadosPorPagamento.length > 0 && (
              <ChartCard
                title="Formas de Pagamento"
                subtitle="Distribuição percentual"
              >
                <PieChartComponent
                  data={dadosPorPagamento}
                  nameKey="name"
                  valueKey="value"
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}

            {dadosPorVendedor.length > 0 && (
              <ChartCard
                title="Top Vendedores"
                subtitle="Por número de vendas"
              >
                <BarChartComponent
                  data={dadosPorVendedor.slice(0, 6)}
                  xKey="vendedor"
                  yKey="vendas"
                  color="#8B5CF6"
                  horizontal
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Tabela de vendas recentes */}
          {filteredData.length > 0 && (
            <ModuleSection
              title="Vendas Recentes"
              subtitle={`Últimos ${Math.min(10, filteredData.length)} registros`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pagamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.slice(0, 10).map((venda, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venda.data_venda instanceof Date
                              ? venda.data_venda.toLocaleDateString('pt-BR')
                              : String(venda.data_venda || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {String(venda.aluno_nome || venda.aluno_id || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {String(venda.produto || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {typeof venda.faturamento === 'number'
                              ? `R$ ${venda.faturamento.toLocaleString('pt-BR')}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {String(venda.forma_pagamento || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              String(venda.status || '').toLowerCase().includes('confirm') ||
                              String(venda.status || '').toLowerCase().includes('pago')
                                ? 'bg-green-100 text-green-800'
                                : String(venda.status || '').toLowerCase().includes('pend')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {String(venda.status || 'N/A')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
