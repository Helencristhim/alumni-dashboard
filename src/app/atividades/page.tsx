'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { getDefaultModuleConfigs } from '@/lib/config/defaultModules';

interface ModuleStatus {
  moduleId: string;
  name: string;
  sourceUrl: string;
  sheetName: string;
  currentRowCount: number;
  previousRowCount: number | null;
  lastChecked: string | null;
  lastUpdated: string | null;
  status: 'updated' | 'no_change' | 'decreased' | 'error' | 'not_configured' | 'loading';
  error?: string;
}

interface StoredModuleData {
  rowCount: number;
  lastChecked: string;
  lastUpdated: string | null;
}

const STORAGE_KEY = 'alumni_atividades_tracking';

// Cores por status
const STATUS_CONFIG = {
  updated: {
    label: 'Atualizado',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  no_change: {
    label: 'Sem alteração',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: Minus,
  },
  decreased: {
    label: 'Registros removidos',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: TrendingDown,
  },
  error: {
    label: 'Erro',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
  },
  not_configured: {
    label: 'Não configurado',
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: AlertTriangle,
  },
  loading: {
    label: 'Verificando...',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: RefreshCw,
  },
};

// Função para buscar dados de um módulo
async function fetchModuleData(moduleId: string): Promise<{ rowCount: number } | null> {
  try {
    const response = await fetch(`/api/data/${moduleId.replace(/_/g, '-')}?refresh=true&_t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Diferentes estruturas de resposta
      const data = result.data.data || result.data;
      const rowCount = Array.isArray(data) ? data.length : 0;
      return { rowCount };
    }

    return null;
  } catch (error) {
    console.error(`Erro ao buscar ${moduleId}:`, error);
    return null;
  }
}

// Função para calcular tempo relativo
function getRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Nunca';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return date.toLocaleDateString('pt-BR');
}

// Função para verificar se está desatualizado (mais de 24h sem mudança)
function isStale(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const date = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / 3600000;
  return diffHours > 24;
}

export default function AtividadesPage() {
  const [modulesStatus, setModulesStatus] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<string | null>(null);

  // Carrega dados salvos do localStorage
  const loadStoredData = useCallback((): Record<string, StoredModuleData> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
    return {};
  }, []);

  // Salva dados no localStorage
  const saveStoredData = useCallback((data: Record<string, StoredModuleData>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, []);

  // Verifica todos os módulos
  const checkAllModules = useCallback(async () => {
    const configs = getDefaultModuleConfigs();
    const storedData = loadStoredData();
    const now = new Date().toISOString();
    const newStoredData: Record<string, StoredModuleData> = { ...storedData };

    // Inicializa com status de loading
    const initialStatus: ModuleStatus[] = configs.map(config => ({
      moduleId: config.id,
      name: config.name,
      sourceUrl: config.sourceUrl,
      sheetName: config.sheetName,
      currentRowCount: 0,
      previousRowCount: storedData[config.id]?.rowCount || null,
      lastChecked: storedData[config.id]?.lastChecked || null,
      lastUpdated: storedData[config.id]?.lastUpdated || null,
      status: config.sourceUrl ? 'loading' : 'not_configured',
    }));

    setModulesStatus(initialStatus);

    // Busca dados de cada módulo
    const updatedStatus = await Promise.all(
      configs.map(async (config) => {
        if (!config.sourceUrl) {
          return {
            moduleId: config.id,
            name: config.name,
            sourceUrl: config.sourceUrl,
            sheetName: config.sheetName,
            currentRowCount: 0,
            previousRowCount: null,
            lastChecked: now,
            lastUpdated: null,
            status: 'not_configured' as const,
          };
        }

        const result = await fetchModuleData(config.id);
        const previousData = storedData[config.id];
        const previousRowCount = previousData?.rowCount || null;

        if (!result) {
          return {
            moduleId: config.id,
            name: config.name,
            sourceUrl: config.sourceUrl,
            sheetName: config.sheetName,
            currentRowCount: previousRowCount || 0,
            previousRowCount,
            lastChecked: now,
            lastUpdated: previousData?.lastUpdated || null,
            status: 'error' as const,
            error: 'Não foi possível acessar a planilha',
          };
        }

        // Determina status
        let status: ModuleStatus['status'] = 'no_change';
        let lastUpdated = previousData?.lastUpdated || null;

        if (previousRowCount === null) {
          // Primeira verificação
          status = 'updated';
          lastUpdated = now;
        } else if (result.rowCount > previousRowCount) {
          // Novos registros
          status = 'updated';
          lastUpdated = now;
        } else if (result.rowCount < previousRowCount) {
          // Registros removidos
          status = 'decreased';
          lastUpdated = now;
        }

        // Atualiza dados salvos
        newStoredData[config.id] = {
          rowCount: result.rowCount,
          lastChecked: now,
          lastUpdated: lastUpdated,
        };

        return {
          moduleId: config.id,
          name: config.name,
          sourceUrl: config.sourceUrl,
          sheetName: config.sheetName,
          currentRowCount: result.rowCount,
          previousRowCount,
          lastChecked: now,
          lastUpdated,
          status,
        };
      })
    );

    saveStoredData(newStoredData);
    setModulesStatus(updatedStatus);
    setLastFullCheck(now);
  }, [loadStoredData, saveStoredData]);

  // Carrega dados iniciais
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkAllModules();
      setLoading(false);
    };
    init();
  }, [checkAllModules]);

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAllModules();
    setRefreshing(false);
  };

  // Contadores
  const configured = modulesStatus.filter(m => m.status !== 'not_configured');
  const updated = modulesStatus.filter(m => m.status === 'updated');
  const noChange = modulesStatus.filter(m => m.status === 'no_change');
  const stale = modulesStatus.filter(m => m.status !== 'not_configured' && m.status !== 'error' && isStale(m.lastUpdated));
  const errors = modulesStatus.filter(m => m.status === 'error');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Planilhas</h1>
            <p className="text-gray-500 mt-1">Acompanhe a atualização das fontes de dados</p>
          </div>
          <div className="flex items-center gap-3">
            {lastFullCheck && (
              <span className="text-sm text-gray-500">
                Última verificação: {getRelativeTime(lastFullCheck)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Verificar Agora
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{updated.length}</p>
                <p className="text-sm text-gray-500">Atualizados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Minus className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{noChange.length}</p>
                <p className="text-sm text-gray-500">Sem alteração</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stale.length}</p>
                <p className="text-sm text-gray-500">Desatualizados (+24h)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{errors.length}</p>
                <p className="text-sm text-gray-500">Com erro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de Desatualizados */}
        {stale.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">
                  {stale.length} planilha{stale.length > 1 ? 's' : ''} não {stale.length > 1 ? 'receberam' : 'recebeu'} dados novos nas últimas 24 horas
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {stale.map(m => m.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Módulos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              Status das Planilhas ({configured.length} configuradas)
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-500">Verificando planilhas...</span>
              </div>
            ) : (
              modulesStatus.map((module) => {
                const config = STATUS_CONFIG[module.status];
                const StatusIcon = config.icon;
                const isModuleStale = module.status !== 'not_configured' && module.status !== 'error' && isStale(module.lastUpdated);
                const diff = module.previousRowCount !== null
                  ? module.currentRowCount - module.previousRowCount
                  : null;

                return (
                  <div
                    key={module.moduleId}
                    className={`p-4 hover:bg-gray-50 transition-colors ${isModuleStale ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                          <StatusIcon className={`w-5 h-5 ${config.color} ${module.status === 'loading' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{module.name}</p>
                            {isModuleStale && (
                              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                +24h sem atualização
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {module.sheetName ? `Aba: ${module.sheetName}` : 'Aba não configurada'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Contagem de registros */}
                        {module.status !== 'not_configured' && module.status !== 'error' && (
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {module.currentRowCount}
                              </span>
                              {diff !== null && diff !== 0 && (
                                <span className={`flex items-center text-sm ${diff > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                  {diff > 0 ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 mr-0.5" />
                                      +{diff}
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 mr-0.5" />
                                      {diff}
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">registros</p>
                          </div>
                        )}

                        {/* Última atualização */}
                        <div className="text-right min-w-[100px]">
                          <p className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {module.lastUpdated ? getRelativeTime(module.lastUpdated) : 'Nunca'}
                          </p>
                        </div>

                        {/* Link para planilha */}
                        {module.sourceUrl && (
                          <a
                            href={module.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Abrir planilha"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Erro */}
                    {module.error && (
                      <p className="mt-2 text-sm text-red-600 ml-14">{module.error}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dica */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-teal-800">
              <p className="font-medium">Como funciona o monitoramento:</p>
              <ul className="mt-1 space-y-1 text-teal-700">
                <li>• <strong>Atualizado:</strong> Novos registros foram adicionados desde a última verificação</li>
                <li>• <strong>Sem alteração:</strong> A quantidade de registros permanece a mesma</li>
                <li>• <strong>Desatualizado (+24h):</strong> Nenhum dado novo nas últimas 24 horas</li>
                <li>• O histórico é salvo no navegador para comparação entre verificações</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
