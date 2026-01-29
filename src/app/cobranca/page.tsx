'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { Receipt, CheckCircle, AlertCircle, Settings, Phone } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

interface TituloCobranca {
  nome?: string;
  email?: string;
  telefone?: string;
  vencimento: Date | string;
  cobranca_valor?: number;
  valor_total_aberto?: number;
  data_pagamento?: Date | string;
  valor_recuperado?: number;
  data_ultimo_contato?: Date | string;
  aluno?: string;
  status?: string;
  [key: string]: unknown;
}

// Função para parsear valor monetário
// Suporta formatos:
// - Brasileiro: R$ 1.234,56 (ponto separa milhares, vírgula decimal)
// - Americano: R$1,080.00 (vírgula separa milhares, ponto decimal)
// - Simples: 830.01 ou 830,01
const parseValor = (valor: unknown): number => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    // Remove R$ e espaços
    let limpo = valor.replace(/R\$\s*/gi, '').trim();

    // Se tem vírgula E ponto, precisa determinar o formato
    if (limpo.includes(',') && limpo.includes('.')) {
      const lastComma = limpo.lastIndexOf(',');
      const lastDot = limpo.lastIndexOf('.');

      if (lastComma > lastDot) {
        // Formato brasileiro: 1.234,56
        // O último separador é vírgula = decimal
        limpo = limpo.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato americano: 1,080.00
        // O último separador é ponto = decimal
        limpo = limpo.replace(/,/g, '');
      }
    }
    // Se só tem vírgula, é decimal brasileiro (830,01)
    else if (limpo.includes(',') && !limpo.includes('.')) {
      limpo = limpo.replace(',', '.');
    }
    // Se só tem ponto, é formato americano (830.01) - mantém como está

    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Função para parsear data (formato DD/MM/AA ou DD/MM/AAAA)
const parseDate = (dateValue: Date | string | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);

      // Se ano tem 2 dígitos, converte para 4 dígitos
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }

      return new Date(year, month, day);
    }
    return new Date(dateValue);
  }
  return null;
};

// Função para extrair mês de uma data
const getMonthFromDate = (dateValue: Date | string | undefined): string => {
  const date = parseDate(dateValue);
  if (!date) return 'N/A';
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return monthNames[date.getMonth()];
};

// Função para verificar se status é "Em contato"
const isEmContato = (status: string | undefined): boolean => {
  if (!status) return false;
  const statusLower = String(status).toLowerCase().trim();
  return statusLower === 'em contato' || statusLower === 'emcontato' || statusLower.includes('em contato');
};

