import { ContractVariables, ContractProgramData, TemplateType } from '@/types/contracts';

// ============================================================
// GERADOR DE CONTRATOS COM 3 TEMPLATES
// ============================================================

interface ClauseGeneratorInput {
  templateType: TemplateType;
  brand: string;
  variables: Partial<ContractVariables>;
  programs: ContractProgramData[];
}

// Header com logo da marca
function generateLogoHeader(logoUrl?: string): string {
  if (!logoUrl) {
    return `
<div style="text-align:center;margin-bottom:8px;padding-bottom:12px;border-bottom:2px solid #1a1a1a;">
  <p style="font-size:14pt;font-weight:bold;color:#333;">Alumni by Better</p>
</div>`;
  }

  return `
<div style="text-align:center;margin-bottom:8px;padding-bottom:12px;border-bottom:2px solid #1a1a1a;">
  <img src="${logoUrl}" alt="Logo" style="max-height:80px;max-width:300px;object-fit:contain;" />
</div>`;
}

// Bloco de assinaturas
function generateSignatureBlock(v: Partial<ContractVariables>): string {
  return `
<div style="margin-top:48px;">
  <p>E por estarem assim justas e acordadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.</p>
  <p style="text-align:center;margin-top:24px;"><span data-variable="foro_cidade">{{foro_cidade}}</span>, _____ de _________________ de _______.</p>

  <div style="display:flex;justify-content:space-between;margin-top:48px;">
    <div style="text-align:center;width:45%;">
      <p style="border-top:1px solid #1a1a1a;padding-top:8px;"><strong>CONTRATANTE</strong></p>
      <p><span data-variable="razao_social">{{razao_social}}</span></p>
      <p><span data-variable="representante_nome">{{representante_nome}}</span></p>
    </div>
    <div style="text-align:center;width:45%;">
      <p style="border-top:1px solid #1a1a1a;padding-top:8px;"><strong>CONTRATADA</strong></p>
      <p><span data-variable="empresa_contratada_nome">{{empresa_contratada_nome}}</span></p>
      <p><span data-variable="empresa_representante_nome">{{empresa_representante_nome}}</span></p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:48px;">
    <div style="text-align:center;width:45%;">
      <p style="border-top:1px solid #1a1a1a;padding-top:8px;"><strong>Testemunha 1</strong></p>
      <p>Nome: _________________________</p>
      <p>CPF: __________________________</p>
    </div>
    <div style="text-align:center;width:45%;">
      <p style="border-top:1px solid #1a1a1a;padding-top:8px;"><strong>Testemunha 2</strong></p>
      <p>Nome: _________________________</p>
      <p>CPF: __________________________</p>
    </div>
  </div>
</div>`;
}

// Tabela de programas contratados
function generateProgramsTable(programs: ContractProgramData[]): string {
  if (programs.length === 0) return '';

  const rows = programs
    .map(
      (p) => `
    <tr>
      <td style="border:1px solid #999;padding:8px;">${p.tipoPrograma}</td>
      <td style="border:1px solid #999;padding:8px;text-align:center;">${p.quantidade}</td>
      <td style="border:1px solid #999;padding:8px;text-align:right;">R$ ${p.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #999;padding:8px;text-align:right;">R$ ${p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
    </tr>`
    )
    .join('');

  const total = programs.reduce((sum, p) => sum + p.valorTotal, 0);

  return `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background-color:#f0f0f0;">
      <th style="border:1px solid #999;padding:8px;text-align:left;font-weight:bold;">Programa</th>
      <th style="border:1px solid #999;padding:8px;text-align:center;font-weight:bold;">Qtd. Participantes</th>
      <th style="border:1px solid #999;padding:8px;text-align:right;font-weight:bold;">Valor Unitário</th>
      <th style="border:1px solid #999;padding:8px;text-align:right;font-weight:bold;">Valor Total</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr style="background-color:#f0f0f0;">
      <td style="border:1px solid #999;padding:8px;font-weight:bold;" colspan="3">TOTAL</td>
      <td style="border:1px solid #999;padding:8px;text-align:right;font-weight:bold;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tbody>
</table>`;
}

