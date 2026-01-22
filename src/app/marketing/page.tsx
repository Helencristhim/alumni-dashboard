'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Megaphone, DollarSign, Users, Target, TrendingUp, TrendingDown, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface CampanhaMarketing {
  data: Date | string;
  plataforma?: string;
  campanha?: string;
  investimento?: number;
  leads?: number;
  matriculas?: number;
  cpl?: number;
  cac?: number;
  [key: string]: unknown;
}

export default function MarketingPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<CampanhaMarketing>('marketing');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data) return true;

      let itemDate: Date;
      if (item.data instanceof Date) {
        itemDate = item.data;
      } else if (typeof item.data === 'string') {
        const parts = item.data.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data);
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
        investimentoTotal: 0,
        leadsGerados: 0,
        matriculasMarketing: 0,
        cplMedio: 0,
        cacMedio: 0,
      };
    }

    const investimentoTotal = filteredData.reduce((sum, item) => {
      return sum + (typeof item.investimento === 'number' ? item.investimento : 0);
    }, 0);

    const leadsGerados = filteredData.reduce((sum, item) => {
      return sum + (typeof item.leads === 'number' ? item.leads : 0);
    }, 0);

    const matriculasMarketing = filteredData.reduce((sum, item) => {
      return sum + (typeof item.matriculas === 'number' ? item.matriculas : 0);
    }, 0);

    const cplMedio = leadsGerados > 0 ? investimentoTotal / leadsGerados : 0;
    const cacMedio = matriculasMarketing > 0 ? investimentoTotal / matriculasMarketing : 0;

    return {
      investimentoTotal,
      leadsGerados,
      matriculasMarketing,
      cplMedio,
      cacMedio,
    };
  }, [filteredData]);

  // Investimento por plataforma
  const investimentoPorPlataforma = useMemo(() => {
    const plataformas: Record<string, { investimento: number; leads: number; matriculas: number }> = {};

    filteredData.forEach(item => {
      const plataforma = String(item.plataforma || 'Outros');
      if (!plataformas[plataforma]) {
        plataformas[plataforma] = { investimento: 0, leads: 0, matriculas: 0 };
      }
      plataformas[plataforma].investimento += typeof item.investimento === 'number' ? item.investimento : 0;
      plataformas[plataforma].leads += typeof item.leads === 'number' ? item.leads : 0;
      plataformas[plataforma].matriculas += typeof item.matriculas === 'number' ? item.matriculas : 0;
    });

    return Object.entries(plataformas)
      .map(([plataforma, dados]) => ({
        plataforma,
        ...dados,
        cpl: dados.leads > 0 ? Math.round(dados.investimento / dados.leads) : 0,
        cac: dados.matriculas > 0 ? Math.round(dados.investimento / dados.matriculas) : 0,
      }))
      .sort((a, b) => b.investimento - a.investimento);
  }, [filteredData]);

  // Distribuição do investimento (para pie chart)
  const distribuicaoInvestimento = useMemo(() => {
    const total = investimentoPorPlataforma.reduce((sum, p) => sum + p.investimento, 0);

    return investimentoPorPlataforma.map(p => ({
      name: p.plataforma,
      value: total > 0 ? Math.round((p.investimento / total) * 100) : 0,
    }));
  }, [investimentoPorPlataforma]);

  // Top campanhas
  const campanhasTop = useMemo(() => {
    return filteredData
      .filter(item => item.campanha)
      .map(item => ({
        nome: String(item.campanha || 'N/A'),
        plataforma: String(item.plataforma || 'N/A'),
        leads: typeof item.leads === 'number' ? item.leads : 0,
        cac: typeof item.cac === 'number' ? item.cac :
             (typeof item.investimento === 'number' && typeof item.matriculas === 'number' && item.matriculas > 0
               ? Math.round(item.investimento / item.matriculas) : 0),
        investimento: typeof item.investimento === 'number' ? item.investimento : 0,
      }))
      .sort((a, b) => b.leads - a.leads)
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
        title="Marketing"
        description="Investimentos, CPL, CAC e performance de campanhas"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
        loading={loading}
        color="#EC4899"
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              title="Investimento Total"
              value={kpis.investimentoTotal}
              format="currencyCompact"
              icon={<DollarSign className="w-5 h-5" />}
              color="#EC4899"
              loading={loading}
            />
            <KPICard
              title="Leads Gerados"
              value={kpis.leadsGerados}
              format="number"
              icon={<Users className="w-5 h-5" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="CPL Médio"
              value={kpis.cplMedio}
              format="currency"
              icon={<TrendingDown className="w-5 h-5" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="CAC Médio"
              value={kpis.cacMedio}
              format="currency"
              icon={<Target className="w-5 h-5" />}
              color="#F59E0B"
              loading={loading}
            />
            <KPICard
              title="Matrículas"
              value={kpis.matriculasMarketing}
              format="number"
              icon={<TrendingUp className="w-5 h-5" />}
              color="#8B5CF6"
              loading={loading}
            />
          </div>

          {/* Métricas por Plataforma */}
          {investimentoPorPlataforma.length > 0 && (
            <ModuleSection
              title="Performance por Plataforma"
              subtitle="Investimento, CPL e CAC"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {investimentoPorPlataforma.slice(0, 4).map((plat) => {
                  const bgColor = plat.plataforma.toLowerCase().includes('google') ? '#4285F4' :
                                 plat.plataforma.toLowerCase().includes('meta') || plat.plataforma.toLowerCase().includes('facebook') ? '#1877F2' :
                                 plat.plataforma.toLowerCase().includes('linkedin') ? '#0A66C2' :
                                 plat.plataforma.toLowerCase().includes('tiktok') ? '#000000' : '#6B7280';

                  return (
                    <div
                      key={plat.plataforma}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 h-1 w-full"
                        style={{ backgroundColor: bgColor }}
                      />
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: bgColor }}
                        >
                          {plat.plataforma.charAt(0)}
                        </div>
                        <h4 className="font-semibold text-gray-900">{plat.plataforma}</h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Investimento</span>
                          <span className="text-sm font-medium text-gray-900">
                            R$ {(plat.investimento / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Leads</span>
                          <span className="text-sm font-medium text-gray-900">{plat.leads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">CPL</span>
                          <span className="text-sm font-medium text-green-600">R$ {plat.cpl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">CAC</span>
                          <span className="text-sm font-medium text-orange-600">R$ {plat.cac}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Matrículas</span>
                          <span className="text-sm font-medium text-blue-600">{plat.matriculas}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ModuleSection>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {investimentoPorPlataforma.length > 0 && (
              <ChartCard
                title="Investimento por Plataforma"
                subtitle="Comparativo de gastos"
              >
                <BarChartComponent
                  data={investimentoPorPlataforma}
                  xKey="plataforma"
                  yKey="investimento"
                  color="#EC4899"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}

            {distribuicaoInvestimento.length > 0 && (
              <ChartCard
                title="Distribuição do Investimento"
                subtitle="Por plataforma"
              >
                <PieChartComponent
                  data={distribuicaoInvestimento}
                  nameKey="name"
                  valueKey="value"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Top Campanhas */}
          {campanhasTop.length > 0 && (
            <ModuleSection
              title="Top Campanhas"
              subtitle="Melhores performances do período"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campanha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plataforma
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CAC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campanhasTop.map((campanha, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campanha.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            campanha.plataforma.toLowerCase().includes('google')
                              ? 'bg-blue-100 text-blue-800'
                              : campanha.plataforma.toLowerCase().includes('meta') || campanha.plataforma.toLowerCase().includes('facebook')
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campanha.plataforma}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campanha.leads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {campanha.investimento.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {campanha.cac > 0 ? `R$ ${campanha.cac}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
