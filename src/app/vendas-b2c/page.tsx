'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleContainer, ModuleSection } from '@/components/layout/ModuleContainer';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard, BarChartComponent, PieChartComponent, AreaChartComponent } from '@/components/ui/Charts';
import { DateFilter } from '@/components/ui/DateFilter';
import { DollarSign, Users, ShoppingCart, TrendingUp, AlertCircle, Settings, RefreshCw, UserPlus, UserX, UserCheck } from 'lucide-react';
import { useSheetData } from '@/lib/hooks/useSheetData';
import Link from 'next/link';

// Lista oficial de produtos - EXATAMENTE como na planilha (sem criar "Outros")
const PRODUTOS_LISTA = [
  'Espanhol 12 meses',
  'Espanhol 06 meses',
  'Inglês 12 meses - FLOW',
  'Inglês 06 meses - FLOW',
  'Inglês 12 meses',
  'Inglês 10 meses',
  'Inglês 09 meses',
  'Inglês 06 meses',
  'Inglês 03 meses',
  'Inglês 01 mês',
  'Aulas particulares',
  'Teste de Proficiência',
  'FAAP - Ribeirão',
  'HDI - COPARTICIPACAO 30%',
  'Imersão 01 mês',
  'Adesão FLOW',
];

/**
 * Interface da planilha de Vendas B2C
 * Cada linha representa uma venda.
 *
 * Colunas esperadas:
 * - Nome: nome do aluno
 * - CPF/CNPJ: ID do aluno
 * - data_venda: Data da venda (DD/MM/AAAA)
 * - forma: Forma de pagamento (parcelado, recorrência, pix, boleto)
 * - produto: Tipo de curso (da lista oficial)
 * - fonte: Vendedor responsável
 * - renovação: "novo aluno" ou "renovação"
 * - cancelamento/cancelado: TRUE = cancelado, FALSE = ativo
 * - valor/faturamento: Valor da venda (R$ 5.160,00)
 */
interface VendaB2C {
  // Identificação do aluno
  nome?: string;           // Coluna Nome
  cpf_cnpj?: string;       // Coluna CPF/CNPJ
  aluno_nome?: string;     // Alias
  aluno_id?: string;       // Alias

  // Data da venda
  data_venda: Date | string;

  // Forma de pagamento
  forma?: string;
  forma_pagamento?: string;

  // Produto (da lista oficial)
  produto: string;

  // Vendedor
  fonte?: string;
  vendedor?: string;

  // Tipo: "novo aluno" ou "renovação"
  renovacao?: string;
  tipo_matricula?: string;

  // Status: TRUE = cancelado, FALSE = ativo
  cancelamento?: boolean | string;
  cancelado?: boolean | string;

  // Valor
  valor?: number | string;
  faturamento?: number | string;

  [key: string]: unknown;
}

// Função para parsear valor monetário brasileiro (R$ 5.160,00)
const parseValor = (valor: unknown): number => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    // Remove R$ e espaços
    let limpo = valor.replace(/R\$\s*/gi, '').trim();

    // Verifica o formato: brasileiro (1.234,56) vs americano (1,234.56)
    if (limpo.includes(',') && limpo.includes('.')) {
      const lastComma = limpo.lastIndexOf(',');
      const lastDot = limpo.lastIndexOf('.');
      if (lastComma > lastDot) {
        // Formato brasileiro: remove pontos, troca vírgula por ponto
        limpo = limpo.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato americano: remove vírgulas
        limpo = limpo.replace(/,/g, '');
      }
    } else if (limpo.includes(',') && !limpo.includes('.')) {
      // Só vírgula = decimal brasileiro (830,01)
      limpo = limpo.replace(',', '.');
    }

    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Helper para obter valor de um item
// Nome correto na planilha: valor_total
const getValor = (item: VendaB2C): number => {
  const record = item as Record<string, unknown>;

  // Percorre todas as chaves procurando valor_total
  for (const key of Object.keys(record)) {
    const keyLower = key.toLowerCase();
    if (keyLower === 'valor_total' || keyLower === 'valor total') {
      const val = record[key];
      // Se já é número, retorna diretamente
      if (typeof val === 'number') return val;
      // Se é string, faz parse
      if (typeof val === 'string') return parseValor(val);
    }
  }

  // Fallback: tenta propriedades diretas
  if (typeof record['valor_total'] === 'number') return record['valor_total'] as number;
  if (typeof item.valor === 'number') return item.valor;
  if (typeof item.faturamento === 'number') return item.faturamento as number;

  return 0;
};

