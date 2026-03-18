'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Building2,
  User,
  Loader2,
} from 'lucide-react';
import {
  SignatoryData,
  SIGNATORY_STATUS_COLORS,
  SIGNATORY_STATUS_LABELS,
} from '@/types/contracts';

interface SignatureStatusPanelProps {
  contractId: string;
  onStatusChange?: (status: string) => void;
}

export function SignatureStatusPanel({
  contractId,
  onStatusChange,
}: SignatureStatusPanelProps) {
  const [signatories, setSignatories] = useState<SignatoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/contracts/${contractId}/signature-status`
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
    // Polling a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const copyLink = async (signUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(signUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = signUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
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

  // Agrupar por role
  const contratanteSignatories = signatories.filter(
    (s) => s.role === 'contratante'
  );
  const contratadaSignatories = signatories.filter(
    (s) => s.role === 'contratada'
  );

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    group: SignatoryData[]
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {icon}
        {title}
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
                <p className="text-xs text-gray-500">
                  {signatory.signatoryType === 'responsavel'
                    ? 'Responsável'
                    : 'Testemunha'}{' '}
                  &middot; {signatory.email}
                </p>
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
      {/* Header */}
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

      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${totalCount > 0 ? (signedCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Signatários agrupados */}
      {contratanteSignatories.length > 0 &&
        renderGroup(
          'Contratante',
          <Building2 className="w-3.5 h-3.5" />,
          contratanteSignatories
        )}

      {contratadaSignatories.length > 0 &&
        renderGroup(
          'Contratada',
          <User className="w-3.5 h-3.5" />,
          contratadaSignatories
        )}
    </div>
  );
}
