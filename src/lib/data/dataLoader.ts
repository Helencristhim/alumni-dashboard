// ============================================================
// DATA LOADER UNIFICADO
// Carrega dados de Google Sheets ou Excel conforme configuração
// ============================================================

import { getModuleConfig, getModuleSourceUrl } from '@/lib/config/loadConfig';
import { fetchGoogleSheetData, mapColumns } from './googleSheets';
import { loadExcelFile, mapExcelColumns } from './excelLoader';
import type {
  ModuleConfig,
  VendaB2C,
  VendaB2B,
  Atendimento,
  Cancelamento,
  Cobranca as CobrancaType,
  AlunoAtivo,
  CampanhaMarketing,
  Acompanhamento,
  ProspecB2B,
  ModuleData
} from '@/types';

// Cache de dados por módulo
// NOTA: Cache desabilitado temporariamente para garantir dados frescos
// Em serverless (Vercel), o cache em memória não é compartilhado entre instâncias
const dataCache: Map<string, { data: unknown[]; timestamp: number }> = new Map();
const CACHE_DURATION = 0; // Cache desabilitado para debug - era 15 * 60 * 1000

type ModuleName = 'vendas_b2c' | 'vendas_b2b' | 'customer_care' | 'cancelamentos' | 'cobranca' | 'alunos_ativos' | 'acompanhamento' | 'marketing' | 'prospec_b2b';

/**
 * Carrega dados de um módulo específico
 * Escolhe automaticamente entre Google Sheets e Excel
 */
export async function loadModuleData<T>(
  moduleName: ModuleName,
  forceRefresh = false
): Promise<ModuleData<T>> {
  const cacheKey = moduleName;
  const now = Date.now();

  // Verifica cache
  if (!forceRefresh) {
    const cached = dataCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      const config = getModuleConfig(moduleName);
      return {
        config,
        data: cached.data as T[],
        lastUpdated: new Date(cached.timestamp),
        sourceUrl: getModuleSourceUrl(moduleName)
      };
    }
  }

  const config = getModuleConfig(moduleName);
  let rawData: Record<string, unknown>[];
  let mappedData: T[];

  try {
    switch (config.source.type) {
      case 'google_sheets':
        if (!config.source.url) {
          throw new Error(`URL do Google Sheets não configurada para ${moduleName}`);
        }
        rawData = await fetchGoogleSheetData(
          config.source.url,
          config.source.sheet_name
        );
        mappedData = mapColumns<T>(rawData, config.column_mapping);
        break;

      case 'excel':
        if (!config.source.path) {
          throw new Error(`Caminho do Excel não configurado para ${moduleName}`);
        }
        rawData = loadExcelFile(
          config.source.path,
          config.source.sheet_name
        );
        mappedData = mapExcelColumns<T>(rawData, config.column_mapping);
        break;

      case 'csv':
        throw new Error('Suporte a CSV ainda não implementado');

      default:
        throw new Error(`Tipo de fonte não suportado: ${config.source.type}`);
    }

    // Atualiza cache
    dataCache.set(cacheKey, { data: mappedData, timestamp: now });

    return {
      config,
      data: mappedData,
      lastUpdated: new Date(now),
      sourceUrl: getModuleSourceUrl(moduleName)
    };
  } catch (error) {
    console.error(`Erro ao carregar dados de ${moduleName}:`, error);
    throw error;
  }
}

// ============================================================
// LOADERS TIPADOS POR MÓDULO
// ============================================================

export async function loadVendasB2C(forceRefresh = false): Promise<ModuleData<VendaB2C>> {
  return loadModuleData<VendaB2C>('vendas_b2c', forceRefresh);
}

export async function loadVendasB2B(forceRefresh = false): Promise<ModuleData<VendaB2B>> {
  return loadModuleData<VendaB2B>('vendas_b2b', forceRefresh);
}

export async function loadCustomerCare(forceRefresh = false): Promise<ModuleData<Atendimento>> {
  return loadModuleData<Atendimento>('customer_care', forceRefresh);
}

export async function loadCancelamentos(forceRefresh = false): Promise<ModuleData<Cancelamento>> {
  return loadModuleData<Cancelamento>('cancelamentos', forceRefresh);
}

export async function loadCobranca(forceRefresh = false): Promise<ModuleData<CobrancaType>> {
  return loadModuleData<CobrancaType>('cobranca', forceRefresh);
}

export async function loadAlunosAtivos(forceRefresh = false): Promise<ModuleData<AlunoAtivo>> {
  return loadModuleData<AlunoAtivo>('alunos_ativos', forceRefresh);
}

export async function loadAcompanhamento(forceRefresh = false): Promise<ModuleData<Acompanhamento>> {
  return loadModuleData<Acompanhamento>('acompanhamento', forceRefresh);
}

export async function loadMarketing(forceRefresh = false): Promise<ModuleData<CampanhaMarketing>> {
  return loadModuleData<CampanhaMarketing>('marketing', forceRefresh);
}

export async function loadProspecB2B(forceRefresh = false): Promise<ModuleData<ProspecB2B>> {
  return loadModuleData<ProspecB2B>('prospec_b2b', forceRefresh);
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Invalida cache de um módulo específico
 */
export function invalidateCache(moduleName?: ModuleName): void {
  if (moduleName) {
    dataCache.delete(moduleName);
  } else {
    dataCache.clear();
  }
}

/**
 * Retorna status do cache
 */
export function getCacheStatus(): Record<string, { cached: boolean; age: number }> {
  const now = Date.now();
  const status: Record<string, { cached: boolean; age: number }> = {};

  const modules: ModuleName[] = [
    'vendas_b2c',
    'vendas_b2b',
    'customer_care',
    'cancelamentos',
    'cobranca',
    'alunos_ativos',
    'acompanhamento',
    'marketing',
    'prospec_b2b'
  ];

  modules.forEach(mod => {
    const cached = dataCache.get(mod);
    status[mod] = {
      cached: !!cached,
      age: cached ? Math.floor((now - cached.timestamp) / 1000) : -1
    };
  });

  return status;
}
