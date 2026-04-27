'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileSignature, Printer, Eye, EyeOff } from 'lucide-react';

// Conteudo programatico por curso (extraido do modelo oficial)
const conteudoProgramatico: Record<string, { nivel: string; topicos: string[] }> = {
  'Confidence': {
    nivel: 'A0',
    topicos: [
      'To be', 'Subject pronouns', 'Possessive', 'Wh- Questions',
      'Present simple', 'Demonstratives', 'There to be', 'Imperatives',
      'How much/how many'
    ]
  },
  'Essential 1': {
    nivel: 'A1',
    topicos: [
      'To be', 'Subject pronouns', 'Possessive', 'Wh- Questions',
      'Present simple', 'Object pronouns', 'Demonstratives',
      'There to be (some / any)', 'How much/how many', 'Articles (a / an)',
      'Prepositions (Place)', 'Prepositions (Time)', 'Can / can\'t',
      'Want / like / would like'
    ]
  },
  'Essential 2': {
    nivel: 'A1+',
    topicos: [
      'To be', 'Wh- Questions', 'Present simple', 'Demonstratives',
      'There to be (Past)', 'How much/how many', 'Will', 'Was / were born',
      'Want / like / would like', 'Present Continuous',
      'Present Continuous for future'
    ]
  },
  'Essential 3': {
    nivel: 'A2',
    topicos: [
      'Wh- Questions', 'Present simple', 'There to be (Present / Past)',
      'Imperatives', 'How much/how many', 'Articles (a / an)',
      'Prepositions (Place)', 'Prepositions (Time)', 'Will', 'Was / were born',
      'Past Simple – regular & irregular', 'Can / can\'t', 'Present Continuous',
      'Some / any / much / many / a lot of', 'Adverbs of frequency',
      'Time expressions', 'Going to future', 'Demonstratives', 'Past Continuous'
    ]
  },
  'Essential 4': {
    nivel: 'A2',
    topicos: [
      'Possessive', 'Wh- Questions', 'Present simple', 'Object pronouns',
      'Past Simple – regular & irregular', 'Want / like / would like',
      'Present Continuous', 'Present Continuous for future', 'Could / couldn\'t',
      'Adverbs of manner', 'Time expressions', 'Countable / uncountable',
      'Comparative & superlative adjectives', 'Have / have got',
      'Compounds (something / nothing / etc.)', 'Going to future',
      'Infinitive of purpose', 'Present Perfect (ever / never / yet / just)'
    ]
  },
  'Rise 1': {
    nivel: 'B1',
    topicos: [
      'Subject pronouns', 'Possessive', 'Wh- Questions', 'There to be (Past)',
      'Imperatives', 'Prepositions (Place)', 'Prepositions (Time)',
      'Adverbs of degree', 'Countable / uncountable',
      'Compounds (something / nothing / etc.)', 'Adjectives (-Ed / -Ing)',
      'Present simple and continuous', 'Past simple', 'Past Continuous',
      '(A) Few / (a) little / a lot / lots of', 'Articles (the)',
      'Future forms: going to / will / Present Continuous', 'What ... like?',
      'Comparatives & superlatives / as ... as',
      'Present Perfect (since, for) / indefinite past (ever / never)',
      'First conditional (will / might)', 'Second conditional (if ... would)'
    ]
  },
  'Rise 2': {
    nivel: 'B1+',
    topicos: [
      'Could / couldn\'t', 'Time expressions', 'Countable / uncountable',
      'Have / have got', 'Infinitive of purpose', 'Articles (the)',
      'Verb patterns', 'Modals: have to / should / must', 'Conjunctions',
      'Present Perfect Continuous', 'Review of the tense system',
      'Question forms, Negatives & Short Answers',
      'Past Perfect & Narrative tenses', 'Used to', 'Future possibilities',
      'Conditionals (3rd)', 'Modals of Probability', 'Passive'
    ]
  },
  'Rise 3': {
    nivel: 'B2',
    topicos: [
      'Articles (a / an / The)', 'First conditional (will / might)',
      'Simple & Continuous (Present Tenses – active and passive)',
      'Simple & Continuous (Past Tenses – active and passive)', 'Used to',
      'Modals & related verbs (advice, obligation & permission)',
      'Future forms (will, going to, Present Continuous)',
      'Information questions - tag questions',
      'Present Perfect (Simple & Continuous)',
      'Conditionals (2nd & 3rd)', 'Reported Speech, thoughts & questions'
    ]
  },
  'Apex 1': {
    nivel: 'B2+',
    topicos: [
      'Time expressions', 'Infinitive of purpose', 'Adjectives (-Ed / -Ing)',
      'Verb patterns', 'Conjunctions', 'Future possibilities', 'Conditionals',
      'Narrative tenses', 'Expressions of quantity',
      'Modals & related verbs (present situations)', 'Relative clauses',
      'Particles', 'Expressing habit',
      'Modals & related verbs (past situations)', 'Hypothesizing',
      'Articles & Determiners', 'Question and negatives'
    ]
  },
  'Apex 2': {
    nivel: 'C1',
    topicos: [
      'Comparatives & superlatives / as ... as', 'Mixed Conditionals',
      'Avoiding repetition', 'Reduced infinitives', 'Synonyms in context',
      'Adverb collocation', 'Discourse markers', 'Ways of adding emphasis',
      'Passive constructions', 'Seem / appear',
      'Modals – present, future & past - probability/obligation/permission/ability/habit',
      'Past tenses to express unreal/unlikely situations', 'Verb patterns',
      'Intensifying adverbs', 'Relatives & participles'
    ]
  },
  'Apex 3': {
    nivel: 'C1+',
    topicos: [
      'Reported Speech, thoughts & questions', 'Hypothesizing',
      'Avoiding repetition', 'Reduced infinitives', 'Synonyms in context',
      'Adverb collocation', 'Discourse markers', 'Ways of adding emphasis',
      'Seem / appear', 'Intensifying adverbs', 'Relatives & participles',
      'Linking devices – conjunctions/adverbs/infinitives/relative pronouns/participles',
      'Tense review – simple & continuous', 'Tense review – perfect & non-perfect',
      'Tense review – active & passive'
    ]
  }
};

