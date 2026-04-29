'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractEditor } from '@/components/contracts/ContractEditor';
import { B2CContractForm } from '@/components/b2c-contracts/B2CContractForm';
import { VersionHistory } from '@/components/contracts/VersionHistory';
import {
  FileText,
  Loader2,
  ArrowLeft,
  Send,
  Clock,
  FileDown,
  Check,
  Lock,
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink,
  Building2,
  User,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  B2CContractType,
  B2CContractStatus,
  B2CContractVariables,
  B2CContractVersionData,
  B2C_CONTRACT_STATUS_LABELS,
  B2C_CONTRACT_STATUS_COLORS,
  B2CSignatoryData,
} from '@/types/b2c-contracts';
import {
  ContractVersionData,
  SignatoryData,
  SIGNATORY_STATUS_COLORS,
  SIGNATORY_STATUS_LABELS,
} from '@/types/contracts';
import { useAutoSave } from '@/hooks/useAutoSave';

export default function EditContratoB2CPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showSignatureStatus, setShowSignatureStatus] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Dados do contrato
  const [contractId, setContractId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractStatus, setContractStatus] = useState<B2CContractStatus>('DRAFT');
  const [contractType, setContractType] = useState<B2CContractType>('PRIVATE');
  const [brand, setBrand] = useState('alumni');
  const [title, setTitle] = useState('');
  const [variables, setVariables] = useState<Partial<B2CContractVariables>>({});
  const [htmlContent, setHtmlContent] = useState('');
  const [versions, setVersions] = useState<B2CContractVersionData[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);

  // Contrato bloqueado?
  const isLocked =
    contractStatus === 'SIGNED' ||
    contractStatus === 'ACTIVE';

  // Aguardando assinatura?
  const isPendingSignature = contractStatus === 'SENT_FOR_SIGNATURE';

  // Carregar contrato
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/b2c-contracts/${id}`);
        const data = await response.json();

        if (data.success) {
          const c = data.data;
          setContractId(c.id);
          setContractNumber(c.number);
          setContractStatus(c.status);
          setContractType(c.type);
          setBrand(c.brand);
          setTitle(c.title);
          setVariables(c.contractData || {});
          setHtmlContent(c.htmlContent || '');
          setVersions(c.versions || []);
          setCurrentVersion(c.currentVersion);

          // Se aguardando assinatura ou assinado, mostrar painel de status
          if (c.status === 'SENT_FOR_SIGNATURE' || c.status === 'SIGNED') {
            setShowSignatureStatus(true);
          }
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
      if (isLocked) return;
      setSaving(true);
      setAutoSaveStatus('saving');
      try {
        const valorTotal = variables.valor_total
          ? parseFloat(variables.valor_total.replace('.', '').replace(',', '.'))
          : 0;
        const parcelas = variables.parcelas ? parseInt(variables.parcelas, 10) : 1;

        const response = await fetch(`/api/b2c-contracts/${contractId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
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
            saveVersion: createVersion,
            changeNote: createVersion ? `Versao ${currentVersion + 1}` : undefined,
          }),
        });

        const result = await response.json();
        if (result.success && createVersion) {
          setCurrentVersion(currentVersion + 1);
          // Reload versions
          const vRes = await fetch(`/api/b2c-contracts/${contractId}/versions`);
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
    [contractId, title, contractType, brand, variables, htmlContent, currentVersion, isLocked]
  );

  // Autosave (apenas em rascunho)
  useAutoSave({
    data: { htmlContent, variables },
    onSave: () => handleSave(false),
    interval: 10000,
    enabled: !!contractId && contractStatus === 'DRAFT',
  });

  // Restaurar versao
  const handleRestoreVersion = async (version: ContractVersionData) => {
    if (isLocked) return;
    if (!confirm(`Restaurar para versao ${version.version}?`)) return;

    try {
      const response = await fetch(
        `/api/b2c-contracts/${contractId}/versions/${version.id}`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (result.success) {
        setHtmlContent(version.htmlContent);
        if (version.contractData) {
          setVariables(version.contractData as Partial<B2CContractVariables>);
        }
        setCurrentVersion(result.data.currentVersion);
        setVersions(result.data.versions);
      }
    } catch (err) {
      console.error('Erro ao restaurar:', err);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/b2c-contracts/${contractId}/generate-pdf`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
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
      const response = await fetch(`/api/b2c-contracts/${contractId}/generate-docx`, {
        method: 'POST',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') || 'contrato.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro ao gerar DOCX:', err);
    }
  };

  // Enviar para assinatura (B2C: 1 aluno + 1 representante)
  const handleSendSignature = async (signatories: B2CSignatoryData[]) => {
    try {
      const response = await fetch(`/api/b2c-contracts/${contractId}/send-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar para assinatura');
      }

      setContractStatus('SENT_FOR_SIGNATURE');
      setShowSignature(false);
      setShowSignatureStatus(true);
    } catch (err) {
      throw err;
    }
  };

  // Atualizar form
  const handleFormChange = (data: {
    variables?: Partial<B2CContractVariables>;
    type?: B2CContractType;
    brand?: string;
  }) => {
    if (isLocked) return;
    if (data.variables) setVariables(data.variables);
    if (data.type) setContractType(data.type);
    if (data.brand) setBrand(data.brand);
  };

  // Callback de mudanca de status via painel de assinatura
  const handleSignatureStatusChange = (newStatus: string) => {
    if (newStatus !== contractStatus) {
      setContractStatus(newStatus as B2CContractStatus);
    }
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
              onClick={() => router.push('/contratos-b2c')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                {isLocked ? (
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    {title}
                  </span>
                ) : (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-bold text-gray-900 border-none focus:outline-none bg-transparent"
                  />
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${B2C_CONTRACT_STATUS_COLORS[contractStatus]}`}
                >
                  {B2C_CONTRACT_STATUS_LABELS[contractStatus]}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {contractNumber} &bull; v{currentVersion}
                {autoSaveStatus === 'saving' && ' \u2022 Salvando...'}
                {autoSaveStatus === 'saved' && ' \u2022 Salvo'}
                {isLocked && ' \u2022 Bloqueado para edicao'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botao Status Assinatura */}
            {(contractStatus === 'SENT_FOR_SIGNATURE' || contractStatus === 'SIGNED') && (
              <button
                onClick={() => {
                  setShowSignatureStatus(!showSignatureStatus);
                  setShowVersions(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showSignatureStatus
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {contractStatus === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                Assinaturas
              </button>
            )}

            <button
              onClick={() => {
                setShowVersions(!showVersions);
                setShowSignatureStatus(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                showVersions
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Versoes
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
              title="Download Word"
            >
              <FileDown className="w-4 h-4" />
              Word
            </button>

            {/* Botão Status Assinatura */}
            {(contractStatus === 'SENT_FOR_SIGNATURE' || contractStatus === 'SIGNED') && (
              <button
                onClick={() => {
                  setShowSignatureStatus(!showSignatureStatus);
                  setShowVersions(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showSignatureStatus
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {contractStatus === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                Assinaturas
              </button>
            )}

            {(!isLocked || isPendingSignature) && (
              <button
                onClick={() => setShowSignature(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                {isPendingSignature ? 'Reenviar' : 'Assinar'}
              </button>
            )}
            {!isLocked && !isPendingSignature && (
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Salvar Versao
              </button>
            )}
          </div>
        </div>

        {/* Banner de bloqueio */}
        {isLocked && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
            <Lock className="w-4 h-4" />
            {contractStatus === 'SIGNED'
              ? 'Este contrato foi assinado por todas as partes e esta bloqueado.'
              : 'Este contrato esta ativo e nao pode ser editado.'}
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Esquerda */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
            {showSignatureStatus && contractId ? (
              <>
                <button
                  onClick={() => setShowSignatureStatus(false)}
                  className="text-sm text-purple-600 hover:underline mb-3 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Voltar ao formulario
                </button>
                <B2CSignatureStatusPanel
                  contractId={contractId}
                  onStatusChange={handleSignatureStatusChange}
                />
              </>
            ) : showVersions ? (
              <>
                <button
                  onClick={() => setShowVersions(false)}
                  className="text-sm text-blue-600 hover:underline mb-3 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Voltar ao formulario
                </button>
                <VersionHistory
                  versions={versions as unknown as ContractVersionData[]}
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
                <B2CContractForm
                  variables={variables}
                  contractType={contractType}
                  brand={brand}
                  onChange={handleFormChange}
                />
              </>
            )}
          </aside>

          {/* Editor Central */}
          <main className="flex-1 overflow-hidden">
            <ContractEditor
              content={htmlContent}
              onChange={isLocked ? () => {} : setHtmlContent}
              brand={brand}
            />
          </main>
        </div>
      </div>

      {/* Modal de Assinatura B2C */}
      {showSignature && (
        <B2CSignatureModal
          contractTitle={title}
          contractVariables={variables}
          onSend={handleSendSignature}
          onClose={() => setShowSignature(false)}
        />
      )}
    </DashboardLayout>
  );
}

// =============================================================================
// B2CSignatureStatusPanel — uses /api/b2c-contracts/[id]/signature-status
// =============================================================================

function B2CSignatureStatusPanel({
  contractId,
  onStatusChange,
}: {
  contractId: string;
  onStatusChange?: (status: string) => void;
}) {
  const [signatories, setSignatories] = useState<SignatoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/b2c-contracts/${contractId}/signature-status`
      );
      const result = await response.json();
      if (result.success) {
        setSignatories(result.data.signatories);
        if (onStatusChange && result.data.status) {
          onStatusChange(result.data.status);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contractId, onStatusChange]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleEditEmail = (signatory: SignatoryData) => {
    setEditingEmailId(signatory.id || signatory.email);
    setEditEmailValue(signatory.email);
  };

  const handleSaveEmail = async (signatoryId: string) => {
    if (!editEmailValue || !editEmailValue.includes('@')) return;
    setSavingEmail(true);
    try {
      const response = await fetch(
        `/api/b2c-contracts/${contractId}/signatories/${signatoryId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: editEmailValue }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setSignatories((prev) =>
          prev.map((s) =>
            s.id === signatoryId ? { ...s, email: editEmailValue } : s
          )
        );
        setEditingEmailId(null);
      } else {
        alert(result.error || 'Erro ao atualizar email');
      }
    } catch {
      alert('Erro ao atualizar email');
    } finally {
      setSavingEmail(false);
    }
  };

  const copyLink = async (signUrl: string, signId: string) => {
    try {
      await navigator.clipboard.writeText(signUrl);
      setCopiedId(signId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = signUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(signId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'refused':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const signedCount = signatories.filter((s) => s.status === 'signed').length;
  const totalCount = signatories.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
      </div>
    );
  }

  if (signatories.length === 0) return null;

  const contratanteSignatories = signatories.filter(
    (s) => s.role === 'contratante'
  );
  const contratadaSignatories = signatories.filter(
    (s) => s.role === 'contratada'
  );

  const renderGroup = (
    groupTitle: string,
    icon: React.ReactNode,
    group: SignatoryData[]
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {icon}
        {groupTitle}
      </div>
      {group.map((signatory) => (
        <div
          key={signatory.id || signatory.email}
          className="bg-white rounded-lg border border-gray-100 p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(signatory.status || 'pending')}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {signatory.name}
                </p>
                {editingEmailId === (signatory.id || signatory.email) ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="email"
                      value={editEmailValue}
                      onChange={(e) => setEditEmailValue(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && signatory.id) handleSaveEmail(signatory.id);
                        if (e.key === 'Escape') setEditingEmailId(null);
                      }}
                    />
                    <button
                      onClick={() => signatory.id && handleSaveEmail(signatory.id)}
                      disabled={savingEmail}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      {savingEmail ? '...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditingEmailId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    {signatory.signatoryType === 'responsavel'
                      ? 'Responsavel'
                      : 'Testemunha'}{' '}
                    &middot; {signatory.email}
                    {signatory.status !== 'signed' && (
                      <button
                        onClick={() => handleEditEmail(signatory)}
                        className="ml-1 text-purple-500 hover:text-purple-700 hover:underline"
                      >
                        (editar)
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                SIGNATORY_STATUS_COLORS[signatory.status || 'pending']
              }`}
            >
              {SIGNATORY_STATUS_LABELS[signatory.status || 'pending']}
            </span>
          </div>

          {signatory.signedAt && (
            <p className="text-xs text-green-600">
              Assinado em{' '}
              {new Date(signatory.signedAt).toLocaleString('pt-BR')}
            </p>
          )}

          {signatory.signUrl && signatory.status !== 'signed' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  copyLink(signatory.signUrl!, signatory.id || signatory.email)
                }
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copiedId === (signatory.id || signatory.email)
                  ? 'Copiado!'
                  : 'Copiar link'}
              </button>
              <a
                href={signatory.signUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Status das Assinaturas
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {signedCount} de {totalCount} assinaram
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Atualizar status"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${totalCount > 0 ? (signedCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>

      {contratanteSignatories.length > 0 &&
        renderGroup(
          'Contratante (Aluno)',
          <User className="w-3.5 h-3.5" />,
          contratanteSignatories
        )}

      {contratadaSignatories.length > 0 &&
        renderGroup(
          'Contratada (Better Education)',
          <Building2 className="w-3.5 h-3.5" />,
          contratadaSignatories
        )}
    </div>
  );
}

// =============================================================================
// B2CSignatureModal — adapted for B2C: 1 student + 1 company rep
// =============================================================================

interface B2CSignatureModalProps {
  contractTitle: string;
  contractVariables?: Partial<B2CContractVariables>;
  onSend: (signatories: B2CSignatoryData[]) => Promise<void>;
  onClose: () => void;
}

function B2CSignatureModal({
  contractTitle,
  contractVariables,
  onSend,
  onClose,
}: B2CSignatureModalProps) {
  // B2C default: 1 aluno (contratante) + 1 company rep (contratada)
  const initialSignatories: B2CSignatoryData[] = [
    {
      name: contractVariables?.nomeAluno || '',
      email: contractVariables?.emailAluno || '',
      cpf: contractVariables?.cpfAluno || '',
      role: 'contratante',
    },
    {
      name: 'Gilberto Goncalves Rodrigues',
      email: '',
      cpf: '261.791.848-08',
      role: 'contratada',
    },
  ];

  const [signatories, setSignatories] = useState<B2CSignatoryData[]>(initialSignatories);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const updateSignatory = (index: number, updates: Partial<B2CSignatoryData>) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], ...updates };
    setSignatories(updated);
  };

  const validate = (): boolean => {
    const contratante = signatories.find((s) => s.role === 'contratante');
    const contratada = signatories.find((s) => s.role === 'contratada');

    if (!contratante?.name || !contratante?.email) {
      setError('Preencha nome e email do aluno (contratante)');
      return false;
    }
    if (!contratada?.name || !contratada?.email) {
      setError('Preencha nome e email do representante da Better Education');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validSignatories = signatories.filter((s) => s.name && s.email);

    setSending(true);
    setError('');
    try {
      await onSend(validSignatories);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar para assinatura';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const contratanteSignatories = signatories
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter((s) => s.role === 'contratante');
  const contratadaSignatories = signatories
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter((s) => s.role === 'contratada');

  const renderSignatoryGroup = (
    groupTitle: string,
    icon: React.ReactNode,
    groupSignatories: (B2CSignatoryData & { originalIndex: number })[],
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {groupTitle}
      </div>

      {groupSignatories.map((signatory) => (
        <div
          key={signatory.originalIndex}
          className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100"
        >
          <input
            required
            value={signatory.name}
            onChange={(e) =>
              updateSignatory(signatory.originalIndex, { name: e.target.value })
            }
            placeholder="Nome completo *"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            required
            type="email"
            value={signatory.email}
            onChange={(e) =>
              updateSignatory(signatory.originalIndex, { email: e.target.value })
            }
            placeholder="Email *"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            value={signatory.cpf || ''}
            onChange={(e) =>
              updateSignatory(signatory.originalIndex, { cpf: e.target.value })
            }
            placeholder="CPF (opcional)"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              Enviar para Assinatura
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{contractTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-5"
        >
          {/* Info */}
          <div className="flex items-start gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              O contrato B2C sera enviado via ZapSign. O aluno e o representante
              da Better Education receberao <strong>links por e-mail</strong> para
              assinar digitalmente.
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Contratante (Aluno) */}
          {renderSignatoryGroup(
            'Aluno (Contratante)',
            <User className="w-4 h-4 text-blue-600" />,
            contratanteSignatories,
          )}

          {/* Contratada (Better Education) */}
          {renderSignatoryGroup(
            'Better Education (Contratada)',
            <Building2 className="w-4 h-4 text-indigo-600" />,
            contratadaSignatories,
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando ao ZapSign...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar via ZapSign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
