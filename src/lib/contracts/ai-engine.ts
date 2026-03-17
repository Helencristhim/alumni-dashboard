import { AISuggestion, ContractVariables, ContractProgramData } from '@/types/contracts';

// ============================================================
// MOTOR DE IA JURÍDICA - HÍBRIDO (Regras + LLM)
// ============================================================

interface SuggestionContext {
  contractData: Partial<ContractVariables>;
  programs: ContractProgramData[];
  htmlContent: string;
  contractType: string;
}

// ============================================================
// MOTOR DE REGRAS (RÁPIDO E PREVISÍVEL)
// ============================================================

function generateRuleBasedSuggestions(ctx: SuggestionContext): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const valorTotal = ctx.programs.reduce((sum, p) => sum + (p.valorTotal || 0), 0);
  const totalAlunos = ctx.programs.reduce((sum, p) => sum + (p.quantidade || 0), 0);
  const prazoMeses = parseInt(ctx.contractData.prazo_meses || '0');
  const formaPagamento = ctx.contractData.forma_pagamento || '';
  const hasParticular = ctx.programs.some(p =>
    p.tipoPrograma.toLowerCase().includes('particular')
  );

  // 1. Alto valor (> R$ 50.000)
  if (valorTotal > 50000) {
    suggestions.push({
      id: 'rule-alto-valor',
      title: 'Acompanhamento Estratégico',
      description: `Contrato de alto valor (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}). Recomendamos incluir cláusula de acompanhamento executivo com reuniões periódicas de alinhamento.`,
      clauseText: `<h3>Cláusula - Acompanhamento Estratégico</h3>
<p>Em razão da relevância estratégica e do valor do presente contrato, a CONTRATADA designará um gerente de conta dedicado, responsável por:</p>
<ul>
<li>Realizar reuniões mensais de alinhamento com a CONTRATANTE;</li>
<li>Apresentar relatórios detalhados de progresso e resultados;</li>
<li>Propor ajustes pedagógicos e operacionais quando necessário;</li>
<li>Garantir o cumprimento dos indicadores de qualidade estabelecidos.</li>
</ul>`,
      category: 'valor',
      priority: 'high',
      source: 'rules',
    });
  }

  // 2. Muitos alunos (> 20)
  if (totalAlunos > 20) {
    suggestions.push({
      id: 'rule-muitos-alunos',
      title: 'Reorganização de Turmas',
      description: `Com ${totalAlunos} participantes, sugerimos incluir cláusula de reorganização de turmas para otimizar o aprendizado.`,
      clauseText: `<h3>Cláusula - Gestão e Reorganização de Turmas</h3>
<p>Considerando o volume de participantes, a CONTRATADA poderá, a qualquer momento durante a vigência do contrato:</p>
<ul>
<li>Reorganizar a composição das turmas para otimizar o aproveitamento pedagógico;</li>
<li>Criar novas turmas quando o número de participantes justificar;</li>
<li>Reagrupar participantes por nível de proficiência;</li>
<li>Ajustar horários e frequência das aulas conforme demanda.</li>
</ul>
<p>Eventuais reorganizações serão comunicadas à CONTRATANTE com antecedência mínima de 7 (sete) dias úteis.</p>`,
      category: 'programa',
      priority: 'medium',
      source: 'rules',
    });
  }

  // 3. Prazo longo (> 12 meses)
  if (prazoMeses > 12) {
    suggestions.push({
      id: 'rule-prazo-longo',
      title: 'Revisões Periódicas',
      description: `Contrato com prazo de ${prazoMeses} meses. Recomendamos incluir cláusula de revisão semestral de valores e condições.`,
      clauseText: `<h3>Cláusula - Revisão Periódica</h3>
<p>Em razão do prazo estendido do presente contrato, as partes acordam que:</p>
<ul>
<li>A cada 6 (seis) meses, será realizada uma reunião de revisão das condições contratuais;</li>
<li>Os valores poderão ser reajustados anualmente pelo IGPM/FGV ou índice que o substitua;</li>
<li>Ajustes no escopo dos programas poderão ser negociados durante as revisões;</li>
<li>Eventuais alterações serão formalizadas por meio de aditivo contratual.</li>
</ul>`,
      category: 'prazo',
      priority: 'high',
      source: 'rules',
    });
  }

  // 4. Aulas particulares
  if (hasParticular) {
    suggestions.push({
      id: 'rule-particular',
      title: 'Personalização Pedagógica',
      description: 'Contrato inclui aulas particulares. Sugerimos cláusula de personalização pedagógica individual.',
      clauseText: `<h3>Cláusula - Personalização Pedagógica</h3>
<p>Para os participantes inscritos no formato de aulas particulares, a CONTRATADA compromete-se a:</p>
<ul>
<li>Realizar avaliação diagnóstica individual de cada participante;</li>
<li>Elaborar plano de estudos personalizado com base nos objetivos profissionais;</li>
<li>Adaptar conteúdos e materiais à área de atuação do participante;</li>
<li>Fornecer relatório individual de progresso a cada 30 (trinta) dias;</li>
<li>Permitir a troca de professor mediante solicitação justificada.</li>
</ul>`,
      category: 'programa',
      priority: 'medium',
      source: 'rules',
    });
  }

  // 5. Pagamento por boleto
  if (formaPagamento.toLowerCase().includes('boleto')) {
    suggestions.push({
      id: 'rule-boleto',
      title: 'Condições de Boleto',
      description: 'Pagamento via boleto bancário. Sugerimos incluir cláusula de prazo e multa por atraso.',
      clauseText: `<h3>Cláusula - Condições de Pagamento por Boleto</h3>
<p>O pagamento será realizado mediante boleto bancário emitido pela CONTRATADA, observando-se:</p>
<ul>
<li>O boleto será emitido e enviado com antecedência mínima de 5 (cinco) dias úteis do vencimento;</li>
<li>O pagamento deverá ser efetuado até a data de vencimento indicada no boleto;</li>
<li>Em caso de atraso, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de 1% (um por cento) ao mês pro rata die;</li>
<li>Atraso superior a 30 dias poderá acarretar suspensão dos serviços.</li>
</ul>`,
      category: 'pagamento',
      priority: 'medium',
      source: 'rules',
    });
  }

  // 6. Pagamento por PIX
  if (formaPagamento.toLowerCase().includes('pix')) {
    suggestions.push({
      id: 'rule-pix',
      title: 'Condições de PIX',
      description: 'Pagamento via PIX. Sugerimos cláusula com desconto por pontualidade.',
      clauseText: `<h3>Cláusula - Condições de Pagamento via PIX</h3>
<p>O pagamento será realizado via PIX, conforme as seguintes condições:</p>
<ul>
<li>A CONTRATADA enviará a chave PIX e QR Code junto com a nota fiscal;</li>
<li>Pagamentos realizados até a data de vencimento poderão ter desconto de 3% (três por cento) sobre o valor da parcela;</li>
<li>O comprovante de pagamento deverá ser enviado por e-mail à CONTRATADA;</li>
<li>Em caso de atraso, aplicam-se as mesmas condições de multa e juros previstas neste contrato.</li>
</ul>`,
      category: 'pagamento',
      priority: 'low',
      source: 'rules',
    });
  }

  // 7. Pagamento recorrente
  if (formaPagamento.toLowerCase().includes('recorr')) {
    suggestions.push({
      id: 'rule-recorrencia',
      title: 'Pagamento Recorrente',
      description: 'Pagamento por recorrência. Sugerimos cláusula de autorização de débito automático.',
      clauseText: `<h3>Cláusula - Pagamento por Recorrência</h3>
<p>A CONTRATANTE autoriza a cobrança recorrente do valor mensal do contrato, observadas as seguintes condições:</p>
<ul>
<li>A cobrança será realizada automaticamente na data de vencimento acordada;</li>
<li>Em caso de falha na cobrança, a CONTRATADA realizará nova tentativa em até 3 (três) dias úteis;</li>
<li>A CONTRATANTE poderá solicitar alteração da data de vencimento com antecedência mínima de 10 (dez) dias;</li>
<li>O cancelamento da recorrência não implica cancelamento do contrato, devendo as parcelas restantes ser pagas por outro meio.</li>
</ul>`,
      category: 'pagamento',
      priority: 'medium',
      source: 'rules',
    });
  }

  // 8. Valor acima de 100k - Garantia extra
  if (valorTotal > 100000) {
    suggestions.push({
      id: 'rule-garantia',
      title: 'Garantia de Resultados',
      description: `Valor expressivo (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}). Sugerimos cláusula de SLA com indicadores de desempenho.`,
      clauseText: `<h3>Cláusula - Indicadores de Desempenho (SLA)</h3>
<p>A CONTRATADA se compromete a atingir os seguintes indicadores mínimos de qualidade:</p>
<ul>
<li>Taxa de satisfação dos participantes (NPS) igual ou superior a 8,0;</li>
<li>Taxa de frequência mínima de 75% dos participantes inscritos;</li>
<li>Índice de aprovação no nível igual ou superior a 70%;</li>
<li>Disponibilidade da plataforma de aulas de no mínimo 99,5%.</li>
</ul>
<p>Os indicadores serão aferidos trimestralmente e apresentados em relatório à CONTRATANTE. Em caso de descumprimento reiterado, a CONTRATANTE poderá solicitar plano de ação corretivo.</p>`,
      category: 'protecao',
      priority: 'high',
      source: 'rules',
    });
  }

  // 9. Qualquer contrato - LGPD
  if (!ctx.htmlContent.toLowerCase().includes('lgpd') && !ctx.htmlContent.toLowerCase().includes('proteção de dados')) {
    suggestions.push({
      id: 'rule-lgpd',
      title: 'Proteção de Dados (LGPD)',
      description: 'O contrato não menciona LGPD. Recomendamos incluir cláusula de proteção de dados pessoais.',
      clauseText: `<h3>Cláusula - Proteção de Dados Pessoais (LGPD)</h3>
<p>As partes se comprometem a tratar os dados pessoais dos participantes em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), observando:</p>
<ul>
<li>Os dados pessoais dos participantes serão tratados exclusivamente para as finalidades previstas neste contrato;</li>
<li>A CONTRATADA adotará medidas técnicas e administrativas adequadas à proteção dos dados;</li>
<li>Em caso de incidente de segurança, a parte responsável deverá comunicar a outra em até 48 horas;</li>
<li>Ao término do contrato, os dados pessoais serão eliminados ou devolvidos, conforme solicitação.</li>
</ul>`,
      category: 'protecao',
      priority: 'high',
      source: 'rules',
    });
  }

  return suggestions;
}

