// ============================================================
// INTEGRAÇÃO COM ARQUIVOS EXCEL
// ============================================================

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import type { ColumnMapping } from '@/types';

/**
 * Carrega dados de um arquivo Excel local
 */
export function loadExcelFile(
  filePath: string,
  sheetName: string
): Record<string, unknown>[] {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Arquivo não encontrado: ${absolutePath}`);
    }

    const workbook = XLSX.readFile(absolutePath);

    // Verifica se a aba existe
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Aba "${sheetName}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`);
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
      dateNF: 'dd/mm/yyyy'
    });

    return rawData as Record<string, unknown>[];
  } catch (error) {
    console.error('Erro ao carregar Excel:', error);
    throw error;
  }
}

/**
 * Mapeia colunas do Excel para nomes internos do sistema
 */
export function mapExcelColumns<T>(
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
        mappedRow[internalKey] = parseExcelValue(value);
      }
    });

    return mappedRow as T;
  });
}

/**
 * Converte valores Excel para tipos apropriados
 */
function parseExcelValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // Se já for number ou boolean, retorna como está
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // Se for Date do Excel
  if (value instanceof Date) {
    return value;
  }

  const strValue = String(value).trim();

  // String vazia
  if (strValue === '') {
    return null;
  }

  // Tenta converter para número (formato brasileiro)
  if (/^-?[\d.,]+$/.test(strValue)) {
    // Remove pontos de milhar e troca vírgula por ponto
    const normalized = strValue
      .replace(/\./g, '')
      .replace(',', '.');
    const numValue = parseFloat(normalized);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }

  // Tenta converter para booleano
  const lowerValue = strValue.toLowerCase();
  if (lowerValue === 'sim' || lowerValue === 'true' || lowerValue === 's') {
    return true;
  }
  if (lowerValue === 'não' || lowerValue === 'nao' || lowerValue === 'false' || lowerValue === 'n') {
    return false;
  }

  // Tenta converter para data (formato brasileiro DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
    const [day, month, year] = strValue.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return strValue;
}

/**
 * Valida se todas as colunas mapeadas existem no Excel
 */
export function validateExcelColumns(
  rawData: Record<string, unknown>[],
  columnMapping: ColumnMapping
): { valid: boolean; missingColumns: string[] } {
  if (rawData.length === 0) {
    return { valid: true, missingColumns: [] };
  }

  const firstRow = rawData[0];
  const existingColumns = Object.keys(firstRow);
  const mappedColumns = Object.values(columnMapping);

  const missingColumns = mappedColumns.filter(col => !existingColumns.includes(col));

  return {
    valid: missingColumns.length === 0,
    missingColumns
  };
}

/**
 * Lista abas disponíveis em um arquivo Excel
 */
export function getExcelSheetNames(filePath: string): string[] {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    const workbook = XLSX.readFile(absolutePath, { bookSheets: true });
    return workbook.SheetNames;
  } catch (error) {
    console.error('Erro ao listar abas:', error);
    return [];
  }
}