export default function CobrancaPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<TituloCobranca>('cobranca');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Calcula KPIs
  const kpis = useMemo(() => {
    // Inadimplência (Absoluto) = soma de todos os valores da coluna "valor total em aberto"
    const inadimplenciaAbsoluta = data.reduce((sum, item) => {
      return sum + parseValor(item.valor_total_aberto);
    }, 0);

    // Valor Recuperado = soma de todos os valores da coluna "valor recuperado"
    const valorRecuperado = data.reduce((sum, item) => {
      return sum + parseValor(item.valor_recuperado);
    }, 0);

    // Títulos em Aberto = número de linhas com status "Em contato"
    const titulosEmAberto = data.filter(item => isEmContato(item.status)).length;

    return {
      inadimplenciaAbsoluta,
      valorRecuperado,
      titulosEmAberto,
    };
  }, [data]);

  // Valor total em aberto por mês (GERAL - todos os registros)
  // - Mês de referência: coluna "Vencimento"
  // - Valor: soma de TODOS os "Valor total em aberto"
  const valorAbertoMes = useMemo(() => {
    const grupos: Record<string, number> = {};

    // Inicializa todos os meses com zero para mostrar gráfico completo
    const mesesOrdem = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    mesesOrdem.forEach(mes => {
      grupos[mes] = 0;
    });

    data.forEach(item => {
      const mes = getMonthFromDate(item.vencimento);
      if (mes === 'N/A') return;

      const valor = parseValor(item.valor_total_aberto);
      grupos[mes] = (grupos[mes] || 0) + valor;
    });

    // Retorna todos os meses em ordem, mesmo os com valor zero
    return mesesOrdem.map(mes => ({
      mes,
      valor: grupos[mes] || 0
    }));
  }, [data]);

  // Valor recuperado por mês
  // - Mês de referência: coluna "Data de pagamento"
  // - Valor: soma de "valor recuperado" separado por mês
  const valorRecuperadoMes = useMemo(() => {
    const grupos: Record<string, number> = {};

    // Inicializa todos os meses com zero
    const mesesOrdem = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    mesesOrdem.forEach(mes => {
      grupos[mes] = 0;
    });

    data.forEach(item => {
      // Só conta se tiver data de pagamento
      if (!item.data_pagamento) return;

      const mes = getMonthFromDate(item.data_pagamento);
      if (mes === 'N/A') return;

      const valor = parseValor(item.valor_recuperado);
      grupos[mes] = (grupos[mes] || 0) + valor;
    });

    // Retorna todos os meses em ordem
    return mesesOrdem.map(mes => ({
      mes,
      valor: grupos[mes] || 0
    }));
  }, [data]);

  // Títulos em contato (para tabela) - apenas status "Em contato"
  const titulosEmContato = useMemo(() => {
    return data
      .filter(item => isEmContato(item.status))
      .map(item => {
        const vencimento = parseDate(item.vencimento);
        const hoje = new Date();
        const diasAtraso = vencimento ? Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          nome: String(item.nome || item.aluno || 'N/A'),
          email: String(item.email || '-'),
          telefone: String(item.telefone || '-'),
          vencimento: vencimento ? vencimento.toLocaleDateString('pt-BR') : '-',
          valorAberto: parseValor(item.valor_total_aberto),
          diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
          ultimoContato: parseDate(item.data_ultimo_contato)?.toLocaleDateString('pt-BR') || '-',
          status: String(item.status || '-'),
        };
      })
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [data]);

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
          {!loading && data.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum dado encontrado na planilha de cobrança.
              </p>
            </div>
          )}

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Inadimplência (Absoluto)"
              value={kpis.inadimplenciaAbsoluta}
              format="currencyCompact"
              icon={<AlertCircle className="w-6 h-6" />}
              color="#EF4444"
              subtitle="Soma de Valor Total em Aberto"
              loading={loading}
            />
            <KPICard
              title="Valor Recuperado"
              value={kpis.valorRecuperado}
              format="currencyCompact"
              icon={<CheckCircle className="w-6 h-6" />}
              color="#10B981"
              subtitle="Soma de Valor Recuperado"
              loading={loading}
            />
            <KPICard
              title="Títulos em Aberto"
              value={kpis.titulosEmAberto}
              format="number"
              icon={<Receipt className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Status: Em contato"
              loading={loading}
            />
          </div>

          {/* Gráficos de evolução mensal */}
          {(valorAbertoMes.length > 0 || valorRecuperadoMes.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Valor Total em Aberto por Mês"
                subtitle="Mês de vencimento (Geral - todos os registros)"
              >
                <BarChartComponent
                  data={valorAbertoMes}
                  xKey="mes"
                  yKey="valor"
                  color="#EF4444"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>

              <ChartCard
                title="Valor Recuperado por Mês"
                subtitle="Mês da data de pagamento"
              >
                <BarChartComponent
                  data={valorRecuperadoMes}
                  xKey="mes"
                  yKey="valor"
                  color="#10B981"
                  formatY="currency"
                  height={280}
                  loading={loading}
                />
              </ChartCard>
            </div>
          )}

          {/* Títulos em Contato */}
          {titulosEmContato.length > 0 && (
            <ModuleSection
              title="Títulos em Aberto - Status: Em Contato"
              subtitle={`${titulosEmContato.length} registros com status "Em contato"`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Dias Atraso
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Valor em Aberto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Último Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {titulosEmContato.slice(0, 15).map((titulo, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {titulo.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500">
                              <div>{titulo.email}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {titulo.telefone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {titulo.vencimento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              titulo.diasAtraso <= 15 ? 'text-yellow-600' :
                              titulo.diasAtraso <= 30 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {titulo.diasAtraso > 0 ? `${titulo.diasAtraso} dias` : 'A vencer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 text-right">
                            R$ {titulo.valorAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {titulo.ultimoContato}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              {titulo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Resumo */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-600">
              <p>
                Total de registros: <span className="font-semibold">{data.length}</span>
              </p>
              <p>
                Com status "Em contato": <span className="font-semibold text-orange-600">{kpis.titulosEmAberto}</span>
              </p>
              <p>
                Taxa de recuperação: <span className="font-semibold text-green-600">
                  {kpis.inadimplenciaAbsoluta > 0
                    ? ((kpis.valorRecuperado / (kpis.inadimplenciaAbsoluta + kpis.valorRecuperado)) * 100).toFixed(1)
                    : 0}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
