import { NextRequest, NextResponse } from 'next/server';
import { extractSheetId } from '@/lib/data/googleSheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1YBBwUQHOlOCNmpSA8hdGLKZYpbq4Pwbo3I3tx8U7dW8/edit';

// Colunas da aba Vendas que precisamos (baseado no layout da planilha)
// G=email, K=data_venda, L=ultima_parcela, M=ultima_parcela, N=produto,
// O=fonte, P=renovacao, S=duracao_curso, U=parcelas, V=valor_total,
// W=valor_produto, X=valor_servico, + A=nome (ou coluna de nome)
interface AlunoVenda {
  nome: string;
  email: string;
  data_venda: string;
  ultima_parcela: string;
  produto: string;
  fonte: string;
  renovacao: string;
  duracao_curso: string;
  parcelas: string;
  valor_total: string;
  valor_produto: string;
  valor_servico: string;
  forma_pagamento: string;
  cancelamento: string;
}

function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      currentRow.push(currentValue.trim());
      if (currentRow.some(v => v !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
    } else if (char === '\r' && !inQuotes) {
      currentRow.push(currentValue.trim());
      if (currentRow.some(v => v !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    if (currentRow.some(v => v !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const sheetId = extractSheetId(SPREADSHEET_URL);
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    const response = await fetch(exportUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Erro ao buscar planilha: ${response.status}`);
    }

    const csvText = await response.text();
    const rows = parseCSVRows(csvText);

    if (rows.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());

    // Encontra índices das colunas pelo nome do header
    const findCol = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.findIndex(h => h === name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colEmail = findCol(['cliente', 'email', 'e-mail', 'e_mail']);
    const colNome = findCol(['nome', 'name']);
    const colDataVenda = findCol(['data_venda', 'data da venda', 'data venda']);
    const colUltimaParcela = findCol(['ultima parcela', 'ultima_parcela', 'última parcela']);
    const colProduto = findCol(['produto', 'course', 'curso']);
    const colFonte = findCol(['fonte', 'vendedor', 'source']);
    const colRenovacao = findCol(['renovacao', 'renovação', 'tipo_matricula']);
    const colDuracao = findCol(['duracao_curso', 'duração', 'duracao', 'duração do curso', 'meses']);
    const colParcelas = findCol(['parcelas', 'qtd_parcelas']);
    const colValorTotal = findCol(['valor_total', 'valor total', 'total']);
    const colValorProduto = findCol(['valor_produto', 'valor produto', 'material']);
    const colValorServico = findCol(['valor_servico', 'valor serviço', 'valor servico', 'serviço', 'servico']);
    const colFormaPagamento = findCol(['forma', 'forma_pagamento', 'forma de pagamento', 'pagamento']);
    const colCancelamento = findCol(['cancelamento', 'cancelado', 'cancelled']);

    if (colEmail === -1) {
      return NextResponse.json(
        { success: false, error: 'Coluna de email não encontrada na planilha', headers },
        { status: 404 }
      );
    }

    // Busca registros pelo email
    const results: AlunoVenda[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = (row[colEmail] || '').trim().toLowerCase();

      if (rowEmail === email) {
        results.push({
          nome: colNome !== -1 ? row[colNome] || '' : '',
          email: row[colEmail] || '',
          data_venda: colDataVenda !== -1 ? row[colDataVenda] || '' : '',
          ultima_parcela: colUltimaParcela !== -1 ? row[colUltimaParcela] || '' : '',
          produto: colProduto !== -1 ? row[colProduto] || '' : '',
          fonte: colFonte !== -1 ? row[colFonte] || '' : '',
          renovacao: colRenovacao !== -1 ? row[colRenovacao] || '' : '',
          duracao_curso: colDuracao !== -1 ? row[colDuracao] || '' : '',
          parcelas: colParcelas !== -1 ? row[colParcelas] || '' : '',
          valor_total: colValorTotal !== -1 ? row[colValorTotal] || '' : '',
          valor_produto: colValorProduto !== -1 ? row[colValorProduto] || '' : '',
          valor_servico: colValorServico !== -1 ? row[colValorServico] || '' : '',
          forma_pagamento: colFormaPagamento !== -1 ? row[colFormaPagamento] || '' : '',
          cancelamento: colCancelamento !== -1 ? row[colCancelamento] || '' : '',
        });
      }
    }

    return NextResponse.json(
      { success: true, data: results, total: results.length },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Erro na busca por email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
