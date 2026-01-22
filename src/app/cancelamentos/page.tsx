'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { UserX, TrendingDown, Clock, AlertTriangle, AlertCircle, Settings, Users, Percent } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

// Lista oficial de produtos/cursos
const PRODUTOS_LISTA = [
  'Espanhol 12 meses',
  'Espanhol 6 meses',
  'Inglês 12 meses - FLOW',
  'Inglês 6 meses - FLOW',
  'Inglês 12 meses',
  'Inglês 10 meses',
  'Inglês 09 meses',
  'Inglês 06 meses',
  'Inglês 03 meses',
  'Inglês 01 mês',
  'Aulas particulares',
  'FAAP - Ribeirão',
  'HDI - COPARTICIPACAO 30%',
  'Imersão 01 mês',
];

interface Cancelamento {
  data_solicitacao: Date | string;
  data_efetivacao?: Date | string;
  aluno_id?: string;
  aluno_nome?: string;
  curso?: string;
  motivo_principal?: string;
  motivo_detalhado?: string;
  valor_mensalidade?: number;
  tempo_como_aluno?: number;
  tentativa_retencao?: string;
  feedback?: string;
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

export default function CancelamentosPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<Cancelamento>('cancelamentos');

  // Também busca dados de vendas para calcular taxa de cancelamento
  const vendasData = useSheetData<{ cancelamento?: boolean | string }>('vendas_b2c');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const itemDate = parseDate(item.data_solicitacao);
      if (!itemDate) return true;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // Calcula taxa de cancelamento baseada em alunos ativos vs cancelados (da planilha de vendas)
  const taxaCancelamento = useMemo(() => {
    if (!vendasData.data || vendasData.data.length === 0) return 0;

    const isCancelado = (cancelamento: boolean | string | undefined): boolean => {
      if (cancelamento === undefined || cancelamento === null) return false;
      if (typeof cancelamento === 'boolean') return cancelamento;
      const cancelStr = String(cancelamento).toLowerCase().trim();
      return cancelStr === 'true' || cancelStr === 'sim' || cancelStr === 's' || cancelStr === '1' || cancelStr === 'cancelado';
    };

    const totalAlunos = vendasData.data.length;
    const totalCancelados = vendasData.data.filter(item => isCancelado(item.cancelamento)).length;

    return totalAlunos > 0 ? (totalCancelados / totalAlunos) * 100 : 0;
  }, [vendasData.data]);

  // Calcula KPIs
  const kpis = useMemo(() => {
    const totalCancelamentos = filteredData.length;

    const receitaPerdida = filteredData.reduce((sum, item) => {
      return sum + parseValor(item.valor_mensalidade);
    }, 0);

    // Calcula tempo médio como aluno antes de cancelar
    const temposComoAluno = filteredData
      .filter(item => typeof item.tempo_como_aluno === 'number' && item.tempo_como_aluno > 0)
      .map(item => item.tempo_como_aluno as number);

    const tempoMedioComoAluno = temposComoAluno.length > 0
      ? Math.round(temposComoAluno.reduce((a, b) => a + b, 0) / temposComoAluno.length)
      : 0;

    return {
      totalCancelamentos,
      receitaPerdida,
      tempoMedioComoAluno,
    };
  }, [filteredData]);

  // Cancelamentos por curso e por mês
  const cancelamentosPorCursoMes = useMemo(() => {
    const grupos: Record<string, Record<string, number>> = {};

    // Inicializa com todos os produtos
    PRODUTOS_LISTA.forEach(curso => {
      grupos[curso] = {};
    });

    filteredData.forEach(item => {
      const curso = String(item.curso || 'Outros');
      const itemDate = parseDate(item.data_solicitacao);

      if (!grupos[curso]) {
        grupos[curso] = {};
      }

      let mes = 'N/A';
      if (itemDate) {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        mes = `${monthNames[itemDate.getMonth()]}/${itemDate.getFullYear()}`;
      }

      grupos[curso][mes] = (grupos[curso][mes] || 0) + 1;
    });

    return grupos;
  }, [filteredData]);

  // Cancelamentos por curso (total)
  const cancelamentosPorCurso = useMemo(() => {
    const cursos: Record<string, number> = {};

    // Inicializa com produtos da lista
    PRODUTOS_LISTA.forEach(curso => {
      cursos[curso] = 0;
    });

    filteredData.forEach(item => {
      const curso = String(item.curso || 'Outros');
      cursos[curso] = (cursos[curso] || 0) + 1;
    });

    return Object.entries(cursos)
      .filter(([, count]) => count > 0)
      .map(([curso, cancelamentos]) => ({
        curso,
        cancelamentos,
      }))
      .sort((a, b) => b.cancelamentos - a.cancelamentos);
  }, [filteredData]);