const cursos = Object.keys(conteudoProgramatico);

function formatarDataInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatarDataExtenso(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return 'xx de xxxx de 202x';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [dia, mes, ano] = parts;
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const mesIndex = parseInt(mes, 10) - 1;
  if (mesIndex < 0 || mesIndex > 11) return dateStr;
  return `${parseInt(dia, 10)} de ${meses[mesIndex]} de ${ano}`;
}

function dataHoje(): string {
  const hoje = new Date();
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

export default function DeclaracoesPage() {
  const [nomeAluno, setNomeAluno] = useState('');
  const [cpf, setCpf] = useState('');
  const [curso, setCurso] = useState('');
  const [modulo, setModulo] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [dataFimContrato, setDataFimContrato] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const cursoSelecionado = curso ? conteudoProgramatico[curso] : null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Declaração de Matrícula - ${nomeAluno}</title>
        <style>
          @page { margin: 2.5cm; size: A4; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
          }
          .body-text {
            text-align: justify;
            text-indent: 2em;
            margin-bottom: 20px;
          }
          .date {
            text-align: right;
            margin-top: 60px;
            margin-bottom: 60px;
          }
          .signature {
            text-align: center;
            margin-top: 40px;
          }
          .signature-line {
            width: 300px;
            border-top: 1px solid #000;
            margin: 0 auto 5px auto;
          }
          .signature-name { font-weight: bold; }
          .signature-title { font-size: 11pt; }
          .page-break { page-break-before: always; }
          .conteudo h2 {
            text-align: center;
            font-size: 14pt;
            margin-bottom: 30px;
          }
          .conteudo h3 {
            font-size: 12pt;
            margin-top: 20px;
            margin-bottom: 5px;
          }
          .conteudo .nivel {
            font-size: 11pt;
            color: #444;
            margin-bottom: 8px;
          }
          .conteudo ul {
            margin: 0 0 15px 20px;
            padding: 0;
          }
          .conteudo li {
            font-size: 11pt;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const isFormValid = nomeAluno && cpf && curso && modulo && cargaHoraria && dataFimContrato;

  return (
    <DashboardLayout title="Declarações" description="Geração de declarações e documentos oficiais">
      <div className="max-w-5xl mx-auto">
        {/* Seletor de tipo de declaracao */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Declaração de Matrícula</h2>
              <p className="text-sm text-gray-500">Preencha os dados do aluno para gerar a declaração</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo do aluno
              </label>
              <input
                type="text"
                value={nomeAluno}
                onChange={(e) => setNomeAluno(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <select
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white"
              >
                <option value="">Selecione o curso</option>
                {cursos.map((c) => (
                  <option key={c} value={c}>
                    {c} ({conteudoProgramatico[c].nivel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Módulo
              </label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                placeholder="Ex: Módulo 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carga horária total
              </label>
              <input
                type="text"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                placeholder="Ex: 60 horas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de fim do contrato
              </label>
              <input
                type="text"
                value={dataFimContrato}
                onChange={(e) => setDataFimContrato(formatarDataInput(e.target.value))}
                placeholder="dd/mm/aaaa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Botoes */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={!isFormValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFormValid
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Ocultar Preview' : 'Visualizar'}
            </button>
            <button
              onClick={handlePrint}
              disabled={!isFormValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFormValid
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && isFormValid && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-4">Preview do documento</div>
            <div
              ref={printRef}
              className="max-w-[700px] mx-auto"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Pagina 1 - Declaracao */}
              <div className="text-center mb-10">
                <h1 className="text-xl font-bold uppercase tracking-widest">Declaração</h1>
              </div>

              <p className="text-justify leading-8" style={{ textIndent: '2em' }}>
                Declaramos, para os devidos fins, que <strong>{nomeAluno}</strong>, inscrito(a) sob o CPF
                nº <strong>{cpf}</strong> encontra-se regularmente matriculado(a) na instituição Alumni –
                Centro Binacional Brasil - Estados Unidos, CNPJ 62.572.789/0001-02, no
                curso <strong>{curso}</strong>, administrado por Better Education – Alumni by Better,
                CNPJ 53.286.868/0001-66, no módulo <strong>{modulo}</strong>, com carga horária total
                de <strong>{cargaHoraria}</strong> a ser concluída até <strong>{formatarDataExtenso(dataFimContrato)}</strong>.
              </p>

              <p className="text-justify leading-8 mt-4" style={{ textIndent: '2em' }}>
                O conteúdo programático do curso encontra-se anexo.
              </p>

              <p className="text-right mt-16">
                São Paulo, {dataHoje()}.
              </p>

              <div className="text-center mt-20">
                <div className="w-72 border-t border-black mx-auto mb-1" />
                <p className="font-bold">Alice Micheleti</p>
                <p className="text-sm">Coordenadora Pedagógica</p>
              </div>

              {/* Pagina 2 - Conteudo Programatico */}
              {cursoSelecionado && (
                <div style={{ pageBreakBefore: 'always' }} className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-center text-lg font-bold mb-8">
                    Conteúdo Programático do Curso
                  </h2>

                  <h3 className="font-bold text-base mt-4">
                    {curso.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{cursoSelecionado.nivel}</p>
                  <ul className="list-disc ml-6 space-y-1">
                    {cursoSelecionado.topicos.map((topico, i) => (
                      <li key={i} className="text-sm leading-relaxed">{topico}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
