'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractEditor } from '@/components/contracts/ContractEditor';
import { B2CContractForm } from '@/components/b2c-contracts/B2CContractForm';
import {
  Save,
  FileText,
  Loader2,
  ArrowLeft,
  Wand2,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  B2CContractType,
  B2CContractVariables,
  B2C_CONTRACT_TYPE_LABELS,
} from '@/types/b2c-contracts';
import {
  B2C_TEMPLATES,
  replaceB2CVariables,
} from '@/lib/b2c-contracts/templates';

export default function NovoContratoB2CPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Dados do contrato
  const [contractType, setContractType] = useState<B2CContractType>('PRIVATE');
  const [brand, setBrand] = useState('alumni');
  const [title, setTitle] = useState('');
  const [variables, setVariables] = useState<Partial<B2CContractVariables>>({});
  const [htmlContent, setHtmlContent] = useState('');

  // Track if contract was generated (to enable auto-update)
  const [contractGenerated, setContractGenerated] = useState(false);
  const prevVariablesRef = useRef<string>('');

  // Template info
  const [templateInfo, setTemplateInfo] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [showTemplateInfo, setShowTemplateInfo] = useState(true);

  // Carregar info do template quando tipo muda
  useEffect(() => {
    fetch('/api/b2c-contracts/templates')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const tpl = data.data.find(
            (t: { type: string }) => t.type === contractType
          );
          if (tpl) {
            setTemplateInfo({ name: tpl.name, description: tpl.description });
          }
        }
      })
      .catch(console.error);
  }, [contractType]);

  // Build variable map from B2CContractVariables for template replacement
  const buildVariableMap = useCallback(
    (vars: Partial<B2CContractVariables>): Record<string, string> => {
      const map: Record<string, string> = {};

      // Student data maps to template placeholders
      if (vars.nomeAluno) map.nome = vars.nomeAluno;
      if (vars.cpfAluno) map.cpf = vars.cpfAluno;
      if (vars.emailAluno) map.email = vars.emailAluno;
      if (vars.telefoneAluno) map.telefone = vars.telefoneAluno;
      if (vars.enderecoAluno) map.endereco = vars.enderecoAluno;

      // Financial
      if (vars.valor_total) map.valor_total = vars.valor_total;
      if (vars.forma_pagamento) map.forma_pagamento = vars.forma_pagamento;
      if (vars.parcelas) map.parcelas = vars.parcelas;

      // Program
      if (vars.formato) map.formato = vars.formato;
      if (vars.valor_por_aula) map.valor_por_aula = vars.valor_por_aula;
      if (vars.carga_horaria) map.carga_horaria = vars.carga_horaria;
      if (vars.carga_horaria_total) map.carga_horaria_total = vars.carga_horaria_total;
      if (vars.duracao_aula) map.duracao_aula = vars.duracao_aula;
      if (vars.carga_grupo) map.carga_grupo = vars.carga_grupo;
      if (vars.carga_individual) map.carga_individual = vars.carga_individual;

      // Dates
      if (vars.data_contrato) {
        map.data_contrato = new Date(vars.data_contrato).toLocaleDateString('pt-BR');
      }
      if (vars.data_inicio) {
        map.data_inicio = new Date(vars.data_inicio).toLocaleDateString('pt-BR');
      }

      return map;
    },
    []
  );

  // Gerar contrato a partir do template
  const handleGenerateContract = useCallback(() => {
    const template = B2C_TEMPLATES[contractType];
    if (!template) return;

    const varMap = buildVariableMap(variables);
    const html = replaceB2CVariables(template, varMap);
    setHtmlContent(html);
    setContractGenerated(true);

    // Auto-generate title
    const typeLabel = B2C_CONTRACT_TYPE_LABELS[contractType];
    const studentName = variables.nomeAluno || 'Aluno';
    setTitle(`${typeLabel} - ${studentName}`);
  }, [contractType, variables, buildVariableMap]);

  // Auto-update contract content when variables change (only after first generation)
  useEffect(() => {
    if (!contractGenerated) return;

    const serialized = JSON.stringify(variables);
    if (serialized === prevVariablesRef.current) return;
    prevVariablesRef.current = serialized;

    const template = B2C_TEMPLATES[contractType];
    if (!template) return;

    const varMap = buildVariableMap(variables);
    const html = replaceB2CVariables(template, varMap);
    setHtmlContent(html);
  }, [variables, contractType, contractGenerated, buildVariableMap]);

  // Salvar contrato
  const handleSave = async () => {
    if (!variables.nomeAluno) {
      alert('Preencha o nome do aluno antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const valorTotal = variables.valor_total
        ? parseFloat(variables.valor_total.replace('.', '').replace(',', '.'))
        : 0;
      const parcelas = variables.parcelas ? parseInt(variables.parcelas, 10) : 1;

      const response = await fetch('/api/b2c-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Novo Contrato B2C',
          type: contractType,
          brand,
          nomeAluno: variables.nomeAluno,
          cpfAluno: variables.cpfAluno,
          emailAluno: variables.emailAluno,
          telefoneAluno: variables.telefoneAluno,
          enderecoAluno: variables.enderecoAluno,
          valorTotal,
          formaPagamento: variables.forma_pagamento,
          tipoCobranca: variables.tipo_cobranca,
          parcelas,
          contractData: variables,
          htmlContent,
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/contratos-b2c/${result.data.id}`);
      } else {
        alert('Erro ao salvar contrato');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar contrato');
    } finally {
      setSaving(false);
    }
  };

  // Atualizar form
  const handleFormChange = (data: {
    variables?: Partial<B2CContractVariables>;
    type?: B2CContractType;
    brand?: string;
  }) => {
    if (data.variables) setVariables(data.variables);
    if (data.type) setContractType(data.type);
    if (data.brand) setBrand(data.brand);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-2 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/contratos-b2c')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titulo do contrato..."
                className="text-lg font-bold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent"
              />
              <p className="text-xs text-gray-500">Novo contrato B2C &bull; Rascunho</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Template */}
            <div className="relative">
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as B2CContractType)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Object.entries(B2C_CONTRACT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleGenerateContract}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Wand2 className="w-4 h-4" />
              Gerar Contrato
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Esquerda - Formulario */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Dados do Contrato
            </h3>
            <B2CContractForm
              variables={variables}
              contractType={contractType}
              brand={brand}
              onChange={handleFormChange}
            />
          </aside>

          {/* Editor Central */}
          <main className="flex-1 overflow-hidden">
            <ContractEditor
              content={htmlContent}
              onChange={setHtmlContent}
              brand={brand}
            />
          </main>

          {/* Sidebar Direita - Info do Template */}
          {showTemplateInfo && (
            <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" />
                  Template Info
                </h4>
                <button
                  onClick={() => setShowTemplateInfo(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Fechar
                </button>
              </div>

              {/* Template selecionado */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-purple-900">
                  {templateInfo?.name || B2C_CONTRACT_TYPE_LABELS[contractType]}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {templateInfo?.description || 'Selecione o tipo de contrato para ver detalhes.'}
                </p>
              </div>

              {/* Instrucoes por tipo */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Como usar
                </h5>
                <ol className="space-y-2 text-xs text-gray-600">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    Preencha os dados do aluno no formulario ao lado
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    Selecione o tipo de contrato e preencha os detalhes do programa
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    Clique em &quot;Gerar Contrato&quot; para carregar o template com as variaveis preenchidas
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    Edite o contrato no editor central se necessario
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      5
                    </span>
                    Clique em &quot;Salvar&quot; para criar o contrato
                  </li>
                </ol>
              </div>

              {/* Variaveis do template */}
              <div className="mt-4 space-y-3">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Variaveis do Template
                </h5>
                <div className="space-y-1">
                  {contractType === 'PRIVATE' && (
                    <>
                      <VariableChip label="nome" filled={!!variables.nomeAluno} />
                      <VariableChip label="cpf" filled={!!variables.cpfAluno} />
                      <VariableChip label="email" filled={!!variables.emailAluno} />
                      <VariableChip label="telefone" filled={!!variables.telefoneAluno} />
                      <VariableChip label="endereco" filled={!!variables.enderecoAluno} />
                      <VariableChip label="formato" filled={!!variables.formato} />
                      <VariableChip label="carga_horaria" filled={!!variables.carga_horaria} />
                      <VariableChip label="valor_total" filled={!!variables.valor_total} />
                      <VariableChip label="valor_por_aula" filled={!!variables.valor_por_aula} />
                      <VariableChip label="parcelas" filled={!!variables.parcelas} />
                      <VariableChip label="forma_pagamento" filled={!!variables.forma_pagamento} />
                      <VariableChip label="data_contrato" filled={!!variables.data_contrato} />
                      <VariableChip label="data_inicio" filled={!!variables.data_inicio} />
                    </>
                  )}
                  {contractType === 'COMMUNITY' && (
                    <>
                      <VariableChip label="nome" filled={!!variables.nomeAluno} />
                      <VariableChip label="cpf" filled={!!variables.cpfAluno} />
                      <VariableChip label="email" filled={!!variables.emailAluno} />
                      <VariableChip label="telefone" filled={!!variables.telefoneAluno} />
                      <VariableChip label="endereco" filled={!!variables.enderecoAluno} />
                      <VariableChip label="formato" filled={!!variables.formato} />
                      <VariableChip label="carga_horaria_total" filled={!!variables.carga_horaria_total} />
                      <VariableChip label="duracao_aula" filled={!!variables.duracao_aula} />
                      <VariableChip label="valor_total" filled={!!variables.valor_total} />
                      <VariableChip label="parcelas" filled={!!variables.parcelas} />
                      <VariableChip label="forma_pagamento" filled={!!variables.forma_pagamento} />
                      <VariableChip label="data_contrato" filled={!!variables.data_contrato} />
                      <VariableChip label="data_inicio" filled={!!variables.data_inicio} />
                    </>
                  )}
                  {contractType === 'COMMUNITY_FLOW' && (
                    <>
                      <VariableChip label="nome" filled={!!variables.nomeAluno} />
                      <VariableChip label="cpf" filled={!!variables.cpfAluno} />
                      <VariableChip label="email" filled={!!variables.emailAluno} />
                      <VariableChip label="telefone" filled={!!variables.telefoneAluno} />
                      <VariableChip label="endereco" filled={!!variables.enderecoAluno} />
                      <VariableChip label="formato" filled={!!variables.formato} />
                      <VariableChip label="carga_grupo" filled={!!variables.carga_grupo} />
                      <VariableChip label="carga_individual" filled={!!variables.carga_individual} />
                      <VariableChip label="valor_total" filled={!!variables.valor_total} />
                      <VariableChip label="parcelas" filled={!!variables.parcelas} />
                      <VariableChip label="forma_pagamento" filled={!!variables.forma_pagamento} />
                      <VariableChip label="data_contrato" filled={!!variables.data_contrato} />
                      <VariableChip label="data_inicio" filled={!!variables.data_inicio} />
                    </>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Componente auxiliar para chips de variavel
function VariableChip({ label, filled }: { label: string; filled: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs mr-1 mb-1 ${
        filled
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-50 text-gray-500 border border-gray-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          filled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      {`{{${label}}}`}
    </div>
  );
}
