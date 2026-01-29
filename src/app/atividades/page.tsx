'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  ExternalLink,
  Play,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModuleStatus {
  moduleId: string;
  name: string;
  lastModified: string | null;
  rowCount: number;
  status: 'updated' | 'no_update';
  lastActivityType?: string;
  lastActivityDate?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  moduleId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityStats {
  byType: { type: string; count: number }[];
  byModule: { moduleId: string; count: number }[];
  total: number;
}

interface CronJobInfo {
  lastRun: string;
  status: string;
}

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DATA_UPDATED: { label: 'Dados Atualizados', color: 'text-green-600 bg-green-50' },
  DATA_NO_CHANGE: { label: 'Sem Alteracao', color: 'text-yellow-600 bg-yellow-50' },
  DATA_REFRESH: { label: 'Refresh', color: 'text-blue-600 bg-blue-50' },
  DATA_ERROR: { label: 'Erro', color: 'text-red-600 bg-red-50' },
  USER_LOGIN: { label: 'Login', color: 'text-purple-600 bg-purple-50' },
  USER_LOGOUT: { label: 'Logout', color: 'text-gray-600 bg-gray-50' },
  USER_CREATED: { label: 'Usuario Criado', color: 'text-green-600 bg-green-50' },
  USER_UPDATED: { label: 'Usuario Atualizado', color: 'text-blue-600 bg-blue-50' },
  USER_DELETED: { label: 'Usuario Removido', color: 'text-red-600 bg-red-50' },
  ROLE_CHANGED: { label: 'Role Alterada', color: 'text-orange-600 bg-orange-50' },
  CONFIG_CHANGED: { label: 'Config Alterada', color: 'text-cyan-600 bg-cyan-50' },
};

export default function AtividadesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [modulesStatus, setModulesStatus] = useState<ModuleStatus[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [cronJobs, setCronJobs] = useState<{
    refreshData: CronJobInfo | null;
    dailyCheck: CronJobInfo | null;
  }>({ refreshData: null, dailyCheck: null });

  const [typeFilter, setTypeFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (moduleFilter) params.set('module', moduleFilter);

      const response = await fetch(`/api/activities?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities);
        setModulesStatus(data.modulesStatus);
        setStats(data.stats);
        setCronJobs(data.cronJobs);
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, moduleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/cron/refresh-data', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Erro ao executar refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const modulesWithUpdate = modulesStatus.filter((m) => m.status === 'updated').length;
  const modulesWithoutUpdate = modulesStatus.filter((m) => m.status !== 'updated').length;

  return (
    <DashboardLayout
      title="Controle de Atividades"
      description="Monitore atualizacoes e atividades do sistema"
    >
      {/* Header com acoes */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos os modulos</option>
            {modulesStatus.map((m) => (
              <option key={m.moduleId} value={m.moduleId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Executar Refresh Manual
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{modulesWithUpdate}</p>
              <p className="text-sm text-gray-500">Atualizados Hoje</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{modulesWithoutUpdate}</p>
              <p className="text-sm text-gray-500">Sem Atualizacao</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Atividades (7 dias)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {cronJobs.refreshData
                  ? formatRelativeDate(cronJobs.refreshData.lastRun)
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Ultimo Refresh</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status por Modulo */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Status por Modulo</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : (
                modulesStatus.map((module) => (
                  <div
                    key={module.moduleId}
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          module.status === 'updated'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{module.name}</p>
                        <p className="text-sm text-gray-500">
                          {module.rowCount} registros
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          module.status === 'updated'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {module.status === 'updated'
                          ? 'Atualizado'
                          : 'Sem atualizacao'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(module.lastModified)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cron Jobs */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Tarefas Agendadas</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Refresh de Dados</p>
                  <p className="text-xs text-gray-500">A cada 2 horas</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cronJobs.refreshData?.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cronJobs.refreshData?.status || 'Pendente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Check Diario</p>
                  <p className="text-xs text-gray-500">Diariamente as 20h</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cronJobs.dailyCheck?.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cronJobs.dailyCheck?.status || 'Pendente'}
                </span>
              </div>
            </div>
          </div>

          {/* Tipos de Atividade */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Por Tipo (7 dias)</h3>
            </div>
            <div className="p-4 space-y-2">
              {stats?.byType.map(({ type, count }) => {
                const info = ACTIVITY_TYPE_LABELS[type] || {
                  label: type,
                  color: 'text-gray-600 bg-gray-50',
                };
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Feed de Atividades */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Atividades Recentes</h3>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhuma atividade encontrada
              </div>
            ) : (
              activities.map((activity) => {
                const typeInfo = ACTIVITY_TYPE_LABELS[activity.type] || {
                  label: activity.type,
                  color: 'text-gray-600 bg-gray-50',
                };

                return (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}
                      >
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {activity.moduleId && (
                            <span className="text-xs text-gray-500">
                              {activity.moduleId}
                            </span>
                          )}
                          {activity.user && (
                            <span className="text-xs text-gray-400">
                              por {activity.user.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