  // Motivos de cancelamento por curso (Top 3 por curso)
  const motivosPorCurso = useMemo(() => {
    const grupos: Record<string, Record<string, number>> = {};

    filteredData.forEach(item => {
      const curso = String(item.curso || 'Outros');
      const motivo = String(item.motivo_principal || 'Não informado');

      if (!grupos[curso]) {
        grupos[curso] = {};
      }

      grupos[curso][motivo] = (grupos[curso][motivo] || 0) + 1;
    });

    // Converte para array com top 3 motivos por curso
    return Object.entries(grupos).map(([curso, motivos]) => {
      const top3 = Object.entries(motivos)
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return { curso, motivos: top3, total: Object.values(motivos).reduce((a, b) => a + b, 0) };
    }).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Motivos de cancelamento geral (para pie chart)
  const motivosCancelamentoGeral = useMemo(() => {
    const motivos: Record<string, number> = {};

    filteredData.forEach(item => {
      const motivo = String(item.motivo_principal || 'Não informado');
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    });

    const total = Object.values(motivos).reduce((sum, val) => sum + val, 0);

    return Object.entries(motivos)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredData]);

  // Cancelamentos por mês
  const cancelamentosPorMes = useMemo(() => {
    const grupos: Record<string, number> = {};

    filteredData.forEach(item => {
      const itemDate = parseDate(item.data_solicitacao);
      if (!itemDate) return;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mes = monthNames[itemDate.getMonth()];

      grupos[mes] = (grupos[mes] || 0) + 1;
    });

    return Object.entries(grupos).map(([mes, quantidade]) => ({
      mes,
      quantidade
    }));
  }, [filteredData]);

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
        description="Churn e motivos de cancelamento por curso"
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

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Taxa de Cancelamento"
              value={`${taxaCancelamento.toFixed(1)}%`}
              icon={<Percent className="w-6 h-6" />}
              color={taxaCancelamento > 10 ? '#EF4444' : '#10B981'}
              subtitle="Base: ativos vs cancelados"
              loading={loading || vendasData.loading}
            />
            <KPICard
              title="Total Cancelamentos"
              value={kpis.totalCancelamentos}
              format="number"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
              subtitle="No período"
              loading={loading}
            />
            <KPICard
              title="Receita Perdida"
              value={kpis.receitaPerdida}
              format="currencyCompact"
              icon={<AlertTriangle className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Tempo Médio como Aluno"
              value={kpis.tempoMedioComoAluno > 0 ? `${kpis.tempoMedioComoAluno} meses` : '0'}
              icon={<Clock className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Antes de cancelar"
              loading={loading}
            />
          </div>

          {/* Cancelamentos por Curso */}
          {cancelamentosPorCurso.length > 0 && (
            <ModuleSection
              title="Cancelamentos por Curso"
              subtitle={`${kpis.totalCancelamentos} cancelamentos no período`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Curso
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Cancelamentos
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-red-800 uppercase tracking-wider">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cancelamentosPorCurso.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.curso}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                              {item.cancelamentos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-right">
                            {kpis.totalCancelamentos > 0
                              ? ((item.cancelamentos / kpis.totalCancelamentos) * 100).toFixed(1)
                              : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-red-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-red-900">
                          TOTAL
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-red-900">
                          {kpis.totalCancelamentos}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-red-900 text-right">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Motivos por Curso (Top 3) */}
          {motivosPorCurso.length > 0 && (
            <ModuleSection
              title="Motivos de Cancelamento por Curso"
              subtitle="Top 3 motivos para cada curso"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {motivosPorCurso.slice(0, 6).map((item, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 truncate" title={item.curso}>
                        {item.curso.length > 25 ? item.curso.substring(0, 25) + '...' : item.curso}
                      </h4>
                      <span className="text-xs text-gray-400">{item.total} cancelamentos</span>
                    </div>
                    <div className="space-y-2">
                      {item.motivos.map((m, j) => (
                        <div key={j} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate" title={m.motivo}>
                            {j + 1}. {m.motivo.length > 30 ? m.motivo.substring(0, 30) + '...' : m.motivo}
                          </span>
                          <span className="font-medium text-red-600 ml-2">{m.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ModuleSection>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cancelamentosPorCurso.length > 0 && (
              <ChartCard
                title="Cancelamentos por Curso"
                subtitle="Quantidade absoluta"
              >
                <BarChartComponent
                  data={cancelamentosPorCurso.slice(0, 7)}
                  xKey="curso"
                  yKey="cancelamentos"
                  color="#EF4444"
                  horizontal
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}

            {motivosCancelamentoGeral.length > 0 && (
              <ChartCard
                title="Motivos de Cancelamento"
                subtitle="Distribuição geral"
              >
                <PieChartComponent
                  data={motivosCancelamentoGeral}
                  nameKey="name"
                  valueKey="value"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Evolução mensal */}
          {cancelamentosPorMes.length > 0 && (
            <ChartCard
              title="Cancelamentos por Mês"
              subtitle="Evolução no período"
            >
              <BarChartComponent
                data={cancelamentosPorMes}
                xKey="mes"
                yKey="quantidade"
                color="#EF4444"
                height={250}
                loading={loading}
              />
            </ChartCard>
          )}

          {/* Lista de cancelamentos recentes */}
          {filteredData.length > 0 && (
            <ModuleSection
              title="Cancelamentos Recentes"
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
                          Curso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Mensalidade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.slice(0, 10).map((item, i) => {
                        const dataFormatada = parseDate(item.data_solicitacao);
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dataFormatada ? dataFormatada.toLocaleDateString('pt-BR') : String(item.data_solicitacao || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(item.aluno_nome || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(item.curso || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(item.motivo_principal || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              {parseValor(item.valor_mensalidade) > 0
                                ? `R$ ${parseValor(item.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : '-'}
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
