'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  BookOpen,
  UserCheck,
  Calendar,
  Phone,
  Clock,
  Target
} from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface AcompanhamentoAluno {
  nome?: string;
  email?: string;
  status?: string;
  produto?: string;
  horas_ofertadas?: number | string;
  inicio?: Date | string;
  fim?: Date | string;
  levelling?: boolean | string;
  data_levelling?: Date | string;  // Obs1
  nivel?: string;
  acesso?: boolean | string;
  data_acesso?: Date | string;  // Obs2
  onboarding?: boolean | string;
  data_onboarding?: Date | string;  // Obs3
  primeira_aula?: boolean | string;
  data_primeira_aula?: Date | string;
  fup1?: boolean | string;
  status_fup1?: string;
  fup2?: boolean | string;
  status_fup2?: string;
  [key: string]: unknown;
}

// Verifica se checkbox está marcado (TRUE, true, sim, checked, etc)
const isChecked = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'sim' || lower === 'checked' || lower === '1' || lower === 'yes';
  }
  return false;
};

// Função para parsear data
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

export default function AcompanhamentoPage() {
  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<AcompanhamentoAluno>('acompanhamento');
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVO');

  // Alunos filtrados por status
  const alunosFiltrados = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (filtroStatus === 'TODOS') {
      return data;
    }

    return data.filter(item => {
      const status = String(item.status || '').toUpperCase().trim();
      return status === filtroStatus;
    });
  }, [data, filtroStatus]);

  // Contagem de status
  const statusCount = useMemo(() => {
    if (!data || data.length === 0) return {};

    const counts: Record<string, number> = {};
    data.forEach(item => {
      const status = String(item.status || 'Não informado').toUpperCase().trim();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [data]);

  // KPIs do funil de acompanhamento
  const kpis = useMemo(() => {
    const alunos = alunosFiltrados;
    const total = alunos.length;

    const comLevelling = alunos.filter(a => isChecked(a.levelling)).length;
    const comAcesso = alunos.filter(a => isChecked(a.acesso)).length;
    const comOnboarding = alunos.filter(a => isChecked(a.onboarding)).length;
    const comPrimeiraAula = alunos.filter(a => isChecked(a.primeira_aula)).length;
    const comFup1 = alunos.filter(a => isChecked(a.fup1)).length;
    const comFup2 = alunos.filter(a => isChecked(a.fup2)).length;

    // Alunos que completaram todo o funil
    const funnelCompleto = alunos.filter(a =>
      isChecked(a.levelling) &&
      isChecked(a.onboarding) &&
      isChecked(a.primeira_aula) &&
      isChecked(a.fup1) &&
      isChecked(a.fup2)
    ).length;

    return {
      total,
      comLevelling,
      comAcesso,
      comOnboarding,
      comPrimeiraAula,
      comFup1,
      comFup2,
      funnelCompleto,
      taxaLevelling: total > 0 ? (comLevelling / total) * 100 : 0,
      taxaOnboarding: total > 0 ? (comOnboarding / total) * 100 : 0,
      taxaPrimeiraAula: total > 0 ? (comPrimeiraAula / total) * 100 : 0,
      taxaFup1: total > 0 ? (comFup1 / total) * 100 : 0,
      taxaFup2: total > 0 ? (comFup2 / total) * 100 : 0,
    };
  }, [alunosFiltrados]);

  // Dados do funil para gráfico
  const funnelData = useMemo(() => {
    return [
      { etapa: 'Total', quantidade: kpis.total, cor: '#6B7280' },
      { etapa: 'Levelling', quantidade: kpis.comLevelling, cor: '#8B5CF6' },
      { etapa: 'Onboarding', quantidade: kpis.comOnboarding, cor: '#06B6D4' },
      { etapa: '1ª Aula', quantidade: kpis.comPrimeiraAula, cor: '#10B981' },
      { etapa: '1º FUP', quantidade: kpis.comFup1, cor: '#F59E0B' },
      { etapa: '2º FUP', quantidade: kpis.comFup2, cor: '#EF4444' },
    ];
  }, [kpis]);

  // Distribuição por produto
  const porProduto = useMemo(() => {
    const grupos: Record<string, number> = {};

    alunosFiltrados.forEach(item => {
      const produto = String(item.produto || 'Não informado').trim();
      grupos[produto] = (grupos[produto] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [alunosFiltrados]);

  // Alunos pendentes em cada etapa
  const pendentes = useMemo(() => {
    const alunos = alunosFiltrados;

    return {
      semLevelling: alunos.filter(a => !isChecked(a.levelling)),
      semOnboarding: alunos.filter(a => isChecked(a.levelling) && !isChecked(a.onboarding)),
      semPrimeiraAula: alunos.filter(a => isChecked(a.onboarding) && !isChecked(a.primeira_aula)),
      semFup1: alunos.filter(a => isChecked(a.primeira_aula) && !isChecked(a.fup1)),
      semFup2: alunos.filter(a => isChecked(a.fup1) && !isChecked(a.fup2)),
    };
  }, [alunosFiltrados]);

  // Se houver erro de configuração
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuracao Necessaria</h2>
          <p className="text-gray-500 mb-6 max-w-md">{error}</p>
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Ir para Configuracoes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Acompanhamento de Alunos"
        description="Funil de onboarding e follow-up dos alunos"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#8B5CF6"
      >
        <div className="space-y-8">
          {/* Filtro de Status */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2 py-2">Filtrar por Status:</span>
            {Object.entries(statusCount).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({count})
              </button>
            ))}
            <button
              onClick={() => setFiltroStatus('TODOS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === 'TODOS'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              TODOS ({data.length})
            </button>
          </div>

          {/* KPIs do Funil */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Total Alunos"
              value={kpis.total}
              format="number"
              icon={<Users className="w-5 h-5" />}
              color="#6B7280"
              loading={loading}
            />
            <KPICard
              title="Levelling"
              value={`${kpis.taxaLevelling.toFixed(0)}%`}
              icon={<Target className="w-5 h-5" />}
              color="#8B5CF6"
              subtitle={`${kpis.comLevelling} de ${kpis.total}`}
              loading={loading}
            />
            <KPICard
              title="Onboarding"
              value={`${kpis.taxaOnboarding.toFixed(0)}%`}
              icon={<UserCheck className="w-5 h-5" />}
              color="#06B6D4"
              subtitle={`${kpis.comOnboarding} de ${kpis.total}`}
              loading={loading}
            />
            <KPICard
              title="1ª Aula"
              value={`${kpis.taxaPrimeiraAula.toFixed(0)}%`}
              icon={<BookOpen className="w-5 h-5" />}
              color="#10B981"
              subtitle={`${kpis.comPrimeiraAula} de ${kpis.total}`}
              loading={loading}
            />
            <KPICard
              title="1º FUP (7d)"
              value={`${kpis.taxaFup1.toFixed(0)}%`}
              icon={<Phone className="w-5 h-5" />}
              color="#F59E0B"
              subtitle={`${kpis.comFup1} de ${kpis.total}`}
              loading={loading}
            />
            <KPICard
              title="2º FUP (30d)"
              value={`${kpis.taxaFup2.toFixed(0)}%`}
              icon={<CheckCircle className="w-5 h-5" />}
              color="#EF4444"
              subtitle={`${kpis.comFup2} de ${kpis.total}`}
              loading={loading}
            />
          </div>

          {/* Gráfico do Funil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Funil de Acompanhamento"
              subtitle="Progressão por etapa"
            >
              <BarChartComponent
                data={funnelData}
                xKey="etapa"
                yKey="quantidade"
                color="#8B5CF6"
                height={300}
                loading={loading}
              />
            </ChartCard>

            {porProduto.length > 0 && (
              <ChartCard
                title="Distribuição por Produto"
                subtitle="Alunos por curso"
              >
                <PieChartComponent
                  data={porProduto.slice(0, 8)}
                  nameKey="name"
                  valueKey="value"
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Cards de Pendências */}
          <ModuleSection
            title="Alunos Pendentes por Etapa"
            subtitle="Quem precisa de atenção em cada fase"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Sem Levelling</h4>
                </div>
                <p className="text-3xl font-bold text-purple-700">{pendentes.semLevelling.length}</p>
                <p className="text-sm text-purple-600">alunos</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-cyan-600" />
                  <h4 className="font-semibold text-cyan-900">Sem Onboarding</h4>
                </div>
                <p className="text-3xl font-bold text-cyan-700">{pendentes.semOnboarding.length}</p>
                <p className="text-sm text-cyan-600">alunos</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Sem 1ª Aula</h4>
                </div>
                <p className="text-3xl font-bold text-green-700">{pendentes.semPrimeiraAula.length}</p>
                <p className="text-sm text-green-600">alunos</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-900">Sem 1º FUP</h4>
                </div>
                <p className="text-3xl font-bold text-amber-700">{pendentes.semFup1.length}</p>
                <p className="text-sm text-amber-600">alunos</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Sem 2º FUP</h4>
                </div>
                <p className="text-3xl font-bold text-red-700">{pendentes.semFup2.length}</p>
                <p className="text-sm text-red-600">alunos</p>
              </div>
            </div>
          </ModuleSection>

          {/* Tabela de Alunos */}
          {alunosFiltrados.length > 0 && (
            <ModuleSection
              title="Lista de Alunos"
              subtitle={`${alunosFiltrados.length} alunos - Status: ${filtroStatus}`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="bg-purple-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase">Produto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase">Nível</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase">Levelling</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase">Onboarding</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase">1ª Aula</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase">1º FUP</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase">2º FUP</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alunosFiltrados.slice(0, 100).map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {String(item.nome || '-')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {String(item.produto || '-')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {String(item.nivel || '-')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              {isChecked(item.levelling) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                              )}
                              {item.data_levelling && (
                                <span className="text-xs text-gray-500 mt-1">{String(item.data_levelling)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              {isChecked(item.onboarding) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                              )}
                              {item.data_onboarding && (
                                <span className="text-xs text-gray-500 mt-1">{String(item.data_onboarding)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              {isChecked(item.primeira_aula) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                              )}
                              {item.data_primeira_aula && (
                                <span className="text-xs text-gray-500 mt-1">{String(item.data_primeira_aula)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isChecked(item.fup1) ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isChecked(item.fup2) ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              String(item.status || '').toUpperCase() === 'ATIVO'
                                ? 'bg-green-100 text-green-800'
                                : String(item.status || '').toUpperCase() === 'INATIVO'
                                ? 'bg-gray-100 text-gray-800'
                                : String(item.status || '').toUpperCase() === 'CANCELADO'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {String(item.status || '-')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {alunosFiltrados.length > 100 && (
                    <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                      Mostrando 100 de {alunosFiltrados.length} registros
                    </div>
                  )}
                </div>
              </div>
            </ModuleSection>
          )}
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
