'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ContractType,
  CONTRACT_TYPE_LABELS,
  ContractVariables,
  ContractProgramData,
  PROGRAM_TYPES,
  PAYMENT_METHODS,
  CompanyData,
} from '@/types/contracts';

interface ContractFormProps {
  variables: Partial<ContractVariables>;
  programs: ContractProgramData[];
  contractType: ContractType;
  brand: string;
  companies: CompanyData[];
  selectedCompanyId?: string;
  onChange: (data: {
    variables?: Partial<ContractVariables>;
    programs?: ContractProgramData[];
    type?: ContractType;
    brand?: string;
    companyId?: string;
  }) => void;
}

export function ContractForm({
  variables,
  programs,
  contractType,
  brand,
  companies,
  selectedCompanyId,
  onChange,
}: ContractFormProps) {
  const [expandedSection, setExpandedSection] = useState<string>('empresa');

  const updateVariable = (key: string, value: string) => {
    onChange({ variables: { ...variables, [key]: value } });
  };

  const selectCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      onChange({
        companyId,
        variables: {
          ...variables,
          razao_social: company.razaoSocial,
          cnpj: company.cnpj,
          endereco: company.endereco || '',
          representante_nome: company.representanteNome || '',
          representante_cpf: company.representanteCpf || '',
        },
      });
    }
  };

  const addProgram = () => {
    onChange({
      programs: [
        ...programs,
        { tipoPrograma: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 },
      ],
    });
  };

  const updateProgram = (index: number, updates: Partial<ContractProgramData>) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], ...updates };
    // Recalcular valor total do programa
    if (updates.quantidade !== undefined || updates.valorUnitario !== undefined) {
      updated[index].valorTotal =
        (updates.quantidade ?? updated[index].quantidade) *
        (updates.valorUnitario ?? updated[index].valorUnitario);
    }
    onChange({ programs: updated });
  };

  const removeProgram = (index: number) => {
    onChange({ programs: programs.filter((_, i) => i !== index) });
  };

  const totalContrato = programs.reduce((sum, p) => sum + (p.valorTotal || 0), 0);

  const Section = ({
    id,
    title,
    icon,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-gray-500">{icon}</span>
        <span className="font-medium text-sm text-gray-900">{title}</span>
      </button>
      {expandedSection === id && (
        <div className="p-4 space-y-3">{children}</div>
      )}
    </div>
  );

  const Input = ({
    label,
    value,
    variableKey,
    placeholder,
    type = 'text',
  }: {
    label: string;
    value: string;
    variableKey: string;
    placeholder?: string;
    type?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => updateVariable(variableKey, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
      {/* Tipo e Marca */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select
            value={contractType}
            onChange={(e) => onChange({ type: e.target.value as ContractType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
          <select
            value={brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="alumni">Alumni</option>
            <option value="better">Better EdTech</option>
          </select>
        </div>
      </div>

      {/* Empresa Contratante */}
      <Section id="empresa" title="Empresa Contratante" icon={<Building2 className="w-4 h-4" />}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Selecionar empresa cadastrada
          </label>
          <select
            value={selectedCompanyId || ''}
            onChange={(e) => selectCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione ou preencha manualmente</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razaoSocial} ({c.cnpj})
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Razão Social"
          value={variables.razao_social || ''}
          variableKey="razao_social"
          placeholder="Razão Social da empresa"
        />
        <Input
          label="CNPJ"
          value={variables.cnpj || ''}
          variableKey="cnpj"
          placeholder="00.000.000/0000-00"
        />
        <Input
          label="Endereço"
          value={variables.endereco || ''}
          variableKey="endereco"
          placeholder="Endereço completo"
        />
        <Input
          label="Representante - Nome"
          value={variables.representante_nome || ''}
          variableKey="representante_nome"
        />
        <Input
          label="Representante - CPF"
          value={variables.representante_cpf || ''}
          variableKey="representante_cpf"
          placeholder="000.000.000-00"
        />
      </Section>

      {/* Prazo */}
      <Section id="prazo" title="Prazo do Contrato" icon={<Building2 className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data Início"
            value={variables.data_inicio || ''}
            variableKey="data_inicio"
            type="date"
          />
          <Input
            label="Data Fim"
            value={variables.data_fim || ''}
            variableKey="data_fim"
            type="date"
          />
        </div>
        <Input
          label="Prazo (meses)"
          value={variables.prazo_meses || ''}
          variableKey="prazo_meses"
          type="number"
        />
      </Section>

      {/* Programas */}
      <Section id="programas" title="Programas Contratados" icon={<Building2 className="w-4 h-4" />}>
        {programs.map((program, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Programa {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeProgram(index)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <select
              value={program.tipoPrograma}
              onChange={(e) =>
                updateProgram(index, { tipoPrograma: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione o programa</option>
              {PROGRAM_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Alunos</label>
                <input
                  type="number"
                  value={program.quantidade}
                  onChange={(e) =>
                    updateProgram(index, { quantidade: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Valor Unit.</label>
                <input
                  type="number"
                  value={program.valorUnitario}
                  onChange={(e) =>
                    updateProgram(index, {
                      valorUnitario: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Total</label>
                <input
                  type="text"
                  value={`R$ ${(program.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  readOnly
                  className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addProgram}
          className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar programa
        </button>
        {programs.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Valor total:</span>
            <span className="text-sm font-bold text-gray-900">
              R$ {totalContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </Section>

      {/* Pagamento */}
      <Section id="pagamento" title="Condições de Pagamento" icon={<Building2 className="w-4 h-4" />}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Forma de Pagamento
          </label>
          <select
            value={variables.forma_pagamento || ''}
            onChange={(e) => updateVariable('forma_pagamento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Selecione</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dia Emissão NF"
            value={variables.dia_emissao_nf || ''}
            variableKey="dia_emissao_nf"
            type="number"
          />
          <Input
            label="Dia Vencimento"
            value={variables.dia_vencimento || ''}
            variableKey="dia_vencimento"
            type="number"
          />
        </div>
        <Input
          label="Valor Total do Contrato"
          value={variables.valor_total_contrato || ''}
          variableKey="valor_total_contrato"
          placeholder="0,00"
        />
      </Section>

      {/* Foro */}
      <Section id="foro" title="Foro" icon={<Building2 className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cidade"
            value={variables.foro_cidade || ''}
            variableKey="foro_cidade"
          />
          <Input
            label="Estado"
            value={variables.foro_estado || ''}
            variableKey="foro_estado"
          />
        </div>
      </Section>
    </div>
  );
}
