'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Megaphone, DollarSign, Users, Target, TrendingUp, TrendingDown } from 'lucide-react';

// Dados de demonstração
const demoData = {
  investimentoTotal: 85000,
  investimentoAnterior: 78000,
  cplMedio: 45,
  cplAnterior: 52,
  cacMedio: 180,
  cacAnterior: 210,
  leadsGerados: 1889,
  leadsAnterior: 1500,
  matriculasMarketing: 127,
  matriculasAnterior: 98,
  e2e: 6.7, // Lead to Revenue ratio
  e2eAnterior: 5.8,
};

const investimentoPorPlataforma = [
  { plataforma: 'Google Ads', investimento: 45000, leads: 920, cpl: 49, cac: 195, matriculas: 58 },
  { plataforma: 'Meta Ads', investimento: 32000, leads: 780, cpl: 41, cac: 165, matriculas: 52 },
  { plataforma: 'LinkedIn', investimento: 5000, leads: 120, cpl: 42, cac: 250, matriculas: 10 },
  { plataforma: 'TikTok', investimento: 3000, leads: 69, cpl: 43, cac: 188, matriculas: 7 },
];

const evolucaoInvestimento = [
  { mes: 'Jul', google: 38000, meta: 28000, outros: 6000, leads: 1420 },
  { mes: 'Ago', google: 42000, meta: 30000, outros: 7000, leads: 1580 },
  { mes: 'Set', google: 40000, meta: 28000, outros: 6500, leads: 1490 },
  { mes: 'Out', google: 44000, meta: 32000, outros: 7500, leads: 1720 },
  { mes: 'Nov', google: 42000, meta: 30000, outros: 6000, leads: 1500 },
  { mes: 'Dez', google: 45000, meta: 32000, outros: 8000, leads: 1889 },
];

const distribuicaoInvestimento = [
  { name: 'Google Ads', value: 53 },
  { name: 'Meta Ads', value: 38 },
  { name: 'LinkedIn', value: 6 },
  { name: 'TikTok', value: 3 },
];

const funilConversao = [
  { etapa: 'Impressões', valor: 2850000 },
  { etapa: 'Cliques', valor: 42750 },
  { etapa: 'Leads', valor: 1889 },
  { etapa: 'Qualificados', valor: 567 },
  { etapa: 'Matrículas', valor: 127 },
];

const campanhasTop = [
  { nome: 'Curso Inglês Online - Remarketing', plataforma: 'Google', leads: 245, cac: 125, roas: 4.2 },
  { nome: 'Promoção Janeiro - Lookalike', plataforma: 'Meta', leads: 198, cac: 145, roas: 3.8 },
  { nome: 'Brand Awareness - Video', plataforma: 'Meta', leads: 156, cac: 168, roas: 3.2 },
  { nome: 'Search Branded', plataforma: 'Google', leads: 132, cac: 95, roas: 5.1 },
  { nome: 'Espanhol Empresas', plataforma: 'LinkedIn', leads: 45, cac: 220, roas: 2.8 },
];

export default function MarketingPage() {
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
        title="Marketing"
        description="Investimentos, CPL, CAC e performance de campanhas"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
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
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Investimento Total"
              value={demoData.investimentoTotal}
              previousValue={demoData.investimentoAnterior}
              format="currencyCompact"
              icon={<DollarSign className="w-5 h-5" />}
              color="#EC4899"
              loading={loading}
            />
            <KPICard
              title="Leads Gerados"
              value={demoData.leadsGerados}
              previousValue={demoData.leadsAnterior}
              format="number"
              icon={<Users className="w-5 h-5" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="CPL Médio"
              value={demoData.cplMedio}
              previousValue={demoData.cplAnterior}
              format="currency"
              trend="down"
              icon={<TrendingDown className="w-5 h-5" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="CAC Médio"
              value={demoData.cacMedio}
              previousValue={demoData.cacAnterior}
              format="currency"
              trend="down"
              icon={<Target className="w-5 h-5" />}
              color="#F59E0B"
              loading={loading}
            />
            <KPICard
              title="Matrículas"
              value={demoData.matriculasMarketing}
              previousValue={demoData.matriculasAnterior}
              format="number"
              icon={<TrendingUp className="w-5 h-5" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="E2E (Lead→Receita)"
              value={demoData.e2e}
              previousValue={demoData.e2eAnterior}
              format="percentage"
              icon={<Megaphone className="w-5 h-5" />}
              color="#06B6D4"
              loading={loading}
            />
          </div>

          {/* Métricas por Plataforma */}
          <ModuleSection
            title="Performance por Plataforma"
            subtitle="Investimento, CPL e CAC"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {investimentoPorPlataforma.map((plat) => {
                const bgColor = plat.plataforma === 'Google Ads' ? '#4285F4' :
                               plat.plataforma === 'Meta Ads' ? '#1877F2' :
                               plat.plataforma === 'LinkedIn' ? '#0A66C2' : '#000000';

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

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução do Investimento"
              subtitle="Por plataforma ao longo do tempo"
            >
              <LineChart
                data={evolucaoInvestimento}
                xKey="mes"
                yKey="google"
                yKey2="meta"
                color="#4285F4"
                color2="#1877F2"
                formatY="currency"
                height={280}
                loading={loading}
              />
            </ChartCard>

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
          </div>

          {/* Funil de conversão */}
          <ModuleSection
            title="Funil de Conversão"
            subtitle="Jornada do lead até matrícula"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-end justify-between gap-4">
                {funilConversao.map((etapa, index) => {
                  const maxValor = funilConversao[0].valor;
                  const altura = (etapa.valor / maxValor) * 200;
                  const taxaConversao = index > 0
                    ? ((etapa.valor / funilConversao[index - 1].valor) * 100).toFixed(1)
                    : null;

                  return (
                    <div key={etapa.etapa} className="flex-1 text-center">
                      <div className="relative">
                        {taxaConversao && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500">
                            ↓ {taxaConversao}%
                          </div>
                        )}
                        <div
                          className="mx-auto rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${altura}px`,
                            width: '80%',
                            background: `linear-gradient(180deg, #EC4899 0%, #BE185D 100%)`,
                            opacity: 1 - (index * 0.15)
                          }}
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold text-gray-900">
                          {etapa.valor >= 1000000
                            ? `${(etapa.valor / 1000000).toFixed(1)}M`
                            : etapa.valor >= 1000
                            ? `${(etapa.valor / 1000).toFixed(0)}K`
                            : etapa.valor}
                        </p>
                        <p className="text-sm text-gray-500">{etapa.etapa}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ModuleSection>

          {/* Top Campanhas */}
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
                      CAC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROAS
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
                          campanha.plataforma === 'Google'
                            ? 'bg-blue-100 text-blue-800'
                            : campanha.plataforma === 'Meta'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {campanha.plataforma}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campanha.leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        R$ {campanha.cac}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            campanha.roas >= 4 ? 'text-green-600' :
                            campanha.roas >= 3 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {campanha.roas}x
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                campanha.roas >= 4 ? 'bg-green-500' :
                                campanha.roas >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(campanha.roas * 20, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleSection>
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