// ============================================================
// TEMPLATE 1: MASTER AGREEMENT
// ============================================================
function generateMasterAgreement(
  v: Partial<ContractVariables>,
): string {
  return `
<h1 style="text-align:center;font-size:16pt;font-weight:bold;margin:24px 0 8px;text-transform:uppercase;">MASTER AGREEMENT</h1>
<h2 style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:24px;color:#333;">Contrato de Prestação de Serviços Educacionais</h2>

<p>Por este instrumento particular e na melhor forma de direito, as partes abaixo qualificadas:</p>

<p><strong style="color:#1a56db;">CONTRATANTE:</strong> <span data-variable="razao_social">{{razao_social}}</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº <span data-variable="cnpj">{{cnpj}}</span>, com sede na <span data-variable="endereco">{{endereco}}</span>, neste ato representada por <span data-variable="representante_nome">{{representante_nome}}</span>, portador(a) do CPF nº <span data-variable="representante_cpf">{{representante_cpf}}</span>.</p>

<p><strong style="color:#1a56db;">CONTRATADA:</strong> <span data-variable="empresa_contratada_nome">{{empresa_contratada_nome}}</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº <span data-variable="empresa_contratada_cnpj">{{empresa_contratada_cnpj}}</span>, com sede na <span data-variable="empresa_contratada_endereco">{{empresa_contratada_endereco}}</span>, neste ato representada por <span data-variable="empresa_representante_nome">{{empresa_representante_nome}}</span>, portador(a) do CPF nº <span data-variable="empresa_representante_cpf">{{empresa_representante_cpf}}</span>.</p>

<p>As partes acima qualificadas resolvem celebrar o presente <strong>MASTER AGREEMENT</strong>, que se regerá pelas cláusulas e condições seguintes:</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 1ª – DO OBJETO</h2>
<p>O presente <strong>MASTER AGREEMENT</strong> estabelece os termos e condições gerais para a prestação de serviços educacionais pela <strong>CONTRATADA</strong> à <strong>CONTRATANTE</strong>, abrangendo programas de idiomas e/ou soluções educacionais corporativas.</p>
<p>Os serviços específicos contratados, bem como as respectivas condições comerciais, serão detalhados em Anexos ou Propostas Comerciais que integrarão este instrumento como parte indissociável.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 2ª – DA ESTRUTURA CONTRATUAL</h2>
<p>O presente contrato será composto por:</p>
<ul>
  <li>Este <strong>Master Agreement</strong>, com os termos e condições gerais;</li>
  <li><strong>Termos e Condições de Uso</strong>, com regras de convivência e uso da plataforma;</li>
  <li><strong>Anexos Comerciais</strong>, com detalhamento dos programas, valores e prazos.</li>
</ul>
<p>Cada Anexo Comercial poderá corresponder a um programa educacional distinto, com vigência própria.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 3ª – DO ESCOPO DOS PROGRAMAS</h2>
<p>Os programas poderão incluir, entre outros formatos:</p>
<ul>
  <li>Aulas individuais (particulares) presenciais ou online;</li>
  <li>Aulas em grupo (turmas corporativas) presenciais ou online;</li>
  <li>Programas corporativos customizados;</li>
  <li>Programas educacionais para instituições de ensino;</li>
  <li>Cursos especiais ou workshops temáticos.</li>
</ul>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 4ª – DA PRESTAÇÃO DOS SERVIÇOS</h2>
<p><strong>4.1</strong> A <strong>CONTRATADA</strong> será responsável pela metodologia educacional, pela seleção e treinamento dos professores e pela qualidade pedagógica dos programas.</p>
<p><strong>4.2</strong> As aulas poderão ocorrer em ambiente online (plataforma própria da CONTRATADA) ou presencial (nas instalações da CONTRATANTE ou em local definido de comum acordo), conforme especificado em cada Anexo.</p>
<p><strong>4.3</strong> A <strong>CONTRATADA</strong> poderá utilizar sua plataforma digital própria para a condução das aulas, disponibilização de materiais e acompanhamento do progresso dos participantes.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 5ª – DAS CONDIÇÕES COMERCIAIS</h2>
<p>Os valores, prazos de pagamento e demais condições financeiras serão definidos em cada Anexo ou Proposta Comercial vinculada a este contrato.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 6ª – DO PRAZO</h2>
<p><strong>6.1</strong> O presente MASTER AGREEMENT terá prazo indeterminado, permanecendo válido enquanto existirem Anexos ou Propostas Comerciais ativas vinculadas a ele.</p>
<p><strong>6.2</strong> A vigência de cada programa contratado será definida no respectivo Anexo Comercial.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 7ª – DAS RESPONSABILIDADES DAS PARTES</h2>
<p><strong>7.1</strong> A <strong>CONTRATADA</strong> compromete-se a:</p>
<ul>
  <li>Prestar os serviços conforme sua metodologia educacional;</li>
  <li>Disponibilizar professores qualificados;</li>
  <li>Fornecer materiais didáticos necessários ao programa;</li>
  <li>Apresentar relatórios periódicos quando aplicável.</li>
</ul>
<p><strong>7.2</strong> A <strong>CONTRATANTE</strong> compromete-se a:</p>
<ul>
  <li>Colaborar com a comunicação e participação dos usuários inscritos;</li>
  <li>Disponibilizar infraestrutura necessária para aulas presenciais, quando aplicável;</li>
  <li>Efetuar os pagamentos nas datas acordadas.</li>
</ul>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 8ª – DA CONFIDENCIALIDADE</h2>
<p>As partes comprometem-se a manter confidenciais todas as informações comerciais, pedagógicas e estratégicas trocadas em função deste contrato, não podendo divulgá-las a terceiros sem prévia autorização escrita da outra parte, exceto quando exigido por lei ou ordem judicial.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 9ª – DA PROTEÇÃO DE DADOS (LGPD)</h2>
<p><strong>9.1</strong> As partes comprometem-se a cumprir integralmente a legislação de proteção de dados pessoais aplicável, incluindo a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).</p>
<p><strong>9.2</strong> Os dados pessoais dos participantes serão tratados exclusivamente para a finalidade de prestação dos serviços educacionais contratados.</p>
<p><strong>9.3</strong> A <strong>CONTRATADA</strong> adotará medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, perda ou destruição.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 10ª – DO NÃO VÍNCULO EMPREGATÍCIO</h2>
<p>Não haverá qualquer vínculo empregatício entre os profissionais da <strong>CONTRATADA</strong> e a <strong>CONTRATANTE</strong>. A relação entre as partes é exclusivamente de natureza civil.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 11ª – DA PROPRIEDADE INTELECTUAL</h2>
<p>Todo o material didático, metodologia, plataforma e conteúdos desenvolvidos pela <strong>CONTRATADA</strong> são de sua propriedade intelectual exclusiva, sendo vedada a reprodução, distribuição ou utilização para fins diversos dos contratados.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 12ª – DA RESCISÃO</h2>
<p><strong>12.1</strong> Qualquer das partes poderá rescindir este contrato mediante notificação por escrito com antecedência mínima de 30 (trinta) dias, observando as condições previstas nos Anexos ativos.</p>
<p><strong>12.2</strong> Em caso de descumprimento de qualquer cláusula, a parte prejudicada poderá rescindir o contrato imediatamente, sem prejuízo de eventuais perdas e danos.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">CLÁUSULA 13ª – DO FORO</h2>
<p>Fica eleito o foro da comarca de <span data-variable="foro_cidade">{{foro_cidade}}</span>/<span data-variable="foro_estado">{{foro_estado}}</span> para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa de qualquer outro, por mais privilegiado que seja.</p>

${generateSignatureBlock(v)}
`;
}

