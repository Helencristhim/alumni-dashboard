'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { Users, GraduationCap, AlertCircle, Settings, Calendar, Award, Clock } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

// Lista oficial de produtos/cursos - EXATAMENTE como na planilha
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

// Status válidos conforme especificação
const STATUS_ATIVOS = ['ATIVO', 'INADIMPLENTE'];
const STATUS_TODOS = ['ATIVO', 'INATIVO', 'CANCELADO', 'ON HOLD', 'INADIMPLENTE'];

interface AlunoAtivo {
  aluno_nome?: string;
  aluno_id?: string;
  produto?: string;        // Coluna PRODUTO
  curso?: string;          // Alias para produto
  tipo?: string;           // Coluna TIPO: B2B, B2B2C, B2C, BOLSISTA
  nivel?: string;          // Coluna NÍVEL
  data_inicio?: Date | string;  // Coluna INÍCIO
  data_fim?: Date | string;     // Coluna FIM
  status?: string;         // Coluna STATUS: ATIVO, INATIVO, CANCELADO, ON HOLD, INADIMPLENTE
  modalidade?: string;
  [key: string]: unknown;
}

// Função para parsear data (formato DD/MM/AAAA)
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

// Função para normalizar status
const normalizeStatus = (status: string | undefined): string => {
  if (!status) return '';
  const s = String(status).toUpperCase().trim();
  // Mapeia variações para os valores padrão
  if (s.includes('ATIVO') && !s.includes('INATIVO')) return 'ATIVO';
  if (s.includes('INATIVO')) return 'INATIVO';
  if (s.includes('CANCELADO') || s.includes('CANCEL')) return 'CANCELADO';
  if (s.includes('HOLD') || s.includes('PAUSA')) return 'ON HOLD';
  if (s.includes('INADIMPLENTE') || s.includes('INADIMP')) return 'INADIMPLENTE';
  return s;
};

// Função para normalizar tipo
const normalizeTipo = (tipo: string | undefined): string => {
  if (!tipo) return '';
  const t = String(tipo).toUpperCase().trim();
  if (t === 'B2B' || t.includes('B2B') && !t.includes('B2B2C')) return 'B2B';
  if (t === 'B2B2C' || t.includes('B2B2C')) return 'B2B2C';
  if (t === 'B2C' || t.includes('B2C')) return 'B2C';
  if (t === 'BOLSISTA' || t.includes('BOLSISTA') || t.includes('BOLSA')) return 'BOLSISTA';
  return t;
};

