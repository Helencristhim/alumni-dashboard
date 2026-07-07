// Validacao de saude dos dados do Controle B2B.
// Usado pelo monitor (health-check) e pelo envio de alertas, para nunca
// enviar informacao quebrada/desatualizada e avisar a Helen quando algo falha.

export interface SaudeResultado {
  ok: boolean;
  problemas: string[];
  resumo: { empresas: number; parcelas: number; totalContratado: number };
}

// Minimo esperado de empresas. Hoje sao 12; abaixo disso algo quebrou.
const MIN_EMPRESAS = 8;
const MIN_PARCELAS = 40;

// Nomes que indicam parser quebrado (cabecalho lido como empresa).
const NOMES_SUSPEITOS = ['NF', 'VALOR', '#', 'DATA', 'DATA DE RECEBIMENTO', 'DATA EMISSAO NOTA', 'DATA EMISSÃO NOTA', 'ALUNOS', 'ASSINATURA'];

interface DataLike {
  empresas?: Array<{ nome?: string; parcelas?: unknown[] }>;
  resumo?: { totalContratado?: number };
}

export function validarSaudeControle(data: DataLike | null | undefined): SaudeResultado {
  const problemas: string[] = [];
  const empresas = data?.empresas ?? [];
  const totalParcelas = empresas.reduce((s, e) => s + (e.parcelas?.length ?? 0), 0);
  const totalContratado = data?.resumo?.totalContratado ?? 0;

  if (!data || !data.empresas) {
    problemas.push('Resposta da API sem dados de empresas.');
    return { ok: false, problemas, resumo: { empresas: 0, parcelas: 0, totalContratado: 0 } };
  }

  if (empresas.length < MIN_EMPRESAS) {
    problemas.push(`Apenas ${empresas.length} empresa(s) lidas (esperado >= ${MIN_EMPRESAS}). Possivel mudanca na estrutura da planilha.`);
  }

  if (totalParcelas < MIN_PARCELAS) {
    problemas.push(`Apenas ${totalParcelas} parcela(s) lidas (esperado >= ${MIN_PARCELAS}).`);
  }

  if (totalContratado <= 0) {
    problemas.push('Total contratado zerado — valores nao foram lidos corretamente.');
  }

  const suspeitas = empresas
    .map((e) => (e.nome || '').trim())
    .filter((n) => !n || NOMES_SUSPEITOS.includes(n.toUpperCase()));
  if (suspeitas.length) {
    problemas.push(`Empresa(s) com nome invalido/cabecalho: ${suspeitas.map((n) => n || '(vazio)').join(', ')}. Colunas da planilha podem ter sido deslocadas.`);
  }

  return {
    ok: problemas.length === 0,
    problemas,
    resumo: { empresas: empresas.length, parcelas: totalParcelas, totalContratado },
  };
}
