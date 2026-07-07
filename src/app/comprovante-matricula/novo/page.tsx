'use client';

import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractEditor } from '@/components/contracts/ContractEditor';
import {
  ClipboardCheck, Printer, Wand2, Save, Send, Loader2,
  X, User, Building2, FileText, AlertCircle, CheckCircle2,
} from 'lucide-react';

// Conteudo programatico por idioma e curso (fonte: planilha Grammar 1)
const cursosIngles: Record<string, { nivel: string; topicos: string[] }> = {
  'Confidence': {
    nivel: 'A0',
    topicos: [
      'To be', 'Subject pronouns', 'Possessives', 'Questions',
      'Present simple', 'Imperatives', 'Demonstratives', 'There to be',
      'Articles', 'Possessive adjectives', 'Countable / Uncountable'
    ]
  },
  'Essential 1': {
    nivel: 'A1',
    topicos: [
      'To be', 'Demonstratives', 'Possessives', 'Questions',
      'Present simple', 'Object pronouns', 'Prepositions of time',
      'Want, like, would like', 'There to be', 'Articles',
      'How much / how many', 'Prepositions of place', 'Wh- Questions',
      'Articles and quantifiers', 'Modal Verbs', 'Adverbs of time',
      'Subject and Object pronouns', 'Adverbs of place', 'Some / Any',
      'Possessive adjectives'
    ]
  },
  'Essential 2': {
    nivel: 'A1+',
    topicos: [
      'Present simple', 'To be', 'There to be', 'Will', 'Past simple',
      'Wh- Questions', 'Demonstratives', 'Want / Like / Would like',
      'Present Continuous', 'Was/Were born', 'How much / how many',
      'Future forms', 'Idioms', 'Adverbs of Frequency',
      'Present Simple vs. present continuous', 'Countable and uncountable nouns',
      'Present Tenses', 'Want / like / would like / would rather',
      'Imperatives', 'Expressing Likes and Preferences',
      'Verb + noun collocations', 'Verb + adverb collocations',
      'Possessive pronouns', 'Negative questions', 'Present and Past'
    ]
  },
  'Essential 3': {
    nivel: 'A2',
    topicos: [
      'Present Simple', 'Questions', 'There to be', 'Articles',
      'Prepositions of Place', 'Intensifiers', 'Time Expressions',
      'How much / how many', 'Prepositions of Time', 'Adverbs of Frequency',
      'Imperatives', 'Simple past', 'Will', 'Present Continuous',
      'Wh- Questions', 'Modal verbs', 'Demonstratives', 'Going to',
      'Past Simple', 'Too much, too many, enough, not enough, none',
      'To be', 'Some / Any / Much / Many / A lot of',
      'Reflexive pronouns', 'Past continuous'
    ]
  },
  'Essential 4': {
    nivel: 'A2',
    topicos: [
      'Present simple', 'Present continuous', 'Past simple',
      'Like, want, would like', 'Comparatives and superlatives',
      'Future forms', 'Possessives', 'Present perfect', 'Modal verbs',
      'Adverbs of manner', 'Countable and uncountable nouns', 'Going to',
      'Present simple vs. present continuous', 'Past simple vs present perfect',
      'Will', 'Zero Conditional', 'Reported speech', 'Comparative',
      'Superlative', 'Adverbs of frequency'
    ]
  },
  'Rise 1': {
    nivel: 'B1',
    topicos: [
      'Imperatives', 'Present simple', 'Countable/uncountable nouns',
      'Present simple vs. present continuous', 'Past simple', 'Expressing Wish',
      'Adjectives (-ed / -ing)', 'There to be', 'Past continuous',
      'Comparatives', 'Present perfect', 'Review modals/auxiliary verbs',
      'Will', 'Modal verbs', 'Past simple vs. present perfect',
      'First conditional', 'Future forms', 'Second conditional',
      'Wh- questions', 'Present continuous', 'Past tenses',
      'Should, must', 'Past continuous x past simple',
      'Comparatives and superlatives', 'Review past and present forms',
      'First and second conditionals'
    ]
  },
  'Rise 2': {
    nivel: 'B1+',
    topicos: [
      'Modal verbs', 'Countable and uncountable Nouns', 'Have / Have Got',
      'Infinitive of Purpose', 'Articles (the)', 'Verb Patterns',
      'Time Expressions', 'Conjunctions', 'Present Perfect Continuous',
      'Causative forms', 'Have to / Should', 'Narrative Tenses', 'Articles',
      'Used to', 'Future continuous', 'Third conditional', 'Passive',
      'Relative pronouns', 'Discourse markers', 'Review of the Tense System',
      'Adjective + noun collocations', 'Compound nouns',
      'Question Forms, Negatives & Short Answers',
      'Conditionals', 'Adjective + preposition', 'Adverbs',
      'Phrasal verbs (literal & idiomatic)'
    ]
  },
  'Rise 3': {
    nivel: 'B2',
    topicos: [
      'Articles', 'Present Simple', 'Present Continuous', 'Simple Past',
      'Past Continuous', 'First Conditional', 'Modal verbs',
      'Information Questions', 'Present perfect', 'Second Conditional',
      'Reported Speech', 'Tag Questions', 'Future Forms',
      'Present Perfect Continuous', 'Third conditional', 'Present Tenses',
      'Past perfect continuous', 'Past Tenses', 'Used to', 'Inversions',
      'Conditionals', 'Relative clauses', 'All Tenses',
      'Used to vs. Would', 'Future perfect', 'Past perfect',
      'Had better / had better not', 'First and Second Conditionals'
    ]
  },
  'Apex 1': {
    nivel: 'B2+',
    topicos: [
      'Time Expressions', 'Infinitive of Purpose', 'Adjectives (-Ed / -Ing)',
      'Verb Patterns', 'Conjunctions', 'Future perfect & future perfect continuous',
      'First Conditional', 'Narrative Tenses', 'Expressions of Quantity',
      'Modal verbs', 'Relative Clauses', 'Phrasal Verbs', 'Expressing Habit',
      'Gerund forms/phrases', 'Hypothesizing', 'Present subjunctive',
      'Questions', 'Second Conditional - Unreal Situations', 'Inversions',
      'Embedded Clauses', 'Double particle phrasal verbs',
      'Articles & Determiners', 'Tag Questions', 'Third conditional',
      'Future forms', 'Mixed Conditionals', 'Reported Speech', 'Particles'
    ]
  },
  'Apex 2': {
    nivel: 'C1',
    topicos: [
      'Modal verbs', 'Present continuous', 'Comparatives and superlatives',
      'Discourse markers', 'Passive', 'Mixed conditionals', 'Verb patterns',
      'Relative clauses', 'Techniques for avoiding repetition',
      'Synonyms in context', 'Adverb collocation', 'Past tenses',
      'Intensifying adverbs', 'Participles', 'Reported speech',
      'Auxiliars for emphasis', 'Comparative as ... as',
      'Ways of adding emphasis', 'Conditionals', 'Passive forms',
      'Reflexive constructions', 'Review of all conditional forms',
      'Past unreal structure', 'Reduced infinitives', 'Comparative structures',
      'Storytelling techniques', 'Passive voice', 'Second conditional',
      'Used to / Be used to / Get used to', 'Inversions',
      'Future perfect continuous', 'Language for clarity and persuasion',
      'Avoiding repetition', 'Future perfect tenses', 'Tense Review',
      'Advanced adjectives', 'First and second conditionals'
    ]
  },
  'Apex 3': {
    nivel: 'C1+',
    topicos: [
      'Be supposed to x have to x to be to', 'Exploring Hypothesizing',
      'Avoiding Repetition', 'Reduced Infinitives', 'Synonyms in Context',
      'Adverb Collocation', 'Discourse Markers', 'Adding Emphasis',
      'Seem/Appear', 'Intensifying Adverbs', 'Relatives & Participles',
      'Linking Devices Overview', 'Tense Review',
      'Tailoring language for interviews', 'Advanced Hypothesizing',
      'Synonyms for Academic Writing', 'Features of formal discourse',
      'Advanced Emphasis in Rhetoric', 'Review of Intensifying Adverbs',
      'Complex Relatives & Participles', 'Linking Devices in Practice',
      'Consolidated Tense Review', 'Reported Speech',
      'Hypothesizing Future Trends', 'Mastering Paraphrasing Techniques',
      'Causative form', 'Synonyms in Professional Contexts', 'Inversions',
      'Emphasis in Public Speaking',
      'Linking Devices (so... that / such... that / So that)',
      'Creative Hypothesizing',
      'Avoiding Repetition in Professional Communication',
      'Elevating Language with Synonyms', 'Adjective order'
    ]
  },
  'Private Online': {
    nivel: 'Personalizado',
    topicos: []
  },
  'Private Presencial': {
    nivel: 'Personalizado',
    topicos: []
  }
};