export default function AlunosAtivosPage() {
  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<AlunoAtivo>('alunos_ativos');
  const [statusFilter, setStatusFilter] = useState<string>('ATIVOS');

  // Todos os alunos com status normalizado
  const alunosProcessados = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      ...item,
      status_normalizado: normalizeStatus(item.status),
      tipo_normalizado: normalizeTipo(item.tipo),
      produto_normalizado: String(item.produto || item.curso || '').trim(),
      data_inicio_parsed: parseDate(item.data_inicio),
      data_fim_parsed: parseDate(item.data_fim),
    }));
  }, [data]);

  // Filtra alunos ativos (STATUS = ATIVO ou INADIMPLENTE)
  const alunosAtivos = useMemo(() => {
    return alunosProcessados.filter(item =>
      STATUS_ATIVOS.includes(item.status_normalizado)
    );
  }, [alunosProcessados]);

  // Alunos filtrados pelo status selecionado
  const alunosFiltrados = useMemo(() => {
    if (statusFilter === 'ATIVOS') {
      return alunosAtivos;
    } else if (statusFilter === 'TODOS') {
      return alunosProcessados;
    } else {
      return alunosProcessados.filter(item => item.status_normalizado === statusFilter);
    }
  }, [alunosProcessados, alunosAtivos, statusFilter]);

  // KPIs principais
  const kpis = useMemo(() => {
    // Total de alunos ativos (ATIVO + INADIMPLENTE)
    const totalAtivos = alunosAtivos.length;

    // Total de bolsistas ativos (STATUS = ATIVO apenas, não INADIMPLENTE)
    const totalBolsistas = alunosProcessados.filter(item =>
      item.tipo_normalizado === 'BOLSISTA' && item.status_normalizado === 'ATIVO'
    ).length;

    // Renovações próximas (próximos 3 meses)
    const hoje = new Date();
    const tresMesesDepois = new Date();
    tresMesesDepois.setMonth(tresMesesDepois.getMonth() + 3);

    const renovacoesProximas = alunosAtivos.filter(item => {
      if (!item.data_fim_parsed) return false;
      return item.data_fim_parsed >= hoje && item.data_fim_parsed <= tresMesesDepois;
    });

    return {
      totalAtivos,
      totalBolsistas,
      renovacoesProximas: renovacoesProximas.length,
      totalRegistros: data.length,
    };
  }, [alunosProcessados, alunosAtivos, data.length]);

  // Alunos ativos por produto
  const ativosPorProduto = useMemo(() => {
    const grupos: Record<string, number> = {};

    // Inicializa com produtos da lista oficial
    PRODUTOS_LISTA.forEach(produto => {
      grupos[produto] = 0;
    });

    alunosAtivos.forEach(item => {
      const produto = item.produto_normalizado;
      // Só conta se o produto está na lista oficial ou se existe na planilha
      if (PRODUTOS_LISTA.includes(produto)) {
        grupos[produto] += 1;
      } else if (produto) {
        // Se não está na lista mas existe, adiciona (sem criar "Outros")
        grupos[produto] = (grupos[produto] || 0) + 1;
      }
    });

    return Object.entries(grupos)
      .filter(([, count]) => count > 0)
      .map(([produto, quantidade]) => ({ produto, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [alunosAtivos]);

  // Distribuição por tipo (B2B, B2B2C, B2C, BOLSISTA)
  const distribuicaoPorTipo = useMemo(() => {
    const tipos: Record<string, number> = {};
    const total = alunosFiltrados.length;

    alunosFiltrados.forEach(item => {
      const tipo = item.tipo_normalizado || 'Não informado';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    // Ordem definida para os tipos
    const ordemTipos = ['B2B', 'B2B2C', 'B2C', 'BOLSISTA', 'Não informado'];

    return ordemTipos
      .filter(tipo => tipos[tipo] && tipos[tipo] > 0)
      .map(name => ({
        name,
        value: tipos[name],
        percentual: total > 0 ? ((tipos[name] / total) * 100).toFixed(1) : '0',
      }));
  }, [alunosFiltrados]);

  // Distribuição por nível
  const distribuicaoNivel = useMemo(() => {
    const niveis: Record<string, number> = {};

    alunosFiltrados.forEach(item => {
      const nivel = String(item.nivel || 'Não informado').trim();
      niveis[nivel] = (niveis[nivel] || 0) + 1;
    });

    return Object.entries(niveis).map(([name, value]) => ({ name, value }));
  }, [alunosFiltrados]);

  // Distribuição por status
  const distribuicaoStatus = useMemo(() => {
    const status: Record<string, number> = {};

    alunosProcessados.forEach(item => {
      const s = item.status_normalizado || 'Não informado';
      status[s] = (status[s] || 0) + 1;
    });

    return Object.entries(status).map(([name, value]) => ({ name, value }));
  }, [alunosProcessados]);

  // Renovações próximas (detalhes)
  const listaRenovacoesProximas = useMemo(() => {
    const hoje = new Date();
    const tresMesesDepois = new Date();
    tresMesesDepois.setMonth(tresMesesDepois.getMonth() + 3);

    return alunosAtivos
      .filter(item => {
        if (!item.data_fim_parsed) return false;
        return item.data_fim_parsed >= hoje && item.data_fim_parsed <= tresMesesDepois;
      })
      .sort((a, b) => {
        if (!a.data_fim_parsed || !b.data_fim_parsed) return 0;
        return a.data_fim_parsed.getTime() - b.data_fim_parsed.getTime();
      })
      .slice(0, 20);
  }, [alunosAtivos]);

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
        title="Alunos Ativos"
        description="Base de alunos por status, tipo e produto"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#06B6D4"
      >
        <div className="space-y-8">
          {/* Mensagem se não houver dados */}
          {!loading && data.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum dado encontrado na planilha.
              </p>
            </div>
          )}

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Alunos Ativos"
              value={kpis.totalAtivos}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#06B6D4"
              subtitle="Status: ATIVO + INADIMPLENTE"
              loading={loading}
            />
            <KPICard
              title="Total de Bolsistas"
              value={kpis.totalBolsistas}
              format="number"
              icon={<Award className="w-6 h-6" />}
              color="#8B5CF6"
              subtitle="Tipo: BOLSISTA e Status: ATIVO"
              loading={loading}
            />
            <KPICard
              title="Renovacoes Proximas"
              value={kpis.renovacoesProximas}
              format="number"
              icon={<Clock className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Proximos 3 meses"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={kpis.totalRegistros}
              format="number"
              icon={<GraduationCap className="w-6 h-6" />}
              color="#6B7280"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Alunos Ativos por Produto */}
          {ativosPorProduto.length > 0 && (
            <ModuleSection
              title="Total de Alunos Ativos por Produto"
              subtitle={`${kpis.totalAtivos} alunos em ${ativosPorProduto.length} produtos`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cyan-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ativosPorProduto.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.produto}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-cyan-800 bg-cyan-100 rounded-full">
                              {item.quantidade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-cyan-500"
                                  style={{ width: `${kpis.totalAtivos > 0 ? (item.quantidade / kpis.totalAtivos) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">
                                {kpis.totalAtivos > 0 ? ((item.quantidade / kpis.totalAtivos) * 100).toFixed(1) : 0}%
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
                          {kpis.totalAtivos}
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

          {/* Filtro de Status */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2 py-2">Filtrar por Status:</span>
            <button
              onClick={() => setStatusFilter('ATIVOS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'ATIVOS'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ativos ({alunosAtivos.length})
            </button>
            {STATUS_TODOS.map(status => {
              const count = alunosProcessados.filter(a => a.status_normalizado === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
            <button
              onClick={() => setStatusFilter('TODOS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'TODOS'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({alunosProcessados.length})
            </button>
          </div>

          {/* Graficos de distribuicao */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ativosPorProduto.length > 0 && (
              <ChartCard
                title="Alunos por Produto"
                subtitle="Top produtos"
              >
                <BarChartComponent
                  data={ativosPorProduto.slice(0, 7)}
                  xKey="produto"
                  yKey="quantidade"
                  color="#06B6D4"
                  horizontal
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}

            {distribuicaoPorTipo.length > 0 && (
              <ChartCard
                title="Distribuicao por Tipo"
                subtitle={`${alunosFiltrados.length} alunos - ${statusFilter === 'ATIVOS' ? 'Ativos' : statusFilter}`}
              >
                <div className="space-y-3 py-2">
                  {distribuicaoPorTipo.map((item, index) => {
                    const colors: Record<string, string> = {
                      'B2B': '#8B5CF6',
                      'B2B2C': '#F59E0B',
                      'B2C': '#3B82F6',
                      'BOLSISTA': '#10B981',
                      'Não informado': '#6B7280',
                    };
                    const color = colors[item.name] || '#6B7280';
                    const maxValue = Math.max(...distribuicaoPorTipo.map(d => d.value));
                    const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">{item.value}</span>
                            <span className="text-gray-500 w-14 text-right">({item.percentual}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-6">
                          <div
                            className="h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${barWidth}%`, backgroundColor: color, minWidth: item.value > 0 ? '40px' : '0' }}
                          >
                            {barWidth > 20 && (
                              <span className="text-xs font-semibold text-white">{item.percentual}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Total */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900">TOTAL</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-cyan-600 text-lg">{alunosFiltrados.length}</span>
                      <span className="text-gray-500 w-14 text-right">(100%)</span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            )}

            {distribuicaoNivel.length > 0 && (
              <ChartCard
                title="Distribuicao por Nivel"
                subtitle="Quantidade por nivel"
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

          {/* Distribuicao por Status */}
          {distribuicaoStatus.length > 0 && (
            <ChartCard
              title="Distribuicao por Status"
              subtitle="Todos os alunos"
            >
              <BarChartComponent
                data={distribuicaoStatus}
                xKey="name"
                yKey="value"
                color="#06B6D4"
                height={250}
                loading={loading}
              />
            </ChartCard>
          )}

          {/* Renovacoes Proximas */}
          {listaRenovacoesProximas.length > 0 && (
            <ModuleSection
              title="Renovacoes Proximas"
              subtitle={`${kpis.renovacoesProximas} matriculas vencem nos proximos 3 meses`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Nivel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Inicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Fim
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listaRenovacoesProximas.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {String(item.aluno_nome || item.aluno_id || '-')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.produto_normalizado || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.tipo_normalizado === 'BOLSISTA' ? 'bg-purple-100 text-purple-800' :
                              item.tipo_normalizado === 'B2B' ? 'bg-blue-100 text-blue-800' :
                              item.tipo_normalizado === 'B2B2C' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.tipo_normalizado || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {String(item.nivel || '-')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.data_inicio_parsed ? item.data_inicio_parsed.toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-amber-600">
                            {item.data_fim_parsed ? item.data_fim_parsed.toLocaleDateString('pt-BR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Tabela completa de alunos filtrados */}
          {alunosFiltrados.length > 0 && (
            <ModuleSection
              title={`Lista de Alunos - ${statusFilter === 'ATIVOS' ? 'Ativos' : statusFilter}`}
              subtitle={`${alunosFiltrados.length} alunos`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Aluno
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Produto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Nivel
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Inicio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Fim
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alunosFiltrados.slice(0, 50).map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {String(item.aluno_nome || item.aluno_id || '-')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.produto_normalizado || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.tipo_normalizado === 'BOLSISTA' ? 'bg-purple-100 text-purple-800' :
                              item.tipo_normalizado === 'B2B' ? 'bg-blue-100 text-blue-800' :
                              item.tipo_normalizado === 'B2B2C' ? 'bg-green-100 text-green-800' :
                              item.tipo_normalizado === 'B2C' ? 'bg-cyan-100 text-cyan-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.tipo_normalizado || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {String(item.nivel || '-')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.data_inicio_parsed ? item.data_inicio_parsed.toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.data_fim_parsed ? item.data_fim_parsed.toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status_normalizado === 'ATIVO' ? 'bg-green-100 text-green-800' :
                              item.status_normalizado === 'INADIMPLENTE' ? 'bg-amber-100 text-amber-800' :
                              item.status_normalizado === 'ON HOLD' ? 'bg-blue-100 text-blue-800' :
                              item.status_normalizado === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                              item.status_normalizado === 'INATIVO' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status_normalizado || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {alunosFiltrados.length > 50 && (
                    <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                      Mostrando 50 de {alunosFiltrados.length} registros
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
