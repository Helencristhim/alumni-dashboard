'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Receipt, DollarSign, CheckCircle, AlertCircle, Settings, Percent, Calendar, Phone } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface TituloCobranca {
  nome?: string;
  email?: string;
  telefone?: string;
  vencimento: Date | string;
  cobranca_valor?: number;
  valor_total_aberto?: number;
  data_pagamento?: Date | string;
  valor_recuperado?: number;
  data_ultimo_contato?: Date | string;
  aluno?: string;
  status?: string;
  [key: string]: unknown;
}

// Função para parsear valor
const parseValor = (valor: unknown): number => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    const limpo = valor.replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Função para parsear data
const parseDate = (dateValue: Date | string | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateValue);
  }
  return null;
};

// Função para extrair mês de uma data
const getMonthFromDate = (dateValue: Date | string | undefined): string => {
  const date = parseDate(dateValue);
  if (!date) return 'N/A';
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return monthNames[date.getMonth()];
};

export default function CobrancaPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<TituloCobranca>('cobranca');

  // Também busca dados de vendas para calcular % de inadimplência
  const vendasData = useSheetData<{ cancelamento?: boolean | string }>('vendas_b2c');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período de vencimento
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const itemDate = parseDate(item.vencimento);
      if (!itemDate) return true;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // Valor total em aberto por mês (baseado no vencimento)
  const valorAbertoMes = useMemo(() => {
    const grupos: Record<string, number> = {};

    data.forEach(item => {
      const mes = getMonthFromDate(item.vencimento);
      const valor = parseValor(item.valor_total_aberto);
      grupos[mes] = (grupos[mes] || 0) + valor;
    });

    return Object.entries(grupos)
      .map(([mes, valor]) => ({ mes, valor }))
      .filter(item => item.valor > 0);
  }, [data]);

  // Valor total recuperado por mês (baseado na data de pagamento)
  const valorRecuperadoMes = useMemo(() => {
    const grupos: Record<string, number> = {};

    data.forEach(item => {
      if (!item.data_pagamento) return;
      const mes = getMonthFromDate(item.data_pagamento);
      const valor = parseValor(item.valor_recuperado);
      grupos[mes] = (grupos[mes] || 0) + valor;
    });

    return Object.entries(grupos)
      .map(([mes, valor]) => ({ mes, valor }))
      .filter(item => item.valor > 0);
  }, [data]);

  // Calcula KPIs
  const kpis = useMemo(() => {
    // Valor total em aberto (absoluto - soma de toda a coluna)
    const inadimplenciaAbsoluta = data.reduce((sum, item) => {
      return sum + parseValor(item.valor_total_aberto);
    }, 0);

    // Valor total recuperado
    const valorRecuperado = data.reduce((sum, item) => {
      return sum + parseValor(item.valor_recuperado);
    }, 0);

    // % de inadimplência (alunos com pendência vs alunos ativos)
    const alunosComPendencia = data.filter(item => parseValor(item.valor_total_aberto) > 0).length;
    const totalAlunosAtivos = vendasData.data ? vendasData.data.filter(item => {
      const cancelamento = item.cancelamento;
      if (cancelamento === undefined || cancelamento === null) return true;
      if (typeof cancelamento === 'boolean') return !cancelamento;
      const cancelStr = String(cancelamento).toLowerCase().trim();
      return cancelStr === 'false' || cancelStr === 'não' || cancelStr === 'nao' || cancelStr === 'n' || cancelStr === '0' || cancelStr === 'ativo';
    }).length : 0;

    const percentualInadimplencia = totalAlunosAtivos > 0
      ? (alunosComPendencia / totalAlunosAtivos) * 100
      : 0;

    // Total de títulos em aberto
    const titulosEmAberto = data.filter(item => parseValor(item.valor_total_aberto) > 0).length;

    return {
      inadimplenciaAbsoluta,
      valorRecuperado,
      percentualInadimplencia,
      titulosEmAberto,
      alunosComPendencia,
      totalAlunosAtivos,
    };
  }, [data, vendasData.data]);

  // Comparativo mensal (aberto vs recuperado)
  const comparativoMensal = useMemo(() => {
    const meses: Record<string, { aberto: number; recuperado: number }> = {};

    // Valor em aberto por mês de vencimento
    data.forEach(item => {
      const mes = getMonthFromDate(item.vencimento);
      if (!meses[mes]) meses[mes] = { aberto: 0, recuperado: 0 };
      meses[mes].aberto += parseValor(item.valor_total_aberto);
    });

    // Valor recuperado por mês de pagamento
    data.forEach(item => {
      if (!item.data_pagamento) return;
      const mes = getMonthFromDate(item.data_pagamento);
      if (!meses[mes]) meses[mes] = { aberto: 0, recuperado: 0 };
      meses[mes].recuperado += parseValor(item.valor_recuperado);
    });

    return Object.entries(meses)
      .map(([mes, dados]) => ({ mes, ...dados }))
      .filter(item => item.aberto > 0 || item.recuperado > 0);
  }, [data]);

  // Títulos em atraso (para tabela)
  const titulosEmAtraso = useMemo(() => {
    return data
      .filter(item => parseValor(item.valor_total_aberto) > 0)
      .map(item => {
        const vencimento = parseDate(item.vencimento);
        const hoje = new Date();
        const diasAtraso = vencimento ? Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          nome: String(item.nome || item.aluno || 'N/A'),
          email: String(item.email || '-'),
          telefone: String(item.telefone || '-'),
          vencimento: vencimento ? vencimento.toLocaleDateString('pt-BR') : '-',
          valorAberto: parseValor(item.valor_total_aberto),
          diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
          ultimoContato: parseDate(item.data_ultimo_contato)?.toLocaleDateString('pt-BR') || '-',
          status: String(item.status || 'Pendente'),
        };
      })
      .sort((a, b) => b.diasAtraso - a.diasAtraso)
      .slice(0, 10);
  }, [data]);

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
        title="Cobrança"
        description="Inadimplência e recuperação de valores"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#F59E0B"
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
          {!loading && data.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum dado encontrado na planilha de cobrança.
              </p>
            </div>
          )}

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Inadimplência (Absoluto)"
              value={kpis.inadimplenciaAbsoluta}
              format="currencyCompact"
              icon={<AlertCircle className="w-6 h-6" />}
              color="#EF4444"
              subtitle="Valor total em aberto"
              loading={loading}
            />
            <KPICard
              title="Valor Recuperado"
              value={kpis.valorRecuperado}
              format="currencyCompact"
              icon={<CheckCircle className="w-6 h-6" />}
              color="#10B981"
              subtitle="Total recuperado"
              loading={loading}
            />
            <KPICard
              title="% Inadimplência"
              value={`${kpis.percentualInadimplencia.toFixed(1)}%`}
              icon={<Percent className="w-6 h-6" />}
              color={kpis.percentualInadimplencia > 15 ? '#EF4444' : '#F59E0B'}
              subtitle={`${kpis.alunosComPendencia} de ${kpis.totalAlunosAtivos} alunos`}
              loading={loading || vendasData.loading}
            />
            <KPICard
              title="Títulos em Aberto"
              value={kpis.titulosEmAberto}
              format="number"
              icon={<Receipt className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Pendentes"
              loading={loading}
            />
          </div>

          {/* Gráficos de evolução mensal */}
          {(valorAbertoMes.length > 0 || valorRecuperadoMes.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Valor Total em Aberto por Mês"
                subtitle="Baseado no mês de vencimento"
              >
                <BarChartComponent
                  data={valorAbertoMes}
                  xKey="mes"
                  yKey="valor"
                  color="#EF4444"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>

              <ChartCard
                title="Valor Recuperado por Mês"
                subtitle="Baseado no mês de pagamento"
              >
                <BarChartComponent
                  data={valorRecuperadoMes}
                  xKey="mes"
                  yKey="valor"
                  color="#10B981"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            </div>
          )}

          {/* Comparativo mensal */}
          {comparativoMensal.length > 0 && (
            <ChartCard
              title="Comparativo Mensal: Em Aberto vs Recuperado"
              subtitle="Evolução por mês"
            >
              <AreaChartComponent
                data={comparativoMensal}
                xKey="mes"
                yKey="aberto"
                color="#EF4444"
                formatY="currency"
                height={300}
                loading={loading}
              />
            </ChartCard>
          )}

          {/* Títulos em Atraso */}
          {titulosEmAtraso.length > 0 && (
            <ModuleSection
              title="Títulos em Aberto - Prioridade de Cobrança"
              subtitle={`${titulosEmAtraso.length} registros com pendência`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Dias Atraso
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Valor em Aberto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Último Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {titulosEmAtraso.map((titulo, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {titulo.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500">
                              <div>{titulo.email}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {titulo.telefone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {titulo.vencimento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              titulo.diasAtraso <= 15 ? 'text-yellow-600' :
                              titulo.diasAtraso <= 30 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {titulo.diasAtraso > 0 ? `${titulo.diasAtraso} dias` : 'A vencer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 text-right">
                            R$ {titulo.valorAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {titulo.ultimoContato}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              titulo.status.toLowerCase().includes('pago')
                                ? 'bg-green-100 text-green-800'
                                : titulo.status.toLowerCase().includes('negoci')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {titulo.status}
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

          {/* Total de registros */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              Total de registros na planilha: <span className="font-semibold">{data.length}</span>
            </p>
          </div>
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
