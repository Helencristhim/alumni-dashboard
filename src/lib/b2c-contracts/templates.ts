// =============================================================================
// B2C Contract Templates — Alumni by Better Education
// Real contract content extracted from official DOCX files
// =============================================================================

// ---------------------------------------------------------------------------
// 1. PRIVATE (Aulas Particulares)
// ---------------------------------------------------------------------------

export const PRIVATE_TEMPLATE = `
<h1>CONTRATO - CURSO PARTICULAR DE INGLÊS</h1>
<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h2>
<p>Data de Emissão: {{data_emissao}}</p>

<h2>1. PARTES CONTRATANTES</h2>

<h3>1.1 CONTRATADA</h3>
<p>Razão Social: Better Education – Alumni by Better<br>
CNPJ: 53.286.868/0001-66<br>
Endereço: Calçada dos Crisântemos, n18 – Condomínio Centro Comercial de Alphaville Barueri/SP – CEP 06453-008<br>
Telefone: +55 11 97380-0517</p>

<h3>1.2 CONTRATANTE</h3>
<p>Nome Completo: {{nome}}<br>
CPF: {{cpf}}<br>
E-mail: {{email}}<br>
Endereço Completo: {{endereco}}<br>
Telefone: {{telefone}}</p>

<h2>2. OBJETO DO CONTRATO</h2>
<p>A CONTRATADA prestará ao CONTRATANTE serviços educacionais de ensino de inglês na modalidade Particular conforme especificações abaixo:</p>

<h3>2.1 ESPECIFICAÇÕES DO CURSO</h3>
<p>Modalidade: Aulas individuais</p>
<p>Carga Horária Total: {{carga_horaria}}</p>
<p>Período de Vigência: {{vigencia}}</p>
<p>Formato: {{formato}}</p>

<h3>2.2 RECURSOS INCLUSOS</h3>
<p>Acesso à plataforma digital de estudos Alumni do nível indicado</p>
<p>Teste de nivelamento inicial</p>
<p>Avaliações periódicas de desempenho</p>
<p>Material didático digital (Um material de career a escolher e um grammar practice)</p>
<p>Certificado de conclusão (mediante solicitação e aproveitamento mínimo de 75% após nivelamento)</p>
<p>Suporte pedagógico via chat/e-mail</p>

<h2>3. INVESTIMENTO E CONDIÇÕES DE PAGAMENTO</h2>

<h3>3.1 VALOR TOTAL E FORMA DE PAGAMENTO</h3>
<p>Valor por aula: R$ {{valor_por_aula}}<br>
Valor total: R$ {{valor_total}}<br>
Parcelamento: {{parcelas}}<br>
Opções de Pagamento: {{forma_pagamento}}<br>
*Se trata de um parcelamento do pacote contratado</p>

<h3>3.2 ATRASO NO PAGAMENTO</h3>
<p>Em caso de atraso, serão aplicados:</p>
<p>Multa: 2% sobre o valor da parcela</p>
<p>Juros: 1% ao mês (pro rata die)</p>
<p>Suspensão: Acesso à plataforma e aulas será suspenso após 7 dias de inadimplência</p>

<h2>4. AGENDAMENTO E REALIZAÇÃO DAS AULAS</h2>

<h3>4.1 CANCELAMENTO E REAGENDAMENTO</h3>
<p>Para cancelamento - mínimo de 48h - caso o pedido seja feito em período inferior ao estipulado a aula será descontada do pacote</p>
<p>Para reagendamento - mínimo de 24h - caso o pedido seja feito em período inferior ao estipulado a aula será descontada do pacote</p>
<p>Não é possível reagendar/cancelar uma mesma aula mais de uma vez.</p>

<h2>5. VALIDADE E VIGÊNCIA</h2>

<h3>5.1 PERÍODO DE UTILIZAÇÃO</h3>
<p>Início: {{data_inicio}}</p>
<p>Término: {{data_termino}}</p>
<p>Prazo para utilização das horas: {{vigencia}}</p>
<p>Prorrogação: Mediante solicitação e aprovação, com cobrança proporcional</p>

<h3>5.2 PAUSAS/TRANCAMENTO</h3>
<p>Permitido 1 trancamento de 15 dias a cada 6 meses de contrato</p>
<p>Solicitação com 15 dias de antecedência</p>
<p>Período de trancamento não suspende cobranças das parcelas</p>

<h2>6. POLÍTICA DE CANCELAMENTO E REEMBOLSO</h2>

<h3>6.1 DIREITO DE ARREPENDIMENTO (7 DIAS - CDC)</h3>
<p>O CONTRATANTE poderá cancelar o contrato no prazo de até 7 (sete) dias corridos a contar da data da contratação, conforme art. 49 do Código de Defesa do Consumidor.</p>
<p>O cancelamento dentro deste prazo garante reembolso integral dos valores pagos;</p>
<p>O reembolso será realizado pelo mesmo meio de pagamento utilizado na contratação.</p>

<h3>6.2 CANCELAMENTO APÓS 7 DIAS</h3>
<p>Após o prazo de arrependimento:</p>
<p>O valor referente aos serviços educacionais poderá ser reembolsado conforme o consumo de aulas utilizado pelo CONTRATANTE independentemente da forma de parcelamento. O valor terá como base o valor da hora aula x aulas utilizadas</p>
<p>Sobre o valor remanescente dos serviços, será aplicada multa de 10% (dez por cento);</p>

<h3>6.3 PRAZO PARA REEMBOLSO</h3>
<p>Quando aplicável, o reembolso será efetuado em até 30 (trinta) dias úteis, contados a partir da solicitação formal de cancelamento, pelo mesmo meio de pagamento utilizado.</p>

<h3>6.4 DISPOSIÇÕES GERAIS</h3>
<p>O cancelamento deve ser solicitado por meio formal indicado pela CONTRATADA através do número (11) 97380 0517 e preenchimento do formulário envio pelo canal;</p>
<p>A não utilização das aulas ou da plataforma não caracteriza cancelamento automático nem isenta o pagamento das obrigações contratuais;</p>

<h2>7. OBRIGAÇÕES DA CONTRATADA</h2>
<p>Fornecer professores qualificados e certificados</p>
<p>Garantir acesso à plataforma digital 24/7</p>
<p>Realizar avaliações periódicas de progresso</p>
<p>Emitir certificado de conclusão (mediante solicitação e aproveitamento ≥ 75%)</p>
<p>Manter sigilo sobre dados pessoais do aluno (LGPD)</p>

<h2>8. OBRIGAÇÕES DO CONTRATANTE</h2>
<p>Efetuar pagamentos nas datas acordadas</p>
<p>Comparecer/conectar-se pontualmente às aulas agendadas</p>
<p>Utilizar adequadamente a plataforma e materiais</p>
<p>Respeitar professores e demais alunos (se aplicável)</p>
<p>Informar imediatamente problemas técnicos ou pedagógicos</p>

<h2>9. PROPRIEDADE INTELECTUAL</h2>
<p>Todo material didático é propriedade da CONTRATADA</p>
<p>Proibida reprodução, distribuição ou comercialização</p>
<p>Uso exclusivo para fins de estudo pessoal</p>

<h2>10. PROTEÇÃO DE DADOS (LGPD)</h2>
<p>Dados coletados exclusivamente para execução do contrato</p>
<p>Não haverá compartilhamento com terceiros sem autorização</p>
<p>Aluno pode solicitar exclusão de dados após término do contrato</p>

<h2>11. DISPOSIÇÕES GERAIS</h2>

<h3>11.1 ALTERAÇÕES</h3>
<p>Alterações contratuais devem ser formalizadas por escrito</p>

<h3>11.2 CESSÃO</h3>
<p>Contrato não pode ser cedido sem anuência das partes</p>

<h3>11.3 CASO FORTUITO/FORÇA MAIOR</h3>
<p>Partes isentas de responsabilidade em situações imprevisíveis</p>

<h3>11.4 COMUNICAÇÃO</h3>
<p>Comunicações oficiais via e-mail cadastrado e através do número (11) 97380 0517 via whatsapp</p>
<p>Prazo de resposta: 48 horas úteis</p>

<h2>12. FORO</h2>
<p>As partes elegem o foro da Comarca de Barueri/SP para dirimir quaisquer dúvidas oriundas deste contrato.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o presente instrumento.</p>

<p style="text-align:center; margin-top:24px;">Barueri/SP, {{data_emissao}}</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>BETTER EDUCATION LTDA</strong></p><p>Alumni by Better</p></div>
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>{{nome}}</strong></p><p>CPF: {{cpf}}</p></div>
</div>
`;

