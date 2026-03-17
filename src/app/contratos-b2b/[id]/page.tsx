'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractEditor } from '@/components/contracts/ContractEditor';
import { ContractForm } from '@/components/contracts/ContractForm';
import { AISuggestionsPanel } from '@/components/contracts/AISuggestionsPanel';
import { VersionHistory } from '@/components/contracts/VersionHistory';
import { SignatureModal } from '@/components/contracts/SignatureModal';
import {
  Save,
  FileText,
  Loader2,
  ArrowLeft,
  Download,
  Send,
  Clock,
  FileDown,
  Check,
} from 'lucide-react';
import {
  ContractType,
  ContractVariables,
  ContractProgramData,
  ContractVersionData,
  CompanyData,
  AISuggestion,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  ContractStatus,
  SignatoryData,
} from '@/types/contracts';
import { generateRuleBasedSuggestions } from '@/lib/contracts/ai-engine';
import { useAutoSave } from '@/hooks/useAutoSave';

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Dados do contrato
  const [contractId, setContractId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractStatus, setContractStatus] = useState<ContractStatus>('DRAFT');
  const [contractType, setContractType] = useState<ContractType>('CORPORATIVO');
  const [brand, setBrand] = useState('alumni');
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [variables, setVariables] = useState<Partial<ContractVariables>>({});
  const [programs, setPrograms] = useState<ContractProgramData[]>([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [versions, setVersions] = useState<ContractVersionData[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);

  // IA
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Carregar contrato
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const [contractRes, companiesRes] = await Promise.all([
          fetch(`/api/contracts/${id}`),
          fetch('/api/companies'),
        ]);

        const contractData = await contractRes.json();
        const companiesData = await companiesRes.json();

        if (contractData.success) {
          const c = contractData.data;
          setContractId(c.id);
          setContractNumber(c.number);
          setContractStatus(c.status);
          setContractType(c.type);
          setBrand(c.brand);
          setTitle(c.title);
          setCompanyId(c.companyId);
          setVariables(c.contractData || {});
          setPrograms(c.programs || []);
          setHtmlContent(c.htmlContent || '');
          setVersions(c.versions || []);
          setCurrentVersion(c.currentVersion);
        }

        if (companiesData.success) {
          setCompanies(companiesData.data);
        }
      } catch (err) {
        console.error('Erro ao carregar contrato:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  // Salvar contrato
  const handleSave = useCallback(
    async (createVersion = false) => {
      setSaving(true);
      setAutoSaveStatus('saving');
      try {
        const totalValue = programs.reduce((sum, p) => sum + (p.valorTotal || 0), 0);
        const response = await fetch(`/api/contracts/${contractId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            type: contractType,
            brand,
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
            saveVersion: createVersion,
            changeNote: createVersion ? `Versão ${currentVersion + 1}` : undefined,
          }),
        });

        const result = await response.json();
        if (result.success && createVersion) {
          setCurrentVersion(currentVersion + 1);
          // Reload versões
          const vRes = await fetch(`/api/contracts/${contractId}/versions`);
          const vData = await vRes.json();
          if (vData.success) setVersions(vData.data);
        }

        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Erro ao salvar:', err);
        setAutoSaveStatus('idle');
      } finally {
        setSaving(false);
      }
    },
    [contractId, title, contractType, brand, variables, htmlContent, programs, currentVersion]
  );

  // Autosave
  useAutoSave({
    data: { htmlContent, variables, programs },
    onSave: () => handleSave(false),
    interval: 10000,
    enabled: !!contractId && contractStatus === 'DRAFT',
  });

  // Restaurar versão
  const handleRestoreVersion = async (version: ContractVersionData) => {
    if (!confirm(`Restaurar para versão ${version.version}?`)) return;

    try {
      const response = await fetch(
        `/api/contracts/${contractId}/versions/${version.id}`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (result.success) {
        setHtmlContent(version.htmlContent);
        setVariables(version.contractData);
        setCurrentVersion(result.data.currentVersion);
        setVersions(result.data.versions);
      }
    } catch (err) {
      console.error('Erro ao restaurar:', err);
    }
  };

  // Sugestões IA
  const refreshSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    const ruleSuggestions = generateRuleBasedSuggestions({
      contractData: variables,
      programs,
      htmlContent,
      contractType,
    });
    setSuggestions(ruleSuggestions);

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
      // LLM falhou silenciosamente
    }
    setSuggestionsLoading(false);
  }, [variables, programs, htmlContent, contractType]);

  // Inserir sugestão
  const handleInsertSuggestion = useCallback((clauseHtml: string) => {
    const insertFn = (window as unknown as Record<string, (html: string) => void>)
      .__contractEditorInsertHTML;
    if (insertFn) {
      insertFn(clauseHtml);
    } else {
      setHtmlContent((prev) => prev + clauseHtml);
    }
  }, []);

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/generate-pdf`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        // Abrir HTML em nova janela e imprimir como PDF
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(result.data.html);
          win.document.close();
          setTimeout(() => win.print(), 500);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  // Download DOCX
  const handleDownloadDocx = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/generate-docx`, {
        method: 'POST',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato_${contractNumber}_v${currentVersion}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro ao gerar DOCX:', err);
    }
  };

  // Enviar para assinatura
  const handleSendSignature = async (signatories: SignatoryData[]) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/send-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories, pdfUrl: '' }),
      });
      const result = await response.json();
      if (result.success) {
        setContractStatus('SENT_FOR_SIGNATURE');
        alert('Contrato enviado para assinatura com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao enviar para assinatura:', err);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-2 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/contratos-b2b')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-bold text-gray-900 border-none focus:outline-none bg-transparent"
                />
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contractStatus]}`}
                >
                  {CONTRACT_STATUS_LABELS[contractStatus]}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {contractNumber} • v{currentVersion}
                {autoSaveStatus === 'saving' && ' • Salvando...'}
                {autoSaveStatus === 'saved' && ' • Salvo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <Clock className="w-4 h-4" />
              Versões
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              title="Download PDF"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleDownloadDocx}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              title="Download DOCX"
            >
              <Download className="w-4 h-4" />
              DOCX
            </button>
            <button
              onClick={() => setShowSignature(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
              Assinar
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Salvar Versão
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Esquerda - Formulário ou Versões */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
            {showVersions ? (
              <>
                <button
                  onClick={() => setShowVersions(false)}
                  className="text-sm text-blue-600 hover:underline mb-3 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Voltar ao formulário
                </button>
                <VersionHistory
                  versions={versions}
                  currentVersion={currentVersion}
                  onRestore={handleRestoreVersion}
                  onPreview={() => {}}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </aside>

          {/* Editor Central */}
          <main className="flex-1 overflow-hidden">
            <ContractEditor content={htmlContent} onChange={setHtmlContent} />
          </main>

          {/* Sidebar Direita - Sugestões IA */}
          <AISuggestionsPanel
            suggestions={suggestions}
            loading={suggestionsLoading}
            isOpen={showSuggestions}
            onToggle={() => setShowSuggestions(!showSuggestions)}
            onInsert={handleInsertSuggestion}
            onDismiss={(suggestionId) =>
              setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
            }
            onRefresh={refreshSuggestions}
          />
        </div>
      </div>

      {/* Modal de Assinatura */}
      {showSignature && (
        <SignatureModal
          contractTitle={title}
          onSend={handleSendSignature}
          onClose={() => setShowSignature(false)}
        />
      )}
    </DashboardLayout>
  );
}
