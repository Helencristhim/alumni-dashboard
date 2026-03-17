'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { gerarSugestoes } from '@/lib/contracts/ai-engine';
import { ContractProgramData } from '@/types/contracts';

export function useAISuggestions() {
  const {
    currentContract,
    setSuggestions,
    setSuggestionsLoading,
    suggestions,
    suggestionsLoading,
    showSuggestions,
    toggleSuggestions,
  } = useContractStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSuggestions = useCallback(async () => {
    if (!currentContract) return;

    setSuggestionsLoading(true);
    try {
      const result = await gerarSugestoes(
        currentContract.contractData || {},
        currentContract.programs || [],
        currentContract.htmlContent || '',
        currentContract.type || 'CORPORATIVO',
        true
      );
      setSuggestions(result);
    } catch (err) {
      console.error('Erro ao gerar sugestões:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [currentContract, setSuggestions, setSuggestionsLoading]);

  // Debounce: atualizar sugestões quando contrato muda
  useEffect(() => {
    if (!currentContract) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(refreshSuggestions, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    currentContract?.contractData,
    currentContract?.programs,
    currentContract?.type,
    refreshSuggestions,
  ]);

  const insertSuggestion = useCallback(
    (clauseHtml: string) => {
      if (!currentContract) return null;
      return clauseHtml;
    },
    [currentContract]
  );

  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      setSuggestions(suggestions.filter((s) => s.id !== suggestionId));
    },
    [suggestions, setSuggestions]
  );

  return {
    suggestions,
    suggestionsLoading,
    showSuggestions,
    toggleSuggestions,
    refreshSuggestions,
    insertSuggestion,
    dismissSuggestion,
  };
}
