'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Users, DollarSign, GraduationCap, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface AlunoAtivo {
  aluno_nome?: string;
  aluno_id?: string;
  curso?: string;
  modalidade?: string;
  nivel?: string;
  valor_mensalidade?: number;
  data_matricula?: Date | string;
  status?: string;
  [key: string]: unknown;
}

export default function AlunosAtivosPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<AlunoAtivo>('alunos_ativos');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra apenas alunos ativos
  const alunosAtivos = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const status = String(item.status || '').toLowerCase();
      return status.includes('ativo') || status === '' || !item.status;
    });
  }, [data]);

  // Calcula KPIs
  const kpis = useMemo(() => {
    if (alunosAtivos.length === 0) {
      return {
        totalAlunos: 0,
        receitaRecorrente: 0,
        ticketMedio: 0,
      };
    }

    const totalAlunos = alunosAtivos.length;

    const receitaRecorrente = alunosAtivos.reduce((sum, item) => {
      const valor = typeof item.valor_mensalidade === 'number' ? item.valor_mensalidade : 0;
      return sum + valor;
    }, 0);

    const ticketMedio = totalAlunos > 0 ? receitaRecorrente / totalAlunos : 0;

    return {
      totalAlunos,
      receitaRecorrente,
      ticketMedio,
    };
  }, [alunosAtivos]);

  // Alunos por curso
  const alunosPorCurso = useMemo(() => {
    const cursos: Record<string, { alunos: number; receita: number }> = {};

    alunosAtivos.forEach(item => {
      const curso = String(item.curso || 'Não informado');
      if (!cursos[curso]) {
        cursos[curso] = { alunos: 0, receita: 0 };
      }
      cursos[curso].alunos += 1;
      cursos[curso].receita += typeof item.valor_mensalidade === 'number' ? item.valor_mensalidade : 0;
    });

    return Object.entries(cursos)
      .map(([curso, dados]) => ({
        curso,
        ...dados,
        ticket: dados.alunos > 0 ? Math.round(dados.receita / dados.alunos) : 0,
      }))
      .sort((a, b) => b.alunos - a.alunos);
  }, [alunosAtivos]);

  // Distribuição por modalidade
  const distribuicaoModalidade = useMemo(() => {
    const modalidades: Record<string, number> = {};

    alunosAtivos.forEach(item => {
      const modalidade = String(item.modalidade || 'Não informado');
      modalidades[modalidade] = (modalidades[modalidade] || 0) + 1;
    });

    return Object.entries(modalidades).map(([name, value]) => ({
      name,
      value,
    }));
  }, [alunosAtivos]);

  // Distribuição por nível
  const distribuicaoNivel = useMemo(() => {
    const niveis: Record<string, number> = {};

    alunosAtivos.forEach(item => {
      const nivel = String(item.nivel || 'Não informado');
      niveis[nivel] = (niveis[nivel] || 0) + 1;
    });

    const total = Object.values(niveis).reduce((sum, val) => sum + val, 0);

    return Object.entries(niveis).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [alunosAtivos]);

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
        title="Alunos Ativos"
        description="Base de alunos ativos e receita por curso"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#06B6D4"
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
          {!loading && alunosAtivos.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum aluno ativo encontrado.
                {data.length > 0 && ` (${data.length} registros totais na planilha)`}
              </p>
            </div>
          )}

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Alunos Ativos"
              value={kpis.totalAlunos}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#06B6D4"
              loading={loading}
            />
            <KPICard
              title="Receita Recorrente"
              value={kpis.receitaRecorrente}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              subtitle="Mensal"
              loading={loading}
            />
            <KPICard
              title="Ticket Médio"
              value={kpis.ticketMedio}
              format="currency"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={data.length}
              format="number"
              icon={<GraduationCap className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Alunos por Curso - Cards */}
          {alunosPorCurso.length > 0 && (
            <ModuleSection
              title="Alunos Ativos por Curso"
              subtitle="Distribuição detalhada"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {alunosPorCurso.slice(0, 8).map((curso) => (
                  <div
                    key={curso.curso}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                  >
                    <h4 className="text-sm font-medium text-gray-500 truncate" title={curso.curso}>
                      {curso.curso.split(' – ')[0]}
                    </h4>
                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{curso.alunos}</p>
                        <p className="text-xs text-gray-400">alunos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-cyan-600">
                          R$ {(curso.receita / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-gray-400">
                          Ticket: R$ {curso.ticket}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModuleSection>
          )}

          {/* Gráficos de distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {distribuicaoModalidade.length > 0 && (
              <ChartCard
                title="Modalidade"
                subtitle="Presencial vs Online"
              >
                <PieChartComponent
                  data={distribuicaoModalidade}
                  nameKey="name"
                  valueKey="value"
                  height={250}
                  loading={loading}
                />
              </ChartCard>
            )}

            {distribuicaoNivel.length > 0 && (
              <ChartCard
                title="Distribuição por Nível"
                subtitle="Percentual de alunos"
              >
                <PieChartComponent
                  data={distribuicaoNivel}
                  nameKey="name"
                  valueKey="value"
                  height={250}
                  loading={loading}
                />
              </ChartCard>
            )}

            {alunosPorCurso.length > 0 && (
              <ChartCard
                title="Alunos por Curso"
                subtitle="Ranking de cursos"
              >
                <BarChartComponent
                  data={alunosPorCurso.slice(0, 5)}
                  xKey="curso"
                  yKey="alunos"
                  color="#06B6D4"
                  horizontal
                  height={250}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Tabela de receita por curso */}
          {alunosPorCurso.length > 0 && (
            <ModuleSection
              title="Receita Média por Curso"
              subtitle="Ticket médio mensal"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alunos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket Médio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % da Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alunosPorCurso.map((curso) => {
                      const totalReceita = alunosPorCurso.reduce((sum, c) => sum + c.receita, 0);
                      const percentual = totalReceita > 0 ? ((curso.receita / totalReceita) * 100).toFixed(1) : '0';

                      return (
                        <tr key={curso.curso} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {curso.curso}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {curso.alunos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {curso.receita.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-600 font-medium">
                            R$ {curso.ticket.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-cyan-500"
                                  style={{ width: `${percentual}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">{percentual}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ModuleSection>
          )}
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
