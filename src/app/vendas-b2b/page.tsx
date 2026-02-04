'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { DateFilter } from '@/components/ui/DateFilter';
import {
  DollarSign,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface VendaB2B {
  _rowIndex: number;
  tipo_documento: string;
  documento: string;
  nome: string;
  cliente: string;
  celular: string;
  data_venda: Date;
  ultima_parcela: string;
  forma_pagamento: string;
  desconto: string;
  duracao_curso: string;
  valor_total: number;
  adquirente: string;
  cancelamento: boolean;
  marca: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: VendaB2B[];
  };
}

export default function VendasB2BPage() {
  const [data, setData] = useState<VendaB2B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de data - padrão: este ano
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0, 1); // 1 de janeiro
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });

  // Carrega dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/data/vendas-b2b?refresh=true&_t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result: ApiResponse = await response.json();

      if (result.success && result.data?.data) {
        const processedData = result.data.data.map((item, index) => {
          // Converte data DD/MM/YYYY para Date
          let dataVenda: Date = new Date(NaN);
          const rawDate = item.data_venda as unknown;

          if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            const [day, month, year] = rawDate.split('/').map(Number);
            dataVenda = new Date(year, month - 1, day);
          }

          // Converte valor
          let valorTotal = 0;
          const rawValor = item.valor_total as unknown;
          if (typeof rawValor === 'number') {
            valorTotal = rawValor;
          } else if (typeof rawValor === 'string') {
            valorTotal = parseFloat(rawValor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
          }

          return {
            ...item,
            _rowIndex: index + 2,
            data_venda: dataVenda,
            valor_total: valorTotal,
          };
        });
        setData(processedData);
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

  // Filtra apenas CNPJ e data válida
  const dadosCNPJ = useMemo(() => {
    return data.filter(item => {
      const hasValidDate = item.data_venda instanceof Date && !isNaN(item.data_venda.getTime());
      // Verifica se tipo_documento é CNPJ ou se documento parece ser CNPJ (14+ dígitos)
      const tipoDoc = (item.tipo_documento || '').toUpperCase();
      const doc = String(item.documento || '');
      const isCNPJ = tipoDoc === 'CNPJ' || doc.replace(/\D/g, '').length >= 14;
      return hasValidDate && isCNPJ;
    });
  }, [data]);

  // Filtra pelo período
  const filteredData = useMemo(() => {
    return dadosCNPJ.filter(item => {
      const itemYear = item.data_venda.getFullYear();
      const itemMonth = item.data_venda.getMonth();
      const itemDay = item.data_venda.getDate();

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();

      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();

      const itemNum = itemYear * 10000 + itemMonth * 100 + itemDay;
      const startNum = startYear * 10000 + startMonth * 100 + startDay;
      const endNum = endYear * 10000 + endMonth * 100 + endDay;

      return itemNum >= startNum && itemNum <= endNum;
    });
  }, [dadosCNPJ, startDate, endDate]);

  // Separa por marca
  const contratosPorMarca = useMemo(() => {
    const alumniByBetter = filteredData.filter(item =>
      (item.marca || '').toLowerCase().includes('alumni by better') ||
      (item.marca || '').toLowerCase() === 'alumni by better'
    );
    const alumni = filteredData.filter(item => {
      const marca = (item.marca || '').toLowerCase();
      return marca === 'alumni' || (marca.includes('alumni') && !marca.includes('better'));
    });
    const better = filteredData.filter(item => {
      const marca = (item.marca || '').toLowerCase();
      return marca === 'better' || (marca.includes('better') && !marca.includes('alumni'));
    });

    return {
      alumniByBetter,
      alumni,
      better,
      valorAlumniByBetter: alumniByBetter.reduce((sum, v) => sum + v.valor_total, 0),
      valorAlumni: alumni.reduce((sum, v) => sum + v.valor_total, 0),
      valorBetter: better.reduce((sum, v) => sum + v.valor_total, 0),
    };
  }, [filteredData]);

  // Total geral
  const totalContratos = filteredData.length;
  const receitaTotal = filteredData.reduce((sum, v) => sum + v.valor_total, 0);

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Componente de tabela de contratos
  const TabelaContratos = ({ contratos, titulo, cor }: { contratos: VendaB2B[], titulo: string, cor: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100" style={{ borderLeftWidth: 4, borderLeftColor: cor }}>
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <p className="text-sm text-gray-500">{contratos.length} contratos | {formatCurrency(contratos.reduce((s, c) => s + c.valor_total, 0))}</p>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Contato</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Duração</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Valor</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Nenhum contrato encontrado</td>
              </tr>
            ) : (
              contratos.map((item, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{item.nome}</div>
                    <div className="text-xs text-gray-500">{item.documento}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <div className="text-xs">{item.cliente}</div>
                    <div className="text-xs text-gray-500">{item.celular}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 text-xs">
                    {item.data_venda instanceof Date && !isNaN(item.data_venda.getTime())
                      ? item.data_venda.toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 text-xs">{item.duracao_curso || '-'} meses</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(item.valor_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendas B2B</h1>
            <p className="text-gray-500 mt-1">Contratos corporativos por marca</p>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* KPIs por Marca */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Receita Total"
            value={receitaTotal}
            format="currency"
            icon={<DollarSign className="w-6 h-6" />}
            color="#10B981"
            subtitle={`${totalContratos} contratos no período`}
            loading={loading}
          />
          <KPICard
            title="Alumni by Better"
            value={contratosPorMarca.valorAlumniByBetter}
            format="currency"
            icon={<Building2 className="w-6 h-6" />}
            color="#8B5CF6"
            subtitle={`${contratosPorMarca.alumniByBetter.length} contratos`}
            loading={loading}
          />
          <KPICard
            title="Alumni"
            value={contratosPorMarca.valorAlumni}
            format="currency"
            icon={<Building2 className="w-6 h-6" />}
            color="#3B82F6"
            subtitle={`${contratosPorMarca.alumni.length} contratos`}
            loading={loading}
          />
          <KPICard
            title="Better"
            value={contratosPorMarca.valorBetter}
            format="currency"
            icon={<Building2 className="w-6 h-6" />}
            color="#F59E0B"
            subtitle={`${contratosPorMarca.better.length} contratos`}
            loading={loading}
          />
        </div>

        {/* Listas de Contratos */}
        <div className="space-y-6">
          <TabelaContratos
            contratos={contratosPorMarca.alumniByBetter}
            titulo="Contratos Alumni by Better"
            cor="#8B5CF6"
          />
          <TabelaContratos
            contratos={contratosPorMarca.alumni}
            titulo="Contratos Alumni"
            cor="#3B82F6"
          />
          <TabelaContratos
            contratos={contratosPorMarca.better}
            titulo="Contratos Better"
            cor="#F59E0B"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
