import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Controle de faturamento B2B - le a aba "CONTROLE" (livro de recebimentos por empresa)
// da planilha de Vendas B2B. A aba nao e uma tabela plana: cada empresa e um bloco
// (titulo + cabecalho + parcelas). O status (pago/aberto/atrasado) e DERIVADO das datas.
//
// IMPORTANTE: a coluna DATA DE RECEBIMENTO usa CELULAS MESCLADAS (uma data cobrindo
// varias NFs pagas juntas). O CSV nao preserva mesclagem (deixa as linhas de baixo em
// branco), entao lemos o export XLSX, que expoe os intervalos mesclados em "!merges",
// e preenchemos a data para baixo antes de calcular o status. Brancos genuinos (sem
// mesclagem) permanecem "em aberto".

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SHEET_ID = '1ow27Z_n7Kl4qwnBdbdMi44LK_il7kck0uCmjwankEDI';
const CONTROLE_GID = '1271895136';
const CONTROLE_SHEET = 'CONTROLE';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${CONTROLE_GID}`;
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

// Empresas marcadas manualmente como 100% Private (pedido da Helen)
const PRIVATE_KEYWORDS = ['CZARNIKOW', 'RACIONAL'];

type StatusParcela = 'pago' | 'a_vencer' | 'atrasado' | 'aberto';

interface Parcela {
  numero: string;
  nf: string;
  dataEmissao: string | null; // ISO yyyy-mm-dd
  dataEmissaoLabel: string | null; // dd/mm/yyyy
  dataRecebimento: string | null; // ISO yyyy-mm-dd
  dataRecebimentoLabel: string | null; // dd/mm/yyyy
  vencimento: string | null; // ISO yyyy-mm-dd (explicito)
  vencimentoLabel: string | null;
  vencimentoEstimado: boolean;
  valor: number;
  status: StatusParcela;
  diasAtraso: number | null;
  alunos: string;
}

interface Empresa {
  nome: string;
  marca: string | null;
  diaPagamento: number | null;
  ativo: boolean;
  encerrado: boolean;
  privado: boolean;
  observacoes: string[];
  parcelas: Parcela[];
  totalRecebido: number;
  totalEmAberto: number;
  totalAtrasado: number;
  totalContratado: number;
  proximoVencimento: string | null;
  primeiraVenda: string | null;
  primeiraVendaLabel: string | null;
  primeiroValor: number;
  cronograma: Cronograma | null;
  nfAlerta: NfAlerta | null;
  pagamentoAlerta: PagamentoAlerta | null;
}

interface NfAlerta {
  tipo: 'atrasado' | 'hoje' | 'proximo';
  diaEmissao: number;
  vencimentoEmissao: string; // ISO da data limite de emissao no mes corrente
  vencimentoEmissaoLabel: string;
  diasAtraso: number; // >0 dias de atraso; 0 = hoje; <0 = faltam X dias
}

interface PagamentoAlerta {
  qtdParcelas: number;
  valorAtrasado: number;
  diasAtraso: number; // maior atraso entre as parcelas
}

interface VencimentoItem {
  empresa: string;
  marca: string | null;
  nf: string;
  numero: string;
  valor: number;
  vencimento: string;
  vencimentoLabel: string;
  status: 'atrasado' | 'a_vencer' | 'previsto';
  diasAtraso: number;
  estimado: boolean;
}

type TipoCronograma = 'relatorio' | 'pedido_compra' | 'nf' | 'boleto' | 'pagamento';

interface CronogramaItem {
  tipo: TipoCronograma;
  dia: string | null; // "1º", "7", "25" ou null quando "confirmar"
  detalhe?: string;
}

interface InvestimentoMes {
  ano: number;
  mes: string;
  valor: number;
}

interface Cronograma {
  itens: CronogramaItem[];
  observacoes: string[];
  investimento?: InvestimentoMes[];
  investimentoTotais?: { ano: number; valor: number }[];
}

// Cronograma operacional por empresa (fonte: docx "Empresas B2B - NF pagto relatorio").
// Casado por palavra-chave no nome da empresa da aba CONTROLE.
const CRONOGRAMAS: { keywords: string[]; crono: Cronograma }[] = [
  {
    keywords: ['ENKEL'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '26', detalhe: 'Período contemplado: 25 a 25' },
        { tipo: 'nf', dia: '25' },
        { tipo: 'pagamento', dia: '30' },
      ],
      observacoes: [],
    },
  },
  {
    keywords: ['FAAP', 'ARMANDO ALVARES', 'PENTEADO'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '25' },
        { tipo: 'boleto', dia: '25' },
        { tipo: 'pagamento', dia: '10' },
      ],
      observacoes: [],
    },
  },
  {
    keywords: ['HDI', 'YELUM'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '7' },
        { tipo: 'pagamento', dia: '25' },
      ],
      observacoes: ['Separar os relatórios entre HDI e Yelum'],
    },
  },
  {
    keywords: ['ASTA', 'PPE FIOS', 'SÃO MARCO', 'SAO MARCO'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'pedido_compra', dia: null, detalhe: 'Solicitar o Pedido de Compra antes da emissão da NF' },
        { tipo: 'nf', dia: null, detalhe: 'Emitir após o recebimento do Pedido de Compra' },
        { tipo: 'pagamento', dia: '31' },
      ],
      observacoes: [],
    },
  },
  {
    keywords: ['CZARNIKOW'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '1º' },
        { tipo: 'pagamento', dia: '15' },
      ],
      observacoes: [],
    },
  },
  {
    keywords: ['RACIONAL'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '15' },
        { tipo: 'pagamento', dia: '28' },
      ],
      observacoes: [],
      investimento: [
        { ano: 2026, mes: 'Maio', valor: 6640.65 },
        { ano: 2026, mes: 'Junho', valor: 6640.65 },
        { ano: 2026, mes: 'Julho', valor: 13281.3 },
        { ano: 2026, mes: 'Agosto', valor: 16031.3 },
        { ano: 2026, mes: 'Setembro', valor: 13281.3 },
        { ano: 2026, mes: 'Outubro', valor: 13281.3 },
        { ano: 2026, mes: 'Novembro', valor: 16031.3 },
        { ano: 2026, mes: 'Dezembro', valor: 13281.3 },
        { ano: 2027, mes: 'Janeiro', valor: 11328.85 },
        { ano: 2027, mes: 'Fevereiro', valor: 11328.85 },
        { ano: 2027, mes: 'Março', valor: 14078.84 },
        { ano: 2027, mes: 'Abril', valor: 11328.84 },
        { ano: 2027, mes: 'Maio', valor: 9090.34 },
        { ano: 2027, mes: 'Junho', valor: 9090.34 },
        { ano: 2027, mes: 'Julho', valor: 11840.34 },
        { ano: 2027, mes: 'Agosto', valor: 9090.34 },
        { ano: 2027, mes: 'Setembro', valor: 4712.72 },
        { ano: 2027, mes: 'Outubro', valor: 4712.72 },
        { ano: 2027, mes: 'Novembro', valor: 4712.72 },
      ],
      investimentoTotais: [
        { ano: 2026, valor: 98469.1 },
        { ano: 2027, valor: 101314.9 },
      ],
    },
  },
  {
    keywords: ['DELTA DUNCAN', 'DELTA'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '15' },
        { tipo: 'pagamento', dia: '24' },
      ],
      observacoes: [],
    },
  },
  {
    keywords: ['SUCAFINA'],
    crono: {
      itens: [
        { tipo: 'relatorio', dia: '1º' },
        { tipo: 'nf', dia: '1º' },
        { tipo: 'pagamento', dia: '21' },
      ],
      observacoes: [],
    },
  },
];

function acharCronograma(nome: string): Cronograma | null {
  const up = nome.toUpperCase();
  const match = CRONOGRAMAS.find((c) => c.keywords.some((k) => up.includes(k)));
  return match ? match.crono : null;
}

// dia de pagamento da empresa (cronograma ou "PAGAMENTO DIA XX" do titulo)
function diaPagamentoDe(e: Empresa): number | null {
  const pg = e.cronograma?.itens.find((i) => i.tipo === 'pagamento');
  const d = pg && pg.dia ? parseInt(pg.dia, 10) : e.diaPagamento;
  return d && !isNaN(d) ? d : null;
}

// ---------- helpers ----------

function parseValor(raw: string | undefined): number {
  if (!raw) return 0;
  let s = String(raw).replace(/R\$\s*/gi, '').trim();
  if (!s) return 0;
  // brasileiro (1.234,56) vs americano (1,234.56) vs simples (339.2)
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.')
      ? s.replace(/\./g, '').replace(',', '.') // brasileiro
      : s.replace(/,/g, ''); // americano
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

const DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

function parseDate(raw: string): Date | null {
  const m = String(raw).trim().match(DATE_RE);
  if (!m) return null;
  let day = parseInt(m[1], 10);
  let mon = parseInt(m[2], 10);
  // formato americano (m/d/y): se o "mes" > 12 e o "dia" <= 12, estao trocados
  if (mon > 12 && day <= 12) {
    const t = day;
    day = mon;
    mon = t;
  }
  const month = mon - 1;
  let year = parseInt(m[3], 10);
  if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${m}/${d.getFullYear()}`;
}

