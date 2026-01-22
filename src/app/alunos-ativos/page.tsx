'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Users, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';

// Dados de demonstração
const demoData = {
  totalAlunos: 1847,
  alunosAnterior: 1720,
  receitaMediaCurso: 1250,
  receitaAnterior: 1180,
  receitaRecorrente: 2308750,
  recorrenteAnterior: 2028400,
  alunosNovos: 127,
  novosAnterior: 98,
};

const alunosPorCurso = [
  { curso: 'Particular presencial – inglês', alunos: 420, receita: 525000, ticket: 1250 },
  { curso: 'Particular online – inglês', alunos: 380, receita: 456000, ticket: 1200 },
  { curso: 'Particular online – espanhol', alunos: 120, receita: 144000, ticket: 1200 },
  { curso: 'Conexion – espanhol', alunos: 220, receita: 220000, ticket: 1000 },
  { curso: 'Community – inglês', alunos: 350, receita: 280000, ticket: 800 },
  { curso: 'Community Flow – inglês', alunos: 280, receita: 336000, ticket: 1200 },
  { curso: 'Imersão – inglês', alunos: 77, receita: 347750, ticket: 4516 },
];

const evolucaoBase = [
  { mes: 'Jul', alunos: 1620, receitaRecorrente: 1944000 },
  { mes: 'Ago', alunos: 1680, receitaRecorrente: 2016000 },
  { mes: 'Set', alunos: 1710, receitaRecorrente: 2052000 },
  { mes: 'Out', alunos: 1750, receitaRecorrente: 2100000 },
  { mes: 'Nov', alunos: 1720, receitaRecorrente: 2064000 },
  { mes: 'Dez', alunos: 1847, receitaRecorrente: 2308750 },
];

const distribuicaoModalidade = [
  { name: 'Presencial', value: 420 },
  { name: 'Online', value: 1427 },
];

const distribuicaoNivel = [
  { name: 'Iniciante', value: 35 },
  { name: 'Básico', value: 28 },
  { name: 'Intermediário', value: 22 },
  { name: 'Avançado', value: 12 },
  { name: 'Fluente', value: 3 },
];

export default function AlunosAtivosPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Alunos Ativos"
        description="Base de alunos ativos e receita por curso"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
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
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Alunos Ativos"
              value={demoData.totalAlunos}
              previousValue={demoData.alunosAnterior}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#06B6D4"
              loading={loading}
            />
            <KPICard
              title="Receita Recorrente"
              value={demoData.receitaRecorrente}
              previousValue={demoData.recorrenteAnterior}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              subtitle="Mensal"
              loading={loading}
            />
            <KPICard
              title="Ticket Médio"
              value={demoData.receitaMediaCurso}
              previousValue={demoData.receitaAnterior}
              format="currency"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Novos Alunos"
              value={demoData.alunosNovos}
              previousValue={demoData.novosAnterior}
              format="number"
              icon={<GraduationCap className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Este mês"
              loading={loading}
            />
          </div>

          {/* Alunos por Curso - Cards */}
          <ModuleSection
            title="Alunos Ativos por Curso"
            subtitle="Distribuição detalhada"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {alunosPorCurso.map((curso) => (
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

          {/* Gráficos principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução da Base de Alunos"
              subtitle="Últimos 6 meses"
            >
              <LineChart
                data={evolucaoBase}
                xKey="mes"
                yKey="alunos"
                color="#06B6D4"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Receita Recorrente Mensal"
              subtitle="MRR por mês"
            >
              <BarChartComponent
                data={evolucaoBase}
                xKey="mes"
                yKey="receitaRecorrente"
                color="#10B981"
                formatY="currency"
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Gráficos de distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </div>

          {/* Tabela de receita por curso */}
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
                    const percentual = ((curso.receita / totalReceita) * 100).toFixed(1);

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
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
