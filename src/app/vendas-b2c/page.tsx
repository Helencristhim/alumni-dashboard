'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import {
  DollarSign,
  Users,
  Receipt,
  XCircle,
  RefreshCw
} from 'lucide-react';
import type { VendaB2C } from '@/types';

interface ApiResponse {
  success: boolean;
  data: {
    data: VendaB2C[];
  };
}

export default function VendasB2CPage() {
  const [data, setData] = useState<VendaB2C[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de data - padrão: últimos 30 dias
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });

  // Carrega dados da API
  const fetchData = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/data/vendas-b2c${refresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      const result: ApiResponse = await response.json();

      if (result.success && result.data?.data) {
        // Converte e filtra dados válidos
        const processedData = result.data.data
          .map(item => {
            const cancelamentoValue = item.cancelamento as unknown;
            const dataVenda = new Date(item.data_venda);
            const valorTotal = Number(item.valor_total) || 0;

            return {
              ...item,
              data_venda: dataVenda,
              valor_total: valorTotal,
              parcelas: Number(item.parcelas) || 0,
              cancelamento: cancelamentoValue === true || cancelamentoValue === 'TRUE' || cancelamentoValue === 'true'
            };
          })
          // Filtra linhas inválidas (sem data ou sem valor)
          .filter(item => {
            const hasValidDate = item.data_venda instanceof Date && !isNaN(item.data_venda.getTime());
            const hasValidValue = item.valor_total > 0;
            const hasValidProduct = item.produto && item.produto.trim() !== '';
            return hasValidDate && hasValidValue && hasValidProduct;
          });
        setData(processedData);
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = new Date(item.data_venda);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const totalMatriculas = filteredData.length;
    const totalCancelamentos = filteredData.filter(v => v.cancelamento).length;
    const receitaTotal = vendasAtivas.reduce((sum, v) => sum + v.valor_total, 0);
    const ticketMedio = vendasAtivas.length > 0 ? receitaTotal / vendasAtivas.length : 0;
    const taxaCancelamento = totalMatriculas > 0 ? (totalCancelamentos / totalMatriculas) * 100 : 0;

    return {
      receitaTotal,
      totalMatriculas,
      ticketMedio,
      taxaCancelamento,
      totalCancelamentos,
      vendasAtivas: vendasAtivas.length
    };
  }, [filteredData]);

  // Dados por produto
  const dadosPorProduto = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const porProduto: Record<string, { matriculas: number; valor: number }> = {};

    vendasAtivas.forEach(v => {
      if (!porProduto[v.produto]) {
        porProduto[v.produto] = { matriculas: 0, valor: 0 };
      }
      porProduto[v.produto].matriculas += 1;
      porProduto[v.produto].valor += v.valor_total;
    });

    return Object.entries(porProduto)
      .map(([produto, dados]) => ({
        produto,
        matriculas: dados.matriculas,
        valor: dados.valor
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData]);

  // Dados temporais (por mês)
  const dadosTemporais = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const porMes: Record<string, { mes: string; valor: number; matriculas: number }> = {};

    vendasAtivas.forEach(v => {
      const date = new Date(v.data_venda);
      const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      if (!porMes[mesKey]) {
        porMes[mesKey] = { mes: mesLabel, valor: 0, matriculas: 0 };
      }
      porMes[mesKey].valor += v.valor_total;
      porMes[mesKey].matriculas += 1;
    });

    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, dados]) => dados);
  }, [filteredData]);

  // Dados por vendedor
  const dadosPorVendedor = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const porVendedor: Record<string, { vendedor: string; valor: number; matriculas: number }> = {};

    vendasAtivas.forEach(v => {
      const vendedor = v.vendedor || 'Não informado';
      if (!porVendedor[vendedor]) {
        porVendedor[vendedor] = { vendedor, valor: 0, matriculas: 0 };
      }
      porVendedor[vendedor].valor += v.valor_total;
      porVendedor[vendedor].matriculas += 1;
    });

    return Object.values(porVendedor).sort((a, b) => b.valor - a.valor);
  }, [filteredData]);

  // Dados Novos vs Renovação
  const dadosRenovacao = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const novos = vendasAtivas.filter(v => v.tipo_matricula === 'Novo Aluno');
    const renovacoes = vendasAtivas.filter(v => v.tipo_matricula === 'Renovação');

    return [
      { name: 'Novos Alunos', value: novos.length, valor: novos.reduce((s, v) => s + v.valor_total, 0) },
      { name: 'Renovações', value: renovacoes.length, valor: renovacoes.reduce((s, v) => s + v.valor_total, 0) }
    ];
  }, [filteredData]);

  // Dados por forma de pagamento
  const dadosFormaPagamento = useMemo(() => {
    const vendasAtivas = filteredData.filter(v => !v.cancelamento);
    const porForma: Record<string, number> = {};

    vendasAtivas.forEach(v => {
      const forma = v.forma_pagamento || 'Não informado';
      porForma[forma] = (porForma[forma] || 0) + 1;
    });

    return Object.entries(porForma).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendas B2C</h1>
            <p className="text-gray-500 mt-1">Performance comercial do canal direto</p>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Receita Total"
            value={kpis.receitaTotal}
            format="currency"
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
            subtitle={`${kpis.vendasAtivas} vendas ativas`}
            loading={loading}
          />
          <KPICard
            title="Total de Matrículas"
            value={kpis.totalMatriculas}
            format="number"
            icon={<Users className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="No período selecionado"
            loading={loading}
          />
          <KPICard
            title="Ticket Médio"
            value={kpis.ticketMedio}
            format="currency"
            icon={<Receipt className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle="Por venda ativa"
            loading={loading}
          />
          <KPICard
            title="Taxa de Cancelamento"
            value={kpis.taxaCancelamento}
            format="percentage"
            icon={<XCircle className="w-6 h-6" />}
            color="#EF4444"
            subtitle={`${kpis.totalCancelamentos} cancelamentos`}
            loading={loading}
          />
        </div>

        {/* Gráfico Temporal */}
        <ChartCard
          title="Evolução de Receita"
          subtitle="Faturamento por período"
        >
          <LineChart
            data={dadosTemporais}
            xKey="mes"
            yKey="valor"
            color="#10B981"
            formatY="currency"
            height={300}
            loading={loading}
          />
        </ChartCard>

        {/* Matrículas e Valor por Produto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Matrículas por Produto"
            subtitle="Quantidade de vendas por tipo de curso"
          >
            <BarChartComponent
              data={dadosPorProduto}
              xKey="produto"
              yKey="matriculas"
              color="#3B82F6"
              horizontal
              height={350}
              loading={loading}
            />
          </ChartCard>

          <ChartCard
            title="Receita por Produto"
            subtitle="Faturamento por tipo de curso"
          >
            <BarChartComponent
              data={dadosPorProduto}
              xKey="produto"
              yKey="valor"
              color="#10B981"
              horizontal
              formatY="currency"
              height={350}
              loading={loading}
            />
          </ChartCard>
        </div>

        {/* Performance por Vendedor e Novos vs Renovação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Performance por Vendedor"
            subtitle="Receita por fonte de venda"
          >
            <BarChartComponent
              data={dadosPorVendedor}
              xKey="vendedor"
              yKey="valor"
              color="#8B5CF6"
              horizontal
              formatY="currency"
              height={300}
              loading={loading}
            />
          </ChartCard>

          <ChartCard
            title="Novos Alunos vs Renovações"
            subtitle="Distribuição de matrículas"
          >
            <PieChartComponent
              data={dadosRenovacao}
              nameKey="name"
              valueKey="value"
              height={300}
              loading={loading}
            />
          </ChartCard>
        </div>

        {/* Forma de Pagamento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Forma de Pagamento"
            subtitle="Distribuição por método"
          >
            <PieChartComponent
              data={dadosFormaPagamento}
              nameKey="name"
              valueKey="value"
              height={250}
              loading={loading}
            />
          </ChartCard>

          {/* Tabela de Produtos */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento por Produto</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Produto</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Matrículas</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Receita</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">Carregando...</td>
                    </tr>
                  ) : dadosPorProduto.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">Nenhum dado encontrado</td>
                    </tr>
                  ) : (
                    dadosPorProduto.map((item, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.produto}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{item.matriculas}</td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.matriculas > 0 ? item.valor / item.matriculas : 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dadosPorProduto.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4 text-gray-900">Total</td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {dadosPorProduto.reduce((s, i) => s + i.matriculas, 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          dadosPorProduto.reduce((s, i) => s + i.valor, 0)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.ticketMedio)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
