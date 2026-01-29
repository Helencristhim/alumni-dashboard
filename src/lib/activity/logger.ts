import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// Tipos de atividade
export type ActivityType =
  | 'DATA_UPDATED'
  | 'DATA_NO_CHANGE'
  | 'DATA_REFRESH'
  | 'DATA_ERROR'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'CONFIG_CHANGED';

interface LogActivityParams {
  type: ActivityType;
  moduleId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Registra uma atividade no log
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const { type, moduleId, description, metadata, userId } = params;

  try {
    await prisma.activityLog.create({
      data: {
        type,
        moduleId,
        description,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        userId,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Nao propaga erro para nao impactar a operacao principal
  }
}

/**
 * Registra mudanca de dados em um modulo
 */
export async function logDataChange(
  moduleId: string,
  moduleName: string,
  changeType: 'updated' | 'no_change' | 'error',
  details?: {
    previousHash?: string;
    newHash?: string;
    rowCount?: number;
    error?: string;
  }
): Promise<void> {
  const typeMap: Record<string, ActivityType> = {
    updated: 'DATA_UPDATED',
    no_change: 'DATA_NO_CHANGE',
    error: 'DATA_ERROR',
  };

  const descriptionMap: Record<string, string> = {
    updated: `Dados atualizados em ${moduleName}`,
    no_change: `Sem alteracoes em ${moduleName}`,
    error: `Erro ao verificar ${moduleName}`,
  };

  await logActivity({
    type: typeMap[changeType],
    moduleId,
    description: descriptionMap[changeType],
    metadata: details,
  });
}

/**
 * Busca atividades recentes
 */
export async function getRecentActivities(options?: {
  moduleId?: string;
  type?: ActivityType;
  limit?: number;
  userId?: string;
}) {
  const { moduleId, type, limit = 50, userId } = options || {};

  const where: Record<string, unknown> = {};

  if (moduleId) where.moduleId = moduleId;
  if (type) where.type = type;
  if (userId) where.userId = userId;

  const activities = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activities;
}

/**
 * Busca resumo de atividades por modulo
 */
export async function getModuleActivitySummary(moduleId: string) {
  const lastActivity = await prisma.activityLog.findFirst({
    where: { moduleId },
    orderBy: { createdAt: 'desc' },
  });

  const lastUpdate = await prisma.activityLog.findFirst({
    where: {
      moduleId,
      type: 'DATA_UPDATED',
    },
    orderBy: { createdAt: 'desc' },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.activityLog.count({
    where: {
      moduleId,
      createdAt: { gte: todayStart },
    },
  });

  return {
    lastActivity,
    lastUpdate,
    todayCount,
  };
}

/**
 * Busca estatisticas de atividades
 */
export async function getActivityStats(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Contagem por tipo
  const byType = await prisma.activityLog.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  // Contagem por modulo
  const byModule = await prisma.activityLog.groupBy({
    by: ['moduleId'],
    where: {
      createdAt: { gte: startDate },
      moduleId: { not: null },
    },
    _count: true,
  });

  // Total
  const total = await prisma.activityLog.count({
    where: {
      createdAt: { gte: startDate },
    },
  });

  return {
    byType: byType.map((item) => ({
      type: item.type,
      count: item._count,
    })),
    byModule: byModule.map((item) => ({
      moduleId: item.moduleId,
      count: item._count,
    })),
    total,
    period: { startDate, days },
  };
}