// Helper para obter nome do aluno
const getNomeAluno = (item: VendaB2C): string => {
  return String(item.nome || item.aluno_nome || item.aluno_id || '-').trim();
};

// Helper para obter vendedor (fonte)
const getVendedor = (item: VendaB2C): string => {
  return String(item.fonte || item.vendedor || 'Não informado').trim();
};

// Helper para obter forma de pagamento
const getFormaPagamento = (item: VendaB2C): string => {
  return String(item.forma || item.forma_pagamento || 'Não informado').trim();
};

// Helper para obter o valor do campo renovação (tenta várias variações do nome da coluna)
// Nome da coluna na planilha: renovacao (valores: "Novo Aluno" ou "Renovação")
const getRenovacaoValue = (item: VendaB2C): string => {
  const record = item as Record<string, unknown>;

  // Busca case-insensitive por 'renovacao' ou 'renovação'
  const keys = Object.keys(record);
  const renovacaoKey = keys.find(k =>
    k.toLowerCase() === 'renovacao' ||
    k.toLowerCase() === 'renovação'
  );

  if (renovacaoKey && record[renovacaoKey]) {
    return String(record[renovacaoKey]).toLowerCase().trim();
  }

  // Fallbacks
  const value = record['renovacao'] ||
                item.renovacao ||
                '';
  return String(value).toLowerCase().trim();
};

// Função para verificar se é renovação (baseado no campo "renovação")
// Valores esperados na planilha: "Renovação" ou "renovação"
const isRenovacao = (item: VendaB2C): boolean => {
  const renovacao = getRenovacaoValue(item);
  // Match exato para "renovação" (case-insensitive)
  return renovacao === 'renovação' || renovacao === 'renovacao';
};

// Função para verificar se é novo aluno
// Valores esperados na planilha: "novo aluno"
const isNovoAluno = (item: VendaB2C): boolean => {
  const renovacao = getRenovacaoValue(item);
  // Match exato para "novo aluno" (case-insensitive)
  return renovacao === 'novo aluno' || renovacao === 'novo' || renovacao === 'nova matrícula' || renovacao === 'nova matricula';
};

// Helper para obter o valor do campo cancelamento
// Nome da coluna na planilha: cancelamento (valores: TRUE/FALSE)
const getCancelamentoValue = (item: VendaB2C): unknown => {
  const record = item as Record<string, unknown>;

  // Percorre todas as chaves procurando cancelamento
  for (const key of Object.keys(record)) {
    const keyLower = key.toLowerCase();
    if (keyLower === 'cancelamento' || keyLower === 'cancelado') {
      return record[key];
    }
  }

  return null;
};

// Função para verificar se está cancelado (TRUE = cancelado, FALSE = ativo)
const isCancelado = (item: VendaB2C): boolean => {
  const cancelamento = getCancelamentoValue(item);
  if (cancelamento === undefined || cancelamento === null) return false;
  if (typeof cancelamento === 'boolean') return cancelamento;
  const cancelStr = String(cancelamento).toLowerCase().trim();
  return cancelStr === 'true' ||
         cancelStr === 'sim' ||
         cancelStr === 's' ||
         cancelStr === '1' ||
         cancelStr === 'cancelado' ||
         cancelStr === 'verdadeiro';
};

