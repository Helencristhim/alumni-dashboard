// =============================================================================
// B2C Contract Templates — Alumni by Better Education
// =============================================================================

// ---------------------------------------------------------------------------
// 1. PRIVATE (Aulas Particulares)
// ---------------------------------------------------------------------------

export const PRIVATE_TEMPLATE = `
<h1 style="text-align:center; font-size:20px; font-weight:bold; margin-bottom:8px;">
  CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS — AULAS PARTICULARES
</h1>
<p style="text-align:center; font-size:13px; color:#555; margin-bottom:24px;">
  Contrato nº {{numero_contrato}} &bull; Data: {{data_contrato}}
</p>

<h2>CLÁUSULA 1 — DAS PARTES</h2>

<p><strong>CONTRATADA:</strong> BETTER EDUCATION LTDA, pessoa jurídica de direito privado,
inscrita no CNPJ sob o nº 46.849.730/0001-55, com sede na Alameda Terracota, 185,
Sala 1213, Barueri/SP, CEP 06460-110, neste ato representada por seu sócio-administrador
<strong>Gilberto Gonçalves Rodrigues</strong>, CPF 261.791.848-08, doravante denominada
<strong>"ALUMNI BY BETTER EDUCATION"</strong> ou simplesmente <strong>"CONTRATADA"</strong>.</p>

<p><strong>CONTRATANTE:</strong> {{nome}}, inscrito(a) no CPF sob o nº {{cpf}},
e-mail {{email}}, telefone {{telefone}}, residente e domiciliado(a) em {{endereco}},
doravante denominado(a) <strong>"CONTRATANTE"</strong> ou <strong>"ALUNO(A)"</strong>.</p>

<h2>CLÁUSULA 2 — DO OBJETO</h2>

<p>O presente contrato tem por objeto a prestação de serviços educacionais de ensino de
língua inglesa na modalidade <strong>aulas particulares (Private)</strong>, sob a marca
"Alumni by Better Education", no formato <strong>{{formato}}</strong>, conforme condições
a seguir estabelecidas.</p>

<h2>CLÁUSULA 3 — DA CARGA HORÁRIA E DURAÇÃO</h2>

<p>3.1. A carga horária total contratada é de <strong>{{carga_horaria}}</strong>.</p>
<p>3.2. As aulas terão início em <strong>{{data_inicio}}</strong>, e os horários serão
acordados diretamente entre o(a) CONTRATANTE e o(a) professor(a) designado(a) pela
CONTRATADA.</p>
<p>3.3. Eventual reagendamento de aula deverá ser solicitado com, no mínimo, 24 (vinte e
quatro) horas de antecedência. Caso contrário, a aula será considerada ministrada para
todos os efeitos.</p>

<h2>CLÁUSULA 4 — DO VALOR E FORMA DE PAGAMENTO</h2>

<p>4.1. Pela prestação dos serviços ora contratados, o(a) CONTRATANTE pagará à CONTRATADA
o valor total de <strong>R$ {{valor_total}}</strong>, equivalente a
<strong>R$ {{valor_por_aula}}</strong> por aula.</p>
<p>4.2. O pagamento será realizado em <strong>{{parcelas}}</strong>, na forma de
<strong>{{forma_pagamento}}</strong>.</p>
<p>4.3. O atraso no pagamento de qualquer parcela acarretará multa de 2% (dois por cento)
sobre o valor da parcela vencida, acrescida de juros moratórios de 1% (um por cento) ao
mês, calculados <em>pro rata die</em>.</p>

<h2>CLÁUSULA 5 — DAS OBRIGAÇÕES DA CONTRATADA</h2>

<p>5.1. Disponibilizar professor(a) qualificado(a) e material didático adequado ao nível
do(a) CONTRATANTE.</p>
<p>5.2. Acompanhar o progresso pedagógico do(a) CONTRATANTE e fornecer relatórios de
evolução quando solicitado.</p>
<p>5.3. Manter ambiente adequado para as aulas, presenciais ou on-line, conforme o formato
contratado.</p>

<h2>CLÁUSULA 6 — DAS OBRIGAÇÕES DO(A) CONTRATANTE</h2>

<p>6.1. Efetuar o pagamento nas datas e condições pactuadas.</p>
<p>6.2. Comparecer às aulas nos horários agendados ou comunicar ausência com antecedência
mínima de 24 horas.</p>
<p>6.3. Zelar pelo material didático e equipamentos eventualmente disponibilizados pela
CONTRATADA.</p>
<p>6.4. Não reproduzir, distribuir ou compartilhar o material didático fornecido pela
CONTRATADA, sob pena de responsabilização civil e criminal.</p>

<h2>CLÁUSULA 7 — DO CANCELAMENTO E RESCISÃO</h2>

<p>7.1. O(A) CONTRATANTE poderá solicitar o cancelamento do presente contrato a qualquer
momento, mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias.</p>
<p>7.2. Em caso de cancelamento, será devido o valor proporcional às aulas já ministradas,
acrescido de multa rescisória de 20% (vinte por cento) sobre o saldo restante do
contrato.</p>
<p>7.3. A CONTRATADA reserva-se o direito de rescindir o contrato em caso de inadimplência
superior a 30 (trinta) dias ou por descumprimento de qualquer cláusula contratual por
parte do(a) CONTRATANTE.</p>

<h2>CLÁUSULA 8 — DAS DISPOSIÇÕES GERAIS</h2>

<p>8.1. O presente contrato é regido pelas leis da República Federativa do Brasil.</p>
<p>8.2. As partes elegem o foro da Comarca de <strong>Barueri/SP</strong> para dirimir
quaisquer dúvidas ou controvérsias oriundas deste contrato, com renúncia expressa a
qualquer outro, por mais privilegiado que seja.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o
presente instrumento em 2 (duas) vias de igual teor e forma.</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>BETTER EDUCATION LTDA</strong></p>
    <p>Gilberto Gonçalves Rodrigues</p>
    <p>CNPJ: 46.849.730/0001-55</p>
  </div>
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>{{nome}}</strong></p>
    <p>CPF: {{cpf}}</p>
  </div>
</div>

<p style="text-align:center; margin-top:32px; font-size:13px; color:#555;">
  Barueri/SP, {{data_contrato}}
</p>
`;