function diffDays(from: Date, to: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((a - b) / MS);
}

// Busca o XLSX da planilha com retry/backoff. O Google Sheets de vez em quando
// devolve 429/5xx (limite/instabilidade momentanea) — isso e TRANSITORIO e nao
// significa que a planilha ficou privada. Sem retry, uma piscada do Google
// disparava falso alarme "QUEBROU" (a planilha continua publica).
async function fetchPlanilhaComRetry(tentativas = 4): Promise<Response> {
  let res: Response | null = null;
  for (let i = 0; i < tentativas; i++) {
    try {
      res = await fetch(XLSX_URL, { cache: 'no-store' });
      // 429/5xx = transitorio: vale a pena tentar de novo. 4xx (ex: 401/403) nao.
      if (res.ok || (res.status !== 429 && res.status < 500)) return res;
    } catch (e) {
      // erro de rede tambem e transitorio
      if (i === tentativas - 1) throw e;
    }
    if (i < tentativas - 1) {
      const espera = 500 * Math.pow(2, i); // 0.5s, 1s, 2s
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  return res as Response;
}

function parseTitulo(titulo: string): { nome: string; marca: string | null; diaPagamento: number | null } {
  let marca: string | null = null;
  if (/ALUMNI\s+BY\s+BETTER/i.test(titulo)) marca = 'ALUMNI BY BETTER';
  else if (/BETTER/i.test(titulo)) marca = 'BETTER';
  let diaPagamento: number | null = null;
  const diaMatch = titulo.match(/PAGAMENTO\s+DIA\s+(\d{1,2})/i);
  if (diaMatch) diaPagamento = parseInt(diaMatch[1], 10);
  const nome = titulo.split(/\s+-\s+/)[0].trim() || titulo.trim();
  return { nome, marca, diaPagamento };
}

// Le a aba CONTROLE do XLSX, preenche celulas mescladas e devolve matriz de strings
// alinhada por coluna (col A = indice 0). Data via .w (formatado dd/mm/yyyy); valor cru.
function lerMatrizControle(buf: ArrayBuffer): string[][] {
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const ws = wb.Sheets[CONTROLE_SHEET];
  if (!ws) throw new Error(`Aba "${CONTROLE_SHEET}" nao encontrada na planilha`);

  // preenche cada intervalo mesclado com o valor da celula superior-esquerda
  for (const m of ws['!merges'] || []) {
    const topAddr = XLSX.utils.encode_cell({ c: m.s.c, r: m.s.r });
    const top = ws[topAddr];
    if (!top) continue;
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ c, r });
        if (!ws[addr]) ws[addr] = { t: top.t, v: top.v, w: top.w };
      }
    }
  }

  const ref = ws['!ref'];
  if (!ref) return [];
  const rng = XLSX.utils.decode_range(ref);
  // le ate a coluna J (indice 9) para capturar marcadores (ATIVO/ENCERRADO) que
  // se deslocam quando colunas sao inseridas (ex: DATA DE EMISSAO).
  const maxCol = Math.max(9, rng.e.c);
  const rows: string[][] = [];
  for (let r = rng.s.r; r <= rng.e.r; r++) {
    const arr: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ c, r })];
      // sempre o valor formatado (.w): datas viram dd/mm/yyyy e moeda fica legivel
      // (parseValor trata R$ em formato BR e US). Fallback para o valor cru (.v).
      arr.push(!cell ? '' : String(cell.w != null ? cell.w : cell.v != null ? cell.v : ''));
    }
    rows.push(arr);
  }
  return rows;
}