// ============================================================
// TEMPLATE 2: TERMOS E CONDIÇÕES
// ============================================================
function generateTermosCondicoes(
  v: Partial<ContractVariables>,
): string {
  return `
<h1 style="text-align:center;font-size:16pt;font-weight:bold;margin:24px 0 8px;text-transform:uppercase;">TERMOS E CONDIÇÕES DE USO</h1>
<h2 style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:24px;color:#333;">Programa Corporativo de Idiomas</h2>

<p>Os presentes Termos e Condições de Uso integram o <strong>Contrato de Prestação de Serviços Educacionais</strong> celebrado entre:</p>

<p><strong style="color:#1a56db;">CONTRATANTE:</strong> <span data-variable="razao_social">{{razao_social}}</span>, inscrita no CNPJ/MF sob o nº <span data-variable="cnpj">{{cnpj}}</span>.</p>

<p><strong style="color:#1a56db;">CONTRATADA:</strong> <span data-variable="empresa_contratada_nome">{{empresa_contratada_nome}}</span>, inscrita no CNPJ/MF sob o nº <span data-variable="empresa_contratada_cnpj">{{empresa_contratada_cnpj}}</span>.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">1. DISPOSIÇÕES GERAIS</h2>
<p><strong>1.1</strong> Estes Termos e Condições aplicam-se a todos os participantes (alunos) indicados pela <strong>CONTRATANTE</strong> e inscritos nos programas educacionais da <strong>CONTRATADA</strong>.</p>
<p><strong>1.2</strong> Ao iniciar sua participação no programa, o aluno declara que leu e concorda com os presentes Termos.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">2. ACESSO À PLATAFORMA E MATERIAIS</h2>
<p><strong>2.1</strong> A <strong>CONTRATADA</strong> disponibilizará ao participante acesso à sua plataforma digital para a realização das aulas e acesso a materiais didáticos.</p>
<p><strong>2.2</strong> O acesso é pessoal e intransferível, sendo vedado o compartilhamento de credenciais com terceiros.</p>
<p><strong>2.3</strong> Os materiais didáticos disponibilizados são de propriedade intelectual exclusiva da <strong>CONTRATADA</strong>, sendo vedada sua reprodução, distribuição ou comercialização.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">3. FREQUÊNCIA E PARTICIPAÇÃO</h2>
<p><strong>3.1</strong> O participante deverá comparecer às aulas nos dias e horários definidos, seja em formato presencial ou online.</p>
<p><strong>3.2</strong> Em caso de ausência, o participante deverá comunicar com antecedência mínima de <strong style="color:#dc2626;">24 (vinte e quatro) horas</strong>. Caso contrário, a aula será considerada como realizada.</p>
<p><strong>3.3</strong> Ausências não comunicadas ou comunicadas fora do prazo <strong style="color:#dc2626;">não dão direito a reposição</strong>.</p>
<p><strong>3.4</strong> A frequência mínima recomendada para aproveitamento adequado do programa é de <strong>75% (setenta e cinco por cento)</strong> das aulas programadas.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">4. REAGENDAMENTO DE AULAS</h2>
<p><strong>4.1</strong> O reagendamento de aulas individuais poderá ser solicitado com antecedência mínima de 24 horas, ficando sujeito à disponibilidade de horário do professor.</p>
<p><strong>4.2</strong> Para aulas em grupo, o reagendamento ficará sujeito à disponibilidade da turma e do professor, não sendo garantida a reposição individual.</p>
<p><strong>4.3</strong> Feriados nacionais e locais (da cidade sede da <strong>CONTRATADA</strong>) serão compensados conforme calendário definido no início de cada semestre.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">5. CÓDIGO DE CONDUTA</h2>
<p>O participante compromete-se a:</p>
<ul>
  <li>Manter postura respeitosa com professores, colegas e demais participantes;</li>
  <li>Não utilizar a plataforma para fins alheios ao programa educacional;</li>
  <li>Não gravar, reproduzir ou distribuir aulas sem autorização prévia e expressa da <strong>CONTRATADA</strong>;</li>
  <li>Respeitar os horários estabelecidos para início e término das aulas;</li>
  <li>Comunicar eventuais dificuldades ou insatisfações ao coordenador do programa.</li>
</ul>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">6. NIVELAMENTO E AVALIAÇÕES</h2>
<p><strong>6.1</strong> Antes do início do programa, o participante poderá ser submetido a um teste de nivelamento para adequação à turma ou plano de estudos mais apropriado.</p>
<p><strong>6.2</strong> A <strong>CONTRATADA</strong> poderá realizar avaliações periódicas para acompanhar o progresso do participante e promover eventuais reclassificações de nível.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">7. CERTIFICAÇÃO</h2>
<p><strong>7.1</strong> Ao final de cada módulo ou ciclo do programa, o participante que atender aos critérios de frequência mínima e aproveitamento receberá certificado de conclusão.</p>
<p><strong>7.2</strong> O certificado será emitido em formato digital pela <strong>CONTRATADA</strong>.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">8. SUBSTITUIÇÃO E DESLIGAMENTO DE PARTICIPANTES</h2>
<p><strong>8.1</strong> A <strong>CONTRATANTE</strong> poderá solicitar a substituição de participantes durante a vigência do contrato, observando as condições previstas no Anexo Comercial.</p>
<p><strong>8.2</strong> O desligamento de um participante do programa não isenta a <strong>CONTRATANTE</strong> das obrigações financeiras relativas ao período contratado.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">9. PROTEÇÃO DE DADOS</h2>
<p><strong>9.1</strong> Os dados pessoais dos participantes serão tratados em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).</p>
<p><strong>9.2</strong> Os dados serão utilizados exclusivamente para a finalidade de prestação dos serviços educacionais e geração de relatórios ao <strong>CONTRATANTE</strong>.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">10. DISPOSIÇÕES FINAIS</h2>
<p><strong>10.1</strong> A <strong>CONTRATADA</strong> reserva-se o direito de atualizar estes Termos e Condições, comunicando as alterações à <strong>CONTRATANTE</strong> com antecedência mínima de 15 (quinze) dias.</p>
<p><strong>10.2</strong> Os casos omissos serão resolvidos de comum acordo entre as partes, prevalecendo as disposições do Master Agreement e da legislação aplicável.</p>

${generateSignatureBlock(v)}
`;
}

