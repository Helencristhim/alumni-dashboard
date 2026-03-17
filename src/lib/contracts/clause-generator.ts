import { ContractType, ContractVariables, ContractProgramData } from '@/types/contracts';

// ============================================================
// GERADOR DE CLÁUSULAS AUTOMÁTICAS
// ============================================================

interface ClauseGeneratorInput {
  type: ContractType;
  brand: string;
  variables: Partial<ContractVariables>;
  programs: ContractProgramData[];
}

// Gera a tabela de programas contratados em HTML
function generateProgramsTable(programs: ContractProgramData[]): string {
  if (programs.length === 0) return '';

  const rows = programs
    .map(
      (p) => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px;">${p.tipoPrograma}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:center;">${p.quantidade}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">R$ ${p.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">R$ ${p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
    </tr>`
    )
    .join('');

  const total = programs.reduce((sum, p) => sum + p.valorTotal, 0);

  return `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background-color:#f3f4f6;">
      <th style="border:1px solid #ddd;padding:8px;text-align:left;">Programa</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:center;">Qtd. Participantes</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:right;">Valor Unitário</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:right;">Valor Total</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr style="background-color:#f9fafb;font-weight:bold;">
      <td style="border:1px solid #ddd;padding:8px;" colspan="3">TOTAL</td>
      <td style="border:1px solid #ddd;padding:8px;text-align:right;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tbody>
</table>`;
}

// Gera o Master Agreement
function generateMasterAgreement(v: Partial<ContractVariables>): string {
  return `
<h1 style="text-align:center;margin-bottom:24px;">MASTER AGREEMENT – Serviços Educacionais</h1>

<h2>1. Objeto</h2>
<p>O presente MASTER AGREEMENT estabelece os termos e condições gerais para a prestação de serviços educacionais pela CONTRATADA à CONTRATANTE.</p>

<h2>2. Estrutura do Contrato</h2>
<p>Os serviços específicos contratados serão detalhados em Anexos ou Propostas Comerciais que integrarão este instrumento.</p>
<p>Cada anexo poderá corresponder a um programa educacional distinto.</p>

<h2>3. Escopo dos Programas</h2>
<p>Os programas poderão incluir, entre outros formatos: aulas individuais, aulas em grupo, programas corporativos, programas educacionais para instituições de ensino ou cursos especiais.</p>

<h2>4. Prestação dos Serviços</h2>
<p>A CONTRATADA será responsável pela metodologia, seleção e treinamento dos professores.</p>
<p>As aulas poderão ocorrer em ambiente online ou presencial conforme definido em cada anexo.</p>

<h2>5. Condições Comerciais</h2>
<p>Os valores, prazos de pagamento e condições financeiras serão definidos em cada anexo ou proposta comercial vinculada a este contrato.</p>

<h2>6. Prazo</h2>
<p>O presente MASTER AGREEMENT terá prazo indeterminado, permanecendo válido enquanto existirem anexos ou propostas comerciais ativas.</p>

<h2>7. Responsabilidades das Partes</h2>
<p>A CONTRATADA compromete-se a prestar os serviços conforme sua metodologia educacional.</p>
<p>A CONTRATANTE compromete-se a colaborar com a comunicação e participação dos usuários inscritos.</p>

<h2>8. Confidencialidade</h2>
<p>As partes comprometem-se a manter confidenciais todas as informações comerciais, pedagógicas e estratégicas trocadas em função deste contrato.</p>

<h2>9. Proteção de Dados</h2>
<p>As partes comprometem-se a cumprir integralmente a legislação de proteção de dados aplicável, incluindo a LGPD (Lei nº 13.709/2018).</p>

<h2>10. Não Vínculo Empregatício</h2>
<p>Não haverá qualquer vínculo empregatício entre os profissionais da CONTRATADA e a CONTRATANTE.</p>

<h2>11. Rescisão</h2>
<p>Qualquer das partes poderá rescindir este contrato mediante notificação por escrito, observando as condições previstas nos anexos ativos.</p>

<h2>12. Foro</h2>
<p>Fica eleito o foro da comarca de <span data-variable="foro_cidade">{{foro_cidade}}</span>/<span data-variable="foro_estado">{{foro_estado}}</span> para dirimir eventuais disputas.</p>
`;
}

// Gera o Anexo de Condições Comerciais
function generateAnexoComercial(
  v: Partial<ContractVariables>,
  programs: ContractProgramData[]
): string {
  return `
<h1 style="text-align:center;margin-bottom:24px;">ANEXO I – CONDIÇÕES COMERCIAIS</h1>
<h2 style="text-align:center;margin-bottom:16px;">Programa Corporativo de Idiomas</h2>

<p>Por este instrumento e na melhor forma de direito, de um lado:</p>

<p><strong><span data-variable="razao_social">{{razao_social}}</span></strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF nº <span data-variable="cnpj">{{cnpj}}</span>, com sede à <span data-variable="endereco">{{endereco}}</span>, neste ato denominada <strong>CONTRATANTE</strong> e representada nos termos de seu Contrato Social por <span data-variable="representante_nome">{{representante_nome}}</span>, portador(a) do CPF nº <span data-variable="representante_cpf">{{representante_cpf}}</span>.</p>

<p>e de outro lado:</p>

<p><strong><span data-variable="empresa_contratada_nome">{{empresa_contratada_nome}}</span></strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF nº <span data-variable="empresa_contratada_cnpj">{{empresa_contratada_cnpj}}</span>, sediada na <span data-variable="empresa_contratada_endereco">{{empresa_contratada_endereco}}</span>, neste ato denominada <strong>CONTRATADA</strong>, neste ato representada por <span data-variable="empresa_representante_nome">{{empresa_representante_nome}}</span>, portador(a) do CPF nº <span data-variable="empresa_representante_cpf">{{empresa_representante_cpf}}</span>.</p>

<p>As partes acima identificadas resolvem celebrar o presente Anexo I – Condições Comerciais, que passa a integrar o Contrato de Prestação de Serviços Educacionais, mediante as condições descritas a seguir.</p>

<h2>1. Programas Contratados</h2>
${generateProgramsTable(programs)}
<p>Os participantes poderão ser atualizados ou substituídos pela CONTRATANTE durante a vigência do contrato, conforme regras operacionais e pedagógicas estabelecidas pela CONTRATADA.</p>

<h2>2. Prazo do Contrato</h2>
<p>Data de início: <span data-variable="data_inicio">{{data_inicio}}</span></p>
<p>Data de término: <span data-variable="data_fim">{{data_fim}}</span></p>
<p>Prazo total: <span data-variable="prazo_meses">{{prazo_meses}}</span> meses.</p>

<h2>3. Relatórios de Acompanhamento</h2>
<p>A CONTRATADA poderá disponibilizar relatórios periódicos de acompanhamento do programa educacional, incluindo, entre outros:</p>
<ul>
<li>Frequência e participação dos alunos</li>
<li>Evolução geral dos participantes</li>
<li>Insights pedagógicos sobre o desenvolvimento do grupo</li>
</ul>
<p>O formato e a periodicidade dos relatórios seguirão o padrão adotado pela CONTRATADA, sendo emitidos mensalmente entre o quinto e o décimo dia do mês subsequente ao período avaliado.</p>

<h2>4. Ajuste de Participantes</h2>
<p>Em caso de desligamento, substituição ou alteração de colaboradores participantes do programa, a CONTRATANTE poderá:</p>
<ul>
<li>Solicitar a substituição de participantes;</li>
<li>Solicitar a exclusão de participantes do programa.</li>
</ul>
<p>A critério da CONTRATADA, tais alterações poderão resultar em ajuste operacional das turmas e ajuste financeiro no valor do contrato.</p>

<h2>5. Rescisão</h2>
<p>O presente contrato poderá ser rescindido total ou parcialmente por qualquer das partes mediante notificação prévia de 30 (trinta) dias, sem prejuízo das obrigações financeiras já constituídas até a data da efetiva rescisão.</p>

<h2>6. Condições de Pagamento</h2>
<p>Forma de pagamento: <span data-variable="forma_pagamento">{{forma_pagamento}}</span></p>
<p>Emissão da Nota Fiscal: dia <span data-variable="dia_emissao_nf">{{dia_emissao_nf}}</span> de cada mês</p>
<p>Vencimento: dia <span data-variable="dia_vencimento">{{dia_vencimento}}</span> de cada mês</p>
<p>Valor total do contrato: <strong>R$ <span data-variable="valor_total_contrato">{{valor_total_contrato}}</span></strong></p>

<h3>6.1 Atraso de Pagamento</h3>
<p>Em caso de atraso no pagamento de quaisquer valores previstos neste contrato, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de 1% (um por cento) ao mês, calculados pro rata die, até a data da efetiva regularização do pagamento.</p>
<p>Na hipótese de inadimplência superior a 30 (trinta) dias, a CONTRATADA poderá suspender temporariamente a prestação dos serviços até que a situação financeira seja regularizada.</p>
<p>Persistindo a inadimplência por período superior a 90 (noventa) dias, a CONTRATADA poderá rescindir o contrato unilateralmente, sem prejuízo da cobrança dos valores devidos.</p>
`;
}

// ============================================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ============================================================

export function generateContractHTML(input: ClauseGeneratorInput): string {
  const { variables, programs } = input;

  const masterAgreement = generateMasterAgreement(variables);
  const anexoComercial = generateAnexoComercial(variables, programs);

  return `
<div class="contract-document" style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;color:#1a1a1a;max-width:800px;margin:0 auto;">
  ${masterAgreement}
  <div style="page-break-before:always;margin-top:48px;"></div>
  ${anexoComercial}
</div>`;
}

export function generateBlankContract(): string {
  return `
<div class="contract-document" style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;color:#1a1a1a;max-width:800px;margin:0 auto;">
  <h1 style="text-align:center;">Novo Contrato</h1>
  <p>Comece a editar seu contrato aqui ou selecione um template.</p>
</div>`;
}