const cursosEspanhol: Record<string, { nivel: string; topicos: string[] }> = {
  'Origen': {
    nivel: 'A0',
    topicos: [
      'Alfabeto', 'Números', 'Artículos', 'Pronombres', 'Presente indicativo',
      'Verbos básicos cotidianos', 'Saludos', 'Horas y días', 'Sinónimos',
      'Adjetivos', 'Posesivos', 'Demostrativos', 'Adverbios básicos de lugar',
      'Gustar básico', 'Adverbios de tiempo', 'Expresiones Básicas',
      'Preguntas básicas'
    ]
  },
  'Fundamento': {
    nivel: 'A1',
    topicos: [
      'Presente Indicativo', 'Preposiciones de Tiempo', 'Pronombres Reflexivos',
      'Pronombres Personales', 'Verbo Gustar', 'Pronombres interrogativos',
      'Adverbios de modo', 'Pronombres', 'Adverbios', 'Adverbios de Cantidad',
      'Adjetivos', 'Expresiones de cantidad', 'Preposiciones de ubicación',
      'Adjetivos demostrativos', 'Expresiones pronominales',
      'Adverbios de tiempo', 'Adverbios de frecuencia', 'Fonética y pronunciación',
      'Preposiciones', 'Expresiones', 'Conectores discursivos',
      'Futuro Próximo', 'Perífrasis verbales', 'Paráfrasis', 'Pretérito Simple'
    ]
  },
  'Ascenso': {
    nivel: 'A2',
    topicos: [
      'Presente Indicativo', 'Gerundios', 'Pretérito Simple', 'Adjetivos',
      'Adverbios', 'Interjecciones', 'Superlativos', 'Pretérito Compuesto',
      'Verbos modales', 'Pretérito Imperfecto', 'Pronombres', 'Perífrasis',
      'Conectores discursivos', 'Futuro simple', 'Conjunciones',
      'Cuantificadores', 'Locuciones', 'Preposiciones',
      'Gerundios + Pronombres', 'Condicional simple', 'Imperativo'
    ]
  },
  'Enfoque': {
    nivel: 'B1',
    topicos: [
      'Presente con valor futuro', 'Futuro simple', 'Futuro de probabilidad',
      'Condicional simple', 'Oración condicional (tipo 1)', 'Cohesión literaria',
      'Conectores', 'Presente de subjuntivo', 'Imperativos',
      'Subjuntivo en temporales', 'Subjuntivo (creer/no creer)',
      'Conectores causa y consecuencia', 'Pretéritos', 'Pronombres indefinidos',
      'Relativos', 'Subjuntivo', 'Imperativo indirecto',
      'Conectores de adición', 'Locuciones preposicionales', 'Gerundios',
      'Adverbios duda y probabilidad', 'Pretérito perfecto subjuntivo',
      'Impersonal con "se"', 'Expresión de sentimientos',
      'Conectores de oposición', 'Subjuntivo + Condicional',
      'Discurso Indirecto', 'Verbos de cambio', 'Condicional',
      'Pretérito Pluscuamperfecto', 'Imperativo y Subjuntivo',
      'Comparativos y superlativos', 'Subjuntivo de necesidad',
      'Futuro perfecto', 'Conectores concesivos', 'Doble negación',
      'Imperativo con pronombres', 'Perífrasis de obligación',
      'Construcciones impersonales', 'Verbos con preposiciones',
      'Subjuntivo de opinión', 'Perífrasis con gerundio',
      'Subjuntivo condicional', 'Perífrasis (inminencia)'
    ]
  },
  'Maestría': {
    nivel: 'B2',
    topicos: [
      'Pretérito', 'Futuro', 'Condicional', 'Subjuntivo', 'Conectores',
      'Indicativo / Subjuntivo', 'Subjuntivo / Conectores', 'Pronombres',
      'Subordinación', 'Oraciones Subordinadas / Subjuntivo', 'Imperativos',
      'Voz pasiva', 'Imperativo + pronombres', 'Indicativo + Pronominal',
      'Modales', 'Reporte / Discurso', 'Adjetivos', 'Preposiciones',
      'Adverbios relativos', 'Verbos preposicionales', 'Prefijos', 'Sufijos',
      'Marcadores Discursivos', 'Colocaciones', 'Locuciones', 'Relativos'
    ]
  },
  'Private Online': {
    nivel: 'Personalizado',
    topicos: []
  },
  'Private Presencial': {
    nivel: 'Personalizado',
    topicos: []
  }
};

