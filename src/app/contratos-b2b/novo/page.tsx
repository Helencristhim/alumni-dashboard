'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractEditor } from '@/components/contracts/ContractEditor';
import { ContractForm } from '@/components/contracts/ContractForm';
import { AISuggestionsPanel } from '@/components/contracts/AISuggestionsPanel';
import {
  Save,
  FileText,
  Loader2,
  ArrowLeft,
  Wand2,
} from 'lucide-react';
import {
  ContractType,
  ContractVariables,
  ContractProgramData,
  CompanyData,
} from '@/types/contracts';
import { generateContractHTML } from '@/lib/contracts/clause-generator';
import { BRAND_DEFAULTS } from '@/lib/contracts/templates';
import { generateRuleBasedSuggestions } from '@/lib/contracts/ai-engine';
import { AISuggestion } from '@/types/contracts';

export default function NovoContratoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Dados do contrato
  const [contractType, setContractType] = useState<ContractType>('CORPORATIVO');
  const [brand, setBrand] = useState('alumni');
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [variables, setVariables] = useState<Partial<ContractVariables>>({});
  const [programs, setPrograms] = useState<ContractProgramData[]>([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [companies, setCompanies] = useState<CompanyData[]>([]);

  // IA
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Carregar empresas
  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCompanies(data.data);
      })
      .catch(console.error);
  }, []);

  // Aplicar dados da marca quando muda
  useEffect(() => {
    const defaults = BRAND_DEFAULTS[brand];
    if (defaults) {
      setVariables((prev) => ({
        ...prev,
        ...defaults,
      }));
    }
  }, [brand]);

  // Gerar contrato automaticamente
  const handleGenerateContract = useCallback(() => {
    const html = generateContractHTML({
      type: contractType,
      brand,
      variables,
      programs,
    });
    setHtmlContent(html);
    setTitle(
      `Contrato ${brand === 'alumni' ? 'Alumni' : 'Better'} - ${variables.razao_social || 'Empresa'}`
    );
  }, [contractType, brand, variables, programs]);

  // Atualizar sugestões IA
  const refreshSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);

    // Regras (instantâneo)
    const ruleSuggestions = generateRuleBasedSuggestions({
      contractData: variables,
      programs,
      htmlContent,
      contractType,
    });
    setSuggestions(ruleSuggestions);

    // LLM (async)
    try {
      const response = await fetch('/api/contracts/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractData: variables,
          programs,
          contractType,
          htmlContent: htmlContent.substring(0, 3000),
        }),
      });
      const data = await response.json();
      if (data.suggestions?.length > 0) {
        setSuggestions((prev) => [...prev, ...data.suggestions]);
      }
    } catch {
      // LLM falhou silenciosamente - regras já estão carregadas
    }

    setSuggestionsLoading(false);
  }, [variables, programs, htmlContent, contractType]);

  // Inserir sugestão no editor
  const handleInsertSuggestion = useCallback(
    (clauseHtml: string) => {
      const insertFn = (window as unknown as Record<string, (html: string) => void>)
        .__contractEditorInsertHTML;
      if (insertFn) {
        insertFn(clauseHtml);
      } else {
        setHtmlContent((prev) => prev + clauseHtml);
      }
    },
    []
  );

  // Dispensar sugestão
  const handleDismissSuggestion = useCallback(
    (id: string) => {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  // Salvar contrato
  const handleSave = async () => {
    if (!companyId) {
      alert('Selecione uma empresa antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const totalValue = programs.reduce((sum, p) => sum + (p.valorTotal || 0), 0);
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Novo Contrato',
          type: contractType,
          brand,
          companyId,
          contractData: variables,
          htmlContent,
          valorTotal: totalValue,
          formaPagamento: variables.forma_pagamento,
          diaEmissaoNf: variables.dia_emissao_nf
            ? parseInt(variables.dia_emissao_nf)
            : undefined,
          diaVencimento: variables.dia_vencimento
            ? parseInt(variables.dia_vencimento)
            : undefined,
          dataInicio: variables.data_inicio,
          dataFim: variables.data_fim,
          prazoMeses: variables.prazo_meses
            ? parseInt(variables.prazo_meses)
            : undefined,
          programs,
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/contratos-b2b/${result.data.id}`);
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
    variables?: Partial<ContractVariables>;
    programs?: ContractProgramData[];
    type?: ContractType;
    brand?: string;
    companyId?: string;
  }) => {
    if (data.variables) setVariables(data.variables);
    if (data.programs) setPrograms(data.programs);
    if (data.type) setContractType(data.type);
    if (data.brand) setBrand(data.brand);
    if (data.companyId) setCompanyId(data.companyId);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-2 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/contratos-b2b')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do contrato..."
                className="text-lg font-bold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent"
              />
              <p className="text-xs text-gray-500">Novo contrato • Rascunho</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateContract}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Wand2 className="w-4 h-4" />
              Gerar Contrato
            </button>
            <button
              onClick={refreshSuggestions}
              disabled={suggestionsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <FileText className="w-4 h-4" />
              Analisar IA
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
          {/* Sidebar Esquerda - Formulário */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Dados do Contrato
            </h3>
            <ContractForm
              variables={variables}
              programs={programs}
              contractType={contractType}
              brand={brand}
              companies={companies}
              selectedCompanyId={companyId}
              onChange={handleFormChange}
            />
          </aside>

          {/* Editor Central */}
          <main className="flex-1 overflow-hidden">
            <ContractEditor
              content={htmlContent}
              onChange={setHtmlContent}
            />
          </main>

          {/* Sidebar Direita - Sugestões IA */}
          <AISuggestionsPanel
            suggestions={suggestions}
            loading={suggestionsLoading}
            isOpen={showSuggestions}
            onToggle={() => setShowSuggestions(!showSuggestions)}
            onInsert={handleInsertSuggestion}
            onDismiss={handleDismissSuggestion}
            onRefresh={refreshSuggestions}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
