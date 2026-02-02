// Configuracoes padrao dos modulos - carregadas automaticamente
// As URLs podem ser definidas via variaveis de ambiente no Vercel

export interface ModuleDefaultConfig {
  id: string;
  name: string;
  sourceUrl: string;
  sheetName: string;
  columns: { internal: string; external: string }[];
}

// Mapeamento de colunas para Vendas B2C baseado na planilha real
const VENDAS_B2C_COLUMNS = [
  { internal: 'data_venda', external: 'data_venda' },
  { internal: 'faturamento', external: 'valor_total' },
  { internal: 'produto', external: 'produto' },
  { internal: 'tipo_matricula', external: 'renovacao' },
  { internal: 'cancelamento', external: 'cancelamento' },
  { internal: 'nome', external: 'nome' },
  { internal: 'aluno_id', external: 'cpf' },
  { internal: 'aluno_nome', external: 'nome' },
  { internal: 'forma_pagamento', external: 'forma_pagamento' },
  { internal: 'parcelas', external: 'parcelas' },
  { internal: 'vendedor', external: 'vendedor' },
];

// ============================================================
// URLS HARDCODED - SALVAS NO CÓDIGO PARA PERSISTIR ENTRE DEPLOYS
// Para alterar uma URL, edite aqui e faça commit
// ============================================================
const HARDCODED_URLS = {
  VENDAS_B2C: 'https://docs.google.com/spreadsheets/d/1YBBwUQHOlOCNmpSA8hdGLKZYpbq4Pwbo3I3tx8U7dW8/edit',
  VENDAS_B2B: '',
  CUSTOMER_CARE: '',
  CANCELAMENTOS: 'https://docs.google.com/spreadsheets/d/1YBBwUQHOlOCNmpSA8hdGLKZYpbq4Pwbo3I3tx8U7dW8/edit',
  COBRANCA: 'https://docs.google.com/spreadsheets/d/1R5mBFA8_BjKO-xkMwOVSROBhJxx3bB10uSjiXhDEjPA/edit',
  ALUNOS_ATIVOS: '',
  MARKETING: '',
};

