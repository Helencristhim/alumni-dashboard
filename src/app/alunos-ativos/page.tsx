'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { Users, DollarSign, GraduationCap, TrendingUp, AlertCircle, Settings } from 'lucide-react';
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

export default function AlunosAtivosPage() {
  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<AlunoAtivo>('alunos_ativos');

  // Filtra apenas alunos ativos
  const alunosAtivos = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const status = String(item.status || '').toLowerCase();
      return status.includes('ativo') || status === '' || status === 'false' || !item.status;
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
      return sum + parseValor(item.valor_mensalidade);
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

    // Inicializa com produtos da lista
    PRODUTOS_LISTA.forEach(curso => {
      cursos[curso] = { alunos: 0, receita: 0 };
    });

    alunosAtivos.forEach(item => {
      const curso = String(item.curso || 'Outros');
      if (!cursos[curso]) {
        cursos[curso] = { alunos: 0, receita: 0 };
      }
      cursos[curso].alunos += 1;
      cursos[curso].receita += parseValor(item.valor_mensalidade);
    });

    return Object.entries(cursos)
      .filter(([, dados]) => dados.alunos > 0)
      .map(([curso, dados]) => ({
        curso,
        ...dados,
        ticketMedio: dados.alunos > 0 ? Math.round(dados.receita / dados.alunos) : 0,
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
              title="Receita Média por Curso"
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

          {/* Alunos Ativos por Curso - Tabela completa */}
          {alunosPorCurso.length > 0 && (
            <ModuleSection
              title="Alunos Ativos por Curso"
              subtitle={`${kpis.totalAlunos} alunos em ${alunosPorCurso.length} cursos`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cyan-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Curso
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Alunos
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Receita Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Receita Média
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alunosPorCurso.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.curso}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-cyan-800 bg-cyan-100 rounded-full">
                              {item.alunos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-cyan-600 font-medium text-right">
                            R$ {item.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-cyan-500"
                                  style={{ width: `${kpis.totalAlunos > 0 ? (item.alunos / kpis.totalAlunos) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">
                                {kpis.totalAlunos > 0 ? ((item.alunos / kpis.totalAlunos) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-cyan-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-cyan-900">
                          TOTAL
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-cyan-900">
                          {kpis.totalAlunos}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-cyan-900 text-right">
                          R$ {kpis.receitaRecorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-cyan-900 text-right">
                          R$ {kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-cyan-900 text-right">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Gráficos de distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {alunosPorCurso.length > 0 && (
              <ChartCard
                title="Alunos por Curso"
                subtitle="Top cursos"
              >
                <BarChartComponent
                  data={alunosPorCurso.slice(0, 7)}
                  xKey="curso"
                  yKey="alunos"
                  color="#06B6D4"
                  horizontal
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}

            {distribuicaoModalidade.length > 0 && (
              <ChartCard
                title="Modalidade"
                subtitle="Presencial vs Online"
              >
                <PieChartComponent
                  data={distribuicaoModalidade}
                  nameKey="name"
                  valueKey="value"
                  height={280}
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
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Receita por Curso */}
          {alunosPorCurso.length > 0 && (
            <ChartCard
              title="Receita Recorrente por Curso"
              subtitle="Valor mensal"
            >
              <BarChartComponent
                data={alunosPorCurso.slice(0, 10)}
                xKey="curso"
                yKey="receita"
                color="#10B981"
                formatY="currency"
                height={300}
                loading={loading}
              />
            </ChartCard>
          )}
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
