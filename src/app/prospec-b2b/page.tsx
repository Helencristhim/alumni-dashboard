'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import {
  Building2,
  Users,
  Target,
  CheckCircle,
  Clock,
  RefreshCw,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';

interface ProspecB2B {
  empresa: string;
  responsavel: string;
  area: string;
  email: string;
  contato: string;
  negociacao: string;
  status: string;
  b2b: string;
  b2b2c: string;
  fup: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ProspecB2B[];
  };
}

export default function ProspecB2BPage() {
  const [data, setData] = useState<ProspecB2B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Carrega dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/data/prospec-b2b?refresh=true&_t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result: ApiResponse = await response.json();

      if (result.success && result.data?.data) {
        // Filtra registros vazios (sem empresa)
        const validData = result.data.data.filter(item =>
          item.empresa && item.empresa.trim() !== ''
        );
        setData(validData);
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Contagem por status
  const statusCount = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const status = (item.status || 'Nao informado').trim();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [data]);

  // Dados filtrados
  const filteredData = useMemo(() => {
    if (filtroStatus === 'TODOS') return data;
    return data.filter(item => (item.status || '').trim() === filtroStatus);
  }, [data, filtroStatus]);

  // KPIs
  const kpis = useMemo(() => {
    const total = data.length;
    const b2bCount = data.filter(item =>
      (item.b2b || '').toLowerCase() === 'sim'
    ).length;
    const b2b2cCount = data.filter(item =>
      (item.b2b2c || '').toLowerCase() === 'sim'
    ).length;
    const emNegociacao = data.filter(item =>
      (item.b2b || '').toLowerCase() === 'em negociacao' ||
      (item.b2b2c || '').toLowerCase() === 'em negociacao'
    ).length;
    const propostaOk = data.filter(item =>
      (item.status || '').toLowerCase().includes('proposta') &&
      (item.status || '').toLowerCase().includes('ok')
    ).length;
    const aguardandoReuniao = data.filter(item =>
      (item.status || '').toLowerCase().includes('aguardando reuniao')
    ).length;

    return {
      total,
      b2bCount,
      b2b2cCount,
      emNegociacao,
      propostaOk,
      aguardandoReuniao
    };
  }, [data]);

  // Cores por status
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('proposta') && s.includes('ok')) return 'bg-green-100 text-green-800';
    if (s.includes('aguardando')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('negociacao') || s === 'em negociação') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Cor B2B/B2B2C
  const getB2BColor = (value: string) => {
    const v = value.toLowerCase();
    if (v === 'sim') return 'bg-green-100 text-green-800';
    if (v === 'nao' || v === 'não') return 'bg-red-100 text-red-800';
    if (v === 'em negociacao' || v === 'em negociação') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prospec B2B</h1>
            <p className="text-gray-500 mt-1">Funil de prospecao de empresas</p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Total Empresas"
            value={kpis.total}
            format="number"
            icon={<Building2 className="w-5 h-5" />}
            color="#0EA5E9"
            loading={loading}
          />
          <KPICard
            title="B2B Confirmado"
            value={kpis.b2bCount}
            format="number"
            icon={<Briefcase className="w-5 h-5" />}
            color="#10B981"
            loading={loading}
          />
          <KPICard
            title="B2B2C Confirmado"
            value={kpis.b2b2cCount}
            format="number"
            icon={<Users className="w-5 h-5" />}
            color="#8B5CF6"
            loading={loading}
          />
          <KPICard
            title="Em Negociacao"
            value={kpis.emNegociacao}
            format="number"
            icon={<Target className="w-5 h-5" />}
            color="#F59E0B"
            loading={loading}
          />
          <KPICard
            title="Proposta OK"
            value={kpis.propostaOk}
            format="number"
            icon={<CheckCircle className="w-5 h-5" />}
            color="#22C55E"
            loading={loading}
          />
          <KPICard
            title="Aguardando Reuniao"
            value={kpis.aguardandoReuniao}
            format="number"
            icon={<Clock className="w-5 h-5" />}
            color="#EAB308"
            loading={loading}
          />
        </div>

        {/* Filtro por Status */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2 py-2">Filtrar por Status:</span>
          <button
            onClick={() => setFiltroStatus('TODOS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'TODOS'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({data.length})
          </button>
          {Object.entries(statusCount).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === status
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status} ({count})
            </button>
          ))}
        </div>

        {/* Tabela de Empresas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-sky-50">
            <h3 className="font-semibold text-gray-900">Lista de Empresas</h3>
            <p className="text-sm text-gray-500">{filteredData.length} empresas {filtroStatus !== 'TODOS' ? `com status "${filtroStatus}"` : ''}</p>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Responsavel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Area</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Contato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Negociacao</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">B2B</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">B2B2C</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">FUP</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      Nenhuma empresa encontrada
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{item.empresa || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {item.responsavel || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {item.area || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {item.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              {item.email}
                            </div>
                          )}
                          {item.contato && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="w-3 h-3" />
                              {item.contato}
                            </div>
                          )}
                          {!item.email && !item.contato && '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-xs max-w-[200px]">
                        <div className="truncate" title={item.negociacao || '-'}>
                          {item.negociacao || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status || '')}`}>
                          {item.status || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getB2BColor(item.b2b || '')}`}>
                          {item.b2b || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getB2BColor(item.b2b2c || '')}`}>
                          {item.b2b2c || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-xs">
                        {item.fup || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
