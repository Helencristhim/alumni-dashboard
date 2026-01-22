'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, PieChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { HeadphonesIcon, MessageSquare, Clock, ThumbsUp, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface Atendimento {
  data_atendimento: Date | string;
  canal?: string;
  motivo?: string;
  nps?: number;
  csat?: number;
  tempo_resposta?: number;
  status?: string;
  [key: string]: unknown;
}

export default function CustomerCarePage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<Atendimento>('customer_care');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data_atendimento) return true;

      let itemDate: Date;
      if (item.data_atendimento instanceof Date) {
        itemDate = item.data_atendimento;
      } else if (typeof item.data_atendimento === 'string') {
        const parts = item.data_atendimento.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data_atendimento);
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
        nps: 0,
        csat: 0,
        volumeAtendimentos: 0,
        tempoMedioResposta: 0,
      };
    }

    const npsValues = filteredData.filter(item => typeof item.nps === 'number').map(item => item.nps as number);
    const csatValues = filteredData.filter(item => typeof item.csat === 'number').map(item => item.csat as number);
    const tempoValues = filteredData.filter(item => typeof item.tempo_resposta === 'number').map(item => item.tempo_resposta as number);

    const nps = npsValues.length > 0 ? Math.round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length) : 0;
    const csat = csatValues.length > 0 ? (csatValues.reduce((a, b) => a + b, 0) / csatValues.length).toFixed(1) : 0;
    const tempoMedioResposta = tempoValues.length > 0 ? Math.round(tempoValues.reduce((a, b) => a + b, 0) / tempoValues.length) : 0;

    return {
      nps,
      csat: Number(csat),
      volumeAtendimentos: filteredData.length,
      tempoMedioResposta,
    };
  }, [filteredData]);

  // Atendimentos por canal
  const atendimentosPorCanal = useMemo(() => {
    const canais: Record<string, number> = {};

    filteredData.forEach(item => {
      const canal = String(item.canal || 'Outros');
      canais[canal] = (canais[canal] || 0) + 1;
    });

    const total = Object.values(canais).reduce((sum, val) => sum + val, 0);

    return Object.entries(canais).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Motivos de contato
  const motivosContato = useMemo(() => {
    const motivos: Record<string, number> = {};

    filteredData.forEach(item => {
      const motivo = String(item.motivo || 'Outros');
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    });

    const total = Object.values(motivos).reduce((sum, val) => sum + val, 0);

    return Object.entries(motivos)
      .map(([motivo, quantidade]) => ({
        motivo,
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6);
  }, [filteredData]);

  // Determina a cor do NPS
  const getNPSColor = (nps: number) => {
    if (nps >= 70) return '#10B981';
    if (nps >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getNPSLabel = (nps: number) => {
    if (nps >= 70) return 'Excelente';
    if (nps >= 50) return 'Bom';
    if (nps >= 0) return 'Regular';
    return 'Crítico';
  };

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
        title="Customer Care"
        description="Atendimento ao cliente e satisfação"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
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
              title="NPS"
              value={kpis.nps}
              format="number"
              icon={<ThumbsUp className="w-6 h-6" />}
              color={getNPSColor(kpis.nps)}
              subtitle="Net Promoter Score"
              loading={loading}
            />
            <KPICard
              title="CSAT"
              value={kpis.csat}
              format="number"
              icon={<TrendingUp className="w-6 h-6" />}
              color="#3B82F6"
              subtitle="de 5.0"
              loading={loading}
            />
            <KPICard
              title="Volume de Atendimentos"
              value={kpis.volumeAtendimentos}
              format="number"
              icon={<MessageSquare className="w-6 h-6" />}
              color="#8B5CF6"
              loading={loading}
            />
            <KPICard
              title="Tempo Médio de Resposta"
              value={kpis.tempoMedioResposta > 0 ? `${kpis.tempoMedioResposta}min` : '0'}
              icon={<Clock className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
          </div>

          {/* Gauge NPS e Gráficos */}
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
                      stroke={getNPSColor(kpis.nps)}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(kpis.nps + 100) / 200 * 553} 553`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{kpis.nps}</span>
                    <span className="text-sm text-gray-500">{getNPSLabel(kpis.nps)}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>-100</span>
                <span>0</span>
                <span>+100</span>
              </div>
            </div>

            {motivosContato.length > 0 && (
              <ChartCard
                title="Motivos de Contato"
                subtitle="Por volume"
              >
                <BarChartComponent
                  data={motivosContato}
                  xKey="motivo"
                  yKey="quantidade"
                  color="#8B5CF6"
                  horizontal
                  height={200}
                  loading={loading}
                />
              </ChartCard>
            )}

            {atendimentosPorCanal.length > 0 && (
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
            )}
          </div>

          {/* Motivos de contato detalhado */}
          {motivosContato.length > 0 && (
            <ModuleSection
              title="Principais Motivos de Contato"
              subtitle={`Top ${motivosContato.length} categorias`}
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
                    <p className="text-sm text-gray-600 font-medium truncate" title={motivo.motivo}>
                      {motivo.motivo}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{motivo.quantidade} atendimentos</p>
                  </div>
                ))}
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