// ---------- parsing ----------

function parseControle(rows: string[][], hoje: Date, horaBrasilia: number): Empresa[] {
  const empresas: Empresa[] = [];
  let current: Empresa | null = null;
  let anonCount = 0;

  const novaEmpresa = (titulo: string): Empresa => {
    const { nome, marca, diaPagamento } = titulo
      ? parseTitulo(titulo)
      : { nome: `Empresa sem título ${++anonCount}`, marca: null, diaPagamento: null };
    const e: Empresa = {
      nome,
      marca,
      diaPagamento,
      ativo: /\bATIVO\b/i.test(titulo),
      encerrado: false,
      privado: PRIVATE_KEYWORDS.some((k) => nome.toUpperCase().includes(k)),
      observacoes: [],
      parcelas: [],
      totalRecebido: 0,
      totalEmAberto: 0,
      totalAtrasado: 0,
      totalContratado: 0,
      proximoVencimento: null,
      primeiraVenda: null,
      primeiraVendaLabel: null,
      primeiroValor: 0,
      cronograma: acharCronograma(nome),
      nfAlerta: null,
      pagamentoAlerta: null,
    };
    empresas.push(e);
    return e;
  };

  // mapa de colunas do bloco atual. Detectado pelo CABECALHO, achando a coluna
  // do "#" em qualquer posicao -> robusto a insercao/remocao de colunas
  // (ex: remover a coluna A vazia desloca tudo para a esquerda).
  let col = { num: 0, nf: 1, emissao: -1, recebimento: 2, valor: 3, alunos: -1 };

  for (const c of rows) {
    const cells = c.map((x) => (x || '').trim());
    if (cells.every((x) => !x)) continue; // linha vazia

    // cabecalho: tem uma celula exatamente "#". Remapeia colunas pelos rotulos.
    const idxHash = cells.findIndex((x) => x === '#');
    if (idxHash >= 0) {
      const novo = { nf: -1, emissao: -1, recebimento: -1, valor: -1, alunos: -1 };
      cells.forEach((v, i) => {
        if (i === idxHash) return;
        const u = v.toUpperCase();
        if (u === 'NF') novo.nf = i;
        else if (/EMISS/.test(u)) novo.emissao = i;
        else if (/RECEB/.test(u)) novo.recebimento = i;
        else if (/VALOR/.test(u)) novo.valor = i;
        else if (/ALUNO/.test(u)) novo.alunos = i;
      });
      col = {
        num: idxHash,
        nf: novo.nf >= 0 ? novo.nf : idxHash + 1,
        emissao: novo.emissao,
        recebimento: novo.recebimento >= 0 ? novo.recebimento : idxHash + 2,
        valor: novo.valor >= 0 ? novo.valor : idxHash + 3,
        alunos: novo.alunos,
      };
      if (!current || current.parcelas.length > 0) current = novaEmpresa('');
      continue;
    }

    const numStr = (cells[col.num] || '').trim();
    const ehNumeroParcela = /^\d+$/.test(numStr);

    // titulo: linha sem numero de parcela; nome = primeira celula com texto
    if (!ehNumeroParcela) {
      const nome = cells.find((x) => x && !/^\d+$/.test(x));
      if (nome) {
        const marcador = cells.find((x) => x && x !== nome && /ATIVO|ENCERRADO/i.test(x)) || '';
        current = novaEmpresa(nome + (marcador ? ` ${marcador}` : ''));
      }
      continue;
    }

    if (!current) current = novaEmpresa('');

    const nfStr = (c[col.nf] || '').trim();
    const emissaoStr = col.emissao >= 0 ? (c[col.emissao] || '').trim() : '';
    const recebStr = (c[col.recebimento] || '').trim();
    const valorStr = (c[col.valor] || '').trim();
    const alunosStr = (c[col.alunos] || '').trim();

    const linhaToda = c.join(' ');
    if (/ENCERRADO/i.test(linhaToda)) current.encerrado = true;
    if (/\bATIVO\b/i.test(linhaToda)) current.ativo = true;

    // observacao: coluna NF com texto (nao numerico) e sem valor
    if (nfStr && !/^\d+$/.test(nfStr) && !valorStr) {
      current.observacoes.push(nfStr);
      continue;
    }

    const valor = parseValor(valorStr);
    if (!valor && !recebStr && !emissaoStr) continue; // linha de template vazia

    // data de emissao da nota (nova coluna)
    let dataEmissao: string | null = null;
    let dataEmissaoLabel: string | null = null;
    const de = parseDate(emissaoStr);
    if (de) {
      dataEmissao = toISO(de);
      dataEmissaoLabel = toLabel(de);
    }

    // status pela data de recebimento
    let status: StatusParcela;
    let dataRecebimento: string | null = null;
    let dataRecebimentoLabel: string | null = null;
    let vencimento: string | null = null;
    let vencimentoLabel: string | null = null;
    const vencimentoEstimado = false;
    let diasAtraso: number | null = null;

    const dataPaga = parseDate(recebStr);
    if (dataPaga) {
      status = 'pago';
      dataRecebimento = toISO(dataPaga);
      dataRecebimentoLabel = toLabel(dataPaga);
    } else if (de) {
      // NF emitida (tem data de emissao) e recebimento vazio = NAO PAGO.
      // Vencimento do pagamento = dia de pagamento cadastrado da empresa, no mes
      // da emissao (ou no mes seguinte se o dia ja passou na emissao). Se a empresa
      // nao tem dia cadastrado, toda nota emitida e nao paga ja conta como atraso.
      const diaPg = diaPagamentoDe(current);
      let due: Date;
      if (diaPg) {
        const d = Math.min(diaPg, 28);
        due = new Date(de.getFullYear(), de.getMonth(), d);
        if (due.getTime() < de.getTime()) due = new Date(de.getFullYear(), de.getMonth() + 1, d);
      } else {
        due = de;
      }
      vencimento = toISO(due);
      vencimentoLabel = toLabel(due);
      diasAtraso = diffDays(hoje, due);
      const limiar = diaPg ? 0 : -1; // com dia: atrasa apos o dia; sem dia: ja na emissao
      status = diasAtraso > limiar ? 'atrasado' : 'a_vencer';
    } else {
      // sem emissao: pode haver uma data explicita no texto ("EM ABERTO - 15/05/2026")
      const m = recebStr.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const venc = m ? parseDate(m[1]) : null;
      if (venc) {
        vencimento = toISO(venc);
        vencimentoLabel = toLabel(venc);
        diasAtraso = diffDays(hoje, venc);
        status = diasAtraso > 0 ? 'atrasado' : 'a_vencer';
      } else {
        status = 'aberto'; // sem emissao e sem data -> ainda nem foi faturado
      }
    }

    current.parcelas.push({
      numero: numStr,
      nf: /^\d+$/.test(nfStr) ? nfStr : '',
      dataEmissao,
      dataEmissaoLabel,
      dataRecebimento,
      dataRecebimentoLabel,
      vencimento,
      vencimentoLabel,
      vencimentoEstimado,
      valor,
      status,
      diasAtraso,
      alunos: alunosStr,
    });
  }

  // totais + proximo vencimento + primeira venda
  for (const e of empresas) {
    let prox: Date | null = null;
    let primeira: Date | null = null;
    let primeiroValor = 0;
    for (const p of e.parcelas) {
      if (p.status === 'pago') e.totalRecebido += p.valor;
      else {
        e.totalEmAberto += p.valor;
        if (p.status === 'atrasado') e.totalAtrasado += p.valor;
      }
      if ((p.status === 'a_vencer' || p.status === 'atrasado') && p.vencimento) {
        const d = new Date(p.vencimento);
        if (!prox || d < prox) prox = d;
      }
      const ref = p.dataRecebimento || p.vencimento;
      if (ref) {
        const d = new Date(ref);
        if (!primeira || d < primeira) {
          primeira = d;
          primeiroValor = p.valor;
        }
      }
    }
    e.totalContratado = e.totalRecebido + e.totalEmAberto;
    e.proximoVencimento = prox ? toISO(prox) : null;
    e.primeiraVenda = primeira ? toISO(primeira) : null;
    e.primeiraVendaLabel = primeira ? toLabel(primeira) : null;
    e.primeiroValor = primeiroValor;

    // alertas: emissao de NF e recebimento (pagamento)
    e.nfAlerta = calcularNfAlerta(e, hoje, horaBrasilia);
    e.pagamentoAlerta = calcularPagamentoAlerta(e);
  }

  // descarta blocos sem nenhuma parcela (titulos/cabecalhos soltos no fim da aba)
  return empresas.filter((e) => e.parcelas.length > 0);
}

