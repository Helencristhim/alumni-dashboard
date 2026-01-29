import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser, hasPermission as checkPermission } from '@/lib/auth/jwt';
import { getAllModulesStatus, getLastTaskRun } from '@/lib/activity/dataTracker';
import { getActivityStats } from '@/lib/activity/logger';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticacao
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Verificar permissao
    const canViewAll = checkPermission(authUser, 'activity:view:all');
    const canViewOwn = checkPermission(authUser, 'activity:view:own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    // Parametros
    const searchParams = request.nextUrl.searchParams;
    const moduleFilter = searchParams.get('module') || '';
    const typeFilter = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '7');

    // Construir filtro para atividades
    const activityWhere: Record<string, unknown> = {};

    if (moduleFilter) {
      activityWhere.moduleId = moduleFilter;
    }

    if (typeFilter) {
      activityWhere.type = typeFilter;
    }

    // Se nao pode ver todas, filtrar por modulos que tem acesso
    if (!canViewAll) {
      // Determinar modulos que o usuario pode ver baseado no role
      const allowedModules: string[] = [];

      if (authUser.role === 'Customer Care') {
        allowedModules.push('customer-care', 'cancelamentos', 'cobranca');
      } else if (authUser.role === 'Marketing') {
        allowedModules.push('marketing');
      }

      if (allowedModules.length > 0) {
        activityWhere.OR = [
          { moduleId: { in: allowedModules } },
          { userId: authUser.userId }, // Sempre pode ver suas proprias atividades
        ];
      } else {
        // Apenas atividades proprias
        activityWhere.userId = authUser.userId;
      }
    }

    // Buscar atividades recentes
    const activities = await prisma.activityLog.findMany({
      where: activityWhere,
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

    // Buscar status dos modulos
    const modulesStatus = await getAllModulesStatus();

    // Filtrar modulos por permissao
    let filteredModulesStatus = modulesStatus;
    if (!canViewAll) {
      const allowedModules: string[] = [];

      if (authUser.role === 'Customer Care') {
        allowedModules.push('customer-care', 'cancelamentos', 'cobranca');
      } else if (authUser.role === 'Marketing') {
        allowedModules.push('marketing');
      }

      if (allowedModules.length > 0) {
        filteredModulesStatus = modulesStatus.filter((m) =>
          allowedModules.includes(m.moduleId)
        );
      }
    }

    // Buscar estatisticas
    const stats = await getActivityStats(days);

    // Buscar ultima execucao dos cron jobs
    const lastRefresh = await getLastTaskRun('refresh-data');
    const lastDailyCheck = await getLastTaskRun('daily-check');

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        moduleId: a.moduleId,
        description: a.description,
        metadata: a.metadata ? (typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata) : null,
        createdAt: a.createdAt,
        user: a.user,
      })),
      modulesStatus: filteredModulesStatus,
      stats,
      cronJobs: {
        refreshData: lastRefresh
          ? {
              lastRun: lastRefresh.startedAt,
              status: lastRefresh.status,
            }
          : null,
        dailyCheck: lastDailyCheck
          ? {
              lastRun: lastDailyCheck.startedAt,
              status: lastDailyCheck.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
