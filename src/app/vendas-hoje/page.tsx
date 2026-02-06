'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import {
  ShoppingCart,
  DollarSign,
  UserPlus,
  RefreshCw,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';

interface VendaHoje {
  qtd: number;
  nf: string;
  nome: string;
  email: string;
  celular: string;
  empresaPf: string;
  data: string;
  pagamento: string;
  produto: string;
  tipo: string;
  horasOfertadas: number;
  duracaoCurso: number;
  modelo: string;
  consultor: string;
  renovNovo: string;
  valor: number;
  status: string;
  obs: string;
}

interface Totais {
  quantidade: number;
  valor: number;
  novos: number;
  renovacoes: number;
}

interface ApiResponse {
  success: boolean;
  vendasHoje: VendaHoje[];
  vendasMes: VendaHoje[];
  totais: {
    hoje: Totais;
    mes: Totais;
  };
  dataReferencia: string;
  mesReferencia: number;
  lastUpdated: string;
  message?: string;
}

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function VendasHojePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'hoje' | 'mes'>('mes');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data/vendas-hoje?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Vendas a exibir baseado no modo
  const vendas = useMemo(() => {
    if (!data) return [];
    return viewMode === 'hoje' ? data.vendasHoje : data.vendasMes;
  }, [data, viewMode]);

  const totais = useMemo(() => {
    if (!data) return { quantidade: 0, valor: 0, novos: 0, renovacoes: 0 };
    return viewMode === 'hoje' ? data.totais.hoje : data.totais.mes;
  }, [data, viewMode]);

  // Vendas por consultor
  const vendasPorConsultor = useMemo(() => {
    const grouped: Record<string, { quantidade: number; valor: number }> = {};
    vendas.forEach(v => {
      const consultor = v.consultor || 'Não informado';
      if (!grouped[consultor]) {
        grouped[consultor] = { quantidade: 0, valor: 0 };
      }
      grouped[consultor].quantidade++;
      grouped[consultor].valor += v.valor;
    });
    return Object.entries(grouped)
      .map(([nome, dados]) => ({ nome, ...dados }))
      .sort((a, b) => b.valor - a.valor);
  }, [vendas]);

  // Vendas por produto
  const vendasPorProduto = useMemo(() => {
    const grouped: Record<string, { quantidade: number; valor: number }> = {};
    vendas.forEach(v => {
      const produto = v.produto || 'Não informado';
      if (!grouped[produto]) {
        grouped[produto] = { quantidade: 0, valor: 0 };
      }
      grouped[produto].quantidade++;
      grouped[produto].valor += v.valor;
    });
    return Object.entries(grouped)
      .map(([nome, dados]) => ({ nome, ...dados }))
      .sort((a, b) => b.valor - a.valor);
  }, [vendas]);

  // Formata valor para moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendas Hoje</h1>
            <p className="text-gray-500 mt-1">
              {data ? `${data.dataReferencia} - ${MESES[data.mesReferencia]} 2026` : 'Carregando...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle Hoje/Mês */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('hoje')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'hoje'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Hoje
              </button>
              <button
                onClick={() => setViewMode('mes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'mes'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Mês
              </button>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {data?.message && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            {data.message}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title={viewMode === 'hoje' ? 'Vendas Hoje' : 'Vendas no Mês'}
            value={totais.quantidade}
            format="number"
            icon={<ShoppingCart className="w-5 h-5" />}
            color="#10B981"
            loading={loading}
          />
          <KPICard
            title={viewMode === 'hoje' ? 'Faturamento Hoje' : 'Faturamento Mês'}
            value={totais.valor}
            format="currency"
            icon={<DollarSign className="w-5 h-5" />}
            color="#3B82F6"
            loading={loading}
          />
          <KPICard
            title="Novos Alunos"
            value={totais.novos}
            format="number"
            icon={<UserPlus className="w-5 h-5" />}
            color="#8B5CF6"
            loading={loading}
          />
          <KPICard
            title="Renovações"
            value={totais.renovacoes}
            format="number"
            icon={<Users className="w-5 h-5" />}
            color="#F59E0B"
            loading={loading}
          />
        </div>

        {/* Grid de resumos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Consultor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-green-50">
              <h3 className="font-semibold text-gray-900">Por Consultor</h3>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {vendasPorConsultor.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhuma venda</p>
              ) : (
                <div className="space-y-3">
                  {vendasPorConsultor.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{c.nome}</p>
                        <p className="text-sm text-gray-500">{c.quantidade} venda(s)</p>
                      </div>
                      <p className="font-semibold text-green-600">{formatCurrency(c.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Por Produto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-blue-50">
              <h3 className="font-semibold text-gray-900">Por Produto</h3>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {vendasPorProduto.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhuma venda</p>
              ) : (
                <div className="space-y-3">
                  {vendasPorProduto.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{p.nome}</p>
                        <p className="text-xs text-gray-500">{p.quantidade} venda(s)</p>
                      </div>
                      <p className="font-semibold text-blue-600 text-sm">{formatCurrency(p.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              {viewMode === 'hoje' ? 'Vendas de Hoje' : 'Todas as Vendas do Mês'}
            </h3>
            <p className="text-sm text-gray-500">{vendas.length} venda(s)</p>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Produto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Consultor</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Valor</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      {loading ? 'Carregando...' : 'Nenhuma venda encontrada'}
                    </td>
                  </tr>
                ) : (
                  vendas.map((venda, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{venda.qtd}</td>
                      <td className="py-3 px-4 text-gray-700">{venda.data}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{venda.nome}</div>
                        <div className="text-xs text-gray-500">{venda.email}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="max-w-[200px] truncate" title={venda.produto}>
                          {venda.produto}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{venda.consultor}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          venda.renovNovo.toLowerCase().includes('novo')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {venda.renovNovo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(venda.valor)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          venda.status.toLowerCase() === 'concluído'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {venda.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparativo Hoje vs Mês */}
        {viewMode === 'hoje' && data && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Comparativo com o Mês
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Vendas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{data.totais.hoje.quantidade}</p>
                <p className="text-xs text-gray-400">de {data.totais.mes.quantidade} no mês</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Faturamento Hoje</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totais.hoje.valor)}</p>
                <p className="text-xs text-gray-400">de {formatCurrency(data.totais.mes.valor)} no mês</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">% do Mês</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.totais.mes.valor > 0
                    ? ((data.totais.hoje.valor / data.totais.mes.valor) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-gray-400">do faturamento mensal</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Ticket Médio Hoje</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.totais.hoje.quantidade > 0
                    ? formatCurrency(data.totais.hoje.valor / data.totais.hoje.quantidade)
                    : 'R$ 0'}
                </p>
                <p className="text-xs text-gray-400">por venda</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