// ---------------------------------------------------------------------------
// 2. COMMUNITY (Aulas em Grupo)
// ---------------------------------------------------------------------------

export const COMMUNITY_TEMPLATE = `
<h1>CONTRATO - CURSO COMMUNITY DE INGLÊS</h1>
<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h2>
<p>Data de Emissão: {{data_emissao}}</p>

<h2>1. PARTES CONTRATANTES</h2>

<h3>1.1 CONTRATADA</h3>
<p>Razão Social: Better Education – Alumni by Better<br>
CNPJ: 53.286.868/0001-66<br>
Endereço: Calçada dos Crisântemos, n18 – Condomínio Centro Comercial de Alphaville Barueri/SP – CEP 06453-008<br>
Telefone: +55 11 97380-0517</p>

<h3>1.2 CONTRATANTE</h3>
<p>Nome Completo: {{nome}}<br>
CPF: {{cpf}}<br>
E-mail: {{email}}<br>
Endereço Completo: {{endereco}}<br>
Telefone: {{telefone}}</p>

<h2>2. OBJETO DO CONTRATO</h2>
<p>A CONTRATADA prestará ao CONTRATANTE serviços educacionais de ensino de inglês na modalidade Community conforme especificações abaixo:</p>

<h3>2.1 ESPECIFICAÇÕES DO CURSO</h3>
<p>Modalidade: Aulas em grupo</p>
<p>Carga Horária Total: {{carga_horaria_total}}</p>
<p>Duração da Aula: {{duracao_aula}}</p>
<p>Período de Vigência: {{vigencia}}</p>
<p>Formato: {{formato}}</p>

<h3>2.2 RECURSOS INCLUSOS</h3>
<p>Acesso à plataforma digital de estudos Alumni do nível indicado</p>
<p>Teste de nivelamento inicial</p>
<p>Avaliações periódicas de desempenho</p>
<p>Material didático digital (1 Módulo - Careers e um grammar practice)</p>
<p>Certificado de conclusão (mediante solicitação e aproveitamento mínimo de 75% após nivelamento)</p>
<p>Suporte pedagógico via chat/e-mail</p>

<h2>3. INVESTIMENTO E CONDIÇÕES DE PAGAMENTO</h2>

<h3>3.1 VALOR TOTAL E FORMA DE PAGAMENTO</h3>
<p>Valor total: R$ {{valor_total}}<br>
Parcelamento: {{parcelas}}<br>
Opções de Pagamento: {{forma_pagamento}}<br>
*Se trata de um parcelamento do pacote contratado</p>

<h3>3.2 NOTAS FISCAIS</h3>
<p>Composição do valor — faturamento híbrido: do valor total contratado, 50% (cinquenta por cento) refere-se à prestação de serviços educacionais e 50% (cinquenta por cento) refere-se ao fornecimento de material didático e conteúdo pedagógico (produto), conforme legislação tributária vigente.</p>

<h3>3.3 ATRASO NO PAGAMENTO</h3>
<p>Em caso de atraso, serão aplicados:</p>
<p>Multa: 2% sobre o valor da parcela</p>
<p>Juros: 1% ao mês (pro rata die)</p>
<p>Suspensão: Acesso à plataforma e aulas será suspenso após 7 dias de inadimplência</p>

<h2>4. AGENDAMENTO E REALIZAÇÃO DAS AULAS</h2>

<h3>4.1 CANCELAMENTO E REAGENDAMENTO</h3>
<p>Para cancelamento - mínimo de 6h de antecedência - caso o pedido seja feito em período inferior ao estipulado a aula será considerada como frequentada</p>
<p>Para reagendamento - mínimo de 30 minutos de antecedência - caso o pedido seja feito em período inferior ao estipulado a aula será considerada como frequentada</p>
<p>Não é possível reagendar/cancelar uma mesma aula mais de uma vez.</p>

<h2>5. VALIDADE E VIGÊNCIA</h2>

<h3>5.1 PERÍODO DE UTILIZAÇÃO</h3>
<p>Início: {{data_inicio}}</p>
<p>Término: {{data_termino}}</p>
<p>Prazo para utilização das horas: {{vigencia}}</p>
<p>Prorrogação: Mediante solicitação e aprovação, com cobrança proporcional</p>

<h3>5.2 PAUSAS/TRANCAMENTO</h3>
<p>Permitido 1 trancamento de 15 dias a cada 3 meses de contrato</p>
<p>Solicitação com 15 dias de antecedência</p>
<p>Período de trancamento não suspende cobranças das parcelas</p>

<h2>6. POLÍTICA DE CANCELAMENTO E REEMBOLSO</h2>

<h3>6.1 DIREITO DE ARREPENDIMENTO (7 DIAS - CDC)</h3>
<p>O CONTRATANTE poderá cancelar o contrato no prazo de até 7 (sete) dias corridos a contar da data da contratação, conforme art. 49 do Código de Defesa do Consumidor.</p>
<p>O cancelamento dentro deste prazo garante reembolso integral dos valores pagos;</p>
<p>O reembolso será realizado pelo mesmo meio de pagamento utilizado na contratação.</p>

<h3>6.2 CANCELAMENTO APÓS 7 DIAS</h3>
<p>Após o prazo de arrependimento:</p>
<p>O valor referente aos serviços educacionais (50%) poderá ser reembolsado proporcionalmente conforme as aulas frequentadas pelo CONTRATANTE, independentemente da forma de parcelamento.</p>
<p>O valor referente ao material didático e conteúdo pedagógico (50%) não será objeto de devolução ou reembolso após o acesso ter sido concedido.</p>
<p>Sobre o valor remanescente dos serviços, será aplicada multa de 10% (dez por cento);</p>

<h3>6.3 PRAZO PARA REEMBOLSO</h3>
<p>Quando aplicável, o reembolso será efetuado em até 30 (trinta) dias úteis, contados a partir da solicitação formal de cancelamento, pelo mesmo meio de pagamento utilizado.</p>

<h3>6.4 DISPOSIÇÕES GERAIS</h3>
<p>O cancelamento deve ser solicitado por meio formal indicado pela CONTRATADA através do número (11) 97380 0517 e preenchimento do formulário envio pelo canal;</p>
<p>A não utilização das aulas ou da plataforma não caracteriza cancelamento automático nem isenta o pagamento das obrigações contratuais;</p>

<h2>7. OBRIGAÇÕES DA CONTRATADA</h2>
<p>Fornecer professores qualificados e certificados</p>
<p>Garantir acesso à plataforma digital 24/7</p>
<p>Realizar avaliações periódicas de progresso</p>
<p>Emitir certificado de conclusão (mediante solicitação e aproveitamento ≥ 75%)</p>
<p>Manter sigilo sobre dados pessoais do aluno (LGPD)</p>

<h2>8. OBRIGAÇÕES DO CONTRATANTE</h2>
<p>Efetuar pagamentos nas datas acordadas</p>
<p>Comparecer/conectar-se pontualmente às aulas agendadas</p>
<p>Utilizar adequadamente a plataforma e materiais</p>
<p>Respeitar professores e demais alunos</p>
<p>Informar imediatamente problemas técnicos ou pedagógicos</p>

<h2>9. PROPRIEDADE INTELECTUAL</h2>
<p>Todo material didático é propriedade da CONTRATADA</p>
<p>Proibida reprodução, distribuição ou comercialização</p>
<p>Uso exclusivo para fins de estudo pessoal</p>

<h2>10. PROTEÇÃO DE DADOS (LGPD)</h2>
<p>Dados coletados exclusivamente para execução do contrato</p>
<p>Não haverá compartilhamento com terceiros sem autorização</p>
<p>Aluno pode solicitar exclusão de dados após término do contrato</p>

<h2>11. DISPOSIÇÕES GERAIS</h2>

<h3>11.1 ALTERAÇÕES</h3>
<p>Alterações contratuais devem ser formalizadas por escrito</p>

<h3>11.2 CESSÃO</h3>
<p>Contrato não pode ser cedido sem anuência das partes</p>

<h3>11.3 CASO FORTUITO/FORÇA MAIOR</h3>
<p>Partes isentas de responsabilidade em situações imprevisíveis</p>

<h3>11.4 COMUNICAÇÃO</h3>
<p>Comunicações oficiais via e-mail cadastrado e através do número (11) 97380 0517 via whatsapp</p>
<p>Prazo de resposta: 48 horas úteis</p>

<h2>12. FORO</h2>
<p>As partes elegem o foro da Comarca de Barueri/SP para dirimir quaisquer dúvidas oriundas deste contrato.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o presente instrumento.</p>

<p style="text-align:center; margin-top:24px;">Barueri/SP, {{data_emissao}}</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>BETTER EDUCATION LTDA</strong></p><p>Alumni by Better</p></div>
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>{{nome}}</strong></p><p>CPF: {{cpf}}</p></div>
</div>
`;