// ---------------------------------------------------------------------------
// 2. COMMUNITY (Aulas em Grupo)
// ---------------------------------------------------------------------------

export const COMMUNITY_TEMPLATE = `
<h1 style="text-align:center; font-size:20px; font-weight:bold; margin-bottom:8px;">
  CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS — COMMUNITY
</h1>
<p style="text-align:center; font-size:13px; color:#555; margin-bottom:24px;">
  Contrato nº {{numero_contrato}} &bull; Data: {{data_contrato}}
</p>

<h2>CLÁUSULA 1 — DAS PARTES</h2>

<p><strong>CONTRATADA:</strong> BETTER EDUCATION LTDA, pessoa jurídica de direito privado,
inscrita no CNPJ sob o nº 46.849.730/0001-55, com sede na Alameda Terracota, 185,
Sala 1213, Barueri/SP, CEP 06460-110, neste ato representada por seu sócio-administrador
<strong>Gilberto Gonçalves Rodrigues</strong>, CPF 261.791.848-08, doravante denominada
<strong>"ALUMNI BY BETTER EDUCATION"</strong> ou simplesmente <strong>"CONTRATADA"</strong>.</p>

<p><strong>CONTRATANTE:</strong> {{nome}}, inscrito(a) no CPF sob o nº {{cpf}},
e-mail {{email}}, telefone {{telefone}}, residente e domiciliado(a) em {{endereco}},
doravante denominado(a) <strong>"CONTRATANTE"</strong> ou <strong>"ALUNO(A)"</strong>.</p>

<h2>CLÁUSULA 2 — DO OBJETO</h2>

<p>O presente contrato tem por objeto a prestação de serviços educacionais de ensino de
língua inglesa na modalidade <strong>Community (aulas em grupo)</strong>, sob a marca
"Alumni by Better Education", no formato <strong>{{formato}}</strong>, conforme condições
a seguir estabelecidas.</p>

<h2>CLÁUSULA 3 — DA CARGA HORÁRIA E DURAÇÃO</h2>

<p>3.1. A carga horária total contratada é de <strong>{{carga_horaria_total}}</strong>,
com aulas de <strong>{{duracao_aula}}</strong> de duração cada.</p>
<p>3.2. As aulas terão início em <strong>{{data_inicio}}</strong>, e os horários das
turmas serão definidos pela CONTRATADA e comunicados ao(à) CONTRATANTE previamente.</p>
<p>3.3. A CONTRATADA reserva-se o direito de reorganizar turmas, horários e professores
a fim de garantir a melhor experiência pedagógica, comunicando as alterações com
antecedência mínima de 7 (sete) dias.</p>

<h2>CLÁUSULA 4 — DO VALOR E FORMA DE PAGAMENTO</h2>

<p>4.1. Pela prestação dos serviços e fornecimento de materiais ora contratados, o(a)
CONTRATANTE pagará à CONTRATADA o valor total de <strong>R$ {{valor_total}}</strong>.</p>
<p>4.2. O pagamento será realizado em <strong>{{parcelas}}</strong>, na forma de
<strong>{{forma_pagamento}}</strong>.</p>
<p>4.3. <strong>Composição do valor — faturamento híbrido:</strong> do valor total
contratado, <strong>50% (cinquenta por cento)</strong> refere-se à prestação de serviços
educacionais e <strong>50% (cinquenta por cento)</strong> refere-se ao fornecimento de
material didático e conteúdo pedagógico (produto), conforme legislação tributária
vigente.</p>
<p>4.4. O atraso no pagamento de qualquer parcela acarretará multa de 2% (dois por cento)
sobre o valor da parcela vencida, acrescida de juros moratórios de 1% (um por cento) ao
mês, calculados <em>pro rata die</em>.</p>

<h2>CLÁUSULA 5 — DAS OBRIGAÇÕES DA CONTRATADA</h2>

<p>5.1. Disponibilizar professor(a) qualificado(a) e material didático adequado ao nível
da turma.</p>
<p>5.2. Manter turmas com número adequado de alunos, garantindo a qualidade do
aprendizado.</p>
<p>5.3. Fornecer acesso à plataforma digital e materiais complementares incluídos no
valor contratado.</p>
<p>5.4. Acompanhar o progresso pedagógico do(a) CONTRATANTE e disponibilizar relatórios
de evolução periodicamente.</p>

<h2>CLÁUSULA 6 — DAS OBRIGAÇÕES DO(A) CONTRATANTE</h2>

<p>6.1. Efetuar o pagamento nas datas e condições pactuadas.</p>
<p>6.2. Comparecer às aulas nos horários definidos para a turma.</p>
<p>6.3. Respeitar as regras de convivência da turma e as orientações da CONTRATADA.</p>
<p>6.4. Não reproduzir, distribuir ou compartilhar o material didático fornecido pela
CONTRATADA, sob pena de responsabilização civil e criminal.</p>

<h2>CLÁUSULA 7 — DO CANCELAMENTO E RESCISÃO</h2>

<p>7.1. O(A) CONTRATANTE poderá solicitar o cancelamento do presente contrato a qualquer
momento, mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias.</p>
<p>7.2. Em caso de cancelamento, será devido o valor proporcional às aulas já ministradas
e ao material didático já disponibilizado, acrescido de multa rescisória de 20% (vinte
por cento) sobre o saldo restante do contrato.</p>
<p>7.3. O material didático e conteúdo digital eventualmente disponibilizados ao(à)
CONTRATANTE não serão objeto de devolução ou reembolso após o acesso ter sido
concedido.</p>
<p>7.4. A CONTRATADA reserva-se o direito de rescindir o contrato em caso de
inadimplência superior a 30 (trinta) dias ou por descumprimento de qualquer cláusula
contratual por parte do(a) CONTRATANTE.</p>

<h2>CLÁUSULA 8 — DAS DISPOSIÇÕES GERAIS</h2>

<p>8.1. O presente contrato é regido pelas leis da República Federativa do Brasil.</p>
<p>8.2. As partes elegem o foro da Comarca de <strong>Barueri/SP</strong> para dirimir
quaisquer dúvidas ou controvérsias oriundas deste contrato, com renúncia expressa a
qualquer outro, por mais privilegiado que seja.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o
presente instrumento em 2 (duas) vias de igual teor e forma.</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>BETTER EDUCATION LTDA</strong></p>
    <p>Gilberto Gonçalves Rodrigues</p>
    <p>CNPJ: 46.849.730/0001-55</p>
  </div>
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>{{nome}}</strong></p>
    <p>CPF: {{cpf}}</p>
  </div>
</div>

<p style="text-align:center; margin-top:32px; font-size:13px; color:#555;">
  Barueri/SP, {{data_contrato}}
</p>
`;