const cursosPorIdioma: Record<string, Record<string, { nivel: string; topicos: string[] }>> = {
  'Inglês': cursosIngles,
  'Espanhol': cursosEspanhol,
};

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function dataHojeFormatada(): string {
  const hoje = new Date();
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return `Barueri, ${String(hoje.getDate()).padStart(2, '0')} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

function gerarHtmlComprovante(
  nomeAluno: string,
  cpf: string,
  curso: string,
  cargaHoraria: string,
  duracao: string,
  topicos: string[],
  isPrivate: boolean
): string {
  const topicosHtml = topicos.map(t => `- ${t}`).join('<br>');

  const conteudoHtml = isPrivate
    ? `<p><strong>Conteúdo Programático</strong></p>
<p style="text-align: justify;">O conteúdo programático do programa Alumni Private é 100% personalizado e desenvolvido exclusivamente para cada aluno. A partir de uma avaliação diagnóstica inicial, são identificados o nível de proficiência, os objetivos linguísticos e os contextos de uso do idioma, sejam profissionais, acadêmicos ou pessoais.</p>
<p style="text-align: justify;">Com base nesse diagnóstico, é elaborado um plano de estudos individual que contempla as habilidades de compreensão oral e escrita, produção oral e escrita, gramática aplicada, vocabulário contextualizado e pronúncia. O material didático é criado sob medida, com temas e situações reais do cotidiano do aluno, garantindo relevância e aplicabilidade imediata.</p>
<p style="text-align: justify;">O programa é continuamente ajustado conforme a evolução do aluno, assegurando que o ritmo, a abordagem e os conteúdos estejam sempre alinhados às suas necessidades e metas de aprendizagem.</p>`
    : `<p><strong>Conteúdo Programático</strong></p>
<p>${topicosHtml}</p>`;

  const metodologiaHtml = isPrivate
    ? `<p style="font-size: 10pt;">As aulas são individuais, ministradas ao vivo, com conteúdo, ritmo e abordagem adaptados ao perfil e às necessidades específicas de cada aluno.</p>
<p style="font-size: 10pt;">A metodologia prioriza a aplicação prática do idioma em contextos reais do cotidiano do aluno, promovendo autonomia e fluência de forma eficiente e direcionada.</p>`
    : `<p style="font-size: 10pt;">Os cursos oferecidos na modalidade online ao vivo serão realizados com base no material oferecido via ambiente Virtual de Aprendizagem.</p>
<p style="font-size: 10pt;">A metodologia respeita o ritmo do aluno, considerando a duração prevista do curso, seu desempenho e seu compromisso pessoal.</p>`;

  return `
<h2 style="text-align: center; color: #003080; text-transform: uppercase; letter-spacing: 4px; font-size: 20pt;">Declaração de Matrícula</h2>
<p></p>
<p style="text-align: justify;">Declaramos para os fins que se fizerem necessários, que o aluno(a) <strong>${nomeAluno}</strong> portador(a) do CPF: <strong>${cpf}</strong>. Realizou uma matrícula no Centro Binacional Alumni by Better, para o curso de <strong>${curso}</strong> com carga horária de <strong>${cargaHoraria}</strong> horas${duracao ? ` e duração de <strong>${duracao}</strong>` : ''}.</p>
<p></p>
<p style="text-align: justify;">A conclusão do nível requer do aluno, comprovação do conhecimento por meio das atividades objetivas e subjetivas, bem como atividades personalizadas e coerentes com o conteúdo e aproveitamento de no mínimo 70%.</p>
<p></p>
${conteudoHtml}
<p></p>
${metodologiaHtml}
<p></p>
<p></p>
<table style="width: 100%; border: none;">
  <tr>
    <td style="text-align: center; vertical-align: bottom; font-size: 9pt; color: #003080; font-weight: bold; border: none; padding: 0;">
      53.286.868/0001-66<br>
      BETTER EDUCATION LTDA<br>
      Alumni by Better<br>
      Calçada dos Crisântemos, n. 18<br>
      Centro Comercial de Alphaville<br>
      CEP: 06453-008<br>
      Barueri - SP
    </td>
    <td style="text-align: center; vertical-align: bottom; border: none; padding: 0;">
      <p style="font-size: 10pt;">${dataHojeFormatada()}</p>
      <p></p>
      <p>______________________________</p>
      <p><strong>Helen Mendes</strong></p>
      <p style="font-size: 9pt;">Diretora Executiva Alumni by Better</p>
    </td>
  </tr>
</table>
<p></p>
<hr style="border-top: 2px solid #003080;">
<p style="font-size: 8pt;"><strong>BETTER EDUCATION LTDA</strong></p>
<p style="font-size: 8pt;">É uma Empresa de Educação inscrita sob o CNPJ: 53.286.868/0001-66 sua sede localizada em Barueri - SP na Calçada dos Crisântemos, n. 18, Centro Comercial de Alphaville, CEP 06453-008.</p>
  `.trim();
}

// Modal de assinatura
interface SignatureModalProps {
  title: string;
  nomeAluno: string;
  cpfAluno: string;
  onSend: (signatories: { name: string; email: string; cpf?: string; role: string }[]) => Promise<void>;
  onClose: () => void;
}

function SignatureModal({ title, nomeAluno, cpfAluno, onSend, onClose }: SignatureModalProps) {
  const [signatories, setSignatories] = useState([
    { name: nomeAluno, email: '', cpf: '', role: 'contratante' },
    { name: 'Helen Mendes', email: '', cpf: '53.286.868/0001-66', role: 'contratada' },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const updateSignatory = (index: number, updates: Partial<typeof signatories[0]>) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], ...updates };
    setSignatories(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await onSend(signatories.filter((s) => s.name || s.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar para assinatura');
    } finally {
      setSending(false);
    }
  };

  const renderGroup = (
    groupTitle: string,
    icon: React.ReactNode,
    indices: number[]
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {groupTitle}
      </div>
      {indices.map((i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <input
            value={signatories[i].name}
            onChange={(e) => updateSignatory(i, { name: e.target.value })}
            placeholder="Nome completo"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="email"
            value={signatories[i].email}
            onChange={(e) => updateSignatory(i, { email: e.target.value })}
            placeholder="Email"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {signatories[i].role === 'contratada' && (
            <input
              value={signatories[i].cpf || ''}
              onChange={(e) => updateSignatory(i, { cpf: e.target.value })}
              placeholder="CNPJ"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              Enviar para Assinatura
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="flex items-start gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              O comprovante sera enviado via ZapSign. Os signatários receberão <strong>links por e-mail</strong> para
              assinar digitalmente.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {renderGroup('Aluno (Contratante)', <User className="w-4 h-4 text-blue-600" />, [0])}
          {renderGroup('Better Education (Contratada)', <Building2 className="w-4 h-4 text-indigo-600" />, [1])}
        </form>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando ao ZapSign...</>
            ) : (
              <><Send className="w-4 h-4" /> Enviar via ZapSign</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComprovanteMatriculaPage() {
  const [nomeAluno, setNomeAluno] = useState('');
  const [cpf, setCpf] = useState('');
  const [idioma, setIdioma] = useState('');
  const [curso, setCurso] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [duracao, setDuracao] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<'idle' | 'sent' | 'signed'>('idle');
  const printRef = useRef<HTMLDivElement>(null);

  const cursosDisponiveis = idioma ? cursosPorIdioma[idioma] || {} : {};

  const handleIdiomaChange = (novoIdioma: string) => {
    setIdioma(novoIdioma);
    setCurso('');
  };

  const handleGenerate = useCallback(() => {
    const cursosCatalogo = idioma ? cursosPorIdioma[idioma] || {} : {};
    const cursoData = curso ? cursosCatalogo[curso] : null;
    const topicos = cursoData ? cursoData.topicos : [];
    const isPrivate = curso.startsWith('Private');
    const html = gerarHtmlComprovante(nomeAluno, cpf, curso, cargaHoraria, duracao, topicos, isPrivate);
    setHtmlContent(html);
    setGenerated(true);
  }, [nomeAluno, cpf, idioma, curso, cargaHoraria, duracao]);

  const handlePrint = () => {
    const editorEl = printRef.current?.querySelector('.tiptap');
    if (!editorEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Matrícula - ${nomeAluno}</title>
        <style>
          @page { margin: 2cm 2.5cm; size: A4; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .logo-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 3px solid #003080;
          }
          .logo-header img { height: 70px; }
          table { border-collapse: collapse; }
          td { padding: 8px; }
          hr { border: none; border-top: 2px solid #003080; margin: 20px 0; }
          strong { font-weight: bold; }
          h2 { margin-top: 0; }
          body { position: relative; }
          .watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .watermark img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            width: 500px;
            opacity: 0.06;
          }
          .content-wrapper { position: relative; z-index: 1; }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="/logos/alumni-by-better.png" alt="" />
        </div>
        <div class="content-wrapper">
          <div class="logo-header">
            <img src="/logos/alumni-by-better.png" alt="Alumni by Better" />
          </div>
          ${editorEl.innerHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/b2c-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Comprovante de Matrícula - ${nomeAluno || 'Aluno'}`,
          type: 'PRIVATE',
          brand: 'alumni',
          nomeAluno: nomeAluno || null,
          cpfAluno: cpf || null,
          emailAluno: null,
          telefoneAluno: null,
          enderecoAluno: null,
          valorTotal: 0,
          formaPagamento: null,
          tipoCobranca: null,
          parcelas: 1,
          contractData: { idioma, curso, cargaHoraria, duracao, documentType: 'comprovante_matricula' },
          htmlContent,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setSavedId(result.data.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      alert(`Erro ao salvar comprovante: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendSignature = async (signatories: { name: string; email: string; cpf?: string; role: string }[]) => {
    if (!savedId) return;
    const response = await fetch(`/api/b2c-contracts/${savedId}/send-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatories }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Erro ao enviar para assinatura');
    setSignatureStatus('sent');
    setShowSignature(false);
  };

  const isFormValid = nomeAluno && cpf && curso && cargaHoraria;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <DashboardLayout title="Comprovante de Matrícula" description="Geração de comprovantes de matrícula para alunos">
      <div className="flex gap-6">
        {/* Sidebar - Formulario */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Dados do Aluno</h2>
                <p className="text-xs text-gray-500">Preencha para gerar o comprovante</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nome completo</label>
                <input
                  type="text"
                  value={nomeAluno}
                  onChange={(e) => setNomeAluno(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Idioma</label>
                <select
                  value={idioma}
                  onChange={(e) => handleIdiomaChange(e.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Selecione o idioma</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Espanhol">Espanhol</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Curso</label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className={`${inputClass} bg-white`}
                  disabled={!idioma}
                >
                  <option value="">Selecione o curso</option>
                  {Object.entries(cursosDisponiveis).map(([name, data]) => (
                    <option key={name} value={name}>{name} ({data.nivel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Carga horária</label>
                <input
                  type="text"
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(e.target.value)}
                  placeholder="Ex: 60"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Duração</label>
                <input
                  type="text"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  placeholder="Ex: 12 meses"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Botoes */}
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={handleGenerate}
                disabled={!isFormValid}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full ${
                  isFormValid
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Gerar Comprovante
              </button>
              {generated && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Salvando...' : savedId ? 'Salvo' : 'Salvar'}
                  </button>
                  {savedId && (
                    <button
                      onClick={() => setShowSignature(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {signatureStatus === 'sent' ? (
                        <><CheckCircle2 className="w-4 h-4" /> Enviado</>
                      ) : (
                        <><Send className="w-4 h-4" /> Enviar para Assinatura</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editor central */}
        <div className="flex-1 min-w-0 relative" ref={printRef}>
          {generated && (
            <div
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
              style={{ zIndex: 1 }}
            >
              <img
                src="/logos/alumni-by-better.png"
                alt=""
                className="absolute select-none"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-35deg)',
                  width: '500px',
                  opacity: 0.06,
                }}
              />
            </div>
          )}
          {generated ? (
            <ContractEditor
              content={htmlContent}
              onChange={setHtmlContent}
              editable={true}
              brand="alumni"
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">Comprovante de Matrícula</h3>
              <p className="text-sm text-gray-400">
                Preencha os dados do aluno e clique em &quot;Gerar Comprovante&quot; para visualizar e editar o documento.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modal de Assinatura */}
      {showSignature && (
        <SignatureModal
          title={`Comprovante de Matrícula - ${nomeAluno}`}
          nomeAluno={nomeAluno}
          cpfAluno={cpf}
          onSend={handleSendSignature}
          onClose={() => setShowSignature(false)}
        />
      )}
    </DashboardLayout>
  );
}
