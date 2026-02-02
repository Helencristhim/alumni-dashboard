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
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import type { VendaB2C } from '@/types';

interface VendaComIndice extends VendaB2C {
  _rowIndex: number;
}

interface Inconsistencia {
  linha: number;
  nome: string;
  tipo: 'sem_data' | 'sem_valor' | 'sem_produto' | 'valor_zero';
  descricao: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: VendaB2C[];
  };
}

// Helper function para verificar se uma venda é ativa (não cancelada)
function isVendaAtiva(v: VendaComIndice): boolean {
  const cancel = v.cancelamento;
  // É ativo se cancelamento é falsy (false, null, undefined, '', 0)
  // Mas também precisa verificar string "FALSE" caso não tenha sido convertido
  if (cancel === false || cancel === null || cancel === undefined) return true;
  if (typeof cancel === 'string') {
    const lowerCancel = (cancel as string).toLowerCase();
    if (lowerCancel === 'false' || lowerCancel === 'não' || lowerCancel === 'nao' || lowerCancel === '') return true;
  }
  return false;
}

export default function VendasB2CPage() {
  const [data, setData] = useState<VendaComIndice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInconsistencias, setShowInconsistencias] = useState(false);

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
      // Adiciona timestamp para evitar cache do navegador
      const url = `/api/data/vendas-b2c?refresh=true&_t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result: ApiResponse = await response.json();

      if (result.success && result.data?.data) {
        // Converte dados
        const processedData = result.data.data.map((item, index) => {
          const cancelamentoValue = item.cancelamento as unknown;

          // Converte string de data DD/MM/YYYY para objeto Date
          let dataVenda: Date = new Date(NaN); // Inválida por padrão
          const rawDate = item.data_venda as unknown;

          if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            // Formato brasileiro DD/MM/YYYY
            const [day, month, year] = rawDate.split('/').map(Number);
            dataVenda = new Date(year, month - 1, day);
          }

          const valorTotal = Number(item.valor_total) || 0;

          // Processa data de cancelamento
          const rawDataCancelamento = item.data_cancelamento as unknown;
          let dataCancelamento: string | null = null;
          if (typeof rawDataCancelamento === 'string' && rawDataCancelamento !== '-' && rawDataCancelamento.trim()) {
            dataCancelamento = rawDataCancelamento;
          }

          return {
            ...item,
            _rowIndex: index + 2, // +2 porque linha 1 é header
            data_venda: dataVenda,
            valor_total: valorTotal,
            parcelas: Number(item.parcelas) || 0,
            cancelamento: cancelamentoValue === true || cancelamentoValue === 'TRUE' || cancelamentoValue === 'true',
            data_cancelamento: dataCancelamento,
            tipo_cancelamento: item.tipo_cancelamento && item.tipo_cancelamento !== '-' ? item.tipo_cancelamento : null,
            razao_cancelamento: item.razao_cancelamento && item.razao_cancelamento !== '-' ? item.razao_cancelamento : null
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

  // Detecta inconsistências nos dados
  const inconsistencias = useMemo((): Inconsistencia[] => {
    const problemas: Inconsistencia[] = [];

    data.forEach(item => {
      const hasValidDate = item.data_venda instanceof Date && !isNaN(item.data_venda.getTime());
      const hasValidValue = item.valor_total > 0;
      const hasValidProduct = item.produto && item.produto.trim() !== '';

      if (!hasValidDate) {
        problemas.push({
          linha: item._rowIndex,
          nome: item.nome || 'Sem nome',
          tipo: 'sem_data',
          descricao: 'Data de venda não preenchida ou inválida'
        });
      }

      if (!hasValidValue && hasValidDate) {
        problemas.push({
          linha: item._rowIndex,
          nome: item.nome || 'Sem nome',
          tipo: item.valor_total === 0 ? 'valor_zero' : 'sem_valor',
          descricao: item.valor_total === 0 ? 'Valor total igual a zero' : 'Valor total não preenchido'
        });
      }

      if (!hasValidProduct && hasValidDate) {
        problemas.push({
          linha: item._rowIndex,
          nome: item.nome || 'Sem nome',
          tipo: 'sem_produto',
          descricao: 'Produto não preenchido'
        });
      }
    });

    return problemas;
  }, [data]);

  // Filtra dados com data válida para cálculos
  // Nota: Valor 0 e produto vazio são notificados como inconsistência,
  // mas são incluídos nos cálculos (apenas data inválida exclui do filtro temporal)
  const dadosValidos = useMemo(() => {
    return data.filter(item => {
      const hasValidDate = item.data_venda instanceof Date && !isNaN(item.data_venda.getTime());
      return hasValidDate;
    });
  }, [data]);

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    return dadosValidos.filter(item => {
      // Compara apenas ano, mês e dia (ignora horário)
      const itemYear = item.data_venda.getFullYear();
      const itemMonth = item.data_venda.getMonth();
      const itemDay = item.data_venda.getDate();

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();

      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();

      // Cria datas numéricas para comparação (YYYYMMDD)
      const itemNum = itemYear * 10000 + itemMonth * 100 + itemDay;
      const startNum = startYear * 10000 + startMonth * 100 + startDay;
      const endNum = endYear * 10000 + endMonth * 100 + endDay;

      return itemNum >= startNum && itemNum <= endNum;
    });
  }, [dadosValidos, startDate, endDate]);

  // Cancelamentos de 7 dias no período selecionado
  const cancelamentos7Dias = useMemo(() => {
    // Filtra apenas cancelamentos com tipo "7 dias" e data_cancelamento no período
    return dadosValidos.filter(item => {
      // Deve ser um cancelamento
      if (!item.cancelamento) return false;

      // Deve ser do tipo "7 dias"
      if (item.tipo_cancelamento !== '7 dias') return false;

      // Verifica se tem data de cancelamento válida
      const rawDataCancel = item.data_cancelamento;
      if (!rawDataCancel || typeof rawDataCancel !== 'string') return false;

      // Parse da data de cancelamento (DD/MM/YYYY)
      const match = rawDataCancel.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!match) return false;

      const [, day, month, year] = match.map(Number);

      // Compara com o período selecionado
      const cancelNum = year * 10000 + (month - 1) * 100 + day;
      const startNum = startDate.getFullYear() * 10000 + startDate.getMonth() * 100 + startDate.getDate();
      const endNum = endDate.getFullYear() * 10000 + endDate.getMonth() * 100 + endDate.getDate();

      return cancelNum >= startNum && cancelNum <= endNum;
    });
  }, [dadosValidos, startDate, endDate]);

  // KPIs calculados
  const kpis = useMemo(() => {
    // Filtra vendas ativas usando helper function
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const totalCancelamentos = filteredData.length - vendasAtivas.length;
    const totalRegistros = filteredData.length; // Total incluindo cancelamentos (para taxa)
    const totalMatriculas = vendasAtivas.length; // Apenas matrículas ativas (FALSE)
    const receitaTotal = vendasAtivas.reduce((sum, v) => sum + v.valor_total, 0);
    const ticketMedio = vendasAtivas.length > 0 ? receitaTotal / vendasAtivas.length : 0;
    const taxaCancelamento = totalRegistros > 0 ? (totalCancelamentos / totalRegistros) * 100 : 0;

    // Debug log
    console.log('[DEBUG KPI] Total filtrado:', totalRegistros);
    console.log('[DEBUG KPI] Ativos:', totalMatriculas);
    console.log('[DEBUG KPI] Cancelados:', totalCancelamentos);
    console.log('[DEBUG KPI] Receita:', receitaTotal);

    return {
      receitaTotal,
      totalMatriculas,
      ticketMedio,
      taxaCancelamento,
      totalCancelamentos
    };
  }, [filteredData]);

  // Dados por produto
  const dadosPorProduto = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
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
    const vendasAtivas = filteredData.filter(isVendaAtiva);
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
    const vendasAtivas = filteredData.filter(isVendaAtiva);
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
    const vendasAtivas = filteredData.filter(isVendaAtiva);
    const novos = vendasAtivas.filter(v => v.tipo_matricula === 'Novo Aluno');
    const renovacoes = vendasAtivas.filter(v => v.tipo_matricula === 'Renovação');

    return [
      { name: 'Novos Alunos', value: novos.length, valor: novos.reduce((s, v) => s + v.valor_total, 0) },
      { name: 'Renovações', value: renovacoes.length, valor: renovacoes.reduce((s, v) => s + v.valor_total, 0) }
    ];
  }, [filteredData]);

  // Dados por forma de pagamento
  const dadosFormaPagamento = useMemo(() => {
    const vendasAtivas = filteredData.filter(isVendaAtiva);
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

        {/* Alerta de Inconsistências */}
        {inconsistencias.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    {inconsistencias.length} inconsistência{inconsistencias.length > 1 ? 's' : ''} encontrada{inconsistencias.length > 1 ? 's' : ''} na planilha
                  </p>
                  <p className="text-sm text-amber-600">
                    Esses registros precisam ser corrigidos para aparecer nos cálculos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInconsistencias(!showInconsistencias)}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
              >
                {showInconsistencias ? 'Ocultar' : 'Ver detalhes'}
              </button>
            </div>

            {showInconsistencias && (
              <div className="mt-4 max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-2 px-3 font-medium text-amber-800">Linha</th>
                      <th className="text-left py-2 px-3 font-medium text-amber-800">Nome</th>
                      <th className="text-left py-2 px-3 font-medium text-amber-800">Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inconsistencias.slice(0, 50).map((item, index) => (
                      <tr key={index} className="border-b border-amber-100">
                        <td className="py-2 px-3 text-amber-700 font-mono">{item.linha}</td>
                        <td className="py-2 px-3 text-amber-700">{item.nome}</td>
                        <td className="py-2 px-3 text-amber-600">{item.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inconsistencias.length > 50 && (
                  <p className="text-center text-amber-600 text-sm mt-2">
                    ... e mais {inconsistencias.length - 50} registros
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cancelamentos de 7 dias */}
        {cancelamentos7Dias.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Cancelamentos de 7 dias</h3>
                  <p className="text-sm text-red-600">
                    {cancelamentos7Dias.length} cancelamento{cancelamentos7Dias.length > 1 ? 's' : ''} no período selecionado
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    cancelamentos7Dias.reduce((sum, v) => sum + v.valor_total, 0)
                  )}
                </p>
                <p className="text-sm text-red-500">valor perdido</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="text-left py-2 px-3 font-medium text-red-800">Nome</th>
                    <th className="text-left py-2 px-3 font-medium text-red-800">Produto</th>
                    <th className="text-left py-2 px-3 font-medium text-red-800">Data Cancelamento</th>
                    <th className="text-left py-2 px-3 font-medium text-red-800">Razão</th>
                    <th className="text-right py-2 px-3 font-medium text-red-800">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelamentos7Dias.map((item, index) => (
                    <tr key={index} className="border-b border-red-100 hover:bg-red-100/50">
                      <td className="py-2 px-3 text-red-900">{item.nome}</td>
                      <td className="py-2 px-3 text-red-700">{item.produto}</td>
                      <td className="py-2 px-3 text-red-700">{item.data_cancelamento}</td>
                      <td className="py-2 px-3 text-red-600">{item.razao_cancelamento || '-'}</td>
                      <td className="py-2 px-3 text-right text-red-700 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            subtitle="Vendas ativas no período"
            loading={loading}
          />
          <KPICard
            title="Total de Matrículas"
            value={kpis.totalMatriculas}
            format="number"
            icon={<Users className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="Apenas ativas (sem cancelamentos)"
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
