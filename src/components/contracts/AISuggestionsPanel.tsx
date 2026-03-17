'use client';

import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Clock,
  DollarSign,
  BookOpen,
  CreditCard,
  Lightbulb,
} from 'lucide-react';
import { AISuggestion } from '@/types/contracts';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onInsert: (clauseHtml: string) => void;
  onDismiss: (suggestionId: string) => void;
  onRefresh: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  valor: <DollarSign className="w-4 h-4" />,
  prazo: <Clock className="w-4 h-4" />,
  programa: <BookOpen className="w-4 h-4" />,
  pagamento: <CreditCard className="w-4 h-4" />,
  protecao: <ShieldCheck className="w-4 h-4" />,
  geral: <Lightbulb className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  valor: 'text-emerald-600 bg-emerald-50',
  prazo: 'text-blue-600 bg-blue-50',
  programa: 'text-purple-600 bg-purple-50',
  pagamento: 'text-amber-600 bg-amber-50',
  protecao: 'text-red-600 bg-red-50',
  geral: 'text-gray-600 bg-gray-50',
};

const PRIORITY_BADGES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function SuggestionCard({
  suggestion,
  onInsert,
  onDismiss,
}: {
  suggestion: AISuggestion;
  onInsert: (html: string) => void;
  onDismiss: (id: string) => void;
}) {
  const icon = CATEGORY_ICONS[suggestion.category] || CATEGORY_ICONS.geral;
  const colorClass = CATEGORY_COLORS[suggestion.category] || CATEGORY_COLORS.geral;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-md ${colorClass}`}>{icon}</span>
          <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
        </div>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          title="Dispensar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        {suggestion.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGES[suggestion.priority]}`}
          >
            {PRIORITY_LABELS[suggestion.priority]}
          </span>
          <span className="text-xs text-gray-400">
            {suggestion.source === 'rules' ? 'Regra' : 'IA'}
          </span>
        </div>
        <button
          onClick={() => onInsert(suggestion.clauseText)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Inserir
        </button>
      </div>
    </div>
  );
}

export function AISuggestionsPanel({
  suggestions,
  loading,
  isOpen,
  onToggle,
  onInsert,
  onDismiss,
  onRefresh,
}: AISuggestionsPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-xl shadow-lg hover:bg-blue-700 transition-colors z-30"
        title="Abrir sugestões IA"
      >
        <ChevronLeft className="w-5 h-5" />
        <Sparkles className="w-5 h-5 mt-1" />
      </button>
    );
  }

  return (
    <aside className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Sugestões IA Jurídica</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Atualizar sugestões"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Fechar painel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {suggestions.length} sugestão(ões) baseadas no contrato atual
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Analisando contrato...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Sparkles className="w-8 h-8 mb-3" />
            <p className="text-sm text-center">
              Preencha os dados do contrato para receber sugestões inteligentes
            </p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onInsert={onInsert}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>
    </aside>
  );
}
