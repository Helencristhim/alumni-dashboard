'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Building2, FileText, DollarSign, Target, TrendingUp } from 'lucide-react';

// Dados de demonstração
const demoData = {
  contratosFechados: 8,
  contratosAnterior: 5,
  receitaContratada: 650000,
  receitaAnterior: 480000,
  pipelineAtivo: 1850000,
  pipelineAnterior: 1420000,
  forecast: 920000,
  forecastAnterior: 750000,
};

const pipeline = [
  { estagio: 'Prospecção', valor: 450000, deals: 12 },
  { estagio: 'Qualificação', valor: 380000, deals: 8 },
  { estagio: 'Proposta', valor: 520000, deals: 6 },
  { estagio: 'Negociação', valor: 500000, deals: 4 },
];

const evolucaoContratos = [
  { mes: 'Jul', contratos: 3, receita: 280000 },
  { mes: 'Ago', contratos: 5, receita: 420000 },
  { mes: 'Set', contratos: 4, receita: 350000 },
  { mes: 'Out', contratos: 6, receita: 520000 },
  { mes: 'Nov', contratos: 5, receita: 480000 },
  { mes: 'Dez', contratos: 8, receita: 650000 },
];

const contratosPorSetor = [
  { name: 'Tecnologia', value: 35 },
  { name: 'Financeiro', value: 25 },
  { name: 'Varejo', value: 20 },
  { name: 'Indústria', value: 15 },
  { name: 'Outros', value: 5 },
];

const topEmpresas = [
  { empresa: 'TechCorp Brasil', colaboradores: 850, valorMensal: 42500, status: 'Fechado' },
  { empresa: 'Banco Futuro', colaboradores: 1200, valorMensal: 60000, status: 'Negociação' },
  { empresa: 'Varejo Plus', colaboradores: 450, valorMensal: 22500, status: 'Proposta' },
  { empresa: 'Indústria ABC', colaboradores: 680, valorMensal: 34000, status: 'Fechado' },
  { empresa: 'StartupX', colaboradores: 120, valorMensal: 6000, status: 'Qualificação' },
];

export default function VendasB2BPage() {
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
        title="Vendas B2B"
        description="Contratos corporativos e pipeline empresarial"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
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
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Contratos Fechados"
              value={demoData.contratosFechados}
              previousValue={demoData.contratosAnterior}
              format="number"
              icon={<FileText className="w-6 h-6" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="Receita Contratada"
              value={demoData.receitaContratada}
              previousValue={demoData.receitaAnterior}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Pipeline Ativo"
              value={demoData.pipelineAtivo}
              previousValue={demoData.pipelineAnterior}
              format="currencyCompact"
              icon={<Target className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Forecast"
              value={demoData.forecast}
              previousValue={demoData.forecastAnterior}
              format="currencyCompact"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#F59E0B"
              loading={loading}
            />
          </div>

          {/* Pipeline de vendas */}
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

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução de Contratos"
              subtitle="Últimos 6 meses"
            >
              <LineChart
                data={evolucaoContratos}
                xKey="mes"
                yKey="receita"
                yKey2="contratos"
                color="#3B82F6"
                color2="#10B981"
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

          {/* Tabela de empresas */}
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
                        {empresa.colaboradores.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        R$ {empresa.valorMensal.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          empresa.status === 'Fechado'
                            ? 'bg-green-100 text-green-800'
                            : empresa.status === 'Negociação'
                            ? 'bg-blue-100 text-blue-800'
                            : empresa.status === 'Proposta'
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
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