// ---------------------------------------------------------------------------
// 3. COMMUNITY FLOW (Grupo + Aulas Individuais por Frequência)
// ---------------------------------------------------------------------------

export const COMMUNITY_FLOW_TEMPLATE = `
<h1>CONTRATO - CURSO COMMUNITY FLOW DE INGLÊS</h1>
<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h2>
<p>Data de Emissão: {{data_emissao}}</p>

<h2>1. PARTES CONTRATANTES</h2>

<h3>1.1 CONTRATADA</h3>
<p>Razão Social: Better Education – Alumni by Better<br>
CNPJ: 53.286.868/0001-66<br>
Endereço: Calçada dos Crisântemos, n18 – Condomínio Centro Comercial de Alphaville Barueri/SP – CEP 06453-008<br>
Telefone: +55 11 97380-0517</p>

<h3>1.2 CONTRATANTE</h3>
<p>Nome Completo: {{nome}}<br>
CPF: {{cpf}}<br>
E-mail: {{email}}<br>
Endereço Completo: {{endereco}}<br>
Telefone: {{telefone}}</p>

<h2>2. OBJETO DO CONTRATO</h2>
<p>A CONTRATADA prestará ao CONTRATANTE serviços educacionais de ensino de inglês na modalidade Community Flow conforme especificações abaixo:</p>

<h3>2.1 ESPECIFICAÇÕES DO CURSO</h3>
<p>Modalidade: Aulas em grupo e individuais</p>
<p>Carga Horária Total: {{carga_grupo}} (grupo) + {{carga_individual}} (individual)</p>
<p>Período de Vigência: {{vigencia}}</p>
<p>Formato: {{formato}}</p>
<p><em>Nota: As aulas individuais são liberadas progressivamente, sendo 1 aula individual a cada 5 presenças em aulas de grupo.</em></p>

<h3>2.2 RECURSOS INCLUSOS</h3>
<p>Acesso à plataforma digital de estudos Alumni do nível indicado</p>
<p>Teste de nivelamento inicial</p>
<p>Avaliações periódicas de desempenho</p>
<p>Material didático digital (1 Módulo - Careers e um grammar practice)</p>
<p>Certificado de conclusão (mediante solicitação e aproveitamento mínimo de 75% após nivelamento)</p>
<p>Suporte pedagógico via chat/e-mail</p>

<h2>3. INVESTIMENTO E CONDIÇÕES DE PAGAMENTO</h2>

<h3>3.1 VALOR TOTAL E FORMA DE PAGAMENTO</h3>
<p>Valor total: R$ {{valor_total}}<br>
Parcelamento: {{parcelas}}<br>
Opções de Pagamento: {{forma_pagamento}}<br>
*Se trata de um parcelamento do pacote contratado</p>

<h3>3.2 NOTAS FISCAIS</h3>
<p>Composição do valor — faturamento híbrido: do valor total contratado, 50% (cinquenta por cento) refere-se à prestação de serviços educacionais e 50% (cinquenta por cento) refere-se ao fornecimento de material didático e conteúdo pedagógico (produto), conforme legislação tributária vigente.</p>

<h3>3.3 ATRASO NO PAGAMENTO</h3>
<p>Em caso de atraso, serão aplicados:</p>
<p>Multa: 2% sobre o valor da parcela</p>
<p>Juros: 1% ao mês (pro rata die)</p>
<p>Suspensão: Acesso à plataforma e aulas será suspenso após 7 dias de inadimplência</p>

<h2>4. AGENDAMENTO E REALIZAÇÃO DAS AULAS</h2>

<h3>4.1 CANCELAMENTO E REAGENDAMENTO</h3>
<p>Para cancelamento - mínimo de 6h de antecedência - caso o pedido seja feito em período inferior ao estipulado a aula será considerada como frequentada</p>
<p>Para reagendamento - mínimo de 30 minutos de antecedência - caso o pedido seja feito em período inferior ao estipulado a aula será considerada como frequentada</p>
<p>Não é possível reagendar/cancelar uma mesma aula mais de uma vez.</p>

<h2>5. VALIDADE E VIGÊNCIA</h2>

<h3>5.1 PERÍODO DE UTILIZAÇÃO</h3>
<p>Início: {{data_inicio}}</p>
<p>Término: {{data_termino}}</p>
<p>Prazo para utilização das horas: {{vigencia}}</p>
<p>Prorrogação: Mediante solicitação e aprovação, com cobrança proporcional</p>

<h3>5.2 PAUSAS/TRANCAMENTO</h3>
<p>Permitido 1 trancamento de 15 dias a cada 6 meses de contrato</p>
<p>Solicitação com 15 dias de antecedência</p>
<p>Período de trancamento não suspende cobranças das parcelas</p>

<h2>6. POLÍTICA DE CANCELAMENTO E REEMBOLSO</h2>

<h3>6.1 DIREITO DE ARREPENDIMENTO (7 DIAS - CDC)</h3>
<p>O CONTRATANTE poderá cancelar o contrato no prazo de até 7 (sete) dias corridos a contar da data da contratação, conforme art. 49 do Código de Defesa do Consumidor.</p>
<p>O cancelamento dentro deste prazo garante reembolso integral dos valores pagos;</p>
<p>O reembolso será realizado pelo mesmo meio de pagamento utilizado na contratação.</p>

<h3>6.2 CANCELAMENTO APÓS 7 DIAS</h3>
<p>Após o prazo de arrependimento:</p>
<p>O valor referente aos serviços educacionais (50%) poderá ser reembolsado proporcionalmente conforme as aulas frequentadas pelo CONTRATANTE, independentemente da forma de parcelamento.</p>
<p>O valor referente ao material didático e conteúdo pedagógico (50%) não será objeto de devolução ou reembolso após o acesso ter sido concedido.</p>
<p>Aulas individuais já liberadas e não utilizadas até a data do cancelamento serão consideradas como frequentadas para efeitos de cálculo do valor proporcional.</p>
<p>Sobre o valor remanescente dos serviços, será aplicada multa de 10% (dez por cento);</p>

<h3>6.3 PRAZO PARA REEMBOLSO</h3>
<p>Quando aplicável, o reembolso será efetuado em até 30 (trinta) dias úteis, contados a partir da solicitação formal de cancelamento, pelo mesmo meio de pagamento utilizado.</p>

<h3>6.4 DISPOSIÇÕES GERAIS</h3>
<p>O cancelamento deve ser solicitado por meio formal indicado pela CONTRATADA através do número (11) 97380 0517 e preenchimento do formulário envio pelo canal;</p>
<p>A não utilização das aulas ou da plataforma não caracteriza cancelamento automático nem isenta o pagamento das obrigações contratuais;</p>

<h2>7. OBRIGAÇÕES DA CONTRATADA</h2>
<p>Fornecer professores qualificados e certificados</p>
<p>Garantir acesso à plataforma digital 24/7</p>
<p>Realizar avaliações periódicas de progresso</p>
<p>Emitir certificado de conclusão (mediante solicitação e aproveitamento ≥ 75%)</p>
<p>Manter sigilo sobre dados pessoais do aluno (LGPD)</p>

<h2>8. OBRIGAÇÕES DO CONTRATANTE</h2>
<p>Efetuar pagamentos nas datas acordadas</p>
<p>Comparecer/conectar-se pontualmente às aulas agendadas</p>
<p>Utilizar adequadamente a plataforma e materiais</p>
<p>Respeitar professores e demais alunos</p>
<p>Informar imediatamente problemas técnicos ou pedagógicos</p>

<h2>9. PROPRIEDADE INTELECTUAL</h2>
<p>Todo material didático é propriedade da CONTRATADA</p>
<p>Proibida reprodução, distribuição ou comercialização</p>
<p>Uso exclusivo para fins de estudo pessoal</p>

<h2>10. PROTEÇÃO DE DADOS (LGPD)</h2>
<p>Dados coletados exclusivamente para execução do contrato</p>
<p>Não haverá compartilhamento com terceiros sem autorização</p>
<p>Aluno pode solicitar exclusão de dados após término do contrato</p>

<h2>11. DISPOSIÇÕES GERAIS</h2>

<h3>11.1 ALTERAÇÕES</h3>
<p>Alterações contratuais devem ser formalizadas por escrito</p>

<h3>11.2 CESSÃO</h3>
<p>Contrato não pode ser cedido sem anuência das partes</p>

<h3>11.3 CASO FORTUITO/FORÇA MAIOR</h3>
<p>Partes isentas de responsabilidade em situações imprevisíveis</p>

<h3>11.4 COMUNICAÇÃO</h3>
<p>Comunicações oficiais via e-mail cadastrado e através do número (11) 97380 0517 via whatsapp</p>
<p>Prazo de resposta: 48 horas úteis</p>

<h2>12. FORO</h2>
<p>As partes elegem o foro da Comarca de Barueri/SP para dirimir quaisquer dúvidas oriundas deste contrato.</p>

<p style="margin-top:32px;">E, por estarem justas e contratadas, as partes assinam o presente instrumento.</p>

<p style="text-align:center; margin-top:24px;">Barueri/SP, {{data_emissao}}</p>

<div style="margin-top:48px; display:flex; justify-content:space-between;">
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>BETTER EDUCATION LTDA</strong></p><p>Alumni by Better</p></div>
<div style="text-align:center; width:45%;"><p>_______________________________________</p><p><strong>{{nome}}</strong></p><p>CPF: {{cpf}}</p></div>
</div>
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
