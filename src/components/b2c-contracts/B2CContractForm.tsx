'use client';

import { useState, useEffect } from 'react';
import {
  User,
  FileText,
  BookOpen,
  CreditCard,
  Calendar,
  Info,
} from 'lucide-react';
import {
  B2CContractType,
  B2C_CONTRACT_TYPE_LABELS,
  B2CContractVariables,
  B2C_PAYMENT_METHODS,
  B2C_FORMATO_OPTIONS,
} from '@/types/b2c-contracts';

interface B2CContractFormProps {
  variables: Partial<B2CContractVariables>;
  contractType: B2CContractType;
  brand: string;
  onChange: (data: {
    variables?: Partial<B2CContractVariables>;
    type?: B2CContractType;
    brand?: string;
  }) => void;
}

export function B2CContractForm({
  variables,
  contractType,
  brand,
  onChange,
}: B2CContractFormProps) {
  const [expandedSection, setExpandedSection] = useState<string>('aluno');

  const updateVariable = (key: string, value: string) => {
    onChange({ variables: { ...variables, [key]: value } });
  };

  // Auto-calculate valor_total for PRIVATE: valor_por_aula * carga_horaria
  useEffect(() => {
    if (contractType === 'PRIVATE') {
      const valorPorAula = parseFloat(
        (variables.valor_por_aula || '0').replace(',', '.')
      );
      const cargaHoraria = parseInt(variables.carga_horaria || '0', 10);
      if (valorPorAula > 0 && cargaHoraria > 0) {
        const total = valorPorAula * cargaHoraria;
        const formatted = total.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        });
        if (variables.valor_total !== formatted) {
          onChange({ variables: { ...variables, valor_total: formatted } });
        }
      }
    }
  }, [variables.valor_por_aula, variables.carga_horaria, contractType]);

  // Auto-fill dates with today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const updates: Partial<B2CContractVariables> = {};
    if (!variables.data_contrato) updates.data_contrato = today;
    if (!variables.data_inicio) updates.data_inicio = today;
    if (Object.keys(updates).length > 0) {
      onChange({ variables: { ...variables, ...updates } });
    }
  }, []);

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
    inputMode,
    suffix,
    readOnly,
  }: {
    label: string;
    value: string;
    variableKey: string;
    placeholder?: string;
    type?: string;
    inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'tel';
    suffix?: string;
    readOnly?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className={suffix ? 'flex items-center gap-2' : ''}>
        <input
          type={type}
          inputMode={inputMode}
          value={value || ''}
          onChange={(e) => updateVariable(variableKey, e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${suffix ? 'flex-1' : 'w-full'} px-3 py-2 border ${
            readOnly
              ? 'bg-gray-100 border-gray-200 text-gray-700'
              : 'border-gray-300'
          } rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
        {suffix && (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const isPrivate = contractType === 'PRIVATE';
  const isCommunity = contractType === 'COMMUNITY';
  const isCommunityFlow = contractType === 'COMMUNITY_FLOW';
  const showHybridBadge = isCommunity || isCommunityFlow;

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
      {/* Seção 1: Dados do Aluno */}
      <Section
        id="aluno"
        title="Dados do Aluno"
        icon={<User className="w-4 h-4" />}
      >
        <Input
          label="Nome completo *"
          value={variables.nomeAluno || ''}
          variableKey="nomeAluno"
          placeholder="Nome completo do aluno"
        />
        <Input
          label="CPF"
          value={variables.cpfAluno || ''}
          variableKey="cpfAluno"
          placeholder="000.000.000-00"
        />
        <Input
          label="Email *"
          value={variables.emailAluno || ''}
          variableKey="emailAluno"
          placeholder="aluno@email.com"
          type="email"
          inputMode="email"
        />
        <Input
          label="Telefone"
          value={variables.telefoneAluno || ''}
          variableKey="telefoneAluno"
          placeholder="(00) 00000-0000"
          inputMode="tel"
        />
        <Input
          label="Endereço"
          value={variables.enderecoAluno || ''}
          variableKey="enderecoAluno"
          placeholder="Endereço completo"
        />
      </Section>

      {/* Seção 2: Tipo de Contrato */}
      <Section
        id="tipo"
        title="Tipo de Contrato"
        icon={<FileText className="w-4 h-4" />}
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo
          </label>
          <select
            value={contractType}
            onChange={(e) =>
              onChange({ type: e.target.value as B2CContractType })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(B2C_CONTRACT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Marca
          </label>
          <select
            value={brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="alumni">Alumni</option>
            <option value="better">Better EdTech</option>
          </select>
        </div>
      </Section>

      {/* Seção 3: Detalhes do Programa */}
      <Section
        id="programa"
        title="Detalhes do Programa"
        icon={<BookOpen className="w-4 h-4" />}
      >
        {isPrivate && (
          <>
            <Input
              label="Valor por Aula"
              value={variables.valor_por_aula || ''}
              variableKey="valor_por_aula"
              placeholder="0,00"
              inputMode="decimal"
            />
            <Input
              label="Carga Horária Total"
              value={variables.carga_horaria || ''}
              variableKey="carga_horaria"
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Formato
              </label>
              <select
                value={variables.formato || ''}
                onChange={(e) => updateVariable('formato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                {B2C_FORMATO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {variables.valor_por_aula && variables.carga_horaria && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">
                  Valor total calculado
                </p>
                <p className="text-sm font-bold text-blue-900">
                  R$ {variables.valor_total || '0,00'}
                </p>
              </div>
            )}
          </>
        )}

        {isCommunity && (
          <>
            <Input
              label="Carga Horária Total"
              value={variables.carga_horaria_total || ''}
              variableKey="carga_horaria_total"
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <Input
              label="Duração da Aula"
              value={variables.duracao_aula || ''}
              variableKey="duracao_aula"
              placeholder="0"
              inputMode="numeric"
              suffix="min"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Formato
              </label>
              <select
                value={variables.formato || ''}
                onChange={(e) => updateVariable('formato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                {B2C_FORMATO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {isCommunityFlow && (
          <>
            <Input
              label="Carga Grupo"
              value={variables.carga_grupo || ''}
              variableKey="carga_grupo"
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <Input
              label="Carga Individual"
              value={variables.carga_individual || ''}
              variableKey="carga_individual"
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Formato
              </label>
              <select
                value={variables.formato || ''}
                onChange={(e) => updateVariable('formato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                {B2C_FORMATO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </Section>

      {/* Seção 4: Condições de Pagamento */}
      <Section
        id="pagamento"
        title="Condições de Pagamento"
        icon={<CreditCard className="w-4 h-4" />}
      >
        <Input
          label="Valor Total"
          value={
            isPrivate
              ? `R$ ${variables.valor_total || '0,00'}`
              : variables.valor_total || ''
          }
          variableKey="valor_total"
          placeholder="0,00"
          readOnly={isPrivate}
          inputMode={isPrivate ? undefined : 'decimal'}
        />
        {isPrivate && (
          <p className="text-xs text-gray-400 -mt-2">
            Calculado automaticamente (valor por aula x carga horária)
          </p>
        )}
        <Input
          label="Parcelas"
          value={variables.parcelas || ''}
          variableKey="parcelas"
          placeholder="1"
          inputMode="numeric"
        />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Forma de Pagamento
          </label>
          <select
            value={variables.forma_pagamento || ''}
            onChange={(e) => updateVariable('forma_pagamento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            {B2C_PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo de Cobrança
          </label>
          <select
            value={variables.tipo_cobranca || ''}
            onChange={(e) => updateVariable('tipo_cobranca', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            <option value="mensal">Mensal</option>
            <option value="pacote">Pacote</option>
          </select>
        </div>
        {showHybridBadge && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Faturamento híbrido: 50% serviço + 50% produto
            </p>
          </div>
        )}
      </Section>

      {/* Seção 5: Datas */}
      <Section
        id="datas"
        title="Datas"
        icon={<Calendar className="w-4 h-4" />}
      >
        <Input
          label="Data do Contrato"
          value={variables.data_contrato || ''}
          variableKey="data_contrato"
          type="date"
        />
        <Input
          label="Data de Início"
          value={variables.data_inicio || ''}
          variableKey="data_inicio"
          type="date"
        />
      </Section>
    </div>
  );
}
