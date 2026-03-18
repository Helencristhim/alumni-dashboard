'use client';

import { useState } from 'react';
import {
  X,
  Send,
  Loader2,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  User,
  Building2,
} from 'lucide-react';
import { SignatoryData, ContractVariables } from '@/types/contracts';

interface SignatureModalProps {
  contractTitle: string;
  contractVariables?: Partial<ContractVariables>;
  onSend: (signatories: SignatoryData[]) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_SIGNATORIES: SignatoryData[] = [
  {
    name: '',
    email: '',
    cpf: '',
    role: 'contratante',
    signatoryType: 'responsavel',
  },
  {
    name: '',
    email: '',
    cpf: '',
    role: 'contratante',
    signatoryType: 'testemunha',
  },
  {
    name: '',
    email: '',
    cpf: '',
    role: 'contratada',
    signatoryType: 'responsavel',
  },
  {
    name: '',
    email: '',
    cpf: '',
    role: 'contratada',
    signatoryType: 'testemunha',
  },
];

export function SignatureModal({
  contractTitle,
  contractVariables,
  onSend,
  onClose,
}: SignatureModalProps) {
  // Pré-preencher signatários com dados do contrato
  const initialSignatories = DEFAULT_SIGNATORIES.map((s) => {
    const copy = { ...s };
    if (contractVariables) {
      if (s.role === 'contratante' && s.signatoryType === 'responsavel') {
        copy.name = contractVariables.representante_nome || '';
        copy.cpf = contractVariables.representante_cpf || '';
      }
      if (s.role === 'contratada' && s.signatoryType === 'responsavel') {
        copy.name = contractVariables.empresa_representante_nome || '';
        copy.cpf = contractVariables.empresa_representante_cpf || '';
      }
    }
    return copy;
  });

  const [signatories, setSignatories] =
    useState<SignatoryData[]>(initialSignatories);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const updateSignatory = (index: number, updates: Partial<SignatoryData>) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], ...updates };
    setSignatories(updated);
  };

  const addSignatory = (role: 'contratante' | 'contratada') => {
    setSignatories([
      ...signatories,
      { name: '', email: '', cpf: '', role, signatoryType: 'testemunha' },
    ]);
  };

  const removeSignatory = (index: number) => {
    // Não remover responsáveis obrigatórios
    const s = signatories[index];
    if (s.signatoryType === 'responsavel') return;
    setSignatories(signatories.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const contratanteResp = signatories.find(
      (s) => s.role === 'contratante' && s.signatoryType === 'responsavel'
    );
    const contratadaResp = signatories.find(
      (s) => s.role === 'contratada' && s.signatoryType === 'responsavel'
    );

    if (!contratanteResp?.name || !contratanteResp?.email) {
      setError('Preencha nome e email do responsável contratante');
      return false;
    }
    if (!contratadaResp?.name || !contratadaResp?.email) {
      setError('Preencha nome e email do responsável contratada');
      return false;
    }

    for (const s of signatories) {
      if (s.name && !s.email) {
        setError(`Preencha o email de ${s.name}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Filtrar signatários com nome e email preenchidos
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
    title: string,
    icon: React.ReactNode,
    groupSignatories: (SignatoryData & { originalIndex: number })[],
    role: 'contratante' | 'contratada'
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {title}
      </div>

      {groupSignatories.map((signatory) => (
        <div
          key={signatory.originalIndex}
          className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {signatory.signatoryType === 'responsavel'
                ? 'Responsável (Assinatura)'
                : 'Testemunha'}
            </span>
            {signatory.signatoryType === 'testemunha' && (
              <button
                type="button"
                onClick={() => removeSignatory(signatory.originalIndex)}
                className="text-red-400 hover:text-red-600"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <input
            required={signatory.signatoryType === 'responsavel'}
            value={signatory.name}
            onChange={(e) =>
              updateSignatory(signatory.originalIndex, { name: e.target.value })
            }
            placeholder="Nome completo *"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            required={signatory.signatoryType === 'responsavel'}
            type="email"
            value={signatory.email}
            onChange={(e) =>
              updateSignatory(signatory.originalIndex, {
                email: e.target.value,
              })
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

      <button
        type="button"
        onClick={() => addSignatory(role)}
        className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar testemunha
      </button>
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
              O contrato será enviado em formato DOCX via ZapSign. Cada
              signatário receberá um <strong>link por e-mail</strong> para
              assinar digitalmente. Lembretes automáticos a cada 3 dias.
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Contratante */}
          {renderSignatoryGroup(
            'Contratante',
            <Building2 className="w-4 h-4 text-blue-600" />,
            contratanteSignatories,
            'contratante'
          )}

          {/* Contratada */}
          {renderSignatoryGroup(
            'Contratada',
            <User className="w-4 h-4 text-indigo-600" />,
            contratadaSignatories,
            'contratada'
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