// ---------------------------------------------------------------------------
// 3. COMMUNITY FLOW (Grupo + Aulas Individuais por Frequência)
// ---------------------------------------------------------------------------

export const COMMUNITY_FLOW_TEMPLATE = `
<h1 style="text-align:center; font-size:20px; font-weight:bold; margin-bottom:8px;">
  CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS — COMMUNITY FLOW
</h1>
<p style="text-align:center; font-size:13px; color:#555; margin-bottom:24px;">
  Contrato nº {{numero_contrato}} &bull; Data: {{data_contrato}}
</p>

<h2>CLÁUSULA 1 — DAS PARTES</h2>

<p><strong>CONTRATADA:</strong> BETTER EDUCATION LTDA, pessoa jurídica de direito privado,
inscrita no CNPJ sob o nº 46.849.730/0001-55, com sede na Alameda Terracota, 185,
Sala 1213, Barueri/SP, CEP 06460-110, neste ato representada por seu sócio-administrador
<strong>Gilberto Gonçalves Rodrigues</strong>, CPF 261.791.848-08, doravante denominada
<strong>"ALUMNI BY BETTER EDUCATION"</strong> ou simplesmente <strong>"CONTRATADA"</strong>.</p>

<p><strong>CONTRATANTE:</strong> {{nome}}, inscrito(a) no CPF sob o nº {{cpf}},
e-mail {{email}}, telefone {{telefone}}, residente e domiciliado(a) em {{endereco}},
doravante denominado(a) <strong>"CONTRATANTE"</strong> ou <strong>"ALUNO(A)"</strong>.</p>

<h2>CLÁUSULA 2 — DO OBJETO</h2>

<p>O presente contrato tem por objeto a prestação de serviços educacionais de ensino de
língua inglesa na modalidade <strong>Community Flow</strong>, sob a marca "Alumni by Better
Education", no formato <strong>{{formato}}</strong>. Esta modalidade combina aulas em
grupo com aulas individuais, conforme condições a seguir estabelecidas.</p>

<h2>CLÁUSULA 3 — DA CARGA HORÁRIA E DURAÇÃO</h2>

<p>3.1. A carga horária contratada é composta por:</p>
<ul>
  <li><strong>Aulas em grupo:</strong> {{carga_grupo}};</li>
  <li><strong>Aulas individuais:</strong> {{carga_individual}}.</li>
</ul>
<p>3.2. As aulas terão início em <strong>{{data_inicio}}</strong>.</p>
<p>3.3. Os horários das aulas em grupo serão definidos pela CONTRATADA. Os horários das
aulas individuais serão agendados de comum acordo entre o(a) CONTRATANTE e o(a)
professor(a) designado(a).</p>
<p>3.4. <strong>Liberação das aulas individuais por frequência:</strong> as aulas
individuais serão liberadas de forma progressiva, vinculadas à frequência e participação
do(a) CONTRATANTE nas aulas em grupo. Para cada ciclo de aulas em grupo efetivamente
frequentadas, conforme critério definido pela CONTRATADA, será desbloqueada 1 (uma)
aula individual. A não comparecimento às aulas em grupo, sem justificativa aceita pela
CONTRATADA, poderá atrasar a liberação das aulas individuais correspondentes.</p>
<p>3.5. A CONTRATADA reserva-se o direito de reorganizar turmas, horários e professores
a fim de garantir a melhor experiência pedagógica, comunicando as alterações com
antecedência mínima de 7 (sete) dias.</p>

<h2>CLÁUSULA 4 — DO VALOR E FORMA DE PAGAMENTO</h2>

<p>4.1. Pela prestação dos serviços e fornecimento de materiais ora contratados, o(a)
CONTRATANTE pagará à CONTRATADA o valor total de <strong>R$ {{valor_total}}</strong>.</p>
<p>4.2. O pagamento será realizado em <strong>{{parcelas}}</strong>, na forma de
<strong>{{forma_pagamento}}</strong>.</p>
<p>4.3. <strong>Composição do valor — faturamento híbrido:</strong> do valor total
contratado, <strong>50% (cinquenta por cento)</strong> refere-se à prestação de serviços
educacionais e <strong>50% (cinquenta por cento)</strong> refere-se ao fornecimento de
material didático e conteúdo pedagógico (produto), conforme legislação tributária
vigente.</p>
<p>4.4. O atraso no pagamento de qualquer parcela acarretará multa de 2% (dois por cento)
sobre o valor da parcela vencida, acrescida de juros moratórios de 1% (um por cento) ao
mês, calculados <em>pro rata die</em>.</p>

<h2>CLÁUSULA 5 — DAS OBRIGAÇÕES DA CONTRATADA</h2>

<p>5.1. Disponibilizar professor(a) qualificado(a) para as aulas em grupo e individuais,
bem como material didático adequado.</p>
<p>5.2. Manter turmas com número adequado de alunos, garantindo a qualidade do
aprendizado.</p>
<p>5.3. Fornecer acesso à plataforma digital e materiais complementares incluídos no
valor contratado.</p>
<p>5.4. Gerenciar a liberação das aulas individuais conforme a frequência do(a)
CONTRATANTE nas aulas em grupo, informando de forma transparente o saldo de aulas
individuais disponíveis.</p>
<p>5.5. Acompanhar o progresso pedagógico do(a) CONTRATANTE e disponibilizar relatórios
de evolução periodicamente.</p>

<h2>CLÁUSULA 6 — DAS OBRIGAÇÕES DO(A) CONTRATANTE</h2>

<p>6.1. Efetuar o pagamento nas datas e condições pactuadas.</p>
<p>6.2. Comparecer às aulas em grupo nos horários definidos pela CONTRATADA, ciente de
que a frequência é requisito para liberação das aulas individuais.</p>
<p>6.3. Agendar e comparecer às aulas individuais dentro do prazo de validade
estabelecido após a liberação.</p>
<p>6.4. Respeitar as regras de convivência da turma e as orientações da CONTRATADA.</p>
<p>6.5. Não reproduzir, distribuir ou compartilhar o material didático fornecido pela
CONTRATADA, sob pena de responsabilização civil e criminal.</p>

<h2>CLÁUSULA 7 — DO CANCELAMENTO E RESCISÃO</h2>

<p>7.1. O(A) CONTRATANTE poderá solicitar o cancelamento do presente contrato a qualquer
momento, mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias.</p>
<p>7.2. Em caso de cancelamento, será devido o valor proporcional às aulas já ministradas
(em grupo e individuais) e ao material didático já disponibilizado, acrescido de multa
rescisória de 20% (vinte por cento) sobre o saldo restante do contrato.</p>
<p>7.3. Aulas individuais já liberadas e não utilizadas até a data do cancelamento serão
consideradas como ministradas para efeitos de cálculo do valor proporcional.</p>
<p>7.4. O material didático e conteúdo digital eventualmente disponibilizados ao(à)
CONTRATANTE não serão objeto de devolução ou reembolso após o acesso ter sido
concedido.</p>
<p>7.5. A CONTRATADA reserva-se o direito de rescindir o contrato em caso de
inadimplência superior a 30 (trinta) dias ou por descumprimento de qualquer cláusula
contratual por parte do(a) CONTRATANTE.</p>

<h2>CLÁUSULA 8 — DAS DISPOSIÇÕES GERAIS</h2>

<p>8.1. O presente contrato é regido pelas leis da República Federativa do Brasil.</p>
<p>8.2. As partes elegem o foro da Comarca de <strong>Barueri/SP</strong> para dirimir
quaisquer dúvidas ou controvérsias oriundas deste contrato, com renúncia expressa a
qualquer outro, por mais privilegiado que seja.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o
presente instrumento em 2 (duas) vias de igual teor e forma.</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>BETTER EDUCATION LTDA</strong></p>
    <p>Gilberto Gonçalves Rodrigues</p>
    <p>CNPJ: 46.849.730/0001-55</p>
  </div>
  <div style="text-align:center; width:45%;">
    <p>_______________________________________</p>
    <p><strong>{{nome}}</strong></p>
    <p>CPF: {{cpf}}</p>
  </div>
</div>

<p style="text-align:center; margin-top:32px; font-size:13px; color:#555;">
  Barueri/SP, {{data_contrato}}
</p>
`;

