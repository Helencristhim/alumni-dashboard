'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Building2,
  HeadphonesIcon,
  UserX,
  Receipt,
  Megaphone
} from 'lucide-react';

// Dados de demonstração para a visão geral
const overviewData = {
  faturamentoTotal: 2450000,
  faturamentoAnterior: 2180000,
  alunosAtivos: 1847,
  alunosAnteriores: 1720,
  nps: 72,
  npsAnterior: 68,
  churnRate: 3.2,
  churnAnterior: 4.1,
};

const faturamentoMensal = [
  { mes: 'Jul', valor: 380000 },
  { mes: 'Ago', valor: 420000 },
  { mes: 'Set', valor: 395000 },
  { mes: 'Out', valor: 450000 },
  { mes: 'Nov', valor: 480000 },
  { mes: 'Dez', valor: 520000 },
];

const alunosPorCurso = [
  { curso: 'Particular presencial', alunos: 420 },
  { curso: 'Particular online inglês', alunos: 380 },
  { curso: 'Community', alunos: 350 },
  { curso: 'Community Flow', alunos: 280 },
  { curso: 'Conexion', alunos: 220 },
  { curso: 'Particular espanhol', alunos: 120 },
  { curso: 'Imersão', alunos: 77 },
];

const distribuicaoCanais = [
  { name: 'B2C', value: 75 },
  { name: 'B2B', value: 25 },
];

const modulosStatus = [
  { nome: 'Vendas B2C', valor: 'R$ 1,8M', variacao: 12.5, tipo: 'up', icon: ShoppingCart, cor: '#10B981' },
  { nome: 'Vendas B2B', valor: 'R$ 650K', variacao: 8.2, tipo: 'up', icon: Building2, cor: '#3B82F6' },
  { nome: 'Customer Care', valor: 'NPS 72', variacao: 5.9, tipo: 'up', icon: HeadphonesIcon, cor: '#8B5CF6' },
  { nome: 'Cancelamentos', valor: '3.2%', variacao: -22.0, tipo: 'down', icon: UserX, cor: '#EF4444' },
  { nome: 'Cobrança', valor: '4.5%', variacao: -15.0, tipo: 'down', icon: Receipt, cor: '#F59E0B' },
  { nome: 'Marketing', valor: 'CAC R$ 180', variacao: -8.5, tipo: 'down', icon: Megaphone, cor: '#EC4899' },
];

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header da página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 mt-1">
            Acompanhamento consolidado de todos os módulos
          </p>
        </div>

        {/* KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Faturamento Total"
            value={overviewData.faturamentoTotal}
            previousValue={overviewData.faturamentoAnterior}
            format="currencyCompact"
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
            subtitle="Últimos 30 dias"
          />
          <KPICard
            title="Alunos Ativos"
            value={overviewData.alunosAtivos}
            previousValue={overviewData.alunosAnteriores}
            format="number"
            icon={<Users className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="Base ativa"
          />
          <KPICard
            title="NPS Geral"
            value={overviewData.nps}
            previousValue={overviewData.npsAnterior}
            format="number"
            icon={<TrendingUp className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle="Satisfação"
          />
          <KPICard
            title="Taxa de Churn"
            value={overviewData.churnRate}
            previousValue={overviewData.churnAnterior}
            format="percentage"
            trend="down"
            icon={<TrendingDown className="w-6 h-6" />}
            color="#EF4444"
            subtitle="Cancelamentos"
          />
        </div>

        {/* Status rápido dos módulos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status por Módulo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {modulosStatus.map((modulo) => {
              const Icon = modulo.icon;
              return (
                <div
                  key={modulo.nome}
                  className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${modulo.cor}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: modulo.cor }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{modulo.nome}</p>
                  <p className="text-lg font-bold text-gray-900">{modulo.valor}</p>
                  <p className={`text-xs font-medium ${modulo.tipo === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {modulo.tipo === 'up' ? '↑' : '↓'} {Math.abs(modulo.variacao)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Faturamento Mensal"
            subtitle="Evolução nos últimos 6 meses"
          >
            <LineChart
              data={faturamentoMensal}
              xKey="mes"
              yKey="valor"
              color="#10B981"
              formatY="currency"
              height={280}
            />
          </ChartCard>

          <ChartCard
            title="Alunos por Curso"
            subtitle="Distribuição da base ativa"
          >
            <BarChartComponent
              data={alunosPorCurso}
              xKey="curso"
              yKey="alunos"
              color="#3B82F6"
              horizontal
              height={280}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Distribuição de Receita"
            subtitle="B2C vs B2B"
          >
            <PieChartComponent
              data={distribuicaoCanais}
              nameKey="name"
              valueKey="value"
              height={250}
            />
          </ChartCard>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas e Destaques</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-green-800">
                  <strong>Vendas B2C:</strong> Meta mensal atingida! 112% do objetivo.
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <p className="text-sm text-blue-800">
                  <strong>B2B:</strong> 3 novos contratos em negociação avançada.
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <p className="text-sm text-yellow-800">
                  <strong>Cobrança:</strong> 15 títulos vencendo nos próximos 5 dias.
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <p className="text-sm text-purple-800">
                  <strong>NPS:</strong> Subiu 4 pontos no último mês.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
