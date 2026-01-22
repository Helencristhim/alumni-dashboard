'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, LineChart, BarChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Receipt, TrendingDown, DollarSign, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface TituloCobranca {
  data_vencimento: Date | string;
  aluno_nome?: string;
  curso?: string;
  valor?: number;
  dias_atraso?: number;
  status?: string;
  valor_recuperado?: number;
  acao_cobranca?: string;
  [key: string]: unknown;
}

export default function CobrancaPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<TituloCobranca>('cobranca');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      if (!item.data_vencimento) return true;

      let itemDate: Date;
      if (item.data_vencimento instanceof Date) {
        itemDate = item.data_vencimento;
      } else if (typeof item.data_vencimento === 'string') {
        const parts = item.data_vencimento.split('/');
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          itemDate = new Date(item.data_vencimento);
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
        inadimplenciaValor: 0,
        valorRecuperado: 0,
        titulosAtrasados: 0,
        titulosVencer: 0,
      };
    }

    const atrasados = filteredData.filter(item => {
      const diasAtraso = typeof item.dias_atraso === 'number' ? item.dias_atraso : 0;
      return diasAtraso > 0;
    });

    const inadimplenciaValor = atrasados.reduce((sum, item) => {
      const valor = typeof item.valor === 'number' ? item.valor : 0;
      return sum + valor;
    }, 0);

    const valorRecuperado = filteredData.reduce((sum, item) => {
      const valor = typeof item.valor_recuperado === 'number' ? item.valor_recuperado : 0;
      return sum + valor;
    }, 0);

    const aVencer = filteredData.filter(item => {
      const diasAtraso = typeof item.dias_atraso === 'number' ? item.dias_atraso : 0;
      return diasAtraso <= 0 && diasAtraso >= -5;
    });

    return {
      inadimplenciaValor,
      valorRecuperado,
      titulosAtrasados: atrasados.length,
      titulosVencer: aVencer.length,
    };
  }, [filteredData]);

  // Inadimplência por faixa de atraso
  const inadimplenciaPorFaixa = useMemo(() => {
    const faixas = [
      { faixa: '1-15 dias', min: 1, max: 15, cor: '#F59E0B' },
      { faixa: '16-30 dias', min: 16, max: 30, cor: '#F97316' },
      { faixa: '31-60 dias', min: 31, max: 60, cor: '#EF4444' },
      { faixa: '61-90 dias', min: 61, max: 90, cor: '#DC2626' },
      { faixa: '+90 dias', min: 91, max: 9999, cor: '#991B1B' },
    ];

    return faixas.map(faixa => {
      const titulos = filteredData.filter(item => {
        const dias = typeof item.dias_atraso === 'number' ? item.dias_atraso : 0;
        return dias >= faixa.min && dias <= faixa.max;
      });

      const valor = titulos.reduce((sum, item) => {
        return sum + (typeof item.valor === 'number' ? item.valor : 0);
      }, 0);

      return {
        ...faixa,
        valor,
        quantidade: titulos.length,
      };
    });
  }, [filteredData]);

  // Títulos em atraso (para tabela)
  const titulosRecentes = useMemo(() => {
    return filteredData
      .filter(item => {
        const dias = typeof item.dias_atraso === 'number' ? item.dias_atraso : 0;
        return dias > 0;
      })
      .map(item => ({
        aluno: String(item.aluno_nome || 'N/A'),
        curso: String(item.curso || 'N/A'),
        valor: typeof item.valor === 'number' ? item.valor : 0,
        diasAtraso: typeof item.dias_atraso === 'number' ? item.dias_atraso : 0,
        status: String(item.status || 'Em cobrança'),
      }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso)
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
        title="Cobrança"
        description="Inadimplência e recuperação de valores"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
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
              title="Inadimplência (R$)"
              value={kpis.inadimplenciaValor}
              format="currencyCompact"
              icon={<AlertCircle className="w-6 h-6" />}
              color="#EF4444"
              loading={loading}
            />
            <KPICard
              title="Valor Recuperado"
              value={kpis.valorRecuperado}
              format="currencyCompact"
              icon={<CheckCircle className="w-6 h-6" />}
              color="#10B981"
              loading={loading}
            />
            <KPICard
              title="Títulos Atrasados"
              value={kpis.titulosAtrasados}
              format="number"
              icon={<Receipt className="w-6 h-6" />}
              color="#F59E0B"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={data.length}
              format="number"
              icon={<TrendingDown className="w-6 h-6" />}
              color="#3B82F6"
              subtitle="Na planilha"
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
              title="Inadimplência por Faixa"
              subtitle="Valor por período de atraso"
            >
              <BarChartComponent
                data={inadimplenciaPorFaixa}
                xKey="faixa"
                yKey="valor"
                color="#F59E0B"
                formatY="currency"
                height={280}
                loading={loading}
              />
            </ChartCard>

            <ChartCard
              title="Quantidade de Títulos"
              subtitle="Por faixa de atraso"
            >
              <BarChartComponent
                data={inadimplenciaPorFaixa}
                xKey="faixa"
                yKey="quantidade"
                color="#EF4444"
                height={280}
                loading={loading}
              />
            </ChartCard>
          </div>

          {/* Títulos em atraso */}
          {titulosRecentes.length > 0 && (
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
                            titulo.status.toLowerCase().includes('crític')
                              ? 'bg-red-100 text-red-800'
                              : titulo.status.toLowerCase().includes('negoci')
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
          )}
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
