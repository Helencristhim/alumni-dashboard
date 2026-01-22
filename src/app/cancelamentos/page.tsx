'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { UserX, TrendingDown, Clock, AlertTriangle, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface Cancelamento {
  data_cancelamento: Date | string;
  aluno_nome?: string;
  curso?: string;
  motivo?: string;
  valor_perdido?: number;
  dias_efetivacao?: number;
  [key: string]: unknown;
}

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

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data_cancelamento) return true;

      let itemDate: Date;
      if (item.data_cancelamento instanceof Date) {
        itemDate = item.data_cancelamento;
      } else if (typeof item.data_cancelamento === 'string') {
        const parts = item.data_cancelamento.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data_cancelamento);
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
        totalCancelamentos: 0,
        receitaPerdida: 0,
        tempoMedioEfetivacao: 0,
      };
    }

    const totalCancelamentos = filteredData.length;

    const receitaPerdida = filteredData.reduce((sum, item) => {
      const valor = typeof item.valor_perdido === 'number' ? item.valor_perdido : 0;
      return sum + valor;
    }, 0);

    const diasValues = filteredData.filter(item => typeof item.dias_efetivacao === 'number').map(item => item.dias_efetivacao as number);
    const tempoMedioEfetivacao = diasValues.length > 0
      ? Math.round(diasValues.reduce((a, b) => a + b, 0) / diasValues.length)
      : 0;

    return {
      totalCancelamentos,
      receitaPerdida,
      tempoMedioEfetivacao,
    };
  }, [filteredData]);

  // Cancelamentos por curso
  const cancelamentosPorCurso = useMemo(() => {
    const cursos: Record<string, number> = {};

    filteredData.forEach(item => {
      const curso = String(item.curso || 'Não informado');
      cursos[curso] = (cursos[curso] || 0) + 1;
    });

    return Object.entries(cursos)
      .map(([curso, cancelamentos]) => ({
        curso,
        cancelamentos,
      }))
      .sort((a, b) => b.cancelamentos - a.cancelamentos);
  }, [filteredData]);

  // Motivos de cancelamento
  const motivosCancelamento = useMemo(() => {
    const motivos: Record<string, number> = {};

    filteredData.forEach(item => {
      const motivo = String(item.motivo || 'Não informado');
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    });

    const total = Object.values(motivos).reduce((sum, val) => sum + val, 0);

    return Object.entries(motivos)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
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
              title="Total Cancelamentos"
              value={kpis.totalCancelamentos}
              format="number"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
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
              title="Tempo Médio Efetivação"
              value={kpis.tempoMedioEfetivacao > 0 ? `${kpis.tempoMedioEfetivacao} dias` : '0'}
              icon={<Clock className="w-6 h-6" />}
              color="#F59E0B"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={data.length}
              format="number"
              icon={<TrendingDown className="w-6 h-6" />}
              color="#10B981"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Cancelamentos por Curso */}
          {cancelamentosPorCurso.length > 0 && (
            <ModuleSection
              title="Cancelamentos por Curso"
              subtitle="Quantidade por produto"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {cancelamentosPorCurso.slice(0, 7).map((curso) => (
                  <div
                    key={curso.curso}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    <p className="text-xs text-gray-500 font-medium truncate" title={curso.curso}>
                      {curso.curso.split(' – ')[0]}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{curso.cancelamentos}</p>
                    <p className="text-sm text-red-500 font-medium">cancelamentos</p>
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

            {motivosCancelamento.length > 0 && (
              <ChartCard
                title="Motivos de Cancelamento"
                subtitle="Distribuição geral"
              >
                <PieChartComponent
                  data={motivosCancelamento}
                  nameKey="name"
                  valueKey="value"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

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
                          Valor Perdido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.slice(0, 10).map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.data_cancelamento instanceof Date
                              ? item.data_cancelamento.toLocaleDateString('pt-BR')
                              : String(item.data_cancelamento || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {String(item.aluno_nome || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {String(item.curso || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {String(item.motivo || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {typeof item.valor_perdido === 'number'
                              ? `R$ ${item.valor_perdido.toLocaleString('pt-BR')}`
                              : '-'}
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