// Função para parsear data (formato DD/MM/AAAA)
const parseDate = (dateValue: Date | string | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export default function VendasB2CPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data, loading, error, lastUpdated, sourceUrl, refresh } = useSheetData<VendaB2C>('vendas_b2c');

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Filtra dados pelo período selecionado (usando data_venda)
  const dadosFiltradosPeriodo = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      const itemDate = parseDate(item.data_venda);
      if (!itemDate) return false; // Exclui itens sem data válida
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // ==========================================
  // ALUNOS ATIVOS/CANCELADOS - NÃO RESPONDEM AO FILTRO DE TEMPO
  // Baseado em TODA a planilha
  // ==========================================

  // Alunos ativos = cancelamento FALSE (toda a planilha)
  const totalAlunosAtivos = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.filter(item => !isCancelado(item)).length;
  }, [data]);

  // Alunos cancelados = cancelamento TRUE (toda a planilha)
  const totalAlunosCancelados = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.filter(item => isCancelado(item)).length;
  }, [data]);

  // Taxa de cancelamento
  const taxaCancelamento = useMemo(() => {
    const total = data.length;
    return total > 0 ? (totalAlunosCancelados / total) * 100 : 0;
  }, [data.length, totalAlunosCancelados]);

  // ==========================================
  // NOVAS MATRÍCULAS E RENOVAÇÕES - RESPONDEM AO FILTRO DE TEMPO
  // Baseado no período selecionado E cancelamento = FALSE
  // ==========================================

  // Primeiro: filtra dados do período que NÃO estão cancelados (cancelamento = FALSE)
  const dadosAtivosNoPeriodo = useMemo(() => {
    return dadosFiltradosPeriodo.filter(item => !isCancelado(item));
  }, [dadosFiltradosPeriodo]);

  // Separa novas matrículas e renovações dos dados ATIVOS do período
  // - Novas matrículas: coluna "renovacao" = "Novo Aluno"
  // - Renovações: coluna "renovacao" = "Renovação"
  const { novasMatriculas, renovacoes } = useMemo(() => {
    const novas: VendaB2C[] = [];
    const renos: VendaB2C[] = [];

    dadosAtivosNoPeriodo.forEach(item => {
      // Usa o helper que tenta várias variações do nome da coluna
      const renovacaoField = getRenovacaoValue(item);

      // Checa se é renovação (valor exato: "renovação")
      if (renovacaoField === 'renovação') {
        renos.push(item);
      }
      // Checa se é novo aluno (valor exato: "novo aluno")
      else if (renovacaoField === 'novo aluno') {
        novas.push(item);
      }
      // Outros valores não são contados
    });

    return { novasMatriculas: novas, renovacoes: renos };
  }, [dadosAtivosNoPeriodo]);

  // DEBUG: Informações para diagnóstico
  const debugInfo = useMemo(() => {
    const totalPlanilha = data.length;
    const comDataValida = data.filter(item => parseDate(item.data_venda) !== null).length;
    const noPeriodo = dadosFiltradosPeriodo.length;
    const ativosNoPeriodo = dadosAtivosNoPeriodo.length;

    // Soma detalhada
    let somaTotal = 0;
    const valoresEncontrados: number[] = [];
    dadosAtivosNoPeriodo.forEach(item => {
      const valor = getValor(item);
      somaTotal += valor;
      valoresEncontrados.push(valor);
    });

    // Encontrar registros sem data válida que podem ser de Janeiro
    const semDataValida: string[] = [];
    data.forEach((item, index) => {
      const record = item as Record<string, unknown>;
      const dataVenda = item.data_venda || record['data_venda'];
      const parsed = parseDate(item.data_venda);
      if (!parsed && dataVenda) {
        // Mostra os primeiros 5 que têm algo no campo data_venda mas não parseou
        if (semDataValida.length < 5) {
          semDataValida.push(`Linha ${index + 2}: "${String(dataVenda).substring(0, 20)}"`);
        }
      }
    });

    // Verificar se existem datas depois de hoje que estão sendo excluídas
    const depoisDeHoje: string[] = [];
    data.forEach((item, index) => {
      const parsed = parseDate(item.data_venda);
      if (parsed && parsed > endDate) {
        if (depoisDeHoje.length < 3) {
          depoisDeHoje.push(`Linha ${index + 2}: ${parsed.toLocaleDateString('pt-BR')}`);
        }
      }
    });

    return {
      totalPlanilha,
      comDataValida,
      noPeriodo,
      ativosNoPeriodo,
      somaTotal,
      valoresZero: valoresEncontrados.filter(v => v === 0).length,
      semDataValida,
      depoisDeHoje
    };
  }, [data, dadosFiltradosPeriodo, dadosAtivosNoPeriodo, endDate]);

  // KPIs do período
  const kpis = useMemo(() => {
    // Faturamento total do período - APENAS linhas com cancelamento = FALSE
    // Usa dadosAtivosNoPeriodo que já está filtrado
    const faturamentoTotal = dadosAtivosNoPeriodo.reduce((sum, item) => {
      return sum + getValor(item);
    }, 0);

    // Faturamento novas matrículas (já filtrado por cancelamento=FALSE)
    const faturamentoNovas = novasMatriculas.reduce((sum, item) => {
      return sum + getValor(item);
    }, 0);

    // Faturamento renovações (já filtrado por cancelamento=FALSE)
    const faturamentoRenovacoes = renovacoes.reduce((sum, item) => {
      return sum + getValor(item);
    }, 0);

    // Ticket médio do período (baseado nos ativos)
    const totalVendasAtivas = dadosAtivosNoPeriodo.length;
    const ticketMedio = totalVendasAtivas > 0 ? faturamentoTotal / totalVendasAtivas : 0;

    return {
      faturamentoTotal,
      faturamentoNovas,
      faturamentoRenovacoes,
      totalNovasMatriculas: novasMatriculas.length,
      totalRenovacoes: renovacoes.length,
      ticketMedio,
    };
  }, [dadosAtivosNoPeriodo, novasMatriculas, renovacoes]);

  // Novas Matrículas por Produto (quantidade e valor)
  // Usa exatamente o que está na planilha, sem criar "Outros"
  const novasMatriculasPorProduto = useMemo(() => {
    const grupos: Record<string, { quantidade: number; valor: number }> = {};

    novasMatriculas.forEach(item => {
      const produto = String(item.produto || '').trim();
      if (!produto) return; // Ignora produtos vazios

      if (!grupos[produto]) {
        grupos[produto] = { quantidade: 0, valor: 0 };
      }
      grupos[produto].quantidade += 1;
      grupos[produto].valor += getValor(item);
    });

    return Object.entries(grupos)
      .map(([produto, dados]) => ({
        produto,
        ...dados
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [novasMatriculas]);

  // Renovações por Produto
  const renovacoesPorProduto = useMemo(() => {
    const grupos: Record<string, { quantidade: number; valor: number }> = {};

    renovacoes.forEach(item => {
      const produto = String(item.produto || '').trim();
      if (!produto) return;

      if (!grupos[produto]) {
        grupos[produto] = { quantidade: 0, valor: 0 };
      }
      grupos[produto].quantidade += 1;
      grupos[produto].valor += getValor(item);
    });

    return Object.entries(grupos)
      .map(([produto, dados]) => ({
        produto,
        ...dados
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [renovacoes]);

  // Agrupa por forma de pagamento
  const dadosPorPagamento = useMemo(() => {
    const grupos: Record<string, number> = {};

    dadosFiltradosPeriodo.forEach(item => {
      const pagamento = getFormaPagamento(item);
      grupos[pagamento] = (grupos[pagamento] || 0) + 1;
    });

    const total = Object.values(grupos).reduce((sum, val) => sum + val, 0);

    return Object.entries(grupos)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [dadosFiltradosPeriodo]);

  // Top Vendedores (usando coluna "fonte")
  // Mostra TODOS os vendedores encontrados
  const dadosPorVendedor = useMemo(() => {
    const grupos: Record<string, { vendas: number; valor: number }> = {};

    dadosFiltradosPeriodo.forEach(item => {
      const vendedor = getVendedor(item);
      if (!grupos[vendedor]) {
        grupos[vendedor] = { vendas: 0, valor: 0 };
      }
      grupos[vendedor].vendas += 1;
      grupos[vendedor].valor += getValor(item);
    });

    return Object.entries(grupos)
      .map(([vendedor, dados]) => ({
        vendedor,
        ...dados
      }))
      .sort((a, b) => b.vendas - a.vendas);
  }, [dadosFiltradosPeriodo]);

  // Evolução mensal
  const evolucaoMensal = useMemo(() => {
    const grupos: Record<string, { faturamento: number; matriculas: number; renovacoes: number }> = {};

    dadosFiltradosPeriodo.forEach(item => {
      const itemDate = parseDate(item.data_venda);
      let mes: string = 'N/A';

      if (itemDate) {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        mes = monthNames[itemDate.getMonth()];
      }

      if (!grupos[mes]) {
        grupos[mes] = { faturamento: 0, matriculas: 0, renovacoes: 0 };
      }
      grupos[mes].faturamento += getValor(item);

      if (isRenovacao(item)) {
        grupos[mes].renovacoes += 1;
      } else {
        grupos[mes].matriculas += 1;
      }
    });

    return Object.entries(grupos).map(([mes, dados]) => ({
      mes,
      ...dados
    }));
  }, [dadosFiltradosPeriodo]);

  // Totais para tabelas
  const totaisNovas = useMemo(() => ({
    quantidade: novasMatriculas.length,
    valor: novasMatriculas.reduce((sum, item) => sum + getValor(item), 0)
  }), [novasMatriculas]);

  const totaisRenovacoes = useMemo(() => ({
    quantidade: renovacoes.length,
    valor: renovacoes.reduce((sum, item) => sum + getValor(item), 0)
  }), [renovacoes]);

  // Vendas recentes (últimas 10 do período)
  const vendasRecentes = useMemo(() => {
    return dadosFiltradosPeriodo
      .map(item => ({
        ...item,
        data_parsed: parseDate(item.data_venda),
        valor_numerico: getValor(item),
        nome_aluno: getNomeAluno(item),
      }))
      .sort((a, b) => {
        if (!a.data_parsed || !b.data_parsed) return 0;
        return b.data_parsed.getTime() - a.data_parsed.getTime();
      })
      .slice(0, 10);
  }, [dadosFiltradosPeriodo]);

  // Se houver erro de configuração
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuracao Necessaria</h2>
          <p className="text-gray-500 mb-6 max-w-md">{error}</p>
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Ir para Configuracoes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ModuleContainer
        title="Vendas B2C"
        description="Faturamento, matriculas e renovacoes"
        sourceUrl={sourceUrl || '#'}
        lastUpdated={lastUpdated || undefined}
        onRefresh={refresh}
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
          {/* DEBUG: Informações de diagnóstico */}
          {!loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
              <p className="font-bold text-blue-800 mb-2">DEBUG - Diagnóstico:</p>
              <ul className="text-blue-700 space-y-1">
                <li>Total na planilha: {debugInfo.totalPlanilha}</li>
                <li>Com data válida: {debugInfo.comDataValida} (sem data válida: {debugInfo.totalPlanilha - debugInfo.comDataValida})</li>
                <li>No período selecionado: {debugInfo.noPeriodo}</li>
                <li>Ativos no período (cancelamento=FALSE): {debugInfo.ativosNoPeriodo}</li>
                <li>Registros com valor = 0: {debugInfo.valoresZero}</li>
                <li className="font-bold">Soma calculada: R$ {debugInfo.somaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                <li>Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}</li>
                {debugInfo.semDataValida.length > 0 && (
                  <li className="text-red-600">Sem data válida: {debugInfo.semDataValida.join(', ')}</li>
                )}
                {debugInfo.depoisDeHoje.length > 0 && (
                  <li className="text-orange-600">Após período: {debugInfo.depoisDeHoje.join(', ')}</li>
                )}
              </ul>
            </div>
          )}

          {/* Mensagem se não houver dados */}
          {!loading && dadosFiltradosPeriodo.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800">
                Nenhum dado encontrado para o periodo selecionado.
                {data.length > 0 && ` (${data.length} registros totais na planilha)`}
              </p>
            </div>
          )}

          {/* KPIs - Linha 1: Periodo filtrado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Faturamento Total"
              value={kpis.faturamentoTotal}
              format="currency"
              icon={<DollarSign className="w-6 h-6" />}
              color="#10B981"
              subtitle="Periodo selecionado"
              loading={loading}
            />
            <KPICard
              title="Novas Matriculas"
              value={kpis.totalNovasMatriculas}
              format="number"
              icon={<UserPlus className="w-6 h-6" />}
              color="#3B82F6"
              subtitle={`R$ ${(kpis.faturamentoNovas / 1000).toFixed(1)}K`}
              loading={loading}
            />
            <KPICard
              title="Renovacoes"
              value={kpis.totalRenovacoes}
              format="number"
              icon={<RefreshCw className="w-6 h-6" />}
              color="#8B5CF6"
              subtitle={`R$ ${(kpis.faturamentoRenovacoes / 1000).toFixed(1)}K`}
              loading={loading}
            />
            <KPICard
              title="Ticket Medio"
              value={kpis.ticketMedio}
              format="currency"
              icon={<ShoppingCart className="w-6 h-6" />}
              color="#F59E0B"
              subtitle="Periodo selecionado"
              loading={loading}
            />
          </div>

          {/* KPIs - Linha 2: Alunos (NAO respondem ao filtro) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Alunos Ativos"
              value={totalAlunosAtivos}
              format="number"
              icon={<UserCheck className="w-6 h-6" />}
              color="#10B981"
              subtitle="Total geral (cancelamento=FALSE)"
              loading={loading}
            />
            <KPICard
              title="Alunos Cancelados"
              value={totalAlunosCancelados}
              format="number"
              icon={<UserX className="w-6 h-6" />}
              color="#EF4444"
              subtitle="Total geral (cancelamento=TRUE)"
              loading={loading}
            />
            <KPICard
              title="Taxa de Cancelamento"
              value={`${taxaCancelamento.toFixed(1)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              color={taxaCancelamento > 10 ? '#EF4444' : '#10B981'}
              subtitle="Sobre base total"
              loading={loading}
            />
            <KPICard
              title="Total Registros"
              value={data.length}
              format="number"
              icon={<Users className="w-6 h-6" />}
              color="#6B7280"
              subtitle="Na planilha"
              loading={loading}
            />
          </div>

          {/* Novas Matrículas por Produto */}
          {novasMatriculasPorProduto.length > 0 && (
            <ModuleSection
              title="Novas Matriculas por Produto"
              subtitle={`${totaisNovas.quantidade} matriculas | R$ ${totaisNovas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider">
                          Ticket Medio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {novasMatriculasPorProduto.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.produto}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
                              {item.quantidade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-right">
                            R$ {item.quantidade > 0 ? (item.valor / item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-blue-900">
                          TOTAL
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-blue-900">
                          {totaisNovas.quantidade}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-blue-900 text-right">
                          R$ {totaisNovas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-blue-900 text-right">
                          R$ {totaisNovas.quantidade > 0 ? (totaisNovas.valor / totaisNovas.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Renovações por Produto */}
          {renovacoesPorProduto.length > 0 && (
            <ModuleSection
              title="Renovacoes por Produto"
              subtitle={`${totaisRenovacoes.quantidade} renovacoes | R$ ${totaisRenovacoes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-purple-800 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                          Ticket Medio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {renovacoesPorProduto.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.produto}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">
                              {item.quantidade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-right">
                            R$ {item.quantidade > 0 ? (item.valor / item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-purple-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-purple-900">
                          TOTAL
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-bold text-purple-900">
                          {totaisRenovacoes.quantidade}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-purple-900 text-right">
                          R$ {totaisRenovacoes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-purple-900 text-right">
                          R$ {totaisRenovacoes.quantidade > 0 ? (totaisRenovacoes.valor / totaisRenovacoes.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ModuleSection>
          )}

          {/* Gráficos de evolução */}
          {evolucaoMensal.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Faturamento por Periodo"
                subtitle="Distribuicao no periodo selecionado"
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
                title="Matriculas vs Renovacoes"
                subtitle="Por periodo"
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
          )}

          {/* Gráficos detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {novasMatriculasPorProduto.length > 0 && (
              <ChartCard
                title="Faturamento por Produto"
                subtitle="Novas matriculas"
              >
                <BarChartComponent
                  data={novasMatriculasPorProduto.slice(0, 7)}
                  xKey="produto"
                  yKey="valor"
                  color="#3B82F6"
                  horizontal
                  formatY="currency"
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}

            {dadosPorPagamento.length > 0 && (
              <ChartCard
                title="Formas de Pagamento"
                subtitle="Distribuicao percentual"
              >
                <PieChartComponent
                  data={dadosPorPagamento}
                  nameKey="name"
                  valueKey="value"
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}

            {dadosPorVendedor.length > 0 && (
              <ChartCard
                title="Top Vendedores"
                subtitle={`${dadosPorVendedor.length} vendedores encontrados`}
              >
                <BarChartComponent
                  data={dadosPorVendedor.slice(0, 10)}
                  xKey="vendedor"
                  yKey="vendas"
                  color="#8B5CF6"
                  horizontal
                  height={300}
                  loading={loading}
                />
              </ChartCard>
            )}
          </div>

          {/* Tabela de vendas recentes */}
          {vendasRecentes.length > 0 && (
            <ModuleSection
              title="Vendas Recentes"
              subtitle={`Ultimos ${vendasRecentes.length} registros do periodo`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
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
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {vendasRecentes.map((venda, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venda.data_parsed ? venda.data_parsed.toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venda.nome_aluno}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {String(venda.produto || '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isRenovacao(venda)
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isRenovacao(venda) ? 'Renovacao' : 'Novo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            R$ {venda.valor_numerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isCancelado(venda)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isCancelado(venda) ? 'Cancelado' : 'Ativo'}
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
        </div>
      </ModuleContainer>
    </DashboardLayout>
  );
}
