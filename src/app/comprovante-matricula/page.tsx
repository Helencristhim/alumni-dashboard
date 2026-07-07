'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  Send,
  FileText,
} from 'lucide-react';
import {
  B2CContractStatus,
  B2CContractData,
  B2C_CONTRACT_STATUS_LABELS,
  B2C_CONTRACT_STATUS_COLORS,
} from '@/types/b2c-contracts';

export default function ComprovantesListPage() {
  const [comprovantes, setComprovantes] = useState<B2CContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchComprovantes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/b2c-contracts?${params}`);
      const result = await response.json();
      if (result.success) {
        // Filtrar apenas comprovantes de matricula
        const filtered = result.data.filter(
          (c: B2CContractData) => c.title?.startsWith('Comprovante de Matrícula')
        );
        setComprovantes(filtered);
      }
    } catch (err) {
      console.error('Erro ao carregar comprovantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprovantes();
  }, [statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = comprovantes.length;
    const signed = comprovantes.filter(
      (c) => c.status === 'SIGNED' || c.status === 'ACTIVE'
    ).length;
    const pending = comprovantes.filter(
      (c) => c.status === 'SENT_FOR_SIGNATURE'
    ).length;
    const draft = comprovantes.filter((c) => c.status === 'DRAFT').length;
    return { total, signed, pending, draft };
  }, [comprovantes]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comprovante?')) return;
    try {
      await fetch(`/api/b2c-contracts/${id}`, { method: 'DELETE' });
      fetchComprovantes();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
    setMenuOpen(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComprovantes();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comprovantes de Matrícula</h1>
            <p className="text-gray-500 mt-1">
              Gestão de comprovantes emitidos para alunos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchComprovantes}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link
              href="/comprovante-matricula/novo"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Comprovante
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Emitidos"
            value={kpis.total}
            format="number"
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="#10B981"
            subtitle="Todos os comprovantes"
            loading={loading}
          />
          <KPICard
            title="Rascunhos"
            value={kpis.draft}
            format="number"
            icon={<FileText className="w-6 h-6" />}
            color="#3B82F6"
            subtitle="Ainda não enviados"
            loading={loading}
          />
          <KPICard
            title="Assinados"
            value={kpis.signed}
            format="number"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle="Comprovantes finalizados"
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
                placeholder="Buscar por aluno ou CPF..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </form>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">Todos os status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="SENT_FOR_SIGNATURE">Aguardando Assinatura</option>
                <option value="SIGNED">Assinado</option>
                <option value="ACTIVE">Ativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Comprovante</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Aluno</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Curso</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando comprovantes...
                    </td>
                  </tr>
                ) : comprovantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-2" />
                      <p>Nenhum comprovante emitido</p>
                      <Link
                        href="/comprovante-matricula/novo"
                        className="text-emerald-600 hover:underline text-sm mt-1 inline-block"
                      >
                        Emitir primeiro comprovante
                      </Link>
                    </td>
                  </tr>
                ) : (
                  comprovantes.map((comp) => {
                    const contractData = (comp.contractData || {}) as unknown as Record<string, string>;
                    const cursoInfo = contractData.curso || '-';
                    const idiomaInfo = contractData.idioma || '';

                    return (
                      <tr
                        key={comp.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/contratos-b2c/${comp.id}`}
                            className="font-medium text-emerald-600 hover:text-emerald-800"
                          >
                            {comp.number}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">Comprovante de Matrícula</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-gray-900">{comp.nomeAluno || '-'}</span>
                              {comp.cpfAluno && (
                                <p className="text-xs text-gray-500">{comp.cpfAluno}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <span>{cursoInfo}</span>
                          {idiomaInfo && (
                            <p className="text-xs text-gray-400">{idiomaInfo}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              B2C_CONTRACT_STATUS_COLORS[comp.status as B2CContractStatus] || ''
                            }`}
                          >
                            {B2C_CONTRACT_STATUS_LABELS[comp.status as B2CContractStatus] ||
                              comp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {comp.createdAt
                            ? new Date(comp.createdAt).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative flex justify-center">
                            <button
                              onClick={() =>
                                setMenuOpen(menuOpen === comp.id ? null : comp.id!)
                              }
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {menuOpen === comp.id && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 w-48">
                                <Link
                                  href={`/contratos-b2c/${comp.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                >
                                  <Eye className="w-4 h-4" />
                                  Abrir / Editar
                                </Link>
                                <button
                                  onClick={() => {}}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-purple-600 cursor-pointer"
                                >
                                  <Send className="w-4 h-4" />
                                  Enviar p/ Assinatura
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDelete(comp.id!)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
