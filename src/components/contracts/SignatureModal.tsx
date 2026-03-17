'use client';

import { useState } from 'react';
import { X, Send, Loader2, Plus, Trash2 } from 'lucide-react';
import { SignatoryData } from '@/types/contracts';

interface SignatureModalProps {
  contractTitle: string;
  onSend: (signatories: SignatoryData[]) => Promise<void>;
  onClose: () => void;
}

export function SignatureModal({ contractTitle, onSend, onClose }: SignatureModalProps) {
  const [signatories, setSignatories] = useState<SignatoryData[]>([
    { name: '', email: '', cpf: '', role: 'contratante' },
    { name: '', email: '', cpf: '', role: 'contratada' },
  ]);
  const [sending, setSending] = useState(false);

  const updateSignatory = (index: number, updates: Partial<SignatoryData>) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], ...updates };
    setSignatories(updated);
  };

  const addSignatory = () => {
    setSignatories([...signatories, { name: '', email: '', role: 'contratante' }]);
  };

  const removeSignatory = (index: number) => {
    if (signatories.length <= 2) return;
    setSignatories(signatories.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(signatories);
      onClose();
    } catch (err) {
      console.error('Erro ao enviar para assinatura:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Enviar para Assinatura</h3>
            <p className="text-xs text-gray-500 mt-0.5">{contractTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            O contrato será enviado via ZapSign para assinatura digital.
          </p>

          {signatories.map((signatory, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Signatário {index + 1}
                </span>
                {signatories.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeSignatory(index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select
                value={signatory.role}
                onChange={(e) =>
                  updateSignatory(index, {
                    role: e.target.value as 'contratante' | 'contratada',
                  })
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="contratante">Contratante</option>
                <option value="contratada">Contratada</option>
              </select>
              <input
                required
                value={signatory.name}
                onChange={(e) => updateSignatory(index, { name: e.target.value })}
                placeholder="Nome completo"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                required
                type="email"
                value={signatory.email}
                onChange={(e) => updateSignatory(index, { email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addSignatory}
            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
            Adicionar signatário
          </button>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Enviando...' : 'Enviar via ZapSign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
