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

// Carrega configuracoes das variaveis de ambiente ou usa valores padrao
export function getDefaultModuleConfigs(): ModuleDefaultConfig[] {
  // URLs das planilhas - definidas em variaveis de ambiente do Vercel
  const VENDAS_B2C_URL = process.env.NEXT_PUBLIC_SHEET_VENDAS_B2C || '';
  const VENDAS_B2B_URL = process.env.NEXT_PUBLIC_SHEET_VENDAS_B2B || '';
  const CUSTOMER_CARE_URL = process.env.NEXT_PUBLIC_SHEET_CUSTOMER_CARE || '';
  const CANCELAMENTOS_URL = process.env.NEXT_PUBLIC_SHEET_CANCELAMENTOS || '';
  const COBRANCA_URL = process.env.NEXT_PUBLIC_SHEET_COBRANCA || '';
  const ALUNOS_ATIVOS_URL = process.env.NEXT_PUBLIC_SHEET_ALUNOS_ATIVOS || '';
  const MARKETING_URL = process.env.NEXT_PUBLIC_SHEET_MARKETING || '';

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
        { internal: 'nome', external: 'nome' },
        { internal: 'id_aluno', external: 'id_aluno' },
        { internal: 'data_matricula', external: 'data_matricula' },
        { internal: 'status', external: 'status' },
        { internal: 'data_cancelamento', external: 'data_cancelamento' },
        { internal: 'razao_cancelamento', external: 'razao' },
        { internal: 'valor_total_curso', external: 'valor_total' },
        { internal: 'valor_estornado', external: 'valor_estornado' },
        { internal: 'valor_retido', external: 'valor_retido' },
        { internal: 'produto', external: 'produto' },
      ],
    },
    {
      id: 'cobranca',
      name: 'Cobranca',
      sourceUrl: COBRANCA_URL,
      sheetName: 'Cobranca',
      columns: [
        { internal: 'nome', external: 'nome' },
        { internal: 'email', external: 'email' },
        { internal: 'telefone', external: 'telefone' },
        { internal: 'vencimento', external: 'vencimento' },
        { internal: 'cobranca_valor', external: 'valor' },
        { internal: 'valor_total_aberto', external: 'valor_aberto' },
        { internal: 'data_pagamento', external: 'data_pagamento' },
        { internal: 'valor_recuperado', external: 'valor_recuperado' },
        { internal: 'data_ultimo_contato', external: 'ultimo_contato' },
        { internal: 'aluno', external: 'aluno' },
        { internal: 'status', external: 'status' },
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
