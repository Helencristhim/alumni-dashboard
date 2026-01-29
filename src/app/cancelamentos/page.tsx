'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { UserX, TrendingDown, DollarSign, AlertTriangle, AlertCircle, Settings, Users, Percent, ShieldCheck, Undo2 } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

// Lista oficial de produtos/cursos (atualizada)
const PRODUTOS_LISTA = [
  'Espanhol 12 meses',
  'Espanhol 06 meses',
  'Inglês 12 meses - FLOW',
  'Inglês 06 meses - FLOW',
  'Inglês 12 meses',
  'Inglês 10 meses',
  'Inglês 09 meses',
  'Inglês 06 meses',
  'Inglês 03 meses',
  'Inglês 01 mês',
  'Aulas particulares',
  'Teste de Proficiência',
  'FAAP - Ribeirão',
  'HDI - COPARTICIPACAO 30%',
  'Imersão 01 mês',
  'Adesão FLOW',
];

// Campos da planilha de cancelamentos:
// Nome, Id do aluno, Data da matricula, Status, Data do cancelamento,
// Razao do cancelamento, Valor total do curso, Valor estornado, Valor retido
interface Cancelamento {
  nome?: string;
  id_aluno?: string;
  data_matricula?: Date | string;
  status?: string; // "cancelado", "retido", etc.
  data_cancelamento?: Date | string;
  razao_cancelamento?: string;
  valor_total_curso?: number | string;
  valor_estornado?: number | string;
  valor_retido?: number | string;
  produto?: string;
  curso?: string;
  [key: string]: unknown;
}

