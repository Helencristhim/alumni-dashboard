// ============================================================
// TIPOS DO MÓDULO DE CONTRATOS B2C
// ============================================================

export type B2CContractType = 'PRIVATE' | 'COMMUNITY' | 'COMMUNITY_FLOW';

export type B2CContractStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'SENT_FOR_SIGNATURE'
  | 'SIGNED'
  | 'ACTIVE'
  | 'CANCELLED';

export const B2C_CONTRACT_TYPE_LABELS: Record<B2CContractType, string> = {
  PRIVATE: 'Private (Individual)',
  COMMUNITY: 'Community (Grupo)',
  COMMUNITY_FLOW: 'Community Flow (Grupo + Individual)',
};

export const B2C_CONTRACT_STATUS_LABELS: Record<B2CContractStatus, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em Revisão',
  SENT_FOR_SIGNATURE: 'Aguardando Assinatura',
  SIGNED: 'Assinado',
  ACTIVE: 'Ativo',
  CANCELLED: 'Cancelado',
};

export const B2C_CONTRACT_STATUS_COLORS: Record<B2CContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  SENT_FOR_SIGNATURE: 'bg-purple-100 text-purple-700',
  SIGNED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// Dados do aluno
export interface B2CStudentData {
  nomeAluno: string;
  cpfAluno: string;
  emailAluno: string;
  telefoneAluno: string;
  enderecoAluno: string;
}

// Dados financeiros
export interface B2CFinancialData {
  valorTotal: number;
  formaPagamento: string;
  tipoCobranca: string; // "mensal" | "pacote"
  parcelas: number;
}

// Dados específicos por tipo
export interface B2CPrivateData {
  valorPorAula: number;
  cargaHoraria: number;
  formato: string; // "online" | "presencial" | "hibrido"
}

export interface B2CCommunityData {
  cargaHorariaTotal: number;
  duracaoAula: number; // em minutos
  formato: string;
}

export interface B2CCommunityFlowData {
  cargaGrupo: number;
  cargaIndividual: number;
  formato: string;
}

// Variáveis para substituição no template
export interface B2CContractVariables extends B2CStudentData {
  // Financeiro
  valor_total: string;
  forma_pagamento: string;
  tipo_cobranca: string;
  parcelas: string;
  // Private
  valor_por_aula?: string;
  carga_horaria?: string;
  formato?: string;
  // Community
  carga_horaria_total?: string;
  duracao_aula?: string;
  // Community Flow
  carga_grupo?: string;
  carga_individual?: string;
  // Data
  data_contrato: string;
  data_inicio: string;
}

// Contrato completo
export interface B2CContractData {
  id?: string;
  number?: string;
  title: string;
  type: B2CContractType;
  status: B2CContractStatus;
  brand: string;
  nomeAluno: string;
  cpfAluno: string;
  emailAluno: string;
  telefoneAluno: string;
  enderecoAluno: string;
  valorTotal: number;
  formaPagamento: string;
  tipoCobranca: string;
  parcelas: number;
  faturamentoHibrido: boolean;
  contractData: B2CContractVariables;
  htmlContent: string;
  currentVersion: number;
  zapsignDocId?: string;
  zapsignStatus?: string;
  signedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Versão
export interface B2CContractVersionData {
  id: string;
  version: number;
  htmlContent: string;
  contractData: B2CContractVariables;
  changeNote?: string;
  createdAt: string;
}

// Signatário
export interface B2CSignatoryData {
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  role: string;
  status?: string;
  signUrl?: string;
  signedAt?: string;
}

// Filtros
export interface B2CContractFilters {
  search?: string;
  status?: B2CContractStatus;
  type?: B2CContractType;
  dateFrom?: string;
  dateTo?: string;
}

export const B2C_PAYMENT_METHODS = [
  { value: 'boleto', label: 'Boleto Bancário' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'recorrencia', label: 'Recorrência' },
  { value: 'transferencia', label: 'Transferência Bancária' },
] as const;

export const B2C_FORMATO_OPTIONS = [
  { value: 'online', label: 'Online (Zoom)' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
] as const;
