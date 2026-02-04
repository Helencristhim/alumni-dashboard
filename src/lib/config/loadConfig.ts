// ============================================================
// CARREGADOR DE CONFIGURAÇÃO YAML
// ============================================================

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type { DashboardConfig, ModuleConfig } from '@/types';

// Cache da configuração
let configCache: DashboardConfig | null = null;
let configLoadTime: number = 0;
const CONFIG_CACHE_DURATION = 60000; // 1 minuto

/**
 * Carrega a configuração do arquivo YAML
 * Implementa cache para evitar leituras repetidas
 */
export function loadConfig(): DashboardConfig {
  const now = Date.now();

  // Retorna cache se ainda válido
  if (configCache && now - configLoadTime < CONFIG_CACHE_DURATION) {
    return configCache;
  }

  try {
    const configPath = path.join(process.cwd(), 'config', 'data_sources.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    configCache = yaml.load(fileContents) as DashboardConfig;
    configLoadTime = now;

    return configCache;
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    throw new Error('Não foi possível carregar o arquivo de configuração data_sources.yaml');
  }
}

/**
 * Obtém configuração de um módulo específico
 */
export function getModuleConfig(moduleName: keyof Omit<DashboardConfig, 'google_credentials' | 'global_settings'>): ModuleConfig {
  const config = loadConfig();
  const moduleConfig = config[moduleName];

  if (!moduleConfig) {
    throw new Error(`Módulo "${moduleName}" não encontrado na configuração`);
  }

  return moduleConfig as ModuleConfig;
}

/**
 * Obtém a URL da planilha de um módulo
 */
export function getModuleSourceUrl(moduleName: keyof Omit<DashboardConfig, 'google_credentials' | 'global_settings'>): string {
  const moduleConfig = getModuleConfig(moduleName);
  return moduleConfig.source.url || moduleConfig.source.path || '';
}

/**
 * Obtém o mapeamento de colunas de um módulo
 */
export function getColumnMapping(moduleName: keyof Omit<DashboardConfig, 'google_credentials' | 'global_settings'>): Record<string, string> {
  const moduleConfig = getModuleConfig(moduleName);
  return moduleConfig.column_mapping;
}

/**
 * Obtém a cor do módulo
 */
export function getModuleColor(moduleName: string): string {
  const config = loadConfig();
  return config.global_settings.module_colors[moduleName] || '#6B7280';
}

/**
 * Obtém configurações globais
 */
export function getGlobalSettings() {
  const config = loadConfig();
  return config.global_settings;
}

/**
 * Lista todos os módulos habilitados
 */
export function getEnabledModules(): string[] {
  const config = loadConfig();
  const modules = [
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

  return modules.filter(mod => {
    const moduleConfig = config[mod as keyof typeof config];
    return moduleConfig && typeof moduleConfig === 'object' && 'enabled' in moduleConfig && moduleConfig.enabled;
  });
}

/**
 * Invalida o cache da configuração
 * Útil após alterações no arquivo YAML
 */
export function invalidateConfigCache(): void {
  configCache = null;
  configLoadTime = 0;
}

/**
 * Converte nome interno para nome display
 */
export function getModuleDisplayName(moduleName: string): string {
  const displayNames: Record<string, string> = {
    vendas_b2c: 'Vendas B2C',
    vendas_b2b: 'Vendas B2B',
    customer_care: 'Customer Care',
    cancelamentos: 'Cancelamentos',
    cobranca: 'Cobrança',
    alunos_ativos: 'Alunos Ativos',
    acompanhamento: 'Acompanhamento',
    marketing: 'Marketing',
    prospec_b2b: 'Prospec B2B'
  };

  return displayNames[moduleName] || moduleName;
}