// ============================================================
// MOTOR LLM (SUGESTÕES AVANÇADAS VIA CLAUDE)
// ============================================================

async function generateLLMSuggestions(ctx: SuggestionContext): Promise<AISuggestion[]> {
  try {
    const response = await fetch('/api/contracts/ai-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractData: ctx.contractData,
        programs: ctx.programs,
        contractType: ctx.contractType,
        htmlContent: ctx.htmlContent.substring(0, 3000), // Limitar tamanho
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.suggestions || [];
  } catch {
    console.error('Erro ao gerar sugestões LLM');
    return [];
  }
}

// ============================================================
// FUNÇÃO PRINCIPAL - HÍBRIDA
// ============================================================

export async function gerarSugestoes(
  contractData: Partial<ContractVariables>,
  programs: ContractProgramData[],
  htmlContent: string,
  contractType: string,
  useLLM: boolean = true
): Promise<AISuggestion[]> {
  const ctx: SuggestionContext = {
    contractData,
    programs,
    htmlContent,
    contractType,
  };

  // Sempre gera sugestões por regras (instantâneo)
  const ruleSuggestions = generateRuleBasedSuggestions(ctx);

  // Se LLM habilitado, busca sugestões avançadas em paralelo
  let llmSuggestions: AISuggestion[] = [];
  if (useLLM) {
    llmSuggestions = await generateLLMSuggestions(ctx);
  }

  // Combinar e deduplicar
  const allSuggestions = [...ruleSuggestions, ...llmSuggestions];

  // Ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return allSuggestions;
}

export { generateRuleBasedSuggestions };