// Função para parsear valor (formatos: R$ 5.160,00 ou R$830.01)
const parseValor = (valor: unknown): number => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    let limpo = valor.replace(/R\$\s*/gi, '').trim();
    if (limpo.includes(',') && limpo.includes('.')) {
      const lastComma = limpo.lastIndexOf(',');
      const lastDot = limpo.lastIndexOf('.');
      if (lastComma > lastDot) {
        limpo = limpo.replace(/\./g, '').replace(',', '.');
      } else {
        limpo = limpo.replace(/,/g, '');
      }
    } else if (limpo.includes(',') && !limpo.includes('.')) {
      limpo = limpo.replace(',', '.');
    }
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Função para parsear data (formato DD/MM/AA ou DD/MM/AAAA)
const parseDate = (dateValue: Date | string | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Verifica se o status é "cancelado"
const isCancelado = (status: string | undefined): boolean => {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'cancelado' || s === 'cancelada' || s === 'cancel';
};

// Verifica se o status é "retido"
const isRetido = (status: string | undefined): boolean => {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'retido' || s === 'retida' || s === 'retencao' || s === 'retenção';
};

// Helper para obter o produto/curso do item
const getProduto = (item: Cancelamento): string => {
  return String(item.produto || item.curso || '').trim();
};

export default function CancelamentosPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<Cancelamento>('cancelamentos');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // ==========================================
  // TAXA DE CANCELAMENTO GERAL (não responde ao filtro de período)
  // ==========================================
  const taxaCancelamentoGeral = useMemo(() => {
    if (!data || data.length === 0) return { taxa: 0, cancelados: 0, retidos: 0, total: 0 };

    const cancelados = data.filter(item => isCancelado(item.status)).length;
    const retidos = data.filter(item => isRetido(item.status)).length;
    const total = data.length;

    const taxa = total > 0 ? (cancelados / total) * 100 : 0;

    return { taxa, cancelados, retidos, total };
  }, [data]);

  // ==========================================
  // DADOS FILTRADOS POR PERÍODO (usa data_cancelamento)
  // ==========================================
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const itemDate = parseDate(item.data_cancelamento);
      if (!itemDate) return false;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // ==========================================
  // KPIs DO PERÍODO FILTRADO
  // ==========================================

  // Número de cancelamentos por mês (filtrado)
  const cancelamentosNoPeríodo = useMemo(() => {
    return filteredData.filter(item => isCancelado(item.status)).length;
  }, [filteredData]);

  // Número de retenções por mês (status = "retido") (filtrado)
  const retencoesNoPeríodo = useMemo(() => {
    return filteredData.filter(item => isRetido(item.status)).length;
  }, [filteredData]);

  // Valor estornado por mês (filtrado)
  const valorEstornadoNoPeríodo = useMemo(() => {
    return filteredData
      .filter(item => isCancelado(item.status))
      .reduce((sum, item) => sum + parseValor(item.valor_estornado), 0);
  }, [filteredData]);

  // Valor retido por mês (filtrado)
  const valorRetidoNoPeríodo = useMemo(() => {
    return filteredData
      .filter(item => isRetido(item.status))
      .reduce((sum, item) => sum + parseValor(item.valor_retido), 0);
  }, [filteredData]);

  // ==========================================
  // 3 PRINCIPAIS MOTIVOS DE CANCELAMENTO (filtrado)
  // ==========================================
  const top3Motivos = useMemo(() => {
    const motivos: Record<string, number> = {};

    filteredData
      .filter(item => isCancelado(item.status))
      .forEach(item => {
        const motivo = String(item.razao_cancelamento || 'Não informado').trim();
        motivos[motivo] = (motivos[motivo] || 0) + 1;
      });

    return Object.entries(motivos)
      .map(([motivo, count]) => ({ motivo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredData]);

  // Motivos para gráfico de pizza
  const motivosParaGrafico = useMemo(() => {
    const motivos: Record<string, number> = {};

    filteredData
      .filter(item => isCancelado(item.status))
      .forEach(item => {
        const motivo = String(item.razao_cancelamento || 'Não informado').trim();
        motivos[motivo] = (motivos[motivo] || 0) + 1;
      });

    const total = Object.values(motivos).reduce((sum, val) => sum + val, 0);

    return Object.entries(motivos)
      .map(([name, count]) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredData]);

  // ==========================================
  // CANCELAMENTOS POR PRODUTO
  // ==========================================
  const cancelamentosPorProduto = useMemo(() => {
    const grupos: Record<string, { cancelamentos: number; retencoes: number; valorEstornado: number; valorRetido: number }> = {};

    // Inicializa com produtos da lista
    PRODUTOS_LISTA.forEach(produto => {
      grupos[produto] = { cancelamentos: 0, retencoes: 0, valorEstornado: 0, valorRetido: 0 };
    });

    filteredData.forEach(item => {
      const produto = getProduto(item);

      // Só conta se o produto está na lista oficial
      if (PRODUTOS_LISTA.includes(produto)) {
        if (isCancelado(item.status)) {
          grupos[produto].cancelamentos += 1;
          grupos[produto].valorEstornado += parseValor(item.valor_estornado);
        } else if (isRetido(item.status)) {
          grupos[produto].retencoes += 1;
          grupos[produto].valorRetido += parseValor(item.valor_retido);
        }
      }
    });

    return Object.entries(grupos)
      .filter(([, dados]) => dados.cancelamentos > 0 || dados.retencoes > 0)
      .map(([produto, dados]) => ({
        produto,
        ...dados
      }))
      .sort((a, b) => b.cancelamentos - a.cancelamentos);
  }, [filteredData]);

  // ==========================================
  // CANCELAMENTOS POR MÊS (gráfico de barras)
  // ==========================================
  const cancelamentosPorMes = useMemo(() => {
    const grupos: Record<string, { cancelamentos: number; retencoes: number }> = {};

    filteredData.forEach(item => {
      const itemDate = parseDate(item.data_cancelamento);
      if (!itemDate) return;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mes = monthNames[itemDate.getMonth()];

      if (!grupos[mes]) {
        grupos[mes] = { cancelamentos: 0, retencoes: 0 };
      }

      if (isCancelado(item.status)) {
        grupos[mes].cancelamentos += 1;
      } else if (isRetido(item.status)) {
        grupos[mes].retencoes += 1;
      }
    });

    return Object.entries(grupos).map(([mes, dados]) => ({
      mes,
      ...dados
    }));
  }, [filteredData]);

  // ==========================================
  // VALORES POR MÊS (gráfico de barras)
  // ==========================================
  const valoresPorMes = useMemo(() => {
    const grupos: Record<string, { estornado: number; retido: number }> = {};

    filteredData.forEach(item => {
      const itemDate = parseDate(item.data_cancelamento);
      if (!itemDate) return;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mes = monthNames[itemDate.getMonth()];

      if (!grupos[mes]) {
        grupos[mes] = { estornado: 0, retido: 0 };
      }

      if (isCancelado(item.status)) {
        grupos[mes].estornado += parseValor(item.valor_estornado);
      } else if (isRetido(item.status)) {
        grupos[mes].retido += parseValor(item.valor_retido);
      }
    });

    return Object.entries(grupos).map(([mes, dados]) => ({
      mes,
      ...dados
    }));
  }, [filteredData]);

  // Totais gerais para tabela
  const totais = useMemo(() => {
    return {
      cancelamentos: cancelamentosPorProduto.reduce((sum, item) => sum + item.cancelamentos, 0),
      retencoes: cancelamentosPorProduto.reduce((sum, item) => sum + item.retencoes, 0),
      valorEstornado: cancelamentosPorProduto.reduce((sum, item) => sum + item.valorEstornado, 0),
      valorRetido: cancelamentosPorProduto.reduce((sum, item) => sum + item.valorRetido, 0),
    };
  }, [cancelamentosPorProduto]);

  // Se houver erro de configuração
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
        title="Cancelamentos"
        description="Taxa de churn, retenções e motivos de cancelamento"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#EF4444"
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

          {/* KPIs - Linha 1: Taxa Geral (não responde ao filtro) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Taxa de Cancelamento Geral"
              value={`${taxaCancelamentoGeral.taxa.toFixed(1)}%`}
              icon={<Percent className="w-6 h-6" />}
              color={taxaCancelamentoGeral.taxa > 10 ? '#EF4444' : '#10B981'}
              subtitle="Base total (todos os meses)"
              loading={loading}
            />
            <KPICard
              title="Total Cancelados"
              value={taxaCancelamentoGeral.cancelados}
              format="number"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
              subtitle="Base total"
              loading={loading}
            />
            <KPICard
              title="Total Retenções"
              value={taxaCancelamentoGeral.retidos}
              format="number"
              icon={<ShieldCheck className="w-6 h-6" />}
              color="#10B981"
              subtitle="Base total"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={taxaCancelamentoGeral.total}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#6B7280"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* KPIs - Linha 2: Dados do período filtrado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Cancelamentos no Período"
              value={cancelamentosNoPeríodo}
              format="number"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
              subtitle="No período selecionado"
              loading={loading}
            />
            <KPICard
              title="Retenções no Período"
              value={retencoesNoPeríodo}
              format="number"
              icon={<ShieldCheck className="w-6 h-6" />}
              color="#10B981"
              subtitle="No período selecionado"
              loading={loading}
            />
            <KPICard
              title="Valor Estornado"
              value={valorEstornadoNoPeríodo}
              format="currency"
              icon={<Undo2 className="w-6 h-6" />}
              color="#EF4444"
              subtitle="No período"
              loading={loading}
            />
            <KPICard
              title="Valor Retido"
              value={valorRetidoNoPeríodo}
              format="currency"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              subtitle="No período"
              loading={loading}
            />
          </div>

          {/* Top 3 Motivos de Cancelamento */}
          {top3Motivos.length > 0 && (
            <ModuleSection
              title="3 Principais Motivos de Cancelamento"
              subtitle="No período selecionado"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3Motivos.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{item.count} cancelamentos</p>
                        <p className="text-xs text-gray-500">
                          {cancelamentosNoPeríodo > 0 ? ((item.count / cancelamentosNoPeríodo) * 100).toFixed(1) : 0}% do total
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{item.motivo}</p>
                  </div>
                ))}
              </div>
            </ModuleSection>
          )}

          {/* Cancelamentos e Retenções por Produto */}
          {cancelamentosPorProduto.length > 0 && (
            <ModuleSection
              title="Cancelamentos e Retenções por Produto"
              subtitle={`${totais.cancelamentos} cancelamentos | ${totais.retencoes} retenções no período`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Cancelamentos
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider">
                          Retenções
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Valor Estornado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-green-800 uppercase tracking-wider">
                          Valor Retido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cancelamentosPorProduto.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.produto}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                              {item.cancelamentos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                              {item.retencoes}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-red-600 text-right">
                            R$ {item.valorEstornado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                            R$ {item.valorRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                          TOTAL GERAL
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-red-900">
                          {totais.cancelamentos}
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-green-900">
                          {totais.retencoes}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-red-900 text-right">
                          R$ {totais.valorEstornado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-green-900 text-right">
                          R$ {totais.valorRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cancelamentosPorMes.length > 0 && (
              <ChartCard
                title="Cancelamentos vs Retenções por Mês"
                subtitle="No período selecionado"
              >
                <BarChartComponent
                  data={cancelamentosPorMes}
                  xKey="mes"
                  yKey="cancelamentos"
                  color="#EF4444"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}

            {motivosParaGrafico.length > 0 && (
              <ChartCard
                title="Motivos de Cancelamento"
                subtitle="Distribuição no período"
              >
                <PieChartComponent
                  data={motivosParaGrafico}
                  nameKey="name"
                  valueKey="value"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Gráfico de Valores por Mês */}
          {valoresPorMes.length > 0 && (
            <ChartCard
              title="Valores por Mês"
              subtitle="Estornado vs Retido no período"
            >
              <BarChartComponent
                data={valoresPorMes}
                xKey="mes"
                yKey="estornado"
                color="#EF4444"
                height={250}
                loading={loading}
              />
            </ChartCard>
          )}

          {/* Lista de registros recentes */}
          {filteredData.length > 0 && (
            <ModuleSection
              title="Registros Recentes"
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
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Razão
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.slice(0, 10).map((item, i) => {
                        const dataFormatada = parseDate(item.data_cancelamento);
                        const cancelado = isCancelado(item.status);
                        const retido = isRetido(item.status);
                        const valor = cancelado ? parseValor(item.valor_estornado) : parseValor(item.valor_retido);

                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dataFormatada ? dataFormatada.toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(item.nome || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getProduto(item) || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                cancelado
                                  ? 'bg-red-100 text-red-800'
                                  : retido
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {cancelado ? 'Cancelado' : retido ? 'Retido' : String(item.status || '-')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={String(item.razao_cancelamento || '')}>
                              {String(item.razao_cancelamento || '-')}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                              cancelado ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {valor > 0 ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
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