// Alerta de emissao da NF (coluna DATA EMISSAO NOTA).
// Regra: no dia de emissao, se ate as 11h (Brasilia) nada foi emitido -> vermelho.
// Antes das 11h do dia -> lembrete amarelo. Ate 7 dias antes -> lembrete amarelo.
// Passou do dia -> vermelho. Considera "emitida" se houver emissao OU recebimento
// no mes (um pagamento recebido prova que a nota foi emitida).
function calcularNfAlerta(e: Empresa, hoje: Date, horaBrasilia: number): NfAlerta | null {
  if (e.encerrado || !e.cronograma) return null;
  const nfItem = e.cronograma.itens.find((i) => i.tipo === 'nf');
  if (!nfItem || !nfItem.dia) return null; // "a confirmar" / "apos PC" nao tem dia fixo
  const dia = parseInt(nfItem.dia, 10);
  if (isNaN(dia)) return null;

  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const emitidaEsteMes = e.parcelas.some(
    (p) =>
      (p.dataEmissao && p.dataEmissao.slice(0, 7) === mesAtual) ||
      (p.dataRecebimento && p.dataRecebimento.slice(0, 7) === mesAtual)
  );
  if (emitidaEsteMes) return null;

  const JANELA_PREVIA = 7;
  const HORA_LIMITE = 11; // 11h horario de Brasilia no dia da emissao
  const limite = new Date(hoje.getFullYear(), hoje.getMonth(), Math.min(dia, 28));
  const diasAtraso = diffDays(hoje, limite); // >0 atraso, 0 hoje, <0 faltam
  if (diasAtraso < -JANELA_PREVIA) return null;

  let tipo: 'atrasado' | 'hoje' | 'proximo';
  if (diasAtraso > 0) tipo = 'atrasado';
  else if (diasAtraso === 0) tipo = horaBrasilia >= HORA_LIMITE ? 'atrasado' : 'hoje';
  else tipo = 'proximo';

  return {
    tipo,
    diaEmissao: dia,
    vencimentoEmissao: toISO(limite),
    vencimentoEmissaoLabel: toLabel(limite),
    diasAtraso,
  };
}

