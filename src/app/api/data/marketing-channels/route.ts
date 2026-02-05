import { NextResponse } from 'next/server';
import type { ChannelData, ChannelMetric } from '@/types';

const SPREADSHEET_ID = '1CZio2uMRs-Xz1eAshoJxnlB2sDK8tMslw4M2IvgJQbI';

// GIDs de cada aba (obtidos da planilha)
const CHANNEL_CONFIG: { gid: number; label: string; metrics: string[] }[] = [
  {
    gid: 156922063,
    label: 'Meta Ads',
    metrics: ['Investimento', 'Leads CRM', 'Vendas', 'Receita', 'ROAS'],
  },
  {
    gid: 0,
    label: 'Google Ads',
    metrics: ['Investimento', 'Leads CRM', 'Vendas', 'Receita', 'ROAS'],
  },
  {
    gid: 1067205156,
    label: 'Emails B2C',
    metrics: [
      'Qtd Emails',
      'Qtd Enviados',
      'Qtd Entregues',
      'Qtd Abertos',
      'Qtd Cancelados',
      'Qtd Cliques Únicos',
      'Leads Ganhos no Mês (Data de Ganho)',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
    ],
  },
  {
    gid: 1312565242,
    label: 'Instagram Orgânico',
    metrics: [
      'View Conteúdo',
      'View % por Anúncio',
      'Novos Leads gerados no Mês (Data de Criação)',
      'Leads Ganhos no Mês (Data de Ganho)',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
    ],
  },
  {
    gid: 2054753409,
    label: 'TikTok Orgânico',
    metrics: ['Visualizações de Vídeo', 'Visualizações de Perfil', 'Comentários'],
  },
  {
    gid: 552480204,
    label: 'Site Orgânico',
    metrics: [
      'Sessões TOTAL',
      'Sessões MÍDIA PAGA',
      'Sessões ORGÂNICO',
      'Taxa de Engajamento',
      'Total de Usuários',
      'Novos Usuários',
      'Usuários Recorrentes',
      'Usuários Ativos',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
    ],
  },
  {
    gid: 127881387,
    label: 'Parcerias Corporativas (B2B2C)',
    metrics: [
      'Novos Leads gerados no Mês (Data de Criação)',
      'Leads Ganhos no Mês (Data de Ganho)',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
      'Atualizações',
    ],
  },
];

// Todos os meses possíveis (em ordem)
const ALL_MONTHS = ['setembro', 'outubro', 'novembro', 'dezembro', 'janeiro', 'fevereiro'] as const;
const MONTH_NAMES_MAP: Record<string, typeof ALL_MONTHS[number]> = {
  'setembro': 'setembro',
  'outubro': 'outubro',
  'novembro': 'novembro',
  'dezembro': 'dezembro',
  'janeiro': 'janeiro',
  'fevereiro': 'fevereiro',
};

// Parseia valor no formato BR para número
function parseBRValue(raw: string): { value: number | null; format: 'currency' | 'number' | 'percent' } {
  const trimmed = (raw || '').trim();

  if (!trimmed || trimmed === '-' || trimmed.includes('#DIV/0!') || trimmed.toLowerCase() === 'sem dados') {
    return { value: null, format: 'number' };
  }

  // Currency: R$ 27.473,40
  if (trimmed.startsWith('R$')) {
    const cleaned = trimmed.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return { value: isNaN(num) ? null : num, format: 'currency' };
  }

  // Percent: 1,1% or 76,70%
  if (trimmed.endsWith('%')) {
    const cleaned = trimmed.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return { value: isNaN(num) ? null : num, format: 'percent' };
  }

  // Number: 498.678 or 45 or 6,5
  const cleaned = trimmed.replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return { value: isNaN(num) ? null : num, format: 'number' };
}

// Parseia CSV
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);
    rows.push(cells);
  }

  return rows;
}

