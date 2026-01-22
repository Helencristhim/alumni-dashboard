'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { HeadphonesIcon, MessageSquare, Clock, ThumbsUp, TrendingUp } from 'lucide-react';

// Dados de demonstração
const demoData = {
  nps: 72,
  npsAnterior: 68,
  csat: 4.5,
  csatAnterior: 4.2,
  volumeAtendimentos: 847,
  volumeAnterior: 920,
  tempoMedioResposta: 12,
  tempoAnterior: 18,
};

const evolucaoNPS = [
  { mes: 'Jul', nps: 65, csat: 4.1 },
  { mes: 'Ago', nps: 68, csat: 4.2 },
  { mes: 'Set', nps: 64, csat: 4.0 },
  { mes: 'Out', nps: 70, csat: 4.3 },
  { mes: 'Nov', nps: 68, csat: 4.2 },
  { mes: 'Dez', nps: 72, csat: 4.5 },
];

const atendimentosPorCanal = [
  { name: 'WhatsApp', value: 45 },
  { name: 'E-mail', value: 25 },
  { name: 'Telefone', value: 20 },
  { name: 'Chat', value: 10 },
];

const motivosContato = [
  { motivo: 'Dúvidas sobre aulas', quantidade: 245, percentual: 29 },
  { motivo: 'Reagendamento', quantidade: 178, percentual: 21 },
  { motivo: 'Financeiro', quantidade: 152, percentual: 18 },
  { motivo: 'Suporte técnico', quantidade: 118, percentual: 14 },
  { motivo: 'Certificados', quantidade: 85, percentual: 10 },
  { motivo: 'Outros', quantidade: 69, percentual: 8 },
];

const atendimentosPorDia = [
  { dia: 'Seg', atendimentos: 185 },
  { dia: 'Ter', atendimentos: 210 },
  { dia: 'Qua', atendimentos: 195 },
  { dia: 'Qui', atendimentos: 178 },
  { dia: 'Sex', atendimentos: 156 },
  { dia: 'Sáb', atendimentos: 45 },
  { dia: 'Dom', atendimentos: 12 },
];

export default function CustomerCarePage() {
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

  // Determina a cor do NPS
  const getNPSColor = (nps: number) => {
    if (nps >= 70) return '#10B981'; // Verde - Excelente
    if (nps >= 50) return '#F59E0B'; // Amarelo - Bom
    return '#EF4444'; // Vermelho - Precisa melhorar
  };

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Customer Care"
        description="Atendimento ao cliente e satisfação"
        sourceUrl="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
        lastUpdated={new Date()}
        onRefresh={handleRefresh}
        loading={loading}
        color="#8B5CF6"
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
              title="NPS"
              value={demoData.nps}
              previousValue={demoData.npsAnterior}
              format="number"
              icon={<ThumbsUp className="w-6 h-6" />}
              color={getNPSColor(demoData.nps)}
              subtitle="Net Promoter Score"
              loading={loading}
            />
            <KPICard
              title="CSAT"
              value={demoData.csat}
              previousValue={demoData.csatAnterior}
              format="number"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#3B82F6"
              subtitle="de 5.0"
              loading={loading}
            />
            <KPICard
              title="Volume de Atendimentos"
              value={demoData.volumeAtendimentos}
              previousValue={demoData.volumeAnterior}
              format="number"
              icon={<MessageSquare className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Tempo Médio de Resposta"
              value={`${demoData.tempoMedioResposta}min`}
              previousValue={demoData.tempoAnterior}
              trend="down"
              trendValue={33.3}
              icon={<Clock className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
          </div>

          {/* Gauge NPS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Score NPS</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#E5E7EB"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={getNPSColor(demoData.nps)}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(demoData.nps + 100) / 200 * 553} 553`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{demoData.nps}</span>
                    <span className="text-sm text-gray-500">Excelente</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>-100</span>
                <span>0</span>
                <span>+100</span>
              </div>
            </div>

            <ChartCard
              title="Evolução NPS/CSAT"
              subtitle="Últimos 6 meses"
            >
              <LineChart
                data={evolucaoNPS}
                xKey="mes"
                yKey="nps"
                color="#8B5CF6"
                height={200}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Canais de Atendimento"
              subtitle="Distribuição por canal"
            >
              <PieChartComponent
                data={atendimentosPorCanal}
                nameKey="name"
                valueKey="value"
                height={200}
                showLabels={false}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Motivos de contato */}
          <ModuleSection
            title="Principais Motivos de Contato"
            subtitle="Top 6 categorias"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {motivosContato.map((motivo, index) => (
                <div
                  key={motivo.motivo}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                    <span className="text-sm font-medium text-purple-600">{motivo.percentual}%</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{motivo.motivo}</p>
                  <p className="text-xs text-gray-400 mt-1">{motivo.quantidade} atendimentos</p>
                </div>
              ))}
            </div>
          </ModuleSection>

          {/* Gráficos adicionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Atendimentos por Dia da Semana"
              subtitle="Volume semanal"
            >
              <BarChartComponent
                data={atendimentosPorDia}
                xKey="dia"
                yKey="atendimentos"
                color="#8B5CF6"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Motivos de Contato"
              subtitle="Por volume"
            >
              <BarChartComponent
                data={motivosContato}
                xKey="motivo"
                yKey="quantidade"
                color="#3B82F6"
                horizontal
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