// Alerta de pagamento em atraso: notas emitidas e nao pagas cujo pagamento ja venceu
// (parcelas com status 'atrasado').
function calcularPagamentoAlerta(e: Empresa): PagamentoAlerta | null {
  if (e.encerrado) return null;

  const atrasadas = e.parcelas.filter((p) => p.status === 'atrasado');
  if (atrasadas.length === 0) return null;

  let valorAtrasado = 0;
  let maxDias = 0;
  for (const p of atrasadas) {
    valorAtrasado += p.valor;
    if ((p.diasAtraso ?? 0) > maxDias) maxDias = p.diasAtraso ?? 0;
  }
  return { qtdParcelas: atrasadas.length, valorAtrasado, diasAtraso: maxDias };
}

function montarProximosVencimentos(empresas: Empresa[], hoje: Date): VencimentoItem[] {
  const itens: VencimentoItem[] = [];

  for (const e of empresas) {
    if (e.encerrado) continue;

    // 1) parcelas reais com vencimento explicito
    for (const p of e.parcelas) {
      if ((p.status === 'atrasado' || p.status === 'a_vencer') && p.vencimento) {
        itens.push({
          empresa: e.nome,
          marca: e.marca,
          nf: p.nf,
          numero: p.numero,
          valor: p.valor,
          vencimento: p.vencimento,
          vencimentoLabel: p.vencimentoLabel || '',
          status: p.status === 'atrasado' ? 'atrasado' : 'a_vencer',
          diasAtraso: p.diasAtraso ?? 0,
          estimado: false,
        });
      }
    }

    // 2) previsao recorrente: uma por empresa ativa com "PAGAMENTO DIA XX"
    if (e.ativo && e.diaPagamento) {
      const dia = Math.min(e.diaPagamento, 28);
      let cand = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
      if (diffDays(hoje, cand) > 0) cand = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
      const ultimaComValor = [...e.parcelas].reverse().find((p) => p.valor > 0);
      itens.push({
        empresa: e.nome,
        marca: e.marca,
        nf: '',
        numero: '',
        valor: ultimaComValor ? ultimaComValor.valor : 0,
        vencimento: toISO(cand),
        vencimentoLabel: toLabel(cand),
        status: 'previsto',
        diasAtraso: diffDays(hoje, cand),
        estimado: true,
      });
    }
  }

  itens.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  return itens;
}