// Normaliza string para comparação (remove acentos, lowercase, trim)
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca e parseia uma aba por GID
async function fetchTab(gid: number, desiredMetrics: string[]): Promise<ChannelMetric[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    console.error(`Erro ao buscar aba gid=${gid}: ${response.status}`);
    return desiredMetrics.map(name => ({
      name,
      total: null,
      monthly: { setembro: null, outubro: null, novembro: null, dezembro: null, janeiro: null, fevereiro: null },
      format: 'number',
    }));
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length === 0) return [];

  // Encontrar o header (linha que contém "Métrica" ou "TOTAL" ou "MÉDIA")
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 3); i++) {
    const rowText = rows[i].join(',').toLowerCase();
    if (rowText.includes('trica') || rowText.includes('total') || rowText.includes('dia')) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = rows[headerRowIdx];

  // Encontrar índice da coluna de métrica
  let metricIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (normalize(headerRow[i]).includes('trica')) {
      metricIdx = i;
      break;
    }
  }
  if (metricIdx === -1) metricIdx = 1; // fallback: segunda coluna

  // Encontrar índice de TOTAL ou MÉDIA
  let totalIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const h = normalize(headerRow[i]);
    if (h === 'total' || h === 'media' || h === 'média') {
      totalIdx = i;
      break;
    }
  }

  // Encontrar índices dos meses
  const monthIndices: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const h = normalize(headerRow[i]);
    for (const [monthNorm, monthKey] of Object.entries(MONTH_NAMES_MAP)) {
      if (h === monthNorm) {
        monthIndices[monthKey] = i;
        break;
      }
    }
  }

  // Para cada métrica desejada, buscar na planilha
  const metrics: ChannelMetric[] = [];

  for (const desiredMetric of desiredMetrics) {
    const normalizedDesired = normalize(desiredMetric);

    // Buscar a linha que contém essa métrica
    let dataRow: string[] | undefined;
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const cellValue = normalize(rows[i][metricIdx] || '');
      if (cellValue === normalizedDesired) {
        dataRow = rows[i];
        break;
      }
    }

    // Se não encontrou match exato, tentar match parcial
    if (!dataRow) {
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const cellValue = normalize(rows[i][metricIdx] || '');
        if (cellValue.includes(normalizedDesired) || normalizedDesired.includes(cellValue)) {
          if (cellValue.length > 2) { // evitar matches falsos
            dataRow = rows[i];
            break;
          }
        }
      }
    }

    if (!dataRow) {
      metrics.push({
        name: desiredMetric,
        total: null,
        monthly: { setembro: null, outubro: null, novembro: null, dezembro: null, janeiro: null, fevereiro: null },
        format: 'number',
      });
      continue;
    }

    // Parsear valor TOTAL/MÉDIA
    const totalRaw = totalIdx >= 0 ? (dataRow[totalIdx] || '') : '';
    const totalParsed = parseBRValue(totalRaw);

    // Parsear valores mensais
    const monthly: Record<string, number | null> = {};
    let detectedFormat = totalParsed.format;

    for (const month of ALL_MONTHS) {
      const colIdx = monthIndices[month];
      if (colIdx !== undefined) {
        const raw = dataRow[colIdx] || '';
        const parsed = parseBRValue(raw);
        monthly[month] = parsed.value;
        if (parsed.value !== null && parsed.format !== 'number') {
          detectedFormat = parsed.format;
        }
      } else {
        monthly[month] = null;
      }
    }

    // Se o total não deu formato mas um valor mensal deu, usar esse
    if (totalParsed.format === 'number' && detectedFormat !== 'number') {
      // keep detectedFormat
    } else {
      detectedFormat = totalParsed.format;
    }

    metrics.push({
      name: desiredMetric,
      total: totalParsed.value,
      monthly: {
        setembro: monthly.setembro ?? null,
        outubro: monthly.outubro ?? null,
        novembro: monthly.novembro ?? null,
        dezembro: monthly.dezembro ?? null,
        janeiro: monthly.janeiro ?? null,
        fevereiro: monthly.fevereiro ?? null,
      },
      format: detectedFormat,
    });
  }

  return metrics;
}

export async function GET() {
  try {
    // Buscar todas as abas em paralelo
    const results = await Promise.all(
      CHANNEL_CONFIG.map(async (config) => {
        const metrics = await fetchTab(config.gid, config.metrics);
        return {
          channel: config.label,
          metrics,
        } as ChannelData;
      })
    );

    return NextResponse.json(
      {
        channels: results,
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
    console.error('Erro ao buscar dados de marketing:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados de marketing' }, { status: 500 });
  }
}
