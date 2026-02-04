'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import {
  DollarSign,
  Building2,
  Receipt,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface VendaB2B {
  _rowIndex: number;
  tipo_documento: string;
  documento: string;
  nome: string;
  cliente: string;
  celular: string;
  data_venda: Date;
  ultima_parcela: string;
  forma_pagamento: string;
  desconto: string;
  duracao_curso: string;
  valor_total: number;
  adquirente: string;
  cancelamento: boolean;
  marca: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: VendaB2B[];
  };
}

// Helper para verificar se é venda ativa
function isVendaAtiva(v: VendaB2B): boolean {
  const cancel = v.cancelamento;
  if (cancel === false || cancel === null || cancel === undefined) return true;
  if (typeof cancel === 'string') {
    const lowerCancel = (cancel as string).toLowerCase();
    if (lowerCancel === 'false' || lowerCancel === 'não' || lowerCancel === 'nao' || lowerCancel === '') return true;
  }
  return false;
}

export default function VendasB2BPage() {
  const [data, setData] = useState<VendaB2B[]>([]);
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
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/data/vendas-b2b?refresh=true&_t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result: ApiResponse = await response.json();

      if (result.success && result.data?.data) {
        // Debug: mostra primeiro registro para verificar campos
        if (result.data.data.length > 0) {
          console.log('[DEBUG B2B] Primeiro registro:', result.data.data[0]);
          console.log('[DEBUG B2B] tipo_documento:', result.data.data[0].tipo_documento);
        }

        const processedData = result.data.data.map((item, index) => {
          const cancelamentoValue = item.cancelamento as unknown;

          // Converte data DD/MM/YYYY para Date
          let dataVenda: Date = new Date(NaN);
          const rawDate = item.data_venda as unknown;

          if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            const [day, month, year] = rawDate.split('/').map(Number);
            dataVenda = new Date(year, month - 1, day);
          }

          // Converte valor
          let valorTotal = 0;
          const rawValor = item.valor_total as unknown;
          if (typeof rawValor === 'number') {
            valorTotal = rawValor;
          } else if (typeof rawValor === 'string') {
            valorTotal = parseFloat(rawValor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
          }

          return {
            ...item,
            _rowIndex: index + 2,
            data_venda: dataVenda,
            valor_total: valorTotal,
            cancelamento: cancelamentoValue === true || cancelamentoValue === 'TRUE' || cancelamentoValue === 'true',
          };
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

  // Filtra dados com data válida
  // Se tipo_documento existir, filtra apenas CNPJ, senão inclui todos
  const dadosValidos = useMemo(() => {
    return data.filter(item => {
      const hasValidDate = item.data_venda instanceof Date && !isNaN(item.data_venda.getTime());
      // Se o campo tipo_documento existir, filtra por CNPJ
      if (item.tipo_documento) {
        const isCNPJ = item.tipo_documento?.toUpperCase() === 'CNPJ';
        return hasValidDate && isCNPJ;
      }
      // Se não existir, aceita todos (planilha só de B2B)
      return hasValidDate;
    });
  }, [data]);

  // Filtra pelo período
  const filteredData = useMemo(() => {
    return dadosValidos.filter(item => {
      const itemYear = item.data_venda.getFullYear();
      const itemMonth = item.data_venda.getMonth();
      const itemDay = item.data_venda.getDate();

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();

      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();

      const itemNum = itemYear * 10000 + itemMonth * 100 + itemDay;
      const startNum = startYear * 10000 + startMonth * 100 + startDay;
      const endNum = endYear * 10000 + endMonth * 100 + endDay;

      return itemNum >= startNum && itemNum <= endNum;
    });
  }, [dadosValidos, startDate, endDate]);

  // Cancelamentos por tipo
  const cancelamentosPorTipo = useMemo(() => {
    const cancelados = filteredData.filter(item => item.cancelamento);
    const de7dias = cancelados.filter(item => {
      const tipo = (item as unknown as { tipo_cancelamento?: string }).tipo_cancelamento;
      return tipo === '7 dias';
    }).length;
    const foraDe7dias = cancelados.length - de7dias;

    return { de7dias, foraDe7dias, total: cancelados.length };
  }, [filteredData]);

  // KPIs
  const kpis = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const totalCancelamentos = filteredData.length - vendasAtivas.length;
    const receitaTotal = vendasAtivas.reduce((sum, v) => sum + v.valor_total, 0);
    const ticketMedio = vendasAtivas.length > 0 ? receitaTotal / vendasAtivas.length : 0;
    const taxaCancelamento = filteredData.length > 0 ? (totalCancelamentos / filteredData.length) * 100 : 0;

    return {
      receitaTotal,
      totalContratos: vendasAtivas.length,
      ticketMedio,
      taxaCancelamento,
      totalCancelamentos
    };
  }, [filteredData]);

  // Dados por adquirente
  const dadosPorAdquirente = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const porAdquirente: Record<string, { count: number; valor: number }> = {};

    vendasAtivas.forEach(v => {
      const adquirente = v.adquirente || 'Não informado';
      if (!porAdquirente[adquirente]) {
        porAdquirente[adquirente] = { count: 0, valor: 0 };
      }
      porAdquirente[adquirente].count += 1;
      porAdquirente[adquirente].valor += v.valor_total;
    });

    return Object.entries(porAdquirente)
      .map(([adquirente, dados]) => ({
        adquirente,
        contratos: dados.count,
        valor: dados.valor
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData]);

  // Dados temporais
  const dadosTemporais = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const porMes: Record<string, { mes: string; valor: number; contratos: number }> = {};

    vendasAtivas.forEach(v => {
      const date = new Date(v.data_venda);
      const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      if (!porMes[mesKey]) {
        porMes[mesKey] = { mes: mesLabel, valor: 0, contratos: 0 };
      }
      porMes[mesKey].valor += v.valor_total;
      porMes[mesKey].contratos += 1;
    });

    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, dados]) => dados);
  }, [filteredData]);

  // Dados por forma de pagamento
  const dadosFormaPagamento = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const porForma: Record<string, { count: number; valor: number }> = {};

    vendasAtivas.forEach(v => {
      const forma = v.forma_pagamento || 'Não informado';
      if (!porForma[forma]) {
        porForma[forma] = { count: 0, valor: 0 };
      }
      porForma[forma].count += 1;
      porForma[forma].valor += v.valor_total;
    });

    const total = vendasAtivas.length;
    return Object.entries(porForma)
      .map(([name, data]) => ({
        name,
        value: data.count,
        valor: data.valor,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Top clientes
  const topClientes = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    return vendasAtivas
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10);
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
            <h1 className="text-2xl font-bold text-gray-900">Vendas B2B</h1>
            <p className="text-gray-500 mt-1">Vendas corporativas</p>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
            <button
              onClick={() => fetchData()}
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

        {/* Indicador de Cancelamentos */}
        {cancelamentosPorTipo.total > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="flex items-center gap-4">
              {cancelamentosPorTipo.de7dias > 0 && (
                <div>
                  <span className="font-semibold text-red-900">{cancelamentosPorTipo.de7dias}</span>
                  <span className="text-red-700 ml-1">cancelamento{cancelamentosPorTipo.de7dias > 1 ? 's' : ''} de 7 dias</span>
                </div>
              )}
              {cancelamentosPorTipo.de7dias > 0 && cancelamentosPorTipo.foraDe7dias > 0 && (
                <span className="text-red-300">|</span>
              )}
              {cancelamentosPorTipo.foraDe7dias > 0 && (
                <div>
                  <span className="font-semibold text-red-900">{cancelamentosPorTipo.foraDe7dias}</span>
                  <span className="text-red-700 ml-1">cancelamento{cancelamentosPorTipo.foraDe7dias > 1 ? 's' : ''} fora dos 7 dias</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Receita Total"
            value={kpis.receitaTotal}
            format="currency"
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
            subtitle="Contratos ativos no período"
            loading={loading}
          />
          <KPICard
            title="Total de Contratos"
            value={kpis.totalContratos}
            format="number"
            icon={<Building2 className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="Apenas ativos (sem cancelamentos)"
            loading={loading}
          />
          <KPICard
            title="Ticket Médio"
            value={kpis.ticketMedio}
            format="currency"
            icon={<Receipt className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle="Por contrato ativo"
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
          subtitle="Faturamento de contratos ativos por período"
        >
          <BarChartComponent
            data={dadosTemporais}
            xKey="mes"
            yKey="valor"
            color="#3B82F6"
            formatY="currency"
            height={300}
            loading={loading}
          />
        </ChartCard>

        {/* Gráficos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Receita por Adquirente"
            subtitle="Faturamento por método de cobrança"
          >
            <BarChartComponent
              data={dadosPorAdquirente}
              xKey="adquirente"
              yKey="valor"
              color="#8B5CF6"
              horizontal
              formatY="currency"
              height={300}
              loading={loading}
            />
          </ChartCard>

          <ChartCard
            title="Forma de Pagamento"
            subtitle="Distribuição por método"
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {dadosFormaPagamento.map((item, index) => {
                  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
                  const color = colors[index % colors.length];

                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-600 text-right">
                          <span className="font-medium">{item.value}</span> ({item.percentage.toFixed(1)}%)
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Tabela de Top Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contratos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa/Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Contato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Data Venda</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Duração</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">Carregando...</td>
                  </tr>
                ) : topClientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">Nenhum dado encontrado</td>
                  </tr>
                ) : (
                  topClientes.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{item.nome}</div>
                        <div className="text-xs text-gray-500">{item.documento}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div>{item.cliente}</div>
                        <div className="text-xs text-gray-500">{item.celular}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {item.data_venda instanceof Date && !isNaN(item.data_venda.getTime())
                          ? item.data_venda.toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{item.duracao_curso || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
