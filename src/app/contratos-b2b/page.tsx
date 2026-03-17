'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  Send,
} from 'lucide-react';
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_TYPE_LABELS,
  ContractType,
  ContractData,
} from '@/types/contracts';

export default function ContratosB2BPage() {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (brandFilter) params.set('brand', brandFilter);

      const response = await fetch(`/api/contracts?${params}`);
      const result = await response.json();
      if (result.success) {
        setContracts(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, brandFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = contracts.length;
    const valorTotal = contracts.reduce((sum, c) => sum + (c.valorTotal || 0), 0);
    const signed = contracts.filter((c) => c.status === 'SIGNED' || c.status === 'ACTIVE').length;
    const pending = contracts.filter(
      (c) => c.status === 'SENT_FOR_SIGNATURE'
    ).length;
    return { total, valorTotal, signed, pending };
  }, [contracts]);

  const handleDuplicate = async (id: string) => {
    try {
      await fetch(`/api/contracts/${id}/duplicate`, { method: 'POST' });
      fetchContracts();
    } catch (err) {
      console.error('Erro ao duplicar:', err);
    }
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    try {
      await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      fetchContracts();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
    setMenuOpen(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContracts();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos B2B</h1>
            <p className="text-gray-500 mt-1">
              Gestão de contratos corporativos com IA jurídica
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchContracts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link
              href="/contratos-b2b/novo"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Contratos"
            value={kpis.total}
            format="number"
            icon={<FileText className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="Todos os contratos"
            loading={loading}
          />
          <KPICard
            title="Valor Total"
            value={kpis.valorTotal}
            format="currency"
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
            subtitle="Soma de todos os contratos"
            loading={loading}
          />
          <KPICard
            title="Assinados"
            value={kpis.signed}
            format="number"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle="Contratos finalizados"
            loading={loading}
          />
          <KPICard
            title="Aguardando Assinatura"
            value={kpis.pending}
            format="number"
            icon={<Clock className="w-6 h-6" />}
            color="#F59E0B"
            subtitle="Enviados para assinatura"
            loading={loading}
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por empresa, CNPJ ou número..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
              >
                <option value="">Todas as marcas</option>
                <option value="alumni">Alumni</option>
                <option value="better">Better EdTech</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Contratos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Contrato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Marca</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando contratos...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p>Nenhum contrato encontrado</p>
                      <Link
                        href="/contratos-b2b/novo"
                        className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                      >
                        Criar primeiro contrato
                      </Link>
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/contratos-b2b/${contract.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {contract.number}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">{contract.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {contract.company?.razaoSocial || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {CONTRACT_TYPE_LABELS[contract.type as ContractType] || contract.type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            CONTRACT_STATUS_COLORS[contract.status as ContractStatus] || ''
                          }`}
                        >
                          {CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ||
                            contract.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 capitalize">{contract.brand}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(contract.valorTotal || 0)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {contract.createdAt
                          ? new Date(contract.createdAt).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() =>
                              setMenuOpen(menuOpen === contract.id ? null : contract.id!)
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpen === contract.id && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 w-48">
                              <Link
                                href={`/contratos-b2b/${contract.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                Abrir / Editar
                              </Link>
                              <button
                                onClick={() => handleDuplicate(contract.id!)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicar
                              </button>
                              <button
                                onClick={() => {}}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-purple-600"
                              >
                                <Send className="w-4 h-4" />
                                Enviar p/ Assinatura
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleDelete(contract.id!)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
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
