'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Building2, FileText, DollarSign, Target, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface ContratoB2B {
  data_contrato: Date | string;
  empresa: string;
  valor_contrato: number;
  valor_mensal?: number;
  colaboradores?: number;
  setor?: string;
  estagio?: string;
  status?: string;
  [key: string]: unknown;
}

export default function VendasB2BPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<ContratoB2B>('vendas_b2b');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data_contrato) return true;

      let itemDate: Date;
      if (item.data_contrato instanceof Date) {
        itemDate = item.data_contrato;
      } else if (typeof item.data_contrato === 'string') {
        const parts = item.data_contrato.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data_contrato);
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
        contratosFechados: 0,
        receitaContratada: 0,
        pipelineAtivo: 0,
        forecast: 0,
      };
    }

    const fechados = filteredData.filter(item =>
      String(item.status || '').toLowerCase().includes('fechado') ||
      String(item.status || '').toLowerCase().includes('ativo')
    );

    const contratosFechados = fechados.length;
    const receitaContratada = fechados.reduce((sum, item) => {
      const valor = typeof item.valor_contrato === 'number' ? item.valor_contrato : 0;
      return sum + valor;
    }, 0);

    const emNegociacao = filteredData.filter(item =>
      !String(item.status || '').toLowerCase().includes('fechado') &&
      !String(item.status || '').toLowerCase().includes('perdido')
    );

    const pipelineAtivo = emNegociacao.reduce((sum, item) => {
      const valor = typeof item.valor_contrato === 'number' ? item.valor_contrato : 0;
      return sum + valor;
    }, 0);

    const forecast = pipelineAtivo * 0.5; // Estimativa 50% do pipeline

    return {
      contratosFechados,
      receitaContratada,
      pipelineAtivo,
      forecast,
    };
  }, [filteredData]);

  // Pipeline por estágio
  const pipeline = useMemo(() => {
    const estagios: Record<string, { valor: number; deals: number }> = {
      'Prospecção': { valor: 0, deals: 0 },
      'Qualificação': { valor: 0, deals: 0 },
      'Proposta': { valor: 0, deals: 0 },
      'Negociação': { valor: 0, deals: 0 },
    };

    filteredData.forEach(item => {
      const estagio = String(item.estagio || 'Prospecção');
      const estagioKey = Object.keys(estagios).find(k =>
        estagio.toLowerCase().includes(k.toLowerCase())
      ) || 'Prospecção';

      estagios[estagioKey].deals += 1;
      estagios[estagioKey].valor += typeof item.valor_contrato === 'number' ? item.valor_contrato : 0;
    });

    return Object.entries(estagios).map(([estagio, dados]) => ({
      estagio,
      ...dados
    }));
  }, [filteredData]);

  // Contratos por setor
  const contratosPorSetor = useMemo(() => {
    const setores: Record<string, number> = {};

    filteredData.forEach(item => {
      const setor = String(item.setor || 'Outros');
      setores[setor] = (setores[setor] || 0) + 1;
    });

    const total = Object.values(setores).reduce((sum, val) => sum + val, 0);

    return Object.entries(setores).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredData]);

  // Top empresas
  const topEmpresas = useMemo(() => {
    return filteredData
      .map(item => ({
        empresa: String(item.empresa || 'N/A'),
        colaboradores: typeof item.colaboradores === 'number' ? item.colaboradores : 0,
        valorMensal: typeof item.valor_mensal === 'number' ? item.valor_mensal :
                     (typeof item.valor_contrato === 'number' ? item.valor_contrato / 12 : 0),
        status: String(item.status || 'Em análise')
      }))
      .sort((a, b) => b.valorMensal - a.valorMensal)
      .slice(0, 5);
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
        title="Vendas B2B"
        description="Contratos corporativos e pipeline empresarial"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#3B82F6"
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
              title="Contratos Fechados"
              value={kpis.contratosFechados}
              format="number"
              icon={<FileText className="w-6 h-6" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="Receita Contratada"
              value={kpis.receitaContratada}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Pipeline Ativo"
              value={kpis.pipelineAtivo}
              format="currencyCompact"
              icon={<Target className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={data.length}
              format="number"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Pipeline de vendas */}
          {pipeline.some(p => p.deals > 0) && (
            <ModuleSection
              title="Pipeline de Vendas"
              subtitle="Funil por estágio"
            >
              <div className="grid grid-cols-4 gap-4">
                {pipeline.map((estagio, index) => (
                  <div
                    key={estagio.estagio}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 h-1 w-full"
                      style={{
                        backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'][index]
                      }}
                    />
                    <p className="text-sm font-medium text-gray-500">{estagio.estagio}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      R$ {(estagio.valor / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {estagio.deals} negociações
                    </p>
                  </div>
                ))}
              </div>
            </ModuleSection>
          )}

          {/* Gráficos */}
          {contratosPorSetor.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Pipeline por Estágio"
                subtitle="Valor em cada fase"
              >
                <BarChartComponent
                  data={pipeline}
                  xKey="estagio"
                  yKey="valor"
                  color="#3B82F6"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>

              <ChartCard
                title="Contratos por Setor"
                subtitle="Distribuição de clientes"
              >
                <PieChartComponent
                  data={contratosPorSetor}
                  nameKey="name"
                  valueKey="value"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            </div>
          )}

          {/* Tabela de empresas */}
          {topEmpresas.length > 0 && (
            <ModuleSection
              title="Principais Negociações"
              subtitle="Top empresas no pipeline"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Colaboradores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Mensal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topEmpresas.map((empresa, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {empresa.empresa}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {empresa.colaboradores > 0 ? empresa.colaboradores.toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {empresa.valorMensal > 0 ? `R$ ${empresa.valorMensal.toLocaleString('pt-BR')}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            empresa.status.toLowerCase().includes('fechado') || empresa.status.toLowerCase().includes('ativo')
                              ? 'bg-green-100 text-green-800'
                              : empresa.status.toLowerCase().includes('negoci')
                              ? 'bg-blue-100 text-blue-800'
                              : empresa.status.toLowerCase().includes('proposta')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {empresa.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
