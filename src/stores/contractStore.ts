import { create } from 'zustand';
import {
  ContractData,
  ContractStatus,
  ContractFilters,
  AISuggestion,
  CompanyData,
} from '@/types/contracts';

interface ContractStore {
  // Lista de contratos
  contracts: ContractData[];
  loading: boolean;
  error: string | null;

  // Contrato atual em edição
  currentContract: ContractData | null;
  isDirty: boolean;
  saving: boolean;

  // Sugestões IA
  suggestions: AISuggestion[];
  suggestionsLoading: boolean;
  showSuggestions: boolean;

  // Empresas
  companies: CompanyData[];

  // Filtros
  filters: ContractFilters;

  // Actions
  setContracts: (contracts: ContractData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentContract: (contract: ContractData | null) => void;
  updateCurrentContract: (updates: Partial<ContractData>) => void;
  setIsDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSuggestions: (suggestions: AISuggestion[]) => void;
  setSuggestionsLoading: (loading: boolean) => void;
  toggleSuggestions: () => void;
  setCompanies: (companies: CompanyData[]) => void;
  setFilters: (filters: Partial<ContractFilters>) => void;
  resetFilters: () => void;
}

export const useContractStore = create<ContractStore>((set) => ({
  contracts: [],
  loading: false,
  error: null,
  currentContract: null,
  isDirty: false,
  saving: false,
  suggestions: [],
  suggestionsLoading: false,
  showSuggestions: true,
  companies: [],
  filters: {},

  setContracts: (contracts) => set({ contracts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentContract: (contract) => set({ currentContract: contract, isDirty: false }),
  updateCurrentContract: (updates) =>
    set((state) => ({
      currentContract: state.currentContract
        ? { ...state.currentContract, ...updates }
        : null,
      isDirty: true,
    })),
  setIsDirty: (isDirty) => set({ isDirty }),
  setSaving: (saving) => set({ saving }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setSuggestionsLoading: (loading) => set({ suggestionsLoading: loading }),
  toggleSuggestions: () => set((state) => ({ showSuggestions: !state.showSuggestions })),
  setCompanies: (companies) => set({ companies }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: {} }),
}));
