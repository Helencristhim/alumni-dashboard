'use client';

import { useState, useEffect, useCallback } from 'react';

interface ModuleConfig {
  id: string;
  sourceUrl: string;
  sheetName: string;
  columns: { internal: string; external: string }[];
}

interface UseSheetDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  sourceUrl: string;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'alumni_dashboard_config';

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

function parseValue(value: string): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = value.trim();

  // Tenta converter para número (formato brasileiro)
  if (/^-?[\d.,]+$/.test(strValue)) {
    // Remove pontos de milhar e troca vírgula por ponto
    const normalized = strValue.replace(/\./g, '').replace(',', '.');
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

export function useSheetData<T>(moduleId: string): UseSheetDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Carrega configuração do localStorage
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (!savedConfig) {
        setError('Configuração não encontrada. Vá em Configurações e configure a planilha.');
        setLoading(false);
        return;
      }

      const modules: ModuleConfig[] = JSON.parse(savedConfig);
      const moduleConfig = modules.find(m => m.id === moduleId);

      if (!moduleConfig) {
        setError(`Módulo "${moduleId}" não encontrado na configuração.`);
        setLoading(false);
        return;
      }

      if (!moduleConfig.sourceUrl) {
        setError('URL da planilha não configurada. Vá em Configurações e insira a URL.');
        setLoading(false);
        return;
      }

      setSourceUrl(moduleConfig.sourceUrl);

      // Extrai ID da planilha
      const match = moduleConfig.sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        setError('URL da planilha inválida.');
        setLoading(false);
        return;
      }

      const sheetId = match[1];
      const sheetName = moduleConfig.sheetName || 'Sheet1';
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

      const response = await fetch(exportUrl);

      if (!response.ok) {
        setError('Não foi possível acessar a planilha. Verifique se está pública.');
        setLoading(false);
        return;
      }

      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setError('Planilha vazia ou sem dados.');
        setLoading(false);
        return;
      }

      // Primeira linha são os headers
      const headers = parseCSVLine(lines[0]);

      // Cria mapeamento reverso: nome_planilha -> nome_interno
      const reverseMapping: Record<string, string> = {};
      moduleConfig.columns.forEach(col => {
        if (col.external) {
          reverseMapping[col.external] = col.internal;
        }
      });

      // Parse dos dados
      const parsedData: T[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, unknown> = {};

        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/"/g, '').trim();
          const internalKey = reverseMapping[cleanHeader];

          if (internalKey) {
            row[internalKey] = parseValue(values[index]?.replace(/"/g, '') || '');
          }
          // Também mantém o nome original para flexibilidade
          row[cleanHeader] = parseValue(values[index]?.replace(/"/g, '') || '');
        });

        parsedData.push(row as T);
      }

      setData(parsedData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados');
    }

    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    fetchData();

    // Escuta evento de atualização de configuração
    const handleConfigUpdate = () => {
      fetchData();
    };

    window.addEventListener('configUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    sourceUrl,
    refresh: fetchData
  };
}

// Hook para obter apenas a configuração de um módulo
export function useModuleConfig(moduleId: string) {
  const [config, setConfig] = useState<ModuleConfig | null>(null);

  useEffect(() => {
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
          const modules: ModuleConfig[] = JSON.parse(savedConfig);
          const moduleConfig = modules.find(m => m.id === moduleId);
          setConfig(moduleConfig || null);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };

    loadConfig();

    const handleConfigUpdate = () => loadConfig();
    window.addEventListener('configUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, [moduleId]);

  return config;
}