// ============================================================
// TEMPLATE 3: ANEXO CONDIÇÕES COMERCIAIS
// ============================================================
function generateAnexoComercial(
  v: Partial<ContractVariables>,
  programs: ContractProgramData[],
): string {
  return `
<h1 style="text-align:center;font-size:16pt;font-weight:bold;margin:24px 0 8px;text-transform:uppercase;">ANEXO I – CONDIÇÕES COMERCIAIS</h1>
<h2 style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:24px;color:#333;">Programa Corporativo de Idiomas</h2>

<p>Por este instrumento e na melhor forma de direito, de um lado:</p>

<p><strong style="color:#1a56db;">CONTRATANTE:</strong> <span data-variable="razao_social">{{razao_social}}</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF nº <span data-variable="cnpj">{{cnpj}}</span>, com sede à <span data-variable="endereco">{{endereco}}</span>, neste ato representada por <span data-variable="representante_nome">{{representante_nome}}</span>, portador(a) do CPF nº <span data-variable="representante_cpf">{{representante_cpf}}</span>, doravante denominada simplesmente <strong>CONTRATANTE</strong>.</p>

<p>e de outro lado:</p>

<p><strong style="color:#1a56db;">CONTRATADA:</strong> <span data-variable="empresa_contratada_nome">{{empresa_contratada_nome}}</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF nº <span data-variable="empresa_contratada_cnpj">{{empresa_contratada_cnpj}}</span>, sediada na <span data-variable="empresa_contratada_endereco">{{empresa_contratada_endereco}}</span>, neste ato representada por <span data-variable="empresa_representante_nome">{{empresa_representante_nome}}</span>, portador(a) do CPF nº <span data-variable="empresa_representante_cpf">{{empresa_representante_cpf}}</span>, doravante denominada simplesmente <strong>CONTRATADA</strong>.</p>

<p>As partes acima identificadas resolvem celebrar o presente <strong>Anexo I – Condições Comerciais</strong>, que passa a integrar o Contrato de Prestação de Serviços Educacionais (Master Agreement), mediante as condições descritas a seguir.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">1. PROGRAMAS CONTRATADOS</h2>
${generateProgramsTable(programs)}
<p>Os participantes poderão ser atualizados ou substituídos pela <strong>CONTRATANTE</strong> durante a vigência do contrato, conforme regras operacionais e pedagógicas estabelecidas pela <strong>CONTRATADA</strong>.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">2. PRAZO DO CONTRATO</h2>
<p>Data de início: <strong><span data-variable="data_inicio">{{data_inicio}}</span></strong></p>
<p>Data de término: <strong><span data-variable="data_fim">{{data_fim}}</span></strong></p>
<p>Prazo total: <strong><span data-variable="prazo_meses">{{prazo_meses}}</span> meses</strong>.</p>
<p>O presente Anexo poderá ser renovado mediante aditivo ou novo Anexo Comercial.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">3. FORMATO DAS AULAS</h2>
<p><strong>3.1</strong> As aulas serão ministradas no formato definido para cada programa contratado (individual, grupo ou formato misto), conforme a tabela acima.</p>
<p><strong>3.2</strong> A carga horária, frequência semanal e duração de cada aula serão definidas no planejamento pedagógico de cada programa.</p>
<p><strong>3.3</strong> A <strong>CONTRATADA</strong> fornecerá todo o material didático necessário para a realização dos programas.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">4. RELATÓRIOS DE ACOMPANHAMENTO</h2>
<p>A <strong>CONTRATADA</strong> disponibilizará relatórios periódicos de acompanhamento do programa educacional, incluindo, entre outros:</p>
<ul>
  <li>Frequência e participação dos alunos;</li>
  <li>Evolução geral dos participantes;</li>
  <li>Insights pedagógicos sobre o desenvolvimento do grupo.</li>
</ul>
<p>O formato e a periodicidade dos relatórios seguirão o padrão adotado pela <strong>CONTRATADA</strong>, sendo emitidos <strong>mensalmente</strong> entre o 5º e o 10º dia do mês subsequente ao período avaliado.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">5. AJUSTE DE PARTICIPANTES</h2>
<p>Em caso de desligamento, substituição ou alteração de colaboradores participantes do programa, a <strong>CONTRATANTE</strong> poderá:</p>
<ul>
  <li>Solicitar a <strong>substituição</strong> de participantes, respeitando o limite de vagas do programa;</li>
  <li>Solicitar a <strong>exclusão</strong> de participantes do programa.</li>
</ul>
<p>A critério da <strong>CONTRATADA</strong>, tais alterações poderão resultar em ajuste operacional das turmas e, quando aplicável, ajuste financeiro proporcional no valor do contrato.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">6. CONDIÇÕES DE PAGAMENTO</h2>
<p>Forma de pagamento: <strong><span data-variable="forma_pagamento">{{forma_pagamento}}</span></strong></p>
<p>Emissão da Nota Fiscal: dia <strong><span data-variable="dia_emissao_nf">{{dia_emissao_nf}}</span></strong> de cada mês</p>
<p>Vencimento: dia <strong><span data-variable="dia_vencimento">{{dia_vencimento}}</span></strong> de cada mês</p>
<p>Valor total do contrato: <strong style="font-size:14pt;color:#1a56db;">R$ <span data-variable="valor_total_contrato">{{valor_total_contrato}}</span></strong></p>

<h3 style="font-size:12pt;font-weight:bold;margin-top:16px;">6.1 Atraso de Pagamento</h3>
<p>Em caso de atraso no pagamento de quaisquer valores previstos neste contrato, incidirá <strong style="color:#dc2626;">multa de 2% (dois por cento)</strong> sobre o valor devido, acrescida de <strong style="color:#dc2626;">juros de 1% (um por cento) ao mês</strong>, calculados <em>pro rata die</em>, até a data da efetiva regularização.</p>
<p>Na hipótese de inadimplência superior a <strong>30 (trinta) dias</strong>, a <strong>CONTRATADA</strong> poderá suspender temporariamente a prestação dos serviços até que a situação financeira seja regularizada.</p>
<p>Persistindo a inadimplência por período superior a <strong>90 (noventa) dias</strong>, a <strong>CONTRATADA</strong> poderá rescindir o contrato unilateralmente, sem prejuízo da cobrança dos valores devidos, acrescidos das penalidades previstas.</p>

<h2 style="font-size:13pt;font-weight:bold;color:#1a56db;margin-top:24px;">7. RESCISÃO</h2>
<p>O presente Anexo poderá ser rescindido total ou parcialmente por qualquer das partes mediante notificação prévia de <strong>30 (trinta) dias</strong>, sem prejuízo das obrigações financeiras já constituídas até a data da efetiva rescisão.</p>

${generateSignatureBlock(v)}
`;
}

