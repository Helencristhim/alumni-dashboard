// ============================================================
// TIPOS DO DASHBOARD ALUMNI
// ============================================================

// Tipos de fonte de dados
export type DataSourceType = 'google_sheets' | 'excel' | 'csv';

// Configuração de fonte de dados
export interface DataSourceConfig {
  type: DataSourceType;
  url?: string;
  path?: string;
  sheet_name: string;
}

// Mapeamento de colunas genérico
export interface ColumnMapping {
  [key: string]: string;
}

// Configuração de módulo
export interface ModuleConfig {
  name: string;
  description: string;
  enabled: boolean;
  source: DataSourceConfig;
  column_mapping: ColumnMapping;
  produtos?: string[];
  cursos?: string[];
}

// Configuração global
export interface GlobalSettings {
  currency: string;
  currency_symbol: string;
  date_format: string;
  timezone: string;
  cache_duration: number;
  module_colors: Record<string, string>;
}

// Configuração completa
export interface DashboardConfig {
  google_credentials?: {
    service_account_key_path: string;
  };
  vendas_b2c: ModuleConfig;
  vendas_b2b: ModuleConfig;
  customer_care: ModuleConfig;
  cancelamentos: ModuleConfig;
  cobranca: ModuleConfig;
  alunos_ativos: ModuleConfig;
  marketing: ModuleConfig;
  global_settings: GlobalSettings;
}

// ============================================================
// TIPOS DE DADOS POR MÓDULO
// ============================================================

// Vendas B2C
export interface VendaB2C {
  data_venda: Date;
  faturamento: number;
  produto: string;
  aluno_id: string;
  aluno_nome: string;
  forma_pagamento: string;
  parcelas: number;
  status: string;
  vendedor: string;
  origem_lead: string;
}

// Vendas B2B
export interface VendaB2B {
  data_contrato: Date;
  empresa: string;
  cnpj: string;
  valor_contrato: number;
  valor_mensal: number;
  duracao_meses: number;
  status_pipeline: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado';
  probabilidade: number;
  responsavel: string;
  qtd_colaboradores: number;
  forecast: number;
}

// Customer Care
export interface Atendimento {
  data_atendimento: Date;
  hora_inicio: string;
  hora_fim: string;
  tempo_resposta: number;
  canal: 'WhatsApp' | 'Email' | 'Telefone' | 'Chat';
  motivo: string;
  categoria: string;
  aluno_id: string;
  atendente: string;
  nps_score: number;
  csat_score: number;
  resolvido: boolean;
  observacoes: string;
}

// Cancelamentos
export interface Cancelamento {
  data_solicitacao: Date;
  data_efetivacao: Date | null;
  aluno_id: string;
  aluno_nome: string;
  curso: string;
  motivo_principal: string;
  motivo_detalhado: string;
  valor_mensalidade: number;
  tempo_como_aluno: number;
  tentativa_retencao: boolean;
  feedback: string;
}

// Cobrança
export interface Cobranca {
  data_vencimento: Date;
  data_pagamento: Date | null;
  aluno_id: string;
  aluno_nome: string;
  valor_devido: number;
  valor_pago: number;
  status: 'Pago' | 'Pendente' | 'Atrasado' | 'Recuperado' | 'Perdido';
  dias_atraso: number;
  acao_cobranca: string;
  responsavel: string;
  curso: string;
}

// Alunos Ativos
export interface AlunoAtivo {
  aluno_id: string;
  aluno_nome: string;
  email: string;
  curso: string;
  data_matricula: Date;
  valor_mensalidade: number;
  status: 'Ativo' | 'Trancado' | 'Formado';
  nivel: string;
  professor: string;
  horario: string;
  modalidade: 'Presencial' | 'Online';
}

// Marketing
export interface CampanhaMarketing {
  data: Date;
  plataforma: 'Google' | 'Meta' | 'LinkedIn' | 'TikTok';
  campanha: string;
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  leads_qualificados: number;
  matriculas: number;
  receita_gerada: number;
  cpl: number;
  cac: number;
  roas: number;
}

// ============================================================
// TIPOS DE KPIs E MÉTRICAS
// ============================================================

export interface KPIData {
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'currency' | 'percentage' | 'number' | 'text';
  icon?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ModuleData<T> {
  config: ModuleConfig;
  data: T[];
  lastUpdated: Date;
  sourceUrl: string;
}

// ============================================================
// TIPOS DE FILTROS
// ============================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ModuleFilters {
  dateRange?: DateRange;
  produto?: string;
  curso?: string;
  status?: string;
  plataforma?: string;
}

// ============================================================
// TIPOS DE AUTENTICAÇÃO
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
