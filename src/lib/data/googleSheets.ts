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
 * Usa o endpoint /export que é mais confiável que gviz/tq
 */
export function buildExportUrl(sheetId: string, sheetName?: string): string {
  // Usa o endpoint export que é mais confiável
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  // Nota: o endpoint export usa gid (número) ao invés do nome da aba
  // Para compatibilidade, se o sheetName for um número, usa como gid
  // Caso contrário, tenta usar gid=0 (primeira aba) como fallback
  if (sheetName) {
    // Se for número, usa como gid
    if (/^\d+$/.test(sheetName)) {
      url += `&gid=${sheetName}`;
    } else {
      // Para nomes de aba, usa gid=0 como fallback (primeira aba)
      // A maioria das planilhas tem os dados na primeira aba
      url += `&gid=0`;
    }
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

    // Desabilita cache para garantir dados frescos
    const response = await fetch(exportUrl, {
      cache: 'no-store'
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
 * Parser de CSV robusto que suporta valores com quebras de linha
 */
function parseCSV(csvText: string): Record<string, unknown>[] {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) return [];

  // Primeira linha são os headers
  const headers = rows[0];

  // Restante são os dados
  const data: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse de CSV completo que suporta valores com quebras de linha dentro de aspas
 */
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
        // Escaped quote
        currentValue += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // End of row (handle both \n and \r\n)
      if (char === '\r') i++; // Skip \n in \r\n
      currentRow.push(currentValue.trim());
      if (currentRow.some(v => v !== '')) { // Skip empty rows
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
    } else if (char === '\r' && !inQuotes) {
      // Handle standalone \r as line ending
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

  // Don't forget the last row
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    if (currentRow.some(v => v !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
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
