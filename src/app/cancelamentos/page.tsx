'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard, KPICardCompact } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { UserX, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

// Dados de demonstração
const demoData = {
  taxaChurn: 3.2,
  churnAnterior: 4.1,
  totalCancelamentos: 58,
  cancelamentosAnterior: 72,
  tempoMedioEfetivacao: 5,
  tempoAnterior: 7,
  receitaPerdida: 87000,
  receitaAnterior: 108000,
};

const cancelamentosPorCurso = [
  { curso: 'Particular presencial – inglês', cancelamentos: 12, percentual: 2.8 },
  { curso: 'Particular online – inglês', cancelamentos: 15, percentual: 3.9 },
  { curso: 'Particular online – espanhol', cancelamentos: 5, percentual: 4.2 },
  { curso: 'Conexion – espanhol', cancelamentos: 8, percentual: 3.6 },
  { curso: 'Community – inglês', cancelamentos: 10, percentual: 2.9 },
  { curso: 'Community Flow – inglês', cancelamentos: 6, percentual: 2.1 },
  { curso: 'Imersão – inglês', cancelamentos: 2, percentual: 2.6 },
];

const evolucaoChurn = [
  { mes: 'Jul', churn: 4.8, cancelamentos: 85 },
  { mes: 'Ago', churn: 4.2, cancelamentos: 74 },
  { mes: 'Set', churn: 4.5, cancelamentos: 79 },
  { mes: 'Out', churn: 3.8, cancelamentos: 67 },
  { mes: 'Nov', churn: 4.1, cancelamentos: 72 },
  { mes: 'Dez', churn: 3.2, cancelamentos: 58 },
];

const motivosCancelamento = [
  { name: 'Financeiro', value: 35 },
  { name: 'Falta de tempo', value: 25 },
  { name: 'Mudança de cidade', value: 15 },
  { name: 'Insatisfação', value: 12 },
  { name: 'Concluiu objetivo', value: 8 },
  { name: 'Outros', value: 5 },
];

const top3MotivosPorCurso = [
  {
    curso: 'Particular presencial',
    motivos: ['Financeiro (40%)', 'Falta de tempo (30%)', 'Mudança cidade (15%)']
  },
  {
    curso: 'Particular online inglês',
    motivos: ['Falta de tempo (35%)', 'Financeiro (30%)', 'Insatisfação (20%)']
  },
  {
    curso: 'Community',
    motivos: ['Financeiro (45%)', 'Falta de tempo (25%)', 'Concluiu objetivo (15%)']
  },
  {
    curso: 'Conexion',
    motivos: ['Falta de tempo (38%)', 'Financeiro (32%)', 'Mudança cidade (12%)']
  },
];

export default function CancelamentosPage() {
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
        title="Cancelamentos"
        description="Churn e motivos de cancelamento por curso"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
        loading={loading}
        color="#EF4444"
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
              title="Taxa de Churn"
              value={demoData.taxaChurn}
              previousValue={demoData.churnAnterior}
              format="percentage"
              trend="down"
              icon={<TrendingDown className="w-6 h-6" />}
              color="#10B981"
              subtitle="Redução é positivo"
              loading={loading}
            />
            <KPICard
              title="Total Cancelamentos"
              value={demoData.totalCancelamentos}
              previousValue={demoData.cancelamentosAnterior}
              format="number"
              trend="down"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
              loading={loading}
            />
            <KPICard
              title="Tempo Médio Efetivação"
              value={`${demoData.tempoMedioEfetivacao} dias`}
              previousValue={demoData.tempoAnterior}
              trend="down"
              trendValue={28.6}
              icon={<Clock className="w-6 h-6" />}
              color="#F59E0B"
              loading={loading}
            />
            <KPICard
              title="Receita Perdida"
              value={demoData.receitaPerdida}
              previousValue={demoData.receitaAnterior}
              format="currencyCompact"
              trend="down"
              icon={<AlertTriangle className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
          </div>

          {/* Cancelamentos por Curso */}
          <ModuleSection
            title="Cancelamentos por Curso"
            subtitle="Quantidade e taxa por produto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {cancelamentosPorCurso.map((curso) => (
                <div
                  key={curso.curso}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <p className="text-xs text-gray-500 font-medium truncate" title={curso.curso}>
                    {curso.curso.split(' – ')[0]}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{curso.cancelamentos}</p>
                  <p className="text-sm text-red-500 font-medium">{curso.percentual}% churn</p>
                </div>
              ))}
            </div>
          </ModuleSection>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Evolução do Churn"
              subtitle="Taxa mensal (%)"
            >
              <LineChart
                data={evolucaoChurn}
                xKey="mes"
                yKey="churn"
                color="#EF4444"
                formatY="percentage"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Motivos de Cancelamento"
              subtitle="Distribuição geral"
            >
              <PieChartComponent
                data={motivosCancelamento}
                nameKey="name"
                valueKey="value"
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Top 3 motivos por curso */}
          <ModuleSection
            title="Top 3 Motivos por Curso"
            subtitle="Principais razões de cancelamento"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {top3MotivosPorCurso.map((item) => (
                <div
                  key={item.curso}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">{item.curso}</h4>
                  <ol className="space-y-2">
                    {item.motivos.map((motivo, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-600">{motivo}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </ModuleSection>

          {/* Gráfico de barras dos cancelamentos */}
          <ChartCard
            title="Cancelamentos por Curso"
            subtitle="Quantidade absoluta"
          >
            <BarChartComponent
              data={cancelamentosPorCurso}
              xKey="curso"
              yKey="cancelamentos"
              color="#EF4444"
              horizontal
              height={300}
              loading={loading}
            />
          </ChartCard>
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