// Carrega configuracoes: env vars (prioridade) > hardcoded > vazio
export function getDefaultModuleConfigs(): ModuleDefaultConfig[] {
  // URLs das planilhas - env vars tem prioridade, depois hardcoded
  const VENDAS_B2C_URL = process.env.NEXT_PUBLIC_SHEET_VENDAS_B2C || HARDCODED_URLS.VENDAS_B2C;
  const VENDAS_B2B_URL = process.env.NEXT_PUBLIC_SHEET_VENDAS_B2B || HARDCODED_URLS.VENDAS_B2B;
  const CUSTOMER_CARE_URL = process.env.NEXT_PUBLIC_SHEET_CUSTOMER_CARE || HARDCODED_URLS.CUSTOMER_CARE;
  const CANCELAMENTOS_URL = process.env.NEXT_PUBLIC_SHEET_CANCELAMENTOS || HARDCODED_URLS.CANCELAMENTOS;
  const COBRANCA_URL = process.env.NEXT_PUBLIC_SHEET_COBRANCA || HARDCODED_URLS.COBRANCA;
  const ALUNOS_ATIVOS_URL = process.env.NEXT_PUBLIC_SHEET_ALUNOS_ATIVOS || HARDCODED_URLS.ALUNOS_ATIVOS;
  const MARKETING_URL = process.env.NEXT_PUBLIC_SHEET_MARKETING || HARDCODED_URLS.MARKETING;

  return [
    {
      id: 'vendas_b2c',
      name: 'Vendas B2C',
      sourceUrl: VENDAS_B2C_URL,
      sheetName: 'Vendas',
      columns: VENDAS_B2C_COLUMNS,
    },
    {
      id: 'vendas_b2b',
      name: 'Vendas B2B',
      sourceUrl: VENDAS_B2B_URL,
      sheetName: 'B2B',
      columns: [
        { internal: 'data_contrato', external: 'data_contrato' },
        { internal: 'empresa', external: 'empresa' },
        { internal: 'cnpj', external: 'cnpj' },
        { internal: 'valor_contrato', external: 'valor_contrato' },
        { internal: 'valor_mensal', external: 'valor_mensal' },
        { internal: 'duracao_meses', external: 'duracao_meses' },
        { internal: 'status_pipeline', external: 'status' },
        { internal: 'probabilidade', external: 'probabilidade' },
        { internal: 'responsavel', external: 'responsavel' },
        { internal: 'qtd_colaboradores', external: 'colaboradores' },
        { internal: 'forecast', external: 'forecast' },
      ],
    },
    {
      id: 'customer_care',
      name: 'Customer Care',
      sourceUrl: CUSTOMER_CARE_URL,
      sheetName: 'Customer Care',
      columns: [
        { internal: 'data_atendimento', external: 'data_atendimento' },
        { internal: 'hora_inicio', external: 'hora_inicio' },
        { internal: 'hora_fim', external: 'hora_fim' },
        { internal: 'tempo_resposta', external: 'tempo_resposta' },
        { internal: 'canal', external: 'canal' },
        { internal: 'motivo', external: 'motivo' },
        { internal: 'categoria', external: 'categoria' },
        { internal: 'aluno_id', external: 'aluno_id' },
        { internal: 'atendente', external: 'atendente' },
        { internal: 'nps_score', external: 'nps' },
        { internal: 'csat_score', external: 'csat' },
        { internal: 'resolvido', external: 'resolvido' },
      ],
    },
    {
      id: 'cancelamentos',
      name: 'Cancelamentos',
      sourceUrl: CANCELAMENTOS_URL,
      sheetName: 'Cancelamentos',
      columns: [
        { internal: 'documento', external: 'cpf/cnpj' },
        { internal: 'nome', external: 'nome' },
        { internal: 'data_venda', external: 'data_venda' },
        { internal: 'produto', external: 'produto' },
        { internal: 'valor_total', external: 'valor_total' },
        { internal: 'data_cancelamento', external: 'data_cancelamento' },
        { internal: 'tipo_cancelamento', external: 'tipo_cancelamento' },
        { internal: 'razao_cancelamento', external: 'razao_cancelamento' },
        { internal: 'multa', external: 'multa' },
        { internal: 'pago_ate_cancelamento', external: 'pago_ate_cancelamento' },
        { internal: 'perda', external: 'perda' },
        { internal: 'status', external: 'cancelamento' },
      ],
    },
    {
      id: 'cobranca',
      name: 'Cobranca',
      sourceUrl: COBRANCA_URL,
      sheetName: 'Sheet1',
      columns: [
        { internal: 'data', external: 'Data' },
        { internal: 'aluno_nome', external: 'Nome' },
        { internal: 'email', external: 'Email' },
        { internal: 'telefone', external: 'Telefone' },
        { internal: 'vencimento', external: 'Vencimento' },
        { internal: 'pagamento', external: 'Pagamento' },
        { internal: 'cobranca_valor', external: 'Cobrança valor' },
        { internal: 'parcelas_aberto', external: 'Parcelas em aberto' },
        { internal: 'valor_total_aberto', external: 'Valor total em aberto' },
        { internal: 'data_ultimo_contato', external: 'Data do último contato' },
        { internal: 'data_pagamento', external: 'Data de pagamento' },
        { internal: 'valor_recuperado', external: 'Valor recuperado ' },
        { internal: 'status', external: 'Status' },
        { internal: 'observacoes', external: 'Observações' },
      ],
    },
    {
      id: 'alunos_ativos',
      name: 'Alunos Ativos',
      sourceUrl: ALUNOS_ATIVOS_URL,
      sheetName: 'Alunos',
      columns: [
        { internal: 'aluno_id', external: 'id' },
        { internal: 'aluno_nome', external: 'nome' },
        { internal: 'email', external: 'email' },
        { internal: 'curso', external: 'curso' },
        { internal: 'data_matricula', external: 'data_matricula' },
        { internal: 'valor_mensalidade', external: 'mensalidade' },
        { internal: 'status', external: 'status' },
        { internal: 'nivel', external: 'nivel' },
        { internal: 'professor', external: 'professor' },
        { internal: 'horario', external: 'horario' },
        { internal: 'modalidade', external: 'modalidade' },
      ],
    },
    {
      id: 'marketing',
      name: 'Marketing',
      sourceUrl: MARKETING_URL,
      sheetName: 'Marketing',
      columns: [
        { internal: 'data', external: 'data' },
        { internal: 'plataforma', external: 'plataforma' },
        { internal: 'campanha', external: 'campanha' },
        { internal: 'investimento', external: 'investimento' },
        { internal: 'impressoes', external: 'impressoes' },
        { internal: 'cliques', external: 'cliques' },
        { internal: 'leads', external: 'leads' },
        { internal: 'leads_qualificados', external: 'leads_qualificados' },
        { internal: 'matriculas', external: 'matriculas' },
        { internal: 'receita_gerada', external: 'receita' },
        { internal: 'cpl', external: 'cpl' },
        { internal: 'cac', external: 'cac' },
        { internal: 'roas', external: 'roas' },
      ],
    },
  ];
}

// Funcao para obter config de um modulo especifico
export function getDefaultModuleConfig(moduleId: string): ModuleDefaultConfig | null {
  const configs = getDefaultModuleConfigs();
  return configs.find(c => c.id === moduleId) || null;
}
