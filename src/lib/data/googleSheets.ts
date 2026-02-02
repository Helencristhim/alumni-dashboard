// ============================================================
// INTEGRAÇÃO COM GOOGLE SHEETS
// ============================================================

import type { ColumnMapping } from '@/types';

/**
 * Extrai o ID da planilha a partir da URL do Google Sheets
 */
export function extractSheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('URL do Google Sheets inválida');
  }
  return match[1];
}

/**
 * Constrói a URL para exportar dados do Google Sheets como CSV
 * Funciona para planilhas públicas
 */
export function buildExportUrl(sheetId: string, sheetName?: string): string {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  if (sheetName) {
    url += `&sheet=${encodeURIComponent(sheetName)}`;
  }
  return url;
}

/**
 * Carrega dados de uma planilha Google Sheets pública
 */
export async function fetchGoogleSheetData(
  url: string,
  sheetName: string
): Promise<Record<string, unknown>[]> {
  try {
    const sheetId = extractSheetId(url);
    const exportUrl = buildExportUrl(sheetId, sheetName);

    const response = await fetch(exportUrl, {
      next: { revalidate: 900 } // Cache por 15 minutos
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar planilha: ${response.status}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Erro ao carregar Google Sheet:', error);
    throw error;
  }
}

/**
 * Parser de CSV simples
 */
function parseCSV(csvText: string): Record<string, unknown>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Primeira linha são os headers
  const headers = parseCSVLine(lines[0]);

  // Restante são os dados
  const data: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse de uma linha CSV respeitando aspas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Mapeia colunas da planilha para nomes internos do sistema
 */
export function mapColumns<T>(
  rawData: Record<string, unknown>[],
  columnMapping: ColumnMapping
): T[] {
  // Cria mapeamento reverso: nome_planilha -> nome_interno
  const reverseMapping: Record<string, string> = {};
  Object.entries(columnMapping).forEach(([internalName, sheetName]) => {
    reverseMapping[sheetName] = internalName;
  });

  return rawData.map(row => {
    const mappedRow: Record<string, unknown> = {};

    Object.entries(row).forEach(([key, value]) => {
      const internalKey = reverseMapping[key];
      if (internalKey) {
        mappedRow[internalKey] = parseValue(value);
      }
    });

    return mappedRow as T;
  });
}

/**
 * Converte valores para tipos apropriados
 */
function parseValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();

  // Tenta converter valor monetário brasileiro (R$ 5.760,00)
  if (/^R\$\s*[\d.,]+$/.test(strValue)) {
    const numStr = strValue
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')  // Remove separador de milhares
      .replace(',', '.');   // Converte vírgula decimal para ponto
    const numValue = parseFloat(numStr);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }

  // Tenta converter para número simples
  if (/^-?\d+([.,]\d+)?$/.test(strValue)) {
    const numValue = parseFloat(strValue.replace(',', '.'));
    if (!isNaN(numValue)) {
      return numValue;
    }
  }

  // Tenta converter para booleano
  if (strValue.toLowerCase() === 'sim' || strValue.toLowerCase() === 'true') {
    return true;
  }
  if (strValue.toLowerCase() === 'não' || strValue.toLowerCase() === 'nao' || strValue.toLowerCase() === 'false') {
    return false;
  }

  // Mantém data como string no formato original (DD/MM/YYYY)
  // A conversão para Date será feita no frontend para evitar problemas de fuso horário
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
    return strValue; // Retorna a string original
  }

  return strValue;
}
