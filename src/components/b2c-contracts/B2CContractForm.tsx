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

// ============================================================
// Sub-componentes FORA do componente principal (referência estável)
// ============================================================

function FormSection({
  id,
  title,
  icon,
  expandedSection,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  expandedSection: string;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
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
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  suffix,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'tel';
  suffix?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className={suffix ? 'flex items-center gap-2' : ''}>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
}

// ============================================================
// Componente principal
// ============================================================

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

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? '' : id);
  };

  const updateVariable = (key: string, value: string) => {
    onChange({ variables: { ...variables, [key]: value } });
  };

  // Auto-calculate valor_total for PRIVATE
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

  // Auto-fill dates on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const updates: Partial<B2CContractVariables> = {};
    if (!variables.data_contrato) updates.data_contrato = today;
    if (!variables.data_inicio) updates.data_inicio = today;
    if (Object.keys(updates).length > 0) {
      onChange({ variables: { ...variables, ...updates } });
    }
  }, []);

  const isPrivate = contractType === 'PRIVATE';
  const isCommunity = contractType === 'COMMUNITY';
  const isCommunityFlow = contractType === 'COMMUNITY_FLOW';
  const showHybridBadge = isCommunity || isCommunityFlow;

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
      {/* Dados do Aluno */}
      <FormSection
        id="aluno"
        title="Dados do Aluno"
        icon={<User className="w-4 h-4" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <FormInput
          label="Nome completo *"
          value={variables.nomeAluno || ''}
          onChange={(v) => updateVariable('nomeAluno', v)}
          placeholder="Nome completo do aluno"
        />
        <FormInput
          label="CPF"
          value={variables.cpfAluno || ''}
          onChange={(v) => updateVariable('cpfAluno', v)}
          placeholder="000.000.000-00"
        />
        <FormInput
          label="Email *"
          value={variables.emailAluno || ''}
          onChange={(v) => updateVariable('emailAluno', v)}
          placeholder="aluno@email.com"
          type="email"
          inputMode="email"
        />
        <FormInput
          label="Telefone"
          value={variables.telefoneAluno || ''}
          onChange={(v) => updateVariable('telefoneAluno', v)}
          placeholder="(00) 00000-0000"
          inputMode="tel"
        />
        <FormInput
          label="Endereço"
          value={variables.enderecoAluno || ''}
          onChange={(v) => updateVariable('enderecoAluno', v)}
          placeholder="Endereço completo"
        />
      </FormSection>

      {/* Tipo de Contrato */}
      <FormSection
        id="tipo"
        title="Tipo de Contrato"
        icon={<FileText className="w-4 h-4" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
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
      </FormSection>

      {/* Detalhes do Programa */}
      <FormSection
        id="programa"
        title="Detalhes do Programa"
        icon={<BookOpen className="w-4 h-4" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        {isPrivate && (
          <>
            <FormInput
              label="Valor por Aula"
              value={variables.valor_por_aula || ''}
              onChange={(v) => updateVariable('valor_por_aula', v)}
              placeholder="0,00"
              inputMode="decimal"
            />
            <FormInput
              label="Carga Horária Total"
              value={variables.carga_horaria || ''}
              onChange={(v) => updateVariable('carga_horaria', v)}
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
            <FormInput
              label="Carga Horária Total"
              value={variables.carga_horaria_total || ''}
              onChange={(v) => updateVariable('carga_horaria_total', v)}
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <FormInput
              label="Duração da Aula"
              value={variables.duracao_aula || ''}
              onChange={(v) => updateVariable('duracao_aula', v)}
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
            <FormInput
              label="Carga Grupo"
              value={variables.carga_grupo || ''}
              onChange={(v) => updateVariable('carga_grupo', v)}
              placeholder="0"
              inputMode="numeric"
              suffix="horas"
            />
            <FormInput
              label="Carga Individual"
              value={variables.carga_individual || ''}
              onChange={(v) => updateVariable('carga_individual', v)}
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
      </FormSection>

      {/* Condições de Pagamento */}
      <FormSection
        id="pagamento"
        title="Condições de Pagamento"
        icon={<CreditCard className="w-4 h-4" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <FormInput
          label="Valor Total"
          value={
            isPrivate
              ? `R$ ${variables.valor_total || '0,00'}`
              : variables.valor_total || ''
          }
          onChange={(v) => updateVariable('valor_total', v)}
          placeholder="0,00"
          readOnly={isPrivate}
          inputMode={isPrivate ? undefined : 'decimal'}
        />
        {isPrivate && (
          <p className="text-xs text-gray-400 -mt-2">
            Calculado automaticamente (valor por aula x carga horária)
          </p>
        )}
        <FormInput
          label="Parcelas"
          value={variables.parcelas || ''}
          onChange={(v) => updateVariable('parcelas', v)}
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
      </FormSection>

      {/* Datas */}
      <FormSection
        id="datas"
        title="Datas"
        icon={<Calendar className="w-4 h-4" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <FormInput
          label="Data do Contrato"
          value={variables.data_contrato || ''}
          onChange={(v) => updateVariable('data_contrato', v)}
          type="date"
        />
        <FormInput
          label="Data de Início"
          value={variables.data_inicio || ''}
          onChange={(v) => updateVariable('data_inicio', v)}
          type="date"
        />
      </FormSection>
    </div>
  );
}