// ============================================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ============================================================

export function generateContractHTML(input: ClauseGeneratorInput): string {
  const { templateType, variables, programs } = input;

  let body = '';

  switch (templateType) {
    case 'MASTER_AGREEMENT':
      body = generateMasterAgreement(variables);
      break;
    case 'TERMOS_CONDICOES':
      body = generateTermosCondicoes(variables);
      break;
    case 'ANEXO_COMERCIAL':
      body = generateAnexoComercial(variables, programs);
      break;
    default:
      body = generateMasterAgreement(variables);
  }

  return `
<div class="contract-document" style="font-family:'Times New Roman',Georgia,serif;font-size:12pt;line-height:1.8;color:#1a1a1a;max-width:800px;margin:0 auto;">
  ${body}
</div>`;
}

// Header com logo - usado apenas para geração de PDF/DOCX (no editor o letterhead é fixo)
export { generateLogoHeader };

export function generateBlankContract(): string {
  return `
<div class="contract-document" style="font-family:'Times New Roman',Georgia,serif;font-size:12pt;line-height:1.8;color:#1a1a1a;max-width:800px;margin:0 auto;">
  <h1 style="text-align:center;">Novo Contrato</h1>
  <p>Selecione um template e clique em "Gerar Contrato" para começar.</p>
</div>`;
}