export async function GET() {
  try {
    // "hoje" e a hora no horario de Brasilia (UTC-3), independente do fuso do servidor
    const agora = new Date();
    const bras = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
    const hoje = new Date(bras.getUTCFullYear(), bras.getUTCMonth(), bras.getUTCDate());
    const horaBrasilia = bras.getUTCHours();

    const res = await fetchPlanilhaComRetry();
    if (!res.ok) {
      // 429/5xx = Google fora do ar/limite temporario (transitorio), NAO problema
      // de acesso. So 401/403/redirect de login indicam planilha privada.
      const transitorio = res.status === 429 || res.status >= 500;
      const msg = transitorio
        ? `Google Sheets temporariamente indisponivel (HTTP ${res.status}). Erro transitorio do Google; a planilha continua publica. Tente de novo em alguns minutos.`
        : `Nao foi possivel acessar a planilha (HTTP ${res.status}). Verifique se esta publica.`;
      return NextResponse.json(
        { success: false, error: msg, transitorio },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    const rows = lerMatrizControle(buf);
    const empresas = parseControle(rows, hoje, horaBrasilia);
    const proximosVencimentos = montarProximosVencimentos(empresas, hoje);

    const ativas = empresas.filter((e) => !e.encerrado);

    // alertas de NF (atrasadas + a emitir em breve), do mais atrasado ao mais distante
    const alertasNf = empresas
      .filter((e) => e.nfAlerta)
      .map((e) => ({
        empresa: e.nome,
        marca: e.marca,
        tipo: e.nfAlerta!.tipo,
        diaEmissao: e.nfAlerta!.diaEmissao,
        diasAtraso: e.nfAlerta!.diasAtraso,
        vencimentoEmissaoLabel: e.nfAlerta!.vencimentoEmissaoLabel,
      }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso);

    // alertas de pagamento nao recebido
    const alertasPagamento = empresas
      .filter((e) => e.pagamentoAlerta)
      .map((e) => ({
        empresa: e.nome,
        marca: e.marca,
        qtdParcelas: e.pagamentoAlerta!.qtdParcelas,
        valorAtrasado: e.pagamentoAlerta!.valorAtrasado,
        diasAtraso: e.pagamentoAlerta!.diasAtraso,
      }))
      .sort((a, b) => b.valorAtrasado - a.valorAtrasado);

    const resumo = {
      totalRecebido: empresas.reduce((s, e) => s + e.totalRecebido, 0),
      totalEmAberto: empresas.reduce((s, e) => s + e.totalEmAberto, 0),
      totalAtrasado: empresas.reduce((s, e) => s + e.totalAtrasado, 0),
      totalContratado: empresas.reduce((s, e) => s + e.totalContratado, 0),
      qtdEmpresas: empresas.length,
      qtdEmpresasAtivas: ativas.length,
      qtdAtrasadas: empresas.filter((e) => e.totalAtrasado > 0).length,
      qtdNfAtrasada: alertasNf.filter((a) => a.tipo === 'atrasado').length,
      qtdNfProxima: alertasNf.filter((a) => a.tipo !== 'atrasado').length,
      qtdPagamentoAtrasado: alertasPagamento.length,
    };

    return NextResponse.json(
      {
        success: true,
        data: { empresas, proximosVencimentos, resumo, alertasNf, alertasPagamento },
        sourceUrl: SHEET_URL,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao carregar Controle B2B:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
