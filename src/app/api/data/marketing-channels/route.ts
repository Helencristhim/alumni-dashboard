import { NextResponse } from 'next/server';
import type { ChannelData, ChannelMetric } from '@/types';

const SPREADSHEET_ID = '1CZio2uMRs-Xz1eAshoJxnlB2sDK8tMslw4M2IvgJQbI';

// Canais e métricas desejadas para cada aba
const CHANNEL_CONFIG: { tab: string; label: string; metrics: string[] }[] = [
  {
    tab: 'Meta Ads',
    label: 'Meta Ads',
    metrics: ['Investimento', 'Leads CRM', 'Vendas', 'Receita', 'ROAS'],
  },
  {
    tab: 'Google Ads',
    label: 'Google Ads',
    metrics: ['Investimento', 'Leads CRM', 'Vendas', 'Receita', 'ROAS'],
  },
  {
    tab: 'Emails B2C',
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
    tab: 'Instagram Organico',
    label: 'Instagram Orgânico',
    metrics: [
      'Views Conteúdo',
      'Views % por Anúncio',
      'Novos Leads Gerados no Mês (Data de Criação)',
      'Leads Ganhos no Mês (Data de Ganho)',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
    ],
  },
  {
    tab: 'Tiktok organico',
    label: 'TikTok Orgânico',
    metrics: ['Visualizações por Vídeo', 'Visualizações de Perfil', 'Comentários'],
  },
  {
    tab: 'Site organico',
    label: 'Site Orgânico',
    metrics: [
      'Sessões Total',
      'Sessões Mídia Paga',
      'Sessões Orgânico',
      'Taxa de Engajamento',
      'Total de Usuários',
      'Novos Usuários',
      'Usuários Recorrentes',
      'Usuários Ativos',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
    ],
  },
  {
    tab: 'Parcerias Corporativas',
    label: 'Parcerias Corporativas (B2B2C)',
    metrics: [
      'Novos Leads Gerados no Mês (Data de Criação)',
      'Leads Ganhos no Mês (Data de Ganho)',
      'Receita - Leads Ganhos no Mês (Data de Ganho)',
      'Atualizações',
    ],
  },
];

const MONTH_KEYS = ['outubro', 'novembro', 'dezembro', 'janeiro', 'fevereiro'] as const;
const MONTH_HEADERS = ['Outubro', 'Novembro', 'Dezembro', 'Janeiro', 'Fevereiro'];

// Parseia valor no formato BR para número
function parseBRValue(raw: string): { value: number | null; format: 'currency' | 'number' | 'percent' } {
  if (!raw || raw.trim() === '' || raw.includes('#DIV/0!') || raw.trim() === '-') {
    return { value: null, format: 'number' };
  }

  const trimmed = raw.trim();

  // Currency: R$ 27.473,40
  if (trimmed.startsWith('R$')) {
    const cleaned = trimmed.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return { value: isNaN(num) ? null : num, format: 'currency' };
  }

  // Percent: 1,1%
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

// Parseia CSV simples (sem campos multiline)
function parseSimpleCSV(csvText: string): string[][] {
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
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }

  return rows;
}

// Busca e parseia uma aba
async function fetchTab(tabName: string, desiredMetrics: string[]): Promise<ChannelMetric[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    console.error(`Erro ao buscar aba "${tabName}": ${response.status}`);
    return [];
  }

  const csvText = await response.text();
  const rows = parseSimpleCSV(csvText);

  if (rows.length === 0) return [];

  // Encontrar índices das colunas de meses
  const headerRow = rows[0];
  const totalIdx = headerRow.findIndex(h => h.toLowerCase() === 'total');
  const monthIndices: number[] = MONTH_HEADERS.map(month =>
    headerRow.findIndex(h => h.toLowerCase() === month.toLowerCase())
  );

  // Encontrar a coluna de métrica (geralmente a segunda, índice 1)
  const metricIdx = headerRow.findIndex(h => h.toLowerCase().includes('trica')) || 1;

  const metrics: ChannelMetric[] = [];

  // Para cada métrica desejada, buscar na planilha
  for (const desiredMetric of desiredMetrics) {
    const normalizedDesired = desiredMetric.toLowerCase().trim();

    // Buscar a linha que contém essa métrica
    const dataRow = rows.find(row => {
      const cellValue = (row[metricIdx] || '').toLowerCase().trim();
      return cellValue === normalizedDesired || cellValue.includes(normalizedDesired) || normalizedDesired.includes(cellValue);
    });

    if (!dataRow) {
      // Métrica não encontrada, retornar com nulls
      metrics.push({
        name: desiredMetric,
        total: null,
        monthly: {
          outubro: null,
          novembro: null,
          dezembro: null,
          janeiro: null,
          fevereiro: null,
        },
        format: 'number',
      });
      continue;
    }

    // Parsear valor TOTAL
    const totalRaw = totalIdx >= 0 ? (dataRow[totalIdx] || '') : '';
    const totalParsed = parseBRValue(totalRaw);

    // Parsear valores mensais
    const monthly: Record<string, number | null> = {};
    let detectedFormat = totalParsed.format;

    for (let m = 0; m < MONTH_KEYS.length; m++) {
      const colIdx = monthIndices[m];
      const raw = colIdx >= 0 ? (dataRow[colIdx] || '') : '';
      const parsed = parseBRValue(raw);
      monthly[MONTH_KEYS[m]] = parsed.value;
      if (parsed.value !== null && detectedFormat === 'number') {
        detectedFormat = parsed.format;
      }
    }

    metrics.push({
      name: desiredMetric,
      total: totalParsed.value,
      monthly: {
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
        const metrics = await fetchTab(config.tab, config.metrics);
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
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar dados de marketing:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de marketing' },
      { status: 500 }
    );
  }
}
