// ============================================================
// TIPOS DO MÓDULO DE CONTRATOS B2B
// ============================================================

export type ContractType =
  | 'CORPORATIVO'
  | 'IN_COMPANY'
  | 'AULAS_PARTICULARES'
  | 'PARCERIA'
  | 'LICENCIAMENTO';

export type ContractStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SENT_FOR_SIGNATURE'
  | 'SIGNED'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED';

export type FileType = 'PDF' | 'DOCX';

// Labels para exibição
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  CORPORATIVO: 'Corporativo',
  IN_COMPANY: 'In-Company',
  AULAS_PARTICULARES: 'Aulas Particulares',
  PARCERIA: 'Parceria',
  LICENCIAMENTO: 'Licenciamento',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em Revisão',
  APPROVED: 'Aprovado',
  SENT_FOR_SIGNATURE: 'Aguardando Assinatura',
  SIGNED: 'Assinado',
  ACTIVE: 'Ativo',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT_FOR_SIGNATURE: 'bg-purple-100 text-purple-700',
  SIGNED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

// Variáveis do contrato
export interface ContractVariables {
  // Contratante (empresa cliente)
  razao_social: string;
  cnpj: string;
  endereco: string;
  representante_nome: string;
  representante_cpf: string;
  // Contratada
  empresa_contratada_nome: string;
  empresa_contratada_cnpj: string;
  empresa_contratada_endereco: string;
  empresa_representante_nome: string;
  empresa_representante_cpf: string;
  // Contrato
  data_inicio: string;
  data_fim: string;
  prazo_meses: string;
  // Financeiro
  forma_pagamento: string;
  dia_emissao_nf: string;
  dia_vencimento: string;
  valor_total_contrato: string;
  // Foro
  foro_cidade: string;
  foro_estado: string;
}

// Programa contratado
export interface ContractProgramData {
  id?: string;
  tipoPrograma: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  descricao?: string;
}

// Empresa
export interface CompanyData {
  id?: string;
  razaoSocial: string;
  cnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  representanteNome?: string;
  representanteCpf?: string;
  representanteEmail?: string;
  representanteTelefone?: string;
}

// Contrato completo
export interface ContractData {
  id?: string;
  number?: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  brand: string;
  companyId: string;
  company?: CompanyData;
  templateId?: string;
  contractData: ContractVariables;
  htmlContent: string;
  valorTotal?: number;
  formaPagamento?: string;
  diaEmissaoNf?: number;
  diaVencimento?: number;
  dataInicio?: string;
  dataFim?: string;
  prazoMeses?: number;
  programs: ContractProgramData[];
  currentVersion: number;
  zapsignDocId?: string;
  zapsignStatus?: string;
  signedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Versão do contrato
export interface ContractVersionData {
  id: string;
  version: number;
  htmlContent: string;
  contractData: ContractVariables;
  changeNote?: string;
  createdById?: string;
  createdAt: string;
}

// Signatário
export interface SignatoryData {
  name: string;
  email: string;
  cpf?: string;
  role: 'contratante' | 'contratada';
}

// Sugestão IA
export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  clauseText: string;
  category: 'valor' | 'prazo' | 'programa' | 'pagamento' | 'protecao' | 'geral';
  priority: 'high' | 'medium' | 'low';
  source: 'rules' | 'llm';
}

// Brand config
export interface BrandConfigData {
  id?: string;
  brand: string;
  displayName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  footerText?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

// Filtros de busca
export interface ContractFilters {
  search?: string;
  status?: ContractStatus;
  type?: ContractType;
  brand?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Tipos de programa disponíveis
export const PROGRAM_TYPES = [
  { value: 'community', label: 'Community (Inglês Grupo)' },
  { value: 'community_flow', label: 'Community Flow (Inglês Grupo + Individual)' },
  { value: 'particular_ingles', label: 'Aulas Particulares (Inglês)' },
  { value: 'conexion', label: 'Conexión (Espanhol Grupo)' },
  { value: 'particular_espanhol', label: 'Aulas Particulares (Espanhol)' },
  { value: 'corporativo_custom', label: 'Programa Corporativo Customizado' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'boleto', label: 'Boleto Bancário' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'recorrencia', label: 'Recorrência' },
] as const;
