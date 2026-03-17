'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CompanyForm } from '@/components/contracts/CompanyForm';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { CompanyData } from '@/types/contracts';

interface CompanyWithCount extends CompanyData {
  _count?: { contracts: number };
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | undefined>();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/companies${params}`);
      const result = await response.json();
      if (result.success) setCompanies(result.data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSave = async (data: CompanyData) => {
    const url = data.id ? `/api/companies/${data.id}` : '/api/companies';
    const method = data.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      fetchCompanies();
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar esta empresa?')) return;
    try {
      await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      fetchCompanies();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
            <p className="text-gray-500 mt-1">Cadastro de empresas contratantes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setEditingCompany(undefined);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Busca */}
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Lista */}
        <div className="grid gap-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma empresa cadastrada</p>
            </div>
          ) : (
            companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{company.razaoSocial}</h3>
                      <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
                      <div className="flex items-center gap-4 mt-1">
                        {company.representanteNome && (
                          <span className="text-xs text-gray-400">
                            Rep.: {company.representanteNome}
                          </span>
                        )}
                        {company._count && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {company._count.contracts} contrato(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCompany(company);
                        setShowForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </DashboardLayout>
  );
}
