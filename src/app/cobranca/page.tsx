'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Receipt, TrendingDown, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

// Dados de demonstração
const demoData = {
  inadimplenciaPercentual: 4.5,
  inadimplenciaAnterior: 5.8,
  inadimplenciaValor: 185000,
  valorAnterior: 232000,
  valorRecuperado: 78000,
  recuperadoAnterior: 52000,
  titulosVencer: 15,
  titulosAtrasados: 42,
};

const evolucaoInadimplencia = [
  { mes: 'Jul', inadimplencia: 6.2, recuperado: 45000 },
  { mes: 'Ago', inadimplencia: 5.8, recuperado: 52000 },
  { mes: 'Set', inadimplencia: 5.5, recuperado: 58000 },
  { mes: 'Out', inadimplencia: 5.1, recuperado: 65000 },
  { mes: 'Nov', inadimplencia: 5.8, recuperado: 52000 },
  { mes: 'Dez', inadimplencia: 4.5, recuperado: 78000 },
];

const inadimplenciaPorFaixa = [
  { faixa: '1-15 dias', valor: 45000, quantidade: 18, cor: '#F59E0B' },
  { faixa: '16-30 dias', valor: 52000, quantidade: 12, cor: '#F97316' },
  { faixa: '31-60 dias', valor: 48000, quantidade: 8, cor: '#EF4444' },
  { faixa: '61-90 dias', valor: 25000, quantidade: 3, cor: '#DC2626' },
  { faixa: '+90 dias', valor: 15000, quantidade: 1, cor: '#991B1B' },
];

const recuperacaoPorAcao = [
  { acao: 'WhatsApp automático', recuperado: 28000, sucesso: 65 },
  { acao: 'Ligação cobrança', recuperado: 22000, sucesso: 45 },
  { acao: 'E-mail lembrete', recuperado: 15000, sucesso: 35 },
  { acao: 'Negociação especial', recuperado: 8000, sucesso: 80 },
  { acao: 'Cobrança externa', recuperado: 5000, sucesso: 25 },
];

const titulosRecentes = [
  { aluno: 'Carlos Mendes', curso: 'Particular presencial', valor: 1500, diasAtraso: 5, status: 'Em cobrança' },
  { aluno: 'Ana Beatriz', curso: 'Community', valor: 800, diasAtraso: 12, status: 'Em cobrança' },
  { aluno: 'Pedro Santos', curso: 'Conexion', valor: 1000, diasAtraso: 22, status: 'Negociando' },
  { aluno: 'Maria Silva', curso: 'Particular online', valor: 1200, diasAtraso: 35, status: 'Crítico' },
  { aluno: 'João Costa', curso: 'Community Flow', valor: 1200, diasAtraso: 8, status: 'Em cobrança' },
];

export default function CobrancaPage() {
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
        title="Cobrança"
        description="Inadimplência e recuperação de valores"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
        loading={loading}
        color="#F59E0B"
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
              title="Inadimplência (%)"
              value={demoData.inadimplenciaPercentual}
              previousValue={demoData.inadimplenciaAnterior}
              format="percentage"
              trend="down"
              icon={<TrendingDown className="w-6 h-6" />}
              color="#10B981"
              subtitle="Redução é positivo"
              loading={loading}
            />
            <KPICard
              title="Inadimplência (R$)"
              value={demoData.inadimplenciaValor}
              previousValue={demoData.valorAnterior}
              format="currencyCompact"
              trend="down"
              icon={<AlertCircle className="w-6 h-6" />}
              color="#EF4444"
              loading={loading}
            />
            <KPICard
              title="Valor Recuperado"
              value={demoData.valorRecuperado}
              previousValue={demoData.recuperadoAnterior}
              format="currencyCompact"
              icon={<CheckCircle className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Títulos a Vencer (5 dias)"
              value={demoData.titulosVencer}
              format="number"
              icon={<Receipt className="w-6 h-6" />}
              color="#F59E0B"
              subtitle={`${demoData.titulosAtrasados} atrasados`}
              loading={loading}
            />
          </div>

          {/* Inadimplência por faixa de atraso */}
          <ModuleSection
            title="Inadimplência por Faixa de Atraso"
            subtitle="Valor e quantidade de títulos"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {inadimplenciaPorFaixa.map((faixa) => (
                <div
                  key={faixa.faixa}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: faixa.cor }}
                  />
                  <p className="text-sm font-medium text-gray-500">{faixa.faixa}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    R$ {(faixa.valor / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-400">{faixa.quantidade} títulos</p>
                </div>
              ))}
            </div>
          </ModuleSection>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução da Inadimplência"
              subtitle="Taxa mensal (%)"
            >
              <LineChart
                data={evolucaoInadimplencia}
                xKey="mes"
                yKey="inadimplencia"
                color="#F59E0B"
                formatY="percentage"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Recuperação Mensal"
              subtitle="Valores recuperados (R$)"
            >
              <AreaChartComponent
                data={evolucaoInadimplencia}
                xKey="mes"
                yKey="recuperado"
                color="#10B981"
                formatY="currency"
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Recuperação por ação */}
          <ModuleSection
            title="Efetividade das Ações de Cobrança"
            subtitle="Valor recuperado e taxa de sucesso"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Recuperado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Sucesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efetividade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recuperacaoPorAcao.map((acao) => (
                    <tr key={acao.acao} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {acao.acao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {acao.recuperado.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {acao.sucesso}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${acao.sucesso}%`,
                              backgroundColor: acao.sucesso >= 60 ? '#10B981' : acao.sucesso >= 40 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleSection>

          {/* Títulos em atraso */}
          <ModuleSection
            title="Títulos em Atraso - Atenção Prioritária"
            subtitle="Principais casos para acompanhamento"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias Atraso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {titulosRecentes.map((titulo, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {titulo.aluno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {titulo.curso}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        R$ {titulo.valor.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          titulo.diasAtraso <= 15 ? 'text-yellow-600' :
                          titulo.diasAtraso <= 30 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {titulo.diasAtraso} dias
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          titulo.status === 'Crítico'
                            ? 'bg-red-100 text-red-800'
                            : titulo.status === 'Negociando'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {titulo.status}
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
