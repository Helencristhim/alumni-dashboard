'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard, KPICardCompact } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { DollarSign, Users, ShoppingCart, CreditCard, TrendingUp } from 'lucide-react';

// Dados de demonstração - em produção virão da planilha
const demoData = {
  faturamentoMensal: 1850000,
  faturamentoAnterior: 1650000,
  novasMatriculas: 127,
  matriculasAnterior: 98,
  ticketMedio: 14566,
  ticketAnterior: 16836,
  taxaConversao: 18.5,
  conversaoAnterior: 15.2,
};

const matriculasPorProduto = [
  { produto: 'Particular presencial – inglês', matriculas: 35, faturamento: 525000 },
  { produto: 'Particular online – inglês', matriculas: 28, faturamento: 392000 },
  { produto: 'Particular online – espanhol', matriculas: 12, faturamento: 144000 },
  { produto: 'Conexion – espanhol', matriculas: 18, faturamento: 180000 },
  { produto: 'Community – inglês', matriculas: 22, faturamento: 176000 },
  { produto: 'Community Flow – inglês', matriculas: 8, faturamento: 96000 },
  { produto: 'Imersão – inglês', matriculas: 4, faturamento: 337000 },
];

const evolucaoMensal = [
  { mes: 'Jul', faturamento: 1420000, matriculas: 89 },
  { mes: 'Ago', faturamento: 1580000, matriculas: 102 },
  { mes: 'Set', faturamento: 1490000, matriculas: 95 },
  { mes: 'Out', faturamento: 1720000, matriculas: 115 },
  { mes: 'Nov', faturamento: 1650000, matriculas: 98 },
  { mes: 'Dez', faturamento: 1850000, matriculas: 127 },
];

const distribuicaoPagamento = [
  { name: 'Cartão de Crédito', value: 45 },
  { name: 'PIX', value: 35 },
  { name: 'Boleto', value: 15 },
  { name: 'Outros', value: 5 },
];

const vendasPorVendedor = [
  { vendedor: 'Ana Silva', vendas: 28, valor: 420000 },
  { vendedor: 'Carlos Santos', vendas: 24, valor: 360000 },
  { vendedor: 'Maria Oliveira', vendas: 22, valor: 330000 },
  { vendedor: 'Pedro Costa', vendas: 20, valor: 300000 },
  { vendedor: 'Julia Lima', vendas: 18, valor: 270000 },
  { vendedor: 'Outros', vendas: 15, valor: 170000 },
];

export default function VendasB2CPage() {
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
    // Aqui seria feito o refetch dos dados
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simula refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Vendas B2C"
        description="Faturamento e matrículas do canal direto ao consumidor"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
        loading={loading}
        color="#10B981"
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
              title="Faturamento Mensal"
              value={demoData.faturamentoMensal}
              previousValue={demoData.faturamentoAnterior}
              format="currencyCompact"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Novas Matrículas"
              value={demoData.novasMatriculas}
              previousValue={demoData.matriculasAnterior}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#3B82F6"
              loading={loading}
            />
            <KPICard
              title="Ticket Médio"
              value={demoData.ticketMedio}
              previousValue={demoData.ticketAnterior}
              format="currency"
              icon={<ShoppingCart className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Taxa de Conversão"
              value={demoData.taxaConversao}
              previousValue={demoData.conversaoAnterior}
              format="percentage"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#F59E0B"
              loading={loading}
            />
          </div>

          {/* Matrículas por Produto */}
          <ModuleSection
            title="Matrículas por Produto"
            subtitle="Distribuição de vendas por tipo de curso"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {matriculasPorProduto.map((produto) => (
                <KPICardCompact
                  key={produto.produto}
                  title={produto.produto.split(' – ')[0]}
                  value={produto.matriculas}
                  format="number"
                  loading={loading}
                />
              ))}
            </div>
          </ModuleSection>

          {/* Gráficos de evolução */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução do Faturamento"
              subtitle="Últimos 6 meses"
            >
              <AreaChartComponent
                data={evolucaoMensal}
                xKey="mes"
                yKey="faturamento"
                color="#10B981"
                formatY="currency"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Evolução de Matrículas"
              subtitle="Últimos 6 meses"
            >
              <BarChartComponent
                data={evolucaoMensal}
                xKey="mes"
                yKey="matriculas"
                color="#3B82F6"
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Gráficos detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title="Faturamento por Produto"
              subtitle="Distribuição de receita"
            >
              <BarChartComponent
                data={matriculasPorProduto}
                xKey="produto"
                yKey="faturamento"
                color="#10B981"
                horizontal
                formatY="currency"
                height={300}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Formas de Pagamento"
              subtitle="Distribuição percentual"
            >
              <PieChartComponent
                data={distribuicaoPagamento}
                nameKey="name"
                valueKey="value"
                height={300}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Top Vendedores"
              subtitle="Por número de vendas"
            >
              <BarChartComponent
                data={vendasPorVendedor}
                xKey="vendedor"
                yKey="vendas"
                color="#8B5CF6"
                horizontal
                height={300}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Tabela de vendas recentes */}
          <ModuleSection
            title="Vendas Recentes"
            subtitle="Últimas 10 transações"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { data: '22/01/2026', aluno: 'João Silva', produto: 'Particular presencial', valor: 'R$ 15.000', pagamento: 'Cartão', status: 'Confirmado' },
                    { data: '21/01/2026', aluno: 'Maria Santos', produto: 'Community', valor: 'R$ 8.000', pagamento: 'PIX', status: 'Confirmado' },
                    { data: '21/01/2026', aluno: 'Pedro Costa', produto: 'Particular online', valor: 'R$ 12.000', pagamento: 'Boleto', status: 'Pendente' },
                    { data: '20/01/2026', aluno: 'Ana Oliveira', produto: 'Conexion', valor: 'R$ 10.000', pagamento: 'Cartão', status: 'Confirmado' },
                    { data: '20/01/2026', aluno: 'Lucas Lima', produto: 'Imersão', valor: 'R$ 85.000', pagamento: 'Cartão', status: 'Confirmado' },
                  ].map((venda, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {venda.data}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {venda.aluno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.produto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {venda.valor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.pagamento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          venda.status === 'Confirmado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venda.status}
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