// ---------------------------------------------------------------------------
// Templates map
// ---------------------------------------------------------------------------

export const B2C_TEMPLATES = {
  PRIVATE: PRIVATE_TEMPLATE,
  COMMUNITY: COMMUNITY_TEMPLATE,
  COMMUNITY_FLOW: COMMUNITY_FLOW_TEMPLATE,
} as const;

export type B2CContractType = keyof typeof B2C_TEMPLATES;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Replaces all `{{variable}}` placeholders in the given HTML string with the
 * corresponding values from the `variables` map. Unfilled variables (no match
 * in the map) are replaced with an empty string.
 */
export function replaceB2CVariables(
  html: string,
  variables: Record<string, string>,
): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

/**
 * Generates a sequential contract number in the format B2C-YYYY-NNN.
 *
 * @param sequentialNumber – the next available sequence for the current year.
 */
export function generateB2CContractNumber(sequentialNumber: number): string {
  const year = new Date().getFullYear();
  return `B2C-${year}-${String(sequentialNumber).padStart(3, '0')}`;
}

/**
 * Returns an array of unique `{{variable}}` placeholders still present in the
 * HTML — useful for validating that all required fields have been filled before
 * generating the final document.
 */
export function extractUnfilledVariables(html: string): string[] {
  const matches = html.match(/\{\{[^}]+\}\}/g);
  return matches ? [...new Set(matches)] : [];
}
