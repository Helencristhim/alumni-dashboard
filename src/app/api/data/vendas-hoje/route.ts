import { NextResponse } from 'next/server';

const SPREADSHEET_ID = '1D4MbnkZfdJyu5w_YrOYtpMZ6MJgHWYt5W9ipALi6fq0';

// Mapeamento de mês para GID (abas com formato de vendas)
const MONTH_GIDS: Record<number, number> = {
  12: 204365572,   // Dezembro 2025
  1: 2023200714,   // Janeiro 2026
  2: 362130747,    // Fevereiro 2026
};

interface VendaHoje {
  qtd: number;
  nf: string;
  nome: string;
  email: string;
  celular: string;
  empresaPf: string;
  data: string;
  pagamento: string;
  produto: string;
  tipo: string;
  horasOfertadas: number;
  duracaoCurso: number;
  modelo: string;
  consultor: string;
  renovNovo: string;
  valor: number;
  status: string;
  obs: string;
}

// Parseia valor no formato BR para número
function parseValorBR(raw: string): number {
  if (!raw || raw === '-') return 0;
  const cleaned = raw
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parseia CSV corretamente (suporta quebra de linha dentro de aspas)
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++; // Skip \n after \r
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else if (char === '\r' && !inQuotes) {
      // Standalone \r
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Last cell/row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Busca dados de uma aba
async function fetchMonthData(gid: number): Promise<VendaHoje[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'follow'
  });

  if (!response.ok) {
    console.error(`Erro ao buscar aba gid=${gid}: ${response.status}`);
    return [];
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  // Encontra o header (linha com "QTD", "Nome", "Data", etc.)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowText = rows[i].join(',').toLowerCase();
    if (rowText.includes('qtd') && rowText.includes('nome') && rowText.includes('data')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    console.error(`Header não encontrado na aba gid=${gid}`);
    return [];
  }

  const header = rows[headerIdx];

  // Encontra índices das colunas
  const findCol = (names: string[]): number => {
    for (let i = 0; i < header.length; i++) {
      const h = header[i].toLowerCase().trim();
      if (names.some(n => h.includes(n))) return i;
    }
    return -1;
  };

  const colIdx = {
    qtd: findCol(['qtd']),
    nf: findCol(['nf']),
    nome: findCol(['nome']),
    email: findCol(['email']),
    celular: findCol(['celular']),
    empresaPf: findCol(['empresa']),
    data: findCol(['data']),
    pagamento: findCol(['pagamento']),
    produto: findCol(['produto']),
    tipo: findCol(['tipo']),
    horasOfertadas: findCol(['horas ofertadas']),
    duracaoCurso: findCol(['dura']),
    modelo: findCol(['modelo']),
    consultor: findCol(['consultor']),
    renovNovo: findCol(['renov']),
    valor: findCol(['valor']),
    status: findCol(['status']),
    obs: findCol(['obs']),
  };

  const vendas: VendaHoje[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];

    // Pula linhas vazias ou sem QTD
    const qtdRaw = colIdx.qtd >= 0 ? row[colIdx.qtd] : '';
    if (!qtdRaw || isNaN(parseInt(qtdRaw))) continue;

    const dataRaw = colIdx.data >= 0 ? row[colIdx.data] : '';
    if (!dataRaw || !dataRaw.includes('/')) continue;

    vendas.push({
      qtd: parseInt(qtdRaw) || 0,
      nf: colIdx.nf >= 0 ? row[colIdx.nf] || '' : '',
      nome: colIdx.nome >= 0 ? row[colIdx.nome] || '' : '',
      email: colIdx.email >= 0 ? row[colIdx.email] || '' : '',
      celular: colIdx.celular >= 0 ? row[colIdx.celular] || '' : '',
      empresaPf: colIdx.empresaPf >= 0 ? row[colIdx.empresaPf] || '' : '',
      data: dataRaw,
      pagamento: colIdx.pagamento >= 0 ? row[colIdx.pagamento] || '' : '',
      produto: colIdx.produto >= 0 ? row[colIdx.produto] || '' : '',
      tipo: colIdx.tipo >= 0 ? row[colIdx.tipo] || '' : '',
      horasOfertadas: colIdx.horasOfertadas >= 0 ? parseInt(row[colIdx.horasOfertadas]) || 0 : 0,
      duracaoCurso: colIdx.duracaoCurso >= 0 ? parseInt(row[colIdx.duracaoCurso]) || 0 : 0,
      modelo: colIdx.modelo >= 0 ? row[colIdx.modelo] || '' : '',
      consultor: colIdx.consultor >= 0 ? row[colIdx.consultor] || '' : '',
      renovNovo: colIdx.renovNovo >= 0 ? row[colIdx.renovNovo] || '' : '',
      valor: colIdx.valor >= 0 ? parseValorBR(row[colIdx.valor] || '') : 0,
      status: colIdx.status >= 0 ? row[colIdx.status] || '' : '',
      obs: colIdx.obs >= 0 ? row[colIdx.obs] || '' : '',
    });
  }

  return vendas;
}

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const today = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }); // DD/MM/YYYY

    // Busca GID do mês atual
    const gid = MONTH_GIDS[currentMonth];

    if (!gid) {
      return NextResponse.json({
        success: true,
        vendasHoje: [],
        vendasMes: [],
        totais: {
          hoje: { quantidade: 0, valor: 0, novos: 0, renovacoes: 0 },
          mes: { quantidade: 0, valor: 0, novos: 0, renovacoes: 0 }
        },
        dataReferencia: today,
        mesReferencia: currentMonth,
        lastUpdated: new Date().toISOString(),
        message: `Aba do mês ${currentMonth} não configurada`
      });
    }

    // Busca dados do mês
    const vendasMes = await fetchMonthData(gid);

    // Filtra vendas de hoje
    const vendasHoje = vendasMes.filter(v => v.data === today);

    // Calcula totais
    const calcTotais = (vendas: VendaHoje[]) => ({
      quantidade: vendas.length,
      valor: vendas.reduce((sum, v) => sum + v.valor, 0),
      novos: vendas.filter(v => v.renovNovo.toLowerCase().includes('novo')).length,
      renovacoes: vendas.filter(v => v.renovNovo.toLowerCase().includes('renov')).length,
    });

    return NextResponse.json(
      {
        success: true,
        vendasHoje,
        vendasMes,
        totais: {
          hoje: calcTotais(vendasHoje),
          mes: calcTotais(vendasMes),
        },
        dataReferencia: today,
        mesReferencia: currentMonth,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar vendas hoje:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de vendas' },
      { status: 500 }
    );
  }
}
